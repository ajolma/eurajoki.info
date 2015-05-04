<?php
echo "<script>";
if (isset($_GET["raaka"])) {
    echo "var raaka=1;";
} else {
    echo "var raaka=0;";
}
if (isset($_GET["from"])) {
    echo "var date0='".$_GET["from"]."';";
} else {
    echo "var date0=0;";
}
if (isset($_GET["to"])) {
    echo "var date1='".$_GET["to"]."';";
} else { 
    echo "var date1=0;";
}
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
if (isset($_GET["editor"])) {
    echo "var editor=1;";
} else {  
    echo "var editor=0;";
}
echo "</script>"; 
?>
