var map;
var wfs_server = 'http://54.247.187.88/Eurajoki/wfs.pl';
var sos_server = 'http://54.247.187.88/Eurajoki/m5json.pl?raaka='+raaka+'&';

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
            $("#location").append('<option value="'+dataset.koodi+'">'+dataset.nimike+'</option>');
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
            $("#variable").append('<option value="'+variable.suure+'">'+variable.nimi+'</option>');
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
    
    $("#beginDate").datepicker();
    $("#beginDate").datepicker("option", "dateFormat", "yy-mm-dd");
    mon--;if (mon < 1) {mon = 12;year--;}
    $("#beginDate").val(year+'-'+mon+'-'+day);
    
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
        
        var get = sos_server+'request=GetDataset'+'&max=5000'+
            '&from='+$("#beginDate").val()+
            '&to='+$("#endDate").val();

        selected_variables.each(function() {
            var v = $(this).val();
            v = v.replace("+","%2B");
            get += '&suure='+v;
        });
        $("#location :selected").each(function() {
            get += '&paikka='+$(this).val();
        });
        $("#data_link").html('<a href="'+get+'" target="_blank">data</a>');

        $.ajax({
            url: get,
            type: "GET",
            dataType: "json",
            success: onDatasetReceived
        });
    });

});
