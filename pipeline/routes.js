let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--routes', 'Explain this kugel routes structure');

        return module.exports;

    },

    fakeRouter: {

    },

    run(dirs, opts){

        console.log("@todo Exibir aqui os testes cube que ainda faltam existir (exibri quantos há)")

        let routesFolder = path.join(process.cwd(), 'app', 'routes');

        if(!fs.existsSync(routesFolder)){

            return console.log(`@err It is necessary to have app/routes`);

        }

        let apiTestsAvailable = {};

        let apiTests = path.join(process.cwd(), 'doc', 'tests', 'api');

        if(fs.existsSync(apiTests)){

            fs.readdirSync(apiTests).forEach(apiTest => {

                let apiTestsFiles = fs.readdirSync(path.join(apiTests, apiTest));

                apiTestsFiles.forEach(testFile => {

                    if(testFile == 'preload.js') return;
                    if(testFile.indexOf('.js') == -1) return;

                    let fileName = path.join(apiTests, apiTest, testFile);

                    let requiredTestFile = require(fileName);

                    let test = requiredTestFile.test;

                    if(!test && requiredTestFile.url){

                        test = requiredTestFile;

                    }

                    if(test){

                        if(!apiTestsAvailable[test.url]){

                            apiTestsAvailable[test.url] = {};

                        }

                        apiTestsAvailable[test.url][test.method] = requiredTestFile;

                    }

                });

            });

        }

        let routes = fs.readdirSync(routesFolder);

        let testsFound    = 0;
        let testsNotFound = 0;

        routes.forEach(route => {

            let routeFile = path.join(routesFolder, route);

            let content = fs.readFileSync(routeFile, 'utf-8');

            let maxNumber = 15;

            content.split("\n").forEach(line => {

                let match = line.match(/router\.((jwt\.post|jwt\.get|jwt\.put|jwt\.delete|get|post|put|delete))\((`|"|')(.+?)(`|"|'),/);

                if(match){

                    let type = match[1];

                    let prefix = " ".repeat(maxNumber - type.length);

                    line = prefix + line.trim().replace(type, type.yellow);

                    let url = match[4];

                    if(apiTestsAvailable[url] && apiTestsAvailable[url][type]){

                        testsFound++;
                        delete apiTestsAvailable[url][type];

                        line = line.replace(url, url.green);

                    } else{

                        testsNotFound++;
                        line = line.replace(url, url.red);

                    }

                    console.log(line);

                }

            });

        });

        console.log(`@info ${testsFound} testes foram encontrados`.green);

        if(testsNotFound){

            console.log(`@info ${testsNotFound} testes devem ser criados`.red);

        }

        for(test in apiTestsAvailable){

            for(method in apiTestsAvailable[test]){
            
                console.log(`@info Rota indefinida [${method}]${test}`.yellow);

            }

        }

    }

}