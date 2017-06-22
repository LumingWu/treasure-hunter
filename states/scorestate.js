var scorestate = function(){};
var treasure_hunter_score;
scorestate.prototype = {
    menu_button_click: function(){
        /* Send score when user chose to. */
        //window.saveScore(treasure_hunter_score);
        game.state.start("menustate");
    },
    preload: function(){
    },
    create: function(){
        /* This became useless when the game saves and closes at the same time */
        this.button_sound1 = game.add.audio("button_sound1");
        /* Add text button.*/
        var text1 = game.add.text(width / 2, height / 2 - 100, "You Won", data.world.style_win);
        text1.anchor.set(0.5);
        var text2 = game.add.text(width / 2, height / 2 - 50, "Time: " + time_spent / 1000, data.world.style_win);
        text2.anchor.set(0.5);
        /* Max score - max score * seconds spent / ideal seconds */
        treasure_hunter_score = Math.floor(data.score - data.score * (time_spent / 1000)/ data.idea_time);
        /* No score less than 0 */
        if(treasure_hunter_score < 0){
            treasure_hunter_score = 0;
        }
        var text3 = game.add.text(width / 2, height / 2, "Score: " + treasure_hunter_score, data.world.style_score);
        text3.anchor.set(0.5);
        game.add.button(width / 2, height / 2 + 100, "save_button", this.menu_button_click, this, 2, 1, 0)
            .anchor.set(0.5, 0.5);
    },
    update: function(){
    },
    render: function(){
    }
};
