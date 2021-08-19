const inquirer = require('inquirer');
const path     = require('path');
const fs       = require('fs-extra');
const Astr     = require('astr-api');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--setup-blitz', 'Setup the data origin JWT for blitz');

        return module.exports;

    },

    run(){

        let questionList = [];

        questionList.push({
            name: 'host',
            message: 'Qual o host? (sem <protocol>://)',
            default: 'logggger.com'
        });

        questionList.push({
            name: 'jwt',
            message: 'Qual o JWT?',
        });

        return inquirer.prompt(questionList).then(answers => {

            let astr = new Astr(answers.jwt);

            astr.host = answers.host;

            return astr.tree().then(items => {

                if(typeof items == 'string'){

                    return console.log(`@error Ocorreu um erro durante a requisição: ${items}`);

                }

                return Util.setCache('setup-blitz', answers.host, answers);

            });

        });

    }

}