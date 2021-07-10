let dotenv = require('dotenv');
let path   = require('path');
let fs     = require('fs-extra');
let cp     = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--mysql-con', 'Connects to a mysql database');

        return module.exports;

    },

    run(){

        let envPath = path.join(process.cwd(), '.env');

        if(!fs.existsSync(envPath)){

            return console.log(`@err There's no .env on this folder to be parsed`);

        }

        let envBuffer = fs.readFileSync(envPath);

        let env = dotenv.parse(envBuffer);

        if(!env.MYSQL_PASS || !env.MYSQL_USER || !env.MYSQL_HOST || !env.MYSQL_DB){

            return console.log(`@err It is required the four properties: MYSQL_PASS, MYSQL_USER, MYSQL_HOST, MYSQL_DB`);

        }

        Util.inheritSpawn(['mysql', '-h', env.MYSQL_HOST, '-u', env.MYSQL_USER, '-p' + env.MYSQL_PASS, '-A', env.MYSQL_DB]);

    }

}