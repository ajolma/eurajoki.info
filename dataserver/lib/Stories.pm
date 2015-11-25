package Stories;
use strict;
use warnings;
use 5.010000; # say // and //=
use Carp;
use DBI;
use Util;

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

    my $email = $parameters->{email};
    my $password = $parameters->{password};
    my $story = $parameters->{story} // 0;
    $story =~ s/[^0-9]//g;
    my $cmd = $parameters->{cmd} // '';
    my $otsikko = $parameters->{otsikko};
    my $tarina = $parameters->{tarina};

    my ($connect, $user, $pass) = connect_params($self);
    my $dbh = DBI->connect($connect, $user, $pass) or croak('no db');

    my $sql = "select email,password from tarinat where id='$story'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my ($e,$p) = $sth->fetchrow_array;
    return html200("<html>no such story: $story</html>") unless $e;
    return html200('<html>authentication error</html>') unless $e eq $email && $p eq $password;

    if ($cmd eq 'del') {
        $sql = "delete from kuvat where story='$story'";
        $sth = $dbh->do($sql) or croak($dbh->errstr);
        $sql = "delete from tarinat where id='$story'";
        $sth = $dbh->do($sql) or croak($dbh->errstr);
        my $html = HTML->new;
        $html->element(html => [[head => [[meta => {'http-equiv' => 'Content-Type',
                                                    content => 'text/html; charset=UTF-8'}],
                                          [title => 'Tarinat']]],
                                [body => 'Tarina poistettiin. Päivitä tarinakartta niin se poistuu siitä.']]);
        return html200($html->html);
    }

    if ($cmd eq 'save') {    
        $sql = "update tarinat set otsikko='$otsikko',story='$tarina' where id='$story'";
        $sth = $dbh->do($sql) or croak($dbh->errstr);
    }
    
    $sql = "select otsikko,story from tarinat where id='$story'";
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    ($otsikko,$tarina) = $sth->fetchrow_array;
    $otsikko //= '';
    $tarina //= '';

    my $form = HTML->new;
    $form->element(form => {enctype=>'multipart/form-data', method=>'post'},
                   [[input => {type=>'hidden', name=>'email', value=>$email}],
                    [input => {type=>'hidden', name=>'password', value=>$password}],
                    [input => {type=>'hidden', name=>'story', value=>$story}],
                    [input => {type=>'hidden', name=>'cmd', value=>'save'}],
                    [1 => "Otsikko: "],
                    ['br'],
                    [input => {type=>'text', size=>60, name=>'otsikko', value=>$otsikko}],
                    [1 => "Tarina:"],
                    ['br'],
                    [textarea => {rows=>10, cols=>60, name=>'tarina'}, $tarina],
                    ['br'],
                    [input => {type=>'submit', value=>'Tallenna tarina'}]]);

    my $html = HTML->new;
    $html->element(html => [[head => [[meta => {'http-equiv' => 'Content-Type',
                                                content => 'text/html; charset=UTF-8'}],
                                      [title => $otsikko]]],
                            [body => [[h2 => $otsikko],
                                      [fieldset => $form->html]]]]);
    return html200($html->html);
}

1;
