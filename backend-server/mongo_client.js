const { MongoClient } = require('mongodb');

// const uri = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
const uri = `mongodb://192.168.0.127:27017`;
const client = new MongoClient(uri);

class MongoManager {

    db=undefined

    constructor(){
        this.initDBConnection()
    }

    async initDBConnection() {
        if(this.db == undefined){
            await client.connect();
            this.db = client.db("dms")
            console.log(" * Established connection to mongo")
        }
    }

    async filterFromCollection({ collectionName, query, sort = {} }) {
        return await this.db.collection(collectionName).find(query).sort(sort).toArray();
    }

    addToCollection({ collectionName, object, successCallback, errorCallback }) {
        this.db.collection(collectionName).insertOne(object, (err, res) => {
            if (err) errorCallback(err);
            successCallback();
        })
    }

    deleteMultipleFromCollection({ collectionName, query, successCallback, errorCallback }) {
        this.db.collection(collectionName).deleteMany(query, (err, res) => {
            if (err) errorCallback(err);
            successCallback();
        });
    }

    updateDocument({ collectionName, query, updateQuery, returnOptions, successCallback, errorCallback }) {
        this.db.collection(collectionName).findOneAndUpdate(query, updateQuery, returnOptions, (err, res) => {
            if (err) errorCallback(err);
            successCallback(res);
        });
    }

    deleteFromColletion({ collectionName, query }) {
        this.db.collection(collectionName).deleteOne(query)
    }

    async dropCollection(collectionName) {
        await this.db.collection(collectionName).drop((err, dropOK) => {
            if (err) {
                console.error("There is an error::", err);
            }
            if (dropOK) console.log("Collection deleted");
        })
    }
}

module.exports = new MongoManager()