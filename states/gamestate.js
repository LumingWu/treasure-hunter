var gamestate = function(){};
/* Some good to have variables that might not need to be global */
var player, cursors, sprite_x, sprite_y, time_start, time_spent, collide_check, evaluation_circuit_list;
/* Pause menu objects */
var pause_button, background_label, return_button, menu_button, restart_button;
/* The in-game map that help evaluate the map */
var map_circuit, sprite_text_pair, circuit_list;
/* Some good constant */
var tile_size = data.world.tile_size;
/* Group specific the z-level by initialize order */
var tilegroup, circuitgroup, wallgroup, boxgroup, chestgroup;
gamestate.prototype = {
    preload: function(){
        /* Everything is loaded in loading state */
    },
    next_dimension: function(i, j, direction){
        /* Helper function that helps figure out the new location */
        var newi = i, newj = j;
        switch(direction){
            case "up":
                newj = newj - 1;
                break;
            case"down":
                newj = newj + 1;
                break;
            case "left":
                newi = newi - 1;
                break;
            case "right":
                newi = newi + 1;
                break;
            default:
        }
        return [newi, newj];
    },
    /* A recursive function that recursively evaluates the circuit from the source */
    recursive_evaluate: function(x, y, direction, expression){
        /* Get the current object in the map */
        var item = map_circuit[x][y];
        if(item.type.substring(0, 4) === "wire" && item.status === false){
            /* Turn it on if it is a wire  and it is off, because power flow in */
            item.obj.animations.play("on", 30, false);
            item.status = true;
        }
        switch(item.type){
            /* For wire, just continue the correct the direction */
            case "wireright":
                this.recursive_evaluate(x + 1, y, "right", expression);
                break;
            case "wireleft":
                this.recursive_evaluate(x - 1, y, "left", expression);
                break;
            case "wireup":
                this.recursive_evaluate(x, y - 1, "up", expression);
                break;
            case "wiredown":
                this.recursive_evaluate(x, y + 1, "down", expression);
                break;
            case "placeable":
                /* Continue the evaluation iff it has something placed */
                if(item.status === "placed") {
                    var location = this.next_dimension(x, y, direction);
                    /* The value of the value box is not in property, needed to find it with the pair */
                    for (var i = 0; i < sprite_text_pair.length; i++) {
                        if (sprite_text_pair[i].box === item.contain) {
                            this.recursive_evaluate(location[0], location[1], direction, expression + sprite_text_pair[i].text.text);
                        }
                    }
                }
                break;
            case "eval":
                var location = this.next_dimension(x, y, direction);
                this.recursive_evaluate(location[0], location[1], direction, expression + item.eval);
                break;
            case "eval_end":
                var truth = eval(expression + item.eval);
                var location = this.next_dimension(x, y, direction);
                if(truth){
                    if(map_circuit[location[0]][location[1]].type.substring(0, 4) === "wire"){
                        this.recursive_evaluate(location[0], location[1], direction, "");
                    }
                }
                break;
            case "breakable":
                /* Hitted the wall, break it! */
                item.type = "breaked";
                item.obj.destroy();
                this.rock_break1.play();
                break;
            default:
        }
    },
    evaluate_circuit: function(){
        /* Turn off circuits and record the list of evaluation needed circuit */
        evaluation_circuit_list = [];
        for(var i = 0; i < map_circuit.length; i++){
            for(var j = 0; j < map_circuit[i].length; j++){
                /* Turn off all circuit */
                if(map_circuit[i][j].type.substring(0, 4) === "wire"){
                    map_circuit[i][j].status = false;
                    map_circuit[i][j].obj.animations.play("off", false);
                }
                /* Saveall circuits near the source */
                if(map_circuit[i][j].type === "source"){
                    if(map_circuit[i - 1][j].type.substring(0, 4) === "wire"){
                        evaluation_circuit_list.push([i - 1, j, "left", ""]);
                    }
                    if(map_circuit[i + 1][j].type.substring(0, 4) === "wire"){
                        evaluation_circuit_list.push([i + 1, j, "right", ""]);
                    }
                    if(map_circuit[i][j - 1].type.substring(0, 4) === "wire"){
                        evaluation_circuit_list.push([i, j - 1, "up", ""]);
                    }
                    if(map_circuit[i][j + 1].type.substring(0, 4) === "wire"){
                        evaluation_circuit_list.push([i, j + 1, "down", ""]);
                    }
                }
            }
        }
        /* Evaluate circuits next to source */
        for(var i = 0; i < evaluation_circuit_list.length; i++){
            this.recursive_evaluate(evaluation_circuit_list[i][0], evaluation_circuit_list[i][1],
                evaluation_circuit_list[i][2], evaluation_circuit_list[i][3]);
        }
    },
    box_drag_start: function(sprite, pointer){
        /* Record drag start location */
        sprite_x = sprite.x;
        sprite_y = sprite.y;
        var roundx = Math.floor(pointer.worldX / tile_size);
        var roundy = Math.floor(pointer.worldY / tile_size);
        /* For taking box out of placeable */
        if(map_circuit[roundx][roundy].status === "placed"){
            sprite_x = map_circuit[roundx][roundy].originx;
            sprite_y = map_circuit[roundx][roundy].originy;
            map_circuit[roundx][roundy].status = "empty";
        }
        this.box_sound1.play();
    },
    box_drag_stop:function(sprite, pointer){
        /* Check if the pointer in on a placeable, else return the sprite */
        var roundx = Math.floor(pointer.worldX / tile_size);
        var roundy = Math.floor(pointer.worldY / tile_size);
        if(map_circuit[roundx][roundy].type === "placeable"){
            if(map_circuit[roundx][roundy].status === "placed"){
                map_circuit[roundx][roundy].contain.x = map_circuit[roundx][roundy].originx;
                map_circuit[roundx][roundy].contain.y = map_circuit[roundx][roundy].originy;
                map_circuit[roundx][roundy].status = "empty";
                map_circuit[roundx][roundy].contain.body.immovable = false;
            }
            sprite.x = roundx * tile_size;
            sprite.y = roundy * tile_size;
            map_circuit[roundx][roundy].originx = sprite_x;
            map_circuit[roundx][roundy].originy = sprite_y;
            map_circuit[roundx][roundy].contain = sprite;
            map_circuit[roundx][roundy].status = "placed";
            sprite.body.immovable = true;
            /* Start evaluating brute force */
            this.evaluate_circuit();
        }
        else{
            sprite.x = sprite_x;
            sprite.y = sprite_y;
            sprite.body.immovable = false;
            this.evaluate_circuit();
        }
        this.box_sound1.play();
    },
    /* General setting of the game */
    createWorld: function(){
        game.physics.startSystem(Phaser.Physics.ARCADE);
        game.time.desiredFps = data.world.fps;
        game.physics.arcade.gravity.y = 0;
        game.world.setBounds(0, 0, data.world.width, data.world.height);
    },
    /* Create map helpers */
    set_sprite_size: function(sprite){
        sprite.width = tile_size;
        sprite.height = tile_size;
    },
    make_tile: function(x, y, img){
        var tile = tilegroup.create(x * tile_size, y * tile_size, img);
        this.set_sprite_size(tile);
        return tile;
    },
    make_wall: function(x, y, img){
        var wall = wallgroup.create(x * tile_size, y * tile_size, img);
        this.set_sprite_size(wall);
        game.physics.enable(wall, Phaser.Physics.ARCADE);
        wall.body.immovable = true;
        return wall;
    },
    make_box: function(x, y, img, type, value, eval){
        var box = boxgroup.create(x * tile_size, y * tile_size, img);
        this.set_sprite_size(box);
        /* Have value text follow the box */
        var text = game.add.text(Math.floor(box.x + box.width / 2),
            Math.floor(box.y + box.height / 2), "" + value, data.world.style);
        text.anchor.set(0.5);
        game.physics.enable(box, Phaser.Physics.ARCADE);
        switch(type){
            case "source":
            case "eval":
            case "eval_end":
                /* Make sure it is added to the evaluation cycle */
                box.body.immovable = true;
                map_circuit[x][y].obj = box;
                map_circuit[x][y].type = type;
                map_circuit[x][y].eval = eval;
                break;
            case "value":
                /* Set up drag and drop for box */
                box.inputEnabled = true;
                box.input.enableDrag();
                box.events.onDragStart.add(this.box_drag_start, this);
                box.events.onDragStop.add(this.box_drag_stop, this);
                /* Make sure the text follows the box */
                sprite_text_pair.push({"text": text, "box": box});
                break;
            default:
        }
        return box;
    },
    make_circuit: function(x, y, img, type){
        var circuit;
        switch(type){
            case "wireright":
            case "wireleft":
            case "wireup":
            case "wiredown":
                circuit = circuitgroup.create(x * tile_size, y * tile_size, img);
                /* Set animation and status */
                circuit.animations.add("on", null);
                circuit.animations.add("off", [0]);
                map_circuit[x][y].status = false;
                break;
            case "breakable":
                circuit = circuitgroup.create(x * tile_size, y * tile_size, img);
                /* Create wall like breakable */
                game.physics.enable(circuit, Phaser.Physics.ARCADE);
                circuit.body.immovable = true;
                break;
            case "placeable":
                circuit = circuitgroup.create(x * tile_size, y * tile_size, img);
                break;
            default:
        }
        this.set_sprite_size(circuit);
        map_circuit[x][y].type = type;
        map_circuit[x][y].obj = circuit;
        return circuit;
    },
    make_chest: function(x, y, img){
        var chest = chestgroup.create(x * tile_size, y * tile_size, img);
        this.set_sprite_size(chest);
        game.physics.enable(chest, Phaser.Physics.ARCADE);
        chest.body.immovable = true;
        /* Add animation for chest open */
        var chest_anim = chest.animations.add("open");
        chest_anim.onComplete.add(function(){
            /* Reset world bound if game won */
            game.world.setBounds(0, 0, 600, 600);
            game.state.start("scorestate");
        }, this);
        return chest;
    },
    createInitial: function(){
        /* This function is to prepare the for the logic of createMap */
        /* Sprite Text Pair For Keeping text center of Sprite */
        sprite_text_pair = [];
        /* Add visual groups */
        tilegroup = game.add.group();
        circuitgroup = game.add.group();
        wallgroup = game.add.group();
        boxgroup = game.add.group();
        chestgroup = game.add.group();
        /*Initialize circuit, another map for game logic */
        map_circuit = new Array(data.world.x);
        /* It disables extra collison with chest */
        collide_check = true;
        /* Create animation order */
        this.reverse_array = [];
        for(var i = 30; i >= 0; i--){
            this.reverse_array.push(i);
        }
    },
    createMap: function(){
        /* Create map for circuit evaluation */
        for(i = 0; i < data.world.x; i++){
            map_circuit[i] = new Array(data.world.y);
            for(j = 0; j < data.world.y; j++){
                map_circuit[i][j] = {"obj":"", "type":"", "status":"", "contain":"", "originx":"", "originy":"", "eval":""};
            }
        }
        /* Generate object from JSON */
        for(var i in data.map){
            var block = data.map[i];
            switch(block.type){
                case "wall":
                    this.make_wall(block.x, block.y, block.img);
                    break;
                case "tile":
                    this.make_tile(block.x, block.y, block.img);
                    break;
                case "box":
                    this.make_box(block.x, block.y, block.img, block.box_type, block.value, block.eval);
                    break;
                case "circuit":
                    this.make_circuit(block.x, block.y, block.img, block.circuit_type);
                    break;
                case "chest":
                    this.make_chest(block.x, block.y, block.img);
                    break;
                case "player":
                    this.createPlayer(block.x, block.y, block.img);
                    break;
                default:
            }
        }
    },
    createPlayer: function(x, y, img){
        /* Spawn player in the location */
        player = game.add.sprite(x * tile_size, y * tile_size, img);
        game.physics.enable(player, Phaser.Physics.ARCADE);
        this.set_sprite_size(player);
        game.camera.follow(player);
        player.body.collideWorldBounds=true;
        /* Animation for player movement */
        player.animations.add("up", [104, 105, 106, 107, 108, 109, 110, 111, 112], 10, true);
        player.animations.add("left", [117, 118, 119, 120, 121, 122, 123, 124, 125], 10, true);
        player.animations.add("down", [130, 131, 132, 133, 134, 135, 136, 137, 138], 10, true);
        player.animations.add("right", [143, 144, 145, 146, 147, 148, 149, 150, 151], 10, true);
        player.animations.add("idle", [26, 27], 2, true);
    },
    player_box_collision: function(_player, box){
        /* Velocity for pushing box */
        if (cursors.left.isDown){
            box.body.velocity.x = 0 - data.world.box_velocity;
        }
        else if (cursors.right.isDown) {
            box.body.velocity.x = data.world.box_velocity;
        }
        else if(cursors.up.isDown){
            box.body.velocity.y = 0 - data.world.box_velocity;
        }
        else if(cursors.down.isDown){
            box.body.velocity.y = data.world.box_velocity;
        }
        box.body.velocity.x = 0;
        box.body.velocity.y = 0;
    },
    createControl: function(){
        /* Allow arrow keys */
        cursors = game.input.keyboard.createCursorKeys();
    },
    sound_init: function(){
        this.button_sound1 = game.add.audio("button_sound1");
        this.chest_open1 = game.add.audio("chest_open1");
        this.rock_break1 = game.add.audio("rock_break1");
        this.box_sound1 = game.add.audio("box_sound1");
        this.step_sound = game.add.audio(data.world.step_sound);
    },
    create: function(){
        this.createWorld();
        this.createInitial();
        this.createMap();
        this.createControl();
        this.sound_init();
        /* Text on top of all layers, pause feature */
        var esc_text = game.add.text(15, 15, "ESC", data.world.style);
        esc_text.strokeThickness = 1;
        esc_text.fixedToCamera = true;
        pause_button = game.input.keyboard.addKey(Phaser.Keyboard.ESC);
        pause_button.onUp.add(function () {
            if(!game.paused){
                game.paused= true;
                /* Background for selection */
                background_label = game.add.sprite(width/2 + game.camera.x
                    , height/2 + game.camera.y, "gray_background");
                background_label.anchor.set(0.5, 0.5);
                /* Make buttons for selection */
                return_button = game.add.button(width/2 + game.camera.x
                    , height/2 - 100 + game.camera.y, "return_button", null, this, 2, 1, 0);
                return_button.anchor.set(0.5, 0.5);
                menu_button = game.add.button(width/2 + game.camera.x
                    , height/2 + game.camera.y, "menu_button", null, this, 2, 1, 0);
                menu_button.anchor.set(0.5, 0.5);
                menu_button.fixedToCamera = true;
                restart_button = game.add.button(width/2 + game.camera.x
                    , height/2 + 100 + game.camera.y, "restart_button", null, this, 2, 1, 0);
                restart_button.anchor.set(0.5, 0.5);
                restart_button.fixedToCamera = true;
                time_spent = time_spent + (new Date().getTime() - time_start);
            }
            else{
                background_label.destroy();
                return_button.destroy();
                restart_button.destroy();
                menu_button.destroy();
                game.paused = false;
                time_start = new Date().getTime();
            }
        });
        game.input.onDown.add(this.button_handler, this);
        time_spent = 0;
        time_start = new Date().getTime();
    },
    /* Handle button in paused menu */
    button_handler: function(event){
        if(game.paused) {
            if (event.x + game.camera.x > return_button.x - return_button.width / 2
                && event.x + game.camera.x < return_button.x + return_button.width / 2
                && event.y + game.camera.y > return_button.y - return_button.height / 2
                && event.y + game.camera.y < return_button.y + return_button.height / 2) {
                this.button_sound1.play();
                this.unpause();
            }
            if (event.x + game.camera.x > restart_button.x - restart_button.width / 2
                && event.x + game.camera.x < restart_button.x + restart_button.width / 2
                && event.y + game.camera.y > restart_button.y - restart_button.height / 2
                && event.y + game.camera.y < restart_button.y + restart_button.height / 2) {
                this.button_sound1.play();
                game.state.start("gamestate");
                game.paused = false;
            }
            if(event.x + game.camera.x > menu_button.x - menu_button.width / 2
                && event.x + game.camera.x < menu_button.x + menu_button.width / 2
                && event.y + game.camera.y > menu_button.y - menu_button.height / 2
                && event.y + game.camera.y < menu_button.y + menu_button.height / 2){
                /* World bound changed due to the game, now return it back to normal */
                this.button_sound1.play();
                game.world.setBounds(0, 0, 600, 600);
                game.state.start("menustate");
                game.paused = false;
            }
        }
    },
    /* Update functions for the player movement */
    updateMovement: function(){
        /* Stop the player for update */
        player.body.velocity.x = 0;
        player.body.velocity.y = 0;
        /* Update player movement */
        if (cursors.left.isDown){
            player.body.velocity.x = 0 - data.world.player_velocity;
            player.animations.play("left");
            if(!this.step_sound.isPlaying){
                this.step_sound.play();
            }
        }
        else if (cursors.right.isDown) {
            player.body.velocity.x = data.world.player_velocity;
            player.animations.play("right");
            if(!this.step_sound.isPlaying){
                this.step_sound.play();
            }
        }
        else if(cursors.up.isDown){
            player.body.velocity.y = 0 - data.world.player_velocity;
            player.animations.play("up");
            if(!this.step_sound.isPlaying){
                this.step_sound.play();
            }
        }
        else if(cursors.down.isDown){
            player.body.velocity.y = data.world.player_velocity;
            player.animations.play("down");
            if(!this.step_sound.isPlaying){
                this.step_sound.play();
            }
        }
        else {
            player.animations.play("idle");
            this.step_sound.stop();
        }
    },
    unpause: function(){
        /* Delete all pause item and unpause the game */
        background_label.destroy();
        return_button.destroy();
        restart_button.destroy();
        menu_button.destroy();
        game.paused = false;
        /* Restart timer */
        time_start = new Date().getTime();
    },
    /* End game */
    found_treasure: function(player, chest){
        /* Return world bound to normal and start score screen */
        /* This makes sure no more collision event */
        collide_check = false;
        /* Record time */
        time_spent = time_spent + (new Date().getTime() - time_start);
        /* Box open animation. */
        chest.animations.play("open", 30, false) ;
        this.chest_open1.play();
    },
    updateTextBox: function(){
        /* Make sure the value of the box follows the box. */
        for(i = 0; i < sprite_text_pair.length; i++){
            var text = sprite_text_pair[i].text;
            var box = sprite_text_pair[i].box;
            /* Don't know why 16 and 10, but the update has to be different than static */
            text.x = Math.floor(box.x + box.width / 2);
            text.y = Math.floor(box.y + box.height / 2);
        }
    },
    update: function(){
        /* Process player movement first */
        this.updateMovement();
        /* Deal with collision 1st hand or 2nd hand or 3rd hand! */
        game.physics.arcade.collide(player, boxgroup, this.player_box_collision, null, this);
        this.updateTextBox();
        game.physics.arcade.collide(player, wallgroup, null, null, this);
        game.physics.arcade.collide(player, circuitgroup, null, null, this);
        game.physics.arcade.collide(boxgroup, wallgroup, null, null, this);
        game.physics.arcade.collide(boxgroup, chestgroup, null, null, this);
        game.physics.arcade.collide(boxgroup);
        if(collide_check){
            game.physics.arcade.collide(player, chestgroup, this.found_treasure, null, this);
        }
    },
    render: function(){
        /* Nothing to debug */
    }
};