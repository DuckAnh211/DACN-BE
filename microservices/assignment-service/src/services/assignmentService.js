const Assignment = require('../models/assignment');
const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');
const fs = require('fs');
const path = require('path');

// Tạo bài tập mới
const createAssignmentService = async (assignmentData, file = null) => {
  try {
    // Tìm lớp học theo mã lớp
    const classroom = await Classroom.findOne({ classCode: assignmentData.classCode });
    if (!classroom) {
      throw new Error('Lớp học không tồn tại');
    }

    // Tìm giáo viên theo email
    const teacher = await Teacher.findOne({ email: assignmentData.teacherEmail });
    if (!teacher) {
      throw new Error('Giáo viên không tồn tại');
    }

    // Kiểm tra xem giáo viên có phải là người phụ trách lớp học không
    if (classroom.teacher.toString() !== teacher._id.toString()) {
      throw new Error('Bạn không có quyền tạo bài tập cho lớp học này');
    }

    // Kiểm tra định dạng ngày hạn nộp
    const dueDate = new Date(assignmentData.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error('Định dạng ngày hạn nộp không hợp lệ');
    }

    // Tạo đối tượng bài tập mới
    const newAssignment = new Assignment({
      title: assignmentData.title,
      description: assignmentData.description || '',
      classroomId: classroom._id,
      teacherId: teacher._id,
      dueDate: dueDate,
      maxScore: assignmentData.maxScore || 10
    });

    // Thêm thông tin file nếu có
    if (file) {
      newAssignment.fileUrl = `/uploads/assignments/${file.filename}`;
      newAssignment.fileName = file.originalname;
      newAssignment.fileType = file.mimetype;
      newAssignment.fileSize = file.size;
    } else {
      // Nếu không có file, đặt giá trị mặc định
      newAssignment.fileUrl = '';
      newAssignment.fileName = '';
      newAssignment.fileType = '';
      newAssignment.fileSize = 0;
    }

    // Lưu bài tập vào database
    await newAssignment.save();

    return {
      success: true,
      message: 'Tạo bài tập thành công',
      data: newAssignment
    };
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách bài tập theo mã lớp
const getAssignmentsByClassCodeService = async (classCode) => {
  try {
    // Tìm lớp học theo mã lớp
    const classroom = await Classroom.findOne({ classCode });
    if (!classroom) {
      throw new Error('Lớp học không tồn tại');
    }

    // Lấy danh sách bài tập của lớp học
    const assignments = await Assignment.find({ 
      classroomId: classroom._id,
      status: { $ne: 'deleted' }
    })
    .sort({ createdAt: -1 })
    .populate('teacherId', 'name email');

    return {
      success: true,
      data: assignments
    };
  } catch (error) {
    throw error;
  }
};

// Lấy chi tiết bài tập
const getAssignmentByIdService = async (assignmentId) => {
  try {
    // Tìm bài tập theo ID
    const assignment = await Assignment.findById(assignmentId)
      .populate('teacherId', 'name email')
      .populate('classroomId', 'className classCode');

    if (!assignment || assignment.status === 'deleted') {
      throw new Error('Không tìm thấy bài tập');
    }

    // Tăng số lượt xem
    assignment.viewCount += 1;
    await assignment.save();

    return {
      success: true,
      data: assignment
    };
  } catch (error) {
    throw error;
  }
};

// Cập nhật bài tập
const updateAssignmentService = async (assignmentId, updateData, file = null) => {
  try {
    // Tìm bài tập theo ID
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment || assignment.status === 'deleted') {
      throw new Error('Không tìm thấy bài tập');
    }
    
    // Kiểm tra quyền chỉnh sửa
    if (updateData.teacherEmail) {
      const teacher = await Teacher.findOne({ email: updateData.teacherEmail });
      if (!teacher) {
        throw new Error('Không tìm thấy giáo viên');
      }
      
      // Kiểm tra xem giáo viên có phải là người tạo bài tập không
      if (assignment.teacherId.toString() !== teacher._id.toString()) {
        throw new Error('Bạn không có quyền chỉnh sửa bài tập này');
      }
    }

    // Cập nhật thông tin cơ bản
    if (updateData.title) assignment.title = updateData.title;
    if (updateData.description !== undefined) assignment.description = updateData.description;
    if (updateData.dueDate) {
      const dueDate = new Date(updateData.dueDate);
      if (!isNaN(dueDate.getTime())) {
        assignment.dueDate = dueDate;
      }
    }
    if (updateData.maxScore) assignment.maxScore = updateData.maxScore;
    if (updateData.status && ['active', 'inactive'].includes(updateData.status)) {
      assignment.status = updateData.status;
    }
    
    assignment.updatedAt = Date.now();

    // Nếu có file mới, cập nhật thông tin file
    if (file) {
      // Xóa file cũ nếu tồn tại
      const oldFilePath = path.join(__dirname, '..', assignment.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Cập nhật thông tin file mới
      assignment.fileUrl = `/uploads/assignments/${file.filename}`;
      assignment.fileName = file.originalname;
      assignment.fileType = file.mimetype;
      assignment.fileSize = file.size;
    }

    await assignment.save();

    // Lấy thông tin bài tập đã cập nhật với thông tin giáo viên và lớp học
    const updatedAssignment = await Assignment.findById(assignmentId)
      .populate('teacherId', 'name email')
      .populate('classroomId', 'className classCode');

    return {
      success: true,
      message: 'Cập nhật bài tập thành công',
      data: updatedAssignment
    };
  } catch (error) {
    throw error;
  }
};

// Xóa bài tập
const deleteAssignmentService = async (assignmentId, teacherEmail) => {
  try {
    // Tìm bài tập theo ID
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment || assignment.status === 'deleted') {
      throw new Error('Không tìm thấy bài tập');
    }
    
    // Kiểm tra quyền xóa
    const teacher = await Teacher.findOne({ email: teacherEmail });
    if (!teacher) {
      throw new Error('Không tìm thấy giáo viên');
    }
    
    // Kiểm tra xem giáo viên có phải là người tạo bài tập không
    if (assignment.teacherId.toString() !== teacher._id.toString()) {
      throw new Error('Bạn không có quyền xóa bài tập này');
    }

    // Đánh dấu bài tập là đã xóa (soft delete)
    assignment.status = 'deleted';
    assignment.updatedAt = Date.now();
    
    await assignment.save();

    return {
      success: true,
      message: 'Xóa bài tập thành công'
    };
  } catch (error) {
    throw error;
  }
};

// Tải về file bài tập
const downloadAssignmentFileService = async (assignmentId) => {
  try {
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment || assignment.status === 'deleted') {
      throw new Error('Không tìm thấy bài tập');
    }
    
    // Lấy đường dẫn đầy đủ đến file
    const filePath = path.join(__dirname, '..', assignment.fileUrl);
    
    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new Error('File bài tập không tồn tại');
    }
    
    return {
      success: true,
      filePath,
      fileName: assignment.fileName,
      fileType: assignment.fileType
    };
  } catch (error) {
    throw error;
  }
};

// Xem trực tiếp file PDF bài tập
const viewAssignmentPdfService = async (assignmentId) => {
  try {
    const assignment = await Assignment.findById(assignmentId);
    
    if (!assignment || assignment.status === 'deleted') {
      throw new Error('Không tìm thấy bài tập');
    }
    
    // Kiểm tra xem bài tập có file không
    if (!assignment.fileUrl) {
      throw new Error('Bài tập này không có file đính kèm');
    }
    
    // Kiểm tra xem file có phải là PDF không
    if (assignment.fileType !== 'application/pdf') {
      throw new Error('File không phải định dạng PDF');
    }
    
    // Lấy đường dẫn đầy đủ đến file
    const filePath = path.join(__dirname, '..', assignment.fileUrl);
    
    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new Error('File bài tập không tồn tại');
    }
    
    // Tăng số lượt xem
    assignment.viewCount += 1;
    await assignment.save();
    
    return {
      success: true,
      filePath,
      fileName: assignment.fileName,
      fileType: assignment.fileType,
      assignmentTitle: assignment.title
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createAssignmentService,
  getAssignmentsByClassCodeService,
  getAssignmentByIdService,
  updateAssignmentService,
  deleteAssignmentService,
  downloadAssignmentFileService,
  viewAssignmentPdfService
};





