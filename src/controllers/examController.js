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

module.exports = {
  create,
  getAll,
  remove,
};