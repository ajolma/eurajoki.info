<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<?php $page='tietoa'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info | Tietoa</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="EXPIRES" CONTENT="Wed, 13 Nov 2013 20:00:00 GMT" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <?php include "design/include.html"; ?>
    <style type="text/css">
      .left { float:left; width:800px; margin:0; padding:10px;}
      .left ul {
      list-style: disc outside none;
      }
    </style>
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
      </div>
      <div class="body">
        <div class="body_resize">
          <div class="clr"></div>
          <?php include "content/about.html"; ?>
        </div>
      </div>
      <div class="FBG">
        <div class="FBG_resize">
          <div class="blok">
            <?php include "content/gallery.html"; ?>
          </div>      
          <div class="clr"></div>
        </div>
      </div>
      <?php include "content/footer.html"; ?>
    </div>
  </body>
</html>