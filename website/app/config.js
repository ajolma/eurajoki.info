//var server = 'ajolma.net';
//var server = '54.247.187.88';

var wfs_server = 'localhost';
var story_wfs_server = 'ajolma.net';
var sos_server = 'localhost';
var story_server = 'ajolma.net';
var picture_server = 'ajolma.net';
var overlay_server = 'ajolma.net';
var vegetation_server = 'localhost';    

//var mittarit_prefix = 'ej';
var mittarit_prefix = 'local';
var stories_prefix = 'ej';
var sensor_layer_prefix = 'local';
var vegetation_prefix = 'local';

var wfs_url = 'http://'+wfs_server+'/Eurajoki/wfs.pl';
var story_wfs_url = 'http://'+story_wfs_server+'/Eurajoki/wfs.pl';
var sos_url = 'http://'+sos_server+'/Eurajoki/m5json.pl?raaka='+raaka+'&';
var story_url = 'http://'+story_server+'/Eurajoki/stories.pl';
var picture_url = 'http://'+picture_server+'/Eurajoki/files.pl';
var vegetation_url = 'http://'+vegetation_server+'/Eurajoki/data.pl?';
var overlay_url = 'http://'+overlay_server+'/Eurajoki';
