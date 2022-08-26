const grpc = require("@grpc/grpc-js")
const { stringToSubchannelAddress } = require("@grpc/grpc-js/build/src/subchannel-address")
const protoLoader = require("@grpc/proto-loader")

const PROTO_PATH = "../protos"
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

const server = new grpc.Server()
var folderId = uuid();
let folders = {
    items: [
        { id: folderId, userId: "1", name: "data", type: "1"},
        { id: uuid(), userId: "1", name: "abc.txt", type: "2", content: "ABC", folder: "" },
        { id: uuid(), userId: "1", name: "xyz.txt", type: "2", content: "XYZ", folder: folderId },
    ]
}

server.addService(folderProto.folder.FolderService.service, {
    GetAllFolders: (call, callback) => {
        // 0 length folder means files without any folder
        items = folders.items.filter(item => item.type == folderProto.item.ItemType.FOLDER || item.folder.length() == 0)
        callback(null, {items: items})
    },
    GetFolderContents: (call, callback) => {
        items = folders.items.filter(item => item.folder == call.request.itemId)
        callback(null, {items: items})
    },
    CreateFolder: (call, callback) => {
        const _folder = { id: uuid(), userId: call.request.userId, name: call.request.folderName, type: folderProto.item.ItemType.FOLDER}
        folders.items.push(_folder)
        callback(null, _folder)
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