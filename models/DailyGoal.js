const mongoose = require('mongoose');

const DailyGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // link with User
  text: { type: String, required: true }, // daily goal description
  completed: { type: Boolean, default: false }, // completion status
  // date: { type: Date, default: () => new Date().setHours(0, 0, 0, 0) } // goal valid only for the day
}, { timestamps: true });

module.exports = mongoose.model('DailyGoal', DailyGoalSchema);
