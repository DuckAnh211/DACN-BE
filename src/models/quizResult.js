const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentEmail: { type: String, required: true },
  answers: [{ type: Number }], // Mảng đáp án học sinh chọn (theo index)
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('QuizResult', quizResultSchema);