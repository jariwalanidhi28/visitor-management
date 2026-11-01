require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const exportData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/visitor_management"
    );
    console.log("Connected to MongoDB for export...");

    const backupDir = path.join(__dirname, "../../data-backup");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const collections = ["users", "destinations", "attendances", "systemsettings", "auditlogs"];
    for (const name of collections) {
      try {
        const docs = await mongoose.connection.db.collection(name).find().toArray();
        fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(docs, null, 2));
        console.log(`✓ Exported ${name}: ${docs.length} records`);
      } catch (e) {
        console.log(`ℹ Skipped ${name}: ${e.message}`);
      }
    }

    console.log("\nDatabase export completed! Saved to backend/data-backup/");
    process.exit(0);
  } catch (err) {
    console.error("Export error:", err);
    process.exit(1);
  }
};

exportData();
