const { 
  createLessonService, 
  getLessonsByClassCodeService, 
  getLessonByIdService, 
  updateLessonService, 
  deleteLessonService,
  getDownloadableLessonFileService,
  getViewableLessonPdfService
} = require('../services/lessonService');
const fs = require('fs');

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
    const { title, description, teacherEmail } = req.body;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài học'
      });
    }

    // Kiểm tra quyền chỉnh sửa (cần cung cấp email giáo viên)
    if (!teacherEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email giáo viên để xác thực quyền chỉnh sửa'
      });
    }

    // Kiểm tra loại file nếu có file mới
    if (req.file) {
      const allowedFileTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
      
      if (!allowedFileTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Loại file không được hỗ trợ. Vui lòng tải lên file PDF, Word hoặc PowerPoint'
        });
      }
      
      // Kiểm tra kích thước file (giới hạn 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'Kích thước file vượt quá giới hạn 10MB'
        });
      }
    }

    // Tạo đối tượng chứa dữ liệu cập nhật - không bao gồm status
    const updateData = {
      teacherEmail,
      title,
      description
    };

    const result = await updateLessonService(lessonId, updateData, req.file || null);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi cập nhật bài học:', error);
    return res.status(error.message.includes('quyền') ? 403 : 500).json({
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

// Tải về file bài học
const downloadLessonFile = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài học'
      });
    }
    
    const result = await getDownloadableLessonFileService(lessonId);
    
    // Thiết lập header để tải về file
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    res.setHeader('Content-Type', result.fileType);
    
    // Gửi file cho client
    return res.download(result.filePath, result.fileName, (err) => {
      if (err) {
        console.error('Lỗi khi tải file:', err);
        // Nếu headers đã được gửi, không thể gửi lỗi JSON
        if (!res.headersSent) {
          return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi tải file'
          });
        }
      }
    });
  } catch (error) {
    console.error('Lỗi khi tải về file bài học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tải về file bài học'
    });
  }
};

// Xem nội dung file PDF bài học
const viewLessonPdf = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài học'
      });
    }
    
    const result = await getViewableLessonPdfService(lessonId);
    
    // Thiết lập header để hiển thị PDF trong trình duyệt
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(result.fileName)}"`);
    
    // Đọc file và gửi nội dung
    const fileStream = fs.createReadStream(result.filePath);
    fileStream.pipe(res);
    
    // Xử lý lỗi stream
    fileStream.on('error', (err) => {
      console.error('Lỗi khi đọc file:', err);
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Đã xảy ra lỗi khi đọc file'
        });
      }
    });
  } catch (error) {
    console.error('Lỗi khi xem file PDF bài học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xem file PDF bài học'
    });
  }
};

module.exports = {
  createLesson,
  getLessonsByClassCode,
  getLessonById,
  updateLesson,
  deleteLesson,
  downloadLessonFile,
  viewLessonPdf
};








