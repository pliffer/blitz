const request = require('request');

module.exports = class {

    constructor(jwt){

        this.setJWT(jwt);

    }

    setJWT(jwt){

        if(typeof jwt === 'undefined') return console.error('JWT needed');

        let that = this;

        this.jwt = jwt;

        this.host = 'astr.me';

        this.toObject = (string) => {

            try{

                let obj = JSON.parse(string);
                return obj;

            } catch(e){

                throw e;

            }

        }

        this.tree = () => {

            return new Promise((resolve, reject) => {

                request.get({

                    url: `https://${that.host}/api/lunastro/tree`,

                    headers:{
                        'Authorization': `Bearer ${that.jwt}`,
                    }

                }, (err, body, res) => {

                    if(err) return reject(err);

                    resolve(that.toObject(res).message);

                });

            });

        }

        this.createChild = (itemId, data) => {

            // Se tiver enviado um item ao invés do id, pegamos o id deste item
            if(itemId.id) itemId = itemId.id;

            data.action = 'create_child';

            return new Promise((resolve, reject) => {

                request.post({

                    url: `https://${that.host}/api/lunastro`,
                    json: {

                        jwt: that.jwt,
                        fatherItem: itemId,
                        data: data,

                    }

                }, (err, body, res) => {

                    if(err) return reject(err);

                    resolve(res);

                });

            });

        }

        return that;

    }

}

