const path = require('path');
const fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--mcs, --mysql-clear-structure <text>', 'Clear a raw .sql file made by an mysqldump');

        return module.exports;

    },

    async run(fileName){

        let filePath = path.join(process.cwd(), fileName);

        if(!fs.existsSync(filePath)){

            return console.log(`@err The file ${filePath.red} doesn't exists`);

        }

        let data = await fs.readFile(filePath, 'utf-8');

        let parsedData = "";

        data.split("\n").forEach(line => {

            if(!line) return;

            if(line.substr(0, 2) == '--' || line.substr(0, 2) == '/*') return;
            if(line.indexOf('DROP TABLE IF EXISTS') != -1) return;

            if(line.indexOf('ENGINE=') != -1){

                line = line.replace(/\)\s+ENGINE=.+?\;/g, ");\n");

            }

            parsedData += line + "\n";

        });

        // parsedData = parsedData.replace(/\n\n\n/g, "\n\n");

        console.log(parsedData);

    }

}