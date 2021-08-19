const inquirer = require('inquirer');
const path     = require('path');
const fs       = require('fs-extra');
const Astr     = require('astr-api');

let Util = require('../util.js');

module.exports = {

    cached: null,

    setup(program){

        program.option('-u, --update', 'Update blitz infos');
        program.option('--cached', 'Update blitz infos by cache');
        program.option('--send-only', 'Force of send blitz infos to origin');

        return module.exports;

    },

    byCache(){

        return Util.listCached('update').then(updates => {

            updates.forEach(update => {

                Util.getCache('update', update).then(item => {

                    let fakeAstr = {

                        tree(){

                            return Promise.resolve(item);

                        }

                    }

                    module.exports.storeInfo(fakeAstr, false).then(() => {

                        console.log(`@info Local data sucessfully updated by ${update.split('_storeInfo')[0]}`.green);

                    });

                });

            });

        });

    },

    sendOnly(){

        return Util.listCached('setup-blitz').then(cachedLogins => {

            let updatePromise = [];

            cachedLogins.forEach(loginName => {

                updatePromise.push(Util.getCache('setup-blitz', loginName).then(login => {

                    let astr = new Astr(login.jwt);

                    astr.host = login.host;

                    return module.exports.sendInfo(astr);

                }));

            });

        });


    },

    run(commands, props){

        let sendOnly = props.sendOnly;

        if(props.sendOnly){

            module.exports.sendOnly();

        }

        if(props.cached){

            if(!props.sendOnly) console.log("@info blitz --update --cached does not send to remote without --send-only");

            return module.exports.byCache();

        }

        if(sendOnly) return;

        return Util.listCached('setup-blitz').then(data => {

            if(!data.length) return global.pipeline.setupBlitz.run();

        }).catch(e => {

            return global.pipeline.setupBlitz.run();

        }).then(() => {

            return Util.listCached('setup-blitz');

        }).then(cachedLogins => {

            let updatePromise = [];

            cachedLogins.forEach(loginName => {

                updatePromise.push(Util.getCache('setup-blitz', loginName).then(login => {

                    let astr = new Astr(login.jwt);

                    astr.host = login.host;

                    return module.exports.storeInfo(astr).then(() => {

                        return module.exports.sendInfo(astr);

                    });

                }));

            });

            return Promise.all(updatePromise).then(() => {

                console.log("@info Blitz is updated".green);

            });

        });

    },

    sendInfo(astr){

        console.log("@todo Comparar com o cached");

        astr.tree().then(fatherItem => {

            let cachedPromise = [];

            fatherItem.child.forEach(child => {

                cachedPromise.push(Util.listCached(child.label).then(cachedItems => {

                    let cachedItemsPromise = [];

                    cachedItems.forEach(cachedItem => {

                        cachedItemsPromise.push(Util.getCache(child.label, cachedItem).then(cachedItemData => {

                            return astr.createChild({
                                fatherId: child.id,
                                label: cachedItem,
                                description: cachedItemData
                            });

                        }));

                    });

                    return Promise.all(cachedItemsPromise).then(() => {

                        console.log(`@info ${child.label} sent`);

                    });

                }));

            });

            return Promise.all(cachedPromise);

        });

        // Pegar dados do cache deste computador e comparar com os resultados puxados

    },

    storeInfo(astr, cache = true){

        return astr.tree().then(fatherItem => {

            if(cache) Util.setCache('update', astr.host + '_storeInfo', fatherItem);

            module.exports.cached = fatherItem;

            if(!fatherItem.child || fatherItem.child.length == 0){

                return console.log(`@info Cadastre algum card no item do ${astr.host}`)

            }

            fatherItem.child.forEach(item => {

                if(item.label == 'repolist'){

                    item.description.split('\n').forEach(repo => {

                        let repoSplit = repo.split(': ');

                        if(repoSplit.length > 0) return;

                        Util.setCache('repolist', repoSplit[0], repoSplit[1]);

                    });

                }

            });

        });

    }

}