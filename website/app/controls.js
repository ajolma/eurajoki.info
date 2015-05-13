/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var onFeature = false;
var onPopup = false;
var hoverFeature = null;

var hoverControl = null;
var selectControl = null;

function addPopup(feature, options) {
    options = $.extend({width: 350, height: 200, closeBox: true, select: false}, options);
    var popup = new OpenLayers.Popup.FramedCloud(
        "featurePopup",
        feature.geometry.getBounds().getCenterLonLat(),
        new OpenLayers.Size(options.width, options.height),
        '<h2>'+options.title+'</h2>'+options.body,
        null, 
        options.closeBox,
        function() {
            onPopup = false;
            clearPopup();
        }
    );
    popup.div.onmouseover = function(evt) {
        onPopup = true;
    };
    popup.div.onmouseout = function(evt) {
        onPopup = false;
    };
    popup.autoSize = false;
    map.addPopup(popup, true);
    if (!options.closeBox) 
        // hack to make this dialog box insensitive to mouse, see related css
        popup.groupDiv.parentNode.id = 'featurePopup2';
}

function clearPopup(options) {
    options = $.extend({force: 2, unselect: null}, options); // 1 only temps, 2 all
    if (onPopup || onFeature)
        return;
    if (options.force == 1 && (onPopup || onFeature))
        return;
    if (selectControl && options.unselect != null) {
        // must avoid deep recursion
        selectControl.unselect(options.unselect);
    }
    if (hoverFeature != null) {
        var f = hoverFeature;
        hoverFeature = null; // avoid deep recursion
        if (hoverControl && !isSelected(f))
            hoverControl.unhighlight(f);
    }
    var popups = map.popups;
    for (var i = 0; i < popups.length; ++i) {
        map.removePopup(popups[i]);
    }
}

function isSelected(feature) {
    if (selectControl == null)
        return false;
    if (selectControl.layers == null) {
        return containsObject(feature, selectControl.layer.selectedFeatures);
    } else {
        var i;
        for (i = 0; i < selectControl.layers.length; i++) {
            if (containsObject(feature, selectControl.layers[i].selectedFeatures)) {
                return true;
            }
        }
        return false;
    }
}

function create_controls(hoverLayers, selectLayers, options) {

    options = $.extend({multiple: false, clickout: true, hover: true, select: true, closeBox: true}, options);

    if (options.hover) 
        hoverControl = new OpenLayers.Control.SelectFeature(hoverLayers, {
            hover: true,
            highlightOnly: true,
            renderIntent: "temporary",
            overFeature: function(feature) {
                if (feature == hoverFeature) return;
                clearPopup();
                if (!isSelected(feature))
                    this.highlight(feature);
                var opt = $.extend({closeBox: options.closeBox}, feature.layer.featurePopupText(feature, {interactive: options.closeBox}));
                addPopup(feature, opt);
                onFeature = true;
                hoverFeature = feature;
            },
            outFeature: function(feature) {
                onFeature = false;
                clearPopup();
            }
        });
    
    if (options.select)
        selectControl = new OpenLayers.Control.SelectFeature(selectLayers, {
            clickout: options.clickout,
            toggle: true,
            multiple: options.multiple
        });
    
    if (options.hover) 
        map.addControl(hoverControl);
    if (options.select)
        map.addControl(selectControl);
    if (options.hover) 
        hoverControl.activate();
    if (options.select)
        selectControl.activate();
    
}
