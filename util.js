const dotenv = require('dotenv');
const path   = require('path');
const fs     = require('fs-extra');
const cp     = require('child_process');

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
                        part2: part2Err
                    });

                }

            }

            return resolve(result);

        });

    },
    
    lineLog(msg){

        process.stdout.write(`\r${msg}`);

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

            let filepath = path.join(cacheDir, filename + '.json');

            return fs.writeJson(filepath, object);

        }).catch(e => {

            console.log(`@err ${e.toString()}`);

            throw e;

        });

    },

    getCache(folder, file){

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

    getEnv(){

        let envPath = path.join(process.cwd(), '.env');

        if(!fs.existsSync(envPath)){

            console.log(`@err There's no .env on this folder to be parsed`)

            return false;

        }

        let envBuffer = fs.readFileSync(envPath);

        return dotenv.parse(envBuffer);

    },

    inheritSpawn(args, callback = () => {}){

        return new Promise((resolve, reject) => {

            let spawn = cp.spawn(args.shift(), args, {
                stdio: ['inherit', 'inherit', 'inherit']
            });

            callback(spawn);

            spawn.on('exit', resolve);
            spawn.on('error', reject);

        });

    },

    spawn(args, dataCallback = () => {}){

        return new Promise((resolve, reject) => {

            let spawn = cp.spawn(args.shift(), args);

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