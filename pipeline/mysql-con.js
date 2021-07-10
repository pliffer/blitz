let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--mysql-con', 'Connects to a mysql database');

        return module.exports;

    },

    async run(){

        let env = await Util.getEnv();

        if(!env) return;

        if(!env.MYSQL_PASS || !env.MYSQL_USER || !env.MYSQL_HOST || !env.MYSQL_DB){

            return console.log(`@err It is required the four properties: MYSQL_PASS, MYSQL_USER, MYSQL_HOST, MYSQL_DB`);

        }

        console.log(`@info ${env.MYSQL_USER.green}@${env.MYSQL_HOST.green} (db: ${env.MYSQL_DB.green})`);
        console.log(`\n`);

        Util.inheritSpawn(['mysql', '-h', env.MYSQL_HOST, '-u', env.MYSQL_USER, '-p' + env.MYSQL_PASS, '-A', env.MYSQL_DB]);

    }

}