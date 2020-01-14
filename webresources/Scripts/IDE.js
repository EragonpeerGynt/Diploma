
var lines = 0;
var timeout = 5000, timer = null;
$(document).ready(function(){

    var textArea = $("#codeText"),
        textAreaY = textArea.scrollTop();

    addRows($("#codeText").val().split("\n").length);
    lines = $("#codeText").val().split("\n").length;
    $("#codeText").on("input", function(e) {
        var input = $(this);
        var nrRows = input.val().split("\n").length;

        if (lines != nrRows) {
            if (lines < nrRows) {
                addRows(nrRows);
            }
            else {
                removeRows(nrRows);
            }
            lines = nrRows;
        }

        clearTimeout(timer);
        timer = setTimeout(function() {
            ide_index_next.i = find_next_step();
        }, timeout);

    });
    $("#codeText").scroll(function() {
        $(".numbering").css({"margin-top": (3-Number(textArea.scrollTop())).toString()+"px"});
        visibilityCleaner();
    });
});
var addRows = function(newRows) {
    for (i = lines+1; i <= newRows; i++) {
        $(".numbering").append("<div id='number" + i + "'><div class='row'>"+ i +"</div></div>");
    }
}

var visibilityCleaner = function() {
    $(".row").each(function() {
        var topArea = $("#codeText").offset().top, bottomArea = $("#codeText").offset().top+$("#codeText").height();
        if($(this).offset().top < topArea || $(this).offset().top > bottomArea) {
            $(this).css({'visibility':'hidden', 'opacity': '0'});
            $(this).parent().css({'visibility':'hidden', 'opacity': '0'});
        }
        else {
            $(this).css({'visibility':'visible', 'opacity': '1'});
            $(this).parent().css({'visibility':'visible', 'opacity': '1'});
        }
    });
}
var removeRows = function(newRows) {
    $(".row").each(function() {
        if ($(this).html() > newRows) {
            $(this).parent().remove();
        }
    });
}

var updateRows = function() {
    lines = $("#codeText").val().split("\n").length;
    removeRows(lines);
}