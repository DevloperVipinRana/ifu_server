const express = require('express');
const router = express.Router();
const WeeklyGoal = require('../models/WeeklyGoal'); // we'll create this schema
const { authMiddleware } = require('./auth');

// Helper to get start & end of current week
const getCurrentWeekRange = () => {
  const now = new Date();
  const firstDayOfWeek = new Date(now);
  firstDayOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  firstDayOfWeek.setHours(0, 0, 0, 0);

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6); // Saturday
  lastDayOfWeek.setHours(23, 59, 59, 999);

  return { start: firstDayOfWeek, end: lastDayOfWeek };
};

// ✅ Add a new weekly goal
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { text, progress = 0 } = req.body;
    const { start } = getCurrentWeekRange();

    const weeklyGoal = new WeeklyGoal({
      user: req.user.id,
      text,
      progress,
      completed: progress === 100,
      weekStart: start,
    });

    await weeklyGoal.save();
    res.status(201).json(weeklyGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get this week's goals
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { start, end } = getCurrentWeekRange();

    const weeklyGoals = await WeeklyGoal.find({
      user: req.user.id,
      // weekStart: start,
      weekStart: { $gte: start, $lte: end },
    });

    res.json(weeklyGoals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update goal text or progress
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { text, progress } = req.body;

    const weeklyGoal = await WeeklyGoal.findOne({ _id: req.params.id, user: req.user.id });
    if (!weeklyGoal) return res.status(404).json({ error: 'WeeklyGoal not found' });

    if (text !== undefined) weeklyGoal.text = text;
    if (progress !== undefined) weeklyGoal.progress = progress;
    weeklyGoal.completed = weeklyGoal.progress === 100;

    await weeklyGoal.save();
    res.json(weeklyGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Toggle completed manually
router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const weeklyGoal = await WeeklyGoal.findOne({ _id: req.params.id, user: req.user.id });
    if (!weeklyGoal) return res.status(404).json({ error: 'WeeklyGoal not found' });

    weeklyGoal.completed = !weeklyGoal.completed;
    await weeklyGoal.save();
    res.json(weeklyGoal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a goal
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const weeklyGoal = await WeeklyGoal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!weeklyGoal) return res.status(404).json({ error: 'WeeklyGoal not found' });

    res.json({ message: 'WeeklyGoal deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
