import mongoose, { Schema, Document } from "mongoose";

export interface IMetric extends Document {
  cpuUsagePercentage: number;
  memoryUsageMB: number;
  uptimeSeconds: number;
  timestamp: Date;
}

const MetricSchema: Schema = new Schema({
  cpuUsagePercentage: { type: Number, required: true },
  memoryUsageMB: { type: Number, required: true },
  uptimeSeconds: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true } // Indexing ensures lightning fast historical queries!
});

export default mongoose.model<IMetric>("Metric", MetricSchema);