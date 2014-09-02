#!/usr/bin/perl -w

use utf8;
use strict;
use IO::Handle;
use Carp;
use Encode;
use CGI;

my $blank = '/var/www/images/256x256_blank.png';

# filesystem directory of the actual tiles
# note: the subdir must have the name of this program without ext
my $tiles = $0;
$tiles =~ s/\.pl$//;

my $q = CGI->new;
if ($ENV{REQUEST_METHOD} eq 'OPTIONS') {
    print $q->header(
	-type=>"text/plain", 
	-Access_Control_Allow_Origin=>'*',
	-Access_Control_Allow_Methods=>"GET,POST",
	-Access_Control_Allow_Headers=>"origin,x-requested-with,content-type",
	-Access_Control_Max_Age=>60*60*24
	);
} else {
    my $url_with_path = $q->url(-path_info=>1);

    my($ext) = $url_with_path =~ /\.(\w+)$/;
    my($path) = $url_with_path =~ /tiles\.pl(.*)$/;
    my $file = "$tiles/$path";
        
    if ($ext eq 'html' or $ext eq 'xml') {

        print 
            $q->header( -type => "text/$ext",
                        -charset=>'utf-8',
                        -Access_Control_Allow_Origin=>'*' );

    } else {

        $file = $blank unless -r $file;
        my $length = (stat($file))[7];
        
        print 
            $q->header( -type => 'image/png',
                        -expires => '+1y',
                        -Content_length => $length,
                        -Access_Control_Allow_Origin=>'*' );
    }

    if (-r $file) {
        binmode STDOUT;
        open (FH,'<', $file);
        my $buffer = "";
        while (read(FH, $buffer, 10240)) {
            print $buffer;
        }
        close(FH);
    }
}
