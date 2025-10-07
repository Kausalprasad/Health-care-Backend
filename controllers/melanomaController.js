// malanomController.js

exports.status = (req, res) => {
  res.json({
    message: "✅ Melanoma AI Service is running",
    websocket: "ws://169.254.76.211:8080" // tera local IP
  });
};
