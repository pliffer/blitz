let fs = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--sql-table <sql>', 'Output in relational data (openable by excel) with an sql input');
        program.option('--output <filename>', 'Output relational data to a filename');

        return module.exports;

    },

    async run(sql, options){

        let env = await Util.getEnv();

        if(!env) return console.log(`@err No .env found`);

        if(!env.MYSQL_PASS || !env.MYSQL_USER || !env.MYSQL_HOST || !env.MYSQL_DB){

            return console.log(`@err It is required the four properties: MYSQL_PASS, MYSQL_USER, MYSQL_HOST, MYSQL_DB`);

        }

        let totalData = "";

        Util.spawn(['mysql', '-h', env.MYSQL_HOST, '-u', env.MYSQL_USER, env.MYSQL_DB, '-p' + env.MYSQL_PASS, '-B', '-e', `${sql}`], (data) => {

            totalData += data;

        }).then(() => {

            if(options.output){

                return fs.writeFile(options.output, totalData, 'utf-8').then(() => {

                    console.log(`@info Arquivo ${options.output} escrito`);

                });

            }

        });

    }

}