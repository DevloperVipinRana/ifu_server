// models/ActivityLog.js
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  activityKey: { type: String, required: true }, // e.g. "mindful_breathing", "gratitude_list"
  title: { type: String, required: true },       // Human-readable title
  date: { type: Date, default: Date.now },       // Auto-set to today
  response: { type: String },                    // Only for ReflectionScreen
  completedAt: { type: Date, default: Date.now } // When activity was finished
});

module.exports = mongoose.model("ActivityLog", activityLogSchema);
