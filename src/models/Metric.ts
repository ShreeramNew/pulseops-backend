import mongoose, { Schema, Document } from "mongoose";

export interface IMetric extends Document {
  cpuUsagePercentage: number;
  memoryUsageMB: number;
  uptimeSeconds: number;
  // 🔥 New persistent APM fields:
  totalRequests: number;
  avgLatencyMs: number;
  errorRatePercentage: number;
  timestamp: Date;
}

const MetricSchema: Schema = new Schema({
  cpuUsagePercentage: { type: Number, required: true },
  memoryUsageMB: { type: Number, required: true },
  uptimeSeconds: { type: Number, required: true },
  // 🔥 Mapped definitions for timeline visualization:
  totalRequests: { type: Number, required: true },
  avgLatencyMs: { type: Number, required: true },
  errorRatePercentage: { type: Number, required: true },

  // 🛡️ THE STORAGE SHIELD: Automatically purges data older than 24 hours (86400 seconds)
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 86400,
  },
});

export default mongoose.model<IMetric>("Metric", MetricSchema);
