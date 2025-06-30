const express = require('express');
const bodyParser = require('body-parser');
const { createUser, handleLogin, getUser, forgotPassword, resetPassword, deleteUser } = require('../controllers/userController');
const { findUserByEmail, updateUser } = require('../services/userService');
const { createTeacher, handleTeacherLogin, getTeacher, deleteTeacher } = require('../controllers/teacherController');
const Teacher = require('../models/teacher');
const { updateTeacherService, getTeacherByEmailService } = require('../services/teacherService');
const { createClassroom, getClassrooms, deleteClassroom, getClassroomStudents, updateClassroom, leaveClassroom } = require('../controllers/classroomController');
const { joinClassroom, getEnrolledClassrooms } = require('../controllers/enrollmentController');
const questionController = require('../controllers/questionController');
const examController = require('../controllers/examController');
const lessonController = require('../controllers/lessonController');
const upload = require('../config/multerConfig');
const notificationController = require('../controllers/notificationController');
const submissionController = require('../controllers/submissionController');
const submissionUpload = require('../config/submissionUploadConfig');
const assignmentController = require('../controllers/assignmentController');
const assignmentUpload = require('../config/assignmentUploadConfig');
const path = require('path');

const routerAPI = express.Router();
const multer = require('multer');

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
routerAPI.delete('/exams/:id', examController.remove);

// Bài kiểm tra trắc nghiệm 
// Tạo bài kiểm tra trắc nghiệm 
routerAPI.post('/quizzes', examController.createQuiz);
// Lấy danh sách bài kiểm tra theo mã lớp
routerAPI.get('/quizzes/class/:classCode', examController.getQuizzesByClassCode);
// Lấy chi tiết quiz (bao gồm câu hỏi và đáp án)
routerAPI.get('/quizzes/:quizId', examController.getQuizDetail);
// Lưu kết quả làm quiz của học sinh
routerAPI.post('/quiz-results', examController.saveQuizResult);
// Lấy danh sách kết quả làm quiz của học sinh theo quizId (dành cho giáo viên)
routerAPI.get('/quiz-results/:quizId', examController.getQuizResultsByQuizId);
// Xóa bài kiểm tra trắc nghiệm (quiz)
routerAPI.delete('/quizzes/:quizId', examController.deleteQuiz);

// Lớp học
routerAPI.post('/create-classroom', createClassroom);
routerAPI.get('/classrooms', getClassrooms);
routerAPI.delete('/delete-classroom', deleteClassroom);
routerAPI.post('/join-classroom', joinClassroom);
routerAPI.get('/enrolled-classrooms', getEnrolledClassrooms);
routerAPI.get('/classroom-students/:classCode', getClassroomStudents);
routerAPI.post('/leave-classroom', leaveClassroom);

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

// Xem nội dung file PDF bài học
routerAPI.get('/lessons/:lessonId/view-pdf', lessonController.viewLessonPdf);

// Thêm routes cho thông báo
// Tạo thông báo mới
routerAPI.post('/notifications', notificationController.createNotification);

// Lấy danh sách thông báo theo mã lớp
routerAPI.get('/notifications/classroom/:classCode', notificationController.getNotificationsByClassCode);

// Đánh dấu thông báo đã đọc
routerAPI.post('/notifications/:notificationId/read', notificationController.markNotificationAsRead);

// Xóa thông báo
routerAPI.delete('/notifications/:notificationId', notificationController.deleteNotification);

// Cập nhật thông tin lớp học (thay đổi giáo viên)
routerAPI.post('/update-classroom', updateClassroom);

// Thêm routes cho bài nộp của học sinh
// Nộp bài
routerAPI.post('/submissions', submissionUpload.single('submissionFile'), submissionController.submitAssignment);

// Lấy danh sách bài nộp theo bài tập (cho giáo viên) - Updated format
routerAPI.get('/submissions/assignment/:assignmentId', submissionController.getSubmissionsByAssignment);

// Lấy danh sách bài nộp của học sinh
routerAPI.get('/submissions/student/:studentEmail', submissionController.getStudentSubmissions);

// Lấy chi tiết bài nộp
routerAPI.get('/submissions/:submissionId', submissionController.getSubmissionById);

// Thêm route xem nội dung file PDF bài nộp
routerAPI.get('/submissions/:submissionId/view-pdf', submissionController.viewSubmissionPdf);

// Đánh giá bài nộp (dành cho giáo viên)
routerAPI.post('/submissions/:submissionId/grade', submissionController.gradeSubmission);

// Xóa bài nộp
routerAPI.delete('/submissions/:submissionId', submissionController.deleteSubmission);

// Cập nhật bài nộp (cho phép thay đổi file bài nộp)
routerAPI.put('/submissions/:submissionId', submissionUpload.single('submissionFile'), submissionController.updateSubmission);

// Thêm routes cho bài tập
// Tạo bài tập mới - sử dụng .single() nhưng không bắt buộc
routerAPI.post('/assignments', assignmentUpload.single('assignmentFile'), assignmentController.createAssignment);

// Lấy danh sách bài tập theo mã lớp
routerAPI.get('/assignments/class/:classCode', assignmentController.getAssignmentsByClassCode);

// Lấy chi tiết bài tập
routerAPI.get('/assignments/:assignmentId', assignmentController.getAssignmentById);

// Cập nhật bài tập
routerAPI.put('/assignments/:assignmentId', assignmentUpload.single('assignmentFile'), assignmentController.updateAssignment);

// Xóa bài tập
routerAPI.delete('/assignments/:assignmentId', assignmentController.deleteAssignment);

// Xem nội dung file PDF bài tập
routerAPI.get('/assignments/:assignmentId/view-pdf', assignmentController.viewAssignmentPdf);

// Kiểm tra trạng thái nộp bài của sinh viên trong một lớp
routerAPI.get('/submissions/status/:classCode', submissionController.getStudentSubmissionStatus);

// Add this route to serve the video meeting page
routerAPI.get('/meeting', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/videomeeting.html'));
});

module.exports = routerAPI;
