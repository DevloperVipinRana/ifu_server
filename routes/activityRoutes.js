// routes/activityRoutes.js
const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const { authMiddleware } = require("./auth.js"); // reuse your middleware

// ✅ Save completed activity
router.post("/complete", authMiddleware, async (req, res) => {
  console.log("✅ Activity completion request received:", req.body);
  try {
    const { activityKey, title, response, feedback } = req.body;

    if (!activityKey || !title) {
      console.log("❌ Missing required fields:", { activityKey, title });
      return res.status(400).json({ message: "Missing activityKey or title" });
    }

    const logData = {
      user: req.user.id,
      activityKey,
      title,
      response: response || null,
    };

    // Add feedback data if provided
    if (feedback) {
      logData.feedback = {
        type: feedback.type,
        value: feedback.value,
        emoji: feedback.emoji,
        label: feedback.label
      };
    }

    const log = new ActivityLog(logData);
    await log.save();
    console.log("✅ Activity saved successfully:", log);
    res.status(201).json({ message: "Activity saved", log });
  } catch (err) {
    console.error("❌ Error saving activity:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update activity feedback
router.post("/update-feedback", authMiddleware, async (req, res) => {
  console.log("✅ Feedback update request received:", req.body);
  try {
    const { activityKey, title, feedback } = req.body;

    if (!activityKey || !title) {
      console.log("❌ Missing required fields for feedback update:", { activityKey, title });
      return res.status(400).json({ message: "Missing activityKey or title" });
    }

    // Find the most recent activity log for this user and activity
    const log = await ActivityLog.findOne({
      user: req.user.id,
      activityKey,
      title
    }).sort({ completedAt: -1 });

    if (!log) {
      console.log("❌ Activity not found for feedback update:", { activityKey, title, userId: req.user.id });
      return res.status(404).json({ message: "Activity not found" });
    }

    // Update the feedback
    log.feedback = {
      type: feedback.type,
      value: feedback.value,
      emoji: feedback.emoji,
      label: feedback.label
    };

    await log.save();
    console.log("✅ Feedback updated successfully:", log);
    res.json({ message: "Feedback updated", log });
  } catch (err) {
    console.error("❌ Error updating feedback:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get today's activities
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
