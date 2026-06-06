import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connStr = process.env.MONGO_URI || "mongodb://localhost:27017/pulseops";
    await mongoose.connect(connStr);
    console.log("💾 PulseOps DB: MongoDB Connection Established Successfully");
  } catch (error: any) {
    console.error("❌ MongoDB Connection Fault:", error.message);
    process.exit(1); // Crash the process immediately if the primary database is unreachable
  }
};