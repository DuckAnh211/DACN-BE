const { createClassroomService, getClassroomsService, deleteClassroomService, getClassroomStudentsService, updateClassroomService } = require('../services/classroomService');
const User = require('../models/user');
const Classroom = require('../models/classroom');
const createClassroom = async (req, res) => {
    try {
        const { className, subject, teacherName, classCode } = req.body;

        // Validate đầu vào
        if (!className || !subject || !teacherName || !classCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ thông tin lớp học (tên lớp, môn học, tên giáo viên, mã lớp)'
            });
        }

        const result = await createClassroomService(className, subject, teacherName, classCode);

        return res.status(201).json({
            success: true,
            message: result.message,
            data: result.classroom
        });
    } catch (error) {
        console.error('Lỗi khi tạo lớp học:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi tạo lớp học'
        });
    }
};

// Thêm hàm mới để lấy danh sách lớp học
const getClassrooms = async (req, res) => {
    try {
        const result = await getClassroomsService();
        
        return res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách lớp học:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi lấy danh sách lớp học'
        });
    }
};

// Thêm hàm xóa lớp học
const deleteClassroom = async (req, res) => {
    try {
        const { classCode } = req.body;

        if (!classCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã lớp học cần xóa'
            });
        }

        const result = await deleteClassroomService(classCode);
        
        return res.status(200).json({
            success: true,
            message: 'Xóa lớp học thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa lớp học:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi xóa lớp học'
        });
    }
};

// Thêm controller mới để lấy danh sách học viên của một lớp
const getClassroomStudents = async (req, res) => {
    try {
        const { classCode } = req.params;

        if (!classCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp mã lớp học'
            });
        }

        const result = await getClassroomStudentsService(classCode);
        
        return res.status(200).json({
            success: true,
            data: result.data
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách học viên:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi lấy danh sách học viên'
        });
    }
};

// Cập nhật thông tin lớp học (thay đổi giáo viên)
const updateClassroom = async (req, res) => {
    try {
        const { classCode, newTeacherEmail } = req.body;

        // Validate đầu vào
        if (!classCode || !newTeacherEmail) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ mã lớp học và email giáo viên mới'
            });
        }

        const result = await updateClassroomService(classCode, newTeacherEmail);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi khi cập nhật lớp học:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi cập nhật lớp học'
        });
    }
};

const leaveClassroom = async (req, res) => {
  try {
    const { classCode, studentEmail } = req.body;

    if (!classCode || !studentEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã lớp và email sinh viên'
      });
    }

    // Tìm lớp học
    const classroom = await Classroom.findOne({ classCode });
    if (!classroom) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy lớp học'
      });
    }

    // Tìm sinh viên
    const student = await User.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    // Kiểm tra và khởi tạo mảng nếu cần
    if (!student.enrolledClasses) {
      student.enrolledClasses = [];
    }
    if (!classroom.students) {
      classroom.students = [];
    }

    // Kiểm tra sinh viên có trong lớp không
    const isEnrolled = student.enrolledClasses.some(classId => classId.toString() === classroom._id.toString());
    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Sinh viên chưa tham gia lớp học này'
      });
    }

    // Xóa lớp học khỏi danh sách của sinh viên
    student.enrolledClasses = student.enrolledClasses.filter(classId => classId.toString() !== classroom._id.toString());
    await student.save();

    // Xóa sinh viên khỏi danh sách của lớp học
    classroom.students = classroom.students.filter(studentId => studentId.toString() !== student._id.toString());
    await classroom.save();

    return res.status(200).json({
      success: true,
      message: 'Rời khỏi lớp học thành công',
      data: {
        className: classroom.className,
        classCode: classroom.classCode,
        studentName: student.name
      }
    });

  } catch (error) {
    console.error('Lỗi khi rời khỏi lớp học:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi rời khỏi lớp học'
    });
  }
};

module.exports = {
  createClassroom,
  leaveClassroom,
  getClassrooms,
  deleteClassroom,
  getClassroomStudents,
  updateClassroom
};
