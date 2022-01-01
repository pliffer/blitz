const chokidar = require('chokidar');
const path     = require('path');
const fs       = require('fs-extra');
const cp       = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('--autosync', 'Watch this folder');

        return module.exports;

    },

    watched: [],

    node(src, callback, patterns){

        if(src.substr(-1) != '/') src = src + '/';

        if(module.exports.watched.includes(src)) return;

        console.log(`@info Observando a pasta ${src.green}`);

        module.exports.watched.push(src);

        let watcher = chokidar.watch(src, {
            persistent: true,
            ignored: (path) => path.includes('node_modules')
        });

        watcher.on('change', filePath => {

            console.log(filePath)

            let flagContinue = true;

            if(patterns){

                patterns.forEach(pattern => {

                    if(Util.matchPattern(filePath.replace(src, ''), pattern)) flagContinue = false;

                });

            }

            if(flagContinue && filePath.substr(-3) == '.js') callback(filePath);

        });

    },

    run(){

        let sftpConfig = path.join(process.cwd(), 'sftp-config.json');

        return Util.parseJson(sftpConfig).then(data => {

            console.log(`scp ${file} ${data.user}@${data.host}:${data.remote_path}`);

            module.exports.node(process.cwd(), (file) => {

                Util.spawn(['scp', file, data.user + '@' + data.host + ':' + data.remote_path], data => {

                }).then(() => {

                    console.log(file, 'enviado com sucesso');

                });

            });

        });

    }

}