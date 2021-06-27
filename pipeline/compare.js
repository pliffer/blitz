let Util = require('../util.js');

require('colors');

module.exports = {

    setup(program){

        program.option('-co, --compare [paths...]', 'Compare two dirs');
        program.option('--kugel', 'Is kugel enabled');

        return module.exports;

    },

    compare(dirs){

        Util.lineLog('Comparando pastas: ' + dirs.join(', '));

        let files = {}

        let runPromise = [];

        dirs.forEach((dir, k) => {

            runPromise.push(Util.forEachEntry(dir, (entry, content) => {

                Util.lineLog('Analisando arquivo: ' + entry);

                let cleanEntry = entry.replace(dir, '');

                if(typeof files[cleanEntry] == 'undefined'){

                    files[cleanEntry] = [];

                }

                files[cleanEntry].push({
                    dir: dir,
                    entry: entry,
                    content: content
                });

            }));

        });

        return Promise.all(runPromise).then(async () => {

            let equal    = [];
            let diff     = [];
            let notFound = [];

            for(filename in files){

                let file = files[filename];

                if(file.length > 1){

                    let result = await Util.fileDiff(file[0].entry, file[1].entry);

                    if(!result.length){

                        equal.push(filename);

                    } else{

                        result.filename = filename;

                        diff.push(result);

                    }

                } else{

                    notFound.push([file[0].dir, filename]);

                }

            }

            return {
                equal: equal,
                diff: diff,
                notFound: notFound,
                files: files
            }

        });

    },

    run(dirs, opts){

        return module.exports.compare(dirs).then((res) => {

            console.log("");

            res.diff.forEach(diff => {

                if(opts.kugel){

                    if(~diff.filename.indexOf('.logs/')) return;
                    if(~diff.filename.indexOf('.pem/')) return;
                    if(~diff.filename.indexOf('LICENSE.md')) return;
                    if(~diff.filename.indexOf('package.json')) return;
                    if(~diff.filename.indexOf('package-lock.json')) return;
                    if(~diff.filename.indexOf('sftp-config.json')) return;
                    if(~diff.filename.indexOf('.env')) return;

                }

                console.log('Linha: ' + diff[0].line.toString().yellow, diff.filename.magenta);

            });

            res.notFound.forEach(notFound => {

                if(opts.kugel){

                    if(~notFound[1].indexOf('/app/routes/')) return;
                    if(~notFound[1].indexOf('/app/models/')) return;
                    if(~notFound[1].indexOf('/app/controllers/')) return;
                    if(~notFound[1].indexOf('/app/views/')) return;
                    if(~notFound[1].indexOf('/app/storage/')) return;
                    if(~notFound[1].indexOf('/app/assets/')) return;
                    if(~notFound[1].indexOf('/app/helpers/')) return;
                    if(~notFound[1].indexOf('/modules/')) return;
                    if(~notFound[1].indexOf('/doc/')) return;
                    if(~notFound[1].indexOf('/.logs/')) return;

                }

                console.log(notFound[0].green, '-> Arquivo Único: ', notFound[1].red);

            });

        });

    }

}