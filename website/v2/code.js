var map = null;
var proj = null;

(function() {
    boot_map({});
    $(window).resize(window_resize);
    window_resize();
}());

function window_resize() {
    $('#map')
        .height($(window).height() - 30 - $('.plot').height())
        .width($(window).width() - 200);
    if (map) map.updateSize();
}

function boot_map(options) {
    proj = projection(3067);

    setupPopup();
    
    map = new ol.Map({
        layers: [],
        overlays: [popup],
        target: 'map',
        controls: ol.control.defaults({
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                collapsible: false
            })
        }),
        view: proj.view
    });
    
    map.addLayer(layer({bg: 'mml'}, proj));

    addLayers(map, layers, proj);

    setupFeatureOverlay(map);
    
    setupDates();

    setupSensors();
    sensorLayer = get_layer({title:'Mittauspisteet'}).layer;
    sensors.sensors = sensorLayer.getSource();
    sensors.select = selectFeature;
    sensors.unselect = unselectFeature;
    sensors.unselectAll = unselectAllFeatures;

}

function layer_up(i) {
    var a = move_up(layers, i);
    addLayers(map, a, proj);
}

function layer_down(i) {
    var a = move_down(layers, i);
    addLayers(map, a, proj);
}
