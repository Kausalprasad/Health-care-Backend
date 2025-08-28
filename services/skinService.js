const axios = require("axios");

const analyzeSkinService = async (base64Image) => {
  try {
    const response = await axios({
      method: "POST",
      url: `https://detect.roboflow.com/${process.env.ROBOFLOW_MODEL}/${process.env.ROBOFLOW_VERSION}`,
      params: { api_key: process.env.ROBOFLOW_API_KEY },
      data: base64Image, // raw base64 string
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // Correct path to predictions
    if (!response.data?.predictions) {
      console.error("Invalid response from Roboflow:", response.data);
      throw new Error("No predictions returned from Roboflow");
    }

    const predictions = response.data.predictions;

    // Max confidence extraction
    const maxPrediction = Object.entries(predictions).reduce(
      (max, [key, value]) =>
        value.confidence > max.confidence ? { class: key, confidence: value.confidence } : max,
      { class: null, confidence: 0 }
    );

    return maxPrediction;

  } catch (err) {
    console.error(err.response?.data || err.message);
    throw new Error(err.response?.data?.error || "Failed to analyze skin image");
  }
};

module.exports = { analyzeSkinService };
