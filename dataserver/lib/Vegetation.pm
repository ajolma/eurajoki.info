# This file is part of eurajoki.info
# https://github.com/ajolma/eurajoki.info
# Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2

package Vegetation;
use strict;
use warnings;
use 5.010000; # say // and //=
use Carp;
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

    my ($connect, $user, $pass) = connect_params($self);
    my $dbh = DBI->connect($connect, $user, $pass) or croak('no db');

    my $cmd = $parameters->{request} // '';

    if ($cmd eq 'GetPlants') {
	$self->get_plants($dbh);
    } elsif ($cmd eq 'GetPlantsOnRiver') {
	$self->get_plants_on_river($dbh);
    } else {
        return html200("<html>no such request: $cmd</html>");
    }
}

sub get_plants {
    my ($self, $dbh) = @_;
    my $sql = "select id,nimi,hakusana from lajit";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my $data = {};
    while (my($id,$nimi,$hakusana) = $sth->fetchrow_array) {
        $data->{$id} = [$nimi,$hakusana];
    }
    json200($data);
}

sub get_plants_on_river {
    my ($self, $dbh) = @_;
    my $sql = "select joki.id,lajit.id ".
        "from joki,lajit,laji2joki ".
        "where laji2joki.jokiosuus=joki.id and laji2joki.laji=lajit.id";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my $data = {};
    while (my ($jokiosuus,$laji) = $sth->fetchrow_array) {
        $data->{$jokiosuus}{$laji} = 1;
    }
    json200($data);
}

1;
