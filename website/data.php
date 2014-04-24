<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<?php $page='data'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Mittaustieto</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <meta http-equiv="Expires" content="Wed, 13 Nov 2013 20:00:00 GMT" />
    <?php include "design/include.html"; ?>
    <?php include "flot-0.8.2/include.html"; ?>
    <script src="/OpenLayers-2.13.1/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>
    <?php echo "<script>";
          if (isset($_GET["raaka"])) {echo "var raaka=1;";}else{echo "var raaka=0;";}
          echo "</script>"; ?>
    <script language="javascript" type="text/javascript" src="/app/base-layers.js"></script>
    <script language="javascript" type="text/javascript" src="/app/sensor-layer.js"></script>
    <script language="javascript" type="text/javascript" src="/app/map.js"></script>
    <script language="javascript" type="text/javascript" src="/app/hover.js"></script>
    <script language="javascript" type="text/javascript" src="/app/init-data-viewer.js"></script>
  </head>
  <body onload="init()">
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
              <tr><th>Paikka</th><th>Muuttuja</th><th>AlkuPvm</th><th>LoppuPvm</th><th></th><th></th></tr>
              <tr>
                <td><select multiple id="location" size=5 onChange="javascript:selectLocation();"></select></td>
                <td><select multiple id="variable" size=5 onChange="javascript:selectVariable();"></select></td>
                <td><input type="text" id="beginDate" size="10" /></td>
                <td><input type="text" id="endDate" size="10" /></td>
                <td><input type="button" value="Päivitä" id="plot" /></td>
                <td><div id="data_link"></div></td>
              </tr>
            </table>
          </div>
          <div class="map_right">
            <div><?php include "content/data-info.html"; ?></div>
            <div id="location_info"></div>
            <div id="data_load_info"></div>
            <div id="variable_info"></div>
          </div>
          <div class="clr"></div>
          <div id="content">          
            <div class="demo-container">
              <div id="placeholder" class="demo-placeholder"></div>
            </div>
          </div>
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
