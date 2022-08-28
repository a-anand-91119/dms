const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")
const bcrypt = require("bcryptjs")
const authMiddleWare = require("./middleware/auth")
const jwt = require("jsonwebtoken")
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
pacakgeDefinition = protoLoader.loadSync("user.proto", grpcOptions);
const UserService = grpc.loadPackageDefinition(pacakgeDefinition).user.UserService

const folderApi = new FolderService(BACKEND_SERVER, grpc.credentials.createInsecure())
const documentApi = new DocumentService(BACKEND_SERVER, grpc.credentials.createInsecure())
const userApi = new UserService(BACKEND_SERVER, grpc.credentials.createInsecure())

app.get("/folder/:folderId/document/:documentId", authMiddleWare, (req, res) => {
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

app.delete("/folder/:folderId/document/:documentId", authMiddleWare, (req, res) => {
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

app.put("/folder/:folderId/document/:documentId", authMiddleWare, (req, res) => {
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

app.post("/folder/:folderId/document", authMiddleWare, (req, res) => {
    console.log(" * CreateDocument")
    documentApi.CreateDocument({
        folderId: req.params.folderId,
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

app.get("/folder/:folderId", authMiddleWare, (req, res) => {
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

app.delete("/folder/:folderId", authMiddleWare, (req, res) => {
    console.log(" * DeleteFolder")
    folderApi.DeleteFolder({ folderId: req.params.folderId, userId: req.user.userId }, (error, data) => {
        console.log(" * Received response for DeleteFolder")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data);
    })
})

app.put("/folder/:folderId", authMiddleWare, (req, res) => {
    console.log(" * UpdateFolder")
    folderApi.UpdateFolder({ folderId: req.params.folderId, folderName: req.body.folderName }, (error, data) => {
        console.log(" * Received response for UpdateFolder")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        }
        res.send(data);
    })
})

app.post("/folder", authMiddleWare, (req, res) => {
    console.log(" * CreateFolder")
    folderApi.CreateFolder({ userId: req.user.userId, folderName: req.body.folderName }, (error, items) => {
        console.log(" * Received response for CreateFolder")
        if (error) {
            console.error(error.details)
            res.send({ error: error.details })
        } else {
            res.send(items)
        }
    })
})

app.post("/dashboard", authMiddleWare, (req, res) => {
    console.log(" * GetAllFolders")
    folderApi.GetAllFolders({ userId: req.user.userId }, (error, items) => {
        console.log(" * Received response for GetAllFolders")
        if (error) {
            console.error(error)
            res.send({ error: error.details })
        } else {
            console.log(" * GetFolderContents")
            folderApi.GetFolderContents({ folderId: items.folders[0].folderId }, (error, data) => {
                console.log(" * Received response for GetAllFolders")
                if (error) {
                    console.error(error)
                }
                console.log(data)
                if(typeof(data.documents) !== "undefined")
                    items.folders.push(...data.documents)
                res.send(items.folders);
            })
        }
    })
})

app.post("/register", (req, res) => {
    const { userName, password } = req.body

    if (!(userName && password)) {
        return res.status(400).send("Mandatory fields not provided")
    } else {
        console.log(" * GetUserByName")
        userApi.GetUserByName({ userName }, async (error, _) => {
            console.log(" * GetUserByName Response")
            if (error) {
                // no user
                const encryptedPassword = await bcrypt.hash(password, 5)
                console.log(" * CreateUser")
                userApi.CreateUser({ userName, password: encryptedPassword }, (error, items) => {
                    console.log(" * CreateUser Response")
                    if (error) {
                        return res.status(500).send("Failed to create user account")
                    } else {
                        res.status(201).send({ status: "User registered successfullt" })
                        // const token = jwt.sign({ userId: items.userId, userName: items.userName }, "A_SECURE_KEY", { expiresIn: "1h" })
                        // userApi.SaveToken({ userName, token }, (error, _) => {
                        //     return res.status(201).send({ authToken: token })
                        // })
                    }
                })
            } else {
                res.status(409).send("Username already taken")
            }
        })
    }
})

app.post("/login", (req, res) => {
    const { userName, password } = req.body
    if (!(userName && password)) {
        return res.status(400).send("Mandatory fields not provided")
    } else {
        console.log(" * GetUserByName")
        userApi.GetUserByName({ userName }, async (error, item) => {
            console.log(" * GetUserByName Response")
            console.log(item)
            if (error) {
                return res.status(404).send("Invalid credentials")
            } else {
                if (await bcrypt.compare(password, item.password)) {
                    delete item["password"]
                    const token = jwt.sign({ userId: item.userId, userName: item.userName }, "A_SECURE_KEY", { expiresIn: "1h" })
                    item["token"] = token
                    return res.send(item)
                } else {
                    return res.status(404).send("Invalid credentials")
                }
            }
        })
    }
})

app.listen(50052, () => {
    console.log(' * listening on port 50052');
})