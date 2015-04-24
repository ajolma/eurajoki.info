#!/usr/bin/perl -w

# This file is part of eurajoki.info
# https://github.com/ajolma/eurajoki.info
# Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2

use utf8;
use strict;
use IO::Handle;
use Carp;
use Encode;
use DBI;
use CGI;
use Statistics::Descriptive;

my $q = CGI->new;
print $q->header( -type => 'text/html', 
                  -charset=>'utf-8' );

my $params = $q->Vars;

my $db = `grep local-eurajoki /var/www/etc/dbi`;
chomp $db;
my(undef, $connect, $user, $pass) = split /\s+/, $db;
my $dbh = DBI->connect($connect, $user, $pass) or error('no db');
page();

sub error {
    my $error = shift;
    print
        '<br /><font color="red">',$error,'</font>',
        $q->end_html;
    exit;
}

sub page {

    #print "<font size=\"2\"><a href=\"data.pl\">Reset</a></font><br />";
    for my $key (sort keys %$params) {
        my @foo = split("\0",$params->{$key});
        #print "$key: @foo<br />\n";
    }

    my $sql = "select koodi,nimike from mittauskohteet order by koodi";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my @paikat;
    while (my($paikka,$nimike) = $sth->fetchrow_array) {
        push @paikat, "$nimike ($paikka)";
    }

    $sql = "select suure,nimi from suureet";
    $sth = $dbh->prepare($sql) or error($dbh->errstr);
    $rv = $sth->execute or error($dbh->errstr);
    my %suureet;
    while (my($suure,$nimi) = $sth->fetchrow_array) {
        $suureet{$suure} = $nimi;
    }

    print 
        $q->start_html('Eurajoen data');
    print
        $q->start_form;
    for (qw/Laatu Aika_askel Paikka Suure Compute Amount/) {
        print
            $q->hidden( -name =>  $_,
                        -value => $params->{$_} );
    }
    print
        $q->submit('Reset'),$q->end_form;

    print
        $q->start_form,
        $q->popup_menu( -name => 'Laatu',
                        -values => ['Raaka', 'Tarkistettu'] ),
        $q->popup_menu( -name => 'Aika_askel',
                        -values => ['Mielivaltainen', encode utf8=>'Päivä'] ),
        $q->popup_menu( -name => 'Paikka',
                        -values => \@paikat ),
        $q->popup_menu( -name => 'Suure',
                        -values => [sort {$suureet{$a} cmp $suureet{$b}} keys %suureet],
                        -labels => \%suureet ),
        $q->popup_menu( -name => 'Compute',
                        -values => ['Ei laskentaa', 'Puhtaat arvot',
                                    encode(utf8=>'Laske päiväarvot'),
                                    encode(utf8=>'Laske puhtaat päiväarvot')] ),
        $q->popup_menu( -name => 'Amount',
                        -values => ['Kaikki', encode utf8=>'100 viimeisintä'] ),
        $q->submit('Hae');

    if ($params->{Hae}) {
        Hae('show');
        print
            '<br />',$q->submit('Tallenna');
    } elsif ($params->{Tallenna} or $params->{Test}) {
        if ($params->{Data}) {
            Tallenna($params->{Test} ? 'test' : undef);
        } else {
            Hae('store') unless $params->{Test};
        }
    } elsif ($params->{Test}) {
        my @data = split(/\n/,$params->{Data});
        print "<br />";
        for my $data (@data) {
            my(@l) = split(/\t/,$data);
            $l[0] = sql_date($l[0]);
            for (@l) {
                s/\r//g;
                $_ = 'NULL' if not defined;
                $_ = 'empty' if $_ eq '';
            }
            my $n = @l;
            print "@l ($n)<br />";
        }
    } else {
        print
            '<br />',$q->textarea( -name => 'Data',
                                   -rows => 40,
                                   -columns => 60 ),
            '<br />',$q->submit('Tallenna'),$q->submit('Test');
    }

    print
        $q->end_form,
        $q->end_html;
}

sub Tallenna {
    my $opt = shift;

    my @data = split(/\n/,$params->{Data});
    my $table = table();
    my $paikka = paikka();

    my $sql = "select aika,arvo from $table ".
        "where paikka='$paikka' and suure='$params->{Suure}'";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my %data;
    #print "<pre><code>\n";
    while (my($aika,$arvo) = $sth->fetchrow_array) {
        $data{$aika} = $arvo;
        #print "$aika => $arvo\n";
    }
    #print "</pre></code>\n";
    
    $sql = "begin;\n";
    for my $data (@data) { # aika{tab+}arvo*
        my($aika,$arvo) = split(/\t+/,$data);
        $arvo =~ s/^\s+//;
        $arvo =~ s/\s+$//;
        $arvo =~ s/,/./;
        $arvo = 'NULL' if $arvo eq '';
        #next if $arvo eq 'NULL' and ($table eq 'data' or $table eq 'data_tarkistettu');
        #next unless defined $arvo and $arvo ne '';
        my $date = sql_date($aika);
        if (exists $data{$date}) {
            $sql .= "update $table set arvo='$arvo' ".
                "where aika='$date' and paikka='$paikka' and suure='$params->{Suure}';\n";
        } else {
            $sql .= "insert into $table (paikka,aika,suure,arvo) values ".
                "('$paikka','$date','$params->{Suure}',$arvo);\n";
        }
    }
    $sql .= 'commit;';
    print "<pre><code>$sql</pre></code>\n";
    if ($opt ne 'test') {
        $dbh->do($sql) or error($dbh->errstr);
        print '<br />Tallennus OK';
    }

}

sub Hae {
    my $cmd = shift;

    my $table = table();
    my $paikka = paikka();
    my $timestep = decode utf8=>$params->{Aika_askel};
    my $compute = decode utf8=>$params->{Compute};
    my $amount = decode utf8=>$params->{Amount};
    
    my $sql = "select id,kuvaus from liput";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my %liput;
    while (my($lippu,$nimi) = $sth->fetchrow_array) {
        $liput{$lippu} = $nimi;
    }
    
    my $limit = '';
    if ($amount ne 'Kaikki') {
        ($limit) = $amount =~ /(\d+)/;
        $limit = "limit $limit";
    }
    my $clean = '';
    if ($compute eq 'Puhtaat arvot') {
        $clean = 'and lippu isnull';
    }
    $sql = "select aika,arvo,lippu from $table ".
        "where paikka='$paikka' and suure='$params->{Suure}' $clean ".
        "order by aika desc $limit";
    $sth = $dbh->prepare($sql) or error($dbh->errstr);
    $rv = $sth->execute or error($dbh->errstr);
    my @input;
    while (my($aika,$arvo,$lippu) = $sth->fetchrow_array) {
        unshift @input, [$aika,$arvo,$lippu];
    }

    my($date,$prev_date);
    my $stat = Statistics::Descriptive::Full->new();
    my $compute_daily = ($compute eq 'Laske päiväarvot' or $compute eq 'Laske puhtaat päiväarvot');

    my $commit = "begin;\n";
    my %data;
    if ($compute_daily) {
        my $sql2 = "select aika,arvo from data_daily_tarkistettu ".
            "where paikka='$paikka' and suure='$params->{Suure}'";
        my $sth2 = $dbh->prepare($sql2) or error($dbh->errstr);
        my $rv = $sth2->execute or error($dbh->errstr);
        while (my($aika,$arvo) = $sth2->fetchrow_array) {
            $data{$aika} = $arvo;
        }
    }

    my @html;
    my @data;
    for (@input) {
        #while (my($aika,$arvo,$lippu) = $sth->fetchrow_array) {
        my($aika,$arvo,$lippu) = @$_;
        
        next if $compute eq 'Laske puhtaat päiväarvot' and $lippu;

        if ($compute_daily) {
            
            $date = (split(/ /,$aika))[0];
            $prev_date = $date unless defined $prev_date;
            if ($date ne $prev_date) {
                my $str = htstr($cmd,\%data,$prev_date,$paikka,$params->{Suure},$stat->mean(),$stat->count());
                push @data, [$prev_date,$stat->mean()];
                if ($cmd eq 'store') {
                    $commit .= $str;
                } else {
                    push @html, $str;
                }
                $prev_date = $date;
                $stat = Statistics::Descriptive::Full->new();
            }
            $stat->add_data($arvo);
            
        } else {
            
            $lippu = $liput{$lippu} if defined $lippu;
            for ($aika,$arvo,$lippu) { $_ = '' unless defined $_ }
            push @data, [$aika,$arvo];
            push @html, "<tr><td>$aika</td><td>$arvo</td><td>$lippu</td></tr>\n";
        }
    }
    
    if ($compute_daily) {
        my $str = htstr($cmd,\%data,$date,$paikka,$params->{Suure},$stat->mean(),$stat->count());
        if ($cmd eq 'store') {
            $commit .= $str;
        } else {
            push @data, [$date,$stat->mean()];
            push @html, $str;
        }

        if ($cmd eq 'store') {
            $commit .= "commit;\n";
            $dbh->do($commit) or error($dbh->errstr);
        }
    }
    
    if (@data and $cmd ne 'store') {
        open DATA, ">/tmp/data";
        for my $d (@data) {
            print DATA "@$d\n";
        }
        close DATA;
        open GNUPLOT, ">/tmp/gnuplot";
        print GNUPLOT "set terminal png size 800,400\n";
        print GNUPLOT "set output \"/l/www/root/plot/plot.png\"\n";
        my $timefmt = '"%Y-%m-%d %H:%M:%S"';
        my $ydata = 3;
        if ($timestep eq 'Päivä' or $compute_daily) {
            $timefmt = '"%Y-%m-%d"';
            $ydata = 2;
        }
        print GNUPLOT "set timefmt $timefmt\n";
        print GNUPLOT "set xdata time\n";
        print GNUPLOT "plot \"/tmp/data\" using 1:$ydata with lines title \"\"\n";
        close GNUPLOT;
        system "cat /tmp/gnuplot | gnuplot";
        print "<img src='/plot/plot.png'><br />\n";
        print "<table border='1'>\n";
        print @html;
        print "</table>\n";
    }
    if (@data == 0) {
        print "<p><font color=\"red\">Ei dataa. ($sql)</font></p>";
    }
}

sub htstr {
    my($cmd,$data,$aika,$paikka,$suure,$arvo,$extra) = @_;
    my $date = sql_date($aika);
    if ($cmd eq 'store') {
        if ($data->{$date}) {
            return "update data_daily_tarkistettu set arvo='$arvo' ".
                "where aika='$date' and paikka='$paikka' and suure='$suure';\n";
        } else {
            return "insert into data_daily_tarkistettu (paikka,aika,suure,arvo) values ".
                "('$paikka','$date','$suure','$arvo');\n";
        }
    } else {
        return "<tr><td>$aika</td><td>$arvo</td><td>$extra</td></tr>\n";
    }
}

sub sql_date {
    my($aika) = @_;
    $aika =~ s/^\s+//;
    $aika =~ s/\s+$//;
    my $hetki;
    if ($aika =~ /\s+/) {
        # return timestamp yyyy-mm-dd hh:mm:ss
        ($aika,$hetki) = split /\s+/, $aika;
    }
    # return date yyyy-mm-dd
    my($y,$m,$d);
    if ($aika =~ /^(\d+)\.(\d+)\.(\d\d\d\d)$/) { # dd.mm.yyyy
        $y = $3;
        $m = $2;
        $d = $1;
    } elsif ($aika =~ /^(\d\d)\/(\d\d)\/(\d\d)$/) { # mm/dd/yy
        $y = 2000+$3;
        $m = $1;
        $d = $2;
    } elsif ($aika =~ /^(\d+)\/(\d+)\/(\d\d\d\d)$/) { # mm/dd/yyyy
        $y = $3;
        $m = $1;
        $d = $2;
    } elsif ($aika =~ /^(\d\d\d\d)\-(\d\d)\-(\d\d)$/) { # yyyy-mm-dd
        $y = $1;
        $m = $2;
        $d = $3;
    } else {
        error(encode(utf8=>"En pysty tulkitsemaan päivämäärää: $aika"));
    }
    error(encode(utf8=>"Jotain vikaa päiväyksessä (kk=$m): $aika")) if $m > 12;
    $m += 0;
    $d += 0;
    $m = '0'.$m if $m < 10;
    $d = '0'.$d if $d < 10;
    $aika = "$y-$m-$d";
    unless (defined $hetki) {
        return wantarray ? ($aika,'date') : $aika;
    }
    if ($hetki =~ /^(\d+):(\d+)$/) {
        $hetki = "$1:$2:00";
    } elsif ($hetki =~ /^(\d+):(\d+):(\d+)$/) {
        $hetki = "$1:$2:$3";
    } else {
        error(encode(utf8=>"En pysty tulkitsemaan kellonaikaa: $hetki"));
    }
    return wantarray ? ("$aika $hetki",'timestamp') : "$aika $hetki";
}

sub table {
    my $table;
    if ($params->{Aika_askel} eq 'Mielivaltainen') {
        if ($params->{Laatu} eq 'Raaka') {
            $table = 'data';
        } else {
            $table = 'data_tarkistettu';
        }
    } else {
        if ($params->{Laatu} eq 'Raaka') {
            $table = 'data_daily';
        } else {
            $table = 'data_daily_tarkistettu';
        }
    }
    return $table;
}

sub paikka {
    #print "paikka = $params->{Paikka}\n";
    my $x = decode utf8=>$params->{Paikka};
    my($p) = $x =~ /\((\w+?)\)$/;
    return $p;
}
