require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); // ✅ Add this

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ CREATE UPLOAD DIRECTORIES BEFORE ANYTHING ELSE
const uploadsDir = path.join(__dirname, 'uploads');
const postsDir = path.join(__dirname, 'uploads', 'posts');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Uploads directory created');
  }
  if (!fs.existsSync(postsDir)) {
    fs.mkdirSync(postsDir, { recursive: true });
    console.log('✅ Posts directory created');
  }
} catch (err) {
  console.error('❌ Failed to create upload directories:', err);
}

// Serve uploads folder (for profile images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect MongoDB FIRST, then start server
const startServer = async () => {
  try {
    // Check if URI exists
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');

    // Routes (load AFTER DB connection)
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/dailygoals', require('./routes/dailyGoals'));
    app.use('/api/weekly-goals', require('./routes/weeklyGoals'));
    app.use('/api/activities', require('./routes/activityRoutes'));
    app.use('/api/five-min-activities', require('./routes/fiveMinActivityRoutes'));
    app.use('/api/not-to-do', require('./routes/notToDo'));
    app.use('/api/posts', require('./routes/postRoutes'));
    app.use('/api/icompleted', require('./routes/icompleted'));

    // Start server ONLY after DB connection
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('📡 Ready to accept requests');
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('Full error:', err);
    process.exit(1);
  }
};

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('📡 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📡 Mongoose disconnected');
});

// Start the server
startServer();




// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Serve uploads folder (for profile images, etc.) using absolute path
// const path = require('path');
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // Connect MongoDB FIRST, then start server
// const startServer = async () => {
//   try {
//     // Check if URI exists
//     if (!process.env.MONGO_URI) {
//       throw new Error('MONGO_URI is not defined in environment variables');
//     }

//     // Connect to MongoDB
//     await mongoose.connect(process.env.MONGO_URI);
//     console.log('✅ MongoDB Connected Successfully');

//     // Routes (load AFTER DB connection)
//     app.use('/api/auth', require('./routes/auth'));
//     app.use('/api/dailygoals', require('./routes/dailyGoals'));
//     app.use('/api/weekly-goals', require('./routes/weeklyGoals'));
//     app.use('/api/activities', require('./routes/activityRoutes'));
//     app.use('/api/five-min-activities', require('./routes/fiveMinActivityRoutes'));
//     app.use('/api/not-to-do', require('./routes/notToDo'));
//     app.use('/api/posts', require('./routes/postRoutes'));
//     app.use('/api/icompleted', require('./routes/icompleted'));

//     // Start server ONLY after DB connection
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//       console.log('📡 Ready to accept requests');
//     });

//   } catch (err) {
//     console.error('❌ Failed to start server:', err.message);
//     console.error('Full error:', err);
//     process.exit(1);
//   }
// };

// // Connection event listeners
// mongoose.connection.on('connected', () => {
//   console.log('📡 Mongoose connected to MongoDB');
// });

// mongoose.connection.on('error', (err) => {
//   console.error('📡 Mongoose connection error:', err);
// });

// mongoose.connection.on('disconnected', () => {
//   console.log('📡 Mongoose disconnected');
// });

// // Start the server
// startServer();




// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Connect MongoDB
// mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
//   .then(() => console.log('✅ MongoDB Connected'))
//   .catch(err => console.error('❌ MongoDB Connection Error:', err));

// // Serve uploads folder (for profile images, etc.)
// app.use('/uploads', express.static('uploads'));

// // Routes
// app.use('/api/auth', require('./routes/auth'));           // Auth routes
// app.use('/api/dailygoals', require('./routes/dailyGoals')); // Daily Goals routes
// app.use('/api/weekly-goals', require('./routes/weeklyGoals'));

// const activityRoutes = require("./routes/activityRoutes");
// app.use("/api/activities", activityRoutes);

// const fiveMinActivityRoutes = require("./routes/fiveMinActivityRoutes");
// app.use("/api/five-min-activities", fiveMinActivityRoutes);

// const notToDoRoutes = require("./routes/notToDo");
// app.use("/api/not-to-do", notToDoRoutes);

// const postRoutes = require("./routes/postRoutes");
// app.use("/api/posts", postRoutes);

// const icompletedRoutes = require('./routes/icompleted');
// app.use('/api/icompleted', icompletedRoutes);

// // Start server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
