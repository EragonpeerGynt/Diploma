$(document).ready(function(){
    reset_machine();
    $('.config__box').mousedown(handle_mousedown);
    $('.new__button').click(function(){
        var answer = window.confirm('Do you really want to clear IDE window?');
        if (answer) {
            $('#codeText').val("");
            updateRows();
        }
    });
    $('.set__button').click(function(){
        if ($(".tms__configuration").is(":hidden")) {
            return;
        }
        $(".tms__configuration").hide()
        set_memory_registry();
        set_states();
    });
    $('.reset__button').click(function(){
        $(".tms__configuration").show()
        clean_memory_tapes();
    });
    $('.step__button').click(function(){
        if ($(".tms__configuration").is(":visible")) {
            return;
        }
        step_machine();
    });
});

var reset_machine = function() {
    $(".head_value").each(function(){
        $(this).remove();
    });
    $(".tape__registry").each(function(){
        $(this).remove();
    });
    $(".config__input__soft").each(function(){
        $(this).remove();
    });
    for (let i = 1; i <= number_of_heads; i++) {
        $('.scanner__head').append("<div class='head__" + i + " head_value'></div>");
        $('.registry').append("<div class='tape__registry'><pre class='tape__" + i + " tape__left'></pre>"+"<pre class='tape__" + i + " tape__select'></pre>"+"<pre class='tape__" + i + " tape__right'></pre></div>")
        $('.tms__configuration').append("<input type='text' class='config__input config__input__soft initial__input" + i + "' value='' />");
    }
}

var set_memory_registry = function() {
    for (let i = 1; i <= number_of_heads; i++) {
        let tape_preset = $('.initial__input' + i).val().split("");
        if (tape_preset.length > 0) {
            $('.tape__' + i + '.tape__select').html(tape_preset[0]);
        }
        else {
            $('.tape__' + i + '.tape__select').html("_");
        }
        if (tape_preset.length > 1) {
            $('.tape__' + i + '.tape__right').html(tape_preset.slice(1).join(""));
        }
    }
}

var set_states = function() {
    current_state = $('.state__select').val();
    final_state = $('.state__final').val();
}

var clean_memory_tapes = function() {
    for (let i = 1; i <= number_of_heads; i++) {
        $('.tape__' + i + '.tape__select').html("");
        $('.tape__' + i + '.tape__right').html("");
        $('.tape__' + i + '.tape__left').html("");
    }
}

var step_machine = function() {
    let program = $("#codeText").val().split("\n")
    let head_vission = [];
    for (let i = 1; i <= number_of_heads; i++) {
        head_vission.push($('.tape__' + i + '.tape__select').html());
    }
    let execute_command = custom_regex(current_state, head_vission, program);
    let command_setters = execute_command[0].split(",");
    let command_movers = execute_command[1].split(',');
    let command_new_state = execute_command[2];
    head_writter(command_setters);
    head_mover(command_movers);
    current_state = command_new_state;
}

var custom_regex = function(state, current_head, program) {
    for (let command of program) {
        if (custom_comparator(state, current_head, command.split(" ").slice(0,2))) {
            console.log(command);
            return command.split(" ").slice(2);
        }
    }
    return null;
}

var custom_comparator = function(state, current_head, command) {
    if (state == command[0]) {
        let command_blob = command[1].split(",");
        for (let j = 0; j < current_head.length; j++) {
            if (command_blob[j] != current_head[j]) {
                return false;
            }
        }
        return true;
    }
    return false;
}

var head_writter = function(new_values) {
    for (let i = 1; i <= number_of_heads; i++) {
        if (new_values[i-1] != "*") {
            $('.tape__' + i + '.tape__select').html(new_values[i-1])
        }
    }
}

var head_mover = function(moves) {
    for (let i = 1; i <= number_of_heads; i++) {
        let left = $('.tape__' + i + '.tape__left').html();
        let right = $('.tape__' + i + '.tape__right').html();
        let select = $('.tape__' + i + '.tape__select').html();
        if (moves[i-1] == "r") {
            $('.tape__' + i + '.tape__left').html(left + select);
            if (right != "") {
                $('.tape__' + i + '.tape__select').html(right.split("")[0]);
                $('.tape__' + i + '.tape__right').html(right.split("").slice(1).join(""));
            }
            else {
                $('.tape__' + i + '.tape__select').html("_");
                $('.tape__' + i + '.tape__right').html("");
            }
        }
        else if (moves[i-1] == "l") {
            let left_length = left.split("").length
            $('.tape__' + i + '.tape__right').html(select + right);
            if (left != "") {
                $('.tape__' + i + '.tape__select').html(left.split("")[left_length-1]);
                $('.tape__' + i + '.tape__left').html(left.split("").slice(0, left_length-1).join(""));
            }
            else {
                $('.tape__' + i + '.tape__select').html("_");
                $('.tape__' + i + '.tape__left').html(left.split("").slice(0, left_length-1).join(""));
            }
        }
    }
}