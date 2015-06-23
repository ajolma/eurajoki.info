<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- This file is part of eurajoki.info
     https://github.com/ajolma/eurajoki.info
     Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 -->
<?php $page='data'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Mittaustieto</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <meta http-equiv="Expires" content="Wed, 13 Nov 2013 20:00:00 GMT" />

    <?php
    print "<meta property=\"og:url\" content=\"http://".$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']."\" />\n";
    ?>
    <meta property="og:title" content="Eurajoki.info | Mittaustietoa" />
    <meta property="og:image" content="http://eurajoki.info/images/mittaustieto.jpg" />

    <link rel="shortcut icon" href="/favicon.ico" /> 
    <?php include "design/include.html"; ?>

    <link rel="stylesheet" type="text/css" href="/jquery/jquery-ui.css" />
    <link rel="stylesheet" type="text/css" href="css/data.css" />
    
    <!--[if lte IE 8]><script language="javascript" type="text/javascript" src="/jquery/excanvas.js"></script><![endif]-->
    <script language="javascript" type="text/javascript" src="/jquery/jquery.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery-ui.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.flot.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.flot.time.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.flot.navigate.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.flot.canvas.js"></script>

    <script language="javascript" type="text/javascript" src="/lib/canvas2image.js"></script>

    <script src="/OpenLayers/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>

    <script language="javascript" type="text/javascript" src="app/util.js"></script>
    <script language="javascript" type="text/javascript" src="app/config.js"></script>
    <script language="javascript" type="text/javascript" src="app/base-layers.js"></script>
    <script language="javascript" type="text/javascript" src="app/overlays.js"></script>
    <script language="javascript" type="text/javascript" src="app/controls.js"></script>
    <script language="javascript" type="text/javascript" src="app/sensor-layer.js"></script>
    <script language="javascript" type="text/javascript" src="app/map.js"></script>
    <script language="javascript" type="text/javascript" src="app/init-data-viewer.js"></script>

  </head>
  <body>
    <?php include "content/fb-boot.html"; ?>
    <div class="main">
      <?php include "content/header.html"; ?>
      <div class="headert_text_resize">
        <div class="menu"><?php include "content/topmenu.html"; ?></div>
        <div class="clr"></div>
      </div>
      <div class="body">
        <div class="body_resize">
          <div class="map_left">
            <div id="map"></div>
            <table>
              <tr><th>Paikka</th><th>Muuttuja</th><th>AlkuPvm</th><th>LoppuPvm</th><th></th></tr>
              <tr>
                <td><select multiple id="location" size=6 onChange="javascript:selectLocation();"></select></td>
                <td><select multiple id="variable" size=6 onChange="javascript:selectVariable();"></select></td>
                <td><input type="text" id="beginDate" size="10" /></td>
                <td><input type="text" id="endDate" size="10" /></td>
                <td><input type="button" value="Päivitä" id="plot" /></td>
              </tr>
            </table>
          </div>
          <div class="map_right">
            <div id="data_info"><?php include "content/data-info.html"; ?></div>
            <h3>Valitut mittauspisteet</h3>
            <div id="location_info"></div>
            <h3>Valitut muuttujat</h3>
            <div id="variable_info"></div>
          </div>
          <div class="clr"></div>
          <div id="content">          
            <div class="flot-container">
              <div id="placeholder" class="flot-placeholder"></div>
            </div>
          </div>
          <!-- <button id="save">Lataa kuvaaja</button> -->
          <div id="data_link" style="float: right;"></div>
          <div id="share" class="fb-share-button" data-href="data.php" data-layout="icon_link"></div>
        </div>
      </div>
      <div class="FBG">
        <div class="FBG_resize">
          <div class="blok">
            <?php include "content/gallery.html"; ?>
          </div>
          <div class="blok">
            <h2>Kommentoi/keskustele</h2>
            <div class="fb-comments"
                 data-href="http://eurajoki.info/data.php"
                 data-colorscheme="light" data-numposts="10"
                 data-width="400"></div>
          </div>      
          <div class="clr"></div>
        </div>
      </div>
      <?php include "content/footer.html"; ?>
    </div>
  </body>
</html>
