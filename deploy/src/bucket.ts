import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";
import { publisher } from ".";

export const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_ENDPOINT,
});

// Download all files in a folder from S3
export async function downloadCloudFolder(prefix: string) {
  try {
    const allFiles = await s3
      .listObjectsV2({
        Bucket: "deployed",
        Prefix: prefix,
      })
      .promise();
    console.log("Fetched list of files:", allFiles);

    // Download each file concurrently
    const allPromises =
      allFiles.Contents?.map(async ({ Key }) => {
        return new Promise(async (resolve, reject) => {
          if (!Key) {
            resolve("");
            return;
          }
          try {
            const finalOutputPath = path.join(__dirname, Key);
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)) {
              fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
              Bucket: "deployed",
              Key,
            })
              .createReadStream()
              .pipe(outputFile)
              .on("finish", () => resolve(""))
              .on("error", (error) => {
                console.error(`Error writing file ${Key}:`, error);
                reject(error);
              });
          } catch (error) {
            console.error(`Error in downloading file ${Key}:`, error);
            reject(error);
          }
        });
      }) || [];

    await Promise.all(allPromises.filter((x) => x !== undefined));
    console.log("All files downloaded successfully");
  } catch (error) {
    let arr = prefix.split("/");
    const folderName = arr[arr.length - 1];
    await publisher.hSet("status", folderName, "failed");
    console.error("Error listing or downloading files from S3:", error);
  }
}

// Upload the contents of the dist folder to S3
export async function copyFinalDist(id: string) {
  try {
    const folderPath = path.join(__dirname, `output/${id}/dist`);
    const allFiles = getAllFiles(folderPath);
    for (const file of allFiles) {
      try {
        await uploadFile(
          `dist/${id}/` + file.slice(folderPath.length + 1),
          file
        );
      } catch (error) {
        await publisher.hSet("status", id, "failed");
        console.error(`Error uploading file ${file}:`, error);
      }
    }
    console.log("All files uploaded successfully for folder:", id);
    fs.rmSync(path.join(__dirname, `output/${id}`), {
      recursive: true,
      force: true,
    });
  } catch (error) {
    await publisher.hSet("status", id, "failed");
    console.error(
      `Error in copying final distribution for folder ${id}:`,
      error
    );
  }
}

// Retrieve all files from a directory and its subdirectories
const getAllFiles = (folderPath: string) => {
  let response: string[] = [];
  try {
    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach((file) => {
      const fullFilePath = path.join(folderPath, file);
      if (fs.statSync(fullFilePath).isDirectory()) {
        response = response.concat(getAllFiles(fullFilePath));
      } else {
        response.push(fullFilePath);
      }
    });
  } catch (error) {
    console.error(`Error reading files from folder ${folderPath}:`, error);
  }
  return response;
};

// Upload an individual file to S3
const uploadFile = async (fileName: string, localFilePath: string) => {
  try {
    const fileContent = fs.readFileSync(localFilePath);
    const response = await s3
      .upload({
        Body: fileContent,
        Bucket: "deployed",
        Key: fileName,
      })
      .promise();
    console.log(`Uploaded file ${fileName}:`, response);
  } catch (error) {
    console.error(`Error uploading file ${fileName}:`, error);
  }
};
