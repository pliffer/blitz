const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    processes: {},

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
            console.log("@todo Instalação da dependencia, adição da versão do wp")

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

    // @todo Talvez não seja a melor ideia passar folder aqui e seja melhor pegar pelo activeSpawn
    restart(folder, due = 'user rs command'){

        console.log(`\n`)
        console.log(`@info Restarting ${folder} due ${due} -----------------`.blue)
        console.log(`\n`)

        module.exports.exitHandler({
            cleanup: true,
            spawnProcess: module.exports.activeSpawn
        }, 'restart');

        process.stdin.end();

        module.exports.run(folder);

    },

    bg(){

        console.log(`@info Processo ligado em ${spawn.pid}, ${"blitz fg".green} para retornar`);

        Util.setCache('background-processes', {
            pid: spawn.pid,
            args: spawn.spawnargs
        });

        module.exports.exitHandler({
            exit: true,
            bg: true,
            spawnProcess: module.exports.activeSpawn
        }, 'bg');

    },

    exiting: false,

    exitHandler(options, msg = 'null'){

        if(module.exports.exiting) return;

        module.exports.exiting = true;

        let spawnProcess = module.exports.activeSpawn;

        if(options.spawnProcess) spawnProcess = options.spawnProcess;

        if(spawnProcess){

            spawnProcess.stdin.end();
            spawnProcess.kill();

            module.exports.exiting = false;

            if(!options.bg){

                console.log(`\n`)
                console.log(`@info Exited due user exit command (${msg})`.blue)
                console.log(`@info Use bg for running this process on background`.yellow);
            }

        }

        if(options.exit) process.exit();

    },

    runned: false,

    run(folder){

        // Adiciona os listeners de saída apenas a primeira vez
        if(!module.exports.runned){

            process.on('exit', module.exports.exitHandler.bind(null, {cleanup:true}, 'exit'))

            // catches ctrl+c
            process.on('SIGINT', module.exports.exitHandler.bind(null, {exit:true}, 'SIGINT'))

            // catches "kill pid"
            process.on('SIGUSR1', module.exports.exitHandler.bind(null, {exit:true}, 'SIGUSR1'))
            process.on('SIGUSR2', module.exports.exitHandler.bind(null, {exit:true}, 'SIGUSR2'))

            // catches uncaught exceptions
            process.on('uncaughtException', module.exports.exitHandler.bind(null, {exit:true}, 'uncaughtException'))

            module.exports.runned = true;

        }

        let middle = '';

        if(folder) middle = folder;

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

            process.stdin.on('data', (data) => {

                if(data.trim() == 'bg'){

                    return module.exports.bg();

                }

                if(data.trim() == 'rs'){

                    return module.exports.restart(folder);

                } else{

                    if(!module.exports.running) return;

                    module.exports.activeSpawn.stdin.write(data);

                }

            });

        }

        process.env._ = path.join(__dirname, '../');

        return fs.readJson(packagePath).then(project => {

            // @todo Conseguir rodar outros formatos, sem ser node, como php, magento, prestashop
            // e isso também detectaria outras necessidades
            let type       = 'node';
            let spawnArray = [type, project.main];

            let config = "";

            if(project.nodemonConfig || project.blitzConfig){

                config = project.nodemonConfig || project.blitzConfig;

                if(config.ignore) config = config.ignore;

            }

            global.pipeline.watch[type](path.join(process.cwd(), middle), () => {

                module.exports.restart(folder, 'file change');

            }, config);

            Util.inheritSpawn(spawnArray, {

                cwd: path.join(process.cwd(), middle),
                stdio: ['pipe', 'pipe', 'pipe'],
                env: process.env,
                detached: true,

                callback: spawn => {

                    module.exports.running = true;
                    module.exports.activeSpawn = spawn;

                    module.exports.processes[spawn.pid] = {
                        running: true,
                        spawnProcess: spawn
                    }

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

                        if(errorCode) errorCode.toString().white;

                        if(!errorCode) errorCode = "null";

                        console.log(`\n`)
                        console.log(`@info Process exited (code ${errorCode}${") -----------------".blue}`.blue)
                        console.log(`@info \`rs\` for blitz restart`.blue)

                    });

                }
            });

        });


    }

}