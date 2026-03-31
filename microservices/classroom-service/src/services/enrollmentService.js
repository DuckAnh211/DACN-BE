const User = require('../models/user');
const Classroom = require('../models/classroom');

// Hàm để user tham gia lớp học
const joinClassroomService = async (email, classCode) => {
    try {
        // Tìm user theo email
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('Không tìm thấy người dùng với email này');
        }

        // Tìm lớp học theo mã lớp
        const classroom = await Classroom.findOne({ classCode });
        if (!classroom) {
            throw new Error('Không tìm thấy lớp học với mã lớp này');
        }

        // Kiểm tra xem user đã tham gia lớp học này chưa
        const alreadyEnrolled = user.enrolledClasses.some(
            classId => classId.toString() === classroom._id.toString()
        );

        if (alreadyEnrolled) {
            throw new Error('Bạn đã tham gia lớp học này rồi');
        }

        // Thêm lớp học vào danh sách đã tham gia của user
        user.enrolledClasses.push(classroom._id);
        await user.save();

        return {
            success: true,
            message: 'Tham gia lớp học thành công',
            data: {
                className: classroom.className,
                classCode: classroom.classCode,
                subject: classroom.subject,
                teacherName: classroom.teacherName
            }
        };
    } catch (error) {
        throw error;
    }
};

// Hàm để lấy danh sách lớp học đã tham gia
const getEnrolledClassroomsService = async (email) => {
    try {
        // Tìm user và populate danh sách lớp học
        const user = await User.findOne({ email })
            .populate({
                path: 'enrolledClasses',
                select: 'className classCode subject teacherName',
                populate: {
                    path: 'teacher',
                    select: 'name email subject'
                }
            });

        if (!user) {
            throw new Error('Không tìm thấy người dùng với email này');
        }

        return {
            success: true,
            data: user.enrolledClasses
        };
    } catch (error) {
        throw error;
    }
};

module.exports = {
    joinClassroomService,
    getEnrolledClassroomsService
};