"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mime = __importStar(require("mime-types"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const aws_sdk_1 = require("aws-sdk");
dotenv_1.default.config();
const s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Health check endpoint
app.get("/ping", (req, res) => {
    res.json("PONG");
});
// File retrieval endpoint
app.get("/*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const host = req.hostname;
    const id = host.split(".")[0];
    let filePath = req.path;
    if (filePath === "/") {
        filePath = "/index.html";
    }
    try {
        console.log(`Fetching file: dist/${id}${filePath}`);
        const contents = yield s3
            .getObject({
            Bucket: "deployed",
            Key: `dist/${id}${filePath}`,
        })
            .promise();
        const type = mime.lookup(filePath) || "application/octet-stream";
        res.set("Content-Type", type);
        res.send(contents.Body);
    }
    catch (error) {
        if (error.code === "NoSuchKey") {
            console.error(`File not found: dist/${id}${filePath}`);
            res.status(404).json({ message: `File not found: ${filePath}` });
        }
        else {
            console.error("Error retrieving file:", error);
            res
                .status(500)
                .json({ message: "Error retrieving file", error: error.message });
        }
    }
}));
// Start server
app.listen(3001, () => {
    console.log("Listening on port 3001");
});
