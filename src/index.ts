import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import { initWebSocketServer } from "./websocket/socketHandler.js";
import { startTelemetrySimulation } from "./simulator/agent.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// A simple health check endpoint for our API
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date() });
});

// We create an HTTP server wrapping our express instance
// This allows both Express REST routes and WebSockets to share the same port
const server = http.createServer(app);

// Initialize our WebSocket layer on top of the native server
initWebSocketServer(server);

server.listen(port, () => {
  console.log(`🚀 PulseOps Telemetry Engine running on port ${port}`);
  // Start the background data generator loop
  startTelemetrySimulation();
});
