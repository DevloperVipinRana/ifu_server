const mongoose = require("mongoose");

const notToDoSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  habit: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("NotToDo", notToDoSchema);
