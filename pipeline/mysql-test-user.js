const mysql = require('mysql');
const path  = require('path');
const fs    = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--mysql-test-user', 'Get a mysql test user');
        program.option('--sql <file>', 'Insert an sql if given');

        return module.exports;

    },

    async run(prop, obj){

        let ret = false;

        if(obj.ret) ret = true;
        
        return Util.randomCached('mysql-test').then(cached => {

            return {
                MYSQL_HOST: cached.host,
                MYSQL_USER: cached.user,
                MYSQL_PASS: cached.password,
                MYSQL_DB:   cached.database
            }

        }).then(result => {

            if(ret) return result;

            for(prop in result){
                console.log(prop.green + "=" + result[prop]);
            }

            return result;

        }).then(result => {

            if(obj.sql){

                return new Promise((resolve, reject) => {

                    let MYSQL_HOST = result.MYSQL_HOST;
                    let MYSQL_USER = result.MYSQL_USER;
                    let MYSQL_PASS = result.MYSQL_PASS;
                    let MYSQL_DB   = result.MYSQL_DB;

                    // @dry 01M0N00dm3
                    var client = mysql.createConnection({
                        host     : MYSQL_HOST,
                        user     : MYSQL_USER,
                        password : MYSQL_PASS,
                        database : MYSQL_DB
                    });

                    client.connect(err => {

                        if(err) return reject(err);

                        client.query("DROP DATABASE " + MYSQL_DB, [], (err, answer) => {

                            if(err) return reject(err);

                            client.query("CREATE DATABASE " + MYSQL_DB, [], (err, answer) => { 

                                if(err) return reject(err);

                                client.query("use " + MYSQL_DB, [], (err, answer) => { 

                                    // @security at risk
                                    client.query(fs.readFileSync(obj.sql, 'utf-8'), [], (err, answer) => {

                                        client.end();
                                        resolve();
                                        
                                    });

                                });

                            });

                        });

                    });

                });

            }

        });

    }

}