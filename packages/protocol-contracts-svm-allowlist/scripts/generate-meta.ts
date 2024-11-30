import fs from 'fs/promises';
import path from 'path';

(async function main() {
  const baseMetaDir = 'base_meta';
  const resultDir = 'result_meta';

  try {
    // Read the files from the base_meta directory
    const files = await fs.readdir(baseMetaDir);

    // Filter to only include JSON files
    const jsonFiles = files.filter((filename) => filename.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.error('No JSON files found in the base_meta directory.');
      return;
    }

    // Ensure the result directory exists or create it
    await fs.mkdir(resultDir, { recursive: true });

    // Create 0.json through 90000.json in the result directory
    for (let i = 0; i <= 90000; i++) {
      // Select a random file from the jsonFiles
      const randomFile = jsonFiles[Math.floor(Math.random() * jsonFiles.length)];

      const sourcePath = path.join(baseMetaDir, randomFile);
      const destFileName = `${i}.json`;
      const destPath = path.join(resultDir, destFileName);

      // Copy the random file to the result directory with the new name
      await fs.copyFile(sourcePath, destPath);
    }

    console.log('All files have been generated successfully in the result directory.');
  } catch (error) {
    console.error('An error occurred:', error);
  }
})();
