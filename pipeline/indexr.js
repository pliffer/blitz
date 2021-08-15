let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

let excludedMessages = {};

module.exports = {

    excludeArr: ['.git', 'node_modules', 'bower_components'],

    setup(program){

        program.option('--indexr <path>', 'Show infos from path');
        program.option('--size', 'Show size on indexr');
        program.option('--files', 'Show files on indexr');
        program.option('--folders', 'Show folders on indexr');
        program.option('--count <c>', 'Count the number');

        return module.exports;

    },

    run(dir, options){

        return module.exports.tree(dir).then(obj => {

            console.log("\n");

            let namePrefix = '';

            if(options.name){

                namePrefix = options.name + '-';

            }

            if(options.size){

                var folders = Object.keys(obj.folders).sort((a, b) => {

                    return obj.folders[b].totalSize - obj.folders[a].totalSize;

                });

                let totalSize = 0;

                folders.forEach((folder, k) => {

                    totalSize += obj.folders[folder].totalSize;

                    if(k > options.count - 1) return;

                    let index = ((k+1) + 'º.');

                    let homeFolder = folder;

                    if(homeFolder.indexOf(process.env.HOME) == 0){
                        homeFolder = homeFolder.replace(process.env.HOME, '~');
                    }

                    console.log(index + ' ' + Util.humanizeBytes(obj.folders[folder].totalSize) + ' ' + homeFolder);

                    let emptyFolder = true;
                    let emptyItems  = true;

                    if(options['folders'] && obj.folders[folder].folderList.length){

                        console.log(obj.folders[folder].folderList);
                        emptyFolder = false;

                    }

                    if(options['files'] && Object.keys(obj.folders[folder].fileList).length){

                        emptyItems = false;

                        Object.keys(obj.folders[folder].fileList).sort((a, b) => {

                            return obj.folders[folder].fileList[b].size - obj.folders[folder].fileList[a].size;

                        }).forEach((fileOnList, k) => {

                            if(k > 10) return;

                            let size = Util.humanizeBytes(obj.folders[folder].fileList[fileOnList].size);

                            console.log(fileOnList + ' ' + size);

                        });

                    }

                    if(options['folders'] || options['files'] && (!emptyFolder || !emptyItems)){

                        console.log("\n");

                    }

                });

                if(Object.keys(excludedMessages).length){

                    console.log("\n");

                }

                Object.keys(excludedMessages).forEach(excluded => {

                    console.log(excluded, 'ignorado', excludedMessages[excluded], 'vezes');

                });

                console.log("\n");

                console.log(`Total de ${Util.humanizeBytes(totalSize)} analisados.`);

                if(options.output){

                    fs.ensureDirSync('outputs');

                    let compactedObj = {};
                    let compactedObjDelta = false;
                    let delta = false;

                    // if(options.delta){

                    //     console.log('Vamos pegar a partir de um delta');

                    //     compactedObjDelta = (fs.readJsonSync(options.delta)).obj;
                    //     delta = {};

                    // }

                    Object.keys(obj).forEach(objItem => {

                        if(typeof obj[objItem] == 'object'){

                            compactedObj[objItem] = {};

                            Object.keys(obj[objItem]).forEach((line, k) => {

                                let shortLine = line.replace(options.src, '');

                                // if(k < 10 && compactedObjDelta && compactedObjDelta[objItem] && compactedObjDelta[objItem][shortLine]){

                                //     let isEqual = _.isEqual(obj[objItem][line], compactedObjDelta[objItem][shortLine]);

                                //     // if(!isEqual){

                                //     //     console.log(obj[objItem][line], compactedObjDelta[objItem][shortLine]);

                                //     //     // delta[objItem] = compactedObjDelta[objItem][shortLine];

                                //     //     // delta[objItem] = compactedObj[objItem];

                                //     // }

                                // }

                                compactedObj[objItem][shortLine] = obj[objItem][line];

                            });

                        } else{

                            throw 'wip';

                        }

                    });

                    let finalObj = compactedObj;

                    if(delta){
                        finalObj = delta;
                    }

                    let outputObj = {
                        base: options.src,
                        created_at: new Date().getTime(),
                        obj: finalObj
                    }

                    if(delta){
                        outputObj.deltaFrom = options.delta;
                    }

                    console.log(`Arquivo gerado: outputs/${namePrefix}${new Date().getTime()}.json`);

                    fs.writeJson(`outputs/${namePrefix}${new Date().getTime()}.json`, outputObj);

                }

            } else{
                
                console.log('Especifique um argumento de linha de comando');

            }
            
        });

    },

    tree(dir, obj){

        console.log(dir);

        if(typeof obj === 'undefined'){

            obj = {

                count: {
                    files: 0,
                    folders: 0,
                    errors: 0,
                },

                errors: {},

                files: {},
                folders: {}

            }

        }

        return fs.readdir(dir).then(entries => {

            if(!obj.folders[dir]){

                obj.folders[dir] = {
                    entries:   entries.length,
                    totalSize: 0,
                    files:     0,
                    fileList: {},
                    folderList: [],
                    folders:   0,
                }

            }

            let entriesPromise = [];

            entries.forEach(entry => {

                let entryPath = path.join(dir, entry);

                entriesPromise.push(fs.stat(entryPath).then(stat => {

                    if(stat.isFile()){

                        obj.folders[dir].totalSize += stat.size;
                        obj.folders[dir].files++;

                        obj.folders[dir].fileList[entry] = {
                            size: stat.size,
                            mtimeMs: stat.mtimeMs,
                            ctimeMs: stat.ctimeMs
                        };

                        obj.count.files++;

                        obj.files[entryPath] = {
                            size: stat.size
                        }

                    } else{

                        if(module.exports.excludeArr.includes(entry)){

                            if(!excludedMessages[entry]){

                                excludedMessages[entry] = 0;

                            }

                            excludedMessages[entry]++;

                            return;

                        }

                        obj.count.folders++;
                        obj.folders[dir].folders++;

                        obj.folders[dir].folderList.push(entry);

                        return module.exports.tree(entryPath, obj);

                    }

                }).catch(e => {

                    obj.errors[entryPath] = e;
                    obj.count.errors++;

                }));

            });

            return Promise.all(entriesPromise).then(() => {

                module.exports.sameLineLog(`${obj.count.files} arquivos, ${obj.count.folders} pastas`);

                return obj;

            });

        });

    },

    sameLineLog(msg){

        process.stdout.write(`\r${msg}`);

    }


}