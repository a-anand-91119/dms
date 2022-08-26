const {MongoClient} = require('mongodb');

// const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";
const uri = "mongodb://192.168.0.127:27017";
const client = new MongoClient(uri);
let db = undefined

async function init() {
    await client.connect();
    db = client.db("dms")
}

class MongoManager {
    static async initDBConnection(callback){
        await init();
        callback();
    }

    static async filterFromCollection({collectionName, query}){
        return await db.collection(collectionName).find(query).toArray();
    }

    static addToCollection({collectionName, object, successCallback, errorCallback}){
        db.collection(collectionName).insertOne(object, (err, res) => {
            if(err) errorCallback(err);
            successCallback();
        })
    }

    static dropCollection(collectionName){
        db.collection(collectionName).drop()
    }
}

module.exports = MongoManager