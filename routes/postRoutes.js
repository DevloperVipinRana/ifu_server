const express = require("express");
const router = express.Router();
const Post = require("../models/Post");
const { authMiddleware } = require("./auth");
const multer = require("multer");
const path = require("path");
const User = require("../models/User");

// ✅ Directory is now created in index.js, just reference the path
const postsDir = path.join(__dirname, "..", "uploads", "posts");

// Storage configuration for posts
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, postsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "_" + Date.now() + ext);
  },
});

const upload = multer({ storage });

// ✅ CREATE POST
router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { text, hashtags } = req.body;

    // Extract hashtags written in text like #motivation
    const extractedHashtags = text ? text.match(/#\w+/g) || [] : [];

    // Merge both manually typed + recommended hashtags from frontend
    let allHashtags = extractedHashtags;
    if (hashtags) {
      try {
        const parsed = JSON.parse(hashtags);
        allHashtags = [...new Set([...extractedHashtags, ...parsed])];
      } catch (err) {
        console.warn("Invalid hashtags format, skipping JSON parse");
      }
    }

    const newPost = new Post({
      user: req.user.id,
      text,
      image: req.file ? `/uploads/posts/${req.file.filename}` : null,
      hashtags: allHashtags,
    });

    await newPost.save();
    
    // ✅ Populate user data before sending response
    await newPost.populate("user", "name email profileImage");
    
    res.status(201).json(newPost);
  } catch (err) {
    console.error("Create post error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ GET FEED
router.get("/feed", authMiddleware, async (req, res) => {
  try {
    // Get user's interests
    const user = await User.findById(req.user.id).select("interests");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const interests = user?.interests?.map(i => 
      i.trim().toLowerCase().replace(/^#/, '') // Remove # if present
    ) || [];

    // Fetch all posts (non-deleted, not current user) - SORTED BY NEWEST FIRST
    const posts = await Post.find({
      deleted: false,
      user: { $ne: req.user.id }
    })
      .populate("user", "name email profileImage")
      .sort({ createdAt: -1 })
      .lean();

    // Mark posts if they match interests & calculate match score
    const postsWithMatchFlag = posts.map(post => {
      const hashtags = post.hashtags?.map(h => 
        h.trim().toLowerCase().replace(/^#/, '')
      ) || [];
      
      // Check if any hashtag matches user interests
      const matchingTags = hashtags.filter(h => interests.includes(h));
      const matches = matchingTags.length > 0;
      
      return { 
        ...post, 
        matchesInterest: matches,
        matchScore: matchingTags.length
      };
    });

    // Sort: matching posts section first, then non-matching section
    postsWithMatchFlag.sort((a, b) => {
      if (a.matchesInterest && !b.matchesInterest) return -1;
      if (!a.matchesInterest && b.matchesInterest) return 1;
      return 0;
    });

    res.json(postsWithMatchFlag);
  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ DELETE POST (SOFT DELETE)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, user: req.user.id });
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.deleted = true;
    await post.save();

    res.json({ message: "Post deleted successfully" });
  } catch (err) {
    console.error("Delete post error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ LIKE / UNLIKE POST
router.put("/:id/like", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = String(req.user.id);
    const hasLiked = post.likes.some((id) => String(id) === userId);
    
    if (hasLiked) {
      post.likes = post.likes.filter((id) => String(id) !== userId);
    } else {
      post.likes.push(req.user.id);
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error("Like error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

// ✅ ADD COMMENT
router.post("/:id/comment", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (!req.body.text || req.body.text.trim() === '') {
      return res.status(400).json({ message: "Comment text is required" });
    }

    post.comments.push({ 
      user: req.user.id, 
      text: req.body.text.trim() 
    });
    
    await post.save();
    
    // ✅ Populate the comment user data
    await post.populate("comments.user", "name profileImage");

    res.json(post);
  } catch (err) {
    console.error("Comment error:", err);
    res.status(500).json({ message: err.message || "Server error" });
  }
});

module.exports = router;





// const express = require("express");
// const router = express.Router();
// const Post = require("../models/Post");
// const { authMiddleware } = require("./auth"); // use your middleware
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");
// const User = require("../models/User");


// // Ensure uploads/posts directory exists and use absolute path
// const postsDir = path.join(__dirname, "..", "uploads", "posts");
// if (!fs.existsSync(postsDir)) {
//   try { fs.mkdirSync(postsDir, { recursive: true }); } catch (e) { console.error("Failed to create posts upload dir:", e); }
// }

// // storage for posts
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, postsDir),
//   filename: (req, file, cb) => {
//     const ext = path.extname(file.originalname);
//     cb(null, req.user.id + "_" + Date.now() + ext);
//   },
// });

// const upload = multer({ storage });


// router.post("/", authMiddleware, upload.single("image"), async (req, res) => {
//   try {
//     const { text, hashtags } = req.body;

//     // ✅ Extract hashtags written in text like #motivation
//     const extractedHashtags = text ? text.match(/#\w+/g) || [] : [];

//     // ✅ Merge both manually typed + recommended hashtags from frontend
//     let allHashtags = extractedHashtags;
//     if (hashtags) {
//       try {
//         const parsed = JSON.parse(hashtags);
//         allHashtags = [...new Set([...extractedHashtags, ...parsed])];
//       } catch (err) {
//         console.warn("Invalid hashtags format, skipping JSON parse");
//       }
//     }

//     const newPost = new Post({
//       user: req.user.id,
//       text,
//       image: req.file ? `/uploads/posts/${req.file.filename}` : null,
//       hashtags: allHashtags, // ✅ added field
//     });

//     await newPost.save();
//     res.status(201).json(newPost);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// router.get("/feed", authMiddleware, async (req, res) => {
//   try {
//     // 1️⃣ Get user's interests
//     const user = await User.findById(req.user.id).select("interests");
//     const interests = user?.interests?.map(i => 
//       i.trim().toLowerCase().replace(/^#/, '') // Remove # if present
//     ) || [];
    
//     // console.log("User interests:", interests);

//     // 2️⃣ Fetch all posts (non-deleted, not current user) - SORTED BY NEWEST FIRST
//     const posts = await Post.find({
//       deleted: false,
//       user: { $ne: req.user.id }
//     })
//       .populate("user", "name email profileImage")
//       .sort({ createdAt: -1 }) // ✅ Sort by newest first in database
//       .lean(); // Use lean() for better performance

//     // console.log(`Found ${posts.length} posts`);

//     // 3️⃣ Mark posts if they match interests & calculate match score
//     const postsWithMatchFlag = posts.map(post => {
//       const hashtags = post.hashtags?.map(h => 
//         h.trim().toLowerCase().replace(/^#/, '') // Remove # if present
//       ) || [];
      
//       // Check if any hashtag matches user interests
//       const matchingTags = hashtags.filter(h => interests.includes(h));
//       const matches = matchingTags.length > 0;
      
//       // if (matches) {
//       //   console.log(`Post ${post._id} matches with tags:`, matchingTags);
//       // }
      
//       return { 
//         ...post, 
//         matchesInterest: matches,
//         matchScore: matchingTags.length // Higher score = more matching tags
//       };
//     });

//     // 4️⃣ Sort: matching posts section first, then non-matching section
//     // Within each section, maintain chronological order (already sorted by createdAt)
//     postsWithMatchFlag.sort((a, b) => {
//       // If one matches and other doesn't, matching comes first
//       if (a.matchesInterest && !b.matchesInterest) return -1;
//       if (!a.matchesInterest && b.matchesInterest) return 1;
      
//       // ✅ If both match OR both don't match, keep original order (newest first)
//       // Since we already sorted by createdAt in the query, we don't need to re-sort
//       return 0;
//     });

//     // console.log(`Returning ${postsWithMatchFlag.length} posts (${postsWithMatchFlag.filter(p => p.matchesInterest).length} matching)`);

//     res.json(postsWithMatchFlag);
//   } catch (err) {
//     console.error("Feed error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// router.delete("/:id", authMiddleware, async (req, res) => {
//   try {
//     const post = await Post.findOne({ _id: req.params.id, user: req.user.id });
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.deleted = true;
//     await post.save();

//     res.json({ message: "Post deleted (soft)" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // 👉 LIKE / UNLIKE POST
// router.put("/:id/like", authMiddleware, async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     const userId = String(req.user.id);
//     const hasLiked = post.likes.some((id) => String(id) === userId);
//     if (hasLiked) {
//       post.likes = post.likes.filter((id) => String(id) !== userId);
//     } else {
//       post.likes.push(req.user.id);
//     }

//     await post.save();
//     res.json(post);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // // 👉 ADD COMMENT
// router.post("/:id/comment", authMiddleware, async (req, res) => {
//   try {
//     const post = await Post.findById(req.params.id);
//     if (!post) return res.status(404).json({ message: "Post not found" });

//     post.comments.push({ user: req.user.id, text: req.body.text });
//     await post.save();

//     res.json(post);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// });


// module.exports = router;
