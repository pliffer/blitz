const request = require('request');
const path    = require('path');
const fs      = require('fs-extra');
const mysql   = require('mysql');
const cp      = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('--list-repos', 'List available repos');

        return module.exports;

    },

    run(opt, opts){

        let repos = {};

        return Util.listCached('repolist').then(repolist => {

            let repolistPromise = [];

            repolist.forEach(list => {

                repolistPromise.push(Util.getCache('repolist', list).then(content => {

                    return new Promise((resolve, reject) => {

                        request(content.url, (err, content, body) => {

                            body.split('\n').forEach(line => {

                                let repoName = line.split(': ')[0];

                                if(!repoName) return;

                                repos[repoName] = line.split(': ')[1];

                            });

                            resolve();

                        });

                    });

                }));

            });

            return Promise.all(repolistPromise);

        }).then(() => {

            let columnMax = 0;

            for(repoName in repos){

                if(repoName.length > columnMax) columnMax = repoName.length;

            }

            for(repoName in repos){

                console.log(repoName + " ".repeat(columnMax - repoName.length) + ' -> ' + repos[repoName].green);

            }

        });

    }

}