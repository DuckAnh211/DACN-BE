const express = require('express');
const bodyParser = require('body-parser');
const { createUser, handleLogin, getUser, forgotPassword, resetPassword, deleteUser } = require('../controllers/userController');
const { findUserByEmail, updateUser } = require('../services/userService');
const { createTeacher, handleTeacherLogin, getTeacher, deleteTeacher } = require('../controllers/teacherController');
const Teacher = require('../models/teacher');
const { updateTeacherService, getTeacherByEmailService } = require('../services/teacherService');
const { createClassroom, getClassrooms, deleteClassroom, getClassroomStudents } = require('../controllers/classroomController');
const { joinClassroom, getEnrolledClassrooms } = require('../controllers/enrollmentController');
const questionController = require('../controllers/questionController');
const examController = require('../controllers/examController');
const lessonController = require('../controllers/lessonController');
const upload = require('../config/multerConfig');

const routerAPI = express.Router();

// Middleware để parse JSON và URL-encoded data
routerAPI.use(express.json());  // Parse application/json
routerAPI.use(express.urlencoded({ extended: true }));

routerAPI.get("/", (req, res) => {
  return res.status(200).json("Hello world api");
});

// Auth - User
routerAPI.post("/register", createUser);
routerAPI.post("/login", handleLogin);
routerAPI.get("/user", getUser);

// Auth - Teacher
routerAPI.get("/teacher", getTeacher);
routerAPI.post("/teacher/register", createTeacher);
routerAPI.post("/teacher/login", handleTeacherLogin);

// Quên / đặt lại mật khẩu
routerAPI.post('/forgot-password', forgotPassword);
routerAPI.post('/reset-password', resetPassword);
routerAPI.get('/reset-password', (req, res) => {
    const { token } = req.query;
    if (!token) {
        return res.status(400).json({ message: "Token is missing" });
    }
    res.status(200).send(``);
});

// API lấy thông tin user theo email
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

// API lấy thông tin giáo viên theo email
routerAPI.get('/teacherinfo', async (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        res.status(200).json({ 
            success: true, 
            id: teacher._id,
            email: teacher.email, 
            name: teacher.name,
            phone: teacher.phone,
            dateOfBirth: teacher.dateOfBirth,
            gender: teacher.gender,
            address: teacher.address,
            subject: teacher.subject,
            qualification: teacher.qualification
        });
    } catch (error) {
        console.error("Error fetching teacher:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
});

// Cập nhật thông tin user
routerAPI.post('/update-user', async (req, res) => {
    const { name, email, phone, dateOfBirth, gender, address } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ name và email.' });
    }

    try {
        const user = await findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản với email được cung cấp.' });
        }

        await updateUser(email, { name, phone, dateOfBirth, gender, address });

        return res.status(200).json({
            message: 'Thông tin tài khoản đã được cập nhật thành công.',
        });
    } catch (error) {
        console.error('Error updating user:', error);
        return res.status(500).json({ message: 'Đã xảy ra lỗi khi cập nhật tài khoản.' });
    }
});

// Cập nhật thông tin giáo viên
routerAPI.post('/update-teacher', async (req, res) => {
    const { name, email, phone, dateOfBirth, gender, address, subject, qualification } = req.body;

    if (!name || !email) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ name và email.' });
    }

    try {
        const teacher = await Teacher.findOne({ email });

        if (!teacher) {
            return res.status(404).json({ message: 'Không tìm thấy tài khoản giáo viên với email được cung cấp.' });
        }

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

// Xóa user / giáo viên
routerAPI.delete('/delete-user', deleteUser);
routerAPI.delete('/delete-teacher', deleteTeacher);

// Câu hỏi
routerAPI.get('/questions', questionController.getAll);
routerAPI.post('/questions', questionController.create);
routerAPI.put('/questions/:id', questionController.update);
routerAPI.delete('/questions/:id', questionController.remove);
routerAPI.patch('/questions/:id/toggle', questionController.toggle);

// Đề thi
routerAPI.post('/exams', examController.create);
routerAPI.get('/exams', examController.getAll);

// Lớp học
routerAPI.post('/create-classroom', createClassroom);
routerAPI.get('/classrooms', getClassrooms);
routerAPI.delete('/delete-classroom', deleteClassroom);
routerAPI.post('/join-classroom', joinClassroom);
routerAPI.get('/enrolled-classrooms', getEnrolledClassrooms);
routerAPI.get('/classroom-students/:classCode', getClassroomStudents);

// Thêm routes cho bài học
// Tạo bài học mới
routerAPI.post('/lessons', upload.single('lessonFile'), lessonController.createLesson);

// Lấy danh sách bài học theo mã lớp
routerAPI.get('/lessons/classroom/:classCode', lessonController.getLessonsByClassCode);

// Lấy chi tiết bài học
routerAPI.get('/lessons/:lessonId', lessonController.getLessonById);

// Cập nhật bài học
routerAPI.put('/lessons/:lessonId', upload.single('lessonFile'), lessonController.updateLesson);

// Xóa bài học
routerAPI.delete('/lessons/:lessonId', lessonController.deleteLesson);

// Tải về file bài học
routerAPI.get('/lessons/:lessonId/download', lessonController.downloadLessonFile);

// Xem nội dung file PDF bài học
routerAPI.get('/lessons/:lessonId/view-pdf', lessonController.viewLessonPdf);

module.exports = routerAPI;
