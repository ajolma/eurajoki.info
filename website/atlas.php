<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- This file is part of eurajoki.info
     https://github.com/ajolma/eurajoki.info
     Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 -->
<?php $page='atlas'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Atlas</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <meta http-equiv="EXPIRES" content="Wed, 13 Nov 2013 20:00:00 GMT" />

    <?php header('Access-Control-Allow-Origin: *'); ?>

    <?php include "design/include.html"; ?>
    <link rel="stylesheet" type="text/css" href="/jquery/jquery-ui.css" />
    <link rel="stylesheet" type="text/css" href="/jquery/colorbox.css" />
    <link rel="stylesheet" type="text/css" href="css/atlas.css" />
    
    <script language="javascript" type="text/javascript" src="/jquery/jquery.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery-ui.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.colorbox.js"></script>
    
    <script src="/OpenLayers/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>

    <?php include "lib/url2js.php"; ?>
    <script language="javascript" type="text/javascript" src="/app/config.js"></script>
    <script language="javascript" type="text/javascript" src="/app/base-layers.js"></script>
    <script language="javascript" type="text/javascript" src="/app/controls.js"></script>
    <script language="javascript" type="text/javascript" src="/app/overlays.js"></script>
    <script language="javascript" type="text/javascript" src="/app/sensor-layer.js"></script>
    <script language="javascript" type="text/javascript" src="/app/story-layer.js"></script>
    <script language="javascript" type="text/javascript" src="/app/vegetation-layer.js"></script>
    <script language="javascript" type="text/javascript" src="/app/map.js"></script>
    <script language="javascript" type="text/javascript" src="/app/init-atlas.js"></script>
    
  </head>
  <body>
    <div class="main">
      <?php include "content/header.html"; ?>
      <div class="headert_text_resize">
        <div class="menu"><?php include "content/topmenu.html"; ?></div>
        <div class="clr"></div>
      </div>
      <div class="body">

        <div id="dialog" title="Kasvillisuus">
          <ol id="selectable"></ol>
        </div>

        <table id="atlas_layout" style="width:100%"><tbody><tr><td><div id="map"></div></td><td width=175px valign="top">
                <h3>Karttatasot</h3>
                <div class="map_overlays"></div>
                <h3>Taustakartta</h3>
                <div class="backgroundmap"></div>
                <br />
                <?php include "content/vegetation_panel.html"; ?>
                <?php include "content/stories_panel.html"; ?>
                <?php include "content/sensors_panel.html"; ?>
                <?php include "content/aerial_photos_panel.html"; ?>
                <?php include "content/basemap_1962_panel.html"; ?>
                <?php include "content/senate_maps_panel.html"; ?>
        </td></tr></tbody></table>

      </div>
      <?php include "content/footer.html"; ?>
    </div>
  </body>
</html>
