/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var base = 'http://biwatech.com:800/Eurajoki';
var config;

function config() {
    config = {
        numZoomLevels: 20,
        baseLayers: [
            'MMLTausta',
            'MMLPerus',
            'MMLOrto',
            'GoogleMap',
            'GoogleTerrain',
            'GoogleSat',
            'OpenStreetMap'
        ],
        featureSize: 13,
        editor: 0,
        paikka: [],
        suure: [],
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
    config.url = {
        // WFS
        mittauspisteet: base+'/WFS',
        tarinapaikat: base+'/WFS',
        joki: base+'/WFS',
        biwa_wfs_2: base+'/WFS',

        // TMS
        overlay_tiles: base+'/TMS',

        // other
        data: base+'/tss?',
        kasvillisuus: base+'/veg?',
        tarina: base+'/sto',
        kuva: base+'/pic?',
        
    };
    config.featureType = {
        sensors: 'ej.mittauskohteet2.geom',
        tarinapaikat_private: 'ej.tarinat.geom',
        tarinapaikat_public: 'ej.public_tarinat3.geom',
        joki: 'ej.joki.geom'
    };
}
