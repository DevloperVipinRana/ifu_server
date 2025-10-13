const express = require('express');
const router = express.Router();
const DailyGoal = require('../models/DailyGoal');
const {authMiddleware} = require('./auth'); // use default export if you did module.exports = authMiddleware

// ✅ Add a daily goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const dailyGoal = new DailyGoal({ user: req.user.id, text });
    await dailyGoal.save();
    res.status(201).json(dailyGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get today’s daily goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyGoals = await DailyGoal.find({
      user: req.user.id,
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json(dailyGoals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Toggle complete
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const dailyGoal = await DailyGoal.findOne({ _id: req.params.id, user: req.user.id });
    if (!dailyGoal) return res.status(404).json({ error: 'DailyGoal not found' });

    dailyGoal.completed = !dailyGoal.completed;
    await dailyGoal.save();
    res.json(dailyGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete daily goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const dailyGoal = await DailyGoal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!dailyGoal) return res.status(404).json({ error: 'DailyGoal not found' });
    res.json({ message: 'DailyGoal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get completed daily goals count
router.get('/completed/count', authMiddleware, async (req, res) => {
  try {
    const count = await DailyGoal.countDocuments({
      user: req.user.id,
      completed: true,
    });
    res.json({ completedCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
