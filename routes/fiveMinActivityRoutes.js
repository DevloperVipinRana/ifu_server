// routes/fiveMinActivityRoutes.js
const express = require("express");
const router = express.Router();
const FiveMinActivityLog = require("../models/FiveMinActivityLog");
const { authMiddleware } = require("./auth");

// ✅ Log a completed 5-min activity
router.post("/log", authMiddleware, async (req, res) => {
  try {
    const { activityKey, title } = req.body;

    const newLog = new FiveMinActivityLog({
      user: req.user.id,
      activityKey,
      title,
    });

    await newLog.save();
    res.status(201).json(newLog);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get all logs of current user
router.get("/logs", authMiddleware, async (req, res) => {
  try {
    const logs = await FiveMinActivityLog.find({ user: req.user.id }).sort({ completedAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
