const inquirer = require('inquirer');
const Prompt   = require('prompt-password');
const dotenv   = require('dotenv');
const path     = require('path');
const opn      = require('opn');
const cp       = require('child_process');
const fs       = require('fs-extra');

let Util = {

	config: {
		enabled: {}
	},

	_extensions: {

		programming: ['js', 'cs'],
		markup: ['md', 'html'],
		shell: ['sh', 'bat', ],
		precompiled: ['scss', 'sass', 'pug', 'jade', 'ts'],
		other: ['conf', 'css', 'example', 'EXAMPLE', 'txt']

	},

    open(url){

        opn(url);

    },

    // @todo Revisar essa função
    humanizeBytes(bytes){

        let sizeShow  = (bytes / 1024 / 1024).toFixed(2);
        let showSufix = 'mb';

        if(sizeShow > 1000){

            showSufix = 'gb';
            sizeShow = (sizeShow / 1024).toFixed(2);

        } else if(sizeShow < 1){
            showSufix = 'kb';
            sizeShow = (bytes / 1024).toFixed(2);
        }

        if(showSufix == 'kb' && sizeShow < 1){

            showSufix = 'b';
            sizeShow = bytes;

        }

        return sizeShow + '' + showSufix;

    },

    matchPattern(str, rule){

        let notMatch = false;

        if(rule[0] == '!'){

            notMatch = true;
            rule = rule.substr(1);

        }

        var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");

        let test = new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);

        if(notMatch) test = !test;

        return test;

    },

    treeObj(obj){

        var finalObj = false;

        if(Object.keys(obj).length){

            finalObj = {};

            Object.keys(obj).sort().forEach(objKey => {

                finalObj[objKey] = obj[objKey];

                console.log(obj[objKey])

                if(Object.keys(obj[objKey]).length && typeof obj[objKey] == 'object'){

                    let recursiveTree = Util.treeObj(obj[objKey]);

                    Object.keys(recursiveTree).sort().forEach(recursiveItem => {

                        delete finalObj[objKey];

                        finalObj[objKey + '/' + recursiveItem] = recursiveTree[recursiveItem];

                    });

                }

            });

        }

        return finalObj;

    },

    diferencies(a, b){

        let diferencies = {};

        let bPlain = Util.treeObj(b);
        let aPlain = Util.treeObj(a);

        Object.keys(bPlain).sort().forEach(function(bPlainKey){

            // Verifica se existe em A
            if(aPlain[bPlainKey]){

                if(aPlain[bPlainKey] !== bPlain[bPlainKey]){

                    console.log(`${aPlain[bPlainKey]} !== ${bPlain[bPlainKey]}`);

                    diferencies[bPlainKey] = bPlain[bPlainKey];

                } else{

                }

            } else{

                console.log('Não encontrado em a', bPlainKey, bPlain[bPlainKey]);

                diferencies[bPlainKey] = bPlain[bPlainKey];

            }

        });

        return diferencies;

    },

    identifyFramework(dir){

        // @todo Adicionar uma metodologia mais prática na identificação dos frameworks
        // como por exemplo uma adição por JSON

        // Pega-se os arquivos irmãos, a fim de identificar qual framework estamos
        let brotherFiles = fs.readdirSync(dir);

        let possibility = {};

        let possibleFiles = {
            wordpressTheme: ['entry.php', 'header.php', 'functions.php', 'sidebar.php', 'comments.php'],
            magento: ['Gruntfile.js.sample', 'auth.json.sample', 'phpserver', 'SECURITY.md', 'generated', 'COPYING.txt'],
            magentoTheme: ['theme.xml', 'registration.php', 'i18n'],
            prestashop: ['header.php', 'init.php', 'error500.html', 'prestashop', 'Adapter', 'classes', 'localization', 'images.inc.php'],
            prestashopTheme: ['404.tpl', 'breadcrumb.tpl', 'my-account.tpl', 'config.xml', 'cms.tpl']
        }

        if(brotherFiles.includes('blitz.json')){

            let blitzData = fs.readJsonSync(path.join(dir, 'blitz.json'));

            if(blitzData.framework){

                return blitzData.framework;

            }

        }

        brotherFiles.forEach(file => {

            for(framework in possibleFiles){

                if(possibleFiles[framework].includes(file)){

                    if(!possibility[framework]) possibility[framework] = 0;

                    possibility[framework]++;

                }

            }

        });

        let max    = 0;
        let chosed = '';

        Object.keys(possibility).forEach(framework => {

            if(possibility[framework] > max){

                chosed = framework;
                max = possibility[framework];

            }

        });

        return chosed;

    },

    parseJson(path){

        return fs.readFile(path, 'utf-8').then(json => {

            // Remove os comentários
            json = json.toString().replace(/\s\/\/.+?\n/g, '');

            return JSON.parse(json);

        }).catch(e => {

            console.log(`@err ${path} is in an invalid json format`);

        });

    },

    random(min, max){
        return Math.floor(Math.random()*(max-min+1)+min);
    },

	populateRecursively(entriesPath, entries){

		return new Promise((resolve, reject) => {

			fs.readdirSync(entriesPath).forEach(entry => {

				let entryPath = path.join(entriesPath, entry);

				if(/node_modules/.test(entryPath)) return;
				if(/platforms\/android/.test(entryPath)) return;
                if(/plugins\/cordova/.test(entryPath)) return;
                if(/\.git/.test(entryPath)) return;

				let stat = fs.lstatSync(entryPath)

                entries.push(entryPath);

				if(!stat.isFile()){

					Util.populateRecursively(entryPath, entries);

				}

			});

			resolve(entries);

		});

	},

    ignorableExt: ['.log', '.pdf', '.xlsx', '.xls', '.ods', '.png', '.jpg', '.jpeg', '.bmp', '.mp3', '.ogg', '.xml'],

    forEachEntry(entriesPath, callback, opt = {}){

        if(!opt.content) opt.content = true;

        return new Promise((resolve, reject) => {

            fs.exists(entriesPath).then(exists => {

                if(!exists) return;

                fs.readdirSync(entriesPath).forEach(entry => {

                    let entryPath = path.join(entriesPath, entry);

                    if(/node_modules/.test(entryPath)) return;
                    if(/platforms\/android/.test(entryPath)) return;
                    if(/\.git/.test(entryPath)) return;
                    if(/plugins\/cordova/.test(entryPath)) return;
                    if(/cache/.test(entryPath)) return;

                    let ext = path.extname(entry);

                    if(module.exports.ignorableExt.includes(ext)) return;

                    let stat = fs.lstatSync(entryPath)

                    // Se for acima de 5mb, ignora
                    if(stat.size / 1024 / 1024 > 5){
                        return;
                    }

                    if(!stat.isFile()){

                        Util.forEachEntry(entryPath, callback);

                    } else{

                        if(opt.content){
                            
                            callback(entryPath, fs.readFileSync(entryPath, 'utf-8'));

                        } else{

                            callback(entryPath);

                        }                    

                    }

                });

                resolve();

            });

        });

    },

    forEachMatch(entriesPath, match, callback, opt = {}){

        if(!opt.content) opt.content = true;

        if(!match instanceof Array){
            match = [match];
        }

        return new Promise((resolve, reject) => {

            fs.exists(entriesPath).then(exists => {

                if(!exists) return;

                fs.readdirSync(entriesPath).forEach(entry => {

                    let entryPath = path.join(entriesPath, entry);

                    if(/node_modules/.test(entryPath)) return;
                    if(/\.git/.test(entryPath)) return;

                    let ext = path.extname(entry);

                    let stat = fs.lstatSync(entryPath)

                    // Se for acima de 5mb, ignora
                    if(stat.size / 1024 / 1024 > 5){
                        return;
                    }

                    if(!stat.isFile()){

                        Util.forEachMatch(entryPath, match, callback);

                    } else{

                        let flagContinue = false;

                        for(let i = 0; i < match.length; i++){

                            // console.log(entry, match[i], Util.matchPattern(entry, match[i]))

                            if(Util.matchPattern(entry, match[i])) flagContinue = true;

                        }

                        if(!flagContinue) return;

                        if(opt.content){
                            
                            callback(entryPath, fs.readFileSync(entryPath, 'utf-8'));

                        } else{

                            callback(entryPath);

                        }                    

                    }

                });

                resolve();

            });

        });

    },

	getAllEntries(entriesPath){

		let entries = [];

		return Util.populateRecursively(entriesPath, entries).then(() => {

			return entries;

		});

	},

	toPipeline(entries){

		fs.readdirSync(global.dir.pipeline).forEach(pipeFile => {

			require(path.join(global.dir.pipeline, pipeFile))(entries, Util.config);

		});

	},

    fileDiff(file1, file2){

        return new Promise(async (resolve, reject) => {

            let data1 = await fs.readFileSync(file1, 'utf-8');
            let data2 = await fs.readFileSync(file2, 'utf-8');

            data1 = data1.replaceAll("\r\n", "\n");
            data2 = data2.replaceAll("\r\n", "\n");

            data1 = data1.replaceAll("\r", "\n");
            data2 = data2.replaceAll("\r", "\n");

            data1 = data1.split("\n");
            data2 = data2.split("\n");

            let lines = data1.length;

            if(data2.length > lines){

                lines = data2.length;

            }

            let err    = false;
            let result = [];

            for(let i = 0; i < lines; i++){

                if(err) continue;

                if(data1[i] != data2[i]){

                    err = true;

                    if(typeof data1[i] == 'undefined') data1[i] = '';
                    if(typeof data2[i] == 'undefined') data2[i] = '';

                    let maxLength = data1[i].length;

                    if(data2[i].length > maxLength) maxLength = data2[i].length;

                    let letterErr = false;
                    let part1Err  = '';
                    let part2Err  = '';

                    for(let l = 0; l < maxLength; l++){

                        if(letterErr) continue;

                        let part1 = data1[i].substr(0, l);
                        let part2 = data2[i].substr(0, l);

                        if(part1 !== part2){

                            part1Err = part1;
                            part2Err = data1[i].substr(l);
                            letterErr = true;

                        }

                    }

                    result.push({
                        line: i,
                        part1: part1Err,
                        part2: part2Err,
                        data1: data1,
                        data2: data2
                    });

                }

            }

            return resolve(result);

        });

    },

    showDiff(content1, content2, lineChange){

        let lines = "";
        const space = ' ';

        let hightestColumn = 0;
        let totalLines = 5;

        let from = lineChange - (totalLines-1)/2;
        let to   = lineChange + (totalLines-1)/2;

        let highestLine = content1.length;

        if(content2.length > highestLine){

            highestLine = content2.length;

            for(let i = 0; i < content1.length - highestLine; i++) content1.push('');

        }

        highestLine = highestLine.toString();

        content1.forEach((line, k) => {

            content1[k] = line.replaceAll("\t", '    ');

            line = content1[k];

            if(k < from) return;
            if(k > to) return;

            if(line.length > hightestColumn) hightestColumn = line.length;

        });

        hightestColumn += 1;

        content1.forEach((line, k) => {

            if(k < from) return;
            if(k > to) return;

            let mainLine = false;

            if(k == lineChange) mainLine = true;

            let separator = '|';

            if(line.length < hightestColumn){

                separator = space.repeat(hightestColumn - line.length) + separator;

            }

            let lineNumber = (k+1).toString();

            if(lineNumber.length < to.toString().length){

                lineNumber = (' '.repeat(to.toString().length - lineNumber.length)) + lineNumber.toString();

            }

            if(mainLine) lineNumber = lineNumber.blue;
            else lineNumber = lineNumber.yellow;

            lines += lineNumber + '. ' + Util.sintaxHighlight(content1[k], 'js') + separator + space + Util.sintaxHighlight(content2[k], 'js');
            lines += "\n";

        });

        console.log(lines);

    },

    sintaxHighlight(txt, lang = 'js'){

        if(!txt) txt= '';

        let parsed = txt;

        parsed = parsed.replace('let', 'let'.italic.blue);
        parsed = parsed.replace('const', 'const'.italic.blue);
        parsed = parsed.replace('var', 'var'.italic.blue);

        parsed = parsed.replaceAll('=', '='.italic.magenta);

        parsed = parsed.replace(/\"(.+?)\"/g, '"' + "$1".yellow.italic + '"')
        parsed = parsed.replace(/\'(.+?)\'/g, '\'' + "$1".yellow.italic + '\'')

        return parsed;

    },
    
    lineLog(msg){

        process.stdout.write(`\r${msg}`);

    },

    randomCached(folder){

        return module.exports.listCached(folder).then(list => {

            return module.exports.getCache(folder, list[module.exports.random(0, list.length-1)]);

        });

    },

    listCached(folder){

        let filepath = path.join(__dirname, 'cache', folder);

        return fs.readdir(filepath).catch(e => {

            console.log(`@err ${e.toString()}`);

            throw e;

        });

    },

    setCache(folder, filename, object){

        let cacheDir = path.join(__dirname, 'cache', folder);

        return fs.ensureDir(cacheDir).then(() => {

            filename = filename.toString().replace('.json', '');

            let filepath = path.join(cacheDir, filename + '.json');

            return fs.writeJson(filepath, object);

        }).catch(e => {

            console.log(`@err ${e.toString()}`);

            throw e;

        });

    },

    getProjectFolders(name){

        if(typeof name == 'undefined') return Promise.reject(`@err Argument name needed`);

        let total = [];

        return Util.listCached('projects').then(projects => {

            let projectsPromise = [];
            
            projects.forEach(project => {

                projectsPromise.push(Util.getCache('projects', project).then(proj => {

                    if(name == proj.name){

                        total.push(proj);

                    }

                }));

            });

            return Promise.all(projectsPromise);

        }).then(() => {

            return total;

        });

    },

    getCache(folder, file){

        if(typeof folder == 'undefined') return Promise.reject(`@err Argument folder needed`);
        if(typeof file   == 'undefined') return Promise.reject(`@err Argument file needed`);

        let sufix = '.json';

        if(file.substr(-5) == '.json') sufix = '';

        let filepath = path.join(__dirname, 'cache', folder, file + sufix);

        return fs.exists(filepath).then(exists => {

            if(!exists) return Promise.reject(file + ' not cached at ' + folder);

            return fs.readJson(filepath);

        }).catch(e => {

            console.log(`@err ${e.toString()}`);

            throw e;

        });

    },

    removeCache(folder, file){

        if(typeof folder == 'undefined') return Promise.reject(`@err Argument folder needed`);
        if(typeof file   == 'undefined') return Promise.reject(`@err Argument file needed`);

        let sufix = '.json';

        if(file.substr(-5) == '.json') sufix = '';

        let filepath = path.join(__dirname, 'cache', folder, file + sufix);

        return fs.exists(filepath).then(exists => {

            if(!exists) return Promise.reject(file + ' not cached at ' + folder);

            return fs.remove(filepath);

        }).catch(e => {

            console.log(`@err ${e.toString()}`);

            throw e;

        });

    },

    run(string, dataCallback, opts){

        return new Promise((resolve, reject) => {

            return module.exports.spawn(string.split(' '), dataCallback, opts).then(resolve).catch(reject);

        });

    },

    exec(firstArg, args, dataCallback){

        return new Promise((resolve, reject) => {

            let spawn = cp.exec(firstArg + ' ' + args);

            spawn.stdout.on('data', (data) => {

                dataCallback(data.toString(), 'data');

            });

            spawn.stderr.on('data', (data) => {

                dataCallback(data.toString(), 'err');

            });

            spawn.on('exit', resolve);
            spawn.on('error', reject);

        });

    },

    getEnv(){

        let envPath = path.join(process.cwd(), '.env');

        if(!fs.existsSync(envPath)){

            console.log(`@err There's no .env on this folder to be parsed`);

            return false;

        }

        let envBuffer = fs.readFileSync(envPath);

        return dotenv.parse(envBuffer);

    },

    inheritSpawn(args, additionalOpts){

        let opts = {
            stdio: ['inherit', 'inherit', 'inherit']
        };

        let callback = () => {};

        if(additionalOpts){

            if(additionalOpts.callback) callback = additionalOpts.callback;

            delete additionalOpts.callback;

            for(opt in additionalOpts) opts[opt] = additionalOpts[opt];

        }

        return new Promise((resolve, reject) => {

            let spawn = cp.spawn(args.shift(), args, opts);

            callback(spawn);

            spawn.on('exit', resolve);
            spawn.on('error', reject);

        });

    },

    log(msg){

        // @todo Verbose

        console.log(`@log ${msg}`);

    },

    ask(question){

        return inquirer.prompt({
            name: 'answer',
            message: question
        }).then(answer => {

            return answer.answer;

        });

    },

    askPass(msg){

        return new Prompt({

            type: 'password',
            message: msg,
            name: 'password'

        }).run();

    },

    spawn(args, dataCallback = () => {}, opts = {}){

        return new Promise((resolve, reject) => {

            let spawn = cp.spawn(args.shift(), args, opts);

            spawn.stdout.on('data', (data) => {

                dataCallback(data.toString(), 'data');

            });

            spawn.stderr.on('data', (data) => {

                dataCallback(data.toString(), 'err');

            });

            spawn.on('exit', resolve);
            spawn.on('error', reject);

        });

    }

}

module.exports = Util;
