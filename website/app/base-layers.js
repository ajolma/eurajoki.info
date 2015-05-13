/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

function taustakartat() {
    var layers = [];

    OpenLayers.Layer.MML = OpenLayers.Class(
        OpenLayers.Layer.XYZ,
        {
            name:"Maanmittauslaitos",
            attribution:'Sisältää Maanmittauslaitoksen aineistoa <a href="'+
                'http://www.maanmittauslaitos.fi/avoindata_lisenssi_versio1_20120501'+
                '">(lisenssi)</a>',
            sphericalMercator:true,
            url:'http://tiles.kartat.kapsi.fi/peruskartta/${z}/${x}/${y}.png',
            clone:function(obj){
                if(obj==null){
                    obj = new OpenLayers.Layer.MML(
                        this.name,this.url,this.getOptions()
                    );
                }
                obj=OpenLayers.Layer.XYZ.prototype.clone.apply(this,[obj]);
                return obj;
            },
            wrapDateLine:true,
            CLASS_NAME:"OpenLayers.Layer.MML"
        }
    );

    for (i = 0; i < config.baseLayers.length; i++) {

        if (config.baseLayers[i] == 'OpenStreetMap')
            layers.push(new OpenLayers.Layer.OSM("OpenStreetMap"));

        else if (config.baseLayers[i] == 'GoogleMap')
            layers.push(new OpenLayers.Layer.Google("Google Kartta", {
                numZoomLevels: config.numZoomLevels
            }));

        else if (config.baseLayers[i] == 'GoogleTerrain')
            layers.push(new OpenLayers.Layer.Google("Google Maasto", {
                type: google.maps.MapTypeId.TERRAIN,
                numZoomLevels: config.numZoomLevels
            }));

        else if (config.baseLayers[i] == 'GoogleSat')
            layers.push(new OpenLayers.Layer.Google("Google Satelliitti", {
                type: google.maps.MapTypeId.HYBRID,
                numZoomLevels: config.numZoomLevels
            }));
        
        else if (config.baseLayers[i] == 'MMLTausta')
            layers.push(new OpenLayers.Layer.MML("MML Taustakartta", [
                "http://tile1.kartat.kapsi.fi/1.0.0/taustakartta/${z}/${x}/${y}.png",
                "http://tile2.kartat.kapsi.fi/1.0.0/taustakartta/${z}/${x}/${y}.png"
            ], {
                numZoomLevels: config.numZoomLevels,
                sphericalMecator: true,
                transitionEffect: 'resize'
            }));
        
        else if (config.baseLayers[i] == 'MMLPerus')
            layers.push(new OpenLayers.Layer.MML("MML Peruskartta", [
                "http://tile1.kartat.kapsi.fi/1.0.0/peruskartta/${z}/${x}/${y}.png",
                "http://tile2.kartat.kapsi.fi/1.0.0/peruskartta/${z}/${x}/${y}.png"
            ], {
                numZoomLevels: config.numZoomLevels,
                sphericalMecator: true,
                transitionEffect: 'resize'
            }));
        
        else if (config.baseLayers[i] == 'MMLOrto')
            layers.push(new OpenLayers.Layer.MML("MML Ortokuva", [
                "http://tile1.kartat.kapsi.fi/1.0.0/ortokuva/${z}/${x}/${y}.png",
                "http://tile2.kartat.kapsi.fi/1.0.0/ortokuva/${z}/${x}/${y}.png"
            ], {
                numZoomLevels: config.numZoomLevels,
                sphericalMecator: true,
                transitionEffect: 'resize',
                visibility: false
            }));
        
        else if (config.baseLayers[i] == 'Mapbox')
            layers.push(new OpenLayers.Layer.XYZ(
                'Mapbox',
                [
                    "http://api.tiles.mapbox.com/v4/mapbox.streets/${z}/${x}/${y}.png?access_token=pk.eyJ1IjoiYWpvbG1hIiwiYSI6InJ2MkxZRmMifQ.e2Xel3UioA_2yE4gQEgXMA"
                ], {
                    attribution: "Tiles &copy; <a href='http://mapbox.com/'>MapBox</a>",
                    sphericalMercator: true,
                    wrapDateLine: true,
                    numZoomLevels: config.numZoomLevels,
                    visibility: false
                }
            ));

        else if (config.baseLayers[i] == 'Thunderforest maasto')
            layers.push(new OpenLayers.Layer.XYZ(
                'Thunderforest maasto',
                [
                    "http://tile.thunderforest.com/landscape/${z}/${x}/${y}.png"
                ], {
                    attribution: '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors,<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
                    sphericalMercator: true,
                    wrapDateLine: true,
                    numZoomLevels: config.numZoomLevels,
                    visibility: false
                }
            ));

    }
    
    return layers;
}
