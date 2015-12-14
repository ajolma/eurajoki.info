var auto_plot = 0;
var syncing = false;
var selected_variables = {};
var selected_locations = {};
var sensorLayer = null; // layer as defined in layers.js

function onDatasetsReceived(param) {
    datasets = param;
    var sortable = [];
    $.each(datasets, function(i, dataset) { sortable.push(dataset); });
    sortable.sort(function(a, b) { return a.nimike.localeCompare(b.nimike) })
    $.each(sortable, function(i, dataset) {
        var attrs = {value:dataset.koodi};
        if (containsObject(dataset.koodi,config.paikka)) attrs.selected = 'selected';
        var html = element('option', attrs, dataset.nimike);
        $("#location").append(html);
    });
    locations_info();
    //$('#location_info .ui-accordion-header').trigger("click");
    auto_plot++;
    if (auto_plot == 3) {
        sync_features_to_locations(); // in case loadend event was before we got here
        plot();
    }
}

function onVariablesReceived(param) {
    variables = param;
    $.each(variables, function(i, variable) {
        var attrs = {value:variable.suure};
        if (containsObject(variable.suure,config.suure)) attrs.selected = 'selected';
        var html = element('option', attrs, variable.nimi);
        $("#variable").append(html);
    });
    variables_info();
    auto_plot++;
    if (auto_plot == 3) {
        sync_features_to_locations(); // does not do what we want since the map is probably not ready yet
        plot();
    }
}

function locations_info() {
    return;
    $('#location_info').html('');
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        location_info(datasets[koodi]);
    });
    $('#location_info').accordion("refresh");
    $('.mpad').click(function(e){
        var f = null;
        sensorLayer.layer.getSource().forEachFeature(function(feature) {
            if (feature.get('koodi') == e.toElement.id)
                f = feature;
        });
        syncing = true;
        sensorLayer.unselectFeature(f);
        syncing = false;
        sync_locations_to_features();
        locations_info();
    });
}

function variables_info() {
    return;
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

function selectLocation() {
    //clearPopup();
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
        sync_variables_to_locations(null);
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

function sync_variables_to_locations(feature) {
    if (feature != null) {
        // only add variables from this location to selected_variables
        $.each(datasets[feature.get('koodi')].muuttujat, function(i, muuttuja) {
            selected_variables[muuttuja] = 1;
        });
    } else {
        // add all variables from all locations to selected_variables
        selected_variables = {};
        $("#location :selected").each(function() {
            var koodi = $(this).val();
            $.each(datasets[koodi].muuttujat, function(i, muuttuja) {
                selected_variables[muuttuja] = 1;
            });
        });
    }
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
    sensorLayer.layer.getSource().forEachFeature(function(feature) {
        var dataset = datasets[feature.get('koodi')];
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

function sync_features_to_locations() {
    syncing = true;
    sensorLayer.unselectAllFeatures();
    $("#location :selected").each(function() {
        var koodi = $(this).val();
        sensorLayer.layer.getSource().forEachFeature(function(feature) {
            if (feature.get('koodi') == koodi)
                sensorLayer.selectFeature(feature);
        });
    });
    syncing = false;
}

function setupSensors() {
    $.ajax({
        url: config.url.data+'request=GetDatasets',
        type: "GET",
        dataType: "json",
        success: onDatasetsReceived
    });
    $.ajax({
        url: config.url.data+'request=GetVariables',
        type: "GET",
        dataType: "json",
        success: onVariablesReceived
    });
}
