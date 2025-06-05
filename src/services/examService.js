const Exam = require('../models/exam');
const Classroom = require('../models/classroom');
const Question = require('../models/question');
const mongoose = require('mongoose');

const createExam = async (data) => {
  // Kiểm tra lớp học tồn tại
  const classroom = await Classroom.findOne({ classCode: data.classCode });
  if (!classroom) {
    throw new Error('Lớp học không tồn tại với mã lớp này');
  }

  // Nếu có questionIds, kiểm tra tính hợp lệ của các ID
  if (data.questionType === 'tu_mas' && data.questionIds && data.questionIds.length > 0) {
    // Chuyển đổi các ID thành ObjectId
    const validQuestionIds = [];
    
    for (const id of data.questionIds) {
      // Kiểm tra xem ID có phải là ObjectId hợp lệ không
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`ID câu hỏi không hợp lệ: ${id}`);
      }
      
      // Kiểm tra xem câu hỏi có tồn tại không
      const question = await Question.findById(id);
      if (!question) {
        throw new Error(`Không tìm thấy câu hỏi với ID: ${id}`);
      }
      
      // Thêm ID vào mảng (không cần tạo ObjectId mới)
      validQuestionIds.push(id);
    }
    
    // Gán lại mảng ID hợp lệ
    data.questionIds = validQuestionIds;
  }

  const exam = new Exam({
    title: data.title,
    code: data.code,
    duration: data.duration,
    grade: data.grade,
    subject: data.subject,
    classCode: data.classCode,
    startTime: data.startTime,
    endTime: data.endTime,
    questionType: data.questionType,
    questionIds: data.questionIds || [],
    pdfFileUrl: data.pdfFileUrl || '',
    status: data.status,
  });

  return await exam.save();
};

const getAllExams = async (classCode = null) => {
  // Nếu có classCode, lọc theo lớp học
  const filter = classCode ? { classCode } : {};
  return await Exam.find(filter).populate('questionIds');
};

const getExamsByClassCode = async (classCode) => {
  return await Exam.find({ classCode }).populate('questionIds');
};

module.exports = {
  createExam,
  getAllExams,
  getExamsByClassCode
};
