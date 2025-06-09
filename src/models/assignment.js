const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  // Thông tin cơ bản
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Liên kết với lớp học
  classroomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Classroom',
    required: true
  },
  
  // Liên kết với giáo viên
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  
  // Thông tin file
  fileUrl: {
    type: String,
    default: ''  // Thay đổi từ required thành default
  },
  fileName: {
    type: String,
    default: ''  // Thay đổi từ required thành default
  },
  fileType: {
    type: String,
    default: ''  // Thay đổi từ required thành default
  },
  fileSize: {
    type: Number,
    default: 0   // Thay đổi từ required thành default
  },
  
  // Thời hạn nộp bài
  dueDate: {
    type: Date,
    required: true
  },
  
  // Điểm tối đa
  maxScore: {
    type: Number,
    default: 10
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['active', 'inactive', 'deleted'],
    default: 'active'
  },
  
  // Thống kê
  submissionCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Thời gian
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Assignment', assignmentSchema);
