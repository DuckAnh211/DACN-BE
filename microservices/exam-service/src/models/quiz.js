const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  correctAnswer: Number // index của đáp án đúng
});

const quizSchema = new mongoose.Schema({
  title: String,
  description: String,
  questions: [questionSchema],
  classCode: String,
  teacherEmail: String,
  timeLimit: Number // phút
});

module.exports = mongoose.model('Quiz', quizSchema);