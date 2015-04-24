/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var map = null;
var select_river_elements = null;
var plants_on_river_elements = null;
var selected_plants = {};
var select_river_element_flag = 0;

function init() {

    map = make_map();

    var layers = taustakartat();
    map.addLayers(layers);
    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;

    var overlayers = overlays();
    
    map.addLayers(overlayers);

    var sw = map.getControl("OpenLayers_Control_LayerSwitcher_4");
    sw.maximizeControl();

    select_river_elements = new OpenLayers.Control.SelectFeature(river_layer, {
        eventListeners: {
            featurehighlighted: function (evt) {
                if (select_river_element_flag) {
                    return;
                }
                var feature = evt.feature;
                var fid = feature.attributes["id"];
                var plants = plants_on_river_elements[fid];
                $("li", "#selectable").removeClass("ui-selected");
                selected_plants = {};
                for (plant in plants) {
                    $("li[id="+plant+"]", "#selectable").addClass("ui-selected");
                    selected_plants[plant] = 1;
                }
            }
        }
    });
    map.addControl(select_river_elements);
    select_river_elements.activate();

}

function onPlantsReceived(param) {
    $.each(param, function(i, name) {
        var html = '<li class="ui-state-default" id="'+i+'">'+name+'</li>';
        $("#selectable").append(html);
    });
}

function update_river() {
    for (var i = 0; i < river_layer.features.length; ++i) {
        var f = river_layer.features[i];
        var fid = f.attributes["id"];
        var plants = plants_on_river_elements[fid];
        var sel = 0;
        if (plants) {
            for (plant in selected_plants) {
                if (plants[plant]) {
                    select_river_element_flag = 1;
                    select_river_elements.select(f);
                    select_river_element_flag = 0;
                    sel = 1;
                }
            }
        }
        if (sel == 0) {
            select_river_elements.unselect(f);
        }
    }
}

$(function() {

    var data_server = 'localhost';
    var server = 'http://'+data_server+'/Eurajoki/data.pl?';

    $.ajax({
	url: server+'request=GetPlants',
	type: "GET",
	dataType: "json",
	success: onPlantsReceived
    });
    
    $.ajax({
	url: server+'request=GetPlantsOnRiver',
	type: "GET",
	dataType: "json",
	success: function(param) {
            plants_on_river_elements = param;
        }
    });

    $( "#dialog" ).dialog({
        autoOpen: false,
        closeText: "Sulje"
    });

    $( "#selectable" ).selectable({
        selected: function( event, ui ) {
            selected_plants[ui.selected.id] = 1;
            update_river();
        },
        unselected: function( event, ui ) {
            delete selected_plants[ui.unselected.id];
            update_river();
        }
        
    });

    $( "#opener" ).click(function() {
        $( "#dialog" ).dialog( "open" );
    });

    init();

});
