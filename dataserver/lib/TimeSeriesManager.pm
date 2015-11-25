# This file is part of eurajoki.info
# https://github.com/ajolma/eurajoki.info
# Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2

package TimeSeriesManager;
use strict;
use warnings;
use 5.010000; # say // and //=
use Carp;
use Util;
use Date::Calc qw/check_date/;

use parent qw/Plack::Component/;

binmode STDERR, ":utf8"; 

sub new {
    my ($class, $parameters) = @_;
    my $self = Plack::Component->new($parameters);
    load_config($self) if not ref $self->{config};
    croak "A configuration file is needed." unless $self->{config};
    return bless $self, $class;
}

sub call {
    my ($self, $env) = @_;
    my $ret = common_responses($env);
    return $ret if $ret;

    my $request = Plack::Request->new($env);
    my $parameters = $request->parameters;

    my ($connect, $user, $pass) = connect_params($self);
    my $dbh = DBI->connect($connect, $user, $pass) or croak('no db');

    my $cmd = $parameters->{cmd} // '';
    $self->{paikka} = $parameters->{Paikka} // '';
    $self->{suure} = $parameters->{Suure} // '';
    $self->{test} = $parameters->{Test} // '';
    $self->{data} = $parameters->{Data} // '';
    
    $self->{timestep} = $parameters->{Aika_askel} // '';
    $self->{compute} = $parameters->{Compute} // '';
    $self->{amount} = $parameters->{Amount} // '';

    $self->{style} = $parameters->{Style} // 'points';

    my $sql = 
        "select distinct paikka,nimike,suureet.suure,suureet.nimi ".
        "from data,mittauskohteet,suureet ".
        "where data.paikka=mittauskohteet.koodi ".
        "and data.suure=suureet.suure";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my %paikat;
    my %suureet;
    my %paikka2suure;
    while (my($paikka_koodi,$paikka,$suure_koodi,$suure) = $sth->fetchrow_array) {
        $paikat{$paikka_koodi} = $paikka;
        $suureet{$suure_koodi} = $suure;
        push @{$paikka2suure{$paikka_koodi}}, $suure_koodi;
    }
    my @paikat;
    my %json;
    for my $paikka_koodi (sort {$paikat{$a} cmp $paikat{$b}} keys %paikat) {
        push @paikat, $paikka_koodi;
        if (@{$paikka2suure{$paikka_koodi}}) {
            $json{$paikka_koodi} = [];
            for my $suure_koodi (@{$paikka2suure{$paikka_koodi}}) {
                push @{$json{$paikka_koodi}}, [$suureet{$suure_koodi},$suure_koodi];
            }
        }
    }
    my @suureet = @{$paikka2suure{$paikat[0]}};

    $self->{a_paikat} = \@paikat;
    $self->{a_suureet} = \@suureet;
    $self->{h_paikat} = \%paikat;
    $self->{h_suureet} = \%suureet;

    my $json = JSON->new;
    $json->utf8;
    $json = $json->encode(\%json);

    my @body = ([ h2 => 'Aikasarjaeditori' ]);

    if ($cmd eq '' or $cmd eq 'Hae' or $cmd eq 'Palaa tallentamatta') {
        
        push @body, $self->HaeForm($json);
        if ($cmd eq 'Hae') {
            push @body, $self->Hae($dbh, 'show');
        }
    }

    elsif ($cmd eq 'Siirry tallentamaan') {

        push @body, $self->TallennaForm();
        
    } 

    elsif ($cmd eq 'Tallenna' or $cmd eq 'Testaa tallennusta') {

        my $test = $cmd eq 'Testaa tallennusta';

        if ($self->{data} ne '') {
            push @body, $self->Tallenna($dbh, $test ? 'test' : '', $json);
        } else {
            push @body, $self->Hae($dbh, 'store') unless $self->{test};
        }

    }

    if ($cmd eq '' or $cmd eq 'Hae') {
        push @body, $self->lastScript();
    }

    my $html = HTML->new;
    $html->element(html => [[head => [[meta => {'http-equiv' => 'Content-Type',
                                                content => 'text/html; charset=UTF-8'}],
                                      [title => 'Aikasarjaeditori']]],
                            [body => \@body]]);
    return html200($html->html);
}

sub HaeForm {
    my ($self, $json) = @_;
    return ([ style => "img {float: right}" ],
            [ script => "var ab = $json;" ],
            [ script => {type => "text/javascript", src => "/lib/data.js"}, ''],
            [ form => 
              [[ select => {id => 'Paikka', name => 'Paikka', onChange => 'uusiPaikka()'}, 
                 option_list($self->{paikka}, $self->{a_paikat}, $self->{h_paikat})],
               [ select => {id => 'Suure', name => 'Suure', onChange => 'pyyhiKuva()'}, 
                 option_list($self->{suure}, $self->{a_suureet}, $self->{h_suureet})],
               [ select => {id => 'Amount', name => 'Amount', onChange => 'pyyhiKuva()'}, 
                 option_list($self->{amount}, ['10 viimeisintä', '100 viimeisintä', 'Kaikki'])],
               [ select => {id => 'Style', name => 'Style', onChange => 'pyyhiKuva()'}, 
                 option_list($self->{style}, ['points', 'lines'], {points => 'Esitä pisteillä', lines => 'Esitä viivoilla'})],
               [ input => {type=>'submit', name => 'cmd', value=>'Hae'}],
               [ input => {type=>'submit', name => 'cmd', value=>'Siirry tallentamaan'}]] ]);
}

sub Hae {
    my ($self, $dbh, $cmd) = @_;
    
    my $sql = "select lippu,kuvaus from liput";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my %liput;
    while (my($lippu,$nimi) = $sth->fetchrow_array) {
        $liput{$lippu} = $nimi;
    }
    
    my $limit = '';
    if ($self->{amount} ne 'Kaikki') {
        ($limit) = $self->{amount} =~ /(\d+)/;
        $limit = "limit $limit";
    }
    my $clean = '';
    if ($self->{compute} eq 'Puhtaat arvot') {
        $clean = 'and lippu % 10 == 0';
    }
    $sql = "select aika,arvo,lippu from data ".
        "where paikka='$self->{paikka}' and suure='$self->{suure}' $clean ".
        "order by aika desc $limit";
    $sth = $dbh->prepare($sql) or error($dbh->errstr);
    $rv = $sth->execute or error($dbh->errstr);
    my @input;
    while (my($aika,$arvo,$lippu) = $sth->fetchrow_array) {
        unless (defined $arvo) {
            $arvo = '';
            $lippu = int($lippu/10)*10; # filter out detail flags, leave daily value (or some other similar)
            $lippu = '' if $lippu == 0; # quiet
        }
        unshift @input, [$aika,$arvo,$lippu];
    }

    my($date,$prev_date);

    my $commit = "begin;\n";
    my %data;

    my @trs;
    my @data;
    for (@input) {
        my($aika,$arvo,$lippu) = @$_;
        $lippu = $liput{$lippu} if $lippu ne '';
        push @data, [$aika,$arvo];
        $arvo = 'Tieto puuttuu' if $arvo eq '';
        push @trs, [tr => [[td => $aika],[td => $arvo],[td => $lippu]]];
    }
       
    my @ret;
    if (@data and $cmd ne 'store') {
        open DATA, ">/tmp/data";
        for my $d (@data) {
            print DATA "@$d\n";
        }
        close DATA;
        open GNUPLOT, ">/tmp/gnuplot";
        print GNUPLOT "set terminal png size 800,400\n";
        print GNUPLOT "set output \"$self->{config}{images}/plot.png\"\n";
        my $timefmt = '"%Y-%m-%d %H:%M:%S"';
        my $ydata = 3;
        print GNUPLOT "set timefmt $timefmt\n";
        print GNUPLOT "set xdata time\n";
        print GNUPLOT "plot \"/tmp/data\" using 1:$ydata with lines title \"\"\n";
        close GNUPLOT;
        system "cat /tmp/gnuplot | gnuplot";
        push @ret, [ img => {src=>'/Eurajoki/images/plot.png'} ];
        push @ret, [ table => {id => "info2", border=>1}, \@trs ];
    }
    if (@data == 0) {
        push @ret, [ p => [font => {color=>"red"}, "Ei dataa. ($sql)"]];
    }

    return [ p => {id => 'info'}, \@ret ];
}

sub TallennaForm {
    my ($self) = @_;
    ([p => 
      [
       [1 => "Tallennetaan paikasta "],
       [b => $self->{h_paikat}->{$self->{paikka}}],
       [1 => " dataa "],
       [b => $self->{h_suureet}->{$self->{suure}}],
       [1 => "  "]]
     ],
     [form => {method => 'post'},
      [
       [input => {type=>'hidden', name=>'Paikka', value=>$self->{paikka}}],
       [input => {type=>'hidden', name=>'Suure', value=>$self->{suure}}],
       [input => {type=>'hidden', name=>'Amount', value=>$self->{amount}}],
       [input => {type=>'submit', name=>'cmd', value=>'Palaa tallentamatta'}],
       [p => 
        "Anna data yksi arvo rivillä, järjestyksessä päivämäärä [kellonaika] arvo [lippu].".
        " Älä anna kellonaikaa jos havaintoarvo on päiväkohtainen.".
        " Lippua ei yleensä tarvitse antaa. Lipulla ilmaistaan yleensä havainnon päiväkohtaisuutta.".
        " Lipun muoto on ln, jossa n on lippunumero (ks. tietokanta).".
        " Päivämäärä voi olla esim. muodossa pp.kk.vvvv ja ja kellonaika esim. muodossa hh:mm."],
       [p => 
        "Anna arvoksi 'x', jos tieto puuttuu, ja 'poista', jos haluat poistaa arvon tietokannasta.".
        " Jos haluat muuttaa tiedon, anna uusi tieto.".
        " Arvon desimaalipilkku muutetaan desimaalipisteeksi eli älä anna pilkkua tuhaterottimena.".
        " Jos kaikkia rivejä ei onnistuta tulkitsemaan tai tallennusta vain testataan,".
        " mitään tietoa ei tallenneta. Ohjelma ilmoittaa tulkintaongelmista ja virheistä."],
       [pre => 'päivämäärä [kellonaika] mittausarvo [lippu]'],
       [textarea => {rows=>40, cols=>60, name=>'Data'}, $self->{data}],
       ['br'],
       [input => {type=>'submit', name=>'cmd', value=>'Tallenna'}],
       [input => {type=>'submit', name=>'cmd', value=>'Testaa tallennusta'}]]
     ]
    );
}

sub Tallenna {
    my ($self, $dbh, $opt, $json) = @_;

    my @data = split(/\n/,$self->{data});

    my $sql = "select aika,arvo,lippu from data ".
        "where paikka='$self->{paikka}' and suure='$self->{suure}'";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my %data;
    while (my($aika,$arvo,$lippu) = $sth->fetchrow_array) {
        $data{"$aika $lippu"} = $arvo;
    }
    
    my @ret;
    $sql = "begin;\n";
    my $i = 1;
    my $warn;
    for my $data (@data) {
        say STDERR $data;
        my($aika,$arvo,$lippu,$w) = tulkitse_rivi($i, $data);
        say STDERR "$aika,$arvo,$lippu,@$w";
        if (@$w) {
            for my $e (@$w) {
                push @ret, [font => {color=>"red"}, $e."<br />"];
            }
            $warn = 1;
        }
        $i++;
        unless (@$w) {
            if ($arvo eq 'delete') {
                if (exists $data{"$aika $lippu"}) {
                    $sql .= "delete from data ".
                        "where aika='$aika' and paikka='$self->{paikka}' and suure='$self->{suure}' and lippu=$lippu;\n";
                } else {
                    push @ret, [font => {color=>"red"}, "Ajanhetkeltä '$aika' ei ole mittausarvoa, jonka voisi poistaa.<br />"];
                    $warn = 1;
                }
            } elsif (exists $data{"$aika $lippu"}) {
                $sql .= "update data set arvo=$arvo,lippu=$lippu ".
                    "where aika='$aika' and paikka='$self->{paikka}' and suure='$self->{suure}';\n";
            } else {
                $sql .= "insert into data (paikka,aika,suure,arvo,lippu) values ".
                    "('$self->{paikka}','$aika','$self->{suure}',$arvo,$lippu);\n";
            }
        }
    }
    $sql .= 'commit;';
    
    push @ret, [p => "Virheitä ei havaittu."] unless $warn;
    push @ret, [p => "SQL:ssä mahdollisesti olevat virheet näkyvät vasta tallennettaessa."] if $opt eq 'test';
    push @ret, [p => [[1 => "Tallennus-SQL on:"],
                      [pre => [code => $sql]]]];
    my $ok;
    if (!$warn && $opt ne 'test') {
        $ok = $dbh->do($sql);
        if ($ok) {
            push @ret, [p => [b => 'Tallennus OK']];
            push @ret, $self->HaeForm($json);
            push @ret, lastScript($self->{suure});
        } else {
            push @ret, mywarn($dbh->errstr);
        }
    } else {
        if ($warn) {
            push @ret, [font => {color=>"red"}, "Tallennusta ei tehty koska ilmeni virheitä tai varoituksia."];
        } else {
            push @ret, [p => "Tallennusta ei tehty."];
        }
    }
    
    push @ret, $self->TallennaForm() unless $ok;

    return @ret;
}


sub tulkitse_rivi { # pvm kellonaika arvo
    my ($rivinro, $rivi) = @_;
    my @elementit = split(/\s+/, $rivi);
    my ($y,$m,$d,$h,$s,$aika,$warn);
    $warn = [];
    $aika = '';

    my $pvm = shift @elementit;
    my $ok = 1;
    if (!$pvm) {
        push @$warn, "Päivämäärä puuttuu";
        $ok = 0;
    } elsif ($pvm =~ /^(\d+)\.(\d+)\.(\d\d\d\d)$/) { # dd.mm.yyyy
        $y = $3;
        $m = $2;
        $d = $1;
    } elsif ($pvm =~ /^(\d+)\.(\d+)\.(\d\d)$/) { # dd.mm.yy
        $y = $3 > 50 ? 1900+$3 : 2000+$3; # questionable
        $m = $2;
        $d = $1;
    } elsif ($pvm =~ /^(\d\d)\/(\d\d)\/(\d\d)$/) { # mm/dd/yy
        $y = $3 > 50 ? 1900+$3 : 2000+$3; # questionable
        $m = $1;
        $d = $2;
    } elsif ($pvm =~ /^(\d+)\/(\d+)\/(\d\d\d\d)$/) { # mm/dd/yyyy
        $y = $3;
        $m = $1;
        $d = $2;
    } elsif ($pvm =~ /^(\d\d\d\d)\-(\d\d)\-(\d\d)$/) { # yyyy-mm-dd
        $y = $1;
        $m = $2;
        $d = $3;
    } else {
        push @$warn, "En pysty tulkitsemaan päivämäärää: '$pvm'";
        $ok = 0;
    }
    if ($ok) {
        unless (check_date($y,$m,$d)) {
            push @$warn, "Väärä päiväys: '$pvm'";
            $ok = 0;
        }
    }
    if ($ok) {
        $m += 0;
        $d += 0;
        $m = '0'.$m if $m < 10;
        $d = '0'.$d if $d < 10;
        $aika = "$y-$m-$d";
    }

    my $lippu = 0;
    my $time = '';
    if (@elementit > 1) {
        $time = shift @elementit;
        $ok = 1;
        if (!$time) {
            push @$warn, "Kellonaika puuttuu";
            $ok = 0;
        } elsif ($time =~ /^(\d+)$/) {
            $h = $1;
            $m = 0;
            $s = 0;
        } elsif ($time =~ /^(\d+)[:\.](\d+)$/) {
            $h = $1;
            $m = $2;
            $s = 0;
        } elsif ($time =~ /^(\d+)[:\.](\d+)[:\.](\d+)$/) {
            $h = $1;
            $m = $2;
            $s = $3;
        } else {
            push @$warn, "En pysty tulkitsemaan kellonaikaa: '$time'";
            $ok = 0;
        }
        if ($ok) {
            unless (($h <= 24) && ($h >= 0) && ($m <= 60) && ($m >= 0) && ($s <= 60) && ($s >= 0)) {
                push @$warn, "Väärä kellonaika: '$time'";
                $ok = 0;
            }
        }
        if ($ok) {
            $m = '0'.int($m) if int($m) < 10;
            $s = '0'.int($s) if int($s) < 10;
            $time = "$h:$m:$s";
        } else {
            $time = "";
        }
    } else {
        $time = "12:00:00";
        $lippu = 10;
    }

    $aika .= " $time";
    
    my $arvo = shift @elementit;
    if (!(defined $arvo) || $arvo eq '') {
        push @$warn, "Arvo puuttuu";
    } elsif ($arvo eq 'x') {
        $arvo = 'NULL';
    } elsif ($arvo eq 'poista') {
        $arvo = 'delete';
    } else {
        $arvo =~ s/,/./;
        $! = 0;
        my ($num, $n) = POSIX::strtod($arvo);
        push @$warn, "'$arvo' ei ole numeerinen: $!" unless ($n == 0) && !$!;
    }

    if (@elementit) {
        my $l = shift @elementit;
        if ($l =~ /^l(\d+)$/) {
            $lippu = $1;
        } else {
            push @$warn, "En pysty tulkitsemaan lippukoodia: $l";
        }
    }

    if (@elementit) {
        push @$warn, "Liikaa tietoa rivillä: '@elementit'";
    }

    return ($aika,$arvo,$lippu,$warn);
}

sub lastScript {
    my ($self, $suure) = @_;
    return [script => "(function(){setSuure(\"$self->{suure}\")})();"];
}


1;

__DATA__


sub error {
    my $error = shift;
    print '<br /><font color="red">',$error,'</font>',$q->end_html;
    exit;
}

sub mywarn {
    my ($error) = @_;
    print '<font color="red">',$error,'</font><br />';
    return 1;
}

