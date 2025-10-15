const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const { authMiddleware } = require("./auth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const User = require("../models/User");

// ✅ Ensure upload directory exists (safety check)
const postsUploadDir = path.join(__dirname, "..", "uploads", "posts");
if (!fs.existsSync(postsUploadDir)) {
  fs.mkdirSync(postsUploadDir, { recursive: true });
  console.log("✅ Posts upload directory created in routes");
}

// ✅ Storage configuration for posts
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postsUploadDir); // Use absolute path
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
    cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ✅ CREATE POST
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { text, hashtags } = req.body;

    // Validate text
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Post text is required" });
    }

    // ✅ Extract hashtags from text like #motivation
    const extractedHashtags = text ? text.match(/#\w+/g) || [] : [];

    // ✅ Merge manually typed + recommended hashtags from frontend
    let allHashtags = extractedHashtags;
    if (hashtags) {
      try {
        const parsed = typeof hashtags === "string" ? JSON.parse(hashtags) : hashtags;
        allHashtags = [...new Set([...extractedHashtags, ...parsed])];
      } catch (err) {
        console.warn("Invalid hashtags format, using extracted hashtags only");
      }
    }

    const newPost = new Post({
      user: req.user.id,
      text,
      image: req.file ? `/uploads/posts/${req.file.filename}` : null,
      hashtags: allHashtags,
    });

    await newPost.save();
    
    // Populate user info before sending response
    await newPost.populate("user", "name email profileImage");
    
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Create post error:", err);
    
    // Delete uploaded file if post creation fails
    if (req.file) {
      const filePath = path.join(postsUploadDir, req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    res.status(500).json({ message: "Server error creating post" });
  }
});

// ✅ GET FEED
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    // 1️⃣ Get user's interests
    const user = await User.findById(req.user.id).select("interests");
    const interests = user?.interests?.map(i => 
      i.trim().toLowerCase().replace(/^#/, '')
    ) || [];

    // 2️⃣ Fetch all posts (non-deleted, not current user) - SORTED BY NEWEST FIRST
    const posts = await Post.find({
      deleted: false,
      user: { $ne: req.user.id }
    })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // 3️⃣ Mark posts if they match interests & calculate match score
    const postsWithMatchFlag = posts.map(post => {
      const hashtags = post.hashtags?.map(h => 
        h.trim().toLowerCase().replace(/^#/, '')
      ) || [];
      
      const matchingTags = hashtags.filter(h => interests.includes(h));
      const matches = matchingTags.length > 0;
      
      return { 
        ...post, 
        matchesInterest: matches,
        matchScore: matchingTags.length
      };
    });

    // 4️⃣ Sort: matching posts first, then non-matching
    postsWithMatchFlag.sort((a, b) => {
      if (a.matchesInterest && !b.matchesInterest) return -1;
      if (!a.matchesInterest && b.matchesInterest) return 1;
      return 0;
    });

    res.json(postsWithMatchFlag);
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ message: "Server error fetching feed" });
  }
});

// ✅ DELETE POST (SOFT DELETE)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user.id });
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.deleted = true;
    await post.save();

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: "Server error deleting post" });
  }
});

// ✅ LIKE / UNLIKE POST
router.put("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = String(req.user.id);
    const hasLiked = post.likes.some((id) => String(id) === userId);
    
    if (hasLiked) {
      post.likes = post.likes.filter((id) => String(id) !== userId);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    await post.populate("user", "name email profileImage");
    
    res.json(post);
  } catch (err) {
    console.error("Like post error:", err);
    res.status(500).json({ message: "Server error liking post" });
  }
});

// ✅ ADD COMMENT
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.comments.push({ user: req.user.id, text: text.trim() });
    await post.save();
    await post.populate("user", "name email profileImage");

    res.json(post);
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: "Server error adding comment" });
  }
});

module.exports = router;