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
// router.get('/', authMiddleware, async (req, res) => {
//   try {
//     const startOfDay = new Date();
//     startOfDay.setHours(0, 0, 0, 0);
//     const endOfDay = new Date();
//     endOfDay.setHours(23, 59, 59, 999);

//     const dailyGoals = await DailyGoal.find({
//       user: req.user.id,
//       date: { $gte: startOfDay, $lte: endOfDay },
//     });

//     res.json(dailyGoals);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

router.get('/', authMiddleware, async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const dailyGoals = await DailyGoal.find({
      user: req.user.id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
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



// Add this route to your backend/routes/dailyGoals.js file

// ✅ Get weekly goals status (for dashboard weekly progress)
router.get('/weekly/status', authMiddleware, async (req, res) => {
  try {
    // Get the start of the current week (Monday)
    const today = new Date();
    const currentDay = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    // Get the end of the week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Fetch all goals for this week
    // const weeklyGoals = await DailyGoal.find({
    //   user: req.user.id,
    //   date: { $gte: startOfWeek, $lte: endOfWeek },
    // });
    const weeklyGoals = await DailyGoal.find({
  user: req.user.id,
  createdAt: { $gte: startOfWeek, $lte: endOfWeek },
});


    // Group goals by date and calculate completion status
    const weekStatus = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayGoals = weeklyGoals.filter(goal => {
        const goalDate = new Date(goal.createdAt);
        return goalDate >= dayStart && goalDate <= dayEnd;
      });

      const totalGoals = dayGoals.length;
      const completedGoals = dayGoals.filter(goal => goal.completed).length;

      // format local YYYY-MM-DD
      const yyyy = day.getFullYear();
      const mm = String(day.getMonth() + 1).padStart(2, '0');
      const dd = String(day.getDate()).padStart(2, '0');
      weekStatus.push({
        date: `${yyyy}-${mm}-${dd}`,
        totalGoals,
        completedGoals,
        allCompleted: totalGoals > 0 && completedGoals === totalGoals,
        hasIncomplete: totalGoals > 0 && completedGoals < totalGoals,
      });
    }

    res.json(weekStatus);
  } catch (err) {
    console.error('Error fetching weekly status:', err);
    res.status(500).json({ error: err.message });
  }
});

// IMPORTANT: Add this route BEFORE the '/:id/toggle' route in your dailyGoals.js file
// to avoid route conflicts. Place it after the '/completed/count' route.

module.exports = router;
