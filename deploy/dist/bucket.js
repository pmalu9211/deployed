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
exports.s3 = void 0;
exports.downloadCloudFolder = downloadCloudFolder;
exports.copyFinalDist = copyFinalDist;
const aws_sdk_1 = require("aws-sdk");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const _1 = require(".");
exports.s3 = new aws_sdk_1.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_ENDPOINT,
});
// Download all files in a folder from S3
function downloadCloudFolder(prefix) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const allFiles = yield exports.s3
                .listObjectsV2({
                Bucket: "deployed",
                Prefix: prefix,
            })
                .promise();
            console.log("Fetched list of files:", allFiles);
            // Download each file concurrently
            const allPromises = ((_a = allFiles.Contents) === null || _a === void 0 ? void 0 : _a.map((_a) => __awaiter(this, [_a], void 0, function* ({ Key }) {
                return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    if (!Key) {
                        resolve("");
                        return;
                    }
                    try {
                        const finalOutputPath = path_1.default.join(__dirname, Key);
                        const outputFile = fs_1.default.createWriteStream(finalOutputPath);
                        const dirName = path_1.default.dirname(finalOutputPath);
                        if (!fs_1.default.existsSync(dirName)) {
                            fs_1.default.mkdirSync(dirName, { recursive: true });
                        }
                        exports.s3.getObject({
                            Bucket: "deployed",
                            Key,
                        })
                            .createReadStream()
                            .pipe(outputFile)
                            .on("finish", () => resolve(""))
                            .on("error", (error) => {
                            console.error(`Error writing file ${Key}:`, error);
                            reject(error);
                        });
                    }
                    catch (error) {
                        console.error(`Error in downloading file ${Key}:`, error);
                        reject(error);
                    }
                }));
            }))) || [];
            yield Promise.all(allPromises.filter((x) => x !== undefined));
            console.log("All files downloaded successfully");
        }
        catch (error) {
            let arr = prefix.split("/");
            const folderName = arr[arr.length - 1];
            yield _1.publisher.hSet("status", folderName, "failed");
            console.error("Error listing or downloading files from S3:", error);
        }
    });
}
// Upload the contents of the dist folder to S3
function copyFinalDist(id) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const folderPath = path_1.default.join(__dirname, `output/${id}/dist`);
            const allFiles = getAllFiles(folderPath);
            for (const file of allFiles) {
                try {
                    yield uploadFile(`dist/${id}/` + file.slice(folderPath.length + 1), file);
                }
                catch (error) {
                    yield _1.publisher.hSet("status", id, "failed");
                    console.error(`Error uploading file ${file}:`, error);
                }
            }
            console.log("All files uploaded successfully for folder:", id);
            fs_1.default.rmSync(path_1.default.join(__dirname, `output/${id}`), {
                recursive: true,
                force: true,
            });
        }
        catch (error) {
            yield _1.publisher.hSet("status", id, "failed");
            console.error(`Error in copying final distribution for folder ${id}:`, error);
        }
        finally {
            fs_1.default.rmSync(path_1.default.join(__dirname, `output/${id}`), {
                recursive: true,
                force: true,
            });
        }
    });
}
// Retrieve all files from a directory and its subdirectories
const getAllFiles = (folderPath) => {
    let response = [];
    try {
        const allFilesAndFolders = fs_1.default.readdirSync(folderPath);
        allFilesAndFolders.forEach((file) => {
            const fullFilePath = path_1.default.join(folderPath, file);
            if (fs_1.default.statSync(fullFilePath).isDirectory()) {
                response = response.concat(getAllFiles(fullFilePath));
            }
            else {
                response.push(fullFilePath);
            }
        });
    }
    catch (error) {
        console.error(`Error reading files from folder ${folderPath}:`, error);
    }
    return response;
};
// Upload an individual file to S3
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const fileContent = fs_1.default.readFileSync(localFilePath);
        const response = yield exports.s3
            .upload({
            Body: fileContent,
            Bucket: "deployed",
            Key: fileName,
        })
            .promise();
        console.log(`Uploaded file ${fileName}:`, response);
    }
    catch (error) {
        console.error(`Error uploading file ${fileName}:`, error);
    }
});
