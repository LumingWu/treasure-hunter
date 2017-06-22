var data, config;
/* Basic screen dimension. */
var width = 600;
var height = 600;
/* Set up game instance, phaser as the id of the object in html */
var game = new Phaser.Game(width, height, Phaser.AUTO, "gameView"), main = function () {};
/* Preparing a loading screen */
main.prototype = {
    /* Load script too */
    preload: function () {
        game.load.crossOrigin = "anonymous";
        /* Comment to test locally, uncomment to test cloud. This is automatic concat for url */
        //game.load.baseURL = "https://storage.googleapis.com/treasure_hunter_storage/";
        game.load.json("config", "data/treasure_hunter_config.json");
        game.load.script("preloadstate", "states/preloadstate.js");
    },
    create: function () {
        /* Config just to get a list of paths for the level. */
        config = game.cache.getJSON("config");
        game.state.add("preloadstate", preloadstate);
        game.state.start("preloadstate");
    }
};
/* Start the main function that starts the loading screen. */
game.state.add("main", main);
game.state.start("main");