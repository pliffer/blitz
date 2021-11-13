let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--sql-table <sql>', 'Output in relational data (openable by excel) with an sql input');

        return module.exports;

    },

    async run(sql){

        let env = await Util.getEnv();

        if(!env) return console.log(`@err No .env found`);

        if(!env.MYSQL_PASS || !env.MYSQL_USER || !env.MYSQL_HOST || !env.MYSQL_DB){

            return console.log(`@err It is required the four properties: MYSQL_PASS, MYSQL_USER, MYSQL_HOST, MYSQL_DB`);

        }

        console.log(`-- @info ${env.MYSQL_USER.green}@${env.MYSQL_HOST.green} (db: ${env.MYSQL_DB.green})`);

        let filename = env.MYSQL_DB + '_' + new Date().getTime() + '_' + new Date().toDateString().replace(/\s+/g, '_') + '.tsv';

        Util.exec('mysql', `-h ${env.MYSQL_HOST} -u ${env.MYSQL_USER} -p${env.MYSQL_PASS} -B -e "${sql}" > ${filename}`, data => {

            console.log(data);

        }).then(() => {

            console.log('-- @info Arquivo formado: ' + filename);

        });

    }

}