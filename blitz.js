#!/usr/bin/env node

const program = require('commander').program;
const path    = require('path');
const fs      = require('fs-extra');

program.version('0.0.1');

let pipeline = {};

fs.readdirSync(path.join(__dirname, 'pipeline')).forEach(pipe => {

    pipeline[pipe.replace('.js', '')] = require(path.join(__dirname, 'pipeline', pipe)).setup(program);

});

program.parse(process.argv);

const options = program.opts();

Object.keys(options).forEach(opt => {

    if(pipeline[opt]) pipeline[opt].run(options[opt], options);

});
