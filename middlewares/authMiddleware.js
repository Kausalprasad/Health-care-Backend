const admin = require("firebase-admin");
const serviceAccount = require("../firebase-service-account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "No Authorization header provided" });
    }

    // Token ko safely parse karo
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ error: "Invalid token format. Use 'Bearer <TOKEN>'" });
    }

    // Token verify karo
    const decodedValue = await admin.auth().verifyIdToken(token);

    // decoded token ko req.user me attach karo
    req.user = decodedValue;

    console.log("Token verified for UID:", decodedValue.uid); // Debug

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;


// const admin = require("firebase-admin");
// const serviceAccount = require("../firebase-service-account.json");

// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
// }

// const authMiddleware = async (req, res, next) => {
//   // ✅ 1. Dev bypass globally
//   if (process.env.BYPASS_AUTH === "true" || req.skipAuth) {
//     console.warn("⚠️ Authentication skipped (dev mode or route-level bypass)");
//     req.user = { uid: "dev-user" }; // dummy user
//     return next();
//   }

//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//       return res.status(401).json({ error: "No Authorization header provided" });
//     }

//     const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
//     if (!token) {
//       return res.status(401).json({ error: "Invalid token format. Use 'Bearer <TOKEN>'" });
//     }

//     const decodedValue = await admin.auth().verifyIdToken(token);
//     req.user = decodedValue;
//     console.log("Token verified for UID:", decodedValue.uid);

//     next();
//   } catch (error) {
//     console.error("Token verification error:", error.message);
//     return res.status(401).json({ error: "Invalid or expired token" });
//   }
// };

// module.exports = authMiddleware;
