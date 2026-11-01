require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const importData = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/visitor_management"
    );
    console.log("Connected to MongoDB for import...");

    const backupDir = path.join(__dirname, "../../data-backup");
    if (!fs.existsSync(backupDir)) {
      console.log("No data-backup folder found. Running default seed instead...");
      require("./seed");
      return;
    }

    const collections = ["users", "destinations", "attendances", "systemsettings", "auditlogs"];
    for (const name of collections) {
      const filePath = path.join(backupDir, `${name}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const docs = JSON.parse(raw);
        if (Array.isArray(docs) && docs.length > 0) {
          // Clean converted ObjectIds
          const cleanDocs = docs.map((d) => {
            if (d._id && typeof d._id === "string") {
              d._id = new mongoose.Types.ObjectId(d._id);
            }
            return d;
          });

          await mongoose.connection.db.collection(name).deleteMany({});
          await mongoose.connection.db.collection(name).insertMany(cleanDocs);
          console.log(`✓ Imported ${name}: ${cleanDocs.length} records`);
        }
      }
    }

    console.log("\nDatabase restored successfully on this device!");
    process.exit(0);
  } catch (err) {
    console.error("Import error:", err);
    process.exit(1);
  }
};

importData();
