function toggle_plot() {
    var plot = $('.plot');
    var hw = $(window).height() - 30;
    var h = plot.height();
    var hm = hw/2.5;
    if (h == 0) {
        hw -= hm;
        h = hm;
    } else {
        h = 0;
    }
    if (map) {
        var s = map.getSize();
        map.getView().setCenter(map.getCoordinateFromPixel([s[0]/2,hw/2]));
    }
    $('.gis').animate({height:hw}, 500);
    if (h == 0)
        plot.animate({height:h}, 500);
    else
        plot.animate({height:h}, 500, 'swing', show_plot);
    $('#map')
        .height(hw)
        .width($(window).width() - 200);
    if (map) {
        map.updateSize();
    }
}

function showPlot() {
    var plot = $('.plot');
    var hw = $(window).height() - 30;
    var h = plot.height();
    var hm = hw/2.5;
    if (h > 0) {
        show_plot();
        return;
    }
    hw -= hm;
    h = hm;
    if (map) {
        var s = map.getSize();
        map.getView().setCenter(map.getCoordinateFromPixel([s[0]/2,hw/2]));
    }
    $('.gis').animate({height:hw}, 500);
    plot.animate({height:h}, 500, 'swing', show_plot);
    $('#map')
        .height(hw)
        .width($(window).width() - 200);
    if (map) {
        map.updateSize();
    }
}

function hidePlot() {
    var plot = $('.plot');
    var hw = $(window).height() - 30;
    var h = plot.height();
    var hm = hw/2.5;
    if (h == 0) {
        return;
    }
    h = 0;
    if (map) {
        var s = map.getSize();
        map.getView().setCenter(map.getCoordinateFromPixel([s[0]/2,hw/2]));
    }
    $('.gis').animate({height:hw}, 500);
    plot.animate({height:h}, 500);
    $('#map')
        .height(hw)
        .width($(window).width() - 200);
    if (map) {
        map.updateSize();
    }
}

function show_plot() {
    
    var get = 'from='+$("#beginDate").val()+'&to='+$("#endDate").val();
    var i = 0;
    $("#variable :selected").each(function() {
        var v = $(this).val();
        v = v.replace("+","%2B");
        get += '&suure'+i+'='+v;
        i++;
    });
    i = 0;
    $("#location :selected").each(function() {
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
    //window.history.pushState("", "", page_get);
    
    $.ajax({
        url: data_get,
        type: "GET",
        dataType: "json",
        success: onDatasetReceived
    });
}

function onDatasetReceived(data) {
    var placeholder = $(".plot");
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
    $("#variable :selected").each(function() {
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
