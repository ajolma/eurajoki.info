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
    <?php include "design/include.html"; ?>

    <link rel="stylesheet" type="text/css" href="/jquery/jquery-ui.css" />
    
    <script language="javascript" type="text/javascript" src="/jquery/jquery.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery-ui.js"></script>
    
    <script src="/OpenLayers/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>
    <script type="text/javascript" src="app/base-layers.js"></script>
    <script type="text/javascript" src="app/overlays.js"></script>
    <script type="text/javascript" src="app/map.js"></script>
    <script type="text/javascript" src="app/init-atlas.js"></script>
    <link rel="stylesheet" type="text/css" href="css/atlas.css" />
  </head>
  <body>
    <div class="main">
      <div class="header_resize">
        <div class="logo"><h1><a href="index.php"><small>&nbsp;</small><br />Eurajoki.info</a></h1></div>
        <div class="logo_text"><?php include "content/top-links.html"; ?></div>
        <div class="clr"></div>
      </div>
      <div class="headert_text_resize">
        <div class="menu"><?php include "content/topmenu.html"; ?></div>
        <div class="clr"></div>
      </div>
      <div class="body">
        <button id="opener">Kasvillisuusvalinnat</button>
        <div id="dialog" title="Kasvillisuus">
          <ol id="selectable"></ol>
        </div>

        <div id="map">
        </div>
        <?php include "content/footer.html"; ?>
      </div>
    </div>
  </body>
</html>
