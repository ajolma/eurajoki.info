var mittarit; // created by mittaritLayer() in init()
var datasets; // set to received data in jquery initialization
var variables; // set to received data in jquery initialization
var selectControl;
var hoverControl;
var hoverControl2;
var syncing = false;
var selected_variables = {};
var selected_locations = {};

MyStyle = function(color,graphic) {
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
    if (raaka) {
        raw = ' (raakadataa)'
    }
    var info = $('#location_info').html();
    var tip = '';
    var has_tip = '';
    if (data.kommentti != null && data.kommentti != '') {
        tip = data.kommentti;
        has_tip = '*';
    }
    info += "<b><div title=\""+tip+"\">"+data.nimike+' '+has_tip+"</b>"+raw+":</div>";
    var str = '';
    $.each(data.muuttujat, function(index, code) {
        var tmp = data.muuttujat2[code];
        var selected = false;
        $("#variable :selected").each(function() {
            var suure = $(this).val();
            var o = variables[suure];
            if (o.nimi == tmp.nimi) {
                selected = true;
            }
        });
        if (selected) {
            var tip = '';
            var has_tip = '';
            if (tmp.kommentti != null) {
                tip = tmp.kommentti;
                has_tip = '*';
            }
            str += "<div title=\""+tip+"\">"+tmp.nimi+': '+tmp.begin+' .. '+tmp.end+' '+has_tip+'</div>';
        }
    });
    if (str == '') {
        str = 'Mittaustietoja ei ole toistaiseksi tarjolla valituista muuttujista.<br />';
    }
    info += str;
    $('#location_info').html(info);
}

function locations_info() {
    document.getElementById('location_info').innerHTML = '';
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        location_info(datasets[koodi]);
    });
}

function variables_info() {
    var info = '<br />';
    $("#variable :selected").each(function() {
        var suure = $(this).val();
        var o = variables[suure];
        if (o.kuvaus != null)
            info += "<b>"+o.nimi+"</b><br />&nbsp;&nbsp;&nbsp;&nbsp;"+o.kuvaus+"<br />";
    });
    $('#variable_info').html(info);
}

function sync_variables() { // to locations
    selected_variables = {};
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        $.each(datasets[koodi].muuttujat, function(j, muuttuja) {
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
    var koodit = [];
    selected_locations = {};
    $.each(mittarit.selectedFeatures, function(i, feature) {
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

function feature_selection_event() {
    if (syncing) return;
    sync_locations_to_features();
    sync_variables();
    locations_info();
    variables_info();
    set_begin_date();
}

function sync_features_to_locations() {
    syncing = true;
    selectControl.unselectAll();
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        $.each(mittarit.features, function(i, feature) {
            if (feature.attributes.koodi == koodi)
                selectControl.select(feature);
        });
    });
    syncing = false;
}

function selectLocation() {
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
        sync_variables();
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

function mittaritLayer(layers) {

    var styleMap = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style(new MyStyle("blue","star")),
        select: new OpenLayers.Style(new MyStyle("red","star")),
        temporary: new OpenLayers.Style(new MyStyle("yellow","star"))
    });
    
    mittarit = new OpenLayers.Layer.Vector("Mittauskohteet", {
        strategies: [
            new OpenLayers.Strategy.BBOX(),
            new OpenLayers.Strategy.Fixed()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: wfs_server,
            featureType: "ej.mittauskohteet.geom",
            outputFormat: "GML2"
        }),
        visibility: true,
        extractAttributes: true,
        styleMap: styleMap
    });

    mittarit.events.on({
        featureselected: feature_selection_event,
        featureunselected: feature_selection_event
    });

    layers.push(mittarit);
}

function createControlsForMittarit(map) {
    selectControl = new OpenLayers.Control.SelectFeature(mittarit, {
        clickout: false,
        toggle: true,
        multiple: true
    });
    
    hoverControl = new OpenLayers.Control.SelectFeature(mittarit, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary"
    });

    hoverControl2 = new OpenLayers.Control.OverFeature(mittarit);
    
    map.addControl(hoverControl);
    map.addControl(hoverControl2);
    map.addControl(selectControl);
    hoverControl.activate();
    hoverControl2.activate();
    selectControl.activate();
    
}
