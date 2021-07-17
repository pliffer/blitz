#!/usr/bin/env node

const program = require('commander').program;
const path    = require('path');
const fs      = require('fs-extra');

require('colors');

let Util = require('./util');

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

let pipelineRun = false;

Object.keys(options).forEach(opt => {

    if(pipeline[opt]){

        pipeline[opt].run(options[opt], options);
        pipelineRun = true;

    } else{

        if(!pipelineRun) console.log(`@warn Option not registred ${opt}`);

    }

});

if(Object.keys(options).length == 0){

    let argv = process.argv;

    argv.shift();
    argv.shift();

    if(argv.length){

        let command = ['blitz'];

        argv.forEach((arg, k) => {

            let prefix = '';

            if(k == 0) prefix = '--';

            command.push(prefix + arg);

        });

        Util.inheritSpawn(command);

    } else{

        pipeline.start.run('.');

    }

}