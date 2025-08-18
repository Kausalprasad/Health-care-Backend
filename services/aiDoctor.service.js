const { spawn } = require("child_process");
const path = require("path");

function getAIAdvice(symptoms, age_group, gender, medical_conditions) {
    return new Promise((resolve, reject) => {
       const pythonProcess = spawn("python", [

            path.join(__dirname, "../python/ai_doctor.py"),
            symptoms,
            age_group,
            gender,
            medical_conditions.join(",")
        ]);

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`Python error: ${errorOutput}`));
            } else {
                try {
                    resolve(JSON.parse(output));
                } catch (err) {
                    reject(err);
                }
            }
        });
    });
}

module.exports = { getAIAdvice };
