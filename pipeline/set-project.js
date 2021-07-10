let fs   = require('fs-extra');
let path = require('path');

let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('--set-project <text>', 'Save a folder as a project for later use');

        return module.exports;

    },

    run(opt){

        let finalPath = path.join(process.cwd(), opt);

        let finalName = finalPath.replace(/\//g, '-');

        let packagePath = path.join(finalPath, 'package.json');

        if(!fs.existsSync(packagePath)){

            return console.log(`@warn ignored, because ${finalPath.red} is not a node project`);

        }

        let package = require(path.join(finalPath, 'package.json'));

        Util.setCache('projects', finalName, {
            finalPath: finalPath,
            name: package.name,
            package: package
        }).then(() => {

            console.log(`@info ${finalPath.green} sucessfully addedd to $BLITZ_HOME/cache/projects`);

        }).catch(e => {

            console.log(e);

        });

    }

}