const path = require('path');
const fs   = require('fs-extra');

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

    ignorableExt: ['.log', '.pdf', '.xlsx', '.xls', '.ods', '.png', '.jpg', '.jpeg', '.bmp', '.mp3', '.ogg'],

    forEachEntry(entriesPath, callback){

        return new Promise((resolve, reject) => {

            fs.readdirSync(entriesPath).forEach(entry => {

                let entryPath = path.join(entriesPath, entry);

                if(/node_modules/.test(entryPath)) return;
                if(/platforms\/android/.test(entryPath)) return;
                if(/\.git/.test(entryPath)) return;
                if(/plugins\/cordova/.test(entryPath)) return;

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
                    
                    callback(entryPath, fs.readFileSync(entryPath, 'utf-8'));

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

	}

}

module.exports = Util;