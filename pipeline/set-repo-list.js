let fs   = require('fs-extra');
let path = require('path');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('--set-repo-list <text>', 'Set an url for get the repos');

        return module.exports;

    },

    run(opt){

        Util.setCache('repolist', new Date().getTime(), {
            url: opt
        }).then(() => {

            console.log(`@info ${opt.green} sucessfully addedd to $BLITZ_HOME/cache/repolist`);

        }).catch(e => {

            console.log(e);

        });

    }

}