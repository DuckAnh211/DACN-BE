const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');
const User = require('../models/user');

const createClassroomService = async (className, subject, teacherName, classCode) => {
    try {
        // Kiểm tra xem mã lớp đã tồn tại chưa
        const existingClassroom = await Classroom.findOne({ classCode });
        if (existingClassroom) {
            throw new Error('Mã lớp đã tồn tại, vui lòng chọn mã lớp khác');
        }

        // Tìm giáo viên theo tên
        const teacher = await Teacher.findOne({ name: teacherName });
        if (!teacher) {
            throw new Error('Không tìm thấy giáo viên với tên này');
        }
        
        // Kiểm tra xem subject có trùng với subject của giáo viên không
        if (subject !== teacher.subject) {
            throw new Error(`Môn học không khớp với chuyên môn của giáo viên. Giáo viên ${teacherName} dạy môn ${teacher.subject}`);
        }

        const newClassroom = new Classroom({
            className,
            classCode,
            subject: teacher.subject, // Sử dụng subject của giáo viên
            teacher: teacher._id,
            teacherName: teacher.name // Nếu bạn đã thêm trường này vào schema
        });

        await newClassroom.save();

        // Populate thông tin giáo viên trước khi trả về
        const populatedClassroom = await newClassroom.populate('teacher', 'name email subject');

        return {
            message: 'Tạo lớp học thành công',
            classroom: populatedClassroom
        };
    } catch (error) {
        throw error;
    }
};

// Hàm để lấy danh sách lớp học với thông tin giáo viên đầy đủ
const getClassroomsService = async () => {
  try {
    // Sử dụng populate để thay thế ObjectId bằng thông tin giáo viên
    const classrooms = await Classroom.find({})
      .populate('teacher', 'name email subject')
      .lean();
    
    return {
      success: true,
      data: classrooms
    };
  } catch (error) {
    throw error;
  }
};

// Hàm xóa lớp học theo mã lớp
const deleteClassroomService = async (classCode) => {
    try {
        const classroom = await Classroom.findOneAndDelete({ classCode });
        if (!classroom) {
            throw new Error('Không tìm thấy lớp học với mã lớp này');
        }
        return {
            status: 'success',
            message: 'Xóa lớp học thành công'
        };
    } catch (error) {
        throw error;
    }
};

// Thêm hàm mới để lấy danh sách học viên của một lớp
const getClassroomStudentsService = async (classCode) => {
    try {
        // Tìm lớp học theo mã lớp
        const classroom = await Classroom.findOne({ classCode });
        if (!classroom) {
            throw new Error('Không tìm thấy lớp học với mã lớp này');
        }

        // Tìm tất cả học viên đã đăng ký lớp học này
        const students = await User.find({
            enrolledClasses: classroom._id
        }).select('name email phone dateOfBirth gender address');

        return {
            success: true,
            data: {
                classroom: {
                    id: classroom._id,
                    className: classroom.className,
                    classCode: classroom.classCode,
                    subject: classroom.subject,
                    teacherName: classroom.teacherName
                },
                students: students
            }
        };
    } catch (error) {
        throw error;
    }
};

// Cập nhật thông tin lớp học (thay đổi giáo viên)
const updateClassroomService = async (classCode, newTeacherEmail) => {
  try {
    // Tìm lớp học theo mã lớp
    const classroom = await Classroom.findOne({ classCode });
    if (!classroom) {
      throw new Error('Không tìm thấy lớp học với mã lớp này');
    }

    // Tìm giáo viên mới theo email
    const newTeacher = await Teacher.findOne({ email: newTeacherEmail });
    if (!newTeacher) {
      throw new Error('Không tìm thấy giáo viên với email này');
    }

    // Kiểm tra môn học của giáo viên mới có phù hợp với lớp học không
    if (classroom.subject !== newTeacher.subject) {
      throw new Error(`Môn học không khớp với chuyên môn của giáo viên. Giáo viên ${newTeacher.name} dạy môn ${newTeacher.subject}, trong khi lớp học dạy môn ${classroom.subject}`);
    }

    // Cập nhật thông tin giáo viên cho lớp học
    classroom.teacher = newTeacher._id;
    classroom.teacherName = newTeacher.name;
    
    // Lưu thay đổi
    await classroom.save();

    // Trả về thông tin lớp học đã cập nhật
    const updatedClassroom = await Classroom.findOne({ classCode })
      .populate('teacher', 'name email subject');

    return {
      success: true,
      message: 'Cập nhật giáo viên cho lớp học thành công',
      data: updatedClassroom
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createClassroomService,
  getClassroomsService,
  deleteClassroomService,
  getClassroomStudentsService,
  updateClassroomService
};
