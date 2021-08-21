let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--mysql-con', 'Connects to a mysql database');

        return module.exports;

    },

    async run(){

        let cwd = process.cwd();

        let framework = Util.identifyFramework(cwd);

        let env = {};

        switch(framework){
            case 'prestashop':

                // @todo Verificar versão do prestashop

                let version = 1.74;

                let baseFile = 'config/settings.inc.php';

                if(version >= 1.7){

                    baseFile = 'app/config/parameters.php';

                }

                let configFile = path.join(cwd, baseFile);

                let configData = fs.readFileSync(configFile, 'utf-8');

                let opts = [];

                if(version >= 1.7){

                    configData.split("\n").forEach(line => {

                        let lineMatches = line.match(/(\'|")([a-zA-Z_]+)(\'|")\s+=>\s+(\'|")(.+?)(\',|",|'|")/);

                        if(lineMatches){
                            opts[lineMatches[2]] = lineMatches[5];
                        }

                    });

                }

                if(opts.database_host){

                    env.MYSQL_HOST = opts.database_host;

                } else{

                    return console.log(`@err Não há MYSQL_HOST encontrado`);

                }

                if(opts.database_user){

                    env.MYSQL_USER = opts.database_user;

                } else{

                    return console.log(`@err Não há MYSQL_USER encontrado`);

                }

                if(opts.database_password){

                    env.MYSQL_PASS = opts.database_password;

                } else{

                    return console.log(`@err Não há MYSQL_PASS encontrado`);

                }

                if(opts.database_name){

                    env.MYSQL_DB = opts.database_name;

                } else{

                    return console.log(`@err Não há MYSQL_DB encontrado`);

                }

            break;
            default:

                env = await Util.getEnv();

                if(!env) return;

            break;
        }

        if(!env.MYSQL_PASS || !env.MYSQL_USER || !env.MYSQL_HOST || !env.MYSQL_DB){

            return console.log(`@err It is required the four properties: MYSQL_PASS, MYSQL_USER, MYSQL_HOST, MYSQL_DB`);

        }

        console.log(`@info ${env.MYSQL_USER.green}@${env.MYSQL_HOST.green} (db: ${env.MYSQL_DB.green})`);
        console.log(`\n`);

        Util.inheritSpawn(['mysql', '-h', env.MYSQL_HOST, '-u', env.MYSQL_USER, '-p' + env.MYSQL_PASS, '-A', env.MYSQL_DB]);

    }

}