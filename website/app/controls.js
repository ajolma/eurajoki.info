/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var blockPopups = false;
var hoverControl;
var selectControl;
var selectedFeature = null;

function addPopup(text, feature, width, height, select) {
    var popup = new OpenLayers.Popup.FramedCloud(
        "featurePopup",
        feature.geometry.getBounds().getCenterLonLat(),
        new OpenLayers.Size(width, height),
        text,
        null, 
        select,
        clearPopup
    );
    popup.autoSize = false;
    map.addPopup(popup, true);
    if (select) 
        selectedFeature = feature;
    else
        // hack to make this dialog box insensitive to mouse, see related css
        popup.groupDiv.parentNode.id = 'featurePopup2';
    blockPopups = select;
}

function clearPopup() {
    blockPopups = false;
    if (selectedFeature != null) {
        var f = selectedFeature;
        selectedFeature = null; // avoid deep recursion
        selectControl.unselect(f);
    }
    var popups = map.popups;
    for (var i = 0; i < popups.length; ++i) {
        map.removePopup(popups[i]);
    }
}

function create_controls(hoverLayers, selectLayers, options) {

    if (options == null)
        options = {multiple: false, clickout: true};

    hoverControl = new OpenLayers.Control.SelectFeature(hoverLayers, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        overFeature: function(feature) {
            if (blockPopups) return;
            clearPopup();
            this.highlight(feature);
            var text = feature.layer.featurePopupText(feature);
            addPopup(text, feature, 300, 150, false);
        }
    });
    
    selectControl = new OpenLayers.Control.SelectFeature(selectLayers, {
        clickout: options.clickout,
        toggle: true,
        multiple: options.multiple
    });
    
    map.addControl(hoverControl);
    map.addControl(selectControl);
    hoverControl.activate();
    selectControl.activate();
    
}
