/*! eurajoki.info
* https://github.com/ajolma/eurajoki.info
* Copyright 2015 Pyhäjärvi-instituutti; Licensed GPL2 */

/* these two functions are from stackoverflow */

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

function params() {
    var query_string = {};
    var query = decodeURIComponent(window.location.search.substring(1));
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        pair[0] = pair[0].replace("[]", ""); // php...
        // If first entry with this name
        if (typeof query_string[pair[0]] === "undefined") {
            query_string[pair[0]] = pair[1];
            // If second entry with this name
        } else if (typeof query_string[pair[0]] === "string") {
            var arr = [ query_string[pair[0]], pair[1] ];
            query_string[pair[0]] = arr;
            // If third or later entry with this name
        } else {
            query_string[pair[0]].push(pair[1]);
        }
    } 
    return query_string;
}

function json(obj) {
    var a = '{';
    var s = '';
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var h = '';
            if (typeof obj[key] === 'string')
                h = "'";
            a += s + key + ":" + h + obj[key] + h;
            if (s === '') s = ', ';
        }
    }
    return a+'}';
}

function element(tag, attrs, text) {
    var a = '';
    for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            a += ' ' + key + '="' + attrs[key] + '"';
        }
    }
    return '<'+tag+a+'>'+text+'</'+tag+'>';
}

function parseArray(arrStr) {
    //var x = arrStr.substring(1, arrStr.length - 1);
    //x = x.replace(/^\d+:/, "");
    //var l = x.split(",");
    var l = arrStr.split(",");
    return l;
}
