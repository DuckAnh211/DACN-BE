const express = require('express');
const bodyParser = require('body-parser');
const { createUser, handleLogin, getUser, forgotPassword, resetPassword, deleteUser } = require('../controllers/userController');
const { findUserByEmail, updateUser } = require('../services/userService');
const routerAPI = express.Router();
const questionController = require('../controllers/questionController');
const examController = require('../controllers/examController');

// Middleware để parse JSON và URL-encoded data
routerAPI.use(express.json());  // Parse application/json
routerAPI.use(express.urlencoded({ extended: true }));

const { createTeacher, handleTeacherLogin, getTeacher, deleteTeacher, getTeacherByEmail } = require('../controllers/teacherController');
const Teacher = require('../models/teacher');
const { updateTeacherService } = require('../services/teacherService');
const { createClassroom, getClassrooms, deleteClassroom } = require('../controllers/classroomController');
const { joinClassroom, getEnrolledClassrooms } = require('../controllers/enrollmentController');

routerAPI.get("/teacher", getTeacher);
routerAPI.post("/teacher/register", createTeacher);
routerAPI.post("/teacher/login", handleTeacherLogin);

routerAPI.get("/", (req, res) => {
    return res.status(200).json("Hello world api");
});

routerAPI.post("/register", createUser);
routerAPI.post("/login", handleLogin);
routerAPI.get("/user", getUser);
// GET tất cả câu hỏi
routerAPI.get('/questions', questionController.getAll);

// POST tạo câu hỏi mới
routerAPI.post('/questions', questionController.create);

// PUT cập nhật câu hỏi
routerAPI.put('/questions/:id', questionController.update);

// DELETE xoá câu hỏi
routerAPI.delete('/questions/:id', questionController.remove);

// PATCH bật/tắt trạng thái
routerAPI.patch('/questions/:id/toggle', questionController.toggle);
// Route quên mật khẩu
routerAPI.post('/forgot-password', forgotPassword);

// Route đặt lại mật khẩu mới
routerAPI.post('/reset-password', resetPassword);
routerAPI.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: "Token is missing" });
    }
    // Hiển thị form đơn giản với token
    res.status(200).send(`
       

    `);
});
routerAPI.get('/username', async (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Return all user profile information
        res.status(200).json({ 
            success: true, 
            email: user.email, 
            name: user.name,
            phone: user.phone,
            dateOfBirth: user.dateOfBirth,
            gender: user.gender,
            address: user.address
        });
    } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// API POST để cập nhật thông tin user
routerAPI.post('/update-user', async (req, res) => {
    const { name, email, phone, dateOfBirth, gender, address } = req.body;

  // Kiểm tra đầu vào
  if (!name || !email) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ name và email.' });
  }

  try {
    // Tìm người dùng theo email
    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản với email được cung cấp.' });
    }

    // Cập nhật thông tin người dùng với đầy đủ các trường
    const updatedUser = await updateUser(email, { 
      name, 
      phone, 
      dateOfBirth, 
      gender, 
      address 
    });

    return res.status(200).json({
      message: 'Thông tin tài khoản đã được cập nhật thành công.',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật tài khoản.' });
  }
});
// Route xóa người dùng
routerAPI.delete('/delete-user', deleteUser);
routerAPI.delete('/delete-teacher', deleteTeacher);

// API POST để cập nhật thông tin giáo viên
// API POST để cập nhật thông tin giáo viên
routerAPI.post('/update-teacher', async (req, res) => {
    const { name, email, phone, dateOfBirth, gender, address, subject, qualification } = req.body;

    // Kiểm tra đầu vào
    if (!name || !email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ name và email.' });
    }

    try {
        // Tìm giáo viên theo email
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản giáo viên với email được cung cấp.' });
        }

        // Cập nhật thông tin giáo viên
        const updatedTeacher = await updateTeacherService(email, {
            name,
            phone,
            dateOfBirth,
            gender,
            address,
            subject,
            qualification
        });

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thông tin giáo viên thành công',
            data: updatedTeacher
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin giáo viên:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi cập nhật thông tin giáo viên'
        });
    }
});
routerAPI.delete('/delete-user', deleteUser);
routerAPI.delete('/delete-teacher', deleteTeacher);

// Route tạo lớp học mới
routerAPI.post('/create-classroom', createClassroom);

// Route lấy danh sách lớp học
routerAPI.get('/classrooms', getClassrooms);

// Route xóa lớp học
routerAPI.delete('/delete-classroom', deleteClassroom);

// Route để user tham gia lớp học
routerAPI.post('/join-classroom', joinClassroom);

// Route để lấy danh sách lớp học đã tham gia
routerAPI.get('/enrolled-classrooms', getEnrolledClassrooms);

// API để lấy thông tin giáo viên theo email
routerAPI.get('/teacherinfo', getTeacherByEmail);
module.exports = routerAPI;
