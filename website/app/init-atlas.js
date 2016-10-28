/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var panels = {};
var map = null;

function init() {

    OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;

    map = make_map();

    var layers = taustakartat();
    map.addLayers(layers);

    layers = overlays();
    map.addLayers(layers);
    panels.aerial_photos = "Ilmakuvat";
    panels.basemap_1962 = "Peruskartta 1962";
    panels.senate_maps = "Senaatin kartat";

    layers = [];
    layers.push(create_sensor_layer({visibility: false, blockingDialog: true}));
    panels.sensors = "Mittauskohteet";

    layers.push(create_story_layer({visibility: false, blockingDialog: true}));
    panels.stories = "Tarinat";

    layers.push(vegetation_layer());

//    layers.push(create_extra_layer(
//        { name: "Purkupisteet", 
//          table: "purkupisteet", 
//          graphic: "cross",
//          popup: function(feature) {
//              return { title:  feature.attributes.purkutunnu, 
//                       body:   feature.attributes.kuvaus, 
//                       height: 100 };
//          }
//        }));
//    panels.purkupisteet = "Purkupisteet";

    map.addLayers(layers);

    createControls({hoverLayers:layers, selectLayers:layers});

    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    map.events.register('mouseover', map, function (e) {
        clearPopup();
    });

}

function vegetation_layer() {

    var layer = create_vegetation_layer({visibility: false, blockingDialog: true});

    $.ajax({
	url: config.url.kasvillisuus+'request=GetPlants',
	type: "GET",
	dataType: "json",
	success: onPlantsReceived
    });
    
    $.ajax({
	url: config.url.kasvillisuus+'request=GetPlantsOnRiver',
	type: "GET",
	dataType: "json",
	success: function(param) {
            plants_on_river_elements = param;
        }
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

    panels.vegetation = "Kasvillisuus";

    return layer;
}

function onPlantsReceived(param) {
    var sortable = [];
    for (var id in param)
        sortable.push([id, param[id]])
    sortable.sort(function(a, b) {
        return a[1][0].localeCompare(b[1][0]);
    });
    $(sortable).each(function(i,plant) {
        var html = '<li class="ui-state-default" id="'+plant[0]+'" hakusana="'+plant[1][1]+'">'+plant[1][0]+'</li>';
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
    
    config();

    $( "#dialog" ).dialog({
        autoOpen: false,
        width: 'auto',
        closeText: "Sulje"
    });

    $( "#opener" ).click(function() {
        $( "#dialog" ).dialog( "open" );
    });

    init();

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
