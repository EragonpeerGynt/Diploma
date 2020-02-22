var find_shortest_branch = function() {
    let initial_tms = create_virtual_tms();
    initial_tms.current_state = current_state;
    for (let tape = 1; tape <= number_of_heads; tape++) {
        initial_tms.left_tape.push($('.tape__' + tape + '.tape__left').html());
        initial_tms.head_tape.push($('.tape__' + tape + '.tape__select').html());
        initial_tms.right_tape.push($('.tape__' + tape + '.tape__right').html());
    }
    initial_tms.program = $("#codeText").val().split("\n");
    initial_tms.head_number = number_of_heads;
    var complete_stack = non_deterministic_iterator([initial_tms]);
    return complete_stack
}

var non_deterministic_iterator = function(virtual_cores) {
    let new_vtms = [];
    for(let depth = 0; depth < max_depth_search; depth ++) {
        for(let vtm of virtual_cores) {
            if (vtm.current_state == final_state) {
                return vtm.execution_stack;
            }
        }
        if (virtual_cores.length == 0) {
            return ["No steps left"]
        }
        for(let vtm of virtual_cores) {
            let tmp_new_vtms = multiply(vtm);
            Array.prototype.push.apply(new_vtms, Object.assign([], tmp_new_vtms));
        }
        virtual_cores = Object.assign([], new_vtms);
        new_vtms = [];
        console.log("---");
    }
    return ["Out Of Depth"];
}

// var virtual_tms = {
//     state: 
// }

var create_virtual_tms = function() {
    var virtual_tms = {
        current_state: '',
        final_state: '',
        left_tape: [],
        head_tape: [],
        right_tape: [],
        program: [],
        head_number: 0,
        execution_stack: [],        
    }
    return virtual_tms;
}

var process_step = function(step_command, curr_tms) {
    let split_command = step_command.split(" ");
    curr_tms.current_state = split_command[2];
    let head_set = split_command[0].split(",");
    for (let tape = 0; tape < curr_tms.head_number; tape++) {
        if (head_set[tape] != "*") {
            curr_tms.head_tape[tape] = head_set[tape];
        }
    }
    let move_set = split_command[1].split(",");
    for (let tape = 0; tape < curr_tms.head_number; tape++) {
        if (move_set == "*") {
            continue;
        }
        else if (move_set[tape].toLowerCase() == "l") {
            curr_tms.right_tape[tape] = curr_tms.head_tape[tape] + curr_tms.right_tape[tape];
            if (curr_tms.left_tape[tape] != "") {
                let tmp_left = curr_tms.left_tape[tape].split("");
                curr_tms.head_tape[tape] = tmp_left[tmp_left.length-1];
                curr_tms.left_tape[tape] = tmp_left.slice(0, tmp_left.length-1).join("");
            }
            else {
                curr_tms.head_tape[tape] = empty_symbol;
                curr_tms.left_tape[tape] = "";
            }
        }
        else if (move_set[tape].toLowerCase() == "r") {
            curr_tms.left_tape[tape] = curr_tms.left_tape[tape] + curr_tms.head_tape[tape];
            if (curr_tms.right_tape[tape] != "") {
                let tmp_right = curr_tms.right_tape[tape].split("");
                curr_tms.head_tape[tape] = tmp_right[0];
                curr_tms.right_tape[tape] = tmp_right.slice(1,).join("");
            }
            else {
                curr_tms.head_tape[tape] = empty_symbol;
                curr_tms.right_tape[tape] = "";
            }
        }
    }
    curr_tms.execution_stack.push(step_command);
    return curr_tms;
}

var multiply = function(curr_tms) {
    let new_virtual_tms = [];
    let workload = find_steps(curr_tms);
    for (let command of workload) {
        let tmp_tms = JSON.parse(JSON.stringify(curr_tms));
        tmp_tms = process_step(command, tmp_tms);
        new_virtual_tms.push(tmp_tms);
    }
    return new_virtual_tms;
}

var find_steps = function(curr_tms) {
    let workload_commands = []; 
    for (let program_row of curr_tms.program) {
        let compare_row = compare_step_and_state(program_row, curr_tms);
        if (compare_row) {
            workload_commands.push(compare_row);
        }
    }
    return workload_commands;
}

var compare_step_and_state = function(step, curr_tms) {
    let split_step = step.split(" ");

    if (split_step[0] != curr_tms.current_state) {
        return false
    }
    let split_head = split_step[1].split(",");
    for(let i = 0; i < split_head.length; i++) {
        if(split_head[i] != curr_tms.head_tape[i] && split_head[i] != "*") {
            return false;
        }
    }
    return split_step.slice(2).join(" ");
}

/*
S0 0,* 0,0 R,R S0
S0 1,* 1,1 R,R S0
S0 1,* *,_ *,L S1
S0 0,* *,_ *,L S1
S0 1,* *,* *,L S0
S0 0,* *,* *,L S0
S1 0,0 0,_ R,L S1
S1 1,1 1,_ R,L S1
S1 _,_ *,* *,* SF
*/