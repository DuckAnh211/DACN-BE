const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');

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

module.exports = {
    createClassroomService,
    getClassroomsService,
    deleteClassroomService
};
