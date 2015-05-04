/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var vegetation_layer;
var select_river_element_flag = 0;
var plants_on_river_elements = null;
var selected_plants = {};

function create_vegetation_layer(options) {
    
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
            url: wfs_url,
            featureType: vegetation_prefix+".jokipalat.geom",
            outputFormat: "GML2"
        }),
        visibility: options.visibility,
        extractAttributes: true,
        styleMap: styleMap
    });
    
    vegetation_layer.featurePopupText = function(feature) {
        var fid = feature.attributes.id;
        var text = "<b>Jokiosuus "+fid+'</b><br />Kasvillisuus: ';
        if (fid != undefined) {
            var plants = plants_on_river_elements[fid];
            var f = true;
            for (plant in plants) {
                if (f)
                    f = false;
                else
                    text += ', ';
                text += $("li[id="+plant+"]").html();
            }
        }
        return text;
    };

    vegetation_layer.events.on({
        featureselected: function(obj) {
            blockPopups = true;
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
        },
        featureunselected: function(obj) {
            blockPopups = false;
            clearPopup();
        }
    });

    return vegetation_layer;
}

function update_vegetation_layer() {
    for (var i = 0; i < vegetation_layer.features.length; ++i) {
        var f = vegetation_layer.features[i];
        var fid = f.attributes["id"];
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
