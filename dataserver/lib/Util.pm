# This file is part of eurajoki.info
# https://github.com/ajolma/eurajoki.info
# Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2

package Util;
use strict;
use warnings;
use Carp;
use Exporter 'import';
use Encode qw(decode encode);
use JSON;

our @EXPORT = qw(load_config common_responses connect_params html200 cmp_dates json200 option_list);

sub load_config {
    my $self = shift;
    open my $fh, '<', $self->{config} or croak "Can't open file '$self->{config}': $!\n";
    my @json = <$fh>;
    close $fh;
    $self->{config} = decode_json "@json";
    $self->{config}{debug} = 0 unless defined $self->{config}{debug};
}

sub common_responses {
    my $env = shift;
    if (!$env->{'psgi.streaming'}) {
        return [ 500, ["Content-Type" => "text/plain"], ["Internal Server Error (Server Implementation Mismatch)"] ];
    }
    if ($env->{REQUEST_METHOD} eq 'OPTIONS') {
        return [ 200, 
                 [
                  "Access-Control-Allow-Origin" => "*",
                  "Access-Control-Allow-Methods" => "GET,POST",
                  "Access-Control-Allow-Headers" => "origin,x-requested-with,content-type",
                  "Access-Control-Max-Age" => 60*60*24
                 ], 
                 [] ];
    }
    return undef;
}

sub connect_params {
    my $self = shift;
    my $db = $self->{config}{dbi};
    my($connect, $user, $pass) = split /\s+/, $db;
    return ($connect, $user, $pass);
}

sub html200 {
    my $html = shift;
    return [ 200, 
             ['Content-Type' => 'text/html; charset=utf-8'], 
             [encode utf8 => $html]
        ];
}

sub json200 {
    my $data = shift;
    my $json = JSON->new;
    $json->utf8;
    return [200, ['Content-Type' => 'application/json; charset=utf-8'], [$json->encode($data)]];
}

sub cmp_dates {
    my($a,$b) = @_;
    for my $i (0..$#$a) {
        return -1 if $a->[$i] < $b->[$i];
        return 1 if $a->[$i] > $b->[$i];
    }
    return 0;
}

sub option_list {
    my ($default, $values, $labels) = @_;
    my @list = ();
    for my $value (@$values) {
        my $label = $value;
        $label = $labels->{$value} if defined $labels->{$value};
        my $attr = {value => $value};
        $attr->{selected} = 'selected' if $default && $value eq $default;
        push @list, [option => $attr, $label];
    }
    return \@list;
}

{
    package HTML;
    use strict;
    use warnings;
    our @ISA = qw(Geo::OGC::Service::XMLWriter);
    sub new {
        return bless {}, 'HTML';
    }
    sub write {
        my $self = shift;
        my $line = shift;
        push @{$self->{cache}}, $line;
    }
    sub html {
        my $self = shift;
        return join '', @{$self->{cache}};
    }
}


1;
