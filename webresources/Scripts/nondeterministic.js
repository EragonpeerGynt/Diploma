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
        for(let vtm of virtual_cores) {
            let tmp_new_vtms = vtm.multiply();
            Array.prototype.push.apply(new_vtms, tmp_new_vtms);
        }
        virtual_cores = Object.assign([], new_vtms);
        new_vtms = [];
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
        process_step: function(step_command) {
            let split_command = step_command.split(" ");
            this.current_state = split_command[2];
            let head_set = split_command[0].split(",");
            for (let tape = 0; tape < this.head_number; tape++) {
                if (head_set != "*") {
                    this.head_tape[tape] = head_set[tape];
                }
            }
            let move_set = split_command[1].split(",");
            for (let tape = 0; tape < this.head_number; tape++) {
                if (move_set == "*") {
                    continue;
                }
                else if (move_set[tape].toLowerCase() == "l") {
                    this.right_tape[tape] = this.head_tape[tape] + this.right_tape[tape];
                    if (this.left_tape[tape] != "") {
                        let tmp_left = this.left_tape[tape].split("");
                        this.head_tape[tape] = tmp_left[tmp_left.length-1];
                        this.left_tape[tape] = tmp_left.slice(0, tmp_left.length-1).join("");
                    }
                    else {
                        this.head_tape[tape] = empty_symbol;
                        this.left_tape[tape] = "";
                    }
                }
                else if (move_set[tape].toLowerCase() == "r") {
                    this.left_tape[tape] = this.left_tape[tape] + this.head_tape[tape];
                    if (this.right_tape[tape] != "") {
                        let tmp_right = this.right_tape[tape].split("");
                        this.head_tape[tape] = tmp_right[0];
                        this.right_tape[tape] = tmp_right.slice(1,).join("");
                    }
                    else {
                        this.head_tape[tape] = empty_symbol;
                        this.right_tape[tape] = "";
                    }
                }
            }
            this.execution_stack.push(step_command);
        },
        clone: function() {
            return Object.assign({}, this);
        },
        multiply: function() {
            let new_virtual_tms = [];
            let workload = this.find_steps();
            for (let command of workload) {
                let tmp_tms = this.clone()
                tmp_tms.process_step(command)
                new_virtual_tms.push(tmp_tms);
            }
            return new_virtual_tms;
        },
        find_steps: function() {
            let workload_commands = []; 
            for (let program_row of this.program) {
                let compare_row = this.compare_step_and_state(program_row);
                if (compare_row) {
                    workload_commands.push(compare_row);
                }
            }
            return workload_commands;
        },
        compare_step_and_state: function(step) {
            let split_step = step.split(" ");
            if (split_step[0] != this.current_state) {
                return false
            }
            let split_head = split_step[1].split(",");
            for(let i = 0; i < split_head.length; i++) {
                if(split_head[i] != this.head_tape[i] && split_head != "*") {
                    return false;
                }
            }
            return split_step.slice(2).join(" ");
        }
    }
    return virtual_tms;
}