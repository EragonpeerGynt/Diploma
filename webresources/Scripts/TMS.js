var auto_run_step = 100, auto_run_timer = null;

$(document).ready(function(){
    reset_machine();
    update_displayed_state();
    $('.config__box').mousedown(handle_mousedown);
    $('.new__button').click(function(){
        if (auto_run_timer != null) {
            clearInterval(auto_run_timer);
            auto_run_timer = null;
        }
        var anwser = window.prompt('How many tapes do you need?', number_of_heads);
        $('#codeText').val("");
        updateRows();
        reset_button();
        new_button_disables();
        number_of_heads = anwser;
        reset_machine();
    });
    $('.set__button').click(function(){
        if ($(".tms__configuration").is(":hidden")) {
            return;
        }
        $(".tms__configuration").hide()
        set_memory_registry();
        set_states();
        update_camera_view();
        find_next_step();
        set_button_disables();
    });
    $('.reset__button').click(function() {
        reset_button();
        reset_button_disables();
    });
    $('.step__button').click(function(){
        step_button();
    });
    $('.previous__button').click(function(){
        revert_button();
    });
    $('.run__button').click(function(selector) {
        auto_run(selector, "run");
        run_button_disables();
    });
    $('.pause__button').click(function(selector) {
        auto_run(selector, "pause");
        pause_button_disables();
    });
    $('#state__locker').click(function() {
        if ($('#state__display').prop('disabled')) {
            $('#state__display').prop('disabled', false);
            $('#state__locker').html('ZAKLENI');
        }
        else {
            $('#state__display').prop('disabled', true);
            $('#state__locker').html('SPREMENI');
        }
    });

    $("#state__display").on("input", function(e) {
        var input = $(this).val();
        if(input != current_state) {
            current_state = input;
            ide_timer()
        }
    });

    $('.deterministic__button').click(function(selector) {
        interpreter_mode_button();
    });

    previous_step.register_listener(function(val) {
        console.log("previous step is " + val)
    });
    next_step.register_listener(function(val) {
        console.log("current next step is " + val)
    });

    ide_index_previous.register_listener(function(val) {
        console.log("new index of previous step is " + val)
        $('.step__previous').remove();
        $('#number' + val).append("<div class='step step__previous'>");
    });
    ide_index_next.register_listener(function(val) {
        console.log("new index of next step is " + val)
        $('.step__next').remove();
        $('#number' + val).append("<div class='step step__next'>");
    });
    non_deterministic_errors.register_listener(function(val) {
        if(!non_deterministic_runtime){
            console.log("Non deterministic indexes are " + val)
            $('.step__nondeterministic').remove();
            for(rowNum of val) {
                $('#number' + (parseInt(rowNum)+1)).append("<div class='step step__nondeterministic'>");
            }
        }
        else {
            $('.step__nondeterministic').remove();
        }        
    });
    
    $('.control__button').click(update_displayed_state);
});

var step_button = function() {
    if ($(".tms__configuration").is(":visible")) {
        return;
    }
    if (current_state == final_state) {
        window.alert("You already reached final state");
        return;
    }
    step_machine();
    update_camera_view();
    update_displayed_state();
    ide_index_next.i = find_next_step();
}

var revert_button = function() {
    if ($(".tms__configuration").is(":visible")) {
        return;
    }
    if (step_history.private_history.length == 0) {
        window.alert("You already reached first state");
        return;
    }
    var reverted_move = step_history.previous_step.split(" ");
    console.log(reverted_move);
    reverse_head_mover(reverted_move[2].split(","));
    head_writter(reverted_move[1].split(","));
    current_state = reverted_move[0];
    update_camera_view();
    update_displayed_state();
    ide_index_next.i = find_next_step();
    ide_index_previous.reset_index_value();
    previous_step.reset_step_value();
}

var interpreter_mode_button = function() {
    if (non_deterministic_runtime) {
        $(".deterministic__button").html("Deterministični TS");
        non_deterministic_runtime = false;
    }
    else {
        $(".deterministic__button").html("Ne-deterministični TS");
        non_deterministic_runtime = true;
    }
    non_deterministic_errors.i = find_full_execute_match();
    find_next_step();
}

var auto_run = function(selector, command) {
    if (command == 'run' && auto_run_timer == null) {
        auto_run_timer_init();
    }
    else if (command == 'pause' && auto_run_timer != null) {
        clearInterval(auto_run_timer);
        auto_run_timer = null;
    }
}

var auto_run_timer_init = function() {
    auto_run_timer = setInterval(function() {
        step_button();
        if (current_state == final_state || find_next_step() == null) {
            clearInterval(auto_run_timer);
            auto_run_timer = null;
            pause_button_disables();
            $(".run__button").prop("disabled", true);
        }
    }, auto_run_step);
}

var reset_button = function() {
    if ($(".tms__configuration").is(":hidden")) {
        $(".tms__configuration").show();
    }
    if (auto_run_timer != null) {
        clearInterval(auto_run_timer);
        auto_run_timer = null;
    }
    clean_memory_tapes();
    soft_reset_machine();
    update_camera_view();
    update_displayed_state();
    previous_step.reset_step_value();
    next_step.reset_step_value();
    ide_index_previous.reset_index_value();
    ide_index_next.reset_index_value();
    find_next_step();
}

var reset_machine = function() {
    $(".head__value").remove();
    $(".tape__registry").remove();
    $(".config__input__soft").remove();
    for (let i = 1; i <= number_of_heads; i++) {
        $('.scanner__head').append("<div class='head__" + i + " head__value'></div>");
        $('.registry').append("<div class='tape__registry'><pre class='tape__" + i + " tape__left'></pre>"+"<pre class='tape__" + i + " tape__select'></pre>"+"<pre class='tape__" + i + " tape__right'></pre></div>")
        $('.tms__configuration').append("<input type='text' class='config__input config__input__soft initial__input" + i + "' value='' />");
    }
}

var soft_reset_machine = function() {
    $(".head__value").remove();
    $(".tape__registry").remove();
    for (let i = 1; i <= number_of_heads; i++) {
        $('.scanner__head').append("<div class='head__" + i + " head__value'></div>");
        $('.registry').append("<div class='tape__registry'><pre class='tape__" + i + " tape__left'></pre>"+"<pre class='tape__" + i + " tape__select'></pre>"+"<pre class='tape__" + i + " tape__right'></pre></div>")
    }
}

var update_camera_view = function() {
    for (let i = 1; i <= number_of_heads; i++) {
        $('.head__' + i + '.head__value').html($('.tape__' + i + '.tape__select').html());
    }
}

var set_memory_registry = function() {
    for (let i = 1; i <= number_of_heads; i++) {
        let tape_preset = $('.initial__input' + i).val().split("");
        if (tape_preset.length > 0) {
            $('.tape__' + i + '.tape__select').html(tape_preset[0]);
        }
        else {
            $('.tape__' + i + '.tape__select').html(empty_symbol);
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
    let execute_command = [];
    if (!non_deterministic_runtime) {
        execute_command = custom_regex(current_state, head_vission, program);
        let previous_step_state = (([current_state].concat([head_vission.join(",")])).concat([execute_command[1]])).join(" ");
        console.log(previous_step_state);
        step_history.new_step = previous_step_state;
    }
    else if (non_deterministic_runtime) {
        execute_command = find_shortest_branch()[0];
        if (execute_command == "No steps left" || execute_command == "Out Of Depth") {
            alert(execute_command);
            return;
        }
        previous_step.step = execute_command;
        console.log("new ", execute_command);
        execute_command = execute_command.split(" ").slice(2);
        let previous_step_state = (([current_state].concat([head_vission.join(",")])).concat([execute_command[1]])).join(" ");
        step_history.new_step = previous_step_state;
    }
    if (execute_command == null) {
        window.alert("Najdena ni bila nobena\nustrezna translacija");
        return 
    }
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
            previous_step.step = command;
            ide_index_previous.i = command_index_finder(command)
            return command.split(" ").slice(2);
        }
    }
    return null;
}

var custom_comparator = function(state, current_head, command) {
    if (state == command[0]) {
        let command_blob = command[1].split(",");
        for (let j = 0; j < current_head.length; j++) {
            if (command_blob[j] != current_head[j] && command_blob[j] != "*") {
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
        if (moves[i-1].toLowerCase() == "r") {
            $('.tape__' + i + '.tape__left').html(left + select);
            if (right != "") {
                $('.tape__' + i + '.tape__select').html(right.split("")[0]);
                $('.tape__' + i + '.tape__right').html(right.split("").slice(1).join(""));
            }
            else {
                $('.tape__' + i + '.tape__select').html(empty_symbol);
                $('.tape__' + i + '.tape__right').html("");
            }
        }
        else if (moves[i-1].toLowerCase() == "l") {
            let left_length = left.split("").length
            $('.tape__' + i + '.tape__right').html(select + right);
            if (left != "") {
                $('.tape__' + i + '.tape__select').html(left.split("")[left_length-1]);
                $('.tape__' + i + '.tape__left').html(left.split("").slice(0, left_length-1).join(""));
            }
            else {
                $('.tape__' + i + '.tape__select').html(empty_symbol);
                $('.tape__' + i + '.tape__left').html(left.split("").slice(0, left_length-1).join(""));
            }
        }
    }
}

var reverse_head_mover = function(moves) {
    for (let i = 1; i <= number_of_heads; i++) {
        let left = $('.tape__' + i + '.tape__left').html();
        let right = $('.tape__' + i + '.tape__right').html();
        let select = $('.tape__' + i + '.tape__select').html();
        if (moves[i-1].toLowerCase() == "l") {
            $('.tape__' + i + '.tape__left').html(left + select);
            if (right != "") {
                $('.tape__' + i + '.tape__select').html(right.split("")[0]);
                $('.tape__' + i + '.tape__right').html(right.split("").slice(1).join(""));
            }
            else {
                $('.tape__' + i + '.tape__select').html(empty_symbol);
                $('.tape__' + i + '.tape__right').html("");
            }
        }
        else if (moves[i-1].toLowerCase() == "r") {
            let left_length = left.split("").length
            $('.tape__' + i + '.tape__right').html(select + right);
            if (left != "") {
                $('.tape__' + i + '.tape__select').html(left.split("")[left_length-1]);
                $('.tape__' + i + '.tape__left').html(left.split("").slice(0, left_length-1).join(""));
            }
            else {
                $('.tape__' + i + '.tape__select').html(empty_symbol);
                $('.tape__' + i + '.tape__left').html(left.split("").slice(0, left_length-1).join(""));
            }
        }
    }
}

var update_displayed_state = function() {
    $('#state__display').val(current_state);
}

var find_full_execute_match = function() {
    let non_deterministic_list = [];
    let program = $("#codeText").val().split("\n", -1);
    for (let search_index = 0; search_index < program.length; search_index ++) {
        let execute_command = program[search_index].split(" ").slice(0,2);
        let tmp_storadge = execute_command_finder(execute_command, search_index);
        if (tmp_storadge != null) {
            non_deterministic_list.push(tmp_storadge);
        }
    }
    return non_deterministic_list.sort();
}

var execute_command_finder = function(execute_command, parent_command) {
    if (execute_command == null) {
        return null;
    }
    let program = $("#codeText").val().split("\n", -1);
    for(let command_index = parent_command+1; command_index < program.length; command_index++) {
        let tested_command = program[command_index].split(" ").slice(0,2);
        if(execute_command[0] == tested_command[0] && execute_command[1] == tested_command[1]) {
            return command_index;
        }
    }
    return null;
}

var command_index_finder = function(command) {
    if (command == null) {
        return null;
    }
    let program = $("#codeText").val().split("\n", -1);
    for(let command_index = 0; command_index < program.length; command_index++) {
        let split_command = command.split(" ");
        let split_program = program[parseInt(command_index)].split(" ");
        if(split_program[0] == split_command[0] && split_program[2] == split_command[2] && split_program[3] == split_command[3] && split_program[4] == split_command[4]) {
            let window_c = split_command[1].split(",");
            let window_p = split_program[1].split(",");
            let same = true;
            for (let window_i = 0; window_i < window_p.length; window_i ++) {
                if(window_c[window_i] != window_p[window_i] && window_p[window_i] != "*") {
                    same = false;
                    break;
                }
            }
            if (same) {
                return parseInt(command_index)+1;
            }
        }
    }
    return null;
}

var find_next_step = function() {
    let program = $("#codeText").val().split("\n")
    let head_vission = [];
    ide_index_previous.i = command_index_finder(previous_step.step);
    for (let i = 1; i <= number_of_heads; i++) {
        head_vission.push($('.tape__' + i + '.tape__select').html());
    }
    if (!non_deterministic_runtime) {
        for (let command of program) {
            if (custom_comparator(current_state, head_vission, command.split(" ").slice(0,2))) {
                next_step.step = command;
                ide_index_next.i = command_index_finder(command);
                return ide_index_next.i
            }
        }
        next_step.step = null;
        return null;
    }
    else if(non_deterministic_runtime) {
        let tmp_command = find_shortest_branch()[0];
        if (tmp_command == "No steps left" || tmp_command == "Out Of Depth") {
            next_step.step = null;
            return null;
        }
        next_step.step = tmp_command;
        ide_index_next.i = command_index_finder(tmp_command);
        return ide_index_next.i
    }
}

var reset_button_disables = function() {
    $(".step__button").prop("disabled", true);
    $(".previous__button").prop("disabled", true);
    $(".run__button").prop("disabled", true);
    $(".pause__button").prop("disabled", true);
    $(".reset__button").prop("disabled", true);
    $(".set__button").prop("disabled", false);
    $(".new__button").prop("disabled", false);
}

var run_button_disables = function() {
    $(".step__button").prop("disabled", true);
    $(".previous__button").prop("disabled", true);
    $(".run__button").prop("disabled", true);
    $(".pause__button").prop("disabled", false);
    $(".reset__button").prop("disabled", false);
    $(".set__button").prop("disabled", true);
    $(".new__button").prop("disabled", false);
}

var pause_button_disables = function() {
    $(".step__button").prop("disabled", false);
    $(".previous__button").prop("disabled", false);
    $(".run__button").prop("disabled", false);
    $(".pause__button").prop("disabled", true);
    $(".reset__button").prop("disabled", false);
    $(".set__button").prop("disabled", true);
    $(".new__button").prop("disabled", false);
}

var set_button_disables = function() {
    $(".step__button").prop("disabled", false);
    $(".previous__button").prop("disabled", false);
    $(".run__button").prop("disabled", false);
    $(".pause__button").prop("disabled", true);
    $(".reset__button").prop("disabled", false);
    $(".set__button").prop("disabled", true);
    $(".new__button").prop("disabled", false);
}

var new_button_disables = function() {
    $(".step__button").prop("disabled", true);
    $(".previous__button").prop("disabled", true);
    $(".run__button").prop("disabled", true);
    $(".pause__button").prop("disabled", true);
    $(".reset__button").prop("disabled", true);
    $(".set__button").prop("disabled", false);
    $(".new__button").prop("disabled", false);
}


/*
a _ 1 r b
a 1 1 l b
b _ 1 l a
b 1 _ l c
c _ 1 r halt
c 1 1 l d
d _ 1 r d
d 1 _ r a
*/