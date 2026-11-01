require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Destination = require("../models/Destination");

const seedDatabase = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/visitor_management"
    );
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Administrator
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
      console.log("✓ Created Initial Admin: admin@visitor.local / Admin@123456");
    } else {
      console.log("ℹ Admin already exists: admin@visitor.local");
    }

    // 2. Seed Default Destinations
    const defaultDestinations = [
      {
        name: "Headquarters - Tech Park",
        address: "Block A, Cyber Gateway, Outer Ring Road",
        city: "Bangalore",
        state: "Karnataka",
        latitude: 12.9716,
        longitude: 77.5946,
        radiusMeters: 250,
        description: "Primary Corporate Headquarters and Executive Offices",
      },
      {
        name: "Downtown Service Center",
        address: "7th Cross, Central Business District",
        city: "Bangalore",
        state: "Karnataka",
        latitude: 12.9352,
        longitude: 77.6245,
        radiusMeters: 200,
        description: "Client Servicing and Regional Meeting Point",
      },
      {
        name: "Northern Logistics Hub",
        address: "Plot 42, Industrial Development Corridor",
        city: "Bangalore",
        state: "Karnataka",
        latitude: 13.0358,
        longitude: 77.597,
        radiusMeters: 500,
        description: "Logistics and Hardware Inspection Warehouse",
      },
    ];

    for (const destData of defaultDestinations) {
      const exists = await Destination.findOne({ name: destData.name });
      if (!exists) {
        await Destination.create({
          ...destData,
          isActive: true,
          createdBy: admin._id,
        });
        console.log(`✓ Created Destination: ${destData.name}`);
      }
    }

    // 3. Seed Sample Employee
    const sampleEmp = await User.findOne({ email: "john@visitor.local" });
    if (!sampleEmp) {
      const passwordHash = await User.hashPassword("User@123456");
      await User.create({
        name: "John Doe",
        employeeId: "EMP001",
        email: "john@visitor.local",
        mobile: "+91 9888888880",
        department: "Field Engineering",
        designation: "Site Inspector",
        passwordHash,
        role: "user",
        isActive: true,
      });
      console.log("✓ Created Sample User: john@visitor.local / User@123456");
    }

    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
};

seedDatabase();
