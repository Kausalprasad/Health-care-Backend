const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const runPythonModel = (filePath) =>
  new Promise((resolve, reject) => {
    const scriptPath = path.resolve(
      __dirname,
      "../python/models/prescription_reader/model.py"
    );

    console.log("Running Python script at:", scriptPath);

    const py = spawn("python", [scriptPath, filePath], {
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    py.stdout.on("data", (chunk) => {
      console.log("Python stdout:", chunk.toString());
      stdout += chunk;
    });

    py.stderr.on("data", (chunk) => {
      console.error("Python stderr:", chunk.toString());
      stderr += chunk;
    });

    py.on("close", (code) => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        const jpgFile = filePath + ".jpg";
        if (fs.existsSync(jpgFile)) fs.unlinkSync(jpgFile);
      } catch {}

      if (code !== 0) {
        return reject(new Error(stdout || stderr || "Python script failed"));
      }

      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error("Invalid JSON from Python"));
      }
    });
  });

module.exports = { runPythonModel };
