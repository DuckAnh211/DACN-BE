const Question = require('../models/question');

const getAllQuestions = async () => await Question.find();

const createQuestion = async (data) => {
  const question = new Question(data);
  return await question.save();
};

const updateQuestion = async (id, data) => {
  return await Question.findByIdAndUpdate(id, data, { new: true });
};

const deleteQuestion = async (id) => {
  return await Question.findByIdAndDelete(id);
};

const toggleStatus = async (id) => {
  const question = await Question.findById(id);
  question.status = !question.status;
  return await question.save();
};

module.exports = {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleStatus,
};
