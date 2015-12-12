var map = null;
var proj = null;
var plot = false;

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

function toggle_plot() {
    var plot = $('.plot');
    var hw = $(window).height() - 30;
    var h = plot.height();
    var hm = hw/2.5;
    if (h == 0) {
        hw -= hm;
        h = hm;
    } else {
        h = 0;
    }
    if (map) {
        var s = map.getSize();
        map.getView().setCenter(map.getCoordinateFromPixel([s[0]/2,hw/2]));
    }
    $('.gis').animate({height:hw}, 500);
    if (h == 0)
        plot.animate({height:h}, 500);
    else
        plot.animate({height:h}, 500, 'swing', show_plot);
    $('#map')
        .height(hw)
        .width($(window).width() - 200);
    if (map) {
        map.updateSize();
    }
}

function show_plot() {
    //content.innerHTML = 'BOOM!';
    
    var d1 = [];
    for (var i = 0; i < 14; i += 0.5) {
	d1.push([i, Math.sin(i)]);
    }
    
    var d2 = [[0, 3], [4, 8], [8, 5], [9, 13]];
    
    // A null signifies separate line segments
    
    var d3 = [[0, 12], [7, 12], null, [7, 2.5], [12, 2.5]];
  
    $.plot(".plot", [ d1, d2, d3 ]);

}

var container;
var content;
var closer;

function boot_map(options) {
    proj = projection(3067);

    container = document.getElementById('popup');
    content = document.getElementById('popup-content');
    closer = document.getElementById('popup-closer');

    closer.onclick = function() {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
    };

    var overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ ({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));
    
    map = new ol.Map({
        layers: [],
        overlays: [overlay],
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
        var feature = displayFeatureInfo(pixel);
        if (feature) {
            $("#popup-content").css('width','auto');
            $("#popup-content").css('height','auto');
            content.innerHTML = feature.layer.info(feature)+'<p><input type="button" value="katso dataa" onclick="expand()"></p>';
            overlay.setPosition(evt.coordinate);
        }
    });

    map.on('--singleclick', function(evt) {
        var coordinate = evt.coordinate;
        content.innerHTML = '<p><input type="button" value="click" onclick="expand()"></p>';
        overlay.setPosition(coordinate);
    });

}

function expand() {
    //content.innerHTML = 'BOOM!';
    
    var d1 = [];
    for (var i = 0; i < 14; i += 0.5) {
	d1.push([i, Math.sin(i)]);
    }
    
    var d2 = [[0, 3], [4, 8], [8, 5], [9, 13]];
    
    // A null signifies separate line segments
    
    var d3 = [[0, 12], [7, 12], null, [7, 2.5], [12, 2.5]];

    $("#popup-content").width(500);
    $("#popup-content").height(300);
    
    $.plot("#popup-content", [ d1, d2, d3 ]);

}

function layer_up(i) {
    var a = move_up(layers, i);
    addLayers(map, a, proj);
}

function layer_down(i) {
    var a = move_down(layers, i);
    addLayers(map, a, proj);
}
