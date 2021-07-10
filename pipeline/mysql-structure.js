let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--mysql-structure', 'Output the mysql structure from local project');

        return module.exports;

    },

    async run(){

        let env = await Util.getEnv();

        if(!env) return;

        if(!env.MYSQL_PASS || !env.MYSQL_USER || !env.MYSQL_HOST || !env.MYSQL_DB){

            return console.log(`@err It is required the four properties: MYSQL_PASS, MYSQL_USER, MYSQL_HOST, MYSQL_DB`);

        }

        console.log(`-- @info ${env.MYSQL_USER.green}@${env.MYSQL_HOST.green} (db: ${env.MYSQL_DB.green})`);

        let total = "";

        Util.spawn(['mysqldump', '-h', env.MYSQL_HOST, '-u', env.MYSQL_USER, '-p' + env.MYSQL_PASS, '--no-data', env.MYSQL_DB], data => {

            console.log('-- @info Received ' + data.length + ' caracters');
            total += data;

        }).then(() => {

            console.log(total);

        });

    }

}