const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

// 🩺 Text-based prediction
const predictSymptoms = async (req, res) => {
  try {
    const { symptoms, age, gender } = req.body;
    if (!symptoms || symptoms.trim() === "") {
      return res.status(400).json({ error: "Symptoms are required" });
    }

    // Call Flask text endpoint with age & gender
    const flaskResponse = await axios.post("http://127.0.0.1:5001/predict-symptom", {
      symptoms,
      age,
      gender
    });

    res.json(flaskResponse.data);
  } catch (error) {
    console.error("Error predicting symptoms:", error.message);
    res.status(500).json({ error: "Error predicting symptoms" });
  }
};

// 🎤 Voice-based prediction
const predictSymptomsFromVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const { age, gender } = req.body; // age & gender from frontend

    // Prepare form-data for Flask
    const form = new FormData();
    form.append("file", fs.createReadStream(req.file.path), req.file.originalname);
    if (age) form.append("age", age);
    if (gender) form.append("gender", gender);

    // Call Flask voice endpoint
    const flaskResponse = await axios.post("http://127.0.0.1:5001/predict-audio", form, {
      headers: form.getHeaders(),
    });

    fs.unlinkSync(req.file.path); // Cleanup

    res.json(flaskResponse.data);
  } catch (error) {
    console.error("Error predicting symptoms from voice:", error.message);
    res.status(500).json({ error: "Voice prediction failed" });
  }
};

module.exports = { predictSymptoms, predictSymptomsFromVoice };
