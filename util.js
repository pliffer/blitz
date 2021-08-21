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
                if(/\.git/.test(entryPath)) return;
				if(/plugins\/cordova/.test(entryPath)) return;

				let stat = fs.lstatSync(entryPath)

				if(!stat.isFile()){

					Util.populateRecursively(entryPath, entries);

				} else{
					entries.push(entryPath);
				}

			});

			resolve(entries);

		});

	},

    ignorableExt: ['.log', '.pdf', '.xlsx', '.xls', '.ods', '.png', '.jpg', '.jpeg', '.bmp', '.mp3', '.ogg', '.xml'],

    forEachEntry(entriesPath, callback, opt = {}){

        if(!opt.content) opt.content = true;

        return new Promise((resolve, reject) => {

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

    showDiff(files, diff, columns){

        let subjects = [];

        let maxLength = 0;

        let maxAllowed = Math.floor(columns/2) - 10;

        let begin = -4;
        let end   = Math.abs(begin) + 1;

        if(i+diff.line < 0) begin = 0;

        let modLine = diff.line;

        let equalLineNumber = -1;
        let equalLine = "";

        let maxLineLength = diff.data1.length;

        if(diff.data2.length > maxLineLength) maxLineLength = diff.data2.length;

        maxLineLength = maxLineLength.toString().length;

        diff.data2.forEach((line, lineNumber) => {

            if(lineNumber < modLine) return;

            if(line == diff.data1[modLine]){
                equalLine = line;
                equalLineNumber = lineNumber;
            }

        });

        for(var i = begin; i < end; i++){

            let left  = diff.data1[i + diff.line];
            let right = diff.data2[i + diff.line];

            if(!left) left = '';
            if(!right) right = '';

            if(left.length  > maxLength) maxLength = left.length;
            if(right.length > maxLength) maxLength = right.length;

            if(maxLength > maxAllowed){

                maxLength = maxAllowed;

                left  = left.substr(0,  maxLength);
                right = right.substr(0, maxLength);

            }

            subjects.push([left, right]);

        }

        let fileBlankRepeat = maxLength - files.file1.length;

        if(fileBlankRepeat < 0) fileBlankRepeat = 0;

        // Mostra o nome dos arquivos acima das linhas
        console.log(files.file1.cyan + " ".repeat(fileBlankRepeat) + "      | " + files.file2.cyan);

        subjects.forEach((subject, k) => {

            let bias = 0;
            let subjectLeft = subject[0];
            let stepLine = false;

            if(equalLineNumber > -1){

                bias = equalLineNumber - modLine;

            }

            if(k >= Math.abs(begin) && bias > 0){

                stepLine = k - Math.abs(begin);

                if(k - Math.abs(begin) < bias){

                    subjectLeft = '';

                } else{

                    subjectLeft = subjects[k-bias][0];

                }

            }

            let fill = " ".repeat(maxLength - subjectLeft.length);
            let line = (diff.line + k + begin + 1);

            let lineLeft = line;
            let lineRight = line;

            if(stepLine !== false){

                if(stepLine > bias - 1){

                    lineLeft = line - bias;

                } else{

                    lineLeft = ' -';

                }

                if(modLine + end < bias && stepLine > 1){

                    lineLeft = (bias + k + begin + 1);

                    subjectLeft = diff.data1[line+1];

                    let repeatBy = maxLength - subjectLeft.length;

                    if(repeatBy < 0) repeatBy = 0;
 
                    fill = " ".repeat(repeatBy);


                }


            }

            if(lineLeft.toString().length < maxLineLength){

                lineLeft = " ".repeat(maxLineLength - lineLeft.toString().length) + lineLeft.toString();

            }

            if(lineRight.toString().length < maxLineLength){

                lineRight = " ".repeat(maxLineLength - lineRight.toString().length) + lineRight.toString();

            }

            if(lineRight == modLine + 1){

                lineRight = lineRight.toString().blue;

            } else{

                lineRight = lineRight.toString().yellow;

            }

            if(lineLeft == modLine + 1){

                lineLeft = lineLeft.toString().blue;

            } else{

                lineLeft = lineLeft.toString().yellow;

            }

            console.log(lineLeft + ' ' + Util.sintaxHighlight(subjectLeft, 'js') + " " + fill + " | " + lineRight + " " + Util.sintaxHighlight(subject[1], 'js'));

        });

        console.log("");

    },

    sintaxHighlight(txt, lang = 'js'){

        let parsed = txt;

        parsed = parsed.replace('let', 'let'.italic.blue);
        parsed = parsed.replace('const', 'const'.italic.blue);
        parsed = parsed.replace('var', 'var'.italic.blue);

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
