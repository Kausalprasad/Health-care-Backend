// controllers/moodController.js
const Mood = require("../models/Mood");

const saveMood = async (req, res) => {
  try {
    const uid = req.user.uid; // middleware se UID
    const { emotion, label, color } = req.body;
    const today = new Date().toISOString().split("T")[0];

    const moodData = {
      uid,
      date: today,
      emotion,
      label,
      color,
    };

    const mood = await Mood.findOneAndUpdate(
      { uid, date: today },
      moodData,
      { upsert: true, new: true }
    );

    res.json({ success: true, message: "Mood saved", mood });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to save mood" });
  }
};

// const getMoods = async (req, res) => {
//   try {
//     const uid = req.user.uid;
//     const moods = await Mood.find({ uid }).sort({ date: 1 });
//     res.json({ success: true, moods });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Failed to fetch moods" });
//   }
// };
const getMoods = async (req, res) => {
  console.log("GET /mood/calendar hit by UID:", req.user.uid);
  const uid = req.user.uid;
  const moods = await Mood.find({ uid }).sort({ date: 1 });
  res.json({ success: true, moods });
};

module.exports = { saveMood, getMoods };
