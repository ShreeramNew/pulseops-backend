import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";

import { connectDB } from "./config/db.js"; // Import Database configuration
import { initWebSocketServer } from "./websocket/socketHandler.js";
import analyticsRouter from "./routes/analytics.js"; // Your historical route



const app = express();
const httpServer = createServer(app);

// Initialize Database connection before handling listeners
connectDB();

app.use(express.json());
app.use("/api/analytics", analyticsRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "PulseOps Engine Online" });
});

initWebSocketServer(httpServer);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 PulseOps Backend Gateway successfully running on port ${PORT}`);
});