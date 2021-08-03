let Util = require('../util.js');

let path = require('path');
let fs   = require('fs-extra');

require('colors');

module.exports = {

    setup(program){

        program.option('--search-projects', 'Search for node projects');

        return module.exports;

    },

    run(searchTerm){

        // @todo Buscar na pasta do sublime /home/pliffer/.config/sublime-text-3/Packages/User/Projects

        return Util.forEachEntry(process.cwd(), (entry) => {

            let basename = path.basename(entry);

            if(basename !== 'package.json') return;

            let appFolder = entry.replace(basename, 'app');

            if(!fs.existsSync(appFolder)) return;

            let absoluteProjectFolder = entry.replace(basename, '').replace(process.cwd() + '/', '');

            global.pipeline.setProject.run(absoluteProjectFolder);

        }, {
            content: false
        });


    }

}