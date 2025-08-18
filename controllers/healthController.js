const HealthData = require("../models/HealthData");

exports.addHealthData = async (req, res) => {
  try {
    const newData = new HealthData({
      userId: req.user.uid,
      ...req.body
    });
    await newData.save();
    res.status(201).json({ message: "Health data added successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.getHealthData = async (req, res) => {
  try {
    const data = await HealthData.find({ userId: req.user.uid }).sort({ date: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
