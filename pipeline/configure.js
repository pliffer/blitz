const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--configure <project>', 'Open main file of project');

        return module.exports;

    },

    run(opt){

        // @todo Esse configure deve só abrir o arquivo base do
        // projeto

        let opened = 0;

        Util.listCached('projects').then(projects => {

            let openPromise = [];
            
            projects.forEach(project => {

                openPromise.push(Util.getCache('projects', project).then(proj => {

                    if(opt == proj.name){

                        opened++;

                        let packagePath   = path.join(proj.finalPath, 'package.json');
                        let blitzJsonPath = path.join(proj.finalPath, 'blitz.json');

                        let existsPackage = fs.existsSync(packagePath);
                        let existsBlitz   = fs.existsSync(blitzJsonPath);

                        if(!existsPackage && !existsBlitz){

                            return console.log(`@warn ignored, because ${proj.finalPath.red} is not a parseable project`);

                        }

                        if(existsPackage) return Util.inheritSpawn(['subl', packagePath]);
                        if(existsBlitz)   return Util.inheritSpawn(['subl', blitzJsonPath]);

                    }

                }));

            });

            return Promise.all(openPromise);

        }).then(() => {

            if(!opened) console.log(`Project ${opt} not found`);
            else{
                console.log(`${opened} folders opened`);
            }

        });


    }

}