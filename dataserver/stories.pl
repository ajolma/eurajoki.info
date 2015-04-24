#!/usr/bin/perl -w

# This file is part of eurajoki.info
# https://github.com/ajolma/eurajoki.info
# Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2

#use utf8;
use strict;
use IO::Handle;
use Carp;
use Encode;
use File::Copy;
use Time::HiRes qw/gettimeofday/;
use DBI;
use CGI;

#binmode STDERR, ":utf8";
#binmode STDOUT, ":utf8";

my $q = CGI->new;
my $me = $q->self_url;
my $email = $q->param('email');
my $password = $q->param('password');
    
my $xml_header = $q->header( -type => 'text/xml', 
                             -charset=>'utf-8',
                             -expires=>'+1s',
                             -Access_Control_Allow_Origin=>'*' );

my $plain_header = $q->header( -type => 'text/plain', 
                               -charset=>'utf-8',
                               -expires=>'+1s',
                               -Access_Control_Allow_Origin=>'*' );

my $html_header = $q->header( -type => 'text/html', 
                              -charset=>'utf-8',
                              -expires=>'+1s',
                              -Access_Control_Allow_Origin=>'*' );

if ($ENV{REQUEST_METHOD} eq 'OPTIONS') {
    print $q->header(
	-type=>"text/plain", 
	-Access_Control_Allow_Origin=>'*',
	-Access_Control_Allow_Methods=>"GET,POST",
	-Access_Control_Allow_Headers=>"origin,x-requested-with,content-type",
	-Access_Control_Max_Age=>60*60*24
	);
} else {
    eval {
        page();
    };
    print $html_header, $@ if $@;
}

sub page {
    my $db = `grep local-eurajoki-ltd /var/www/etc/dbi`;
    chomp $db;
    my(undef, $connect, $user, $pass) = split /\s+/, $db;
    my $dbh = DBI->connect($connect, $user, $pass) or croak('connection to database failed');
    $dbh->{pg_enable_utf8} = 1;

    my $story = $q->param('story'); # story id
    $story =~ s/[^0-9]//g;
    $story = 0 unless $story;
    my $cmd = $q->param('cmd');
  
    # check that story id matches email and password
    
    my $sql = "select email,password from tarinat where id='$story'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my($e,$p) = $sth->fetchrow_array;
    unless ($e) {
        print $html_header,"<html>no such story: $story</html>";
        return;
    }
    unless ($e eq $email and $p eq $password) {
        print $html_header,'<html>authentication error</html>';
        return;
    }

    if ($cmd and $cmd eq 'del') {
        $sql = "delete from kuvat where story='$story'";
        $sth = $dbh->do($sql) or croak($dbh->errstr);
        $sql = "delete from tarinat where id='$story'";
        $sth = $dbh->do($sql) or croak($dbh->errstr);
        print 
            $html_header,
            "<html>\n",
            "<head>\n",
            "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8' />\n",
            "<title>Tarinat</title>\n",
            "</head>\n",
            "<body>Tarina poistettiin. Päivitä tarinakartta niin se poistuu siitä.\n",
            "</body></html>";
        return;
    }

    if ($cmd and $cmd eq 'save') {
        my $otsikko = decode utf8=>$q->param('otsikko');
        my $tarina = decode utf8=>$q->param('tarina');
        $sql = "update tarinat set otsikko='$otsikko',story='$tarina' where id='$story'";
        $sth = $dbh->do($sql) or croak($dbh->errstr);
    }
    
    $sql = "select otsikko,story from tarinat where id='$story'";
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    my($otsikko,$tarina) = $sth->fetchrow_array;
    $otsikko = '' unless defined $otsikko;
    $tarina = '' unless defined $tarina;
    $otsikko = encode('utf8',$otsikko);
    $tarina = encode('utf8',$tarina);

    print 
        $html_header,
        "<html>\n",
        "<head>\n",
        "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8' />\n",
        "<title>$otsikko</title>\n",
        "</head>\n",
        "<body><h2>$otsikko</h2>\n";

    print 
        "<fieldset>",
        "<form enctype='multipart/form-data' action='$me' method='post'>\n",
        "<input type='hidden' name='email' value='$email'/>\n",
        "<input type='hidden' name='password' value='$password'/>\n",
        "<input type='hidden' name='story' value='$story'/>\n",
        "<input type='hidden' name='cmd' value='save'/>\n",
        "Otsikko: <br /><input type='text' size='60' name='otsikko' value='$otsikko'/><br />\n",
        "Tarina:<br /><textarea rows='10' cols='60' name='tarina'>$tarina</textarea><br />\n",
        "<input type='submit' value='Tallenna tarina' />\n",
        "</form>\n",
        "</fieldset>";
    
    print "</body></html>";

}

