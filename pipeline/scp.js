let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--scp [paths...]', 'SCP of files');

        return module.exports;

    },

    run(dirs, opts){

        // scp ubuntu@log.festasonline25.com.br:/home/ubuntu/log/modules/bling/cache/depositos/nani.zip ~/Desktop/Organizr/depositos.bling.m25.zip
        // scp ~/Desktop/Organizr/depositos.bling.m25.zip log.pliffer.com.br:/home/pliffer/organizr/pliffer/products/logistico/doc/depositos.bling.m25.zip

        console.log('@info [Blitz SCP] Work in progress')

    }

}