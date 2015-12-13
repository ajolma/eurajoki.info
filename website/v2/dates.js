function setupDates() {
    $.datepicker.setDefaults({
        closeText: "Valmis", // Display text for close link
        prevText: "Edel", // Display text for previous month link
        nextText: "Seur", // Display text for next month link
        currentText: "Tänään", // Display text for current month link
        monthNames: ["Tammikuu","Helmikuu","Maaliskuu","Huhtikuu","Toukokuu","Kesäkuu",
                     "Heinäkuu","Elokuu","Syyskuu","Lokakuu","Marraskuu","Joulukuu"], // Names of months for drop-down and formatting
        monthNamesShort: ["Tam", "Hel", "Maa", "Huh", "Tou", "Kes", "Hei", "Elo", "Syy", "Lok", "Mar", "Jou"], // For formatting
        dayNames: ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"], // For formatting
        dayNamesShort: ["Sun", "Maa", "Tii", "Kes", "Tor", "Per", "Lau"], // For formatting
        dayNamesMin: ["Su","Ma","Ti","Ke","To","Pe","La"], // Column headings for days starting at Sunday
        weekHeader: "Vko", // Column header for week of the year
        dateFormat: "dd.mm.yy", // See format options on parseDate
        firstDay: 0, // The first day of the week, Sun = 0, Mon = 1, ...
        isRTL: false, // True if right-to-left language, false if left-to-right
        showMonthAfterYear: false, // True if the year select precedes month, false for month then year
        yearSuffix: "" // Additional text to append to the year in the month headers
    });

    var date = new Date();
    var day = date.getDate();
    var mon = date.getMonth()+1;
    var year = date.getFullYear();

    $("#endDate").datepicker();
    $("#endDate").datepicker("option", "dateFormat", "yy-mm-dd");
    $("#endDate").val(year+'-'+mon+'-'+day);
    
    $("#beginDate").datepicker();
    $("#beginDate").datepicker("option", "dateFormat", "yy-mm-dd");
    mon--;if (mon < 1) {mon = 12;year--;}
    $("#beginDate").val(year+'-'+mon+'-'+day);
}

function set_begin_date() {
    var d = null;
    $("#location :selected").each(function() {
        var paikka = $(this).val();
        $("#variable :selected").each(function() {
            var koodi = $(this).val();
            if (datasets[paikka].muuttujat2[koodi]) {
                var t = datasets[paikka].muuttujat2[koodi].alkupvm.split("-");
                for (var i=0; i<3; i++)
                    t[i] = parseInt(t[i]);
                if (d == null || cmp_date(t,d) < 0) d = t;
            }
        });
    });
    if (d != null) {
        if (d[0] < 2013) d = [2013,1,1];
        $('#beginDate').val(d[0]+"-"+d[1]+"-"+d[2]);
    }
}
