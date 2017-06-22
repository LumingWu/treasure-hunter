var menustate = function(){};

menustate.prototype = {
    /* Prepare button click */
    start_button_click: function(){
        this.button_sound1.play();
        game.state.start('gamestate');
    },
    help_button_click: function(){
        this.button_sound1.play();
        game.state.start('helpstate');
    },
    preload: function(){
    },
    /* Add image as a spirte */
    create: function(){
        this.button_sound1 = game.add.audio("button_sound1");
        game.add.sprite(game.world.centerX, game.world.centerY, 'menusplash').anchor.set(0.5);
        var start_button, help_button;
        start_button = game.add.button(game.world.centerX, 250, 'start_button', this.start_button_click, this, 2, 1, 0);
        start_button.anchor.set(0.5);
        help_button = game.add.button(game.world.centerX, 325, 'help_button', this.help_button_click, this, 2, 1, 0);
        help_button.anchor.set(0.5);
    },
    update: function(){
    },
};
