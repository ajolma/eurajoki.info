/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var sensor_layer;

var datasets; // set to received data in jquery initialization
var variables; // set to received data in jquery initialization
var syncing = false;
var selected_variables = {};
var selected_locations = {};

function cmp_date(a,b) {
    for (var i=0; i<3; i++) {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
    }
    return 0;
}

function set_begin_date() {
    var d = null;
    $("#location :selected").each(function() {
        var paikka = $(this).val();
        $("#variable :selected").each(function() {
            var koodi = $(this).val();
            if (datasets[paikka].muuttujat2[koodi]) {
                var t = datasets[paikka].muuttujat2[koodi].alkupvm.split("-");
                for (var i=0; i<3; i++)
                    t[i] = parseInt(t[i]);
                if (d == null || cmp_date(t,d) < 0) d = t;
            }
        });
    });
    if (d != null) {
        if (d[0] < 2013) d = [2013,1,1];
        $('#beginDate').val(d[0]+"-"+d[1]+"-"+d[2]);
    }
}

function location_info(data) {
    var raw = '';
    if (config.raaka) {
        raw = ' (raakadataa)'
    }
    var info = $('#location_info').html();
    var tip = '';
    var has_tip = '';
    if (data.kommentti != null && data.kommentti != '') {
        tip = data.kommentti;
        has_tip = '*';
    }
    info += '<h3><div title="'+tip+'">'+data.nimike+' '+has_tip+raw+':'+
        '<div title="Poista valituista" class="mpad" id="'+data.koodi+'" style="float: right;">[X]</div>'+
        '</div></h3>';
    var str = data.kuvaus + ' (' + data.nimi + ')<br /><br />';
    if (data.kuvaus2) str += data.kuvaus2 + '<br /><br />';
    str += '<b>Mitatut muuttujat ja datan aikaväli:</b><br />';
    var c = 0;
    $.each(data.muuttujat, function(index, code) {
        var tmp = data.muuttujat2[code];
        /*
        var selected = false;
        $("#variable :selected").each(function() {
            var suure = $(this).val();
            var o = variables[suure];
            if (o.nimi == tmp.nimi) {
                selected = true;
            }
        });
        if (selected) {
        */
            var tip = '';
            var has_tip = '';
            if (tmp.kommentti != null) {
                tip = tmp.kommentti;
                has_tip = '*';
            }
        str += '<div title="'+tip+'">'+
            tmp.nimi+': '+tmp.begin+' .. '+tmp.end+' '+has_tip+
            '</div>';
            c++;
        /*}*/
    });
    if (c == 0) {
        str = 'Mittaustietoja ei ole toistaiseksi tarjolla.';
    }
    info += '<div>'+str+'</div>';
    $('#location_info').html(info);
}

function locations_info() {
    $('#location_info').html('');
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        location_info(datasets[koodi]);
    });
    $('#location_info').accordion("refresh");
    $('.mpad').click(function(e){
        var f = null;
        $.each(sensor_layer.selectedFeatures, function(i, feature) {
            if (feature.attributes.koodi == e.toElement.id)
                f = feature;
        });
        syncing = true;
        selectControl.unselect(f);
        syncing = false;
        sync_locations_to_features();
        locations_info();
    });
}

function variables_info() {
    var info = '';
    $("#variable :selected").each(function() {
        var suure = $(this).val();
        var o = variables[suure];
        info += "<h3>"+o.nimi+
            '<div title="Poista valituista" class="mad" id="'+o.suure+'" style="float: right;">[X]</div>'+
            "</h3>"+"<div>";
        if (o.kuvaus != null)
            info += o.kuvaus+".<br />";
        if (o.yksikko != null)
            info += "Yksikkö (y-akseli kuvaajassa): "+o.yksikko+".";
        info += "</div>";
    });
    $('#variable_info').html(info);
    $('#variable_info').accordion("refresh");
    $('.mad').click(function(e){
        var tmp = [];
        $.each(selected_variables, function(muuttuja, x) {
            if (muuttuja != e.toElement.id)
                tmp.push(muuttuja);
        });
        $('#variable option').removeAttr('selected');
        $('#variable').val(tmp);
        selected_variables = {};
        $.each(tmp, function(i, muuttuja) {
            selected_variables[muuttuja] = 1;
        });
        variables_info();
    });
}

function sync_variables_to_locations() {
    selected_variables = {};
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        $.each(datasets[koodi].muuttujat, function(i, muuttuja) {
            selected_variables[muuttuja] = 1;
        });
    });
    var tmp = [];
    $.each(selected_variables, function(muuttuja, x) {
        tmp.push(muuttuja);
    });
    $('#variable option').removeAttr('selected');
    $('#variable').val(tmp);
}

function sync_locations_to_features() {
    if (datasets == null) return;
    var koodit = [];
    selected_locations = {};
    $.each(sensor_layer.selectedFeatures, function(i, feature) {
        var dataset = datasets[feature.attributes.koodi];
        if (dataset != null) {
            koodit.push(dataset.koodi);
            selected_locations[dataset.koodi] = 1;
        }
    });
    $('#location option').removeAttr('selected');
    $('#location').val(koodit);
}

function sync_locations_to_variables() {
    selected_locations = {};
    $("#variable :selected").each(function() {
        var variable = $(this).val();
        // which dataset has this variable?
        $.each(datasets, function(i, dataset) {
            $.each(dataset.muuttujat, function(i, dataset_variable) {
                if (dataset_variable == variable) 
                    selected_locations[dataset.koodi] = 1;
            });
        });
    });
    var tmp = [];
    $.each(selected_locations, function(koodi, x) {
        tmp.push(koodi);
    });
    $('#location option').removeAttr('selected');
    $('#location').val(tmp);
}

function feature_selection_event(add) {
    if (syncing) return;
    sync_locations_to_features();
    if (add)
        sync_variables_to_locations();
    locations_info();
    if (add) {
        variables_info();
        set_begin_date();
    }
}

function sync_features_to_locations() {
    if (selectControl == null) return;
    syncing = true;
    selectControl.unselectAll();
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        $.each(sensor_layer.features, function(i, feature) {
            if (feature.attributes.koodi == koodi)
                selectControl.select(feature);
        });
    });
    syncing = false;
}

function selectLocation() {
    clearPopup();
    // only sync variables if a new selection
    var new_selection = true;
    var new_selected_locations = {};
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        if (selected_locations[koodi]) new_selection = false;
        new_selected_locations[koodi] = 1;
    });
    selected_locations = new_selected_locations;
    sync_features_to_locations();
    if (new_selection) {
        sync_variables_to_locations();
        variables_info();
    }
    locations_info();
    set_begin_date();
}

function selectVariable() {
    // only sync locations if a new selection
    var new_selection = true;
    var new_selected_variables = {};
    $("#variable :selected").each(function() {
        var muuttuja = $(this).val();
        if (selected_variables[muuttuja]) new_selection = false;
        new_selected_variables[muuttuja] = 1;
    });
    selected_variables = new_selected_variables;
    if (new_selection) {
        sync_locations_to_variables();
        sync_features_to_locations();
        set_begin_date();
    }
    locations_info();
    variables_info();
}

function create_sensor_layer(options) {
    options = $.extend({visibility: true, blockingDialog: false}, options);

    sensor_layer = new OpenLayers.Layer.Vector("Mittauskohteet", {
        strategies: [
            new OpenLayers.Strategy.BBOX(),
            new OpenLayers.Strategy.Fixed()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: config.url.mittauspisteet,
            featureType: config.prefix.mittauspisteet+".mittauskohteet.geom",
            outputFormat: "GML2"
        }),
        visibility: options.visibility,
        extractAttributes: true,
        styleMap: styleMap({graphic: 'star', pointRadius: config.featureSize})
    });

    sensor_layer.featurePopupText = function(feature) {
        return {title:feature.attributes.nimike, 
                body:feature.attributes.info, 
                width : 250, 
                height : 150};
    };

    sensor_layer.events.on({
        featureselected: function(obj) {
            var feature = obj.feature;
            if (options.blockingDialog) {
                var contents = sensor_layer.featurePopupText(feature, {interactive: true});
                contents.block = true;
                addPopup(feature, contents);
            }
            feature_selection_event(true);
        },
        featureunselected: function() {
            if (options.blockingDialog) {
                clearPopup({unblock: true});
            }
            feature_selection_event(false);
        }
    });

    return sensor_layer;
}
