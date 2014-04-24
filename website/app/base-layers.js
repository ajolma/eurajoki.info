function taustakartat() {
    var osm = new OpenLayers.Layer.OSM("OpenStreetMap");
    
    var gs = new OpenLayers.Layer.Google("Google Kartta", {
        numZoomLevels: 19
    });

    var gphy = new OpenLayers.Layer.Google("Google Maasto", {
        type: google.maps.MapTypeId.TERRAIN,
        numZoomLevels: 19
    });
    
    var gi = new OpenLayers.Layer.Google("Google Satelliitti", {
        type: google.maps.MapTypeId.HYBRID,
        numZoomLevels: 19
    });

    OpenLayers.Layer.MML = OpenLayers.Class(
        OpenLayers.Layer.XYZ,
        {
            name:"Maanmittauslaitos",
            attribution:'Sisältää Maanmittauslaitoksen aineistoa <a href="'+
                'http://www.maanmittauslaitos.fi/avoindata_lisenssi_versio1_20120501'+
                '">(lisenssi)</a>',
            sphericalMercator:true,
            url:'http://tiles.kartat.kapsi.fi/peruskartta/${z}/${x}/${y}.png',
            clone:function(obj){
                if(obj==null){
                    obj = new OpenLayers.Layer.MML(
                        this.name,this.url,this.getOptions()
                    );
                }
                obj=OpenLayers.Layer.XYZ.prototype.clone.apply(this,[obj]);
                return obj;
            },
            wrapDateLine:true,
            CLASS_NAME:"OpenLayers.Layer.MML"
        }
    );

    var tk = new OpenLayers.Layer.MML("MML Taustakartta", [
        "http://tile1.kartat.kapsi.fi/1.0.0/taustakartta/${z}/${x}/${y}.png",
        "http://tile2.kartat.kapsi.fi/1.0.0/taustakartta/${z}/${x}/${y}.png"
    ], {
        numZoomLevels: 19,
        sphericalMecator: true,
        transitionEffect: 'resize'
    });

    var pk = new OpenLayers.Layer.MML("MML Peruskartta", [
        "http://tile1.kartat.kapsi.fi/1.0.0/peruskartta/${z}/${x}/${y}.png",
        "http://tile2.kartat.kapsi.fi/1.0.0/peruskartta/${z}/${x}/${y}.png"
    ], {
        numZoomLevels: 19,
        sphericalMecator: true,
        transitionEffect: 'resize'
    });

    var orto = new OpenLayers.Layer.MML("MML Ortokuva", [
        "http://tile1.kartat.kapsi.fi/1.0.0/ortokuva/${z}/${x}/${y}.png",
        "http://tile2.kartat.kapsi.fi/1.0.0/ortokuva/${z}/${x}/${y}.png"
    ], {
        numZoomLevels: 19,
        sphericalMecator: true,
        transitionEffect: 'resize'
    });
    
    return [tk,pk,orto,osm,gi,gphy,gs];
}
