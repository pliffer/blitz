const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--logs <project>', 'Lista a quantidade de logs de determinado projeto');

        return module.exports;

    },

    showProjectLogs(projectMainFile){

        return fs.readJson(projectMainFile).then(proj => {

            let finalPath = projectMainFile.replace(path.basename(projectMainFile), '');

            if(fs.existsSync(path.join(finalPath, '.logs'))){

                console.log(projectMainFile, 'Possui uma pasta de logs');

            }

        });

    },

    run(opt){

        let opened = 0;

        let any = false;

        if(opt == 'all') any = true;

        Util.listCached('projects').then(projects => {

            let openPromise = [];
            
            projects.forEach(project => {

                openPromise.push(Util.getCache('projects', project).then(proj => {

                    if(opt == proj.name || any){

                        opened++;

                        let packagePath   = path.join(proj.finalPath, 'package.json');
                        let blitzJsonPath = path.join(proj.finalPath, 'blitz.json');

                        let existsPackage = fs.existsSync(packagePath);
                        let existsBlitz   = fs.existsSync(blitzJsonPath);

                        if(!existsPackage && !existsBlitz){

                            return console.log(`@warn ignored, because ${proj.finalPath.red} is not a parseable project`);

                        }

                        if(existsPackage) return module.exports.showProjectLogs(packagePath);
                        if(existsBlitz)   return module.exports.showProjectLogs(blitzJsonPath);

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