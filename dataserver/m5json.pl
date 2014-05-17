#!/usr/bin/perl -w

use utf8;
use strict;
use IO::Handle;
use Time::Local 'timelocal';
use Carp;
use Encode;
use DBI;
use CGI;
use JSON;

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
    page();
}

sub page {
    my $db = `grep local-eurajoki-ltd /var/www/etc/dbi`;
    chomp $db;
    my(undef, $connect, $user, $pass) = split /\s+/, $db;
    my $dbh = DBI->connect($connect, $user, $pass) or croak('no db');
    if ($q->param('request') eq 'GetDatasets') {
	get_datasets($dbh);
    } elsif ($q->param('request') eq 'GetDataset') {
	get_dataset($dbh);
    } elsif ($q->param('request') eq 'GetVariables') {
	get_variables($dbh);
    } else {
        print('{"error": "No request"}',"\n");
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
    my $sql = "select nimike,nimi,koodi,kommentti from mittauskohteet";
    push @sql,$sql;
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my %sets;
    my %codes;
    while (my($label,$name,$code,$kommentti) = $sth->fetchrow_array) {
        $sets{$name}{label} = $label;
        $sets{$name}{code} = $code;
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
        for my $type ('Jatkuva mittaus',encode(utf8=>'Päivittäiset arvot')) {
            my $table;
            if ($type eq 'Jatkuva mittaus') {
                if ($raw) {
                    $table = 'data';
                } else {
                    $table = 'data_tarkistettu';
                }
            } else {
                if ($raw) {
                    $table = 'data_daily';
                } else {
                    $table = 'data_daily_tarkistettu';
                }
            }
            $sql = "select distinct suure from $table where paikka='$code' order by suure";
            push @sql,$sql;
            $sth = $dbh->prepare($sql) or croak($dbh->errstr);
            $rv = $sth->execute or croak($dbh->errstr);
            my @vars;
            while (my($var) = $sth->fetchrow_array) {
                next unless $var2var{$var};
                push @vars, $var;
            }
            for my $var (@vars) {
                $sql = "select aika from $table where paikka='$code' and suure='$var'".
                    " order by aika asc limit 1";
                push @sql,$sql;
                $sth = $dbh->prepare($sql) or croak($dbh->errstr);
                $rv = $sth->execute or croak($dbh->errstr);
                ($codes{$code}{$type}{$var}{begin}) = $sth->fetchrow_array;
                $variables{$code}{$var}{begin} = $codes{$code}{$type}{$var}{begin};
                $sql = "select aika from $table where paikka='$code' and suure='$var'".
                    " order by aika desc limit 1";
                push @sql,$sql;
                $sth = $dbh->prepare($sql) or croak($dbh->errstr);
                $rv = $sth->execute or croak($dbh->errstr);
                ($codes{$code}{$type}{$var}{end}) = $sth->fetchrow_array;
                $variables{$code}{$var}{end} = $codes{$code}{$type}{$var}{end};
            }
        }
    }

    print "{\n";
    for (@sql) {$_ = "<sql>$_</sql>"}
    #print "\"sql\": \"",@sql,"\",\n";
    my $first = 1;        
    for my $name (sort {$sets{$a}{label} cmp $sets{$b}{label}} keys %sets) {
        print "," unless $first;
        $first = 0;
	my $code = $sets{$name}{code};
        print "\"$code\": {\n";
	#print "<nimi>$name</nimi>\n";
        print "\"koodi\": \"$code\",\n";
        print "\"nimi\": \"$name\",\n";
        print "\"nimike\": \"$sets{$name}{label}\",\n";
        print "\"kommentti\": \"$sets{$name}{kommentti}\",";
        my $info = '';
        my @vars;
        my @begin;
        my @end;
        if (1) {
            for my $var (sort {$var2var{$a} cmp $var2var{$b}} keys %{$variables{$code}}) {
                my @t;
                @t = $variables{$code}{$var}{begin} =~ /^(\d+)-(\d+)-(\d+)/;
                @begin = @t if (!@begin or cmp_dates2(\@t,\@begin) < 0);
                for (@t) {$_+=0};
                my $t0 = "$t[2].$t[1].$t[0]";
                @t = $variables{$code}{$var}{end} =~ /^(\d+)-(\d+)-(\d+)/;
                @end = @t if (!@end or cmp_dates2(\@t,\@end) < 0);
                for (@t) {$_+=0};
                my $t1 = "$t[2].$t[1].$t[0]";
                $info .= "----$var2var{$var}: $t0 .. $t1; ";
                push @vars, '"'.$var.'"';
            }
        } else {
            for my $type (sort keys %{$codes{$code}}) {
                $info .= $type.':; ';
                for my $var (sort keys %{$codes{$code}{$type}}) {
                    my @t;
                    @t = $codes{$code}{$type}{$var}{begin} =~ /^(\d+)-(\d+)-(\d+)/;
                    for (@t) {$_+=0};
                    my $t0 = "$t[2].$t[1].$t[0]";
                    @t = $codes{$code}{$type}{$var}{end} =~ /^(\d+)-(\d+)-(\d+)/;
                    for (@t) {$_+=0};
                    my $t1 = "$t[2].$t[1].$t[0]";
                    $info .= "----$var2var{$var}: $t0 .. $t1; ";
                }
            }
        }
        print "\"muuttujat\": [ ".join(',', @vars)." ],\n";

        print "\"muuttujat2\": ";
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
        my $json = JSON->new;
        print $json->encode(\%vars),',';

        print "\"alkupvm\": \"$begin[0]-$begin[1]-$begin[2]\",\n" if @begin;
        print "\"loppupvm\": \"$end[0]-$end[1]-$end[2]\",\n" if @end;
        print "\"info\": \"$info\"\n";
	print "}\n";
    }
    print "}\n";
}

my %ajat;

sub get_dataset {
    my($dbh) = @_;
    my $limit = $q->param('max');
    my $raw = $q->param('raaka');
    my @suureet = $q->param('suure');
    my @paikat = $q->param('paikka');
    if (@suureet == 0 or @paikat == 0) {
        print "{\"error\": \"Required param 'paikka' or 'suure' missing.\"}\n";
        return;
    }
    my $from = $q->param('from');
    my $to = $q->param('to');
    if (!$from or !$to) {
        print "{\"error\": \"Required param 'from' or 'to' missing.\"}\n";
        return;
    }
    #print STDERR "suure=$suure, paikka=[@paikat]\n";

    my %liput = (1 => 'Outlier', 3 => 'Mittausvirhe');

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

    my $table = $raw ? 'data' : 'data_tarkistettu';
    $sql = 
	"select paikka,suure,aika,arvo,lippu from $table where ".
	"($paikka_sql) and ($suure_sql) and aika>='$from' and aika<='$to'";
    $sql .= " limit $limit" if $limit;
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    %ajat = ();
    my %data;
    my %flags;
    my %paikat;
    my %have_data_from_day;
    my %have_data;
    while (1) {
	my($paikka,$suure,$aika,$arvo,$lippu) = $sth->fetchrow_array;
	last unless $paikka;
        $arvo = 'null' unless defined $arvo;
	$paikat{$paikka} = 1;
        my($yr,$mo,$day,$hr,$min,$sec) = $aika =~ /^(\d\d\d\d)-(\d\d)-(\d\d) (\d\d):(\d\d):(\d\d)/;
        $mo--;
	my $x = $data{$aika};
	$data{$aika}{$paikka}{$suure} = $arvo;
        $have_data_from_day{"$yr-$mo-$day"}{$paikka}{$suure} = 1;
        $flags{$aika}{$paikka}{$suure} = $lippu;
        $have_data{$paikka}{$suure} = 1;
	next if $x;
	$ajat{$aika} = [$yr,$mo,$day,$hr,$min,$sec];
    }

    # insert daily data for those days from which there is no "continuous" data
    $table = $raw ? 'data_daily' : 'data_daily_tarkistettu';
    $sql = 
	"select paikka,suure,aika,arvo,lippu from $table where ".
	"($paikka_sql) and ($suure_sql) and aika>='$from' and aika<='$to'";
    $sql .= " limit $limit" if $limit;
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    while (1) {
	my($paikka,$suure,$aika,$arvo,$lippu) = $sth->fetchrow_array;
	last unless $paikka;
        $arvo = 'null' unless defined $arvo;
	$paikat{$paikka} = 1;
        my($yr,$mo,$day) = $aika =~ /^(\d\d\d\d)-(\d\d)-(\d\d)/;
        $mo--;
        # is there data from this place on this day already?
        next if $have_data_from_day{$aika}{$paikka}{$suure};
	my $x = $data{$aika};
	$data{$aika}{$paikka}{$suure} = $arvo;
        $flags{$aika}{$paikka}{$suure} = $lippu;
        $have_data{$paikka}{$suure} = 1;
	next if $x;
	$ajat{$aika} = [$yr,$mo,$day,12,0,0];
    }

    my @aika = sort cmp_dates keys %ajat;
    
    print "[\n";
    my $yaxis = 1;
    my $first = 1;
    for my $suure (@suureet) {
        for my $paikka (@paikat) {
            next unless $have_data{$paikka}{$suure};
            print ",\n" unless $first;
            $first = 0;
            print "{\"label\": \"$paikka2nimi{$paikka}, $suureet{$suure}{nimi}\",\n";
            print "\"yaxis\": $yaxis,\n";
            print "\"data\": [\n";
            my $first2 = 1;
            for my $aika (@aika) {
                next unless $data{$aika}{$paikka}{$suure};
                my $time = $aika;
                $time .= ' 12:00:00' unless $time =~ / /;
                print ",\n" unless $first2;
                $first2 = 0;
                # time is needed in JavaScript timestamps, UTC
                if ($data{$aika}{$paikka}{$suure} eq 'null') {
                    print 'null';
                } else {
                    print "[",timelocal(@{$ajat{$aika}}[5,4,3,2,1,0])*1000,",$data{$aika}{$paikka}{$suure}]";
                }
            }
            print "],\"$suureet{$suure}{visualisointi}\": { \"show\": true }";
            print "}\n";
        }
        $yaxis++;
    }
    print "]\n";
}

sub cmp_dates {
    # [yr,mon,day,hr,min,sec] []
    for my $i (0..5) {
        return -1 if $ajat{$a}->[$i] < $ajat{$b}->[$i];
        return 1 if $ajat{$a}->[$i] > $ajat{$b}->[$i];
    }
    return 0;
}

sub cmp_dates2 {
    my($a,$b) = @_;
    for my $i (0..$#$a) {
        return -1 if $a->[$i] < $b->[$i];
        return 1 if $a->[$i] > $b->[$i];
    }
    return 0;
}