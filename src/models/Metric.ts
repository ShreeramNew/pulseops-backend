import mongoose, { Schema, Document } from "mongoose";

// 🚀 1. Define the interface for the route breakdown objects
export interface IRouteProfile {
  method: string;
  path: string;
  hits: number;
  latencyMs: number;
}

export interface IMetric extends Document {
  cpuUsagePercentage: number;
  memoryUsageMB: number;
  uptimeSeconds: number;
  totalRequests: number;
  avgLatencyMs: number;
  errorRatePercentage: number;
  routes: IRouteProfile[]; // 🔥 Added to store the live route array frame
  timestamp: Date;
}

// 🎛️ 2. Sub-document Schema for route statistics
const RouteProfileSchema: Schema = new Schema({
  method: { type: String, required: true },
  path: { type: String, required: true },
  hits: { type: Number, required: true },
  latencyMs: { type: Number, required: true }
}, { _id: false }); // Disable automatic _id generation for nested arrays to optimize storage allocation

const MetricSchema: Schema = new Schema({
  cpuUsagePercentage: { type: Number, required: true },
  memoryUsageMB: { type: Number, required: true },
  uptimeSeconds: { type: Number, required: true },
  totalRequests: { type: Number, required: true },
  avgLatencyMs: { type: Number, required: true },
  errorRatePercentage: { type: Number, required: true },
  
  // ✅ Nested payload array structure ensures pixel-perfect historical route snapshots
  routes: [RouteProfileSchema],

  // 🛡️ THE STORAGE SHIELD: Automatically purges data older than 24 hours (86400 seconds)
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
    expires: 86400,
  },
});

export default mongoose.model<IMetric>("Metric", MetricSchema);