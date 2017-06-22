var loadingstate = function(){};
var music_list;
loadingstate.prototype = {
    loadScripts: function () {
        /* Load all the javascript */
        for(var i in data.preload.script){
            game.load.script(data.preload.script[i].name, data.preload.script[i].path);
        }
    },
    loadBgm: function () {
        /* Load Music */
        for(var i in data.preload.music){
            game.load.audio(data.preload.music[i].name, data.preload.music[i].path)
        }
        /* Load Sound */
        for(var i in data.preload.sound){
            game.load.audio(i, data.preload.sound[i])
        }
    },
    loadImages: function () {
        /* Load images */
        for(var i in data.preload.image){
            game.load.image(data.preload.image[i].name, data.preload.image[i].path);
        }
        /* Load spritesheets */
        for(var i in data.preload.spritesheet){
            game.load.spritesheet(data.preload.spritesheet[i].name, data.preload.spritesheet[i].path
            , data.preload.spritesheet[i].width, data.preload.spritesheet[i].height);
        }
    },
    loadFonts: function () {
    },
    play_random_music: function(){
        music_list[Math.floor(Math.random() * music_list.length)].play();
    },
    /* When musics loaded, start playing random music */
    music_handler:function(){
        for(i = 0; i < music_list.length; i++){
            music_list[i].onStop.add(this.play_random_music, this);
        }
        this.play_random_music();
    },
    // The preload function then will call all of the previously defined functions:
    preload: function () {
        /* Loading Text */
        var status = game.add.text(game.world.centerX, 380, 'Loading...', {fill: 'white'});
        status.anchor.setTo(0.5);
        /* Add the loadingbar to the scene */
        var loadingBar = game.add.sprite(game.world.centerX, 400, "loading");
        loadingBar.anchor.setTo(0.5)
        this.load.setPreloadSprite(loadingBar);
        /* Load helpers */
        this.loadScripts();
        this.loadImages();
        this.loadFonts();
        this.loadBgm();
    },
    create: function(){
        /* Music Play List */
        music_list = [];
        for(var i in data.preload.music){
            music_list.push(game.add.audio(data.preload.music[i].name));
        }
        /* Load completed, let handler play random music */
        game.sound.setDecodedCallback(music_list, this.music_handler, this);
        /* This background color meant to test sprite alignment */
        game.stage.backgroundColor = "white";
        /* prepare all state for run and run menustate. */
        game.state.add("menustate", menustate);
        game.state.add("gamestate", gamestate);
        game.state.add("helpstate", helpstate);
        game.state.add("scorestate", scorestate);
        game.state.start("menustate");
    }
};