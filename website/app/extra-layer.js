/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

function create_extra_layer(options) {

    options = $.extend({visibility: false, blockingDialog: false, graphic: 'cross'}, options);

    var layer = new OpenLayers.Layer.Vector(options.name, {
        strategies: [
            new OpenLayers.Strategy.BBOX()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: config.url.biwa_wfs_2,
            featureType: "ej."+options.table+".geom",
            outputFormat: "GML2"
        }),
        visibility: options.visibility,
        extractAttributes: true,
        styleMap: styleMap({graphic: options.graphic, pointRadius: config.featureSize})
    });

    layer.featurePopupText = options.popup;

    layer.events.on({
        featureselected: function(obj) {
            if (options.blockingDialog) {
                var feature = obj.feature;
                var contents = layer.featurePopupText(feature, {interactive: true});
                contents.block = true;
                addPopup(feature, contents);
            }
        },
        featureunselected: function(obj) {
            if (options.blockingDialog) {
                clearPopup({unblock: true});
            }
        }
    });

    return layer;
}
