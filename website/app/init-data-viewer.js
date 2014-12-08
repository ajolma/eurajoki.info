var map;
var server = 'ajolma.net';
//var server = '54.247.187.88';
//var server = 'localhost';
var wfs_server = 'http://'+server+'/Eurajoki/wfs.pl';
var sos_server = 'http://'+server+'/Eurajoki/m5json.pl?raaka='+raaka+'&';
var auto_plot = 0;

function init() {

    var layers = taustakartat();

    mittaritLayer(layers);

    map = map();

    map.addLayers(layers);

    createControlsForMittarit(map);
    
    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

}

function onDatasetsReceived(param) {
    datasets = param;
    $.each(datasets, function(i, dataset) {
        var html = '<option value="'+dataset.koodi+'"';
        if (locs[dataset.koodi]) html += ' selected';
        html += '>'+dataset.nimike+'</option>';
        $("#location").append(html);
    });
    auto_plot++;
    if (auto_plot == 3) {
        sync_features_to_locations(); // does not do what we want since the map is probably not ready yet
        plot();
    }
}

function onVariablesReceived(param) {
    variables = param;
    $.each(variables, function(i, variable) {
        var html = '<option value="'+variable.suure+'"';
        if (vars[variable.suure]) html += ' selected';
        html += '>'+variable.nimi+'</option>';
        $("#variable").append(html);
    });
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

        // annotation texts
        //var o = plot.pointOffset({ x: ann_time, y: 0 });
        //var ann = "Rajuja ukkoskuuroja";
        //placeholder.append("<div style='position:absolute;left:" + 
        //                   (o.left + 4) + "px;top:" + (o.top - 10) + 
        //                   "px;color:#666;font-size:smaller'>" + ann + "</div>");

        // more than one y-axis:
        var yaxis_width = 30; // this is a guess for now! probably this is not a constant
        var left = (selected_variables.length-1)*yaxis_width;
        selected_variables.each(function() {
            var v = $(this).val();
            $.each(variables, function(i, variable) {
                if (v == variable.suure) {
                    placeholder.append(
                        "<div style='position:absolute;left:"+left+"px;top:20px;color:#666;font-size:smaller'>"+
                            variable.yksikko+"</div>");
                    left -= yaxis_width;
                }
            });
        });
    }
    
    var get = 'from='+$("#beginDate").val()+'&to='+$("#endDate").val();
    var php_get = get;
    selected_variables.each(function() {
        var v = $(this).val();
        v = v.replace("+","%2B");
        get += '&suure='+v;
        php_get += '&suure%5B%5D='+v;
    });
    selected_locations.each(function() {
        var v = $(this).val();
        get += '&paikka='+v;
        php_get += '&paikka%5B%5D='+v;
    });
    var data_get = sos_server+'request=GetDataset'+'&max=5000&'+get;
    var page_get = '/data.php?'+php_get;
    $("#data_link").html('<a href="'+data_get+'" target="_blank">linkki JSON-muotoiseen dataan</a>');
    $("#page_link").html('<a href="'+page_get+'">linkki tähän kuvaajaan</a> (kopiointia varten) <font color="gray">(linkki on hieman rikki: linkistä avautuvalla sivulla paikat eivät tulee valituiksi kartalla)</font>');
    
    $.ajax({
        url: data_get,
        type: "GET",
        dataType: "json",
        success: onDatasetReceived
    });
}

$(function() {

    $.ajax({
	url: sos_server+'request=GetDatasets',
	type: "GET",
	dataType: "json",
	success: onDatasetsReceived
    });
    
    $.ajax({
	url: sos_server+'request=GetVariables',
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
    if (date1) {
        var d = date1.split("-");
        $("#endDate").val(d[0]+'-'+d[1]+'-'+d[2]);
    }
    
    $("#beginDate").datepicker();
    $("#beginDate").datepicker("option", "dateFormat", "yy-mm-dd");
    mon--;if (mon < 1) {mon = 12;year--;}
    $("#beginDate").val(year+'-'+mon+'-'+day);
    if (date0) {
        var d = date0.split("-");
        $("#beginDate").val(d[0]+'-'+d[1]+'-'+d[2]);
    }
    
    $("#plot").click(plot);

    if (date0) {
        auto_plot = 1;
    }

    init();

});
