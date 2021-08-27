let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--explain', 'Explain this kugel structure');

        return module.exports;

    },

    run(dirs, opts){

        console.log("@todo Exibir características da estrutura desse projeto, sendo kugel, prestashop ou outro tipo(inclusive indeterminado, usando --search e alguns textos para guiar)")

    }

}