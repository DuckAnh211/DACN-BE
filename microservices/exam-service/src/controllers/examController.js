const examService = require('../services/examService');
const Quiz = require('../models/quiz');
const QuizResult = require('../models/quizResult');

const create = async (req, res) => {
  try {
    const newExam = await examService.createExam(req.body);
    res.status(201).json(newExam);
  } catch (err) {
    console.error('Lỗi tạo đề thi:', err.message);
    res.status(400).json({ error: err.message });
  }
};

const getAll = async (req, res) => {
  try {
    const exams = await examService.getAllExams();
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi lấy danh sách đề thi' });
  }
};
const remove = async (req, res) => {
  try {
    const examId = req.params.id;
    const deleted = await examService.deleteExam(examId);
    res.json({ message: 'Xoá đề thi thành công', deleted });
  } catch (err) {
    console.error('Lỗi xoá đề thi:', err.message);
    res.status(404).json({ error: err.message });
  }
};

const createQuiz = async (req, res) => {
  try {
    const { title, description, questions, classCode, teacherEmail, timeLimit } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tiêu đề và danh sách câu hỏi.' });
    }

    // Có thể kiểm tra teacherEmail/classCode nếu cần

    const newQuiz = new Quiz({
      title,
      description,
      questions,
      classCode,
      teacherEmail,
      timeLimit
    });

    await newQuiz.save();

    return res.status(201).json({ success: true, message: 'Tạo bài kiểm tra thành công', quiz: newQuiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getQuizzesByClassCode = async (req, res) => {
  try {
    const { classCode } = req.params;
    const quizzes = await Quiz.find({ classCode });
    return res.status(200).json({ success: true, quizzes });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getQuizDetail = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' });
    }
    return res.status(200).json({ success: true, quiz });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const saveQuizResult = async (req, res) => {
  try {
    const { quizId, studentId, studentEmail, score } = req.body;

    if (!quizId || !studentId || !studentEmail || typeof score !== 'number') {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
    }

    const quizResult = new QuizResult({
      quizId,
      studentId,
      studentEmail,
      score
    });

    await quizResult.save();

    return res.status(201).json({ success: true, message: 'Lưu kết quả thành công', quizResult });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getQuizResultsByQuizId = async (req, res) => {
  try {
    const { quizId } = req.params;
    const results = await QuizResult.find({ quizId }).populate('studentId', 'name email');
    return res.status(200).json({ success: true, results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const { quizId } = req.params;
    const quiz = await Quiz.findByIdAndDelete(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bài kiểm tra' });
    }
    return res.status(200).json({ success: true, message: 'Xóa bài kiểm tra thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  create,
  deleteQuiz,
  getQuizResultsByQuizId,
  getQuizzesByClassCode,
  saveQuizResult,
  getQuizDetail,
  createQuiz,
  getAll,
  remove,
};
