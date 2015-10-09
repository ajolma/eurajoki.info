/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var config;

function config() {
    config = {numZoomLevels: 20,
              baseLayers: [
                  'GoogleMap',
                  'GoogleTerrain',
                  'GoogleSat',
                  'OpenStreetMap',
                  'MMLTausta',
                  'MMLPerus',
                  'MMLOrto'                  
              ],
              overlays: {
                  Vegetation: 0
              },
              featureSize: 13,
              raaka: 0,
              app: 'Eurajoki',
              editor: 0,
              paikka: [],
              suure: [],
              server: {
                  wfs: {mittauspisteet: 'ajolma.net',tarinapaikat: 'ajolma.net',joki: 'localhost'},
                  data: 'ajolma.net',
                  tarina: 'ajolma.net',
                  kasvillisuus: 'localhost',
                  kuva: 'ajolma.net',
                  overlay_tiles: 'ajolma.net'
              },
              prefix: {
                  mittauspisteet: 'ej',
                  tarinapaikat: 'ej',
                  joki: 'local'
              },
              layer : {
                  mittauspisteet: 'mittauskohteet2.geom'
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
    // hack for fb sharer
    if (config.suure.length == 0) {
        var i;
        for (i = 0; i < 20; i++) {
            var prop = 'suure'+i;
            if (prop in config) {
                config.suure.push(config[prop]);
            }
        }
    }
    if (config.paikka.length == 0) {
        var i;
        for (i = 0; i < 20; i++) {
            var prop = 'paikka'+i;
            if (prop in config) {
                config.paikka.push(config[prop]);
            }
        }
    }
    // hack ends
    config.url = {mittauspisteet: 'http://'+config.server.wfs.mittauspisteet+'/'+config.app+'/wfs.pl',
                  tarinapaikat: 'http://'+config.server.wfs.tarinapaikat+'/'+config.app+'/wfs.pl',
                  joki: 'http://'+config.server.wfs.joki+'/'+config.app+'/wfs.pl',
                  data: 'http://'+config.server.data+'/'+config.app+'/m5json.pl?raaka='+config.raaka+'&',
                  tarina: 'http://'+config.server.tarina+'/'+config.app+'/stories.pl',
                  kuva: 'http://'+config.server.kuva+'/'+config.app+'/files.pl',
                  kasvillisuus: 'http://'+config.server.kasvillisuus+'/'+config.app+'/data.pl?',
                  overlay_tiles: 'http://'+config.server.overlay_tiles+'/'+config.app
                 };
    config.featureType = {sensors: config.prefix.mittauspisteet+"."+config.layer.mittauspisteet
                         };
}
