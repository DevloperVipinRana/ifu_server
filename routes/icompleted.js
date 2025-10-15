const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const ICompleted = require('../models/ICompleted');
const { authMiddleware } = require('./auth');

// ✅ Ensure uploads/icompleted directory exists
const icompletedDir = path.join(__dirname, '..', 'uploads', 'icompleted');
if (!fs.existsSync(icompletedDir)) {
  try {
    fs.mkdirSync(icompletedDir, { recursive: true });
    console.log('✅ ICompleted upload directory created');
  } catch (e) {
    console.error('❌ Failed to create icompleted upload dir:', e);
  }
}

// ✅ Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, icompletedDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${req.user.id}_${Date.now()}${ext}`;
    cb(null, filename);
  },
});

// ✅ File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ✅ POST Achievement
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { achievementText } = req.body;

    // Validation
    if (!achievementText || achievementText.trim().length < 3) {
      // Clean up uploaded file if validation fails
      if (req.file) {
        const filePath = path.join(icompletedDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(400).json({ message: 'Achievement text must be at least 3 characters.' });
    }

    const newAchievement = new ICompleted({
      userId: req.user.id,
      achievementText: achievementText.trim(),
      image: req.file ? `/uploads/icompleted/${req.file.filename}` : null,
    });

    await newAchievement.save();
    
    res.status(201).json({ 
      message: 'Achievement saved successfully!', 
      achievement: newAchievement 
    });
  } catch (err) {
    console.error('Create achievement error:', err);
    
    // Clean up uploaded file if save fails
    if (req.file) {
      const filePath = path.join(icompletedDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: 'Server error creating achievement' });
  }
});

// ✅ GET all achievements of logged-in user
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const achievements = await ICompleted.find({ 
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.json(achievements);
  } catch (err) {
    console.error('Fetch achievements error:', err);
    res.status(500).json({ message: 'Server error fetching achievements' });
  }
});

// ✅ DELETE Achievement (optional - add if needed)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const achievement = await ICompleted.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Delete image file if exists
    if (achievement.image) {
      const filename = path.basename(achievement.image);
      const filePath = path.join(icompletedDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await ICompleted.deleteOne({ _id: req.params.id });
    res.json({ message: 'Achievement deleted successfully' });
  } catch (err) {
    console.error('Delete achievement error:', err);
    res.status(500).json({ message: 'Server error deleting achievement' });
  }
});

// ✅ UPDATE Achievement (optional - add if needed)
router.put('/:id', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    const { achievementText } = req.body;

    const achievement = await ICompleted.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!achievement) {
      // Clean up new uploaded file if achievement not found
      if (req.file) {
        const filePath = path.join(icompletedDir, req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Update text if provided
    if (achievementText && achievementText.trim().length >= 3) {
      achievement.achievementText = achievementText.trim();
    }

    // Update image if new one uploaded
    if (req.file) {
      // Delete old image
      if (achievement.image) {
        const oldFilename = path.basename(achievement.image);
        const oldFilePath = path.join(icompletedDir, oldFilename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      achievement.image = `/uploads/icompleted/${req.file.filename}`;
    }

    await achievement.save();
    res.json({ 
      message: 'Achievement updated successfully', 
      achievement 
    });
  } catch (err) {
    console.error('Update achievement error:', err);
    
    // Clean up new uploaded file if update fails
    if (req.file) {
      const filePath = path.join(icompletedDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: 'Server error updating achievement' });
  }
});

module.exports = router;