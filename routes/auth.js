const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const multer = require('multer');
const path = require('path');

const Otp = require('../models/Otp');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// 1️⃣ Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder where images will be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + '_' + Date.now() + ext); // unique filename
  },
});

const upload = multer({ storage });

// Middleware to check auth
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
    req.user = decoded; // user.id from token
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};


// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // or your SMTP host
  port: 465, // 587 for TLS
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


router.post('/request-otp', async (req, res) => {

  const { email } = req.body;

  try {
    // Generate OTP
    const otpCode = crypto.randomInt(1000, 9999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save OTP in DB
    await Otp.create({ email, code: otpCode, expiresAt: otpExpiry });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your verification code is ${otpCode}. It expires in 10 minutes.`,
    });

    res.status(200).json({ message: 'OTP sent to email', email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/signup', async (req, res) => {
  const { name, email, password, zipCode, gender, timezone } = req.body;

  try {
    if (!password || password.length < 5) {
      return res.status(400).json({ message: 'Password must be at least 5 characters long' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user but mark as unverified (until OTP step)
    user = new User({
      name,
      email,
      password: hashedPassword,
      zipCode,
      gender,
      timezone,
      verified: false,
    });
    await user.save();

    // Generate JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    // ✅ Return full user object
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        gender: user.gender,
        zipCode: user.zipCode,
        timezone: user.timezone,
        verified: user.verified,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// ---------------- VERIFY OTP ----------------
router.post('/verify-otp', async (req, res) => {
  const { email, code } = req.body;

  try {
    const otpEntry = await Otp.findOne({ email, code });
    if (!otpEntry) return res.status(400).json({ message: 'Invalid OTP' });
    if (otpEntry.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

    // Mark user as verified
    await User.findOneAndUpdate({ email }, { verified: true });

    // Delete OTP after successful verification
    await Otp.deleteOne({ _id: otpEntry._id });

    res.json({ message: 'OTP verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user._id, name: user.name, email, profileCompleted: user.profileCompleted } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Update profile
router.put('/profile', authMiddleware, upload.single('profileImage'), async (req, res) => {
  try {
    const {
      bio, interests, goals, occupation, ageGroup, address,
      hobbies, musicTaste, phoneUsage, favMusician, favSports,
      indoorTime, outdoorTime, favWork, favPlace,
      personality, movieGenre, likesToTravel, profileCompleted
    } = req.body;

    // Handle profile image
    let profileImageUrl;
    if (req.file) {
      profileImageUrl = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        bio, interests, goals, occupation, ageGroup, address,
        hobbies, musicTaste, phoneUsage, favMusician, favSports,
        indoorTime, outdoorTime, favWork, favPlace,
        personality, movieGenre, likesToTravel,
        profileCompleted: profileCompleted ?? true,
        ...(profileImageUrl && { profileImage: profileImageUrl })
      },
      { new: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ✅ Get profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // exclude password
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;       // For routes
module.exports.authMiddleware = authMiddleware; // For middleware
