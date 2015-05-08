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

    create_controls(story_layer, story_layer, {multiple: false, clickout: true});

    map.setCenter(new OpenLayers.LonLat(2438876,8665434), 10);

    map.events.register('mouseout', map, function (e) {
        if (e.toElement && e.toElement.nodeName == "DIV")
            clearPopup({force:1});
    });

}
