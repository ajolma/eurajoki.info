/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var blockPopups = false;
var hoverControl;
var selectControl;
var selectedFeature = null;

function addPopup(feature, options) {
    options = $.extend({width: 350, height: 200, select: false}, options);
    var popup = new OpenLayers.Popup.FramedCloud(
        "featurePopup",
        feature.geometry.getBounds().getCenterLonLat(),
        new OpenLayers.Size(options.width, options.height),
        '<h2>'+options.title+'</h2>'+options.body,
        null, 
        options.select,
        clearPopup
    );
    popup.autoSize = false;
    map.addPopup(popup, true);
    if (options.select) 
        selectedFeature = feature;
    else
        // hack to make this dialog box insensitive to mouse, see related css
        popup.groupDiv.parentNode.id = 'featurePopup2';
    blockPopups = options.select;
}

function clearPopup(options) {
    options = $.extend({force: 2}, options); // 1 only temps, 2 all
    if (options.force == 1 && blockPopups)
        return;
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

    options = $.extend({multiple: false, clickout: true}, options);

    hoverControl = new OpenLayers.Control.SelectFeature(hoverLayers, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        overFeature: function(feature) {
            if (blockPopups) return;
            clearPopup();
            this.highlight(feature);
            addPopup(feature, feature.layer.featurePopupText(feature));
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
