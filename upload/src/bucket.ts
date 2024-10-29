import { S3 } from "aws-sdk";
import fs from "fs";
import { publisher } from ".";

export const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  endpoint: process.env.AWS_ENDPOINT,
});

export const uploadFile = async (
  cloudFilePath: string,
  localFilePath: string
) => {
  try {
    // Check if the file exists before reading
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`Local file not found at path: ${localFilePath}`);
    }

    const fileContent = fs.readFileSync(localFilePath);

    const response = await s3
      .upload({
        Body: fileContent,
        Bucket: "deployed",
        Key: cloudFilePath,
      })
      .promise();

    console.log("Upload successful:", response);
  } catch (error) {
    let arr = localFilePath.split("/");
    const folderName = arr[arr.length - 1];
    await publisher.hSet("status", folderName, "failed");

    if (error instanceof Error) {
      console.error("Error during file upload:", error.message);
      // Check for specific AWS errors if needed
      if (error.name === "NoSuchBucket") {
        console.error("Bucket does not exist.");
      } else if (error.name === "CredentialsError") {
        console.error("Invalid AWS credentials.");
      } else if (error.name === "NetworkingError") {
        console.error("Network error occurred.");
      }
    } else {
      console.error("An unknown error occurred during file upload.");
    }
  }
};
