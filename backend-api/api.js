const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")

const PROTO_PATH = "../protos"
const { uuid } = require("uuidv4")

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

const folderApi = new FolderService("0.0.0.0:50051", grpc.credentials.createInsecure())
const documentApi = new DocumentService("0.0.0.0:50051", grpc.credentials.createInsecure())


app.get("/folder/:folderId/document/:documentId", (req, res) => {
    documentApi.GetDocument({ documentId: req.params.documentId, folderId: req.params.folderId }, (error, document) => {
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.delete("/folder/:folderId/document/:documentId", (req, res) => {
    documentApi.DeleteDocument({ documentId: req.params.documentId, folderId: req.params.folderId }, (error, document) => {
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.put("/folder/:folderId/document/:documentId", (req, res) => {
    documentApi.UpdateDocument({
        documentId: req.params.documentId,
        folderId: req.body.folderId,
        fileName: req.body.fileName,
        content: req.body.content
    }, (error, document) => {
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.post("/folder/:folderId/document", (req, res) => {
    documentApi.CreateDocument({
        folderId: req.body.folderId,
        fileName: req.body.fileName,
        content: req.body.content
    }, (error, document) => {
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(document)
    })
})

app.get("/folder/:folderId", (req, res) => {
    folderApi.GetFolderContents({ folderId: req.params.folderId }, (error, data) => {
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data.documents);
    })
})

app.delete("/folder/:folderId", (req, res) => {
    folderApi.DeleteFolder({ folderId: req.body.folderId, userId: req.body.userId }, (error, data) => {
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data);
    })
})

app.put("/folder/:folderId", (req, res) => {
    folderApi.UpdateFolder({ folderId: req.body.folderId, folderName: req.body.folderName }, (error, data) => {
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data);
    })
})

app.post("/folder", (req, res) => {
    folderApi.CreateFolder({ userId: req.body.userId, folderName: req.body.folderName }, (error, items) => {
        console.log(" * Creating new folder")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        } else {
            res.send(items)
        }
    })
})

app.post("/dashboard", (req, res) => {
    folderApi.GetAllFolders({ userId: req.body.userId }, (error, items) => {
        console.log(" * Getting all folders for user")
        if (error) {
            console.error(error)
        }
        folderApi.GetFolderContents({ folderId: items.folders[0].folderId }, (error, data) => {
            items.folders.shift()
            if (error) {
                console.error(error)
            }
            items.folders.push(...data.documents)
            res.send(items.folders);
        })
    })
})

app.listen(50052, () => {
    console.log('listening on port 50052');
})