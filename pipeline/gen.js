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

                    let responses = routes[route][originalMethod].responses;

                    let jwt = false;

                    let method = originalMethod;

                    if(originalMethod.substr(0, 4) === 'jwt.'){
                        jwt = true;
                        method = originalMethod.substr(4);
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

                            // content += `                '${code}':\n`
                            // content += `                    description: ${responses[code].description}\n`
                            // content += `                    content:\n`
                            // content += `                        application/json:\n`
                            // content += `                            schema:\n`
                            // content += `                                type: object\n`
                            // // content += `                                required: "object"\n`
                            // content += `                                properties:\n`

                            for(property in responses[code].properties){

                                content += `                   ${property}:\n`
                                content += `                     type: ${responses[code].properties[property].type}\n`

                            }

                        }

                        if(validate[route] && validate[route][method]){

                            for(prop in validate[route][method]){

                                let parameter = validate[route][method][prop];

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

                                    content += `        requestBody:\n`

                                    // @todo Verificar casos em que não precisa ser true
                                    content += `          required: true\n`
                                    content += `          content:\n`
                                    content += `            application/json:\n`
                                    content += `              schema:\n`
                                    content += `                type: object\n`

                                    content += `                required:\n`
                                    for(prop in validate[route][method]){

                                        let parameter = validate[route][method][prop];

                                        if(parameter.required){

                                            content += `                - ${prop}\n`

                                        }

                                    }

                                    content += `                properties:\n`

                                    for(prop in validate[route][method]){

                                        let parameter = validate[route][method][prop];

                                        content += `                  ${prop}:\n`

                                        if(parameter.type){

                                            content += `                    type: ${parameter.type}\n`

                                        }

                                    }

                                break;
                                default:
                                break;
                            }

                        }

                    }

                    // content += `            parameters:\n`

                }

            });

        // 200: {

        //     description: 'Retorna um JWT',

        //     properties: {

        //         success: {
        //             type: 'bool'
        //         },

        //         message: {
        //             type: 'array'
        //         },

        //         unixtime: {
        //             type: 'int32'
        //         }

        //     }

        // }

    // Tag:
    //   type: object
    //   properties:
    //     id:
    //       type: integer
    //       format: int64
    //     name:
    //       type: string


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