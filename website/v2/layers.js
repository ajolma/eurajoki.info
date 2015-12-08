var layers = [
    {title:'Joki',v:'v'},
    {title:'Ilmakuvat',ol:'ilmakuvat3067'},
    {title:'Maastovarjostus',ol:'dem'},
    {title:'Peruskartta 1962',ol:'peruskartat_1962_3067'},
    {title:'Senaatin kartat',ol:'senaatin_kartat_3067'}
];
function get_layer(layer) {
    for (var i = 0; i < layers.length; i++) {
        if (layers[i].layer == layer)
            return layers[i];
    }
}

var layer_objects = [];

function addLayers(map, lrs, proj) {
    var layer_list = $("#layertree ul");
    layer_list.html('');

    layers = lrs;
    for (var j = 0; j < layer_objects.length; j++) {
        map.removeLayer(layer_objects[j]);
    }
    layer_objects = [];
    var n = layers.length;
    for (var i = n-1; i >= 0; i--) {
        var l = layer(layers[i], proj);
        layer_objects.push(l);
        map.addLayer(l);
    }
    for (var i = 0; i < n; i++) {
        layer_list.append(layer_item(n-i, layers[i].title, n));
    }

    map.getLayers().forEach(function(layer, i) {
        bindInputs('#layer' + i, layer);
        if (layer instanceof ol.layer.Group) {
            layer.getLayers().forEach(function(sublayer, j) {
                bindInputs('#layer' + i + j, sublayer);
            });
        }
    });

    $('#layertree li > span').click(function() {
        $(this).siblings('div').toggle();
    }).siblings('div').hide();
}

function bindInputs(layerid, layer) {
    var visibilityInput = $(layerid + ' input.visible');
    var opacityInput = $(layerid + ' input.opacity');
    
    visibilityInput.on('change', function() {
        opacityInput.toggle();
        layer.setVisible(this.checked);
        if (!this.checked)
            remove_highlighted(get_layer(layer));
    });
    visibilityInput.prop('checked', layer.getVisible());
    opacityInput.hide();
    
    opacityInput.on('input change', function() {
        layer.setOpacity(parseFloat(this.value));
    });
    opacityInput.val(String(layer.getOpacity()));
}

function layer (layer, projection) {
    if (layer.bg && layer.bg == 'mml') {
        layer.layer = new ol.layer.Tile({
            opacity: 1,
            extent: projection.extent,
            source: new ol.source.WMTS({
                attributions: [new ol.Attribution({
                    html: 'Tiles &copy; <a href="http://www.maanmittauslaitos.fi/avoindata_lisenssi">MML</a>'
                })],
                url: 'http://avoindata.maanmittauslaitos.fi/mapcache/wmts',
                layer: 'taustakartta',
                matrixSet: 'ETRS-TM35FIN',
                format: 'image/png',
                projection: projection.projection,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: ol.extent.getTopLeft(projection.extent),
                    resolutions: projection.resolutions,
                    matrixIds: projection.matrixIds
                }),
                style: 'default'
            })
        });
    }
    else if (layer.ol) {
        layer.layer = new ol.layer.Tile({
            opacity: 0.6,
            extent: projection.extent,
            visible: false,
            source: new ol.source.WMTS({
                url: 'http://localhost/Eurajoki/WMTS',
                layer: layer.ol,
                matrixSet: 'ETRS-TM35FIN',
                format: 'image/png',
                projection: projection.projection,
                tileGrid: new ol.tilegrid.WMTS({
                    origin: ol.extent.getTopLeft(projection.extent),
                    resolutions: projection.resolutions,
                    matrixIds: projection.matrixIds
                }),
                style: 'default'
            })
        });
    }
    else if (layer.v) {
        var vectorSource = new ol.source.Vector({
            format: new ol.format.GeoJSON(),
            url: function(extent, resolution, projection) {
                return 'http://localhost/Eurajoki/WFS?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature'+
                    '&TYPENAME=ej.joki.geom&SRSNAME=EPSG:3067&outputformat=application/json';
                //'&bbox=' + extent.join(','); // + ',EPSG:3067';
            },
            strategy: ol.loadingstrategy.all
        });
        
        var styleCache = {};
        
        layer.layer = new ol.layer.Vector({
            visible: false,
            source: vectorSource,
            style: function(feature, resolution) {
                var text = resolution < 8 ? feature.get('id') : '';
                if (!styleCache[text]) {
                    styleCache[text] = [new ol.style.Style({
                        stroke: new ol.style.Stroke({
                            color: '#00f',
                            width: 2
                        }),
                        text: new ol.style.Text({
                            font: '12px Calibri,sans-serif',
                            text: text,
                            fill: new ol.style.Fill({
                                color: '#000'
                            })
                        })
                    })];
                }
                return styleCache[text];
            }
        });
    }
    return layer.layer;
}

function remove_highlighted(layer) {
    if (layer.title == 'Joki')
        displayFeatureInfo(null);
}
