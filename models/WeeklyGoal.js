const mongoose = require('mongoose');

const weeklyGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  progress: { type: Number, default: 0 }, // 0-100
  completed: { type: Boolean, default: false },
  weekStart: { type: Date, required: true }, // Start of the week
}, { timestamps: true });

module.exports = mongoose.model('WeeklyGoal', weeklyGoalSchema);
