const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

const PROTO_PATH = "../protos"
const BACKEND_SERVER = `${process.env.BACKEND_SERVER_GRPC_HOST}:${process.env.BACKEND_SERVER_GRPC_PORT}`
// const BACKEND_SERVER = `0.0.0.0:50051`
console.log(" * Backend Server: " + BACKEND_SERVER)

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(cors());
app.use(morgan('combined'));


app.get('/', (req, res) => {
    res.send({ status: "OK" });
});

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

const folderApi = new FolderService(BACKEND_SERVER, grpc.credentials.createInsecure())
const documentApi = new DocumentService(BACKEND_SERVER, grpc.credentials.createInsecure())


app.get("/folder/:folderId/document/:documentId", (req, res) => {
    console.log(" * GetDocument")
    documentApi.GetDocument({ documentId: req.params.documentId, folderId: req.params.folderId }, (error, document) => {
        console.log(" * Received response for GetDocument")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.delete("/folder/:folderId/document/:documentId", (req, res) => {
    console.log(" * DeleteDocument")
    documentApi.DeleteDocument({ documentId: req.params.documentId, folderId: req.params.folderId }, (error, document) => {
        console.log(" * Received response for DeleteDocument")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.put("/folder/:folderId/document/:documentId", (req, res) => {
    console.log(" * UpdateDocument")
    documentApi.UpdateDocument({
        documentId: req.params.documentId,
        folderId: req.body.folderId,
        fileName: req.body.fileName,
        content: req.body.content
    }, (error, document) => {
        console.log(" * Received response for UpdateDocument")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.post("/folder/:folderId/document", (req, res) => {
    console.log(" * CreateDocument")
    documentApi.CreateDocument({
        folderId: req.body.folderId,
        fileName: req.body.fileName,
        content: req.body.content
    }, (error, document) => {
        console.log(" * Received response for CreateDocument")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.get("/folder/:folderId", (req, res) => {
    console.log(" * GetFolderContents")
    folderApi.GetFolderContents({ folderId: req.params.folderId }, (error, data) => {
        console.log(" * Received response for GetFolderContents")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data);
    })
})

app.delete("/folder/:folderId", (req, res) => {
    console.log(" * DeleteFolder")
    folderApi.DeleteFolder({ folderId: req.body.folderId, userId: req.body.userId }, (error, data) => {
        console.log(" * Received response for DeleteFolder")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data);
    })
})

app.put("/folder/:folderId", (req, res) => {
    console.log(" * UpdateFolder")
    folderApi.UpdateFolder({ folderId: req.body.folderId, folderName: req.body.folderName }, (error, data) => {
        console.log(" * Received response for UpdateFolder")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data);
    })
})

app.post("/folder", (req, res) => {
    console.log(" * CreateFolder")
    folderApi.CreateFolder({ userId: req.body.userId, folderName: req.body.folderName }, (error, items) => {
        console.log(" * Received response for CreateFolder")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        } else {
            res.send(items)
        }
    })
})

app.post("/dashboard", (req, res) => {
    console.log(" * GetAllFolders")
    folderApi.GetAllFolders({ userId: req.body.userId }, (error, items) => {
        console.log(" * Received response for GetAllFolders")
        if (error) {
            console.error(error)
            res.send({ error: error.details })
        } else {
            console.log(" * GetFolderContents")
            folderApi.GetFolderContents({ folderId: items.folders[0].folderId }, (error, data) => {
                console.log(" * Received response for GetAllFolders")
                items.folders.shift()
                if (error) {
                    console.error(error)
                }
                console.log(data)
                items.folders.push(...data.documents)
                res.send(items.folders);
            })
        }
    })
})

app.listen(50052, () => {
    console.log(' * listening on port 50052');
})