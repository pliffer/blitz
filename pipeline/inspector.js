let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

let documentationBug = `
                return global.db.beginTransaction(err => { /* _blitzinspector_ */ console.log("@inspector /app/models/orders.js:3724 at 1639848873687")

                    let toFreePromise = [];

                    reserved.forEach(row => { /* _blitzinspector_ */ console.log("@inspector /app/models/orders.js:3728 at 1639848873687")
/*
                        toFreePromise.push(SkuAddresses.increment(row.item_address_id, row.quantity, row.address_id, row.sku_id, row.variant_id).then(() => { /* _blitzinspector_ */ console.log("@inspector /app/models/orders.js:3730 at 1639848873687")

                            howMany++;

                        }));
*/
                    });
                    
                    return Promise.all(toFreePromise).then(() => { /* _blitzinspector_ */ console.log("@inspector /app/models/orders.js:3738 at 1639848873687")

                        // @todo Criar notificação de quando estamos liberando os reservados
                        // return Orders.clearReservedItems(order.id);

                    }).then(() => { /* _blitzinspector_ */ console.log("@inspector /app/models/orders.js:3743 at 1639848873687")
`;

// @todo Arrumar nas situações acima em documentationBug
// praticamente o inspetor adicionou um comentário, quebrando o comentário, então o que
// o inspector deve fazer ao aplicar as letras é ignorar quando estiver dentro de um comentário

module.exports = {

    columns: 80,

    setup(program){

        if(process.stdout.columns) module.exports.columns = process.stdout.columns;

        program.option('--inspector <command>', 'Inspect and do things with programming projects');
        program.option('--on <dest>', 'Destination of inspection');

        return module.exports;

    },

    inspectorIdentifier: ' /*\ _blitzinspector_ \*/ ',

    getApplyFunction(entry, line, k){

        return `console.log("@inspector ${entry}:${k+1} at ${new Date().getTime()}")`;

    },

    opts: {

        'remove-comments'(cwd){

            Util.forEachMatch(cwd, ['*.js'], (entry, content) => {

                let entryPath = entry;

                entry = entry.replace(cwd, '');

                if(module.exports.filteredFiles.length){

                    for(filter of module.exports.filteredFiles){

                        if(entry != '/' + filter) return;

                    }

                }

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

                if(module.exports.filteredFiles.length){

                    for(filter of module.exports.filteredFiles){

                        if(entry != '/' + filter) return;

                    }

                }

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

    filteredFiles: [],

    run(opt, opts){

        let argv = process.argv;

        argv.shift();
        argv.shift();
        argv.shift();
        argv.shift();

        if(argv.length == 2){

            if(argv[0] == 'on') module.exports.filteredFiles.push(argv[1]);

        }

        if(!module.exports.opts[opt]){

            return console.log(`@info There is no option ${opt}`);

        }

        module.exports.opts[opt](process.cwd());

    }

}