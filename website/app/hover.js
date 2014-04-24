var lastFeature = null;

function clearPopup() {
    if (lastFeature != null && lastFeature.popup != null){
        map.removePopup(lastFeature.popup);
        lastFeature.popup.destroy();
        delete lastFeature.popup;
    }
    lastFeature = null;
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
                    'out' : this.out
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
        var popup = new OpenLayers.Popup.FramedCloud(
            'featurePopup',
            feature.geometry.getBounds().getCenterLonLat(),
            new OpenLayers.Size(250, 80),
            '<b>'+feature.attributes.nimike+'</b><br />'
                +feature.attributes.info,
            null, true, clearPopup);
        popup.autoSize = false;
        feature.popup = popup;
        lastFeature = feature;
        map.addPopup(popup);
    },                    
    out: function(feature) {
        //clearPopup();
    }        
});
