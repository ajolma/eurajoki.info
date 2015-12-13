function element(tag, attrs, text) {
    var a = '';
    for (var key in attrs) {
        if (attrs.hasOwnProperty(key)) {
            a += ' ' + key + '="' + attrs[key] + '"';
        }
    }
    if (text === null)
        return '<'+tag+a+'/>';
    else
        return '<'+tag+a+'>'+text+'</'+tag+'>';
}

function move_up(layers, i) {
    var a = [];
    for (var j = 0; j < layers.length; j++) {
        if (j == i-1) {
            a[j] = layers[i];
        } else if (j == i) {
            a[j] = layers[i-1];
        } else {
            a[j] = layers[j];
        }
    }
    return a;
}

function move_down(layers, i) {
    var a = [];
    for (var j = 0; j < layers.length; j++) {
        if (j == i) {
            a[j] = layers[i+1];
        } else if (j == i+1) {
            a[j] = layers[i];
        } else {
            a[j] = layers[j];
        }
    }
    return a;
}

function containsObject(obj, list) {
    var i;
    for (i = 0; i < list.length; i++) {
        if (list[i] === obj) {
            return true;
        }
    }
    return false;
}

function cmp_date(a,b) {
    for (var i=0; i<3; i++) {
        if (a[i] < b[i]) return -1;
        if (a[i] > b[i]) return 1;
    }
    return 0;
}
