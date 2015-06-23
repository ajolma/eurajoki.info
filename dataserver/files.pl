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

my $me = 'http://54.247.187.88/Eurajoki/files.pl';
my $image_path = '/l/www/image-store';

my $style = '<style>.image{';
$style .= 'text-align:center;';
$style .= 'border:2px solid green;';
$style .= 'margin:5px;';
$style .= 'padding:5px;';
$style .= '}</style>';

my $q = CGI->new;
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
    page();
}

sub page {
    my $db = `grep local-eurajoki-ltd /var/www/etc/dbi`;
    chomp $db;
    my(undef, $connect, $user, $pass) = split /\s+/, $db;
    my $dbh = DBI->connect($connect, $user, $pass) or croak('no db');

    my $fh = $q->upload('upload');
    my $story = $q->param('story') || ''; # story id
    $story =~ s/[^0-9]//g;
    $story = 0 unless $story;
    my $pic = $q->param('pic') || 0; # pic id
    $pic =~ s/[^0-9]//g;
    my $cmd = $q->param('cmd');
    #print STDERR "story=$story\n";

    if (!$email and !$cmd and $pic) {
        public_pic($dbh, $pic);
        return;
    }
    
    # if no email is given, return public pics of the story
    if (!$email) {
        public_pics($dbh, $story);
        return;
    }
    
    # check that story id matches email and password
    
    my $sql = "select email,password,otsikko from tarinat where id='$story'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my($e,$p,$otsikko) = $sth->fetchrow_array;
    unless ($e) {
        print $html_header,"<html>no such story: $story</html>";
        return;
    }
    unless ($e eq $email and $p eq $password) {
        print $html_header,'<html>authentication error</html>';
        return;
    }

    if (!$cmd and $pic) {
        pic($dbh, $pic);
        return;
    }

    if ($cmd and $cmd eq 'del' and $pic) {
        delete_pic($dbh, $pic);
    }
    
    print 
        $html_header,
        "<html>\n",
        "<head>\n",
        "<meta http-equiv='Content-Type' content='text/html; charset=UTF-8' />\n",
        "<title>$otsikko</title>\n",
        "</head>\n",
        "<body><h2>$otsikko</h2>\n";

    upload_form($dbh, $story);
    if (defined $fh) {
        upload($dbh, $fh, $story);
    }
     
    pics($dbh, $story);
    
    print "</body></html>";

}

sub public_pics {
    my($dbh, $story) = @_;
    my $sql = "select otsikko from tarinat where tarinat.id='$story'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my($title) = $sth->fetchrow_array;
    $title = '' | $title;
    print 
        $html_header,
        '<html>',
        '<head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />',
        '<title>Eurajoki.info | ',$title,'</title>',
        $style,
        '</head>',
        '<body>',
        '<h1>Eurajoki.info: Tarina "',$title,'"</h1>';
    $sql = "select kuvat.id,filename from kuvat,tarinat ".
        "where kuvat.story=tarinat.id and tarinat.public and kuvat.story='$story' order by kuvat.id";
    $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    $rv = $sth->execute or croak($dbh->errstr);
    my $i = 0;
    while (my($pic,$fn) = $sth->fetchrow_array) {
        my $file = `identify $image_path/$fn`;
        #print STDERR "$file\n";
        my($w,$h) = $file =~ / (\d+)x(\d+) /;
        $i++;
        print "<div class=\"image\"><img src=\"files.pl?pic=$pic\" width=\"$w\" height=\"$h\" /></div>";
    }
    if ($i == 0) {
        print "Tähän tarinaan ei ole liitetty vielä yhtään kuvaa.";
    }
    print '</body></html>';
}

sub pics {
    my($dbh, $story) = @_;
    my $sql = "select kuvat.id from kuvat,tarinat ".
        "where kuvat.story=tarinat.id and kuvat.story='$story' order by kuvat.id";
    #print STDERR "$sql\n";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my $i = 0;
    while (my($pic) = $sth->fetchrow_array) {
        $i++;
        print "<fieldset>";
        print "<img src=\"$me?story=$story&email=$email&password=$password&pic=$pic\" />\n";
        print 
            "<form enctype='multipart/form-data' action='$me' method='post'>\n",
            "<input type='hidden' name='email' value='$email'/>\n",
            "<input type='hidden' name='password' value='$password'/>\n",
            "<input type='hidden' name='story' value='$story'/>\n",
            "<input type='hidden' name='pic' value='$pic'/>\n",
            "<input type='hidden' name='cmd' value='del'/>\n",
            "<input type='submit' value='Poista tämä kuva' />\n",
            "</form>\n",
            "</fieldset>";
        print "<br />\n";
    }
    if ($i == 0) {
        print "Et ole liittänyt tähän tarinaan vielä yhtään kuvaa.";
    }
}

sub upload_form {
    my($dbh, $story) = @_;
    print 
        "<fieldset>\n",
        "<form enctype='multipart/form-data' action='$me' method='post'>\n",
        "<input type='hidden' name='email' value='$email'/>\n",
        "<input type='hidden' name='password' value='$password'/>\n",
        "<input type='hidden' name='story' value='$story'/>\n",
        "<input type='file' name='upload' />\n",
        "<input type='submit' value='Lisää kuva tähän tarinaan' />\n",
        "</form>\n",
        "</fieldset>\n";
}

sub upload {
    my($dbh, $fh, $story) = @_;

    my $io_handle = $fh->handle;
    
    # store with unique filename
    my $fn = int (gettimeofday * 1000);
    open (OUTFILE,'>',"$image_path/$fn");
    my $buffer;
    while ($io_handle->read($buffer,1024)) {
        print OUTFILE $buffer;
    }
    close OUTFILE;

    # identify
    my @identify = split / /, `identify $image_path/$fn`;
    unless ($identify[1] eq 'JPEG') {
        print STDERR "@identify\n";
        print 'Lähettämäsi kuva ei ole JPEG-muotoinen. Vain JPEG-kuvat kelpaavat toistaiseksi.';
        return;
    }

    # scale to max 480000 pixels
    system "convert $image_path/$fn -resize 480000@\\> $image_path/r$fn";

    # remove the big file
    unlink "$image_path/$fn";

    # save filename,story_id to the db
    my $sql = "insert into kuvat (story,filename) values ('$story','r$fn')";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);

}

sub delete_pic {
    my($dbh, $pic) = @_;
    my $sql = "select filename from kuvat where id='$pic'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my($fn) = $sth->fetchrow_array;
    $sql = "delete from kuvat where id='$pic'";
    $sth = $dbh->do($sql) or croak($dbh->errstr);
    unlink "$image_path/$fn";
}

sub pic {
    my($dbh, $pic) = @_;
    my $sql = "select filename from kuvat where id='$pic'";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my($fn) = $sth->fetchrow_array;

    my $file = "$image_path/$fn";
    my $length = (stat($file)) [10];
    print "Content-type: image/jpeg\n";
    print "Content-length: $length \n\n";
    binmode STDOUT;
    open (FH,'<', $file) || die "Could not open $file: $!";
    my $buffer = "";
    while (read(FH, $buffer, 10240)) {
        print $buffer;
    }
    close(FH);
}

sub public_pic {
    my($dbh, $pic) = @_;
    my $sql = 
        "select filename from kuvat,tarinat ".
        "where kuvat.id='$pic' and tarinat.id=kuvat.story and tarinat.public=TRUE";
    my $sth = $dbh->prepare($sql) or croak($dbh->errstr);
    my $rv = $sth->execute or croak($dbh->errstr);
    my($fn) = $sth->fetchrow_array;

    my $file = "$image_path/$fn";
    my $length = (stat($file)) [10];
    print "Content-type: image/jpeg\n";
    #print "Content-length: $length\n"; # Chrome doesn't like this
    print "\n";
    binmode STDOUT;
    open (FH,'<', $file) || die "Could not open $file: $!";
    my $buffer = "";
    while (read(FH, $buffer, 10240)) {
        print $buffer;
    }
    close(FH);
}
