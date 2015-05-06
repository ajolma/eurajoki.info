<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- This file is part of eurajoki.info
     https://github.com/ajolma/eurajoki.info
     Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 -->
<?php $page='tarinat'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Tarinat</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <meta http-equiv="EXPIRES" CONTENT="Wed, 13 Nov 2013 20:00:00 GMT" />

    <?php include "design/include.html"; ?>
    <link rel="stylesheet" type="text/css" href="/jquery/colorbox.css" />
    <link rel="stylesheet" type="text/css" href="css/stories.css" />

    <script language="javascript" type="text/javascript" src="/jquery/jquery.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery-ui.js"></script>
    <script language="javascript" type="text/javascript" src="/jquery/jquery.colorbox.js"></script>

    <script src="/OpenLayers/OpenLayers.js"></script>
    <script src="https://maps.google.com/maps/api/js?v=3.2&sensor=false"></script>

    <?php include "lib/url2js.php"; ?>
    <script language="javascript" type="text/javascript" src="/app/config.js"></script>
    <script language="javascript" type="text/javascript" src="/app/identity.js"></script>
    <script language="javascript" type="text/javascript" src="/app/story-editor.js"></script>
    <script language="javascript" type="text/javascript" src="/app/base-layers.js"></script>
    <script language="javascript" type="text/javascript" src="/app/controls.js"></script>
    <script language="javascript" type="text/javascript" src="/app/overlays.js"></script>
    <script language="javascript" type="text/javascript" src="/app/story-layer.js"></script>
    <script language="javascript" type="text/javascript" src="/app/map.js"></script>
    <script language="javascript" type="text/javascript" src="/app/init-stories.js"></script>
    
  </head>
  <body onload="init()">
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
