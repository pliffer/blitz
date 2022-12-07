let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    columns: 80,

    setup(program){

        if(process.stdout.columns) module.exports.columns = process.stdout.columns;

        program.option('-co, --compare [paths...]', 'Compare two dirs');
        program.option('--kugel', 'Is kugel enabled');

        return module.exports;

    },

    compare(dirs){

        console.log('Comparando pastas: ' + dirs.join(', '));

        let files = {}

        let runPromise = [];

        dirs.forEach((dir, k) => {

            runPromise.push(Util.forEachEntry(dir, (entry, content) => {

                Util.lineLog('Analisando arquivo: ' + entry);

                // Remove alguns caracteres que impedem o comparativo
                let dirStd = dir.replace('.\\', '');

                let cleanEntry = entry.replace(dirStd, '');

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

        return module.exports.compare(dirs).then(async (res) => {

            if(fs.existsSync(path.join(dirs[0], 'package.json')) && fs.existsSync(path.join(dirs[1], 'package.json'))){

                let package1 = await fs.readJson(path.join(dirs[0], 'package.json'));
                let package2 = await fs.readJson(path.join(dirs[1], 'package.json'));

                console.log("\n\n");

                for(prop in package1.dependencies){

                    if(!package2.dependencies[prop]){

                        console.log(`${dirs[1]} não tem a dependencia ${prop}`);
                        continue;

                    }

                    if(package1.dependencies[prop] != package2.dependencies[prop]){

                        console.log(`${prop.red} na versão ${package2.dependencies[prop]} em ${dirs[1]} e ${package1.dependencies[prop]} em ${dirs[0]}`);

                    }

                }

                for(prop in package2.dependencies){

                    if(!package1.dependencies[prop]){

                        console.log(`${dirs[0]} não tem a dependencia ${prop}`);

                    }

                }

            }

            console.log("");

            let iteration = 0;

            res.diff.forEach(diff => {

                if(opts.kugel){

                    if(~diff.filename.indexOf('.logs/')) return;
                    if(~diff.filename.indexOf('.pem/')) return;
                    if(~diff.filename.indexOf('LICENSE.md')) return;
                    if(~diff.filename.indexOf('README.md')) return;
                    if(~diff.filename.indexOf('package.json')) return;
                    if(~diff.filename.indexOf('package-lock.json')) return;
                    if(~diff.filename.indexOf('sftp-config.json')) return;
                    if(~diff.filename.indexOf('.env')) return;

                }

                console.log('Arquivo ' + (++iteration) + ' ' + diff.filename.magenta + ':' + (diff[0].line+1).toString().yellow);

                Util.showDiff({
                    file1: dirs[0] + diff.filename,
                    file2: dirs[1] + diff.filename
                }, diff[0], module.exports.columns);

            });

            res.notFound.forEach(notFound => {

                console.log(notFound)

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
                    if(~notFound[1].indexOf('/.env/')) return;
                    if(~notFound[1].indexOf('/sftp-config.json/')) return;
                    if(~notFound[1].indexOf('/LICENSE.md/')) return;
                    if(~notFound[1].indexOf('/README.md/')) return;
                    if(~notFound[1].indexOf('/.pem/')) return;


                }

                console.log(notFound[0].green, '-> Arquivo Único: ', notFound[1].red);

            });

        });

    }

}