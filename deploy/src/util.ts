import Docker from "dockerode";
import path from "path";
import { publisher } from ".";

var docker = new Docker();
const timeout = 1 * 60 * 1000; // 10 minutes

export async function buildProject(id: string) {
  console.log(`[INFO] Starting Dockerized build for: ${id}`);

  const containerName = `build-${id}`;
  const outputPath = path.join(__dirname, `output/${id}`);

  try {
    // Step 1: Create a Docker container for the build process
    console.log(`[INFO] Creating Docker container for project: ${id}`);
    const container = await docker.createContainer({
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
    await container.start();
    console.log(`[INFO] Docker container started: ${containerName}`);

    // Step 3: Stream logs from the container
    console.log(`[INFO] Streaming logs from container: ${containerName}`);
    const logs = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
    });
    logs.on("data", async (data) => {
      const logMessage = data.toString();
      console.log(`[LOG:${id}] ${logMessage.trim()}`);
      await publisher.rPush(`logs:${id}`, logMessage.trim());
    });

    // Step 4: Wait for the container to complete with a timeout
    console.log(
      `[INFO] Waiting for the build to complete with a timeout of ${
        timeout / 1000
      } seconds.`
    );
    const result = await Promise.race([
      container.wait(), // Wait for the container to finish
      new Promise((_, reject) =>
        setTimeout(async () => {
          console.log(`[ERROR] Build timed out for project: ${id}`);
          await container.stop(); // Stop the container if timeout is reached
          reject(new Error("Build timed out"));
        }, timeout)
      ),
    ]);

    // Step 5: Check the result of the container
    if (result.StatusCode !== 0) {
      throw new Error(`[ERROR] Docker build failed for project: ${id}`);
    }

    console.log(`[SUCCESS] Build completed successfully for project: ${id}`);
    await publisher.rPush(`logs:${id}`, "Build completed successfully.");
    await publisher.hSet("status", id, "deployed");
  } catch (error: any) {
    // Handle errors and log failure status
    console.error(`[ERROR] Build failed for project: ${id}`, error);
    await publisher.rPush(`logs:${id}`, `Error: ${error.message}`);
    await publisher.hSet("status", id, "failed");
    throw error;
  }
}
