const {
  createSubmissionService,
  getSubmissionsByAssignmentService,
  getStudentSubmissionsService,
  getSubmissionByIdService,
  downloadSubmissionFileService, // Sửa tên hàm cho đúng
  gradeSubmissionService,
  getStudentSubmissionStatusService
} = require('../services/submissionService');
const fs = require('fs');
const mongoose = require('mongoose');

// Nộp bài
const submitAssignment = async (req, res) => {
  try {
    // Kiểm tra file đã được upload chưa
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng tải lên file bài làm'
      });
    }

    // Kiểm tra dữ liệu đầu vào
    const { assignmentId, studentEmail, classCode } = req.body;
    if (!assignmentId || !studentEmail || !classCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: ID bài tập, email học sinh và mã lớp học'
      });
    }

    const result = await createSubmissionService(req.body, req.file);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Lỗi khi nộp bài:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi nộp bài'
    });
  }
};

// Lấy danh sách bài nộp theo bài tập (cho giáo viên)
const getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài tập'
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID bài tập không hợp lệ'
      });
    }
    
    const result = await getSubmissionsByAssignmentService(assignmentId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài nộp:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách bài nộp'
    });
  }
};

// Lấy danh sách bài nộp của học sinh
const getStudentSubmissions = async (req, res) => {
  try {
    const { studentEmail } = req.params;
    
    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email học sinh'
      });
    }
    
    const result = await getStudentSubmissionsService(studentEmail);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài nộp của học sinh:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách bài nộp của học sinh'
    });
  }
};

// Lấy chi tiết bài nộp
const getSubmissionById = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài nộp'
      });
    }
    
    const result = await getSubmissionByIdService(submissionId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài nộp:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy chi tiết bài nộp'
    });
  }
};

// Tải về file bài nộp
const downloadSubmissionFile = async (req, res) => {
  try {
    const { submissionId } = req.params;
    
    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài nộp'
      });
    }
    
    const result = await downloadSubmissionFileService(submissionId);
    
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
    console.error('Lỗi khi tải về file bài nộp:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tải về file bài nộp'
    });
  }
};

// Đánh giá bài nộp (dành cho giáo viên)
const gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, teacherEmail } = req.body;
    
    if (!submissionId || grade === undefined || !teacherEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: ID bài nộp, điểm số và email giáo viên'
      });
    }
    
    const result = await gradeSubmissionService(submissionId, { grade, feedback }, teacherEmail);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi đánh giá bài nộp:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi đánh giá bài nộp'
    });
  }
};

// Kiểm tra trạng thái nộp bài của sinh viên trong một lớp
const getStudentSubmissionStatus = async (req, res) => {
  try {
    const { classCode } = req.params;
    const { studentEmail } = req.query;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã lớp học'
      });
    }

    if (!studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email sinh viên'
      });
    }

    const result = await getStudentSubmissionStatusService(classCode, studentEmail);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi kiểm tra trạng thái nộp bài:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi kiểm tra trạng thái nộp bài'
    });
  }
};

module.exports = {
  submitAssignment,
  getSubmissionsByAssignment,
  getStudentSubmissions,
  getSubmissionById,
  downloadSubmissionFile,
  gradeSubmission,
  getStudentSubmissionStatus
};




