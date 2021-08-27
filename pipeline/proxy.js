let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--proxy <text>', 'A fazer');

        return module.exports;

    },

    run(file){

        console.log('@todo Proxy, deve permitir redirecionar, ou criar algum tunel de conexão entre dispositivos');

    }

}