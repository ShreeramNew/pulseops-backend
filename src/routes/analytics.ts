import express from "express";
import Metric from "./../models/Metric.js";

const router = express.Router();

// GET /api/analytics/history
router.get("/history", async (req, res) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // MAANG Optimization: .lean() trims internal hydration overhead for rapid payload parsing
    const historicalData = await Metric.find({
      timestamp: { $gte: twentyFourHoursAgo }
    })
    // ✅ Updated field projection map to include the new APM data fields
    .select("cpuUsagePercentage memoryUsageMB totalRequests avgLatencyMs errorRatePercentage timestamp -_id")
    .sort({ timestamp: 1 })
    .lean(); // ◄ Essential portfolio architecture choice!

    return res.status(200).json({
      success: true,
      count: historicalData.length,
      data: historicalData
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;