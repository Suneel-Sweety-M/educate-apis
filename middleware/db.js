import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const dbConnection = async () => {
  try {
    const connection = await mongoose.connect(process.env.DB_URL);
    console.log("✅ DB Connected Successfully!");
  } catch (error) {
    console.log("❌ DB Error: " + error.message);
  }
};

export default dbConnection;
