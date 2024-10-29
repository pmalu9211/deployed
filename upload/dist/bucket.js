"use strict";
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
exports.uploadFile = exports.s3 = void 0;
const aws_sdk_1 = require("aws-sdk");
const fs_1 = __importDefault(require("fs"));
const _1 = require(".");
exports.s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});
const uploadFile = (cloudFilePath, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if the file exists before reading
        if (!fs_1.default.existsSync(localFilePath)) {
            throw new Error(`Local file not found at path: ${localFilePath}`);
        }
        const fileContent = fs_1.default.readFileSync(localFilePath);
        const response = yield exports.s3
            .upload({
            Body: fileContent,
            Bucket: "deployed",
            Key: cloudFilePath,
        })
            .promise();
        console.log("Upload successful:", response);
    }
    catch (error) {
        let arr = localFilePath.split("/");
        const folderName = arr[arr.length - 1];
        yield _1.publisher.hSet("status", folderName, "failed");
        if (error instanceof Error) {
            console.error("Error during file upload:", error.message);
            // Check for specific AWS errors if needed
            if (error.name === "NoSuchBucket") {
                console.error("Bucket does not exist.");
            }
            else if (error.name === "CredentialsError") {
                console.error("Invalid AWS credentials.");
            }
            else if (error.name === "NetworkingError") {
                console.error("Network error occurred.");
            }
        }
        else {
            console.error("An unknown error occurred during file upload.");
        }
    }
});
exports.uploadFile = uploadFile;
