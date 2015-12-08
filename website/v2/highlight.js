var highlightStyleCache = {};
var featureOverlay;

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
}

var highlight;
var displayFeatureInfo = function(pixel) {
    
    var layer = null;
    var feature = null;
    if (pixel) {
        var ret = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            return [layer, feature];
        });
        if (!ret) return;
        layer = get_layer(ret[0]);
        feature = ret[1];
        if (!(feature && layer && layer.info)) return;
    }
    
    var info = document.getElementById('info');
    if (feature && layer && layer.info) {
        info.innerHTML = layer.info(feature);
    } else {
        info.innerHTML = '&nbsp;';
    }
    
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
