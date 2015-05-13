/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

function init() {

    config();

    // story editor set up:
    if (config.editor == 1) {
        identity_form();
        set_identity_callback = new_identity;
    }

    map = make_map();

    var layers = taustakartat();

    map.addLayers(layers);
    
    layers = overlays();
    layers.push(create_story_layer());
    
    map.addLayers(layers);

    createControls({hoverLayers:story_layer, selectLayers:story_layer, multiple: false, clickout: true});

    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    map.events.register('mouseover', map, function (e) {
        clearPopup({force:1});
    });
    
}
