const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--logs [project]', 'Lista a quantidade de logs de determinado projeto');

        return module.exports;

    },

    parseProject(projectMainFile){

        console.log(projectMainFile);

        return fs.readJson(projectMainFile).then(proj => {

            let finalPath = projectMainFile.replace(path.basename(projectMainFile), '');

            return module.exports.showLogs(finalPath);

        });

    },

    showLogs(finalPath){

        let logsPath = path.join(finalPath, '.logs');

        if(fs.existsSync(logsPath)){

            // let files = []

            return Util.getAllEntries(logsPath).then(files => {

                files.sort();

                let lastFolder = "";
                let lastLength = 0;
                let baseLength = files[0].split(path.sep).length;

                let levelTree = {}
                let tree = {}

                files.forEach(file => {

                    let newLength = file.split(path.sep).length;

                    if(newLength != lastLength || !lastFolder){

                        lastFolder = file.split(path.sep)[file.split(path.sep).length-1];

                    }

                    // if(){

                    //     lastFolder = file.split(path.sep)[file.split(path.sep).length-1];

                    // }

                    // if(newLength < lastLength){

                    //     // lastFolder = path.basename(file);
                    //     lastFolder = file.split(path.sep)[file.split(path.sep).length-2];

                    // }

                    // if(newLength > lastLength){

                    //     lastFolder = file.split(path.sep)[file.split(path.sep).length-2];

                    // }

                    lastLength = newLength;

                    let identationLevel = lastLength - baseLength;
                    let fatherLevel     = path.dirname(file);

                    if(typeof levelTree[identationLevel] == 'undefined') levelTree[identationLevel] = [];
                    if(typeof tree[fatherLevel] == 'undefined') tree[fatherLevel] = [];

                    levelTree[identationLevel].push(file);
                    tree[fatherLevel].push(file);

                    // console.log(identationLevel, lastFolder, file);

                    // console.log(path.basename(file));

                });

                for(folder in tree){

                    console.log(folder);

                }
                // console.log(levelTree);

            });

        }

    },

    run(opt, opts){

        if(opt === true) return module.exports.showLogs(process.cwd());

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

                        if(existsPackage) return module.exports.parseProject(packagePath);
                        if(existsBlitz)   return module.exports.parseProject(blitzJsonPath);

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