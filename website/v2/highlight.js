var highlightStyleCache = {};
var featureOverlay;

function setupFeatureOverlay(map) {
    featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: map,
        style: function(feature, resolution) {
            var text = resolution < 8 ? feature.get('id') : '';
            if (!highlightStyleCache[text]) {
                highlightStyleCache[text] = [new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#f00',
                        width: 1
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgba(255,0,0,1)'
                    }),
                    text: new ol.style.Text({
                        font: '12px Calibri,sans-serif',
                        text: text,
                        fill: new ol.style.Fill({
                            color: '#000'
                        }),
                        stroke: new ol.style.Stroke({
                            color: '#f00',
                            width: 3
                        })
                    })
                })];
            }
            return highlightStyleCache[text];
        }
    });
}

var highlight;
var displayFeatureInfo = function(pixel) {
    
    var feature = null;
    if (pixel) {
        feature = map.forEachFeatureAtPixel(pixel, function(feature, layer) {
            return feature;
        });
        if (!feature)
            return;
    }
    
    var info = document.getElementById('info');
    if (feature) {
        info.innerHTML = 'Jokiosuus ' + feature.get('id') + ': ' 
            + ' <div>Vesikasvit: ' + feature.get('vesikasvit') + '</div>'
            + ' <div>Rantakasvit: ' + feature.get('rantakasvit') + '</div>'
            + ' <div>Puut: ' + feature.get('puut') + '</div>'
            + ' <div>Muuta: ' + feature.get('muuta') + '</div>';
    } else {
        info.innerHTML = '&nbsp;';
    }
    
    if (feature !== highlight) {
        if (highlight) {
            featureOverlay.getSource().removeFeature(highlight);
        }
        if (feature) {
            featureOverlay.getSource().addFeature(feature);
        }
        highlight = feature;
    }
    
};

