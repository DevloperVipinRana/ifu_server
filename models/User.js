const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  zipCode: { type: String },
  gender: { type: String },

  timezone: { type: String, default: '' },

  // Profile fields
  bio: { type: String, default: '' },
  interests: { type: [String], default: [] },
  goals: { type: [String], default: [] },
  occupation: { type: String, default: '' },
  ageGroup: { type: String, default: '' },
  address: { type: String, default: '' },

  hobbies: { type: String, default: '' },
  musicTaste: { type: String, default: '' },
  phoneUsage: { type: String, default: '' },
  favMusician: { type: String, default: '' },
  favSports: { type: String, default: '' },
  indoorTime: { type: String, default: '' },
  outdoorTime: { type: String, default: '' },
  favWork: { type: String, default: '' },
  favPlace: { type: String, default: '' },

  personality: { type: String, default: '' },
  movieGenre: { type: String, default: '' },
  likesToTravel: { type: Boolean, default: null },

  profileCompleted: { type: Boolean, default: false },

  profileImage: { type: String, default: '' }

}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
