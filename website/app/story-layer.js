/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var story_layer;

function openPictureWindow() {
    window.open('', 'PictureWindow', 'width=980,height=660,status=yes,resizable=yes,scrollbars=yes');
    document.getElementById('PictureForm').submit();
}

function create_story_layer(options) {

    options = $.extend({visibility: true, blockingDialog: false}, options);

    story_layer = new OpenLayers.Layer.Vector("Tarinat", {
        strategies: [
            new OpenLayers.Strategy.BBOX()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: config.url.tarinapaikat,
            featureType: config.featureType.tarinapaikat_public,
            outputFormat: "GML2"
        }),
        visibility: options.visibility,
        extractAttributes: true,
        styleMap: styleMap({graphic: 'cross', pointRadius: config.featureSize})
    });

    story_layer.featurePopupText = function(feature, options) {
        options = $.extend({interactive: false}, options);
        var body = feature.attributes.story + '<br /> <br />';
        if (options.interactive && feature.attributes.kuvia > 0) {
            var lbl = feature.attributes.kuvia == 1 ? "Katso kuva." : 'Katso kuvat.';
            var style = "color:#0000ff; cursor:pointer";
            var ids = parseArray(feature.attributes.kuvat);
            for (var i = 0; i < ids.length; i++) {
                var attrs = {
                    'class': "story_image cboxElement",
                    'rel': "story_image",
                    'data-cbox-rel': "story_image",
                    'data-cbox-photo': "true",
                    'data-cbox-opacity': "0.6",
                    'data-cbox-width': "75%",
                    'data-cbox-height': "75%",
                    'style': style,
                    'href': config.url.kuva+"pic="+ids[i],
                    'onclick': "$.colorbox(" + json({
                        rel:'story_image', 
                        href:config.url.kuva+"pic="+ids[i],
                        photo:true, 
                        opacity:0.6, 
                        width:'75%', 
                        height:'75%'
                    }) + ');'
                };
                body += element('div', attrs, lbl);
                style = "display:none";
                lbl = '';
            }
        } else if (feature.attributes.kuvia == 1)
            body += "Tarinaan liittyy yksi kuva.";
        else if (feature.attributes.kuvia > 1)
            body += "Tarinaan liittyy "+feature.attributes.kuvia+" kuvaa.";
        return {title:feature.attributes.otsikko, body:body, height : 250};
    };

    story_layer.events.on({
        featureselected: function(obj) {
            if (options.blockingDialog) {
                var feature = obj.feature;
                var contents = story_layer.featurePopupText(feature, {interactive: true});
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

    return story_layer;
}
