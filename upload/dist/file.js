"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllFiles = getAllFiles;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function getAllFiles(folderPath) {
    let response = [];
    try {
        const allFilesAndDirs = fs_1.default.readdirSync(folderPath);
        allFilesAndDirs.forEach((allFilesAndDir) => {
            const fullPath = path_1.default.join(folderPath, allFilesAndDir);
            try {
                const stat = fs_1.default.statSync(fullPath);
                if (stat.isDirectory()) {
                    response = response.concat(getAllFiles(fullPath));
                }
                else {
                    response.push(fullPath);
                }
            }
            catch (err) {
                console.warn(`Skipping path ${fullPath}: ${err.message}`);
            }
        });
    }
    catch (err) {
        console.error(`Error reading directory ${folderPath}: ${err.message}`);
    }
    return response;
}
