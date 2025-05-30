const examService = require('../services/examService');

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

module.exports = {
  create,
  getAll,
};
