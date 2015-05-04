<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<!-- This file is part of eurajoki.info
     https://github.com/ajolma/eurajoki.info
     Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 -->
<?php $page='vesienhoito'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Vesienhoito</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="EXPIRES" CONTENT="Wed, 13 Nov 2013 20:00:00 GMT" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <?php include "design/include.html"; ?>
    <link rel="stylesheet" type="text/css" href="css/tietoa.css" />
  </head>
  <body>
    <?php include "content/fb-boot.html"; ?>
    <div class="main">
      <?php include "content/header.html"; ?>
      <div class="headert_text_resize">
        <div class="menu"><?php include "content/topmenu.html"; ?></div>
      </div>
      <div class="body">
        <div class="body_resize">
          <div class="clr"></div>
          <?php include "content/vesienhoito.html"; ?>
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
                 data-href="http://eurajoki.info/vesienhoito.php"
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
