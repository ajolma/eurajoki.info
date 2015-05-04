/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var storiesLayer = null;
var saveStrategy;
var popup = null;
var drawControls = null;

function clearPopup() {
    if (popup != null){
        map.removePopup(popup);
        popup.destroy();
        delete popup;
        popup = null;
    }
}

function openStoryWindow() {
    window.open('', 'StoryWindow', 'width=830,height=660,status=yes,resizable=yes,scrollbars=yes');
    document.getElementById('StoryForm').submit();
}

function new_identity() {

    if (drawControls != null) {
        for (key in drawControls) {
            var control = drawControls[key];
            control.deactivate();
        }
    }

    if (storiesLayer != null) {
        clearPopup();
        map.removeLayer(storiesLayer);
    }

    if (drawControls != null) {
        map.removeControl(drawControls.point);
    }

    saveStrategy = new OpenLayers.Strategy.Save();
    storiesLayer = new OpenLayers.Layer.Vector("Omat kohteet", {
        strategies: [
            new OpenLayers.Strategy.BBOX(),
            //new OpenLayers.Strategy.Fixed,
            saveStrategy
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: story_wfs_url,
            featureType: stories_prefix+".tarinat.geom",
            outputFormat: "GML2"
        }),
        filter: new OpenLayers.Filter.Logical({
            type: OpenLayers.Filter.Logical.AND,
            filters: [
                new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "email",
                    value: email
                }),
                new OpenLayers.Filter.Comparison({
                    type: OpenLayers.Filter.Comparison.EQUAL_TO,
                    property: "password",
                    value: password
                })
            ]
        }),
        visibility: true,
        extractAttributes: true,
        //styleMap: styleMap
    });
    map.addLayer(storiesLayer);

    hoverControl = new OpenLayers.Control.SelectFeature(storiesLayer, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        eventListeners: {
            featurehighlighted: function (evt) {
                var feature = evt.feature;
                clearPopup();
                function onPopupClose(evt) {
                    clearPopup();
                }
                var panel = "";
                if (feature.attributes.id != undefined) {
                    var formCommon = 
                        '<input type="hidden" name="email" value="'+email+'">'+
                        '<input type="hidden" name="password" value="'+password+'">'+
                        '<input type="hidden" name="story" value="'+feature.attributes.id+'">';
                    var storyForm = 
                        '<form id="StoryForm" method="post" action="'+story_url+'" target="StoryWindow">'+
                        formCommon+
                        '<input type="submit" value="Muokkaa tarinaa" onclick="openStoryWindow()">'+
                        '</form>';
                    var pictureForm =
                        '<form id="PictureForm" method="post" action="'+picture_url+'" target="PictureWindow">'+
                        formCommon+
                        '<input type="submit" value="Katso tarinaan liittyvät kuvat" onclick="openPictureWindow()">'+
                        '</form>';
                    var delForm =
                        '<form id="DeleteForm" method="post" action="'+story_url+'" target="StoryWindow">'+
                        formCommon+
                        '<input type="hidden" name="cmd" value="del">'+
                        '<input type="submit" value="Poista tarina" onclick="openStoryWindow()">'+
                        '</form>';
                    panel = '<h2>'+feature.attributes.otsikko+'</h2>'+
                        feature.attributes.story+storyForm+pictureForm+delForm;
                } else {
                    panel = '<h2>Uusi tarina</h2>Päivitä tarinakartta niin voit editoida tätä tarinaa.';
                }
                popup = new OpenLayers.Popup.FramedCloud(
                    "featurePopup",
                    feature.geometry.getBounds().getCenterLonLat(),
                    new OpenLayers.Size(400,300),
                    panel,
                    null, true, onPopupClose);
                popup.autoSize = false;
                map.addPopup(popup, true);
            }
        }
    });
    
    map.addControl(hoverControl);
    hoverControl.activate();

    var form = 
        "<fieldset>"+
        '<input type="radio" name="type" value="none" id="noneToggle"'+
        ' onclick="toggleControl(this);" checked="checked" />'+
        '<label for="noneToggle">Navigoi</label>'+
        '<input type="radio" name="type" value="point" id="pointToggle"'+
        ' onclick="toggleControl(this);" />'+
        '<label for="pointToggle">Lisää paikka</label>'+
        ' <button onclick="saveEdit()">Päivitä kartta</button>'+
        "</fieldset>";
    document.getElementById('mode-selector').innerHTML = form;

    drawControls = {
        point: new OpenLayers.Control.DrawFeature(storiesLayer,
                                                  OpenLayers.Handler.Point)
    };

    map.addControl(drawControls.point);

}

function toggleControl(element) {
    for (key in drawControls) {
        var control = drawControls[key];
        if(element.value == key && element.checked) {
            control.activate();
        } else {
            control.deactivate();
        }
    }
}

function saveEdit(element) {
    var features = storiesLayer.features;
    for (var i = 0; i < features.length; i++) {
        if (features[i].state == "Insert") {
            features[i].attributes.email = email;
            features[i].attributes.password = password;
        }
    }
    saveStrategy.save();
    window.setTimeout(new_identity,1000);
}
