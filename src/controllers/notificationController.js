const {
  createNotificationService,
  getNotificationsByClassCodeService,
  markNotificationAsReadService,
  deleteNotificationService
} = require('../services/notificationService');

// Tạo thông báo mới
const createNotification = async (req, res) => {
  try {
    const { title, content, classCode, teacherEmail } = req.body;

    // Validate đầu vào
    if (!title || !content || !classCode || !teacherEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ tiêu đề, nội dung, mã lớp và email giáo viên'
      });
    }

    const result = await createNotificationService(req.body);

    return res.status(201).json(result);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi tạo thông báo'
    });
  }
};

// Lấy danh sách thông báo theo mã lớp
const getNotificationsByClassCode = async (req, res) => {
  try {
    const { classCode } = req.params;
    const { userEmail } = req.query;

    if (!classCode) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp mã lớp học'
      });
    }

    const result = await getNotificationsByClassCodeService(classCode, userEmail);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách thông báo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi lấy danh sách thông báo'
    });
  }
};

// Đánh dấu thông báo đã đọc
const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userEmail } = req.body;

    if (!notificationId || !userEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID thông báo và email người dùng'
      });
    }

    const result = await markNotificationAsReadService(notificationId, userEmail);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi đánh dấu thông báo đã đọc:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi đánh dấu thông báo đã đọc'
    });
  }
};

// Xóa thông báo
const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { teacherEmail } = req.body;

    if (!notificationId || !teacherEmail) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp ID thông báo và email giáo viên'
      });
    }

    const result = await deleteNotificationService(notificationId, teacherEmail);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Lỗi khi xóa thông báo:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Đã xảy ra lỗi khi xóa thông báo'
    });
  }
};

module.exports = {
  createNotification,
  getNotificationsByClassCode,
  markNotificationAsRead,
  deleteNotification
};