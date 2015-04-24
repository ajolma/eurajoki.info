<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- This file is part of eurajoki.info
     https://github.com/ajolma/eurajoki.info
     Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 -->
<?php $page='data'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Mittaustieto</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <meta http-equiv="Expires" content="Wed, 13 Nov 2013 20:00:00 GMT" />
    <?php include "design/include.html"; ?>

    <link rel="stylesheet" type="text/css" href="/jquery/jquery-ui.css" />
    <style>
      .ui-datepicker{ z-index: 9999 !important; }
      .ui-accordion .ui-accordion-content { padding: 0.5em 0.3em; }
      .ui-widget-content a { color: #69bacb; }
    </style>
    <link rel="stylesheet" type="text/css" href="design/data.css" />
    
    <!--[if lte IE 8]><script language="javascript" type="text/javascript" src="/jquery/excanvas.js"></script><![endif]-->
    <script language="javascript" type="text/javascript" src="/jquery/jquery.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery-ui.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.flot.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.flot.time.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.flot.navigate.js"></script>

    <script src="/OpenLayers/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>
    <?php 
echo "<script>";
if (isset($_GET["raaka"])) {echo "var raaka=1;";}else{echo "var raaka=0;";}
if (isset($_GET["from"])) {echo "var date0='".$_GET["from"]."';";}else{echo "var date0=0;";}
if (isset($_GET["to"])) {echo "var date1='".$_GET["to"]."';";}else{echo "var date1=0;";}
if (isset($_GET["paikka"])) {
    echo "var locs={";
    $locs = $_GET['paikka'];
    $n = count($locs);
    for($i = 0; $i < $n; $i++) {
        echo "'".$locs[$i]."': 1";
        if ($i < $n-1)
            echo ",";
    }
    echo "};";
} else {
    echo "var locs={};";
}
if (isset($_GET["suure"])) {
    echo "var vars={";
    $vars = $_GET['suure'];
    $n = count($vars);
    for($i = 0; $i < $n; $i++) {
        echo "'".$vars[$i]."': 1";
        if ($i < $n-1)
            echo ",";
    }
    echo "};";
} else {
    echo "var vars={};";
}
echo "</script>"; 
?>
    <script language="javascript" type="text/javascript" src="/app/base-layers.js"></script>
    <script language="javascript" type="text/javascript" src="/app/sensor-layer.js"></script>
    <script language="javascript" type="text/javascript" src="/app/map.js"></script>
    <script language="javascript" type="text/javascript" src="/app/hover.js"></script>
    <script language="javascript" type="text/javascript" src="/app/init-data-viewer.js"></script>
  </head>
  <body>
    <?php include "content/fb-boot.html"; ?>  
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
          <div id="data_link"></div>
          <div id="page_link"></div>
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
