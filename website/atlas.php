<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<?php $page='atlas'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Atlas</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <meta http-equiv="EXPIRES" content="Wed, 13 Nov 2013 20:00:00 GMT" />
    <?php include "design/include.html"; ?>
    <script src="/OpenLayers-2.13.1/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>
    <script type="text/javascript" src="app/base-layers.js"></script>
    <script type="text/javascript" src="/app/map.js"></script>
    <script type="text/javascript" src="app/init-atlas.js"></script>
    <style type="text/css">
      .body{
      color:black;
      font-size:12px;
      font-family:tahoma,arial,verdana,sans-serif
      }
      #map {
      width: 100%;
      height: 700px;
      margin: 0;
      }
    </style>
  </head>
  <body onload="init()">
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
        <div id="map"></div>
      </div>
      <?php include "content/footer.html"; ?>
    </div>
  </body>
</html>
