#!/usr/bin/env node

const program = require('commander').program;
const path    = require('path');
const fs      = require('fs-extra');

program.version('0.0.1');

let pipeline = {};

fs.readdirSync(path.join(__dirname, 'pipeline')).forEach(pipe => {

    let optName = pipe.replace('.js', '');

    if(optName.split('-').length > 1){

        let splittedOptName = optName.split('-');

        let newName = "";

        splittedOptName.forEach((name, k) => {

            if(k == 0) return newName += name;

            newName += name[0].toUpperCase() + name.substr(1);

        });

        optName = newName;

    }

    pipeline[optName] = require(path.join(__dirname, 'pipeline', pipe)).setup(program);

});

global.pipeline = pipeline;

program.parse(process.argv);

const options = program.opts();

Object.keys(options).forEach(opt => {

    if(pipeline[opt]) pipeline[opt].run(options[opt], options);
    else{
        console.log(`@warn Option not registred ${opt}`);
    }

});
