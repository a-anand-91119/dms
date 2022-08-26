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
pacakgeDefinition = protoLoader.loadSync("document.proto", grpcOptions);
const DocumentService = grpc.loadPackageDefinition(pacakgeDefinition).document.DocumentService

const folderApi = new FolderService(
    "0.0.0.0:50051",
    grpc.credentials.createInsecure()
)
const documentApi = new DocumentService(
    "0.0.0.0:50051",
    grpc.credentials.createInsecure()
)

folderApi.GetAllFolders({userId: "9af9c126-b48a-4284-ac5a-97f235cef61b"}, (error, items) => {
    console.log(" * Getting all folders for user")
    if(error)
        console.error(error)
    console.log(items)
})

// folderApi.CreateFolder({userId: "9af9c126-b48a-4284-ac5a-97f235cef61b", folderName: "New Folder"}, (error, items) => {
//     console.log(" * Creating new folder")
//     if(error)
//         console.error(error)
//     console.log(items)
// })

folderApi.GetFolderContents({folderId: "797163d5-b9d1-4e97-bdf8-6063a3f6aa75"}, (error, items) => {
    console.log(" * Getting contents of folder 1")
    if(error)
        console.error(error)
    console.log(items)
})


documentApi.GetDocument({documentId: "3ac56900-6b85-4ce5-b55c-d52c9bccd3a0", folderId: "797163d5-b9d1-4e97-bdf8-6063a3f6aa75"}, (error, document) => {
    console.log(" * Getting contents of document")
    if(error)
        console.error(error)
    console.log(document)
})


// documentApi.CreateDocument({
//         folderId: "797163d5-b9d1-4e97-bdf8-6063a3f6aa75",
//         fileName: "api created file_2.log",
//         content: "This is a content from api"
// }, (error, document) => {
//     console.log(" * Creating new document")
//     if(error)
//         console.error(error)
//     console.log(document)
// })

folderApi.GetFolderContents({folderId: "797163d5-b9d1-4e97-bdf8-6063a3f6aa75"}, (error, items) => {
    console.log(" * Getting contents of folder 1")
    if(error)
        console.error(error)
    console.log(items)
})