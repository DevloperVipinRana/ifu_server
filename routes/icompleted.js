// backend/routes/icompleted.js
const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const ICompleted = require('../models/ICompleted');
const { authMiddleware } = require('./auth');

// --- Multer setup ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/icompleted'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.id}_${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

// ✅ POST Achievement
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { achievementText } = req.body;

    if (!achievementText || achievementText.trim().length < 3)
      return res.status(400).json({ message: 'Achievement text too short.' });

    const newAchievement = new ICompleted({
      userId: req.user.id,
      achievementText,
      image: req.file ? `/uploads/icompleted/${req.file.filename}` : null,
    });

    await newAchievement.save();
    res.status(201).json({ message: 'Achievement saved!', achievement: newAchievement });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ GET all achievements of logged-in user
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const achievements = await ICompleted.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(achievements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
