const express = require("express");
const router = express.Router();
const NotToDo = require("../models/NotToDo");
const { authMiddleware } = require("./auth"); // Your auth to get user from token

// POST /api/not-to-do
router.post("/", authMiddleware, async (req, res) => {
  const { habits } = req.body; // expect an array of habit strings

  if (!habits || !Array.isArray(habits) || habits.length === 0) {
    return res.status(400).json({ message: "No habits provided" });
  }

  try {
    const savedHabits = await Promise.all(
      habits.map(habit => 
        new NotToDo({ user: req.user.id, habit }).save()
      )
    );

    res.status(201).json({ message: "Habits saved", data: savedHabits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// routes/notToDo.js
router.get("/recent", authMiddleware, async (req, res) => {
  try {
    const habits = await NotToDo.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(3);
    res.json({ habits });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
