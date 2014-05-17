var map;
var server = '54.247.187.88';
//var server = 'localhost';
var wfs_server = 'http://'+server+'/Eurajoki/wfs.pl';
var sos_server = 'http://'+server+'/Eurajoki/m5json.pl?raaka='+raaka+'&';

function init() {

    var layers = taustakartat();

    mittaritLayer(layers);

    map = map();

    map.addLayers(layers);

    createControlsForMittarit(map);
    
    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

}

$(function() {

    function onDatasetsReceived(param) {
        datasets = param;
        $.each(datasets, function(i, dataset) {
            var html = '<option value="'+dataset.koodi+'"';
            if (locs[dataset.koodi]) html += ' selected';
            html += '>'+dataset.nimike+'</option>';
            $("#location").append(html);
        });
    }
    
    $.ajax({
	url: sos_server+'request=GetDatasets',
	type: "GET",
	dataType: "json",
	success: onDatasetsReceived
    });

    function onVariablesReceived(param) {
        variables = param;
        $.each(variables, function(i, variable) {
            var html = '<option value="'+variable.suure+'"';
            if (vars[variable.suure]) html += ' selected';
            html += '>'+variable.nimi+'</option>';
            $("#variable").append(html);
        });
    }
    
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
    
    $("#plot").click(function() {

        var placeholder = $("#placeholder");
        var selected_variables = $("#variable :selected");

        function onDatasetReceived(data) {
            var options = {
                xaxis: { 
                    mode: "time" 
                },
                zoom: {
		    interactive: true
		},
		pan: {
		    interactive: true
		}
            };
            var plot = $.plot(placeholder, data, options);
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
        selected_variables.each(function() {
            var v = $(this).val();
            v = v.replace("+","%2B");
            get += '&suure='+v;
        });
        $("#location :selected").each(function() {
            get += '&paikka='+$(this).val();
        });
        var data_get = sos_server+'request=GetDataset'+'&max=5000&'+get;
        var page_get = '/data.php?'+get; // TÄHÄN TARVII []:t (fucking php)
        $("#data_link").html('<a href="'+data_get+'" target="_blank">linkki JSON-muotoiseen dataan</a>');
        $("#page_link").html('<a href="'+page_get+'">linkki tähän kuvaajaan</a>');

        $.ajax({
            url: data_get,
            type: "GET",
            dataType: "json",
            success: onDatasetReceived
        });
    });

});
