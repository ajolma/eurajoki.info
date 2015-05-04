/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var blockPopups = false;
var highlightedFeature = null;
var hoverControl;
var selectControl;

function clearPopup() {
    blockPopups = false;
    var popups = map.popups;
    for (var i = 0; i < popups.length; ++i) {
        map.removePopup(popups[i]);
    }
}

function create_controls(hoverLayers, selectLayers, options) {

    if (options == null)
        options = {multiple: true};

    hoverControl = new OpenLayers.Control.SelectFeature(hoverLayers, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        overFeature: function(feature) {
            if (blockPopups) return;
            clearPopup();
            this.highlight(feature);
            var text = feature.layer.featurePopupText(feature);
            var popup = new OpenLayers.Popup.FramedCloud(
                'featurePopup',
                feature.geometry.getBounds().getCenterLonLat(),
                new OpenLayers.Size(300, 150),
                text,
                null, 
                false, // closeBox
                clearPopup);
            popup.autoSize = false;
            // hack to make this dialog box insensitive to mouse, see related css
            popup.groupDiv.parentNode.id = 'featurePopup2';
            map.addPopup(popup);
        }
    });
    
    selectControl = new OpenLayers.Control.SelectFeature(selectLayers, {
        clickout: true,
        toggle: true,
        multiple: options.multiple
    });
    
    map.addControl(hoverControl);
    map.addControl(selectControl);
    hoverControl.activate();
    selectControl.activate();
    
}
