const mysql = require('mysql');
const path  = require('path');
const fs    = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--mysql-add-test-user [text...]', 'Adds a test user to this environment');

        return module.exports;

    },

    async run(userHostDb){

        if(userHostDb.length < 2){

            return console.log('@err Please run: blitz --mysql-add-test-user <user>@<host> <db>');

        }

        let MYSQL_PASS = await Util.askPass(`Enter password for ${userHostDb[0]}`);
        let MYSQL_HOST = userHostDb[0].split('@')[1];
        let MYSQL_USER = userHostDb[0].split('@')[0];
        let MYSQL_DB   = userHostDb[1];

        var client = mysql.createConnection({
            host     : MYSQL_HOST,
            user     : MYSQL_USER,
            password : MYSQL_PASS,
            database : MYSQL_DB
        });

        client.connect(err => {

            if(err) return console.log('@err ' + err.toString().red);

            Util.setCache('mysql-test', MYSQL_DB + '_' + MYSQL_USER + '_' + MYSQL_HOST, {
                host     : MYSQL_HOST,
                user     : MYSQL_USER,
                password : MYSQL_PASS,
                database : MYSQL_DB
            }).then(() => {

                console.log(`@info Test user sucessfully addedd to $BLITZ_HOME/cache/mysql-test`.green);

            }).catch(e => {

                console.log(e);

            });

            client.end();
            
        });

    }

}