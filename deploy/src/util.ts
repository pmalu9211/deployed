import { exec } from "child_process";
import path from "path";
import { publisher } from ".";

export async function buildProject(id: string) {
  console.log("started the build");

  return new Promise((resolve, reject) => {
    const child = exec(
      `cd ${path.join(
        __dirname,
        `output/${id}`
      )} && npm install && npm run build`
    );

    child.stdout?.on("data", async (data) => {
      console.log("stdout: " + data);
      try {
        await publisher.rPush(`logs:${id}`, `stdout: ${data}`);
      } catch (error) {
        console.error("Failed to log stdout to Redis:", error);
      }
    });

    child.stderr?.on("data", async (data) => {
      console.log("stderr: " + data);
      try {
        await publisher.rPush(`logs:${id}`, `stderr: ${data}`);
      } catch (error) {
        console.error("Failed to log stderr to Redis:", error);
      }
    });

    child.on("close", async (code) => {
      if (code === 0) {
        try {
          await publisher.rPush(`logs:${id}`, "Build completed successfully.");
          resolve("Build completed successfully.");
        } catch (error) {
          console.error("Failed to log completion message to Redis:", error);
          reject(new Error("Build completed, but logging failed."));
        }
      } else {
        await publisher.hSet("status", id, "failed");
        const errorMessage = `Build failed with exit code ${code}.`;
        console.error(errorMessage);
        try {
          await publisher.rPush(`logs:${id}`, errorMessage);
        } catch (error) {
          console.error("Failed to log error to Redis:", error);
        }
        reject(new Error(errorMessage));
      }
    });
  });
}
