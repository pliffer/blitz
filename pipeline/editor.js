let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--editor <text>', 'Enable the usage of an editor of doc, excel, js or other file formats');

        return module.exports;

    },

    run(file){

        console.log('@todo Blitz editor (lightning CLI/Indexr CLI)')

        Util.inheritSpawn(['lightning', file], {
            cwd: process.cwd()
        });

    }

}