function projection(epsg) {
    var proj = {};
    proj.projection = new ol.proj.Projection({
        code: 'EPSG:3067',
        extent: [-548576, 6291456, 1548576, 8388608],
        units: 'm'
    });
    ol.proj.addProjection(proj.projection);
    proj.view = new ol.View({
        projection: proj.projection,
        center: [238030, 6787145],
        zoom: 10
    });
    proj.extent = proj.projection.getExtent();
    var size = ol.extent.getWidth(proj.extent) / 256;
    var z_n = 16;
    proj.resolutions = new Array(z_n);
    proj.matrixIds = new Array(z_n);
    for (var z = 0; z < z_n; ++z) {
        proj.resolutions[z] = size / Math.pow(2, z);
        proj.matrixIds[z] = z;
    }
    return proj;
}
