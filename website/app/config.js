/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

/* these two functions are from stackoverflow */

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

function params() {
    // This function is anonymous, is executed immediately and 
    // the return value is assigned to QueryString!
    var query_string = {};
    var query = decodeURIComponent(window.location.search.substring(1));
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        pair[0] = pair[0].replace("[]", ""); // php...
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = pair[1];
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]], pair[1] ];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(pair[1]);
        }
    } 
    return query_string;
}

var config;

function config() {
    config = {raaka: 0,
              app: 'Eurajoki',
              editor: 0,
              paikka: [],
              suure: [],
              server: {
                  wfs: {mittauspisteet: 'localhost',tarinapaikat: 'ajolma.net'},
                  data: 'localhost',
                  tarina: 'ajolma.net',
                  kuva: 'ajolma.net',
                  kasvillisuus: 'localhost',
                  overlay: 'ajolma.net'
              },
              prefix: {
                  mittauspisteet: 'local',
                  tarinapaikat: 'ej',
                  joki: 'local'
              },
              from: 0,
              to: 0
             };
    config = $.extend(config, params());
    if( typeof config.paikka === 'string' ) {
        config.paikka = [ config.paikka ];
    }
    if( typeof config.suure === 'string' ) {
        config.suure = [ config.suure ];
    }
    config.url = {mittauspisteet: 'http://'+config.server.wfs.mittauspisteet+'/'+config.app+'/wfs.pl',
                  tarinapaikat: 'http://'+config.server.wfs.tarinapaikat+'/'+config.app+'/wfs.pl',
                  joki: 'http://'+config.server.wfs.mittauspisteet+'/'+config.app+'/wfs.pl',
                  data: 'http://'+config.server.data+'/'+config.app+'/m5json.pl?raaka='+config.raaka+'&',
                  tarina: 'http://'+config.server.tarina+'/'+config.app+'/stories.pl',
                  kuva: 'http://'+config.server.kuva+'/'+config.app+'/files.pl',
                  kasvillisuus: 'http://'+config.server.kasvillisuus+'/'+config.app+'/data.pl?',
                  overlay: 'http://'+config.server.overlay+'/'+config.app
                 };
}
