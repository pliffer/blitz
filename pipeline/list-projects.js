let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

// Mover para fora daqui, talvez no cache
let specialWords = ["Pliffer", "Coligare", "tests", "pliffer", "coligare"," Tests"];

module.exports = {

    setup(program){

        program.option('--list-projects', 'List every project saved on this environment');
        program.option('--fix', 'Fix');

        return module.exports;

    },

    run(obj, opts){

        let fix   = false;
        let projs = [];

        if(opts.fix){
            fix = true;
        }

        Util.listCached('projects').then(projects => {

            let listPromise = [];

            let noRepo = [];
            
            projects.forEach((project, projectN) => {

                listPromise.push(Util.getCache('projects', project).then(proj => {

                    proj.cacheName = project;

                    projs.push(proj);

                    proj.url = project;

                    if(!fs.existsSync(proj.finalPath)){

                        if(fix){

                            Util.removeCache('projects', project);

                        }

                        return console.log(`@warn ${proj.finalPath} doesn't exists anymore`);
                    }

                    let have = "";

                    have += !proj.repo?" [git]".red:"";

                    let waitChecks = [];

                    if(!proj.repo) noRepo.push(proj);
                    else{

                        waitChecks.push(Util.spawn(['git', 'status', '-uno'], data => {

                            if(data.indexOf('nothing to commit') == -1){

                                let modifiedMatch = data.match(/modified\:/g);
                                let deletedMatch  = data.match(/deleted\:/g)

                                let modifiedFiles = 0;

                                if(modifiedMatch) modifiedFiles += modifiedMatch.length;
                                if(deletedMatch)  modifiedFiles += deletedMatch.length;

                                have += (" [" + modifiedFiles + " modified]").blue;

                            }

                            if(data.indexOf('Initial commit') != -1){

                                have += " [Initial Commit]".magenta;

                            }                                

                        }, {
                            cwd: proj.finalPath
                        }));

                    }

                    if(!proj.name) proj.name = '(sem nome)';

                    return Promise.all(waitChecks).then(() => {

                        let finalPath = proj.finalPath;

                        finalPath = finalPath.replace('/home/' + process.env.USER, '~');

                        specialWords.forEach(word => {;

                            finalPath = finalPath.replace(word, word.green);

                        });

                        console.log(proj.name.green + ': ' + finalPath + have);

                    });

                }));

            });


            return Promise.all(listPromise).then(() => {

                console.log("\nTotal de " + projects.length.toString().magenta + " projetos");

                if(!fix) console.log("Run with --fix to index git repos");
                else{

                    let duplicates = {};

                    projs.forEach((proj1, k1) => {

                        projs.forEach((proj2, k2) => {

                            if(k1 == k2) return;

                            let relative = path.relative(proj1.finalPath, proj2.finalPath);

                            if(!relative){

                                let resolvedPath = path.resolve(proj1.finalPath);

                                if(typeof duplicates[resolvedPath] == 'undefined') duplicates[resolvedPath] = [];

                                duplicates[resolvedPath].push(proj2);

                            }

                        });

                    });

                    Object.keys(duplicates).forEach(duplicatePath => {

                        duplicates[duplicatePath].forEach((duplicate, k) => {

                            if(!k) return;

                            Util.removeCache('projects', duplicate.cacheName);

                        });

                    });

                    noRepo.forEach(proj => {

                        module.exports.addRepo(proj);

                    });

                }

            });

        });

    },

    addRepo(proj){

        if(!proj.finalPath) return console.log(`@err ${proj.name} não possui finalPath`);

        Util.spawn(['git', 'remote', 'get-url', 'origin'], data => {

            if(data.substr(0, 6) === 'fatal:'){

                return console.log(`@warn ${proj.name} not in a repo`.red);

            }

            proj.repo = data;

            Util.setCache('projects', proj.url, proj);

        }, {
            cwd: proj.finalPath
        }).catch(e => {

            console.log(proj.name, e);

        });

    }

}