/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var overlay_server = 'ajolma.net';
var river_layer = null;

function overlays() {

    var ilmakuvat = new OpenLayers.Layer.TMS("Ilmakuvat", "", {
        serviceVersion: '.',
        layername: '.',
        myUrl: 'http://'+overlay_server+'/Eurajoki/aerial-images/tiles.pl/',
        alpha: true,
        type: 'png',
        isBaseLayer: false,
        getURL: getURL,
        visibility: false
    });

    var perus62 = new OpenLayers.Layer.TMS("Peruskartta 1962", "", {
        serviceVersion: '.',
        layername: '.',
        myUrl: 'http://'+overlay_server+'/Eurajoki/peruskartat_1962/tiles.pl/',
        alpha: true,
        type: 'png',
        isBaseLayer: false,
        getURL: getURL,
        visibility: false
    });

    var senaatin = new OpenLayers.Layer.TMS("Senaatin kartat", "", {
        serviceVersion: '.',
        layername: '.',
        myUrl: 'http://'+overlay_server+'/Eurajoki/senaatin_kartat/tiles.pl/',
        alpha: true,
        type: 'png',
        isBaseLayer: false,
        getURL: getURL,
        visibility: false
    });

    MyStyle = function(color,graphic) {
        this.fillOpacity = 0.2;
        this.graphicOpacity = 1;
        this.strokeColor = color;
        this.fillColor = color;
        this.graphicName = graphic;
        this.pointRadius = 10;
        this.strokeWidth = 3;
        this.rotation = 45;
        this.strokeLinecap = "butt";
    };

    var styleMap = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style(new MyStyle("blue","star")),
        select: new OpenLayers.Style(new MyStyle("red","star")),
        temporary: new OpenLayers.Style(new MyStyle("yellow","star"))
    });

    var server = 'localhost';
    var wfs_server = 'http://'+server+'/Eurajoki/wfs.pl';
    river_layer = new OpenLayers.Layer.Vector("Kasvillisuus", {
        strategies: [
            new OpenLayers.Strategy.BBOX(),
            new OpenLayers.Strategy.Fixed()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: wfs_server,
            featureType: "local.jokipalat.geom",
            outputFormat: "GML2"
        }),
        visibility: true,
        extractAttributes: true,
        styleMap: styleMap
    });

    return [ilmakuvat,perus62,senaatin,river_layer];
}

function getURL(bounds) {
    bounds = this.adjustBounds(bounds);
    var res = this.getServerResolution();
    var x = Math.round((bounds.left - this.tileOrigin.lon) / (res * this.tileSize.w));
    var y = Math.round((bounds.bottom - this.tileOrigin.lat) / (res * this.tileSize.h));
    var z = this.getServerZoom();
    if (this.map.baseLayer.CLASS_NAME === 'OpenLayers.Layer.Bing') {
        z+=1;
    }
    var path = this.serviceVersion + "/" + this.layername + "/" + z + "/" + x + "/" + y + "." + this.type; 
    return this.myUrl + path;
}
