var map = null;
var proj = null;

(function() {
    boot_map({});
    $(window).resize(window_resize);
    window_resize();
}());

function window_resize() {
    var h = $(window).height() - 30 - $('.plot').height();
    $('#map')
        .height(h)
        .width($(window).width() - 200);
    $('.right').css('max-height', h);
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
            attributionOptions:{
                collapsible: false
            }
        }),
        view: proj.view
    });
    
    map.addLayer(layer({bg: 'mml'}, proj));

    addLayers(map, layers, proj);

    setupFeatureOverlay(map);
    
    setupDates();

    setupSensors();
    sensorLayer = get_layer({title:'Mittauspisteet'});

}

function layer_up(i) {
    var a = move_up(layers, i);
    addLayers(map, a, proj);
}

function layer_down(i) {
    var a = move_down(layers, i);
    addLayers(map, a, proj);
}
