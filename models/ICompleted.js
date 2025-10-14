// backend/models/ICompleted.js
const mongoose = require('mongoose');

const ICompletedSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    achievementText: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String, // store image path (e.g. /uploads/filename.jpg)
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ICompleted', ICompletedSchema);
