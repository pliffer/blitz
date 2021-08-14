let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--ssh [project]', 'Access SSH throught blitz.json or sftp-config.json');

        return module.exports;

    },

    ssh(filePath, commands = []){

        return Util.parseJson(filePath).then(data => {

            if(data.type == 'sftp'){

                Util.inheritSpawn(['ssh', '-tt', `${data.user}@${data.host}`, `cd ${data.remote_path} ; bash --login`]);

            }

        });

    },

    async run(project){

        let cwd = process.cwd();

        if(project !== true){

            let projectFolders = await Util.getProjectFolders(project);

            // Se existir algum projeto encontrado
            if(projectFolders.length){

                // @todo Deve-se haver uma maneira de definir qual é o projeto mais importante, dentre as opções retornadas
                cwd = projectFolders[0].finalPath;

            } else{

                return console.log("@error project not found");

            }

        }

        let sftpConfig = path.join(cwd, 'sftp-config.json');
        let blitzConfig = path.join(cwd, 'blitz.json');

        if(fs.existsSync(sftpConfig)){

            return module.exports.ssh(sftpConfig);

        }

        if(fs.existsSync(blitzConfig)){

            return module.exports.ssh(blitzConfig);

        }

        console.log("@error SSH config not found on this folder");

    }

}