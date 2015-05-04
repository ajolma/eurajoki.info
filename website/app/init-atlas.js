/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var map = null;

function init() {

    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;

    map = make_map();

    var layers = taustakartat();
    map.addLayers(layers);

    layers = overlays();
    map.addLayers(layers);

    layers = [];
    layers.push(create_sensor_layer({visibility: false}));
    layers.push(create_story_layer({visibility: false}));
    layers.push(create_vegetation_layer({visibility: false}));
    map.addLayers(layers);

    create_controls(layers, [story_layer, vegetation_layer], {multiple: false});

    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

}

function onPlantsReceived(param) {
    $.each(param, function(i, name) {
        var html = '<li class="ui-state-default" id="'+i+'">'+name+'</li>';
        $("#selectable").append(html);
    });
}

function window_resize() {
    var viewHeight = $(window).height();
    var contentHeight = viewHeight - 
        $('.header_resize').outerHeight() - 
        $('.headert_text_resize').outerHeight() - 
        $('.footer').outerHeight() - 5 - 5 - 0 - 4 - 2; // body.padding & border-top & table.border-spacing & extra
        $('.olMap').height(contentHeight);
    map.updateSize();
}

$(function() {

    $.ajax({
	url: vegetation_url+'request=GetPlants',
	type: "GET",
	dataType: "json",
	success: onPlantsReceived
    });
    
    $.ajax({
	url: vegetation_url+'request=GetPlantsOnRiver',
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
            update_vegetation_layer();
        },
        unselected: function( event, ui ) {
            delete selected_plants[ui.unselected.id];
            update_vegetation_layer();
        }
        
    });

    $( "#opener" ).click(function() {
        $( "#dialog" ).dialog( "open" );
    });

    init();

    var panels = {
        vegetation: "Kasvillisuus",
        stories: "Tarinat",
        sensors: "Mittauskohteet",
        aerial_photos: "Ilmakuvat",
        basemap_1962: "Peruskartta 1962",
        senate_maps: "Senaatin kartat"
    };

    for (var panel in panels) {
        $('#'+panel+'_panel').accordion({collapsible: true});
        $('#'+panel+'_panel').hide();
    }

    var layers = "";
    for (var i = map.layers.length-1; i >= 0; i--) {
        var l = map.layers[i];
        if (l.isBaseLayer) continue;
        if (!l.displayInLayerSwitcher) continue;
        var n = l.name;
        layers += "<input type=\"checkbox\" class=\"serialcheck\" value=\""+n+"\">"+n+"</input><br />";
    }
    $('.map_overlays').html(layers);

    $(".map_overlays input.serialcheck").click(function(){
        clearPopup();
        var e = $(this);
        var n = e.val();
        var panel = null;
        for (var p in panels) {
            if (n == panels[p]) {
                panel = $('#'+p+'_panel');
                break;
            }
        }
        for (var i = 0; i < map.layers.length; ++i) {
            var l = map.layers[i];
            if (l.name == n) {
                if (e[0].checked) {
                    panel.show();
                    l.setVisibility(true);
                } else {
                    panel.hide();
                    l.setVisibility(false);
                }
                break;
            }
        }
    });

    layers = "";
    var j = 0;
    for (var i = 0; i < map.layers.length; ++i) {
        var l = map.layers[i];
        if (!l.isBaseLayer) continue;
        j++;
        var n = l.name;
        var c = '';
        if (j == 1) c = 'checked';
        layers += "<input type=\"radio\" name=\"bgmap\" class=\"serialcheck\" value=\""+n+"\" "+c+">"+n+"</input><br />";
    }
    $('.backgroundmap').html(layers);

    $(".backgroundmap input.serialcheck").click(function(){
        var e = $(this);
        var n = e.val();
        for (var i = 0; i < map.layers.length; ++i) {
            var l = map.layers[i];
            if (l.name == n) {
                if (e[0].checked) {
                    map.setBaseLayer(l);
                }
                break;
            }
        }
    });

    $(window).resize(window_resize);
    window_resize();
    
});
