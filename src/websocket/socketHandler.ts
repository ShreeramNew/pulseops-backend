import { Server } from "http";
import WebSocket, { WebSocketServer } from "ws";
import axios from "axios";
import { GoogleGenAI } from "@google/genai";
import Metric from "./../models/Metric.js";

const connectedClients = new Set<WebSocket>();

const TARGET_APP_URL = process.env.TARGET_APP_URL || "";

let lastSeenLogCount = 0;

export const initWebSocketServer = (httpServer: Server): WebSocketServer => {
  const wss = new WebSocketServer({ server: httpServer });
  wss.on("connection", (ws: WebSocket) => {
    console.log("🔌 New browser client connected to secure stream pool");
    connectedClients.add(ws);

    // 🚀 QUICK FIX: Send an immediate welcome frame to verify data flows instantly!
    ws.send(JSON.stringify({ type: "metrics", data: { ping: "pong" } }));

    ws.on("close", () => {
      console.log("❌ Client disconnected");
      connectedClients.delete(ws);
    });

    ws.on("error", () => connectedClients.delete(ws));
  });

  startTelemetryScraper();
  return wss;
};

export const broadcastTelemetry = (
  type: "metrics" | "logs" | "ai-diagnosis",
  data: any,
) => {
  const payload = JSON.stringify({ type, data, time: new Date() });
  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  }
};

const startTelemetryScraper = () => {
  setInterval(async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const [metricsRes, logsRes] = await Promise.all([
        axios.get(`${TARGET_APP_URL}/api/metrics`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        }),
        axios.get(`${TARGET_APP_URL}/api/logs`, {
          headers: { "ngrok-skip-browser-warning": "true" },
        }),
      ]);

      // 1. Process Metrics
      if (metricsRes.data.success) {
        // ✅ Updated: Destructure the dynamic 'routes' array alongside global vitals
        const {
          cpuUsagePercentage,
          memoryUsageMB,
          uptimeSeconds,
          totalRequests,
          avgLatencyMs,
          errorRatePercentage,
          routes, // ◄ Real-time Redis Hash matrix
        } = metricsRes.data.metrics;

        // ✅ Save the complete infrastructure profiling record straight into MongoDB
        await Metric.create({
          cpuUsagePercentage,
          memoryUsageMB,
          uptimeSeconds,
          totalRequests,
          avgLatencyMs,
          errorRatePercentage,
          routes: routes || [], // Fallback to an empty list to keep casting structures clean
          timestamp: new Date(),
        });

        // Broadcast the metrics block down the live client pipeline websocket pool
        if (connectedClients.size > 0)
          broadcastTelemetry("metrics", metricsRes.data.metrics);

        // 🚨 Danger Zone Check: CPU Spike Warning
        if (cpuUsagePercentage > 85.0) {
          const { checkAndSendAlert } =
            await import("../services/alertMailer.js");
          checkAndSendAlert(
            `High CPU Utilization Spike: ${cpuUsagePercentage}%`,
            `The live Node process has exceeded the 85% safe operation threshold. Current RAM Allocation: ${memoryUsageMB} MB. Total Requests Handled: ${totalRequests}.`,
          );
        }

        // 🚨 Danger Zone Check: Error Surge Alert (>5% of traffic failing)
        if (errorRatePercentage > 5.0 && totalRequests > 10) {
          const { checkAndSendAlert } =
            await import("../services/alertMailer.js");
          checkAndSendAlert(
            `High Application Error Rate: ${errorRatePercentage}%`,
            `Out of ${totalRequests} total requests, the server error generation threshold has breached safe limits. Immediate system inspection recommended.`,
          );
        }
      }

      // 2. Process Logs & AI Alerting Pipeline
      if (logsRes.data.success) {
        const { logs, linesCount } = logsRes.data;

        if (connectedClients.size > 0) broadcastTelemetry("logs", logs);

        if (
          linesCount > 0 &&
          linesCount !== lastSeenLogCount &&
          !logs[0].includes("No error logs found")
        ) {
          lastSeenLogCount = linesCount;
          const rawErrorContext = logs.slice(-15).join("\n");

          const aiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `You are an expert DevOps AI agent. Analyze this production stack trace. Output exactly a 2-line response:\nLine 1: Identify the root cause and specify the file name and line number.\nLine 2: Provide a brief recommendation or code fix to resolve the error.\n\nTrace:\n${rawErrorContext}`,
          });

          if (aiResponse.text) {
            const { checkAndSendAlert } =
              await import("../services/alertMailer.js");
            const trimmedDiagnosis = aiResponse.text.trim();
            if (connectedClients.size > 0)
              broadcastTelemetry("ai-diagnosis", trimmedDiagnosis);

            // 🚨 Danger Zone Check: Real-time Application Crash/Fault Alert with AI resolution
            checkAndSendAlert(
              "Mongoose/Runtime Exception Detected in Stream Log",
              `An active error string was captured in the standard log payload.\n\n[Gemini Flash Diagnostics Summary]:\n${trimmedDiagnosis}\n\n[Raw Trace Snippet]:\n${rawErrorContext}`,
            );
          }
        }
      }
    } catch (error: any) {
      console.error("Telemetry scrape loop failed:", error.message);
    }
  }, 3000);
};
