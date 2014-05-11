function init() {

    map = map();

    var layers = taustakartat();
    map.addLayers(layers);
    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;

    var overlayers = overlays();
    
    map.addLayers(overlayers);

}
