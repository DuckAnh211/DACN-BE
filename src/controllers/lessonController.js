const { 
  createLessonService, 
  getLessonsByClassCodeService, 
  getLessonByIdService, 
  updateLessonService, 
  deleteLessonService 
} = require('../services/lessonService');

// Tạo bài học mới
const createLesson = async (req, res) => {
  try {
    // Kiểm tra file đã được upload chưa
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên file bài học'
      });
    }

    // Kiểm tra dữ liệu đầu vào
    const { title, classCode, teacherEmail } = req.body;
    if (!title || !classCode || !teacherEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: tiêu đề, mã lớp học và email giáo viên'
      });
    }

    const result = await createLessonService(req.body, req.file);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Lỗi khi tạo bài học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tạo bài học'
    });
  }
};

// Lấy danh sách bài học theo mã lớp
const getLessonsByClassCode = async (req, res) => {
  try {
    const { classCode } = req.params;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã lớp học'
      });
    }

    const result = await getLessonsByClassCodeService(classCode);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách bài học'
    });
  }
};

// Lấy chi tiết bài học
const getLessonById = async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài học'
      });
    }

    const result = await getLessonByIdService(lessonId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy chi tiết bài học'
    });
  }
};

// Cập nhật bài học
const updateLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài học'
      });
    }

    const result = await updateLessonService(lessonId, req.body, req.file || null);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi cập nhật bài học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi cập nhật bài học'
    });
  }
};

// Xóa bài học
const deleteLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài học'
      });
    }

    const result = await deleteLessonService(lessonId);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi xóa bài học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xóa bài học'
    });
  }
};

module.exports = {
  createLesson,
  getLessonsByClassCode,
  getLessonById,
  updateLesson,
  deleteLesson
};


