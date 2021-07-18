let fs = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--list-projects', 'List every project saved on this environment');
        program.option('--fix', 'Fix');

        return module.exports;

    },

    run(obj, opts){

        let fix = false;

        if(opts.fix){
            fix = true;
        }

        Util.listCached('projects').then(projects => {

            let listPromise = [];

            let noRepo = [];
            
            projects.forEach(project => {

                listPromise.push(Util.getCache('projects', project).then(proj => {

                    proj.url = project;

                    if(!fs.existsSync(proj.finalPath)) return console.log(`@warn ${proj.finalPath} doesn't exists anymore`);

                    let have = "";

                    have += "[git] "[proj.repo?"green":"red"];

                    if(!proj.repo) noRepo.push(proj);
                    else{

                        // Util.spawn(['git', 'status'], data => {
                        // });

                    }

                    console.log(have + proj.name.green, '->', proj.finalPath);

                }));

            });

            return Promise.all(listPromise).then(() => {

                if(!fix) console.log("Run with --fix to index git repos");
                else{

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