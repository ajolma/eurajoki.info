
function init() {

    // story editor set up:
    if (editor == 1) {
        identity_form();
        set_identity_callback = new_identity;
    }

    map = map();

    var layers = taustakartat();
    map.addLayers(layers);
    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    var overlayers = overlays();
    
    map.addLayers(overlayers);

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

    var styleMap = new OpenLayers.StyleMap({
        "default": new OpenLayers.Style(new MyStyle("blue","star")),
        select: new OpenLayers.Style(new MyStyle("red","star")),
        temporary: new OpenLayers.Style(new MyStyle("red","star"))
    });

    storiesLayer = new OpenLayers.Layer.Vector("Omat kohteet", {
        strategies: [
            new OpenLayers.Strategy.BBOX()
        ],
        protocol: new OpenLayers.Protocol.WFS.v1_1_0({
            version: "1.1.0",
            srsName: "EPSG:3857",
            url: wfs_server,
            featureType: "ej.public_tarinat.geom",
            outputFormat: "GML2"
        }),
        visibility: true,
        extractAttributes: true,
        styleMap: styleMap
    });
    map.addLayer(storiesLayer);

    hoverControl = new OpenLayers.Control.SelectFeature(storiesLayer, {
        hover: true,
        highlightOnly: true,
        renderIntent: "temporary",
        eventListeners: {
            featurehighlighted: function (evt) {
                clearPopup();
                var feature = evt.feature;
                var panel = "";
                if (feature.attributes.id != undefined) {
                    var formCommon = 
                        '<input type="hidden" name="story" value="'+feature.attributes.id+'">';
                    var pictureForm =
                        '<form id="PictureForm" method="post" action="'+picture_server+'" target="PictureWindow">'+
                        formCommon+
                        '<input type="submit" value="Katso tarinaan liittyvät kuvat" onclick="openPictureWindow()">'+
                        '</form>';
                    panel = '<h2>'+feature.attributes.otsikko+'</h2>'+
                        feature.attributes.story+pictureForm;
                }
                popup = new OpenLayers.Popup.FramedCloud(
                    "featurePopup",
                    feature.geometry.getBounds().getCenterLonLat(),
                    new OpenLayers.Size(400,300),
                    panel,
                    null, true, clearPopup);
                popup.autoSize = false;
                map.addPopup(popup, true);
            }
        }
    });
    
    map.addControl(hoverControl);
    hoverControl.activate();

}
