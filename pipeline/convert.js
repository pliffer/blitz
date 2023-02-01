const sharp = require('sharp');
const path  = require('path');
const fs    = require('fs-extra');


let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--convert <origin>', 'Convert files');
        program.option('--to <dest>', '--convert: into another file');

        return module.exports;

    },

    run(dirs, opts){

        if(!opts.convert) return console.log(`@error --convert is required`);
        if(!opts.to) return console.log(`@error --to is required`);

        let origin = opts.convert;
        let to     = opts.to;

        let ext   = path.extname(origin);
        let name  = path.basename(origin, ext);
        let toExt = path.extname(to);

        if(toExt == '.jpg') toExt = '.jpeg';

        if(ext == toExt) return console.log(`@error --convert and --to must have different extensions`);

        if(!sharp.format[toExt.substr(1)]) return console.log(`@error --to extension ${toExt} is not supported`);

        return sharp(origin)[toExt.substr(1)]().toFile(to).then(() => {

            console.log(`@info Converted ${origin} to ${to}`);

        }).catch(err => {

            console.log(`@error ${err}`);

        });

    }

}