/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

function init() {

    // story editor set up:
    if (editor == 1) {
        identity_form();
        set_identity_callback = new_identity;
    }

    map = make_map();

    var layers = taustakartat();

    map.addLayers(layers);
    
    layers = overlays();
    layers.push(create_story_layer());
    
    map.addLayers(layers);

    create_controls(story_layer, story_layer);

    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

}
