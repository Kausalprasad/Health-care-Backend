const { MongoClient } = require("mongodb");

async function startWatcher() {
  const client = new MongoClient(process.env.MONGO_URI);

  try {
    await client.connect();
    console.log("👀 Watcher connected to MongoDB");

    const db = client.db(process.env.DB_NAME);
    console.log("📂 Using DB:", process.env.DB_NAME);

    const collection = db.collection(process.env.COLLECTION);
    console.log("📑 Watching Collection:", process.env.COLLECTION);

    const changeStream = collection.watch();
    console.log("👂 Change stream started...");

    changeStream.on("change", async (change) => {
      console.log("🔄 Change detected:", change);
    });
  } catch (err) {
    console.error("❌ Watcher Error:", err.message);
  }
}

module.exports = startWatcher;
