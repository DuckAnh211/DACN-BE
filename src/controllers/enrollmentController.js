const { joinClassroomService, getEnrolledClassroomsService } = require('../services/enrollmentService');

// Controller để user tham gia lớp học
const joinClassroom = async (req, res) => {
    try {
        const { email, classCode } = req.body;

        // Validate đầu vào
        if (!email || !classCode) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp đầy đủ email và mã lớp học'
            });
        }

        const result = await joinClassroomService(email, classCode);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi khi tham gia lớp học:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi tham gia lớp học'
        });
    }
};

// Controller để lấy danh sách lớp học đã tham gia
const getEnrolledClassrooms = async (req, res) => {
    try {
        const { email } = req.query;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng cung cấp email'
            });
        }

        const result = await getEnrolledClassroomsService(email);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách lớp học đã tham gia:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Đã xảy ra lỗi khi lấy danh sách lớp học đã tham gia'
        });
    }
};

module.exports = {
    joinClassroom,
    getEnrolledClassrooms
};