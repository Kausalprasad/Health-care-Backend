const skinErrorHandler = (err, req, res, next) => {
  console.error("❌ Skin Module Error:", err.message);

  res.status(err.statusCode || 500).json({
    module: "skin",
    success: false,
    message: err.message || "Internal Server Error in Skin Module",
  });
};

module.exports = skinErrorHandler;
