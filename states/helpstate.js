var helpstate = function(){};
helpstate.prototype = {
    preload: function(){
    },
    cancel_button_click: function(){
        /* Play a button sound then return to menu */
        this.button_sound1.play();
        game.state.start("menustate");
    },
    create: function(){
        /* Add some for this state just in case the cancel button is clicked */
        this.button_sound1 = game.add.audio("button_sound1");
        /* Load background */
        game.add.sprite(game.world.centerX, game.world.centerY, 'helpsplash').anchor.set(0.5);
        var cancel_button;
        cancel_button = game.add.button(game.world.centerX, 500, 'cancel_button', this.cancel_button_click, this, 2, 1, 0).anchor.set(0.5);
    },
    update: function(){
    },
};
