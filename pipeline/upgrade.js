const path = require('path');
const fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--upgrade', 'Upgrade blitz repo');

        return module.exports;

    },


    run(){

        let cwd = path.resolve(__dirname, '../');

        Util.run('git pull origin master', data => {

            if(~data.indexOf('Already up-to-date.')){

                console.log('@info Nada a atualizar');

            }

            let matches = data.match(/Updating\s+[a-z0-9]{7}\.\.[a-z0-9]{7}/g);

            if(matches && matches.length){

                console.log('@info Blitz atualizado para nova versão');

            }

        }, {
            cwd: cwd
        });

    }

}