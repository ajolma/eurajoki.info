/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

var email;
var password;
var set_identity_callback;

function identity_form() {
    var form = "<fieldset>"+
        "<legend>Tunnistautuminen</legend>"+
        "Huom: tunnisteita ei tarkisteta mutta ne toimivat avaimena antamiisi tietoihin.<br />"+
        "<label for='email' >Sähköpostiosoite:</label>"+
        "<input type='text' name='email' id='identity_email' maxlength='50' /><br />"+
        "<label for='password' >Salasana:</label>"+
        "<input type='password' name='password' id='identity_password' maxlength='50' /><br />"+
        "<input type='submit' value='Tunnistaudu' onclick='set_identity()' />"+
        "</fieldset>";
    document.getElementById('identity').innerHTML = form;
}

function set_identity() {
    email = document.getElementById('identity_email').value;
    password = document.getElementById('identity_password').value;
    if (set_identity_callback != undefined) {
        set_identity_callback();
    }
    if (email == '' || password == '') {
        identity_form()
    } else {
        var form = "<fieldset>"+
            "Olet tunnistautunut osoitteella "+email+"<br />"+
            "<input type='submit' value='Poista tunnistautuminen' onclick='forget_identity()' />"+
            "</fieldset>";
        document.getElementById('identity').innerHTML = form;
    }
}

function forget_identity() {
    email = undefined;
    password = undefined;
    if (set_identity_callback != undefined) {
        set_identity_callback();
    }
    identity_form();
}
