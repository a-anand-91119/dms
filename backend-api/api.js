const grpc = require("@grpc/grpc-js")
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
const FolderService = grpc.loadPackageDefinition(pacakgeDefinition).folder.FolderService

const api = new FolderService(
    "0.0.0.0:50051",
    grpc.credentials.createInsecure()
)

api.GetAllFolders({userId: 1}, (error, items) => {
    console.log(" * Getting all folders for user")
    if(error)
        console.error(error)
    console.log(items)
})

api.CreateFolder({userId: 1, folderName: "New Folder"}, (error, items) => {
    console.log(" * Creating new folder")
    if(error)
        console.error(error)
    console.log(items)
})

api.GetAllFolders({userId: 1}, (error, items) => {
    console.log(" * Getting all folders for user")
    if(error)
        console.error(error)
    console.log(items)
})

api.GetFolderContents({itemId: 1}, (error, items) => {
    console.log(" * Getting contents of folder 1")
    if(error)
        console.error(error)
    console.log(items)
})