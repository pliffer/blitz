const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--status', 'Permite verificar o status para enviarmos de atualizações');

        return module.exports;

    },

    run(opt){

        console.log('@todo Permitirá que seja possível enviar coisas pro git, sem esquecer que há @todos no código, além de @dry e pendencias como não ter @descriptions e outras boas práticas');

    }

}