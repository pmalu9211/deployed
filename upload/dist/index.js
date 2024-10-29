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
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const utils_1 = __importDefault(require("./utils"));
const path_1 = __importDefault(require("path"));
const simple_git_1 = __importDefault(require("simple-git"));
const file_1 = require("./file");
const bucket_1 = require("./bucket");
const redis_1 = require("redis");
exports.subscriber = (0, redis_1.createClient)({
    url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});
exports.publisher = (0, redis_1.createClient)({
    url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield exports.publisher.connect();
        yield exports.subscriber.connect();
    }
    catch (error) {
        console.error("Failed to connect to Redis:", error);
        process.exit(1); // Exit the process if Redis connection fails
    }
}))();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Route for deploying a repository
app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const repoUrl = req.body.repoUrl;
        if (!repoUrl) {
            res.status(400).json({ error: "Repository URL is required." });
            return;
        }
        const id = (0, utils_1.default)();
        const pathToRepo = path_1.default.join(__dirname, `output/${id}`);
        // Clone the repository
        yield (0, simple_git_1.default)().clone(repoUrl, pathToRepo);
        const files = (0, file_1.getAllFiles)(pathToRepo);
        // Upload files
        const uploadPromises = files.map((file) => (0, bucket_1.uploadFile)(file.slice(__dirname.length + 1), file));
        yield Promise.all(uploadPromises);
        fs_1.default.rmSync(path_1.default.join(__dirname, `output/${id}`), {
            recursive: true,
            force: true,
        });
        // Update Redis status and queue
        yield exports.publisher.hSet("status", id, "uploaded");
        yield exports.publisher.lPush("build-queue", id);
        res.json({ id });
    }
    catch (error) {
        console.error("Error in /deploy:", error);
        res.status(500).json({ error: "Failed to deploy repository." });
    }
}));
// Route for checking deployment status
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.query.id;
        if (!id) {
            res.status(400).json({ error: "ID parameter is required." });
            return;
        }
        const response = yield exports.subscriber.hGet("status", id);
        if (!response) {
            res.status(404).json({ error: "No status found for the provided ID." });
            return;
        }
        res.json({ status: response });
    }
    catch (error) {
        console.error("Error in /status:", error);
        res.status(500).json({ error: "Failed to retrieve status." });
    }
}));
// Route for fetching logs
app.get("/logs", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.query.id;
        if (!id) {
            res.status(400).json({ error: "ID parameter is required." });
            return;
        }
        // Fetch logs from Redis
        const logs = yield exports.subscriber.lRange(`logs:${id}`, 0, -1);
        if (logs.length === 0) {
            res.status(404).json({ error: "No logs found for this ID." });
            return;
        }
        // Format logs for better readability
        const formattedLogs = logs.map((log, index) => ({
            timestamp: new Date().toISOString(),
            entry: log,
            index,
        }));
        // Optionally clear logs after fetching (if required)
        yield exports.subscriber.del(`logs:${id}`);
        res.status(200).json({ id, logs: formattedLogs });
    }
    catch (error) {
        console.error("Error in /logs:", error);
        res.status(500).json({ error: "Failed to retrieve logs." });
    }
}));
// Error handling middleware
//@ts-ignore
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "An unexpected error occurred." });
});
// Start the server
app.listen(3000, () => {
    console.log("Running on port 3000");
});
