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
exports.publisher = exports.subscriber = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const fs_1 = __importDefault(require("fs"));
const redis_1 = require("redis");
const util_1 = require("./util");
const bucket_1 = require("./bucket");
const path_1 = __importDefault(require("path"));
console.log(process.env.redisHost);
exports.subscriber = (0, redis_1.createClient)({
    url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});
exports.publisher = (0, redis_1.createClient)({
    url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});
function connectClients() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (!exports.subscriber.isOpen)
                yield exports.subscriber.connect();
            if (!exports.publisher.isOpen)
                yield exports.publisher.connect();
            console.log("Connected to Redis");
        }
        catch (error) {
            console.error("Failed to connect to Redis:", error);
            process.exit(1);
        }
    });
}
function closeClients() {
    return __awaiter(this, void 0, void 0, function* () {
        yield exports.subscriber.disconnect();
        yield exports.publisher.disconnect();
        console.log("Redis connections closed");
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        yield connectClients();
        process.on("SIGINT", () => __awaiter(this, void 0, void 0, function* () {
            console.log("Gracefully shutting down...");
            yield closeClients();
            process.exit(0);
        }));
        while (true) {
            const response = yield exports.subscriber.brPop((0, redis_1.commandOptions)({ isolated: true }), "build-queue", 0);
            const folderName = response === null || response === void 0 ? void 0 : response.element;
            try {
                if (folderName) {
                    console.log(`Starting download for folder: ${folderName}`);
                    yield (0, bucket_1.downloadCloudFolder)(`output/${folderName}/`);
                    console.log(`Download complete for folder: ${folderName}`);
                    console.log(`Starting build for folder: ${folderName}`);
                    yield (0, util_1.buildProject)(folderName);
                    console.log(`Build complete for folder: ${folderName}`);
                    console.log(`Copying final distribution for folder: ${folderName}`);
                    yield (0, bucket_1.copyFinalDist)(folderName);
                    console.log(`Distribution copied for folder: ${folderName}`);
                    yield exports.publisher.hSet("status", folderName, "deployed");
                    console.log(`Status updated to "deployed" for folder: ${folderName}`);
                }
            }
            catch (error) {
                if (folderName) {
                    yield exports.publisher.hSet("status", folderName, "failed");
                }
                console.error("Error processing build queue item:", error);
                // Add a small delay before retrying to prevent tight loop on errors
                yield new Promise((resolve) => setTimeout(resolve, 1000));
            }
            finally {
                fs_1.default.rmSync(path_1.default.join(__dirname, `output/${folderName}`), {
                    recursive: true,
                    force: true,
                });
            }
        }
    });
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
