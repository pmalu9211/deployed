import express from "express";
import * as mime from "mime-types";
import dotenv from "dotenv";
import cors from "cors";
import { S3 } from "aws-sdk";

dotenv.config();

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_ENDPOINT,
});

const app = express();
app.use(cors());

// Health check endpoint
app.get("/ping", (req, res) => {
  res.json("PONG");
});

// File retrieval endpoint
app.get("/*", async (req, res) => {
  const host = req.hostname;
  const id = host.split(".")[0];
  let filePath = req.path;
  if (filePath === "/") {
    filePath = "/index.html";
  }

  try {
    console.log(`Fetching file: dist/${id}${filePath}`);

    const contents = await s3
      .getObject({
        Bucket: "deployed",
        Key: `dist/${id}${filePath}`,
      })
      .promise();

    const type = mime.lookup(filePath) || "application/octet-stream";
    res.set("Content-Type", type);
    res.send(contents.Body);
  } catch (error: any) {
    if (error.code === "NoSuchKey") {
      console.error(`File not found: dist/${id}${filePath}`);
      res.status(404).json({ message: `File not found: ${filePath}` });
    } else {
      console.error("Error retrieving file:", error);
      res
        .status(500)
        .json({ message: "Error retrieving file", error: error.message });
    }
  }
});

// Start server
app.listen(3001, () => {
  console.log("Listening on port 3001");
});
