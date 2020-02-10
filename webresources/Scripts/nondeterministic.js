var find_shortest_branch = function() {
    let initial_tms = create_virtual_tms();
    initial_tms.current_state = current_state;
    for (let tape = 1; tape <= number_of_heads; tape++) {
        initial_tms.left_tape.push($('.tape__' + tape + '.tape__left').html());
        initial_tms.head_tape.push($('.tape__' + tape + '.tape__select').html());
        initial_tms.right_tape.push($('.tape__' + tape + '.tape__right').html());
    }
    initial_tms.program = $("#codeText").val().split("\n");
    var complete_stack = non_deterministic_iterator(program, [initial_tms]);    
    return complete_stack[0]
}

var non_deterministic_iterator = function(virtual_cores) {
    for(let depth = 0; depth < max_depth_search; depth ++) {

    }
    return ["Out Of Depth"];
}

// var virtual_tms = {
//     state: 
// }

var create_virtual_tms = function() {
    var virtual_tms = {
        current_state: '',
        left_tape: [],
        head_tape: [],
        right_tape: [],
        program: [],
        execution_stack: [],
        process_step: function(step_command) {
            console.log(this);
        },
        clone: function() {
            return Object.assign({}, this);
        },
        multiply: function(workload) {
            var new_virtual_tms = [];
            for (let command of workload) {
                let tmp_tms = this.clone()
                tmp_tms.execute(command)
                new_virtual_tms.push(tmp_tms);
            }
            return new_virtual_tms;
        },
        find_steps: function() {

        },
        compare_step_and_state: function(step) {
            let split_step = step.split(" ");
            if (split_step[0] != this.current_state) {
                return false
            }
            let split_head = split_step[1].split(",");
            for(let i = 0; i < split_head.length; i++) {
                if(split_head[i] != this.head_tape[i]) {
                    return false;
                }
            }
            return split_step.slice(2);
        }
    }
    return virtual_tms;
}