const request = require('request');
const path    = require('path');
const fs      = require('fs-extra');
const mysql   = require('mysql');
const cp      = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('-s, --start [text]', 'Run a project');

        return module.exports;

    },

    run(folder){

        let middle = '';

        if(folder){

            middle = folder;

        }

        let packagePath = path.join(process.cwd(), middle, 'package.json');

        if(!fs.existsSync(packagePath)){

            return console.log("@err There's no package.json on this folder");

        }

        return fs.readJson(packagePath).then(project => {

            Util.inheritSpawn(['node', project.main], {
                cwd: path.join(process.cwd(), middle)
            });

        });


    }

}