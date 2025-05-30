const Exam = require('../models/exam');

const createExam = async (data) => {
  const exam = new Exam({
    title: data.title,
    code: data.code,
    duration: data.duration,
    grade: data.grade,
    subject: data.subject,
    startTime: data.startTime,
    endTime: data.endTime,
    questionType: data.questionType,
    questionIds: data.questionIds || [],
    pdfFileUrl: data.pdfFileUrl || '',
    status: data.status,
  });

  return await exam.save();
};

const getAllExams = async () => {
  return await Exam.find().populate('questionIds');
};

module.exports = {
  createExam,
  getAllExams,
};
