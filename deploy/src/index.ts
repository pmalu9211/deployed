import dotenv from "dotenv";
dotenv.config();
import fs from "fs";
import { commandOptions, createClient } from "redis";
import { buildProject } from "./util";
import { copyFinalDist, downloadCloudFolder } from "./bucket";
import path from "path";

console.log(process.env.redisHost);

export const subscriber = createClient({
  url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});

export const publisher = createClient({
  url: `redis://${process.env.redisHost}:${process.env.redisPort}`,
});

async function connectClients() {
  try {
    if (!subscriber.isOpen) await subscriber.connect();
    if (!publisher.isOpen) await publisher.connect();
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis:", error);
    process.exit(1);
  }
}

async function closeClients() {
  await subscriber.disconnect();
  await publisher.disconnect();
  console.log("Redis connections closed");
}

async function main() {
  await connectClients();

  process.on("SIGINT", async () => {
    console.log("Gracefully shutting down...");
    await closeClients();
    process.exit(0);
  });

  while (true) {
    const response = await subscriber.brPop(
      commandOptions({ isolated: true }),
      "build-queue",
      0
    );
    const folderName = response?.element;

    if (!folderName) continue;
    console.log("hello ", folderName);

    try {
      console.log(`Starting download for folder: ${folderName}`);
      await downloadCloudFolder(`output/${folderName}/`);
      console.log(`Download complete for folder: ${folderName}`);

      console.log(`Starting Dockerized build for folder: ${folderName}`);
      await buildProject(folderName);

      console.log(`Copying final distribution for folder: ${folderName}`);
      await copyFinalDist(folderName);
    } catch (error) {
      console.error(`Error processing build for folder: ${folderName}`, error);
    } finally {
      fs.rmSync(path.join(__dirname, `output/${folderName}`), {
        recursive: true,
        force: true,
      });
    }
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
