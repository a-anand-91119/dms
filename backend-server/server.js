const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

const PROTO_PATH = "../protos"

const { uuid } = require("uuidv4")
const MongoManager = require("./mongo_client")
const COLLECTIONS = {
    USER: "Users",
    FOLDER: "Folders",
    DOCUMENTS: "Documents"
}

const grpcOptions = {
    keepCase: true,
    longs: String,
    enums: String,
    default: true,
    oneofs: true,
    includeDirs: [PROTO_PATH]
}


var pacakgeDefinition = protoLoader.loadSync("folder.proto", grpcOptions);
const folderProto = grpc.loadPackageDefinition(pacakgeDefinition)
pacakgeDefinition = protoLoader.loadSync("document.proto", grpcOptions);
const documentProto = grpc.loadPackageDefinition(pacakgeDefinition)
const server = new grpc.Server()

server.addService(documentProto.document.DocumentService.service, {
    GetDocument: async (call, callback) => {
        document = await MongoManager.filterFromCollection({
            collectionName: COLLECTIONS.DOCUMENTS,
            query: { documentId: call.request.documentId } // TODO: should folderId needs to be considered here???
        })
        console.log(document)
        callback(null, document[0])
    },
    CreateDocument: async (call, callback) => {
        // check whether a document with same name exists in the folder
        // if not then create the document
        document = await MongoManager.filterFromCollection({
            collectionName: COLLECTIONS.DOCUMENTS,
            query: { "$and": [{ folderId: call.request.folderId }, { fileName: call.request.fileName }] }
        })
        if (document == undefined || document.length == 0) {
            const _document = { documentId: uuid(), folderId: call.request.folderId, fileName: call.request.fileName, content: call.request.content }
            MongoManager.addToCollection({
                collectionName: COLLECTIONS.DOCUMENTS,
                object: _document,
                successCallback: () => {
                    delete _document["content"]
                    callback(undefined, _document)
                },
                errorCallback: err => callback(err, undefined)
            })
        } else {
            callback(new Error("Document with same name exists in this folder"), undefined)
        }
    },
    DeleteDocument: (call, callback) => {
        MongoManager.deleteFromColletion({
            collectionName: COLLECTIONS.DOCUMENTS,
            query: {documentId: call.request.documentId, folderId: call.request.folderId}
        })
        callback(undefined, {})
    },
    UpdateDocument: (call, callback) => {
        MongoManager.updateDocument({
            collectionName: COLLECTIONS.DOCUMENTS,
            query: {documentId: call.request.documentId},
            updateQuery: { 
                "$set": {fileName: call.request.fileName, content: call.request.content, folderId: call.request.folderId}
            },
            returnOptions: {returnDocument: "after"},
            errorCallback: err => callback(err, undefined),
            successCallback: data => callback(undefined, data.value)
        })
    }
})

server.addService(folderProto.folder.FolderService.service, {
    GetAllFolders: async (call, callback) => {
        mongoFolders = await MongoManager.filterFromCollection({
            collectionName: COLLECTIONS.FOLDER,
            query: { userId: call.request.userId },
            sort: { folderId: 1 }
        })
        callback(null, { folders: mongoFolders })
    },
    GetFolderContents: async (call, callback) => {
        // TODO: validate whether user has access to this folder
        console.log(`GetFolderContents::folderId ${call.request.folderId}`)
        mongoDocuments = await MongoManager.filterFromCollection({
            collectionName: COLLECTIONS.DOCUMENTS,
            query: { folderId: call.request.folderId }
        })
        mongoDocuments.forEach(doc => delete doc["content"])
        callback(null, { documents: mongoDocuments })
    },
    CreateFolder: async (call, callback) => {
        console.log(`CreateFolder::folderName ${call.request.folderName}`)
        existngFolders = await MongoManager.filterFromCollection({
            collectionName: COLLECTIONS.FOLDER,
            query: { folderName: call.request.folderName }
        })
        if (existngFolders == undefined || existngFolders.length == 0) {
            const _folder = { folderId: uuid(), userId: call.request.userId, folderName: call.request.folderName }
            MongoManager.addToCollection({
                collectionName: COLLECTIONS.FOLDER,
                object: _folder,
                successCallback: () => callback(null, _folder),
                errorCallback: err => callback(err, undefined)
            })
        } else {
            callback(new Error("Folder with name already exists"), undefined)
        }
    },
    DeleteFolder: (call, callback) => {
        MongoManager.deleteMultipleFromCollection({
            collectionName: COLLECTIONS.DOCUMENTS,
            query: {folderId: call.request.folderId},
            errorCallback: err => callback(err, undefined),
            successCallback: () => {
                MongoManager.deleteFromColletion({
                    collectionName: COLLECTIONS.FOLDER,
                    query: {folderId: call.request.folderId}
                })
                callback(undefined, {})
            }
        })
    },
    UpdateFolder: (call, callback) =>{
        MongoManager.updateDocument({
            collectionName: COLLECTIONS.FOLDER,
            query: {folderId: call.request.folderId},
            updateQuery: { "$set": {folderName: call.request.folderName}},
            returnOptions: {returnDocument: "after"},
            errorCallback: err => callback(err, undefined),
            successCallback: data => callback(undefined, data.value)
        })
    }
})

server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
        console.log(`Server running at http://0.0.0.0:${port}`)
        server.start()
    }
)


const prepareDummyData = () => {
    if (process.env.BACKEND_SERVER_INIT_DATA == "true") {
        // storing plain text password xD
        MongoManager.dropCollection(COLLECTIONS.DOCUMENTS)
        MongoManager.dropCollection(COLLECTIONS.FOLDER)
        MongoManager.dropCollection(COLLECTIONS.USER)

        const userId1 = uuid()
        const userId2 = uuid()
        const user1Folder1 = uuid()
        const user1RootFolder = "00000" + uuid()
        // creating users
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.USER,
            object: { userId: userId1, userName: "user1", password: "password" },
            successCallback: () => console.log("Inserted user1"),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.USER,
            object: { userId: userId2, userName: "user2", password: "password" },
            successCallback: () => console.log("Inserted user2"),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.FOLDER,
            object: { userId: userId1, folderId: user1Folder1, folderName: "MyFolder1" },
            successCallback: () => console.log(`Created folder for user ${userId1} with name MyFolder1`),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.FOLDER,
            object: { userId: userId1, folderId: user1RootFolder, folderName: "/" },
            successCallback: () => console.log(`Created folder for user ${userId1} with name /`),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.FOLDER,
            object: { userId: userId1, folderId: uuid(), folderName: "MyFolder2" },
            successCallback: () => console.log(`Created folder for user ${userId1} with name MyFolder2`),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.FOLDER,
            object: { userId: userId2, folderId: uuid(), folderName: "MyFolder1" },
            successCallback: () => console.log(`Created folder for user ${userId2} with name MyFolder1`),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.FOLDER,
            object: { userId: userId2, folderId: "00000" + uuid(), folderName: "/" },
            successCallback: () => console.log(`Created folder for user ${userId2} with name /`),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.DOCUMENTS,
            object: { documentId: uuid(), folderId: user1Folder1, fileName: "abc.txt", content: "ABC CONTENT" },
            successCallback: () => console.log(`Created document for user ${userId1} and folder MyFolder1 with name abc.txt`),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.DOCUMENTS,
            object: { documentId: uuid(), folderId: user1Folder1, fileName: "xyz.txt", content: "XYZ CONTENT" },
            successCallback: () => console.log(`Created document for user ${userId1} and folder MyFolder1 with name abc.txt`),
            errorCallback: err => console.error(err)
        })
        MongoManager.addToCollection({
            collectionName: COLLECTIONS.DOCUMENTS,
            object: { documentId: uuid(), folderId: user1RootFolder, fileName: "root.txt", content: "FILE IN ROOT" },
            successCallback: () => console.log(`Created document for user ${userId1} and folder / with name root.txt`),
            errorCallback: err => console.error(err)
        })
    }
}

MongoManager.initDBConnection(prepareDummyData)