const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--fg <pid>', 'Transforma determinado processo em gerenciado pelo blitz');

        return module.exports;

    },

    run(opt, opts){

        console.log(opt, opts);

        console.log('OK, vamos analisar se esse pid está num processo nosso');

    }

}