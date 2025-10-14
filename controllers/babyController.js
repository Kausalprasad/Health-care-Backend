const { spawn } = require("child_process");

// Logs helper
const log = (message, data) => {
    console.log(`🟢 [BabyController] ${message}`, data || "");
};

exports.getRecommendations = (req, res) => {
    log("Request received", req.body);

    const babyData = req.body;

    const pythonProcess = spawn(
        "python",
        ["./python/models/baby_recommender/recommend.py", JSON.stringify(babyData)],
        { env: { ...process.env } } // Ensure GROQ_API_KEY is passed
    );

    let resultData = "";

    pythonProcess.stdout.on("data", (data) => {
        resultData += data.toString();
    });

    pythonProcess.stderr.on("data", (err) => {
        log("Python error:", err.toString());
    });

    pythonProcess.on("close", (code) => {
        log(`Python process exited with code ${code}`);

        try {
            const result = JSON.parse(resultData);
            res.status(200).json(result);
        } catch (err) {
            log("Error parsing Python response:", err.message);
            res.status(500).json({
                status: "error",
                error_message: "Failed to parse Python response",
                error_type: err.name
            });
        }
    });
};
