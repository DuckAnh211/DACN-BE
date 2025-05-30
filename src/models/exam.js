const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  duration: { type: Number, required: true },
  grade: String,
  subject: String,
  startTime: Date,
  endTime: Date,
  questionType: String, // "tu_mas" hoặc "upload_pdf"
  questionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  pdfFileUrl: String, // nếu là đề PDF
  status: { type: String, enum: ['Hoạt động', 'Không hoạt động'], default: 'Hoạt động' }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
