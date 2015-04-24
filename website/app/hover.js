/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var popup = null;

function clearPopup() {
    if (popup != null) {
        map.removePopup(popup);
        popup.destroy();
        delete popup;
        popup = null;
    }
}

OpenLayers.Control.OverFeature = OpenLayers.Class(OpenLayers.Control, {
    layer: null,
    defaultHandlerOptions: {
        'delay': 2000,
        'pixelTolerance': 1,
        'stopMove': false
    },
    initialize: function(layer, options) {
        this.layer = layer;
        this.handlerOptions = OpenLayers.Util.extend(
            {}, this.defaultHandlerOptions);
        OpenLayers.Control.prototype.initialize.apply(
            this, arguments
        );                        
        this.handlers = {
            feature: new OpenLayers.Handler.Feature(
                this,
                this.layer,
                {
                    'over': this.over,
                    'clickout': this.clickout
                },
                {}
            )};
    },
    draw: function() {
        return false;
    },                    
    activate: function() {
        this.handlers.feature.activate();
    },                    
    deactivate: function() {
        this.handlers.feature.deactivate();
    },
    over: function(feature) {
        clearPopup();
        popup = new OpenLayers.Popup.FramedCloud(
            'featurePopup',
            feature.geometry.getBounds().getCenterLonLat(),
            new OpenLayers.Size(250, 80),
            '<b>'+feature.attributes.nimike+'</b><br />'
                +feature.attributes.info,
            null, true, clearPopup);
        popup.autoSize = false;
        map.addPopup(popup);
    },
    clickout: function(feature) {
        clearPopup();
    }
});
