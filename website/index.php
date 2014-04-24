<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<?php $page='etusivu'; ?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <title>Eurajoki.info</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="EXPIRES" CONTENT="Wed, 13 Nov 2013 20:00:00 GMT" />
    <link rel="shortcut icon" href="/favicon.ico" /> 
    <?php include "design/include.html"; ?>
  </head>
  <body>
    <?php include "content/fb-boot.html"; ?>
    <div class="main">
      <div class="header">
        <div class="header_resize">
          <div class="logo"><h1><a href="index.php"><small>&nbsp;</small><br />Eurajoki.info</a></h1></div>
          <div class="logo_text"><?php include "content/top-links.html"; ?></div>
          <div class="clr"></div>
        </div>
        <div class="headert_text_resize">
          <div class="menu"><?php include "content/topmenu.html"; ?></div>
          <div class="clr"></div>
          <h2 class="bigtext"><span>Puhtaan veden puolesta</span><br />Tiedolla, seurannalla<br />ja yhteistyöllä.</h2>
          <div class="headert_text"><p></p></div>
          <div class="clr"></div>
        </div>
      </div>
      <div class="body">
        <div class="body_resize">
          <div class="right">
            <h2><?php include "content/projekti101-title.html"; ?></h2>
            <img src="design/rantasipi.jpg" class="floated" />
            <?php include "content/projekti101.html"; ?>
            <div class="bg"></div>        
          </div>
          <div class="left">
            <h2>Verkossa</h2>
            <?php include "content/sivumenu.html"; ?>
          </div>
          <div class="clr"></div>
        </div>
      </div>
      <div class="FBG">
        <div class="FBG_resize">
          <div class="blok">
            <h2>Eurajoki-foorumin Facebook-syöte</h2>
            <?php include "content/eurajoki-fb.html"; ?>
          </div>
          <div class="blok">
            <h2>Kommentoi/keskustele</h2>
            <div class="fb-comments"
                 data-href="http://eurajoki.info/index.php"
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
