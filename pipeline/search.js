let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('-s, --search <text>', 'Search');

        return module.exports;

    },

    run(searchTerm){

        let searchRegExp = new RegExp(searchTerm, "g");
        let filesFound = [];

        return Util.forEachEntry(process.cwd(), (entry, content) => {

            if(!searchRegExp.test(content)) return;

            let contentLines = content.split("\n");

            filesFound.push(entry);

            console.log(`${filesFound.length}. ${entry.replace(process.cwd() + '/', '').yellow}`);

            contentLines.forEach((lineContent, lineK) => {

                if(!searchRegExp.test(lineContent)) return;

                lineContent = lineContent.replace(searchTerm, searchTerm.red)

                console.log(`${lineK.toString().magenta} ${lineContent}`);

            });

            console.log("");

        });


    }

}