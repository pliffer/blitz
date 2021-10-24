let path = require('path');
let fs   = require('fs-extra');

let Util = require('../util.js');

module.exports = {

    setup(program){

        program.option('--create <name>', 'Create a project');
        program.option('--base [prestashop1.7, electron, magento, kugel]', 'Select a base between prestashop, electron, wordpress, kugel, magento');
        program.option('--irrigate', 'Put the files on this folder');

        return module.exports;

    },

    irrigate(projName, opts){

        let cwd = path.join(process.cwd(), projName);

        switch(opts.base){

            case 'wordpress':
                    
                fs.ensureDirSync(projName);

                // @todo Criar as instalações dentro de install/ pois assim será apagado durante o término
                // da instalação, garantindo segurança(pois os arquivos gerados podem ser sensíveis)

                return Util.inheritSpawn(['wget', 'https://br.wordpress.org/latest-pt_BR.zip', '-nc']).then(() => {

                    return Util.inheritSpawn(['unzip', 'latest-pt_BR.zip', '-d', 'latest-pt_BR-wp']);

                }).then(() => {

                    // return Util.inheritSpawn(['unzip', 'latest-pt_BR-wp/prestashop.zip', '-d', cwd]);

                }).then(() => {

                    // return Util.inheritSpawn(['rm', '-r', 'prestashop_1.7.7.5']);
                    
                }).then(() => {

                    // return Util.inheritSpawn(['mkdir', projName + '/blitz']);

                });

            break;
            case 'prestashop1.7':

                fs.ensureDirSync(projName);

                // @todo Criar as instalações dentro de install/ pois assim será apagado durante o término
                // da instalação, garantindo segurança(pois os arquivos gerados podem ser sensíveis)

                return Util.inheritSpawn(['wget', 'https://download.prestashop.com/download/releases/prestashop_1.7.7.5.zip', '-nc']).then(() => {

                    return Util.inheritSpawn(['unzip', 'prestashop_1.7.7.5.zip', '-d', 'prestashop_1.7.7.5']);

                }).then(() => {

                    return Util.inheritSpawn(['unzip', 'prestashop_1.7.7.5/prestashop.zip', '-d', cwd]);

                }).then(() => {

                    return Util.inheritSpawn(['rm', '-r', 'prestashop_1.7.7.5']);
                    
                }).then(() => {

                    return Util.inheritSpawn(['mkdir', projName + '/blitz']);
                }).then(() => {

                    // @todo Isso aqui tem que rodar ao término
                    // php index_cli.php --step all --language pt --timezone America/Sao_Paulo --domain pontosala.com.br --db_server do2.pliffer.com.br --db_user pontosala --db_password pontosalauou --db_name pontosala --name PontoSala --country br --firstname coligare --lastname pliffer --password Tr33s --email suporte@coligare.com.br --ssl 1

                    console.log('');
                    console.log('@info Preparação finalizada');
                    console.log('@info Certifique-se de possuir as extensões PHP ativas: ' + "php-gd php-mbstring php-mysql php-curl php-xml php-cli php-intl php-zip".green);
                    console.log('@info Gerando instruções em ' + projName.green +  "/blitz/help.md".green);

                    let helpData = `
## Instalação de prestashop 1.7 através de blitz

1. Certifique-se de possuir as extensões PHP ativas: php-gd php-mbstring php-mysql php-curl php-xml php-cli php-intl php-zip

2. Edite o arquivo ${projName}/blitz/blitz.install.environment.json com as informações necessárias

3. Rode o comando 'blitz' dentro da pasta ${projName} ou ${projName}/blitz

4. Dê permissões as pastas:
sudo chown -R <user>:www-data <path> 
sudo chmod g+w -R <path> 

X. (Opcional) Gere o virtual host usando 'blitz generate vh'
X. (Opcional) 'sudo certbot certonly -d <dominio>' # para gerar o certificado HTTPS

`;

                    console.log(helpData);

                    return fs.writeFile(path.join(cwd, 'blitz', 'help.md'), helpData, 'utf-8');

                }).then(() => {

                    let installEnvironmentJson = {
                        language: "pt",
                        timezone: "America/Noronha",
                        domain: "<dominio>",
                        db_server: "<mysql_host>",
                        db_user: "<mysql_user>",
                        db_password: "<mysql_pass>",
                        db_name: "<mysql_db>",
                        name: projName,
                        country: "br",
                        firstname: "<admin_firstname>",
                        lastname: "<admin_lastname>",
                        password: "<admin_password>",
                        email: "<admin_mail>",
                        ssl: 1,
                        platform: "prestashop1.7"
                    };

                    return fs.writeFile(path.join(cwd, 'blitz', 'blitz.install.environment.json'), JSON.stringify(installEnvironmentJson, null, 4), 'utf-8');

                }).then(() => {

                    return Util.inheritSpawn(['rm', 'prestashop_1.7.7.5.zip']);

                });

            break;

            case 'electron':

                fs.ensureDirSync(projName);

                global.pipeline.install.run('kugel', {
                    run: false,
                    finalName: projName
                }).then(() => {

                    return Util.run('npm install electron@13.1.7', data => {

                        console.log('npm install electron', data);

                    }, {
                        cwd: cwd
                    }).then(() => {

                        return module.exports.linkElectronProperties(projName);

                    }).then(() => {

                        return Util.run('npm init -y', data => {}, {
                            cwd: cwd
                        });

                    }).then(() => {

                        return Util.run('npm start', data => {}, {
                            cwd: cwd
                        });

                    });

                });

                console.log('add npm start to package.json');
                console.log('run npm start');

            break;
            default:

                console.log(`@err Option ${opts.base} not registred`);

            break;

        }

    },

    linkElectronProperties(proj){

        let obj = {
            scripts: {
                start: 'electron .'
            }
        };

        let packagePath = path.join(process.cwd(), proj, 'package.json');

        let package = fs.readJsonSync(packagePath);

        package.kugel.modules.start.push('kugel-electron');

        for(prop in obj){

            package[prop] = obj[prop];

        }

        fs.writeJsonSync(packagePath, package);

        console.log(`@info Script writed on ${packagePath}`)

    },

    run(projName, opts){

        if(fs.existsSync(projName) && !opts.irrigate) return console.log(`@err ${projName} folder already exists`);

        console.log(`@info Creating ${projName}`);

        module.exports.irrigate(projName, opts);

    }

}