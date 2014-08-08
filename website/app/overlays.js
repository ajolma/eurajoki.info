var overlay_server = 'ajolma.net';

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

    return [ilmakuvat,perus62,senaatin];
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
