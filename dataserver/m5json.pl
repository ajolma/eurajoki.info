#!/opt/perl/current/bin/perl -w

# This file is part of eurajoki.info
# https://github.com/ajolma/eurajoki.info
# Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2

use utf8;
use strict;
use IO::Handle;
use DateTime;
use Time::Local qw/timelocal timelocal_nocheck/;
use Date::Calc qw/Delta_Days/;
use Carp;
use Encode;
use DBI;
use CGI;
use JSON;

my $debug = 0;

binmode(STDOUT, ":utf8");

my $q = CGI->new;
if ($ENV{REQUEST_METHOD} eq 'OPTIONS') {
    print $q->header(
	-type=>"text/plain", 
	-Access_Control_Allow_Origin=>'*',
	-Access_Control_Allow_Methods=>"GET,POST",
	-Access_Control_Allow_Headers=>"origin,x-requested-with,content-type",
	-Access_Control_Max_Age=>60*60*24
	);
} else {
    print $q->header( -type => 'application/json', 
                      -charset=>'utf-8',
                      -expires=>'+1s',
                      -Access_Control_Allow_Origin=>'*' );
    eval {
        page();
    };
    if ($@) {
        print STDERR "$@\n";
        my $json = JSON->new;
        my($msg) = $@ =~ /(.*)? at /;
        my $error = {
            error => $msg
        };
        print $json->encode($error);
    }
}

sub page {
    my $conf;
    open(my $fh, '<', '/var/www/etc/dispatch') or croak('first configuration error');
    while (<$fh>) {
        chomp;
        my @l = split /\t/;
        $conf = $l[1] if $l[0] and $l[0] eq $0;
    }
    $conf or croak('second configuration error');
    my($connect, $user, $pass) = split /\s+/, $conf;
    my $dbh = DBI->connect($connect, $user, $pass) or croak('database connection problem');
    my $request = $q->param('request') || '';
    if ($request eq 'GetDatasets') {
	get_datasets($dbh);
    } elsif ($request eq 'GetDataset') {
	get_dataset($dbh);
    } elsif ($request eq 'GetVariables') {
	get_variables($dbh);
    } else {
        croak("Unrecognized request: '$request'");
    }
}

sub get_variables {
    my($dbh) = @_;
    my $sql = "select suure,nimi,yksikko,visualisointi,aikamuoto,kuvaus from suureet ".
        "where julkaistu='TRUE' order by nimi";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my $first = 1;
    # to keep the order, use JSON only partially
    print "{";
    while (1) {
	my($suure,$nimi,$yksikko,$v,$t,$k) = $sth->fetchrow_array;
	last unless $suure;
        print "," unless $first;
        $first = 0;
        print "\"$suure\":";
        my $json = JSON->new;
        my $data = {
            suure => $suure,
            nimi => $nimi,
            yksikko => $yksikko,
            visualisointi => $v,
            kuvaus => $k,
#            aika_askel => ($t eq 'date' ? 'daily' : 'timestamp')
        };
        print $json->encode($data);
    }
    print "}";
}

sub get_datasets {
    my($dbh) = @_;
    my @sql;
    my $raw = $q->param('raaka');
    my $sql = "select nimike,nimi,koodi,info,info2,kommentti from mittauskohteet where julkaistu = TRUE";
    push @sql,$sql;
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my %sets;
    my %codes;
    while (my($label,$name,$code,$info,$info2,$kommentti) = $sth->fetchrow_array) {
        $kommentti = '' unless $kommentti;
        $kommentti =~ s/\r//g;
        $kommentti =~ s/\n/\\n/g;
        $sets{$name}{label} = $label;
        $sets{$name}{code} = $code;
        $sets{$name}{info} = $info;
        $sets{$name}{info2} = $info2;
        $sets{$name}{kommentti} = $kommentti || '';
        $codes{$code} = {};
    }
    $sql = "select suure,nimi from suureet where julkaistu='TRUE'";
    push @sql,$sql;
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    my %var2var;
    while (my($var,$name) = $sth->fetchrow_array) {
        $var2var{$var} = $name;
    }
    $sql = "select kohdekoodi,suure,kommentti from kohde_suure_kommentit";
    push @sql,$sql;
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    my %codevar2comm;
    while (my($code,$var,$comm) = $sth->fetchrow_array) {
        $codevar2comm{$code}{$var} = $comm;
    }

    my %variables;
    for my $code (keys %codes) {
        $sql = "select distinct suure from data where paikka='$code' and lippu % 10 = 0 order by suure";
        push @sql,$sql;
        $sth = $dbh->prepare($sql) or croak($dbh->errstr);
        $rv = $sth->execute or croak($dbh->errstr);
        my @vars;
        while (my($var) = $sth->fetchrow_array) {
            next unless $var2var{$var};
            push @vars, $var;
        }
        for my $var (@vars) {
            $sql = "select aika from data where paikka='$code' and lippu % 10 = 0 and suure='$var'".
                " order by aika asc limit 1";
            push @sql,$sql;
            $sth = $dbh->prepare($sql) or croak($dbh->errstr);
            $rv = $sth->execute or croak($dbh->errstr);
            my $time = $sth->fetchrow_array;
            if ($time =~ /^(\d\d\d\d)-(\d\d)-(\d\d)/) {
                my($yr,$mo,$day) = ($1,$2,$3);
                $time = "$yr-$mo-$day";
            } else {
                print STDERR "Can't parse time: $time\n";
                $time = "1900-01-01";
            }
            if (defined $variables{$code}{$var}{begin}) {
                $variables{$code}{$var}{begin} = $time if $time lt $variables{$code}{$var}{begin};
            } else {
                $variables{$code}{$var}{begin} = $time;
            }

            $sql = "select aika from data where paikka='$code' and lippu % 10 = 0 and suure='$var'".
                " order by aika desc limit 1";
            push @sql,$sql;
            $sth = $dbh->prepare($sql) or croak($dbh->errstr);
            $rv = $sth->execute or croak($dbh->errstr);
            $time = $sth->fetchrow_array;
            if ($time =~ /^(\d\d\d\d)-(\d\d)-(\d\d)/) {
                my($yr,$mo,$day) = ($1,$2,$3);
                $time = "$yr-$mo-$day";
            } else {
                print STDERR "Can't parse time: $time\n";
                $time = "1900-01-01";
            }
            if (defined $variables{$code}{$var}{end}) {
                $variables{$code}{$var}{end} = $time if $time gt $variables{$code}{$var}{end};
            } else {
                $variables{$code}{$var}{end} = $time;
            }
            
        }
    }

    my %datasets;
    for (@sql) {$_ = "<sql>$_</sql>"}
    for my $name (sort {$sets{$a}{label} cmp $sets{$b}{label}} keys %sets) {
	my $code = $sets{$name}{code};

        $datasets{$code} = {
            koodi => $code,
            nimi => $name,
            nimike => $sets{$name}{label},
            kuvaus => $sets{$name}{info},
            kuvaus2 => $sets{$name}{info2},
            kommentti => $sets{$name}{kommentti}
        };

        my $info = '';
        my @vars;
        my @begin;
        my @end;
        for my $var (sort {$var2var{$a} cmp $var2var{$b}} keys %{$variables{$code}}) {
            my @t;
            @t = $variables{$code}{$var}{begin} =~ /^(\d+)-(\d+)-(\d+)/;
            @begin = @t if (!@begin or cmp_dates(\@t,\@begin) < 0);
            for (@t) {$_+=0};
            my $t0 = "$t[2].$t[1].$t[0]";
            @t = $variables{$code}{$var}{end} =~ /^(\d+)-(\d+)-(\d+)/;
            @end = @t if (!@end or cmp_dates(\@t,\@end) < 0);
            for (@t) {$_+=0};
            my $t1 = "$t[2].$t[1].$t[0]";
            $info .= "----$var2var{$var}: $t0 .. $t1; ";
            push @vars, $var;
        }
        $datasets{$code}{muuttujat} = \@vars;
        $datasets{$code}{info} = $info;

        my %vars;
        for my $var (sort {$var2var{$a} cmp $var2var{$b}} keys %{$variables{$code}}) {
            $vars{$var} =
            {
                nimi => $var2var{$var},
                kommentti => $codevar2comm{$code}{$var}
            };
            my @t = $variables{$code}{$var}{begin} =~ /^(\d+)-(\d+)-(\d+)/;
            for (@t) {$_+=0};
            $vars{$var}{begin} = "$t[2].$t[1].$t[0]";
            $vars{$var}{alkupvm} = "$t[0]-$t[1]-$t[2]";
            @t = $variables{$code}{$var}{end} =~ /^(\d+)-(\d+)-(\d+)/;
            for (@t) {$_+=0};
            $vars{$var}{end} = "$t[2].$t[1].$t[0]";
            $vars{$var}{loppupvm} = "$t[0]-$t[1]-$t[2]";
        }

        $datasets{$code}{muuttujat2} = \%vars;

        $datasets{$code}{alkupvm} = "$begin[0]-$begin[1]-$begin[2]" if @begin;
        $datasets{$code}{loppupvm} = "$end[0]-$end[1]-$end[2]" if @end;
        
    }
    
    my $json = JSON->new;
    print $json->encode(\%datasets);
}

sub get_dataset {
    my($dbh) = @_;
    my $limit = $q->param('max');
    my $raw = $q->param('raaka');
    my $timefmt = $q->param('timefmt') || '';
    my @suureet = $q->multi_param('suure');
    # hack for fb sharer:
    if (@suureet == 0) {
        for my $p ($q->param) {
            push @suureet, $q->multi_param($p) if ($p =~ /^suure/)
        }
    }
    my @paikat = $q->multi_param('paikka');
    # hack for fb sharer:
    if (@paikat == 0) {
        for my $p ($q->param) {
            push @paikat, $q->multi_param($p) if ($p =~ /^paikka/)
        }
    }
    (@suureet != 0 and @paikat != 0) or croak("Required param 'paikka' or 'suure' missing.");
    my $from = $q->param('from');
    my $to = $q->param('to');
    $from = defined $from ? "and aika>='$from'" : '';
    $to = defined $to ? "and aika<='$to'" : '';

    print STDERR "suureet=@suureet, paikat=@paikat\n" if $debug;

    my $paikka_sql = '';
    for my $p (@paikat) {
        $paikka_sql .= "paikka = '$p' or ";
    }
    $paikka_sql =~ s/ or $//;

    my $suure_sql = '';
    for my $p (@suureet) {
        $suure_sql .= "suure = '$p' or ";
    }
    $suure_sql =~ s/ or $//;

    my %paikka2nimi;
    my $tmp = $paikka_sql;
    $tmp =~ s/paikka =/koodi =/g;
    my $sql = "select koodi,nimike from mittauskohteet where $tmp";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    while (1) {
	my($paikka,$nimi) = $sth->fetchrow_array;
	last unless $paikka;
        $paikka2nimi{$paikka} = $nimi;
    }

    my %suureet;
    $sql = "select suure,nimi,visualisointi from suureet where $suure_sql";
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    while (1) {
	my($suure,$nimi,$visualisointi) = $sth->fetchrow_array;
	last unless $suure;
        $suureet{$suure}{nimi} = $nimi;
        $suureet{$suure}{visualisointi} = $visualisointi;
    }

    $sql = "select paikka,suure,aika,arvo,lippu from data where ".
	"($paikka_sql) and ($suure_sql) $from $to and lippu % 10 = 0";
    print STDERR $sql,"\n" if $debug;
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    my %data_tmp;
    while (1) {
        my ($paikka,$suure,$aika,$arvo,$lippu) = $sth->fetchrow_array;
        last unless $paikka;
        $arvo = 'null' unless defined $arvo;
        my ($day, $time) = split / /, $aika;
	$data_tmp{$paikka}{$suure}{$day}{$lippu}{$time} = $arvo;
    }

    my %data;
    my %ajat;
    for my $paikka (keys %data_tmp) {
        for my $suure (keys %{$data_tmp{$paikka}}) {
            for my $day (keys %{$data_tmp{$paikka}{$suure}}) {
                my $lippu;

                # daily data overrides non-daily data from the same date
                #if (exists $data_tmp{$paikka}{$suure}{$day}{10}) {
                #    $lippu = 10;
                #} else {
                #    $lippu = 0;
                #}

                # non-daily data overrides daily data from the same date
                if (exists $data_tmp{$paikka}{$suure}{$day}{0}) {
                    $lippu = 0;
                } else {
                    $lippu = 10;
                }

                my($year,$mon,$mday) = $day =~ /^(\d\d\d\d)-(\d\d)-(\d\d)/;
                for my $time (keys %{$data_tmp{$paikka}{$suure}{$day}{$lippu}}) {
                    my($hour,$min,$sec) = $time =~ /^(\d\d):(\d\d):(\d\d)/;
                    # for JavaScript we need the time as milliseconds since 1970/01/01 UTC (the epoch)
                    # our time is implicitly in Europe/Helsinki TZ
                    my $dt = DateTime->new(
                        year => $year,
                        month => $mon,
                        day => $mday,
                        hour => $hour,
                        minute => $min,
                        second => $sec,
                        time_zone => 'Europe/Helsinki'
                        );
                    my $time2 = $dt->epoch; # in seconds
                    $ajat{$time2} = $dt;
                    $data{$paikka}{$suure}{$time2} = $data_tmp{$paikka}{$suure}{$day}{$lippu}{$time};
                }
            }
        }
    }
    my @ajat = sort keys %ajat;
    print STDERR "$ajat{$ajat[0]} .. $ajat{$ajat[$#ajat]}\n" if $debug;
    
    print "[\n";
    
    my $yaxis = 1;
    my $first = 1;
    
    # jos vain yksi suure, niin sen raja-arvot
    if (@suureet == 1) {
        $sql = "select \"raja-arvo\",selite from \"raja-arvot\" where suure='$suureet[0]'";
        $sth = $dbh->prepare($sql) or croak($dbh->errstr);
        $rv = $sth->execute or croak($dbh->errstr);
        while (1) {
            my($arvo,$selite) = $sth->fetchrow_array;
            last unless $selite;
            $first = 0;
            my %ra = ( label => $selite, yaxis => $yaxis );
            my $time0 = $ajat[0]*1000;
            my $time1 = $ajat[$#ajat]*1000;
            $ra{data} = [[$time0, $arvo], [$time1, $arvo]];
            my $json = JSON->new;
            print $json->encode(\%ra);
        }
    }

    for my $suure (@suureet) {
        my $inc_axis = 0;
        for my $paikka (@paikat) {
            next unless exists $data{$paikka}{$suure};
            print ",\n" unless $first;
            $first = 0;
            $inc_axis = 1;
            print "{\"label\": \"$paikka2nimi{$paikka}, $suureet{$suure}{nimi}\",\n";
            print "\"yaxis\": $yaxis,\n";
            print "\"data\": [\n";
            my $first2 = 1;
            for my $aika (@ajat) {
                my $arvo = $data{$paikka}{$suure}{$aika};
                next unless defined $arvo;
                print ",\n" unless $first2;
                $first2 = 0;
                if ($arvo eq 'null') {
                    print 'null';
                } elsif ($timefmt eq 'fi') { # 'D.M.Y H:M:S') {
                    my $dt = $ajat{$aika};
                    my $year = $dt->year;
                    my $mon = $dt->month;
                    my $day = $dt->day;
                    my $hour = $dt->hour;
                    my $min = $dt->minute;
                    my $sec = $dt->second;
                    for ($mon, $day, $hour, $min, $sec) {
                        $_ = '0'.$_ if $_ < 10;
                    }
                    $aika = '"'."$year.$mon.$day $hour:$min:$sec".'"';
                    print "[",$aika,",$arvo]";
                } else {
                    print "[",$aika*1000,",$arvo]";
                }
            }
            print "],\"$suureet{$suure}{visualisointi}\": { \"show\": true }";
            print "}\n";
        }
        $yaxis++ if $inc_axis;
    }
    print "]\n";
}

sub cmp_dates {
    my($a,$b) = @_;
    for my $i (0..$#$a) {
        return -1 if $a->[$i] < $b->[$i];
        return 1 if $a->[$i] > $b->[$i];
    }
    return 0;
}
