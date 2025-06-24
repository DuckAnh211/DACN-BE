const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  // Thông tin học sinh
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentEmail: {
    type: String,
    required: true
  },
  studentName: {
    type: String,
    required: true
  },
  
  // Liên kết với bài tập
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  
  // Liên kết với lớp học
  classCode: {
    type: String,
    required: true
  },
  
  // Thông tin file nộp
  fileUrl: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  
  // Bình luận của học sinh
  comment: {
    type: String,
    default: ''
  },
  
  // Đánh giá của giáo viên
  grade: {
    type: Number,
    default: null
  },
  feedback: {
    type: String,
    default: ''
  },
  isGraded: {
    type: Boolean,
    default: false
  },
  
  // Trạng thái
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'late'],
    default: 'pending'
  },
  
  // Thời gian
  submittedAt: {
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

module.exports = mongoose.model('Submission', submissionSchema);
