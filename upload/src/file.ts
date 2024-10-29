import fs from "fs";
import path from "path";

export function getAllFiles(folderPath: string): string[] {
  let response: string[] = [];

  try {
    const allFilesAndDirs = fs.readdirSync(folderPath);
    allFilesAndDirs.forEach((allFilesAndDir) => {
      const fullPath = path.join(folderPath, allFilesAndDir);

      try {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          response = response.concat(getAllFiles(fullPath));
        } else {
          response.push(fullPath);
        }
      } catch (err: any) {
        console.warn(`Skipping path ${fullPath}: ${err.message}`);
      }
    });
  } catch (err: any) {
    console.error(`Error reading directory ${folderPath}: ${err.message}`);
  }

  return response;
}
