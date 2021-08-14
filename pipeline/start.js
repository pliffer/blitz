const request = require('request');
const path    = require('path');
const fs      = require('fs-extra');
const mysql   = require('mysql');
const cp      = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('-s, --start [text]', 'Run a project');

        return module.exports;

    },

    parseSftpConfigJson(jsonPath){

        return Util.parseJson(jsonPath).then(async json => {

            let dir = jsonPath.replace(path.basename(jsonPath), '');

            let framework = await Util.identifyFramework(dir);

            let blitz = {
                password: '@todo Chave privada',
                remote_path: json.remote_path,
                dependencies: framework,
                host: json.host,
                name: json.host.replace(json.type + '.', '')
            }

            blitz.host = json.type + '://' + json.user + '@' + json.host;

            return fs.writeJson(path.join(process.cwd(), 'blitz.json'), blitz).then(() => {

                console.log('@info Criado arquivo blitz.json a partir de sftp-config.json');

            });

        });

    },

    parseBlitzJson(blitzPath){

        Util.parseJson(blitzPath).then(json => {

            console.log(json);
            console.log("@todo Instalação da dependncia, adição da versão do wp")

        });

    },

    parseInstallEnvironment(installPath){

        fs.readJson(installPath).then(json => {
            
            let cliInstallFile = path.join(installPath, '../../install/index_cli.php');

            let commands = ['php', cliInstallFile, '--step', 'all', '--language', json.language, '--timezone', json.timezone, '--domain', json.domain, '--db_server', json.db_server, '--db_user', json.db_user, '--db_password', json.db_password, '--db_name', json.db_name, '--name', json.name, '--country', json.country, '--firstname', json.firstname, '--lastname', json.lastname, '--password', json.password, '--email', json.email, '--ssl', json.ssl];

            return Util.inheritSpawn(commands);

        });

    },

    activeSpawn: null,
    running: false,

    run(folder){

        let middle = '';

        if(folder){

            middle = folder;

        }

        let packagePath = path.join(process.cwd(), middle, 'package.json');

        if(!fs.existsSync(packagePath)){

            if(fs.existsSync(path.join(process.cwd(), middle, 'blitz.json'))) return module.exports.parseBlitzJson(path.join(process.cwd(), middle, 'blitz.json'));
            if(fs.existsSync(path.join(process.cwd(), middle, 'sftp-config.json'))) return module.exports.parseSftpConfigJson(path.join(process.cwd(), middle, 'sftp-config.json'));

            if(fs.existsSync(path.join(process.cwd(), middle, 'blitz.install.environment.json'))) return module.exports.parseInstallEnvironment(path.join(process.cwd(), middle, 'blitz.install.environment.json'));
            if(fs.existsSync(path.join(process.cwd(), middle, 'blitz', 'blitz.install.environment.json'))) return module.exports.parseInstallEnvironment(path.join(process.cwd(), middle, 'blitz', 'blitz.install.environment.json'));

            return console.log("@err There's no package.json on this folder");

        }

        // @todo Identificar se package.json é válido

        // @todo Melhorar, pois acho que não é a melhor maneira
        if(!module.exports.activeSpawn){

            process.stdin.setEncoding('utf8');

            process.stdin.on('keypress', (key, data) => {

                console.log('KEYPRESS', key, data);

            });

            process.stdin.on('data', (data) => {

                if(data.trim() == 'rs'){

                    module.exports.running = false;

                    module.exports.activeSpawn.stdin.end();
                    module.exports.activeSpawn.kill();

                    console.log(`\n`)
                    console.log(`@info Restarting ${folder} due user rs command -----------------`.blue)
                    console.log(`\n`)

                    process.stdin.end();

                    module.exports.run(folder);

                } else{

                    if(!module.exports.running) return;

                    module.exports.activeSpawn.stdin.write(data);

                }

            });

        }

        process.env._ = path.join(__dirname, '../');

        return fs.readJson(packagePath).then(project => {

            Util.inheritSpawn(['node', project.main], {

                cwd: path.join(process.cwd(), middle),
                stdio: ['pipe', 'pipe', 'pipe'],
                env: process.env,
                // detached: true,

                callback: spawn => {

                    module.exports.running = true;
                    module.exports.activeSpawn = spawn;

                    spawn.stdin.on('data', (data) => {

                        process.stdout.write(`X-> ${data.toString()}`);

                    });

                    spawn.stdout.on('data', (data) => {

                        process.stdout.write(`${data.toString()}`);

                    });

                    spawn.stderr.on('data', (data) => {

                        process.stdout.write(`${data.toString()}`);

                    });

                    spawn.on('close', (errorCode) => {

                        module.exports.running = false;

                        if(!errorCode) errorCode = "null";

                        console.log(`\n`)
                        console.log(`@info Process exited (code ${errorCode.toString().white}${") -----------------".blue}`.blue)
                        console.log(`@info \`rs\` for blitz restart`.blue)

                    });

                }
            });

        });


    }

}