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

    pipeline[opt].run(options[opt]);

});

return;


// global.dir = {};

// global.dir.root      = __dirname;
// global.dir.pipeline  = path.join(global.dir.root, 'pipeline');

// global.dir.app  = process.cwd();

// global.opts = {

// 	ignorePaths: [
// 		global.dir.app + '/node_modules',
// 		global.dir.app + '/.git'
// 	]

// }

// global.util = require(path.join(global.dir.root, 'util.js'));

// global.util.config = require('./config');

// global.util.getAllEntries(global.dir.app).then(entries => {

// 	global.util.toPipeline(entries);

// });
