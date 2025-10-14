const axios = require("axios");
const fs = require("fs");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();

const processVoice = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      console.log("❌ No audio file uploaded");
      return res.status(400).json({ 
        success: false, 
        message: "No audio file uploaded" 
      });
    }

    let filePath = req.file.path;
    console.log("🎤 Received audio file:", filePath);
    console.log("📊 File size:", req.file.size, "bytes");
    console.log("📝 File mimetype:", req.file.mimetype);
    console.log("📁 Original name:", req.file.originalname);

    // Check if file is too small (empty recording)
    if (req.file.size < 500) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.log("❌ File too small, likely empty recording");
      return res.status(400).json({ 
        success: false, 
        message: "Audio file too small. Please record again and speak clearly.",
        text: ""
      });
    }

    // Validate audio file format
    const allowedMimeTypes = [
      'audio/wav', 
      'audio/x-wav',
      'audio/wave',
      'audio/mpeg', 
      'audio/mp3',
      'audio/m4a', 
      'audio/x-m4a',
      'audio/mp4',
      'audio/aac',
      'audio/webm',
      'audio/ogg'
    ];

    const fileExtension = req.file.originalname.split('.').pop().toLowerCase();
    const allowedExtensions = ['wav', 'm4a', 'mp3', 'mp4', 'aac', 'webm', 'ogg'];

    if (!allowedExtensions.includes(fileExtension)) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.log("❌ Invalid file extension:", fileExtension);
      return res.status(400).json({
        success: false,
        message: `Invalid audio format. Received: ${fileExtension}. Please use WAV or M4A format.`,
        text: ""
      });
    }

    console.log("✅ File format validated:", fileExtension);

    // iOS specific: Try to detect if m4a file is corrupted
    if ((fileExtension === 'm4a' || req.file.mimetype.includes('m4a')) && req.file.size < 2000) {
      console.warn("⚠️ M4A file very small, might be corrupted. Trying anyway...");
    }

    // Check if API key exists
    if (!process.env.ASSEMBLY_API_KEY) {
      console.log("❌ AssemblyAI API key not found");
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(500).json({ 
        success: false, 
        message: "Server configuration error: API key missing",
        text: ""
      });
    }

    // Step 1: Upload audio to AssemblyAI
    console.log("⬆️ Uploading audio to AssemblyAI...");
    let audioFile;
    
    try {
      audioFile = fs.readFileSync(filePath);
    } catch (readErr) {
      console.error("❌ Error reading audio file:", readErr);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({
        success: false,
        message: "Could not read audio file. File may be corrupted.",
        text: ""
      });
    }

    if (!audioFile || audioFile.length === 0) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.log("❌ Audio file is empty");
      return res.status(400).json({ 
        success: false, 
        message: "Audio file is empty. Please record again.",
        text: ""
      });
    }

    let uploadRes;
    try {
      uploadRes = await axios.post(
        "https://api.assemblyai.com/v2/upload",
        audioFile,
        {
          headers: {
            authorization: process.env.ASSEMBLY_API_KEY,
            "transfer-encoding": "chunked",
          },
          timeout: 60000, // Increased to 60 seconds for large files
          maxContentLength: 50 * 1024 * 1024, // 50MB max
          maxBodyLength: 50 * 1024 * 1024,
        }
      );
    } catch (uploadErr) {
      console.error("❌ Upload failed:", uploadErr.message);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Check if it's a file format issue
      if (uploadErr.response?.status === 400 || uploadErr.message.includes('corrupt')) {
        return res.status(400).json({
          success: false,
          message: "Audio file format not supported or file is corrupted. Please try recording again.",
          text: ""
        });
      }
      
      throw uploadErr;
    }

    const audioUrl = uploadRes.data.upload_url;
    console.log("✅ Audio uploaded. URL:", audioUrl);

    // Step 2: Request transcription
    console.log("📝 Requesting transcription...");
    let transcriptRes;
    try {
      transcriptRes = await axios.post(
        "https://api.assemblyai.com/v2/transcript",
        { 
          audio_url: audioUrl,
          language_code: "en", // Force English for better accuracy
          punctuate: true,
          format_text: true,
          speech_threshold: 0.5, // Lower threshold for better speech detection
        },
        { 
          headers: { authorization: process.env.ASSEMBLY_API_KEY },
          timeout: 15000
        }
      );
    } catch (transcriptErr) {
      console.error("❌ Transcription request failed:", transcriptErr.message);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw transcriptErr;
    }

    const transcriptId = transcriptRes.data.id;
    console.log("✅ Transcript requested. ID:", transcriptId);

    // Step 3: Poll until transcription complete (with timeout)
    console.log("⏳ Waiting for transcription to complete...");
    let text = "";
    let pollCount = 0;
    const maxPolls = 60; // 3 minutes max (60 * 3 seconds) for longer timeout

    while (pollCount < maxPolls) {
      let polling;
      try {
        polling = await axios.get(
          `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
          { 
            headers: { authorization: process.env.ASSEMBLY_API_KEY },
            timeout: 15000
          }
        );
      } catch (pollErr) {
        console.error("❌ Polling error:", pollErr.message);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw pollErr;
      }

      console.log(`🔄 Polling status (${pollCount + 1}/${maxPolls}):`, polling.data.status);

      if (polling.data.status === "completed") {
        text = polling.data.text || "";
        console.log("✅ Transcription completed:", text);
        console.log("📊 Confidence:", polling.data.confidence);
        
        // Check if text is empty
        if (!text || text.trim() === "") {
          console.warn("⚠️ Transcription completed but text is empty");
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          return res.status(200).json({
            success: false,
            message: "No speech detected in audio. Please speak louder and clearly.",
            text: "",
          });
        }
        
        break;
      } else if (polling.data.status === "error") {
        const errorMsg = polling.data.error || "Unknown transcription error";
        console.error("❌ Transcription error:", errorMsg);
        console.error("Error details:", polling.data);
        
        // Delete file before throwing error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        
        // Check for specific error types
        if (errorMsg.includes("audio") || errorMsg.includes("codec") || errorMsg.includes("corrupt")) {
          return res.status(400).json({
            success: false,
            message: "Audio file format issue or file corrupted. Please record again.",
            text: ""
          });
        }
        
        throw new Error(errorMsg);
      }

      pollCount++;
      
      // If max polls reached
      if (pollCount >= maxPolls) {
        console.error("❌ Transcription timeout");
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(408).json({
          success: false,
          message: "Transcription took too long. Please try with a shorter recording.",
          text: ""
        });
      }

      // Wait 3 seconds before next poll
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Cleanup temporary file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("🗑️ Temporary audio file deleted:", filePath);
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: "Voice processed successfully",
      text: text.trim(),
    });

  } catch (err) {
    console.error("❌ Voice processing failed:", err.message);
    console.error("Stack trace:", err.stack);
    
    // Cleanup file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
      console.log("🗑️ Cleaned up file after error");
    }

    // Send error response
    res.status(500).json({
      success: false,
      message: "Voice processing failed. Please try again.",
      error: err.message,
      text: "",
    });
  }
};

module.exports = { processVoice };