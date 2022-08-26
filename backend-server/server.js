const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

const PROTO_PATH = "../protos"
const ROOT_FOLDER = ""
const TYPE = {
    FOLDER: "1",
    FILE: "2"
}
const { uuid } = require("uuidv4")

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
var folderId = 1
let folders = {
    items: [
        { id: folderId, userId: "1", name: "data", type: TYPE.FOLDER},
        { id: uuid(), userId: "1", name: "abc.txt", type: TYPE.FILE, content: "ABC", folder: ROOT_FOLDER },
        { id: uuid(), userId: "1", name: "xyz.txt", type: TYPE.FILE, content: "XYZ", folder: folderId },
    ]
}

server.addService(folderProto.folder.FolderService.service, {
    GetAllFolders: (call, callback) => {
        // 0 length folder means files without any folder
        // TODO: remove file content from these reponse
        items = folders.items
            .filter(item => item.userId == call.request.userId)
            .filter(item => item.type == TYPE.FOLDER || item.folder == ROOT_FOLDER)
        callback(null, {items: items})
    },
    GetFolderContents: (call, callback) => {
        // TODO: remove file content from these reponse
        items = folders.items
            .filter(item => item.userId == call.request.userId && item.folder == call.request.itemId)
        callback(null, {items: items})
    },
    CreateFolder: (call, callback) => {
        // TODO: do duplicate name checks
        const _folder = { id: uuid(), userId: call.request.userId, name: call.request.folderName, type: TYPE.FOLDER}
        folders.items.push(_folder)
        callback(null, _folder)
    }
    // TODO: implement delete and update folder methods
})

server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
        console.log(`Server running at http://0.0.0.0:${port}`)
        server.start()
    }
)