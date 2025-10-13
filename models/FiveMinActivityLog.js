// models/FiveMinActivityLog.js
const mongoose = require("mongoose");

const fiveMinActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  activityKey: { type: String, required: true }, // e.g. "5m_breathing", "5m_workout"
  title: { type: String, required: true },       // Human-readable title
  date: { type: Date, default: Date.now },       // Auto-set to today
  completedAt: { type: Date, default: Date.now } // When activity was finished
});

module.exports = mongoose.model("FiveMinActivityLog", fiveMinActivityLogSchema);
