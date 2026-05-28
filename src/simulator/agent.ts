import { broadcastTelemetry } from "../websocket/socketHandler.js";

/**
 * Helper function to simulate realistic, smooth fluctuations in numbers.
 * Instead of jumping randomly from 10% to 90%, it drifts naturally up or down.
 */
const fluctuate = (
  current: number,
  min: number,
  max: number,
  maxStep = 5,
): number => {
  const change = (Math.random() * 2 - 1) * maxStep;
  let next = current + change;

  // Guard rails to keep metrics within absolute boundaries
  if (next < min) next = min;
  if (next > max) next = max;

  return Math.round(next * 100) / 100;
};

/**
 * This activates our background background loops to generate mock telemetry traffic
 */
export const startTelemetrySimulation = () => {
  let currentCpu = 45.0;
  let currentMemory = 3.8; // GBs currently allocated
  const totalMemory = 8.0;

  console.log("🤖 Background Telemetry Agent activated and streaming...");

  // LOOP 1: High-Frequency System Vitals Stream (Every 500ms)
  setInterval(() => {
    currentCpu = fluctuate(currentCpu, 15, 95, 4);
    currentMemory = fluctuate(currentMemory, 2.5, 7.2, 0.2);
    const latency = Math.round(fluctuate(45, 15, 350, 25));

    // Broadcast the metrics down our open WebSocket pipeline
    broadcastTelemetry("metrics", {
      cpu: currentCpu,
      memory: {
        used: currentMemory,
        total: totalMemory,
        percentage: Math.round((currentMemory / totalMemory) * 100),
      },
      latency: latency,
      status:
        currentCpu > 85 ? "CRITICAL" : currentCpu > 70 ? "WARNING" : "HEALTHY",
    });
  }, 500);

  // LOOP 2: Periodic Runtime Exception Logs (Every 12 seconds)
  const mockErrors = [
    {
      error:
        "MongooseError: Connection timeout to MongoDB Atlas cluster at cluster0.x9j2a.mongodb.net",
      level: "error",
    },
    {
      error:
        "JsonWebTokenError: jwt malformed or signature verification failed",
      level: "warning",
    },
    {
      error:
        'TypeError: Cannot read properties of undefined (reading "map") at CategoryList.tsx:42',
      level: "error",
    },
    {
      error:
        "AxiosError: Request failed with status code 502 (Bad Gateway) at payment-gateway/charge",
      level: "critical",
    },
  ];

  setInterval(() => {
    const randomIndex = Math.floor(Math.random() * mockErrors.length);
    const errorPayload = mockErrors[randomIndex];

    if (errorPayload) {
      broadcastTelemetry("logs", {
        id: crypto.randomUUID(),
        message: errorPayload.error,
        level: errorPayload.level,
        service: "api-gateway",
      });
    }
  }, 12000);
};
