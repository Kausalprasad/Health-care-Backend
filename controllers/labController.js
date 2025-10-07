const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const LabResult = require('../models/LabResult');

// POST -> Analyze & Save Lab Result
const analyzeLab = async (req, res) => {
  console.log('📁 Lab analysis request received');

  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!req.user?.uid) return res.status(401).json({ error: "Unauthorized: No user UID" });

  const filePath = path.join(process.cwd(), req.file.path);
  console.log(`📄 Processing file: ${filePath}`);

  if (!fs.existsSync(filePath)) return res.status(400).json({ error: "File not found" });

  const pythonProcess = execFile(
    'python',
    ['./python/models/lab/lab.py', filePath],
    { timeout: 120000, maxBuffer: 1024 * 1024 * 10 },
    async (error, stdout, stderr) => {
      if (stderr) console.error('🐍 Python stderr:', stderr);
      if (stdout) console.log('🐍 Python stdout preview:', stdout.substring(0, 200) + '...');

      // Cleanup temporary file
      try { fs.unlinkSync(filePath); console.log('🗑️ Temporary file cleaned up'); } 
      catch (cleanupError) { console.warn('⚠️ Could not clean up file:', cleanupError.message); }

      if (error) return res.status(500).json({ error: `Command failed: ${error.message}`, details: stderr || 'No details' });

      try {
        let data = JSON.parse(stdout);

        // Remove file_info from Python output
        if (data.file_info) delete data.file_info;

        const labResult = new LabResult({
          userId: req.user.uid,        // ✅ Firebase UID
          fileName: req.file.originalname,
          result: data
        });

        await labResult.save();
        console.log('✅ Lab analysis saved to DB');
        res.json({ success: true, labResult });

      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError.message);
        res.status(500).json({ error: "Failed to parse Python script output", details: parseError.message, rawOutput: stdout });
      }
    }
  );

  pythonProcess.on('timeout', () => {
    console.error('⏰ Python script timed out');
    res.status(408).json({ error: "Processing timeout" });
  });
};

// GET -> Fetch All Lab Results for Logged-in User
const getLabResults = async (req, res) => {
  if (!req.user?.uid) return res.status(401).json({ error: "Unauthorized: No user UID" });
  try {
    const results = await LabResult.find({ userId: req.user.uid }).sort({ createdAt: -1 });
    res.json({ success: true, results });
  } catch (err) {
    console.error('❌ Error fetching lab results:', err.message);
    res.status(500).json({ error: "Failed to fetch lab results" });
  }
};

module.exports = { analyzeLab, getLabResults };
