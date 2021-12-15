let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    columns: 80,

    setup(program){

        if(process.stdout.columns) module.exports.columns = process.stdout.columns;

        program.option('--inspector <command>', 'Inspect and do things with programming projects');

        return module.exports;

    },

    inspectorIdentifier: ' /*\ _blitzinspector_ \*/ ',

    getApplyFunction(entry, line, k){

        return `console.log("@inspector ${entry}:${k+1}")`;

    },

    opts: {

        'remove-comments'(cwd){

            Util.forEachMatch(cwd, ['*.js'], (entry, content) => {

                let entryPath = entry;

                entry = entry.replace(cwd, '');

                if(entry !== '/module.js') return;

                let newContent = "";

                let change = false;

                content.split("\n").forEach(line => {

                    let lineSplitted = line.split(module.exports.inspectorIdentifier);

                    if(lineSplitted.length > 1){
                        
                        line = lineSplitted[0];
                        change = true;

                    }

                    newContent += line + "\n";

                });

                if(change){

                    fs.writeFileSync(entryPath, newContent);

                }

            });

        },

        'apply-comments'(cwd){

            Util.forEachMatch(cwd, ['*.js'], (entry, content) => {

                let entryPath = entry;

                entry = entry.replace(cwd, '');

                let newContent = "";

                let change = false;

                content.split("\n").forEach((line, k) => {

                    // let test = new RegExp("(=>(\s+|)\{)|(function(\s+|)\([^}{()]+\)(\s+|){)|(\([^}{()]+\)(\s+|){)").test(line);
                    let test = /(\)|\=\>)(\s+|){$/.test(line);

                    if(
                        test
                        &&
                        line.trim().substr(0, 3) !== 'for'
                        &&
                        line.trim().substr(0, 2) !== 'if'
                        &&
                        line.trim().substr(0, 6) !== 'switch'
                    ){

                        change = true;

                        line = line + module.exports.inspectorIdentifier + module.exports.getApplyFunction(entry, line, k);

                    }

                    newContent += line + "\n";

                });

                if(change){

                    fs.writeFileSync(entryPath, newContent);

                }

            });

        },

        // Lista os comentários e seus arquivos
        'comments'(cwd){

        }

    },

    run(opt){

        if(!module.exports.opts[opt]){

            return console.log(`@info There is no option ${opt}`);

        }

        module.exports.opts[opt](process.cwd());

    }

}