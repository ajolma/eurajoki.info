/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

function styleMap(options) {
    options = $.extend({graphic: 'star', pointRadius: 10}, options);
    var style = function(color) {
        this.fillOpacity = 1;
        this.graphicOpacity = 1;
        this.strokeColor = "black";
        this.fillColor = color;
        this.graphicName = options.graphic;
        this.pointRadius = options.pointRadius;
        this.strokeWidth = 1;
        this.rotation = 0;
        this.strokeLinecap = "butt";
    };
    return new OpenLayers.StyleMap({
        'default':   new OpenLayers.Style(new style("lightblue", options.graphic)),
        'temporary': new OpenLayers.Style(new style("yellow", options.graphic)),
        'select':    new OpenLayers.Style(new style("red", options.graphic))        
    });
}
    
function overlays() {

    var ilmakuvat = new OpenLayers.Layer.TMS("Ilmakuvat", "", {
        serviceVersion: '.',
        layername: '.',
        myUrl: config.url.overlay_tiles+'/ilmakuvat3857/',
        alpha: true,
        type: 'png',
        isBaseLayer: false,
        getURL: getURL,
        visibility: false
    });

    var perus62 = new OpenLayers.Layer.TMS("Peruskartta 1962", "", {
        serviceVersion: '.',
        layername: '.',
        myUrl: config.url.overlay_tiles+'/peruskartta62_3857/',
        alpha: true,
        type: 'png',
        isBaseLayer: false,
        getURL: getURL,
        visibility: false
    });

    var senaatin = new OpenLayers.Layer.TMS("Senaatin kartat", "", {
        serviceVersion: '.',
        layername: '.',
        myUrl: config.url.overlay_tiles+'/senaatin_kartat_3857/',
        alpha: true,
        type: 'png',
        isBaseLayer: false,
        getURL: getURL,
        visibility: false
    });

    return [senaatin,perus62,ilmakuvat];
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
