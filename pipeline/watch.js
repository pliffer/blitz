const chokidar = require('chokidar');
const path     = require('path');
const fs       = require('fs-extra');
const cp       = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('--watch <folder or file>', 'Watch anything');

        return module.exports;

    },

    watched: [],

    node(src, callback){

        if(module.exports.watched.includes(src)) return;

        console.log(`@info Observando a pasta ${src.green}`);

        module.exports.watched.push(src);

        let watcher = chokidar.watch(src, {
            persistent: true
        });

        watcher.on('change', filePath => {

            if(filePath.substr(-3) == '.js') callback(filePath);

        });

    },

    run(folder){

        console.log(folder);


    }

}