package TimeSeriesManager;

use 5.010000; # say // and //=
use Carp;
use Modern::Perl;
use Encode qw(decode encode);
use Plack::Request;
use Plack::Builder;
use JSON;
use XML::LibXML;
use Clone 'clone';
use XML::LibXML::PrettyPrint;

use parent qw/Plack::Component/;

binmode STDERR, ":utf8"; 

sub new {
    my ($class, $parameters) = @_;
    my $self = Plack::Component->new($parameters);
    if (not ref $self->{config}) {
        open my $fh, '<', $self->{config} or croak "Can't open file '$self->{config}': $!\n";
        my @json = <$fh>;
        close $fh;
        $self->{config} = decode_json "@json";
        $self->{config}{debug} = 0 unless defined $self->{config}{debug};
    }
    croak "A configuration file is needed." unless $self->{config};
    return bless $self, $class;
}

sub call {
    my ($self, $env) = @_;
    if (! $env->{'psgi.streaming'}) { # after Lyra-Core/lib/Lyra/Trait/Async/PsgiApp.pm
        return [ 500, ["Content-Type" => "text/plain"], ["Internal Server Error (Server Implementation Mismatch)"] ];
    }
    return [ 200, 
               ['Content-Type' => 'text/html'], 
               ['No Not implemented yet.'] 
          ];
}

1;

__DATA__

#!/opt/perl/current/bin/perl -w

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
use JSON;
use Date::Calc qw/check_date/;
use Statistics::Descriptive;

binmode(STDOUT, ":utf8");

my $png = '/var/www/proj/Eurajoki/plot/plot.png';

my $q = CGI->new;
print $q->header( -type => 'text/html', 
                  -charset=>'utf-8' );

my $params = $q->Vars;

# no binary file uploads to this script
for my $key (keys %$params) {
    utf8::decode($params->{$key});
}

my $db = `grep local-eurajoki /var/www/etc/dbi`;
chomp $db;
my(undef, $connect, $user, $pass) = split /\s+/, $db;
my $dbh = DBI->connect($connect, $user, $pass, {pg_enable_utf8 => 1}) or error('no db');
page();

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

sub page {
    my $cmd = $params->{cmd} || '';
    my $paikka = $params->{Paikka} || '';
    my $suure = $params->{Suure} || '';

    for my $key (sort keys %$params) {
        my @foo = split("\0",$params->{$key});
        #print "$key: @foo<br />\n";
    }

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
    my $json = JSON->new;
    $json = $json->encode(\%json);

    print $q->start_html('Eurajoen data');

    if ($cmd eq '' or $cmd eq 'Hae' or $cmd eq 'Palaa tallentamatta') {
        
        HaeForm($json, \@paikat, \@suureet, \%paikat, \%suureet);
        if ($cmd eq 'Hae') {
            Hae('show');
        }
    }

    elsif ($cmd eq 'Siirry tallentamaan') {

        TallennaForm($paikka, $suure, \%paikat, \%suureet);
        
    } 

    elsif ($cmd eq 'Tallenna' or $cmd eq 'Testaa tallennusta') {

        my $test = $cmd eq 'Testaa tallennusta';

        if ($params->{Data}) {
            Tallenna($test ? 'test' : '', $paikka, $suure, $json, \@paikat, \@suureet, \%paikat, \%suureet);
        } else {
            Hae('store') unless $params->{Test};
        }

    }

    if ($cmd eq '' or $cmd eq 'Hae') {
        lastScript($suure);
    }

    print $q->end_html;
}

sub lastScript {
    my ($suure) = @_;
    print "<script>(function(){setSuure(\"$suure\")})();</script>";
}

sub HaeForm {
    my ($json, $a_paikat, $a_suureet, $h_paikat, $h_suureet) = @_;
    print 
        "<style>img {float: right}</style>\n",
        "<script>var ab = ",$json,";</script>\n",
        '<script type="text/javascript" src="data.js"></script>',"\n",
        $q->start_form,
        $q->popup_menu( -id => 'Paikka',
                        -name => 'Paikka',
                        -values => $a_paikat,
                        -labels => $h_paikat,
                        -onChange => 'uusiPaikka()' ),' ',
        $q->popup_menu( -name => 'Suure',
                        -id => 'Suure',
                        -values => $a_suureet,
                        -labels => $h_suureet,
                        -onChange => 'pyyhiKuva()'),' ',
        $q->popup_menu( -name => 'Amount',
                        -values => ['10 viimeisintä', '100 viimeisintä', 'Kaikki'],
                        -onChange => 'pyyhiKuva()'),' ',
        $q->popup_menu( -name => 'Style',
                        -values => ['points', 'lines'],
                        -labels => {points => 'Esitä pisteillä', lines => 'Esitä viivoilla'},
                        -onChange => 'pyyhiKuva()'),' ',
        $q->submit('cmd','Hae'),' ',
        $q->submit('cmd','Siirry tallentamaan'),
        $q->end_form;
}

sub TallennaForm {
    my ($paikka, $suure, $paikat, $suureet) = @_;
    print 
        $q->start_form,
        $q->hidden( -name => 'Paikka',
                    -value => $paikka ),
        $q->hidden( -name => 'Suure',
                    -value => $suure ),
        '<p>',
        "Tallennetaan paikasta <b>$paikat->{$paikka}</b> dataa <b>$suureet->{$suure}</b>  ",
        $q->submit('cmd','Palaa tallentamatta'),
        '<p/><p>',
        "<p>Anna data yksi arvo rivillä, järjestyksessä päivämäärä [kellonaika] arvo [lippu].",
        " Älä anna kellonaikaa jos havaintoarvo on päiväkohtainen.",
        " Lippua ei yleensä tarvitse antaa. Lipulla ilmaistaan yleensä havainnon päiväkohtaisuutta.",
        " Lipun muoto on ln, jossa n on lippunumero (ks. tietokanta).",
        " Päivämäärä voi olla esim. muodossa pp.kk.vvvv ja ja kellonaika esim. muodossa hh:mm.</p>",
        " <p>Anna arvoksi 'x', jos tieto puuttuu, ja 'poista', jos haluat poistaa arvon tietokannasta.",
        " Jos haluat muuttaa tiedon, anna uusi tieto.",
        " Arvon desimaalipilkku muutetaan desimaalipisteeksi eli älä anna pilkkua tuhaterottimena.",
        " Jos kaikkia rivejä ei onnistuta tulkitsemaan tai tallennusta vain testataan,",
        " mitään tietoa ei tallenneta. Ohjelma ilmoittaa tulkintaongelmista ja virheistä.</p>",
        '<p/>',
        '<pre>päivämäärä [kellonaika] mittausarvo [lippu]</pre>',
        $q->textarea( -name => 'Data',
                      -rows => 40,
                      -columns => 60 ),
        '<br />',
        $q->submit('cmd','Tallenna'),
        $q->submit('cmd','Testaa tallennusta'),
        $q->end_form;
}

sub Tallenna {
    my ($opt, $paikka, $suure, $json, $a_paikat, $a_suureet, $h_paikat, $h_suureet) = @_;

    my @data = split(/\n/,$params->{Data});

    my $sql = "select aika,arvo,lippu from data ".
        "where paikka='$paikka' and suure='$params->{Suure}'";
    my $sth = $dbh->prepare($sql) or error($dbh->errstr);
    my $rv = $sth->execute or error($dbh->errstr);
    my %data;
    while (my($aika,$arvo,$lippu) = $sth->fetchrow_array) {
        $data{"$aika $lippu"} = $arvo;
    }
    
    $sql = "begin;\n";
    my $i = 1;
    my $warn;
    for my $data (@data) {
        my($aika,$arvo,$lippu,$w) = tulkitse_rivi($i, $data);
        $warn = 1 if $w;
        $i++;
        unless ($w) {
            if ($arvo eq 'delete') {
                if (exists $data{"$aika $lippu"}) {
                    $sql .= "delete from data ".
                        "where aika='$aika' and paikka='$paikka' and suure='$suure' and lippu=$lippu;\n";
                } else {
                    $warn = mywarn("Ajanhetkeltä '$aika' ei ole mittausarvoa, jonka voisi poistaa.");
                }
            } elsif (exists $data{"$aika $lippu"}) {
                $sql .= "update data set arvo=$arvo,lippu=$lippu ".
                    "where aika='$aika' and paikka='$paikka' and suure='$suure';\n";
            } else {
                $sql .= "insert into data (paikka,aika,suure,arvo,lippu) values ".
                    "('$paikka','$aika','$suure',$arvo,$lippu);\n";
            }
        }
    }
    $sql .= 'commit;';
    print "Virheitä ei havaittu.<br />" unless $warn;
    print "SQL:ssä mahdollisesti olevat virheet näkyvät vasta tallennettaessa.<br />" if $opt eq 'test';
    print "<br />Tallennus-SQL on:<pre><code>$sql</pre></code>\n";
    my $ok;
    if (!$warn && $opt ne 'test') {
        $ok = $dbh->do($sql);
        if ($ok) {
            print '<p><b>Tallennus OK</b></p>';
            HaeForm($json, $a_paikat, $a_suureet, $h_paikat, $h_suureet);
            lastScript($suure);
        } else {
            mywarn($dbh->errstr);
        }
    } else {
        if ($warn) {
            mywarn("Tallennusta ei tehty koska ilmeni virheitä tai varoituksia.");
        } else {
            print "Tallennusta ei tehty.<br />";
        }
    }

    TallennaForm($paikka, $suure, $h_paikat, $h_suureet) unless $ok;

}

sub Hae {
    my $cmd = shift;

    my $paikka = $params->{Paikka} || '';
    my $suure = $params->{Suure} || '';
    my $timestep = $params->{Aika_askel} || '';
    my $compute = $params->{Compute} || '';
    my $amount = $params->{Amount} || '';
    my $style = $params->{Style} || 'points';
    
    my $sql = "select lippu,kuvaus from liput";
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
        $clean = 'and lippu % 10 == 0';
    }
    $sql = "select aika,arvo,lippu from data ".
        "where paikka='$paikka' and suure='$params->{Suure}' $clean ".
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

    my @html;
    my @data;
    for (@input) {
        my($aika,$arvo,$lippu) = @$_;
        
        $lippu = $liput{$lippu} if $lippu ne '';
        push @data, [$aika,$arvo];
        $arvo = 'Tieto puuttuu' if $arvo eq '';
        push @html, "<tr><td>$aika</td><td>$arvo</td><td>$lippu</td></tr>\n";
 
    }
       
    print "\n<p id=\"info\">";
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
        print GNUPLOT "set timefmt $timefmt\n";
        print GNUPLOT "set xdata time\n";
        print GNUPLOT "plot \"/tmp/data\" using 1:$ydata with lines title \"\"\n";
        close GNUPLOT;
        system "cat /tmp/gnuplot | gnuplot";
        print "<img src='/Eurajoki/plot/plot.png' />\n";
        print "<table id =\"info2\" border='1'>\n";
        print @html;
        print "</table>\n";
    }
    if (@data == 0) {
        print "<p><font color=\"red\">Ei dataa. ($sql)</font></p>";
    }
    print "</p>";
}

sub tulkitse_rivi { # pvm kellonaika arvo
    my ($rivinro, $rivi) = @_;
    my @elementit = split(/\s+/, $rivi);
    my ($y,$m,$d,$h,$s,$aika,$warn);
    $aika = '';

    my $pvm = shift @elementit;
    my $ok = 1;
    if (!$pvm) {
        $warn = mywarn("Päivämäärä puuttuu");
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
        $warn = mywarn("En pysty tulkitsemaan päivämäärää: '$pvm'");
        $ok = 0;
    }
    if ($ok) {
        $warn = mywarn("Väärä päiväys: '$pvm'") unless check_date($y,$m,$d);
        $ok = !$warn;
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
            $warn = mywarn("Kellonaika puuttuu");
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
            $warn = mywarn("En pysty tulkitsemaan kellonaikaa: '$time'");
            $ok = 0;
        }
        if ($ok) {
            $warn = mywarn("Väärä kellonaika: '$time'") unless 
                ($h <= 24) && ($h >= 0) && ($m <= 60) && ($m >= 0) && ($s <= 60) && ($s >= 0);
            $ok = !$warn;
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
        $warn = mywarn("Arvo puuttuu");
    } elsif ($arvo eq 'x') {
        $arvo = 'NULL';
    } elsif ($arvo eq 'poista') {
        $arvo = 'delete';
    } else {
        $arvo =~ s/,/./;
        $! = 0;
        my ($num, $n) = POSIX::strtod($arvo);
        $warn = mywarn("'$arvo' ei ole numeerinen: $!") unless ($n == 0) && !$!;
    }

    if (@elementit) {
        my $l = shift @elementit;
        if ($l =~ /^l(\d+)$/) {
            $lippu = $1;
        } else {
            $warn = mywarn("En pysty tulkitsemaan lippukoodia: $l");
        }
    }

    if (@elementit) {
        $warn = mywarn("Liikaa tietoa rivillä: '@elementit'");
    }

    return ($aika,$arvo,$lippu,$warn);
}
