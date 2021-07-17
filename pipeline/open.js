const request = require('request');
const path    = require('path');
const fs      = require('fs-extra');
const mysql   = require('mysql');
const cp      = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('-o --open <text>', 'Open folder on default IDE');

        return module.exports;

    },

    run(opt){

        let opened = 0;

        Util.listCached('projects').then(projects => {

            let openPromise = [];
            
            projects.forEach(project => {

                openPromise.push(Util.getCache('projects', project).then(proj => {

                    if(opt == proj.name){

                        opened++;

                        Util.inheritSpawn(['subl', proj.finalPath]);

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