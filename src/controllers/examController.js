const examService = require('../services/examService');

const create = async (req, res) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    const { title, code, duration, classCode, questionType } = req.body;
    
    if (!title || !code || !duration || !classCode || !questionType) {
      return res.status(400).json({ 
        success: false,
        error: 'Vui lòng cung cấp đầy đủ thông tin: tiêu đề, mã đề thi, thời gian làm bài, mã lớp học và loại câu hỏi' 
      });
    }
    
    // Xử lý questionIds nếu là chuỗi JSON
    if (req.body.questionIds && typeof req.body.questionIds === 'string') {
      try {
        req.body.questionIds = JSON.parse(req.body.questionIds);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'Định dạng questionIds không hợp lệ. Vui lòng cung cấp mảng các ID câu hỏi hợp lệ.'
        });
      }
    }
    
    // Nếu là loại upload PDF, kiểm tra file
    if (questionType === 'upload_pdf') {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Vui lòng tải lên file PDF cho đề thi'
        });
      }
      
      // Thêm đường dẫn file vào dữ liệu
      req.body.pdfFileUrl = `/uploads/exams/${req.file.filename}`;
    } else if (questionType === 'tu_mas' && (!req.body.questionIds || req.body.questionIds.length === 0)) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp danh sách câu hỏi cho đề thi'
      });
    }
    
    const newExam = await examService.createExam(req.body);
    res.status(201).json({
      success: true,
      message: 'Tạo đề thi thành công',
      data: newExam
    });
  } catch (err) {
    console.error('Lỗi tạo đề thi:', err.message);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
};

const getAll = async (req, res) => {
  try {
    // Lấy classCode từ query params nếu có
    const { classCode } = req.query;
    
    const exams = await examService.getAllExams(classCode);
    res.json({
      success: true,
      data: exams
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: 'Lỗi lấy danh sách đề thi' 
    });
  }
};

// Thêm controller lấy đề thi theo mã lớp
const getExamsByClassCode = async (req, res) => {
  try {
    const { classCode } = req.params;
    
    if (!classCode) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp mã lớp học'
      });
    }
    
    const exams = await examService.getExamsByClassCode(classCode);
    res.json({
      success: true,
      data: exams
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message || 'Lỗi lấy danh sách đề thi theo lớp'
    });
  }
};

module.exports = {
  create,
  getAll,
  getExamsByClassCode
};
