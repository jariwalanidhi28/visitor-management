require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");

const seedAdminOnly = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/visitor_management"
    );
    console.log("Connected to MongoDB...");

    let admin = await User.findOne({ email: "admin@visitor.local" });
    if (!admin) {
      const passwordHash = await User.hashPassword("Admin@123456");
      admin = await User.create({
        name: "System Administrator",
        employeeId: "EMP000",
        email: "admin@visitor.local",
        mobile: "+91 9999999990",
        department: "Administration",
        designation: "Principal Admin",
        passwordHash,
        role: "admin",
        isActive: true,
      });
      console.log("✓ Created Admin: admin@visitor.local / Admin@123456");
    } else {
      console.log("ℹ Admin already exists: admin@visitor.local");
    }

    process.exit(0);
  } catch (err) {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  }
};

seedAdminOnly();
