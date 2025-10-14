const mongoose = require('mongoose');

const feedbackEntrySchema = new mongoose.Schema({
  progress: { type: Number, required: true }, // Progress level when feedback was added
  feedback: { type: String, required: true }, // What user accomplished
  timestamp: { type: Date, default: Date.now }
});

const weeklyGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  progress: { type: Number, default: 0 }, // 0-100
  completed: { type: Boolean, default: false },
  weekStart: { type: Date, required: true },
  feedbackEntries: [feedbackEntrySchema] // Array of feedback entries
}, { timestamps: true });

module.exports = mongoose.model('WeeklyGoal', weeklyGoalSchema);
