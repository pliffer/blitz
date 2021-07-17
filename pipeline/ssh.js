let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--ssh', 'Access SSH throught blitz.json or sftp-config.json');

        return module.exports;

    },

    ssh(filePath){

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

            return module.exports.ssh(sftpConfig);

        }

        if(fs.existsSync(blitzConfig)){

            return module.exports.ssh(blitzConfig);

        }

    }

}