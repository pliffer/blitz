let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--clone <name>', 'Create a project');
        program.option('--into <into>', 'Into a folder');

        return module.exports;

    },

    irrigate(projName, opts){

        let cwd = path.join(process.cwd(), projName);

        switch(opts.base){

            case 'wordpress':


            break;
            case 'prestashop1.7':


            break;

            case 'electron':

            break;
            default:

                console.log(`@err Option ${opts.base} not registred`);

            break;

        }

    },

    run(projName, opts){

        return console.log('@todo Esse projeto visa copiar um projeto existente, com excessão de seus arquivos repetidos')

        if(fs.existsSync(projName) && !opts.irrigate) return console.log(`@err ${projName} folder already exists`);

        console.log(`@info Cloning ${projName}`);

        module.exports.irrigate(projName, opts);

    }

}