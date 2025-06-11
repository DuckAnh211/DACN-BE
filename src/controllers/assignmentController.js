const { 
  createAssignmentService, 
  getAssignmentsByClassCodeService, 
  getAssignmentByIdService, 
  updateAssignmentService, 
  deleteAssignmentService,
  downloadAssignmentFileService,
  viewAssignmentPdfService
} = require('../services/assignmentService');
const fs = require('fs');
const Assignment = require('../models/assignment');
// Tạo bài tập mới
const createAssignment = async (req, res) => {
  try {
    // Kiểm tra dữ liệu đầu vào
    const { title, classCode, teacherEmail, dueDate } = req.body;
    if (!title || !classCode || !teacherEmail || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin: tiêu đề, mã lớp học, email giáo viên và hạn nộp bài'
      });
    }

    // File không còn là bắt buộc
    const result = await createAssignmentService(req.body, req.file || null);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Lỗi khi tạo bài tập:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tạo bài tập'
    });
  }
};

// Lấy danh sách bài tập theo mã lớp
const getAssignmentsByClassCode = async (req, res) => {
  try {
    const { classCode } = req.params;
    
    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã lớp học'
      });
    }
    
    const result = await getAssignmentsByClassCodeService(classCode);
    
    // Chỉ hiển thị một trường ID duy nhất
    return res.status(200).json({
      success: true,
      data: result.data.map(assignment => ({
        id: assignment._id.toString(), // Chỉ hiển thị một trường ID
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        fileUrl: assignment.fileUrl,
        fileName: assignment.fileName,
        fileType: assignment.fileType,
        fileSize: assignment.fileSize,
        status: assignment.status,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        teacherId: assignment.teacherId,
        classroomId: assignment.classroomId,
        viewCount: assignment.viewCount
      }))
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách bài tập:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách bài tập'
    });
  }
};

// Lấy chi tiết bài tập
const getAssignmentById = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài tập'
      });
    }
    
    const result = await getAssignmentByIdService(assignmentId);
    
    // Chỉ hiển thị một trường ID duy nhất
    const assignment = result.data;
    return res.status(200).json({
      success: true,
      data: {
        id: assignment._id.toString(), // Chỉ hiển thị một trường ID
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        fileUrl: assignment.fileUrl,
        fileName: assignment.fileName,
        fileType: assignment.fileType,
        fileSize: assignment.fileSize,
        status: assignment.status,
        createdAt: assignment.createdAt,
        updatedAt: assignment.updatedAt,
        teacherId: assignment.teacherId,
        classroomId: assignment.classroomId,
        viewCount: assignment.viewCount
      }
    });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài tập:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy chi tiết bài tập'
    });
  }
};

// Cập nhật bài tập
const updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, teacherEmail, dueDate, maxScore, status } = req.body;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài tập'
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
      const allowedFileTypes = [
        'application/pdf', 
        'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
        'application/vnd.ms-powerpoint', 
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedFileTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Loại file không được hỗ trợ. Vui lòng tải lên file PDF, Word, PowerPoint hoặc Excel'
        });
      }
      
      // Kiểm tra kích thước file (giới hạn 20MB)
      const maxSize = 20 * 1024 * 1024; // 20MB
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: 'Kích thước file vượt quá giới hạn 20MB'
        });
      }
    }

    // Tạo đối tượng chứa dữ liệu cập nhật
    const updateData = {
      teacherEmail,
      title,
      description,
      dueDate,
      maxScore,
      status
    };

    // Lọc bỏ các trường undefined
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    const result = await updateAssignmentService(assignmentId, updateData, req.file);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi cập nhật bài tập:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi cập nhật bài tập'
    });
  }
};

// Xóa bài tập
const deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { teacherEmail } = req.body;
    
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài tập'
      });
    }
    
    if (!teacherEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email giáo viên để xác thực quyền xóa'
      });
    }

    // Tìm bài tập để kiểm tra quyền xóa
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy bài tập'
      });
    }

   
    // Thực hiện xóa hoàn toàn
    await Assignment.findByIdAndDelete(assignmentId);
    
    // Xóa file nếu có
    if (assignment.filePath) {
      fs.unlinkSync(assignment.filePath);
    }
    
    return res.status(200).json({
      success: true,
      message: 'Xóa bài tập thành công'
    });
  } catch (error) {
    console.error('Lỗi khi xóa bài tập:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xóa bài tập'
    });
  }
};

// Tải về file bài tập
const downloadAssignmentFile = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài tập'
      });
    }
    
    const result = await downloadAssignmentFileService(assignmentId);
    
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
    console.error('Lỗi khi tải về file bài tập:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tải về file bài tập'
    });
  }
};

// Xem trực tiếp file PDF bài tập
const viewAssignmentPdf = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    
    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID bài tập'
      });
    }
    
    const result = await viewAssignmentPdfService(assignmentId);
    
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
    console.error('Lỗi khi xem file PDF bài tập:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xem file PDF bài tập'
    });
  }
};

module.exports = {
  createAssignment,
  getAssignmentsByClassCode,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  downloadAssignmentFile,
  viewAssignmentPdf
};






