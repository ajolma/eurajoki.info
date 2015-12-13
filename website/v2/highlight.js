var sensorLayer = null;
var highlightStyleCache = {};
var selectedStyleCache = {};
var featureOverlay;
var selectedFeatures;
var highlight;
var popup;

function setupPopup() {

    var closer = document.getElementById('popup-closer');

    closer.onclick = function() {
        popup.setPosition(undefined);
        closer.blur();
        if (highlight) {
            featureOverlay.getSource().removeFeature(highlight);
            highlight = null;
        }
        return false;
    };
    
    popup = new ol.Overlay(({
        element: $('#popup').get(0),
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    }));

}

function setupFeatureOverlay(map) {

    featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: map,
        style: function(feature, resolution) {
            var key = feature.layer.title + feature.get('id');
            var text = resolution < 8 ? feature.get('id') : '';
            if (!highlightStyleCache[key]) {
                highlightStyleCache[key] = feature.layer.highlight(feature, text);
            }
            return highlightStyleCache[key];
        }
    });

    selectedFeatures = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: map,
        style: function(feature, resolution) {
            var key = feature.layer.title + feature.get('id');
            var text = resolution < 8 ? feature.get('id') : '';
            if (!selectedStyleCache[key]) {
                selectedStyleCache[key] = feature.layer.selected(feature, text);
            }
            return selectedStyleCache[key];
        }
    });

    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        var pixel = map.getEventPixel(evt.originalEvent);
        var feature = displayFeatureInfo(pixel);
        if (feature) {
            var content = $("#popup-content");
            content
                .css('width','auto')
                .css('height','auto');
            content.html(feature.layer.info(feature));
            popup.setPosition(evt.coordinate);
        }
    });

    map.on('singleclick', function(evt) {
        handleFeatureSelection();
    });
}

function handleFeatureSelection() {
    var src = selectedFeatures.getSource();
    var selected = false;
    src.forEachFeature(function(feature){
        if (feature == highlight) {
            selected = true;
            return true;
        }
    });
    if (selected)
        src.removeFeature(highlight);
    else
        src.addFeature(highlight);
}

function allFeatures() {
    sensorLayer.getSource().getFeatures();
}

function selectFeature(feature) {
    selectedFeatures.getSource().addFeature(feature);
}

function unselectFeature(feature) {
    selectedFeatures.getSource().removeFeature(feature);
}

function unselectAllFeatures() {
    selectedFeatures.getSource().clear();
}

var displayFeatureInfo = function(pixel) {
    var layer = null;
    var feature = null;
    if (pixel) {
        var ret = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            return [layer, feature];
        });
        if (!ret) return;
        layer = get_layer({layer:ret[0]});
        feature = ret[1];
        if (!(feature && layer && layer.info)) return;
    }

    /*
    var info = document.getElementById('info');
    if (feature && layer && layer.info) {
        info.innerHTML = layer.info(feature);
    } else {
        info.innerHTML = '&nbsp;';
    }
    */
    
    if (feature !== highlight) {
        if (highlight) {
            featureOverlay.getSource().removeFeature(highlight);
        }
        if (feature) {
            feature.layer = layer;
            featureOverlay.getSource().addFeature(feature);
        }
        highlight = feature;
        return feature;
    }
};
