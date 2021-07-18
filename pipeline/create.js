let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--create <name>', 'Create a project');
        program.option('--base [prestashop, electron, magento, kugel]', 'Select a base between prestashop, electron, wordpress, kugel, magento');
        program.option('--irrigate', 'Put the files on this folder');

        return module.exports;

    },

    irrigate(projName, opts){

        let cwd = path.join(process.cwd(), projName);

        switch(opts.base){

            case 'electron':

                global.pipeline.install.run('kugel', {
                    run: false,
                    finalName: projName
                }).then(() => {

                    return Util.run('npm install electron@13.1.7', data => {

                        console.log('npm install electron', data);

                    }, {
                        cwd: cwd
                    }).then(() => {

                        return module.exports.linkElectronProperties(projName);

                    }).then(() => {

                        return Util.run('npm init -y', data => {}, {
                            cwd: cwd
                        });

                    }).then(() => {

                        return Util.run('npm start', data => {}, {
                            cwd: cwd
                        });

                    });

                });

                console.log('add npm start to package.json');
                console.log('run npm start');

            break;
            default:
                console.log(`@err Option ${opts.base} not registred`);
            break;

        }

    },

    linkElectronProperties(proj){

        let obj = {
            scripts: {
                start: 'electron .'
            }
        };

        let packagePath = path.join(process.cwd(), proj, 'package.json');

        let package = fs.readJsonSync(packagePath);

        package.kugel.modules.start.push('kugel-electron');

        for(prop in obj){

            package[prop] = obj[prop];

        }

        fs.writeJsonSync(packagePath, package);

        console.log(`@info Script writed on ${packagePath}`)

    },

    run(projName, opts){

        if(fs.existsSync(projName) && !opts.irrigate) return console.log(`@err ${projName} folder already exists`);
        else{

            fs.ensureDirSync(projName);

        }

        console.log(`@info Creating ${projName}`);

        module.exports.irrigate(projName, opts);

    }

}