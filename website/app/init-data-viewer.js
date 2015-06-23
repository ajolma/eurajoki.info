/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var map;
var auto_plot = 0;

function init() {

    $.datepicker.setDefaults({
        closeText: "Valmis", // Display text for close link
        prevText: "Edel", // Display text for previous month link
        nextText: "Seur", // Display text for next month link
        currentText: "Tänään", // Display text for current month link
        monthNames: ["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu",
                     "Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"], // Names of months for drop-down and formatting
        monthNamesShort: ["Tam", "Hel", "Maa", "Huh", "Tou", "Kes", "Hei", "Elo", "Syy", "Lok", "Mar", "Jou"], // For formatting
        dayNames: ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"], // For formatting
        dayNamesShort: ["Sun", "Maa", "Tii", "Kes", "Tor", "Per", "Lau"], // For formatting
        dayNamesMin: ["Su","Ma","Ti","Ke","To","Pe","La"], // Column headings for days starting at Sunday
        weekHeader: "Vko", // Column header for week of the year
        dateFormat: "dd.mm.yy", // See format options on parseDate
        firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
        isRTL: false, // True if right-to-left language, false if left-to-right
        showMonthAfterYear: false, // True if the year select precedes month, false for month then year
        yearSuffix: "" // Additional text to append to the year in the month headers
    });

    map = make_map();
    
    var layers = taustakartat();

    var sensor_layer = create_sensor_layer();
    sensor_layer.events.register('loadend', sensor_layer, function () {
        sync_features_to_locations();
    });
    layers.push(sensor_layer);

    map.addLayers(layers);

    createControls({hoverLayers:sensor_layer, selectLayers:sensor_layer, multiple: true, clickout: false, closeBox: false});
    
    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    map.events.register('mouseover', map, function (e) {
        clearPopup();
    });

}

function onDatasetsReceived(param) {
    datasets = param;
    var sortable = [];
    $.each(datasets, function(i, dataset) { sortable.push(dataset); });
    sortable.sort(function(a, b) { return a.nimike.localeCompare(b.nimike) })
    $.each(sortable, function(i, dataset) {
        var html = '<option value="'+dataset.koodi+'"';
        if (containsObject(dataset.koodi,config.paikka)) html += ' selected';
        html += '>'+dataset.nimike+'</option>';
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
        var html = '<option value="'+variable.suure+'"';
        if (containsObject(variable.suure,config.suure)) html += ' selected';
        html += '>'+variable.nimi+'</option>';
        $("#variable").append(html);
    });
    variables_info();
    auto_plot++;
    if (auto_plot == 3) {
        sync_features_to_locations(); // does not do what we want since the map is probably not ready yet
        plot();
    }
}

function plot() {
    
    var placeholder = $("#placeholder");
    var selected_locations = $("#location :selected");
    var selected_variables = $("#variable :selected");
    
    function onDatasetReceived(data) {
        var ann_time = 1407240000000;
        var options = {
            canvas: true,
            xaxis: { 
                mode: "time",
                timezone: "browser"
            },
            zoom: {
                interactive: true
            },
            pan: {
                interactive: true
            },
            grid: {
                //markings: [
                //    { color: '#ff0000', linewidth: 1, xaxis: { from: ann_time, to: ann_time } }
                //]
            }
        };
        var plot = $.plot(placeholder, data, options);
        var y = plot.getYAxes();

        // annotation texts
        //var o = plot.pointOffset({ x: ann_time, y: 0 });
        //var ann = "Rajuja ukkoskuuroja";
        //placeholder.append("<div style='position:absolute;left:" + 
        //                   (o.left + 4) + "px;top:" + (o.top - 10) + 
        //                   "px;color:#666;font-size:smaller'>" + ann + "</div>");

        // more than one y-axis:
        var left = 0;
        var i;
        for (i = 0; i < y.length; i++) {
            left += y[i].box.width+y[i].box.padding;
        }
        i = 0;
        selected_variables.each(function() {
            var v = $(this).val();
            $.each(variables, function(code, variable) {
                if (v == variable.suure) {
                    //console.log(v+' '+i);
                    left -= y[i].box.width+y[i].box.padding;
                    //console.log(variable.yksikko+' '+i+' '+y[i].box.width+' '+left);
                    i++;
                    placeholder.append("<div style='position:absolute;left:"+
                                       left + "px;top:20px;color:#666;font-size:smaller'>"+
                                       variable.yksikko + "</div>");
                }
            });
        });

        $('#save').click(function() {
            var canvas = plot.getCanvas();
            Canvas2Image.saveAsPNG(canvas, canvas.width, canvas.height, 'eurajoki.info.mittaustietoa.png', true);
        });
    }
    
    var get = 'from='+$("#beginDate").val()+'&to='+$("#endDate").val();
    var i = 0;
    selected_variables.each(function() {
        var v = $(this).val();
        v = v.replace("+","%2B");
        get += '&suure'+i+'='+v;
        i++;
    });
    i = 0;
    selected_locations.each(function() {
        var v = $(this).val();
        get += '&paikka'+i+'='+v;
        i++;
    });
    var data_get = config.url.data+'request=GetDataset'+'&max=5000&'+get;
    var page_get = location.origin+location.pathname+'?'+get;
    $("#data_link").html('<a href="'+data_get+'" target="_blank">linkki JSON-muotoiseen dataan</a>');
    $('#share').html('<div id="share" class="fb-share-button" data-href="' + page_get + '" data-layout="icon_link"></div>');
    if (typeof FB !== 'undefined') {
        FB.XFBML.parse(document.getElementById('share'));
    }
    window.history.pushState("", "", page_get);
    
    $.ajax({
        url: data_get,
        type: "GET",
        dataType: "json",
        success: onDatasetReceived
    });
}

$(function() {

    config();

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

    var date = new Date();
    var day = date.getDate();
    var mon = date.getMonth()+1;
    var year = date.getFullYear();
    $("#endDate").datepicker();
    $("#endDate").datepicker("option", "dateFormat", "yy-mm-dd");
    $("#endDate").val(year+'-'+mon+'-'+day);
    if (config.to) {
        var d = config.to.split("-");
        $("#endDate").val(d[0]+'-'+d[1]+'-'+d[2]);
    }
    
    $("#beginDate").datepicker();
    $("#beginDate").datepicker("option", "dateFormat", "yy-mm-dd");
    mon--;if (mon < 1) {mon = 12;year--;}
    $("#beginDate").val(year+'-'+mon+'-'+day);
    if (config.from) {
        var d = config.from.split("-");
        $("#beginDate").val(d[0]+'-'+d[1]+'-'+d[2]);
    }
    
    $("#plot").click(plot);

    if (config.from) {
        auto_plot = 1;
    }

    init();

    $('#data_info').accordion({collapsible: true});
    $('#data_info .ui-accordion-header').trigger("click");
    $('#location_info').accordion({collapsible: true});
    $('#variable_info').accordion({collapsible: true});

});
