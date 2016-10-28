/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var vegetation_layer;
var select_river_element_flag = 0;
var plants_on_river_elements = null;
var selected_plants = {};

function create_vegetation_layer(options) {

    options = $.extend({visibility: true, blockingDialog: false}, options);

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
        "default": new OpenLayers.Style(new MyStyle("blue","star")),
        select: new OpenLayers.Style(new MyStyle("red","star")),
        temporary: new OpenLayers.Style(new MyStyle("yellow","star"))
    });

    vegetation_layer = new OpenLayers.Layer.Vector("Kasvillisuus", {
        strategies: [
            new OpenLayers.Strategy.BBOX(),
            new OpenLayers.Strategy.Fixed()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: config.url.joki,
            featureType: config.featureType.joki,
            outputFormat: "GML2"
        }),
        visibility: options.visibility,
        extractAttributes: true,
        styleMap: styleMap
    });
    
    vegetation_layer.featurePopupText = function(feature, options) {
        options = $.extend({interactive: false}, options);
        var fid = feature.attributes.id;
        var body = '<div style="">Kasvillisuus: ';
        var plants = plants_on_river_elements[fid];
        var f = true;
        var sortable = [];
        for (id in plants) {
            var ref = $("li[id="+id+"]");
            var nimi = ref.html();
            var hakusana = ref.attr('hakusana');
            sortable.push({id:id, nimi:nimi, hakusana:hakusana});
        }
        sortable.sort(function(a, b) {
            return a.nimi.localeCompare(b.nimi);
        });
        $(sortable).each(function(i,plant) {
            var kasvi = plant.nimi;
            if (options.interactive) {
                var href = "http://fi.wikipedia.org/wiki/";
                //var href = "http://www.luontoportti.com/suomi/?q="; # not allowed
                var attrs = {
                    'class': "wikipedia_vegetation cboxElement",
                    'style': "color:#0000ff; cursor:pointer",
                    'data-cbox-width': "75%",
                    'data-cbox-height': "75%",
                    'onclick': "$.colorbox(" + json({
                        href: href + plant.hakusana, 
                        iframe: true, 
                        opacity: 0.6, 
                        width: '75%', 
                        height: '75%'
                    }) + ");"
                };
                kasvi = element('span', attrs, plant.nimi);
            }
            if (f) f = false; else body += ', ';
            body += kasvi;
        });
        body += "</div>";
        return {title:"Jokiosuus "+fid, body:body};
    }

    vegetation_layer.events.on({
        featureselected: function(obj) {
            var feature = obj.feature;
            if (select_river_element_flag) {
                return;
            }
            var fid = feature.attributes.id;
            var plants = plants_on_river_elements[fid];
            $("li", "#selectable").removeClass("ui-selected");
            selected_plants = {};
            for (plant in plants) {
                $("li[id="+plant+"]", "#selectable").addClass("ui-selected");
                selected_plants[plant] = 1;
            }
            if (options.blockingDialog) {
                var contents = vegetation_layer.featurePopupText(feature, {interactive: true});
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

    return vegetation_layer;
}

function update_vegetation_layer() {
    if (selectControl == null) return;
    for (var i = 0; i < vegetation_layer.features.length; ++i) {
        var f = vegetation_layer.features[i];
        var fid = f.attributes.id;
        var plants = plants_on_river_elements[fid];
        var sel = 0;
        if (plants) {
            for (plant in selected_plants) {
                if (plants[plant]) {
                    select_river_element_flag = 1;
                    selectControl.select(f);
                    select_river_element_flag = 0;
                    sel = 1;
                }
            }
        }
        if (sel == 0) {
            selectControl.unselect(f);
        }
    }
}
