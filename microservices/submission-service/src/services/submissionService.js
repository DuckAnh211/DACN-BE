const Submission = require('../models/submission');
const Assignment = require('../models/assignment');
const User = require('../models/user');
const Classroom = require('../models/classroom');
const fs = require('fs');
const path = require('path');

// Tạo bài nộp mới
const createSubmissionService = async (submissionData, file) => {
  try {
    // Kiểm tra bài tập tồn tại
    const assignment = await Assignment.findById(submissionData.assignmentId);
    if (!assignment) {
      throw new Error('Không tìm thấy bài tập');
    }
    
    // Kiểm tra hạn nộp bài
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isLate = now > dueDate;

    // Kiểm tra học sinh tồn tại
    const student = await User.findOne({ email: submissionData.studentEmail });
    if (!student) {
      throw new Error('Không tìm thấy thông tin học sinh');
    }

    // Kiểm tra học sinh đã tham gia lớp học
    const classroom = await Classroom.findOne({ classCode: submissionData.classCode });
    if (!classroom) {
      throw new Error('Không tìm thấy lớp học');
    }

    // Kiểm tra xem học sinh đã nộp bài cho bài tập này chưa
    const existingSubmission = await Submission.findOne({
      assignmentId: submissionData.assignmentId,
      studentId: student._id
    });

    // Nếu đã có bài nộp, cập nhật thay vì tạo mới
    if (existingSubmission) {
      // Xóa file cũ nếu tồn tại
      const oldFilePath = path.join(__dirname, '..', existingSubmission.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Cập nhật thông tin bài nộp
      existingSubmission.fileUrl = `/uploads/submissions/${file.filename}`;
      existingSubmission.fileName = file.originalname;
      existingSubmission.fileType = file.mimetype;
      existingSubmission.fileSize = file.size;
      existingSubmission.comment = submissionData.comment || '';
      existingSubmission.updatedAt = Date.now();
      existingSubmission.status = isLate ? 'late' : 'pending'; // Cập nhật trạng thái dựa vào thời gian nộp

      await existingSubmission.save();

      return {
        success: true,
        message: 'Cập nhật bài nộp thành công',
        data: existingSubmission,
        isResubmission: true,
        isLate: isLate
      };
    }

    // Tạo bài nộp mới
    const newSubmission = new Submission({
      studentId: student._id,
      studentEmail: student.email,
      studentName: student.name,
      assignmentId: assignment._id,
      classCode: submissionData.classCode,
      fileUrl: `/uploads/submissions/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      comment: submissionData.comment || '',
      status: isLate ? 'late' : 'pending'
    });

    await newSubmission.save();

    // Cập nhật số lượng bài nộp cho bài tập
    assignment.submissionCount += 1;
    await assignment.save();

    return {
      success: true,
      message: 'Nộp bài thành công',
      data: newSubmission,
      isResubmission: false,
      isLate: isLate
    };
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách bài nộp theo bài tập
const getSubmissionsByAssignmentService = async (assignmentId) => {
  try {
    const submissions = await Submission.find({ assignmentId })
      .sort({ submittedAt: -1 });
    
    return {
      success: true,
      data: submissions
    };
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách bài nộp của học sinh
const getStudentSubmissionsService = async (studentEmail) => {
  try {
    const submissions = await Submission.find({ studentEmail })
      .sort({ submittedAt: -1 })
      .populate('assignmentId', 'title description dueDate maxScore');
    
    return {
      success: true,
      data: submissions
    };
  } catch (error) {
    throw error;
  }
};

// Lấy chi tiết bài nộp
const getSubmissionByIdService = async (submissionId) => {
  try {
    const submission = await Submission.findById(submissionId)
      .populate('assignmentId', 'title description dueDate maxScore')
      .populate('studentId', 'name email');
    
    if (!submission) {
      throw new Error('Không tìm thấy bài nộp');
    }
    
    return {
      success: true,
      data: submission
    };
  } catch (error) {
    throw error;
  }
};

// Tải về file bài nộp
const downloadSubmissionFileService = async (submissionId) => {
  try {
    const submission = await Submission.findById(submissionId);
    
    if (!submission) {
      throw new Error('Không tìm thấy bài nộp');
    }
    
    // Lấy đường dẫn đầy đủ đến file
    const filePath = path.join(__dirname, '..', submission.fileUrl);
    
    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new Error('File bài nộp không tồn tại');
    }
    
    return {
      success: true,
      filePath,
      fileName: submission.fileName,
      fileType: submission.fileType
    };
  } catch (error) {
    throw error;
  }
};

// Đánh giá bài nộp (dành cho giáo viên)
const gradeSubmissionService = async (submissionId, gradeData, teacherEmail) => {
  try {
    const submission = await Submission.findById(submissionId)
      .populate('assignmentId');
    
    if (!submission) {
      throw new Error('Không tìm thấy bài nộp');
    }
    
    // Kiểm tra quyền của giáo viên
    const classroom = await Classroom.findOne({ classCode: submission.classCode })
      .populate('teacher');
    
    if (!classroom) {
      throw new Error('Không tìm thấy lớp học');
    }
    
    if (classroom.teacher.email !== teacherEmail) {
      throw new Error('Bạn không có quyền đánh giá bài nộp này');
    }
    
    // Kiểm tra điểm số hợp lệ
    if (gradeData.grade < 0 || gradeData.grade > submission.assignmentId.maxScore) {
      throw new Error(`Điểm số phải nằm trong khoảng từ 0 đến ${submission.assignmentId.maxScore}`);
    }
    
    // Cập nhật thông tin đánh giá
    submission.grade = gradeData.grade;
    submission.feedback = gradeData.feedback || '';
    submission.isGraded = true;
    submission.status = 'reviewed';
    submission.updatedAt = Date.now();
    
    await submission.save();
    
    return {
      success: true,
      message: 'Đánh giá bài nộp thành công',
      data: submission
    };
  } catch (error) {
    throw error;
  }
};

// Kiểm tra trạng thái nộp bài của sinh viên trong một lớp
const getStudentSubmissionStatusService = async (classCode, studentEmail) => {
  try {
    // Kiểm tra lớp học tồn tại
    const classroom = await Classroom.findOne({ classCode });
    if (!classroom) {
      throw new Error('Không tìm thấy lớp học với mã lớp này');
    }

    // Kiểm tra sinh viên tồn tại
    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      throw new Error('Không tìm thấy thông tin sinh viên');
    }

    // Kiểm tra sinh viên đã tham gia lớp học
    const isEnrolled = student.enrolledClasses.some(
      classId => classId.toString() === classroom._id.toString()
    );
    
    if (!isEnrolled) {
      throw new Error('Sinh viên chưa tham gia lớp học này');
    }

    // Lấy tất cả bài tập của lớp học
    const assignments = await Assignment.find({
      classroomId: classroom._id,
      status: { $ne: 'deleted' }
    }).sort({ dueDate: 1 });

    // Lấy tất cả bài nộp của sinh viên trong lớp học này
    const submissions = await Submission.find({
      studentId: student._id,
      classCode
    });

    // Tạo map để tra cứu nhanh
    const submissionMap = {};
    submissions.forEach(submission => {
      submissionMap[submission.assignmentId.toString()] = submission;
    });

    // Tạo danh sách kết quả với thông tin đã nộp hay chưa
    const result = assignments.map(assignment => {
      const submission = submissionMap[assignment._id.toString()];
      
      return {
        assignmentId: assignment._id.toString(),
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        hasFile: !!assignment.fileUrl,
        fileName: assignment.fileName || null,
        status: assignment.status,
        createdAt: assignment.createdAt,
        submissionStatus: submission ? {
          submitted: true,
          submissionId: submission._id.toString(),
          submittedAt: submission.submittedAt,
          isLate: submission.status === 'late',
          grade: submission.grade,
          isGraded: submission.isGraded,
          status: submission.status,
          feedback: submission.feedback || null
        } : {
          submitted: false,
          isLate: new Date() > new Date(assignment.dueDate),
          feedback: null
        }
      };
    });

    return {
      success: true,
      data: {
        classroom: {
          id: classroom._id.toString(),
          className: classroom.className,
          classCode: classroom.classCode
        },
        student: {
          id: student._id.toString(),
          name: student.name,
          email: student.email
        },
        assignments: result
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createSubmissionService,
  getSubmissionsByAssignmentService,
  getStudentSubmissionsService,
  getSubmissionByIdService,
  downloadSubmissionFileService,
  gradeSubmissionService,
  getStudentSubmissionStatusService
};



