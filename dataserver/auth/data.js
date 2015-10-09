function setSuure(suure) {
    var a = document.getElementById("Paikka").value;
    var b = document.getElementById("Suure");
    fillSelect(b, ab[a]);
    if (suure !== "") {
        b.value = suure;
    }
}

function uusiPaikka() {
    var a = document.getElementById("Paikka").value;
    var b = document.getElementById("Suure");
    fillSelect(b, ab[a]);
    pyyhiKuva();
}

function pyyhiKuva() {
    document.getElementById("info").innerHTML = "";
    document.getElementById("info2").innerHTML = "";
}

function fillSelect(select, options) {
    removeOptions(select);
    for (var i = 0; i < options.length; i++) {
        select.add(new Option(options[i][0], options[i][1]));
    }
}

function removeOptions(selectbox) {
    for (var i = selectbox.options.length-1; i >= 0; i--) {
        selectbox.remove(i);
    }
}
