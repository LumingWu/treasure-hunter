var preloadstate = function(){};

preloadstate.prototype = {
    preload: function(){
        /* Load the data for the current selected level from configure window.vue.currentLevel */
        game.load.json("data", config.level[window.vue.currentLevel]);
        /* Load images */
        game.load.image("loading", "resource/splashes/loading.png");
        /* Load script */
        game.load.script("loadingstate", "states/loadingstate.js");
    },
    create: function(){
        /* put json into the program from game cache */
        data = game.cache.getJSON("data");
        /* Start loading state */
        game.state.add('loadingstate', loadingstate);
        game.state.start('loadingstate');
    }
}