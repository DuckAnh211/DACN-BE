const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  classCode: {
    type: String,
    required: true
  },
  teacherEmail: {
    type: String,
    required: true
  },
  teacherName: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Danh sách học sinh đã đọc thông báo
  readBy: [{
    type: String, // email của học sinh
    default: []
  }]
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);