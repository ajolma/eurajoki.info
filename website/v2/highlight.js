var highlight = {layer:null,feature:null};

var popup;

function setupPopup() {

    var closer = document.getElementById('popup-closer');

    closer.onclick = function() {
        popup.setPosition(undefined);
        closer.blur();
        if (highlight.feature) {
            highlightedFeature.getSource().removeFeature(highlight.feature);
            highlight.feature = null;
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

    map.on('pointermove', function(evt) {
        if (evt.dragging) {
            return;
        }
        var pixel = map.getEventPixel(evt.originalEvent);
        var ret = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            return {layer:layer,feature:feature};
        });
        if (!ret) return;
        ret.layer = get_layer({layer:ret.layer});
        if (!(ret.layer && ret.feature)) return;
        if (ret.layer == highlight.layer && ret.feature == highlight.feature) return;
        ret.feature.layer = ret.layer;
        displayFeatureInfo(ret.layer, ret.feature);
        var content = $("#popup-content");
        content
            .css('width','auto')
            .css('height','auto');
        content.html(ret.layer.info(ret.feature));
        popup.setPosition(evt.coordinate);
    });

    map.on('singleclick', function(evt) {
        handleFeatureSelection();
    });
}

function handleFeatureSelection() {
    var src = selectedFeatures.getSource();
    var selected = false;
    src.forEachFeature(function(feature){
        if (feature == highlight.feature) {
            selected = true;
            return true;
        }
    });
    if (selected)
        src.removeFeature(highlight.feature);
    else
        src.addFeature(highlight.feature);
}

var displayFeatureInfo = function(layer, feature) {
    
    if (highlight.feature) {
        highlightedFeature.getSource().removeFeature(highlight.feature);
    }
    if (feature) {
        highlightedFeature.getSource().addFeature(feature);
    }
    highlight.layer = layer;
    highlight.feature = feature;

};
