// routes/activityRoutes.js
const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const { authMiddleware } = require("./auth.js"); // reuse your middleware

// ✅ Save completed activity
router.post("/complete", authMiddleware, async (req, res) => {
  console.log("Completed");
  try {
    const { activityKey, title, response } = req.body;

    if (!activityKey || !title) {
      return res.status(400).json({ message: "Missing activityKey or title" });
    }

    const log = new ActivityLog({
      user: req.user.id,
      activityKey,
      title,
      response: response || null,
    });

    await log.save();
    res.status(201).json({ message: "Activity saved", log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get today’s activities
router.get("/today", authMiddleware, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await ActivityLog.find({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ completedAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get activity history
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const logs = await ActivityLog.find({ user: req.user.id })
      .sort({ completedAt: -1 })
      .limit(50);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
