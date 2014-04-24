function map() {

    return new OpenLayers.Map({
        div: "map",
        controls: [
            new OpenLayers.Control.Navigation(),
            new OpenLayers.Control.PanZoomBar(),
            new OpenLayers.Control.LayerSwitcher({ 'ascending': false }),
            new OpenLayers.Control.Permalink(),
            new OpenLayers.Control.ScaleLine({ geodesic: true }),
            new OpenLayers.Control.Permalink('permalink'),
            /*
              new OpenLayers.Control.MousePosition({
              suffix: '..............................................................................'}),
            */
            new OpenLayers.Control.OverviewMap(),
            new OpenLayers.Control.KeyboardDefaults(),
            new OpenLayers.Control.Attribution()
        ],
        projection: "EPSG:3857"
    });

}
