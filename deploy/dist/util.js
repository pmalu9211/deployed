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
const dockerode_1 = __importDefault(require("dockerode"));
const path_1 = __importDefault(require("path"));
const _1 = require(".");
var docker = new dockerode_1.default();
const timeout = 1 * 60 * 1000; // 10 minutes
function buildProject(id) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[INFO] Starting Dockerized build for: ${id}`);
        const containerName = `build-${id}`;
        const outputPath = path_1.default.join(__dirname, `output/${id}`);
        try {
            // Step 1: Create a Docker container for the build process
            console.log(`[INFO] Creating Docker container for project: ${id}`);
            const container = yield docker.createContainer({
                Image: "alpinereact-app:latest", // Pre-built Docker image for building React projects
                name: containerName,
                Cmd: [
                    "sh",
                    "-c",
                    `
          cd /app/output &&
          npm install &&
          npm run build
        `,
                ],
                HostConfig: {
                    Binds: [`${outputPath}:/app/output`], // Mount project folder into the container
                    AutoRemove: true, // Automatically remove container after it stops
                    CpuShares: 512, // Limit to half a CPU core
                    Memory: 1024 * 1024 * 1024, // Limit memory to 1GB
                },
            });
            console.log(`[INFO] Docker container created with name: ${containerName}`);
            // Step 2: Start the container
            console.log(`[INFO] Starting Docker container for project: ${id}`);
            yield container.start();
            console.log(`[INFO] Docker container started: ${containerName}`);
            // Step 3: Stream logs from the container
            console.log(`[INFO] Streaming logs from container: ${containerName}`);
            const logs = yield container.logs({
                follow: true,
                stdout: true,
                stderr: true,
            });
            logs.on("data", (data) => __awaiter(this, void 0, void 0, function* () {
                const logMessage = data.toString();
                console.log(`[LOG:${id}] ${logMessage.trim()}`);
                yield _1.publisher.rPush(`logs:${id}`, logMessage.trim());
            }));
            // Step 4: Wait for the container to complete with a timeout
            console.log(`[INFO] Waiting for the build to complete with a timeout of ${timeout / 1000} seconds.`);
            const result = yield Promise.race([
                container.wait(), // Wait for the container to finish
                new Promise((_, reject) => setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                    console.log(`[ERROR] Build timed out for project: ${id}`);
                    yield container.stop(); // Stop the container if timeout is reached
                    reject(new Error("Build timed out"));
                }), timeout)),
            ]);
            // Step 5: Check the result of the container
            if (result.StatusCode !== 0) {
                throw new Error(`[ERROR] Docker build failed for project: ${id}`);
            }
            console.log(`[SUCCESS] Build completed successfully for project: ${id}`);
            yield _1.publisher.rPush(`logs:${id}`, "Build completed successfully.");
            yield _1.publisher.hSet("status", id, "deployed");
        }
        catch (error) {
            // Handle errors and log failure status
            console.error(`[ERROR] Build failed for project: ${id}`, error);
            yield _1.publisher.rPush(`logs:${id}`, `Error: ${error.message}`);
            yield _1.publisher.hSet("status", id, "failed");
            throw error;
        }
    });
}
