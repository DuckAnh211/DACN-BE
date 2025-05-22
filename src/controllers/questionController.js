const questionService = require('../services/questionService');

const getAll = async (req, res) => {
  const questions = await questionService.getAllQuestions();
  res.json(questions);
};

const create = async (req, res) => {
  console.log('Body nhận được khi tạo question:', req.body);
  try {
    const newQuestion = await questionService.createQuestion(req.body);
    res.status(201).json(newQuestion);
  } catch (err) {
    console.error('Lỗi khi tạo question:', err.message);
    res.status(400).json({ error: err.message });
  }
};


const update = async (req, res) => {
  const updated = await questionService.updateQuestion(req.params.id, req.body);
  res.json(updated);
};

const remove = async (req, res) => {
  await questionService.deleteQuestion(req.params.id);
  res.status(204).end();
};

const toggle = async (req, res) => {
  const updated = await questionService.toggleStatus(req.params.id);
  res.json(updated);
};

module.exports = {
  getAll,
  create,
  update,
  remove,
  toggle,
};
