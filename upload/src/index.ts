import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import express from "express";
import cors from "cors";
import generate from "./utils";
import path from "path";
import simpleGit from "simple-git";
import { getAllFiles } from "./file";
import { uploadFile } from "./bucket";
import { createClient } from "redis";

export const subscriber = createClient({
  url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});

export const publisher = createClient({
  url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});

(async () => {
  try {
    await publisher.connect();
    await subscriber.connect();
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1); // Exit the process if Redis connection fails
  }
})();

const app = express();
app.use(cors());
app.use(express.json());

// Route for deploying a repository
app.post("/deploy", async (req, res) => {
  try {
    const repoUrl = req.body.repoUrl;
    if (!repoUrl) {
      res.status(400).json({ error: "Repository URL is required." });
      return;
    }

    const id = generate();
    const pathToRepo = path.join(__dirname, `output/${id}`);

    // Clone the repository
    await simpleGit().clone(repoUrl, pathToRepo);
    const files = getAllFiles(pathToRepo);

    // Upload files
    const uploadPromises = files.map((file) =>
      uploadFile(file.slice(__dirname.length + 1), file)
    );
    await Promise.all(uploadPromises);
    fs.rmSync(path.join(__dirname, `output/${id}`), {
      recursive: true,
      force: true,
    });

    // Update Redis status and queue
    await publisher.hSet("status", id, "uploaded");
    await publisher.lPush("build-queue", id);

    res.json({ id });
  } catch (error) {
    console.error("Error in /deploy:", error);
    res.status(500).json({ error: "Failed to deploy repository." });
  }
});

// Route for checking deployment status
app.get("/status", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      res.status(400).json({ error: "ID parameter is required." });
      return;
    }

    const response = await subscriber.hGet("status", id as string);
    if (!response) {
      res.status(404).json({ error: "No status found for the provided ID." });
      return;
    }

    res.json({ status: response });
  } catch (error) {
    console.error("Error in /status:", error);
    res.status(500).json({ error: "Failed to retrieve status." });
  }
});

// Route for fetching logs
app.get("/logs", async (req, res) => {
  try {
    const id = req.query.id;
    if (!id) {
      res.status(400).json({ error: "ID parameter is required." });
      return;
    }

    // Fetch logs from Redis
    const logs = await subscriber.lRange(`logs:${id}`, 0, -1);
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
    await subscriber.del(`logs:${id}`);

    res.status(200).json({ id, logs: formattedLogs });
  } catch (error) {
    console.error("Error in /logs:", error);
    res.status(500).json({ error: "Failed to retrieve logs." });
  }
});

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
