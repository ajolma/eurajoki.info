/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var story_layer;

function openPictureWindow() {
    window.open('', 'PictureWindow', 'width=980,height=660,status=yes,resizable=yes,scrollbars=yes');
    document.getElementById('PictureForm').submit();
}

function parseArray(arrStr) {
    var x = arrStr.substring(1, arrStr.length - 1);
    x = x.replace(/^\d+:/, "");
    var l = x.split(",");
    return l;
}

function create_story_layer(options) {

    options = $.extend({visibility: true}, options);

    story_layer = new OpenLayers.Layer.Vector("Tarinat", {
        strategies: [
            new OpenLayers.Strategy.BBOX()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: config.url.tarinapaikat,
            featureType: config.prefix.tarinapaikat+".public_tarinat2.geom",
            outputFormat: "GML2"
        }),
        visibility: options.visibility,
        extractAttributes: true,
        styleMap: styleMap({graphic: 'cross'})
    });

    story_layer.featurePopupText = function(feature, options) {
        options = $.extend({interactive: false}, options);
        var body = feature.attributes.story + '<br /> <br />';
        if (options.interactive && feature.attributes.kuvia > 0) {
            var href = "http://ajolma.net/Eurajoki/files.pl?pic=";
            var tag = 'story_image';
            var a0 = ' class="'+tag+' cboxElement" rel="'+tag+'" data-cbox-rel="'+tag+'"';
            a0 += ' data-cbox-photo="true"';
            a0 += ' data-cbox-opacity=0.6';
            a0 += ' data-cbox-width="75%"';
            a0 += ' data-cbox-height="75%"';
            var a1 = a0+' style="display:none"';
            a0 += ' style="color:#0000ff; cursor:pointer"';
            var div_href = " href='"+href;
            a0 += div_href;
            a1 += div_href;
            var on_open = ' onclick="$.colorbox({';
            var on_close = '});"';
            var json_tag = "rel:'"+tag+"'";
            var json_href = ", href:'"+href;
            var json = ', photo:true, opacity:0.6';
            json += ", width:'75%', height:'75%'";
            var lbl;
            if (feature.attributes.kuvia == 1)
                lbl = "Katso kuva.";
            else if (feature.attributes.kuvia > 1)
                lbl = 'Katso kuvat.';
            var ids = parseArray(feature.attributes.kuvat);
            var a = a0;
            for (var i = 0; i < ids.length; i++) {
                body += "<div"+a+ids[i]+"'"+on_open+json_tag+json_href+ids[i]+"'"+json+on_close+">"+lbl+"</div>";
                a = a1;
                lbl = "";
            }
        } else if (feature.attributes.kuvia == 1)
            body += "Tarinaan liittyy yksi kuva.";
        else if (feature.attributes.kuvia > 1)
            body += "Tarinaan liittyy "+feature.attributes.kuvia+" kuvaa.";
        return {title:feature.attributes.otsikko, body:body, height : 250};
    };

    story_layer.events.on({
        featureselected: function(obj) {
            var feature = obj.feature;
            var contents = story_layer.featurePopupText(feature, {interactive: true});
            contents.select = true;
            addPopup(feature, contents);
        },
        featureunselected: clearPopup
    });

    return story_layer;
}
