const path    = require('path');
const fs      = require('fs-extra');
const cp      = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        // @todo Esse setup deve abrir todas as páginas do projeto, além de um conjunto de arquivos
        // gerados no momento, que guardam informações sobre quantos logs, qual foi o ultimo acesso
        // se falta comitar algum arquivo, arbre o arquivo de projeto no sublime, abre as guias com
        // o projeto lucy configurado na quantidade certa, abre também o projeto com blitz rodando,
        // abre a partir da porta, abre também o lightning-desktop de alguns casos. ABre também o b
        // itbucket, abre também seu arquivo de documentação com as tarefas que faltam, ultimos arquivos
        // alterados

        program.option('--lucy <project>', 'Open project path on lucy');

        return module.exports;

    },

    run(opt){

        if(!process.env.LUCY_HOST){

            return console.log(`@warn process.env.LUCY_HOST not configured`);

        }

        let opened = 0;

        Util.listCached('projects').then(projects => {

            let openPromise = [];
            
            projects.forEach(project => {

                openPromise.push(Util.getCache('projects', project).then(proj => {

                    if(opt == proj.name){

                        opened++;

                        let separator = '/';

                        if(process.env.LUCY_HOST[process.env.LUCY_HOST.length-1] == '/') separator = '';

                        let urlToOpen = process.env.LUCY_HOST + separator + proj.finalPath;

                        urlToOpen = urlToOpen.replace(process.env.LUCY_HOST + '//', process.env.LUCY_HOST + '/');

                        Util.open(urlToOpen);

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