// models/ActivityLog.js
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  activityKey: { type: String, required: true }, // e.g. "mindful_breathing", "gratitude_list"
  title: { type: String, required: true },       // Human-readable title
  date: { type: Date, default: Date.now },       // Auto-set to today
  response: { type: String },                    // Only for ReflectionScreen
  feedback: {                                    // Feedback data from FeedbackScreen
    type: { type: String, enum: ['emoji', 'text', 'none'] },
    value: { type: String },                     // The actual feedback content
    emoji: { type: String },                     // For emoji feedback, store the emoji
    label: { type: String }                      // For emoji feedback, store the label
  },
  completedAt: { type: Date, default: Date.now } // When activity was finished
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
