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

    static async filterFromCollection({collectionName, query, sort={}}){
        return await db.collection(collectionName).find(query).sort(sort).toArray();
    }

    static addToCollection({collectionName, object, successCallback, errorCallback}){
        db.collection(collectionName).insertOne(object, (err, res) => {
            if(err) errorCallback(err);
            successCallback();
        })
    }

    static deleteMultipleFromCollection({collectionName, query, successCallback, errorCallback}){
        db.collection(collectionName).deleteMany(query, (err, res) => {
            if(err) errorCallback(err);
            successCallback();
        });
    }

    static updateDocument({collectionName, query, updateQuery, returnOptions, successCallback, errorCallback}){
        db.collection(collectionName).findOneAndUpdate(query, updateQuery, returnOptions, (err, res) => {
            if(err) errorCallback(err);
            successCallback(res);
        });
    }

    static deleteFromColletion({collectionName, query}){
        db.collection(collectionName).deleteOne(query)
    }

    static dropCollection(collectionName){
        db.collection(collectionName).drop()
    }
}

module.exports = MongoManager