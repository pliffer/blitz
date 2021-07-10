let request = require('request');
let path    = require('path');
let fs      = require('fs-extra');
let cp      = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('-i, --install <text>', 'Install a repo');

        return module.exports;

    },

    run(opt){

        let repos = {};

        Util.listCached('repolist').then(repolist => {

            let repolistPromise = [];

            repolist.forEach(list => {

                repolistPromise.push(Util.getCache('repolist', list).then(content => {

                    return new Promise((resolve, reject) => {

                        request(content.url, (err, content, body) => {

                            body.split('\n').forEach(line => {

                                repos[line.split(': ')[0]] = line.split(': ')[1];

                            });

                            resolve();

                        });

                    });

                }));

            });

            return Promise.all(repolistPromise);

        }).then(() => {

            return new Promise((resolve, reject) => {

                if(!repos[opt]) return console.log(`@err ${opt} not found for installation`);

                let git = cp.spawn('git', ['clone', '--progress', repos[opt]]);

                git.stdout.on('data', function (data) {

                    console.log('stdout: ' + data.toString());

                });

                let part = 1;
                let maxPercentage = 0;

                git.stderr.on('data', function (data) {

                    data = data.toString();

                    let out = 'X->' + data;

                    let ma = data.match(/[0-9]+\%\s\([0-9]+\/[0-9]+\)/g);

                    if(ma && ma.length){

                        let percentage = parseInt(ma[0].substr(0, 3));

                        if(percentage > maxPercentage){

                            maxPercentage = percentage;                            

                        }

                        if(percentage < maxPercentage) part = 2;

                        out = part + '/2 ' + ma[0];

                    }

                    Util.lineLog(out);

                });

                git.on('exit', function (code) {

                    resolve();

                });

            });

        }).then(() => {

            return new Promise((resolve, reject) => {

                if(!repos[opt]) return console.log(`@err ${opt} not found for installation`);

                let git = cp.spawn('npm', ['install'], {
                    cwd: path.join(process.cwd(), opt)
                });

                git.stdout.on('data', function (data) {

                    console.log('stdout: ' + data.toString());

                });

                git.stderr.on('data', function (data) {

                    data = data.toString();

                    let out = 'X->' + data;

                    Util.lineLog(out);

                });

                git.on('exit', function (code) {

                    resolve();

                });

            });

        });

    }

}