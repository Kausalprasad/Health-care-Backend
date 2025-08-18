const axios = require("axios");

const getSymptomPrediction = async (symptoms) => {
  try {
    const response = await axios.post("http://localhost:5001/predict-symptom", {
      symptoms,
    });
    return response.data;
  } catch (error) {
    console.error("Error calling Python API:", error.message);
    throw error;
  }
};

module.exports = { getSymptomPrediction };
