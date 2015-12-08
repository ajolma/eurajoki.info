var map = null;
var proj = null;

(function() {
    boot_map({});
    $(window).resize(window_resize);
    window_resize();
}());

function window_resize() {
    $('#map').height($(window).height() - 30);
    $('#map').width($(window).width() - 200);
    if (map) map.updateSize();
}

function boot_map(options) {
    proj = projection(3067);
    
    map = new ol.Map({
        layers: [],
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

    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        var pixel = map.getEventPixel(evt.originalEvent);
        displayFeatureInfo(pixel);
    });

}

function layer_up(i) {
    var a = move_up(layers, i);
    addLayers(map, a, proj);
}

function layer_down(i) {
    var a = move_down(layers, i);
    addLayers(map, a, proj);
}

function layer_item(i, name, n) {
    var up_down = " ";
    if (i < n) up_down += element('input', {type:"button", value:'&uarr;', onclick:'layer_up('+(n-i)+')'}, '');
    if (i > 1) up_down += element('input', {type:"button", value:'&darr;', onclick:'layer_down('+(n-i)+')'}, '');
    var cb = element('input', {id:"visible"+i, class:"visible", type:"checkbox"}, name+up_down);
    cb = element('label', {class:"checkbox", for:"visible"+i}, cb);
    var range = 
        element('input', 
                {class:"opacity", type:"range", min:"0", max:"1", step:"0.01"}, 
                null);
    var item = 
        element('span', {}, name) + 
        element('div', {id:'layer'+i, class:'fs1'}, cb + range);

    return element('li', {id:'layer'+i}, cb + range);
}
