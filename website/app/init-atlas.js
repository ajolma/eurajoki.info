
function init() {

    map = map();

    var layers = taustakartat();
    map.addLayers(layers);
    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    var mapBounds = new OpenLayers.Bounds( 21.5798382016, 61.0956560342, 22.1885815539, 61.2629872636);
    var mapMinZoom = 9;
    var mapMaxZoom = 18;
    var emptyTileURL = "http://www.maptiler.org/img/none.png";
    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;

    var tms = new OpenLayers.Layer.TMS("Ilmakuvat", "", {
        serviceVersion: '.',
        layername: '.',
        alpha: true,
        type: 'png',
        isBaseLayer: false,
        getURL: getURL
    });
    
    /*
    if (OpenLayers.Util.alphaHack() == false) {
        tms.setOpacity(0.7);
    }
    */

    map.addLayer(tms);

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
        var url = 'http://54.247.187.88/Eurajoki-aerial-images/tiles/';
        if (OpenLayers.Util.isArray(url)) {
            url = this.selectUrl(path, url);
        }
        return url + path;
        // mapBounds is WGS and bounds is 3857 ??
        if (mapBounds.intersectsBounds(bounds) && (z >= mapMinZoom) && (z <= mapMaxZoom)) {
            return url + path;
        } else {
            return emptyTileURL;
        }
    } 

}
