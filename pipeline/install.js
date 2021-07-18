const request = require('request');
const path    = require('path');
const fs      = require('fs-extra');
const mysql   = require('mysql');
const cp      = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('-i, --install <text>', 'Install a repo');

        return module.exports;

    },

    run(opt, opts){

        let finalName = false;
        let appName   = false;
        let run       = true;

        if(typeof opts.finalName != 'undefined') finalName = opts.finalName;
        if(typeof opts.appName   != 'undefined') appName   = opts.appName;
        if(typeof opts.run       != 'undefined') run       = opts.run;

        // @todo Fazer referencia aos projetos que possuem outros como dependencia
        // por exemplo, ao rodar o plifit client, ele usa o plifit cloud como dependencia
        // portanto ambos devem ser instalados para que o plifit client possa funcionar

        let repos = {};

        return Util.listCached('repolist').then(repolist => {

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

                if(!finalName) finalName = opt;

                let git = cp.spawn('git', ['clone', '--progress', repos[opt], finalName]);

                git.stdout.on('data', function (data) {

                    console.log('stdout: ' + data.toString());

                });

                let part = 1;
                let maxPercentage = 0;

                git.stderr.on('data', function (data) {

                    data = data.toString();

                    let out = 'X->' + data;

                    if(data.indexOf('The requested repository either does not exist or you do not have access') != -1) return reject(data);

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

                let spawn = cp.spawn('npm', ['install'], {
                    cwd: path.join(process.cwd(), finalName)
                });

                if(opts.onSpawn) opts.onSpawn(spawn);

                spawn.stdout.on('data', function (data) {

                    console.log('stdout: ' + data.toString());

                });

                spawn.stderr.on('data', function (data) {

                    data = data.toString();

                    let out = 'X->' + data;

                    Util.lineLog(out);

                });

                spawn.on('exit', function (code) {

                    resolve();

                });

            });

        }).then(() => {

            return Util.randomCached('mysql-test');

        }).then(testData => {

            // @test With non mysql projects

            let port = Util.random(10000, 12000);

            let MYSQL_HOST = testData.host;
            let MYSQL_USER = testData.user;
            let MYSQL_PASS = testData.password;
            let MYSQL_DB   = testData.database;

            if(!appName) appName = finalName;

            let data = `APP_NAME=${appName}
SUPPORT_MAIL=weslley@pliffer.com.br
SECRET=test.787b3e76-4856-427c-a2f4-6165b4f88237
PORT=${port}
HOST=localhost
PROTOCOL=http
MYSQL_HOST=${MYSQL_HOST}
MYSQL_USER=${MYSQL_USER}
MYSQL_PASS=${MYSQL_PASS}
MYSQL_DB=${MYSQL_DB}

NODE_ENV=development

ACCESS_HOST=https://lambda.pliffer.com.br
LUNASTRO_HOST=https://logggger.com/api/lunastro
`;

            return fs.writeFile(path.join(process.cwd(), finalName, '.env'), data, 'utf-8').then(() => {

                return testData;

            });

        }).then(testData => {

            return new Promise((resolve, reject) => {

                let MYSQL_HOST = testData.host;
                let MYSQL_USER = testData.user;
                let MYSQL_PASS = testData.password;
                let MYSQL_DB   = testData.database;

                var client = mysql.createConnection({
                    host     : MYSQL_HOST,
                    user     : MYSQL_USER,
                    password : MYSQL_PASS,
                    database : MYSQL_DB
                });

                client.connect(err => {

                    if(err) return reject(err);

                    client.query("DROP DATABASE " + MYSQL_DB, [], (err, answer) => {

                        if(err) return reject(err);

                        client.query("CREATE DATABASE " + MYSQL_DB, [], (err, answer) => { 

                            if(err) return reject(err);
                            
                            client.end();

                            resolve();

                        });

                    });

                });

            });

        }).then(() => {

            if(run) return global.pipeline.start.run(opt);

        }).then(() => {

        }).then(() => {

        }).catch(e => {

            console.log(`@err ${e.toString().red}`);

        });

    }

}