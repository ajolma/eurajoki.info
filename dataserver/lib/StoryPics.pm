# This file is part of eurajoki.info
# https://github.com/ajolma/eurajoki.info
# Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2

package StoryPics;
use strict;
use warnings;
use 5.010000; # say // and //=
use Carp;
use Util;
use Plack::App::File;
use File::MkTemp;

use parent qw/Plack::Component/;

binmode STDERR, ":utf8"; 

sub new {
    my ($class, $parameters) = @_;
    my $self = Plack::Component->new($parameters);
    load_config($self) if not ref $self->{config};
    croak "A configuration file is needed." unless $self->{config};
    $self->{style} = ".image{text-align:center;border:2px solid green;margin:5px;padding:5px;}";
    return bless $self, $class;
}

sub call {
    my ($self, $env) = @_;
    #say STDERR "call";
    my $ret = common_responses($env);
    return $ret if $ret;

    my $request = Plack::Request->new($env);
    #say Dumper $request;
    my $parameters = $request->parameters;
    for my $key (sort keys %$parameters) {
        my $val = $parameters->{$key} // '';
        #say STDERR "$key => $val";
    }
    for my $key (sort keys %{$request->uploads}) {
        my $val = $request->uploads->{$key} // '';
        #say STDERR "up: $key => $val";
    }

    my $cmd = $parameters->{cmd} // '';
    $self->{email} = $parameters->{email} // '';
    $self->{password} = $parameters->{password} // '';
    $self->{story} = $parameters->{story} // 0;
    $self->{story} =~ s/[^0-9]//g;
    $self->{pic} = $parameters->{pic} // 0;
    $self->{pic} =~ s/[^0-9]//g;

    my ($connect, $user, $pass) = connect_params($self);
    my $dbh = DBI->connect($connect, $user, $pass) or croak('no db');

    #say STDERR "email = $self->{email} cmd = $cmd and pic = $self->{pic}";
    return $self->public_pic($dbh) if (!$self->{email} and !$cmd and $self->{pic});

    # check that story id matches email and password
    
    my $sql = "select email,password,otsikko from tarinat where id='$self->{story}'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my ($e, $p, $otsikko) = $sth->fetchrow_array;
    return html200("<html>no such story: $self->{story}</html>") unless $e;
    return html200('<html>authentication error</html>') unless $e eq $self->{email} && $p eq $self->{password};

    return $self->pic($dbh) if (!$cmd and $self->{pic});

    my $delete = $self->delete_pic($dbh) if ($cmd eq 'del' and $self->{pic});
    
    my $upload = $request->uploads->{upload};
    my $upload_result = $self->upload($dbh, $upload) if $upload || $cmd eq 'lataa';

    my @pics = $self->pics($dbh);

    my $upload_form = [form => {enctype=>'multipart/form-data', method=>'post'},
                       [[input => {type=>'hidden', name=>'email', value=>$self->{email}}],
                        [input => {type=>'hidden', name=>'password', value=>$self->{password}}],
                        [input => {type=>'hidden', name=>'story', value=>$self->{story}}],
                        [input => {type=>'file', name=>'upload'}],
                        [input => {type=>'hidden', name=>'cmd', value=>'lataa'}],
                        [input => {type=>'submit', value=>'Lisää kuva tähän tarinaan'}]]];
    
    my @body = ([ h2 => $otsikko ]);
    push @body, $delete if $delete;
    push @body, $upload_result if $upload_result;
    push @body, [fieldset => $upload_form];
    push @body, @pics;

    $ret = HTML->new();
    $ret->element(html => [[ head => 
                             [[ meta => {'http-equiv'=>'Content-Type', content=>'text/html; charset=UTF-8'} ],
                              [ style => $self->{style} ],
                              [ title => $otsikko ]] ],
                           [ body => \@body ]]);
    return html200($ret->html);

}

sub content_type {
    return 'image/jpeg';
}

sub public_pic {
    my ($self, $dbh) = @_;
    my $sql = "select filename from kuvat,tarinat ".
        "where kuvat.id='$self->{pic}' and tarinat.id=kuvat.story and tarinat.public=TRUE";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my ($fn) = $sth->fetchrow_array;
    $self->return_400 unless defined $fn;
    $fn = $self->{config}{images}.'/'.$fn;
    #say STDERR $fn;
    Plack::App::File::serve_path($self, undef, $fn);
}

sub pic {
    my ($self, $dbh) = @_;
    my $sql = "select filename from kuvat where id='$self->{pic}'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my ($fn) = $sth->fetchrow_array;
    $self->return_400 unless defined $fn;
    $fn = $self->{config}{images}.'/'.$fn.'.jpg';
    Plack::App::File::serve_path($self, undef, $fn);
}

sub return_400 {
    my $self = shift;
    return [400, ['Content-Type' => 'text/plain', 'Content-Length' => 11], ['Bad Request']];
}

sub return_403 {
    my $self = shift;
    return [403, ['Content-Type' => 'text/plain', 'Content-Length' => 9], ['forbidden']];
}

sub delete_pic {
    my ($self, $dbh) = @_;
    my $sql = "select filename from kuvat where id='$self->{pic}'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my ($fn) = $sth->fetchrow_array;
    $fn = $self->{config}{images}.'/'.$fn;
    $sql = "delete from kuvat where id='$self->{pic}'";
    $sth = $dbh->do($sql) or croak($dbh->errstr);
    unlink $fn;
    return [p => 'Kuva poistettiin.'];
}

sub upload {
    my ($self, $dbh, $upload) = @_;

    return [font => {color => 'red'}, 
            'Valitse tiedosto ensin.']
                unless $upload;

    return [font => {color => 'red'}, 
            =>'Lähettämäsi kuva ei ole JPEG-muotoinen. Vain JPEG-kuvat kelpaavat toistaiseksi.']
                unless $upload->content_type eq 'image/jpeg';
    
    my $fn0 = $upload->path;
    my $fn = mktemp('XXXXXX', $self->{config}{images});

    # scale to max 480000 pixels
    system "convert $fn0 -resize 480000@\\> $self->{config}{images}/$fn.jpg";

    # remove the big file
    unlink $fn0;

    # save filename,story_id to the db
    my $sql = "insert into kuvat (story,filename) values ('$self->{story}','$fn')";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    return [p => 'Kuva lisättiin.'];
}

sub pics {
    my ($self, $dbh) = @_;
    my $sql = "select kuvat.id from kuvat,tarinat ".
        "where kuvat.story=tarinat.id and kuvat.story='$self->{story}' order by kuvat.id";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my @ret;
    my $i = 0;
    while (my($pic) = $sth->fetchrow_array) {
        $i++;
        push @ret, [fieldset => 
                    [[img => {src=>"$self->{config}{me}?story=$self->{story}&email=$self->{email}&password=$self->{password}&pic=$pic"}],
                     [form => {enctype=>'multipart/form-data', method=>'post'},
                      [[input => {type=>'hidden', name=>'email', value=>$self->{email}}],
                       [input => {type=>'hidden', name=>'password', value=>$self->{password}}],
                       [input => {type=>'hidden', name=>'story', value=>$self->{story}}],
                       [input => {type=>'hidden', name=>'pic', value=>$pic}],
                       [input => {type=>'hidden', name=>'cmd', value=>'del'}],
                       [input => {type=>'submit', value=>'Poista tämä kuva'}]]]]];
        push @ret, ['br'];
    }
    push @ret, [p => "Et ole liittänyt tähän tarinaan vielä yhtään kuvaa."] if $i == 0;
    return @ret;
}

1;
