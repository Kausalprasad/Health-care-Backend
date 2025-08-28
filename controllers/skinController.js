const { analyzeSkinService } = require("../services/skinService");

const analyzeSkin = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image uploaded" });
    }

    // Convert buffer to base64 string correctly
    let base64Image = req.file.buffer.toString("base64");

    // Remove any whitespace/newlines
    base64Image = base64Image.replace(/\r?\n|\r/g, "");

    // Call service
    const result = await analyzeSkinService(base64Image);

    res.json({
      message: "Skin analysis completed successfully",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { analyzeSkin };
