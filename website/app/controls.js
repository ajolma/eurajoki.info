/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var blockPopups = false;
var hoverControl;
var selectControl;
var selectedFeature = null;

function addPopup(feature, contents) {
    if (contents == null) contents = {};
    contents.width = typeof contents.width !== 'undefined' ? contents.width : 350;
    contents.height = typeof contents.height !== 'undefined' ? contents.height : 200;
    contents.select = typeof contents.select !== 'undefined' ? contents.select : false;
    var popup = new OpenLayers.Popup.FramedCloud(
        "featurePopup",
        feature.geometry.getBounds().getCenterLonLat(),
        new OpenLayers.Size(contents.width, contents.height),
        '<h2>'+contents.title+'</h2>'+contents.body,
        null, 
        contents.select,
        clearPopup
    );
    popup.autoSize = false;
    map.addPopup(popup, true);
    if (contents.select) 
        selectedFeature = feature;
    else
        // hack to make this dialog box insensitive to mouse, see related css
        popup.groupDiv.parentNode.id = 'featurePopup2';
    blockPopups = contents.select;
}

function clearPopup(options) {
    if (options == null) options = {};
    options.force = typeof options.force !== 'undefined' ? options.force : 2; // 1 only temps, 2 all
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
            var contents = feature.layer.featurePopupText(feature);
            addPopup(feature, contents);
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
