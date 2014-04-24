<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<?php $page='tarinat'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Tarinat</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <meta http-equiv="EXPIRES" CONTENT="Wed, 13 Nov 2013 20:00:00 GMT" />
    <?php include "design/include.html"; ?>
    <script src="/OpenLayers-2.13.1/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>
    <?php echo "<script>";
          if (isset($_GET["editor"])) {echo "var editor=1;";}else{echo "var editor=0;";}
          echo "</script>"; ?>
    <script type="text/javascript" src="app/identity.js"></script>
    <script type="text/javascript" src="app/story-editor.js"></script>
    <script type="text/javascript" src="app/base-layers.js"></script>
    <script type="text/javascript" src="/app/map.js"></script>
    <script type="text/javascript" src="app/init-stories.js"></script>
    <style type="text/css">
      .body{
      color:black;
      font-size:12px;
      font-family:tahoma,arial,verdana,sans-serif
      }
      #map {
      width: 725px;
      height: 625px;
      margin: 0;
      }
      .map_left { float:left; width:725px; margin:0; padding:0px;}
      .map_right { float:right; width:165px; margin:0; padding:10px;}
    </style>
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
          </div>
          <div class="map_right">
            <div><?php include "content/stories-info.html"; ?></div>
            <br />
            <?php if (isset($_GET["editor"])) {
                      include "content/editor-info.html";
                      echo "<div id=\"identity\"></div><div id=\"mode-selector\"></div>";
                  }else{
                      echo "<a href=\"stories.php?editor=1\">Tarinaeditori</a>";
                  } ?>
          </div>      
          <div class="clr"></div>
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
                 data-href="http://eurajoki.info/maps.php"
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
