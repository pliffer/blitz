const path = require('path');
const fs   = require('fs-extra');
const cp   = require('child_process');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--gen <project>', 'Generate files');

        return module.exports;

    },

    types: {

        async openapi(){

            let validateFolder = path.join(process.cwd(), 'modules', 'validate', 'validate.cache.json');

            if(!fs.existsSync(validateFolder)){

                return console.log(`@err It is necessary to have modules/validate/validate.cache.json`);

            }

            let validate = JSON.parse(await fs.readJsonSync(validateFolder));
            let routes   = await global.pipeline.routes.list();

            let env = Util.getEnv();

            // Util.log('Preencha as seguintes informações:')

            let apiDescription = env.API_DESCRIPTION || await Util.ask('Descrição da api? (env.API_DESCRIPTION)');

            let content = `openapi: 3.0.0
info:
    title: ${env.APP_NAME}
    description: ${apiDescription}
    version: '${env.API_VERSION}'
`;

            content += `
servers:
    - url: ${env.PRODUCTION_URL}
      description: ${env.PRODUCTION_URL_DESCRIPTION}
`;

            content += `paths:\n`;

            Object.keys(routes).sort().forEach(route => {

                content += `    ${route}:\n`;

                for(originalMethod in routes[route]){

                    let jwt = false;

                    let method = originalMethod.replace('jwt.', '');

                    // let responses = routes[route][originalMethod].responses;
                    let responses = {};

                    if(validate[route] && validate[route][method] && validate[route][method].output){

                        responses = validate[route][method].output;

                    }

                    let summary = '' || routes[route][originalMethod].summary || routes[route][originalMethod].description;

                    if(responses){

                        content += `      ${method}:\n`

                        if(summary){

                            content += `        summary: ${summary}\n`

                        }

                        content += `        responses:\n`;

                        for(code in responses){

                            content += `          '${code}':\n`
                            content += `            description: ${responses[code].description}\n`
                            content += `            content:\n`
                            content += `             application/json:\n`
                            content += `               schema:\n`
                            content += `                 type: object\n`
                            content += `                 properties:\n`

                            for(property in responses[code].properties){

                                content += `                   ${property}:\n`
                                content += `                     type: ${responses[code].properties[property].type}\n`

                            }

                        }

                        if(validate[route] && validate[route][method] && validate[route][method].input){

                            for(prop in validate[route][method].input){

                                let parameter = validate[route][method].input[prop];

                                switch(method){
                                    case 'get':

                                        content += `        parameters:\n`

                                        content += `              - name: '${prop}'\n`

                                        content += `                in: 'query'\n`

                                        if(parameter.required){

                                            content += `                required: ${parameter.required}\n`

                                        }

                                        if(parameter.type){

                                            content += `                schema:\n`
                                            content += `                  type: ${parameter.type}\n`

                                        }

                                    break;
                                    case 'post':
                                    break;
                                    default:

                                        // Nothing

                                    break;
                                }

                            }

                            switch(method){
                                case 'post':

                                    if(Object.keys(validate[route][method].input).length){

                                        content += `        requestBody:\n`

                                        // @todo Verificar casos em que não precisa ser true
                                        content += `          required: true\n`
                                        content += `          content:\n`
                                        content += `            application/json:\n`
                                        content += `              schema:\n`
                                        content += `                type: object\n`

                                        content += `                required:\n`

                                        for(prop in validate[route][method].input){

                                            let parameter = validate[route][method].input[prop];

                                            if(parameter.required){

                                                content += `                - ${prop}\n`

                                            }

                                        }

                                        content += `                properties:\n`

                                        for(prop in validate[route][method].input){

                                            let parameter = validate[route][method].input[prop];

                                            content += `                  ${prop}:\n`

                                            if(parameter.type){

                                                content += `                    type: ${parameter.type}\n`

                                                if(parameter.type == 'array'){

                                                    console.log(route, parameter);

                                                    content += `                    items:\n`
                                                    content += `                      type: ${parameter.itemsType}\n`

                                                }

                                            }

                                        }

                                    }

                                break;
                                default:
                                break;
                            }

                        }

                    }

                }

            });

            console.log(content);

        }

    },

    run(opt){

        if(typeof module.exports.types[opt] !== 'undefined'){

            module.exports.types[opt]();

        } else{

            console.log('@error Gen type undefined')

        }

    }

}