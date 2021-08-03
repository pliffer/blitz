const path    = require('path');
const fs      = require('fs-extra');
const cp      = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        // @todo Esse setup deve abrir todas as páginas do projeto, além de um conjunto de arquivos
        // gerados no momento, que guardam informações sobre quantos logs, qual foi o ultimo acesso
        // se falta comitar algum arquivo, abre também o projeto com blitz rodando,
        // abre a partir da porta, abre também o lightning-desktop de alguns casos. ABre também o b
        // itbucket, abre também seu arquivo de documentação com as tarefas que faltam, ultimos arquivos
        // alterados

        program.option('--setup <project>', 'Open project environment');

        return module.exports;

    },

    openIDEProject(projectName){

        // @todo Tornar função compatível com outros IDEs
        if(process.env.SUBLIME_PATH){

            let sublimeProjectPath = path.join(process.env.SUBLIME_PATH, 'Packages/User/Projects/', `${projectName}.sublime-project`);

            if(fs.existsSync(sublimeProjectPath)){

                Util.inheritSpawn(['subl', sublimeProjectPath]);

            }

        } else{

            console.log(`@warn ${"(X)".red} process.env.SUBLIME_PATH not configured`);

        }

    },

    parseSetup(setup, proj, project){

        setup.forEach(item => {

            switch(item){
                case 'lucy':

                    let separator = '/';

                    if(process.env.LUCY_HOST[process.env.LUCY_HOST.length-1] == '/') separator = '';

                    if(proj.finalPath[0] == '/') separator = '';

                    Util.open(process.env.LUCY_HOST + separator + proj.finalPath);

                break;
                default:

                    let args = item.split(':');

                    args[0] = args[0].trim();
                    args[1] = args[1].trim();

                    console.log('Aqui estão os argumentos', args);

                break;
            }

        });

    },

    parsePackage(src, project){},
    parseBlitz(src,   project){},

    parseProject(src, project){

        return fs.readJson(src).then(json => {

            if(!json.setup){

                console.log(`@warn ${"(X)".red} .setup not configured`);

            } else{

                module.exports.parseSetup(json.setup, project, json);

            }

            return;

            if(!json.projectName){

                Util.inheritSpawn(['subl', json.finalPath]);

            } else{

                module.exports.openIDEProject(json.projectName);

            }

            // console.log(json);

        });

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

                        // Util.inheritSpawn(['subl', proj.finalPath]);

                        let packagePath   = path.join(proj.finalPath, 'package.json');
                        let blitzJsonPath = path.join(proj.finalPath, 'blitz.json');

                        let existsPackage = fs.existsSync(packagePath);
                        let existsBlitz   = fs.existsSync(blitzJsonPath);

                        if(!existsPackage && !existsBlitz){

                            return console.log(`@warn ignored, because ${proj.finalPath.red} is not a parseable project`);

                        }

                        if(existsPackage){

                            return module.exports.parseProject(packagePath, proj);

                        }

                        if(existsBlitz){

                            return module.exports.parseProject(blitzJsonPath, proj);

                        }

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