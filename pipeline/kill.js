const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

require('colors');

module.exports = {

    processes: {},

    setup(program){

        program.option('--kill <string>', 'Kills a process');

        return module.exports;

    },

    async run(arg){

        let count = 0;
        let pids  = [];
        let killPromise = [];

        Util.spawn(['ps', '-ef'], (data => {

            data.split("\n").forEach(line => {

                if(line.indexOf('blitz --kill') !== -1) return;
                if(line.indexOf('blitz kill') !== -1) return;

                if(line.indexOf(arg) !== -1){

                    let splitted = line.split(/\s+/g);

                    let pid = splitted[1];

                    killPromise.push(Util.spawn(['kill', pid]).then(() => {

                        count++;
                        pids.push(pid);

                        console.log(pid, count);

                    }));

                }

            });

        })).then(() => {

            return Promise.all(killPromise).then(() => {

                if(count){

                    console.log(`@info ${count} processos foram killados (${pids})`);

                }

            });

        });

    }

}