const { getAIAdvice } = require("../services/aiDoctor.service");

async function getAdvice(req, res) {
    try {
        const { symptoms, age_group, gender, medical_conditions } = req.body;
        const advice = await getAIAdvice(symptoms, age_group, gender, medical_conditions || []);
        res.json(advice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = { getAdvice };
