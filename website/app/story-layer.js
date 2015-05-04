/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var story_layer;
var story_graphic = "cross";

function openPictureWindow() {
    window.open('', 'PictureWindow', 'width=980,height=660,status=yes,resizable=yes,scrollbars=yes');
    document.getElementById('PictureForm').submit();
}

function create_story_layer(options) {
    
    if (options == null)
        options = {visibility: true};

    var MyStyle = function(color,graphic) {
        this.fillOpacity = 0.2;
        this.graphicOpacity = 1;
        this.strokeColor = color;
        this.fillColor = color;
        this.graphicName = graphic;
        this.pointRadius = 10;
        this.strokeWidth = 3;
        this.rotation = 45;
        this.strokeLinecap = "butt";
    };
    
    var styleMap = new OpenLayers.StyleMap({
        'default':   new OpenLayers.Style(new MyStyle("blue",   story_graphic)),
        'select':    new OpenLayers.Style(new MyStyle("red",    story_graphic)),
        'temporary': new OpenLayers.Style(new MyStyle("yellow", story_graphic))
    });

    story_layer = new OpenLayers.Layer.Vector("Tarinat", {
        strategies: [
            new OpenLayers.Strategy.BBOX()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: story_wfs_url,
            featureType: stories_prefix+".public_tarinat.geom",
            outputFormat: "GML2"
        }),
        visibility: options.visibility,
        extractAttributes: true,
        styleMap: styleMap
    });

    story_layer.featurePopupText = function(feature) {
        var text = "";
        if (feature.attributes.id != undefined) {
            text = '<b>'+feature.attributes.otsikko+'</b><br />'+feature.attributes.story;
        }
        return text;
    };

    story_layer.events.on({
        featureselected: function(obj) {
            blockPopups = true;
            var feature = obj.feature;
            var form = "";
            var text = "";
            if (feature.attributes.id != undefined) {
                form =
                    '<form id="PictureForm" method="post" action="'+picture_url+'" target="PictureWindow">'+
                    '<input type="hidden" name="story" value="'+feature.attributes.id+'">'+
                    '<input type="submit" value="Katso tarinaan liittyvät kuvat" onclick="openPictureWindow()">'+
                    '</form>';
                text = '<h2>'+feature.attributes.otsikko+'</h2>'+feature.attributes.story;
                text += form;
            }
            var popup = new OpenLayers.Popup.FramedCloud(
                "featurePopup",
                feature.geometry.getBounds().getCenterLonLat(),
                new OpenLayers.Size(400,300),
                text,
                null, 
                true,
                clearPopup
            );
            popup.autoSize = false;
            map.addPopup(popup, true);
        },
        featureunselected: function(obj) {
            blockPopups = false;
            clearPopup();
        }
    });

    return story_layer;
}
