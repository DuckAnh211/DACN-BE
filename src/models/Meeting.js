const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['host', 'participant'],
    default: 'participant'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: {
    type: Date
  }
});

const MeetingSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  participants: [ParticipantSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  settings: {
    type: Object,
    default: {
      enableChat: true,
      enableScreenShare: true,
      enableRecording: false,
      maxParticipants: 10
    }
  }
});

module.exports = mongoose.model('Meeting', MeetingSchema);
