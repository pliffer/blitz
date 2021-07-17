let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--sftp', 'Access SFTP throught blitz.json or sftp-config.json');

        return module.exports;

    },

    sftp(filePath){

        return Util.parseJson(filePath).then(data => {

            if(data.type == 'sftp'){

                Util.inheritSpawn(['ssh', `${data.user}@${data.host}`]);

            }

        });

    },

    async run(){

        let sftpConfig = path.join(process.cwd(), 'sftp-config.json');
        let blitzConfig = path.join(process.cwd(), 'blitz.json');

        if(fs.existsSync(sftpConfig)){

            return module.exports.sftp(sftpConfig);

        }

        if(fs.existsSync(blitzConfig)){

            return module.exports.sftp(blitzConfig);

        }

    }

}