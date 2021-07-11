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

    activeSpawn: null,
    running: false,

    run(folder){

        // @todo Melhorar, pois acho que não é a melhor maneira
        if(!module.exports.activeSpawn){

            process.stdin.setEncoding('utf8');

            process.stdin.on('data', (data) => {

                if(data.trim() == 'rs'){

                    module.exports.running = false;

                    module.exports.activeSpawn.stdin.end();
                    module.exports.activeSpawn.kill();

                    console.log(`\n`)
                    console.log(`@info Restarting ${folder} due user rs command -----------------`.blue)
                    console.log(`\n`)

                    process.stdin.end();

                    module.exports.run(folder);

                } else{

                    if(!module.exports.running) return;

                    module.exports.activeSpawn.stdin.write(data);

                }

            });

        }

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

                cwd: path.join(process.cwd(), middle),
                stdio: ['pipe', 'pipe', 'pipe'],
                // detached: true,

                callback: spawn => {

                    module.exports.running = true;
                    module.exports.activeSpawn = spawn;

                    spawn.stdin.on('data', (data) => {

                        process.stdout.write(`X-> ${data.toString()}`);

                    });

                    spawn.stdout.on('data', (data) => {

                        process.stdout.write(`${data.toString()}`);

                    });

                    spawn.stderr.on('data', (data) => {

                        process.stdout.write(`${data.toString()}`);

                    });

                }
            });

        });


    }

}