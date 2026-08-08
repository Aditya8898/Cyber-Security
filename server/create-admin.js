import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./src/models/User.js";

dotenv.config();

const createAdmin = async () => {
  const email = process.argv[2] || "admin@cep.com";
  const password = process.argv[3] || "admin1234";
  const name = process.argv[4] || "CEP Administrator";

  if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI is not set in your .env file.");
    process.exit(1);
  }

  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      console.log(`User ${email} already exists. Promoting to admin...`);
      existingUser.role = "admin";
      await existingUser.save();
      console.log("User successfully promoted to administrator.");
    } else {
      if (password.length < 8) {
        console.error("Error: Password must be at least 8 characters long.");
        process.exit(1);
      }
      
      console.log(`Creating new admin user: ${email}...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: "admin",
        isVerified: true,
        isActive: true
      });
      console.log("Admin account successfully created.");
    }

    console.log("\nAdmin login credentials:");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    
  } catch (err) {
    console.error("Operation failed:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

createAdmin();
