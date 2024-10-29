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
exports.buildProject = buildProject;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const _1 = require(".");
function buildProject(id) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("started the build");
        return new Promise((resolve, reject) => {
            var _a, _b;
            const child = (0, child_process_1.exec)(`cd ${path_1.default.join(__dirname, `output/${id}`)} && npm install && npm run build`);
            (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on("data", (data) => __awaiter(this, void 0, void 0, function* () {
                console.log("stdout: " + data);
                try {
                    yield _1.publisher.rPush(`logs:${id}`, `stdout: ${data}`);
                }
                catch (error) {
                    console.error("Failed to log stdout to Redis:", error);
                }
            }));
            (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on("data", (data) => __awaiter(this, void 0, void 0, function* () {
                console.log("stderr: " + data);
                try {
                    yield _1.publisher.rPush(`logs:${id}`, `stderr: ${data}`);
                }
                catch (error) {
                    console.error("Failed to log stderr to Redis:", error);
                }
            }));
            child.on("close", (code) => __awaiter(this, void 0, void 0, function* () {
                if (code === 0) {
                    try {
                        yield _1.publisher.rPush(`logs:${id}`, "Build completed successfully.");
                        resolve("Build completed successfully.");
                    }
                    catch (error) {
                        console.error("Failed to log completion message to Redis:", error);
                        reject(new Error("Build completed, but logging failed."));
                    }
                }
                else {
                    yield _1.publisher.hSet("status", id, "failed");
                    const errorMessage = `Build failed with exit code ${code}.`;
                    console.error(errorMessage);
                    try {
                        yield _1.publisher.rPush(`logs:${id}`, errorMessage);
                    }
                    catch (error) {
                        console.error("Failed to log error to Redis:", error);
                    }
                    reject(new Error(errorMessage));
                }
            }));
        });
    });
}
