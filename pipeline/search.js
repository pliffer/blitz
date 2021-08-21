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
        let logFiles = [];

        return Util.forEachEntry(process.cwd(), (entry, content) => {

            if(!searchRegExp.test(content)) return;
            if(entry.indexOf('.log') != -1) return logFiles.push(entry);

            let contentLines = content.split("\n");

            filesFound.push(entry);

            console.log(`${filesFound.length}. ${entry.replace(process.cwd() + '/', '').yellow}`);

            contentLines.forEach((lineContent, lineK) => {

                if(!searchRegExp.test(lineContent)) return;

                // @todo Fazer esses numeros variarem, de acordo com o tamanho disponível na tela
                let beginAt = 30;
                let maxLineContent = 300;
                let howManyChars = 60;

                if(lineContent.length > maxLineContent){

                    let foundAt = lineContent.indexOf(searchTerm);

                    if(foundAt < beginAt){

                        lineContent = lineContent.substr(0, maxLineContent);

                    } else{

                        let beggining = lineContent.substr(0, beginAt);
                        let end       = "[...]".blue;
                        let middle    = end;

                        middle+= lineContent.substr(foundAt - ((howManyChars / 2) - searchTerm.length/2), howManyChars);

                        middle = middle.replace(searchTerm, searchTerm.red);

                        lineContent = beggining + middle + end;

                    }

                } else{

                    lineContent = lineContent.replace(searchTerm, searchTerm.red)

                }

                console.log(`${lineK.toString().magenta} ${lineContent}`);

            });

            console.log("");
            
        }).then(() => {

            if(logFiles.length){
                console.log("@info Houveram " + logFiles.length + " arquivos de logs");
            }

        });

    }

}