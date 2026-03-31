const Notification = require('../models/notification');
const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');
const User = require('../models/user');

// Tạo thông báo mới
const createNotificationService = async (data) => {
  try {
    // Kiểm tra lớp học tồn tại
    const classroom = await Classroom.findOne({ classCode: data.classCode });
    if (!classroom) {
      throw new Error('Lớp học không tồn tại với mã lớp này');
    }

    // Kiểm tra giáo viên tồn tại và có quyền với lớp học này
    const teacher = await Teacher.findOne({ email: data.teacherEmail });
    if (!teacher) {
      throw new Error('Không tìm thấy giáo viên với email này');
    }

    // Kiểm tra xem giáo viên có phải là giáo viên của lớp này không
    if (classroom.teacher.toString() !== teacher._id.toString()) {
      throw new Error('Bạn không phải là giáo viên của lớp học này');
    }

    // Tạo thông báo mới
    const notification = new Notification({
      title: data.title,
      content: data.content,
      classCode: data.classCode,
      teacherEmail: data.teacherEmail,
      teacherName: teacher.name
    });

    await notification.save();

    return {
      success: true,
      message: 'Gửi thông báo thành công',
      data: notification
    };
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách thông báo theo mã lớp
const getNotificationsByClassCodeService = async (classCode, userEmail = null) => {
  try {
    // Kiểm tra lớp học tồn tại
    const classroom = await Classroom.findOne({ classCode });
    if (!classroom) {
      throw new Error('Lớp học không tồn tại với mã lớp này');
    }

    // Lấy danh sách thông báo của lớp
    const notifications = await Notification.find({ classCode })
      .sort({ createdAt: -1 });

    // Nếu có email người dùng, đánh dấu thông báo đã đọc
    if (userEmail) {
      // Kiểm tra xem người dùng có trong lớp không
      const user = await User.findOne({ 
        email: userEmail,
        enrolledClasses: classroom._id 
      });

      if (!user) {
        throw new Error('Bạn không phải là thành viên của lớp học này');
      }
    }

    return {
      success: true,
      data: notifications
    };
  } catch (error) {
    throw error;
  }
};

// Đánh dấu thông báo đã đọc
const markNotificationAsReadService = async (notificationId, userEmail) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Không tìm thấy thông báo');
    }

    // Kiểm tra xem người dùng có trong lớp không
    const classroom = await Classroom.findOne({ classCode: notification.classCode });
    if (!classroom) {
      throw new Error('Lớp học không tồn tại');
    }

    const user = await User.findOne({ 
      email: userEmail,
      enrolledClasses: classroom._id 
    });

    if (!user) {
      throw new Error('Bạn không phải là thành viên của lớp học này');
    }

    // Kiểm tra xem đã đọc chưa
    if (!notification.readBy.includes(userEmail)) {
      notification.readBy.push(userEmail);
      await notification.save();
    }

    return {
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc'
    };
  } catch (error) {
    throw error;
  }
};

// Xóa thông báo
const deleteNotificationService = async (notificationId, teacherEmail) => {
  try {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Không tìm thấy thông báo');
    }

    // Kiểm tra quyền xóa (chỉ giáo viên tạo thông báo mới được xóa)
    if (notification.teacherEmail !== teacherEmail) {
      throw new Error('Bạn không có quyền xóa thông báo này');
    }

    await Notification.findByIdAndDelete(notificationId);

    return {
      success: true,
      message: 'Xóa thông báo thành công'
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNotificationService,
  getNotificationsByClassCodeService,
  markNotificationAsReadService,
  deleteNotificationService
};