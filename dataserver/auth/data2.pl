#!/usr/bin/perl -w

use utf8;
use strict;
use IO::Handle;
use Carp;
use Encode;
use DBI;
use CGI;
use Statistics::Descriptive;

my $png = '/var/www/proj/home/plot/plot.png';

my $q = CGI->new;
print $q->header( -type => 'text/html', 
                  -charset=>'utf-8' );

my $params = $q->Vars;

my $db = `grep local-eurajoki /var/www/etc/dbi`;
chomp $db;
my(undef, $connect, $user, $pass) = split /\s+/, $db;
my $dbh = DBI->connect($connect, $user, $pass) or error('no db');

my %suureet;

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
    while (my($suure,$nimi) = $sth->fetchrow_array) {
        $suureet{$suure} = $nimi;
    }
    $suureet{''} = 'Ei valintaa';

    print $q->start_html('Eurajoen data');

    if ($params->{Hae}) {

        Hae('show');

    } elsif ($params->{'Aloita tallennus'}) {

        print $q->start_form;
        for (qw/Laatu Aika_askel Paikka Suure Compute Amount/) {
            print "$_ = $params->{$_}<br />\n" if 
                $params->{$_} and not ($_ eq 'Compute' or $_ eq 'Amount');
            print $q->hidden( -name =>  $_,
                              -value => $params->{$_} );
            
        }
        print 
            '<br />',$q->textarea( -name => 'Data',
                                   -rows => 40,
                                   -columns => 60 ),
            '<br />',$q->submit('Jatka'),$q->end_form;

    } elsif ($params->{Jatka}) {

        print $q->start_form;
        for (qw/Laatu Aika_askel Paikka/) {
            print "$_ = $params->{$_}<br />\n" if $params->{$_};
            print $q->hidden( -name =>  $_,
                              -value => $params->{$_} );
            
        }

        if ($params->{Suure} eq '') {
            KysySuureet();
        } elsif ($params->{Data}) {
            Tallenna();
        } else {
            Hae('store') unless $params->{Test};
        }
        print $q->end_form;

    } elsif ($params->{'Jatka (2)'}) {

        Tallenna0();

    } elsif ($params->{OK}) {

        $dbh->do($params->{SQL}) or error($dbh->errstr);
        print '<br />Tallennus OK';

    } else {

        print
            $q->start_form,
            $q->popup_menu( -name => 'Laatu',
                            -default => 'Tarkistettu',
                            -values => ['Raaka', 'Tarkistettu'] ),
            $q->popup_menu( -name => 'Aika_askel',
                            -values => ['Mielivaltainen', encode utf8=>'Päivä'] ),
            $q->popup_menu( -name => 'Paikka',
                            -values => \@paikat ),
            $q->popup_menu( -name => 'Suure',
                            -default => '',
                            -values => [sort {$suureet{$a} cmp $suureet{$b}} keys %suureet],
                            -labels => \%suureet ),
            $q->submit('Aloita tallennus'),
            '<br />',
            $q->popup_menu( -name => 'Compute',
                            -values => ['Ei laskentaa', 'Puhtaat arvot',
                                        encode(utf8=>'Laske päiväarvot'),
                                        encode(utf8=>'Laske puhtaat päiväarvot')] ),
            $q->popup_menu( -name => 'Amount',
                            -values => ['Kaikki', encode utf8=>'100 viimeisintä'] ),
            $q->submit('Hae'),
            $q->end_form;

    }
     
    print '<br /><a href="data2.pl">Alkuun.</a>',$q->end_html;
}

sub KysySuureet {
    my @data = split(/\n/,$params->{Data});

    my @table;
    my @ok_col;
    $ok_col[0] = 1;
    for my $data (@data) { # aika {tab arvo}*
        my($aika,@arvot) = split(/\t/,$data);
        my $i = 1;
        for (@arvot) {
            $_ =~ s/^\s+//;
            $_ =~ s/\s+$//;
            $_ =~ s/,/./;
            $_ =~ s/[^0-9.]//g;
            $_ = 'NULL' if $_ eq '';
            $ok_col[$i] = 1 unless $_ eq 'NULL';
            $i++;
            
        }
        my($date,$type) = sql_date($aika);
        if ($type eq 'date' and $params->{Aika_askel} eq 'Mielivaltainen') {
            print encode(utf8=>"<font color=\"red\">HUOM: $date: Aika päivänä vaikka aika-askel on mielivaltainen!</font><br \>\n");
        }
        push @table, [$date,@arvot];
    }

    print "<table border=\"1\">";
    my $N = @{$table[0]};
    print "<tr>";
    print "<th>Aika</th>";
    my $c = '#78e1f4';
    for my $i (1..$N-1) {
        next unless $ok_col[$i];
        print 
            "<th bgcolor=\"$c\">",
            $q->popup_menu( -name => 'Suure_'.$i,
                            -default => '',
                            -values => [sort {$suureet{$a} cmp $suureet{$b}} keys %suureet],
                            -labels => \%suureet ),"</th>";
        $c = $c eq '#78e1f4' ? '#FFFFFF' : '#78e1f4';
    }
    print "</tr>";
    for my $row (@table) {
        print "<tr>";
        my $c = '#FFFFFF';
        my $i = 0;
        for my $e (@$row) {
            if ($ok_col[$i]) {
                print "<td bgcolor=\"$c\">$e</td>";
                $c = $c eq '#78e1f4' ? '#FFFFFF' : '#78e1f4';
            }
            $i++;
        }
        print "</tr>";
    }
    print 
        "</table>\n",
        $q->hidden( -name => 'Data',
                    -value => $params->{Data} ),
        $q->submit('Jatka (2)');

}

sub Tallenna0 {

    my $table = table();
    my $paikka = paikka();
    my $sql = "select aika,suure,arvo from $table ".
        "where paikka='$paikka'";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my %data;
    while (my($aika,$suure,$arvo) = $sth->fetchrow_array) {
        $data{$suure}{$aika} = $arvo;
    }

    my @data = split(/\n/,$params->{Data});

    $sql = "begin;\n";
    my @table;
    for my $data (@data) { # aika {tab arvo}*
        my($aika,@arvot) = split(/\t/,$data);
        my $date = sql_date($aika);
        my $i = 0;
        for my $arvo (@arvot) {
            $i++;

            my $suure = $params->{'Suure_'.$i};
            next if $suure eq '';

            $arvo =~ s/^\s+//;
            $arvo =~ s/\s+$//;
            $arvo =~ s/,/./;
            $arvo =~ s/[^0-9.]//g;
            $arvo = 'NULL' if $arvo eq '';
        
            if ($data{$suure}{$date}) {
                $sql .= "update $table set arvo=$arvo ".
                    "where aika='$date' and paikka='$paikka' and suure='$suure';\n";
            } else {
                $sql .= "insert into $table (paikka,aika,suure,arvo) values ".
                    "('$paikka','$date','$suure',$arvo);\n";
            }            
            
        }
    }
    $sql .= 'commit;';

    print "<pre><code>$sql</pre></code>\n";

    print 
        $q->start_form,
        $q->hidden( -name => 'SQL',
                    -value => $sql ),
        $q->submit('OK'),
        $q->submit('NOT OK'),
        $q->end_form;

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
        $arvo =~ s/[^0-9.]//g;
        $arvo = 'NULL' if $arvo eq '';
        #next if $arvo eq 'NULL' and ($table eq 'data' or $table eq 'data_tarkistettu');
        #next unless defined $arvo and $arvo ne '';
        my $date = sql_date($aika);
        if ($data{$date}) {
            $sql .= "update $table set arvo=$arvo ".
                "where aika='$date' and paikka='$paikka' and suure='$params->{Suure}';\n";
        } else {
            $sql .= "insert into $table (paikka,aika,suure,arvo) values ".
                "('$paikka','$date','$params->{Suure}',$arvo);\n";
        }
    }
    $sql .= 'commit;';
    print "<pre><code>$sql</pre></code>\n";
    if ($opt ne 'test') {
        #$dbh->do($sql) or error($dbh->errstr);
        print '<br />Tallennus NOT DONE';
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
        print GNUPLOT "set output \"$png\"\n";
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
        my $h = $1;
        $h = '0'.$h if $h < 10;
        my $mi = $2;
        $hetki = "$h:$mi:00";
    } elsif ($hetki =~ /^(\d+):(\d+):(\d+)$/) {
        my $h = $1;
        $h = '0'.$h if $h < 10;
        my $mi = $2;
        $hetki = "$h:$mi:$3";
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
