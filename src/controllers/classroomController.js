const { createClassroomService, getClassroomsService, deleteClassroomService } = require('../services/classroomService');

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

module.exports = {
    createClassroom,
    getClassrooms,
    deleteClassroom
};
