const { createTeacherService, loginTeacherService, getTeacherService, deleteTeacherService, getTeacherByEmailService, createResetToken, sendResetEmail, findTeacherByEmail, updateTeacherPassword } = require("../services/teacherService");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const createTeacher = async (req, res) => {
    try {
        const { name, email, password, phone, dateOfBirth, gender, address, subject, qualification } = req.body;
        
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: 'Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái in hoa, chữ cái thường, và ký tự đặc biệt.'
            });
        }
        
        const data = await createTeacherService(
            name, email, password, phone, dateOfBirth, gender, address, subject, qualification
        );
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};

const handleTeacherLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await loginTeacherService(email, password);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({
            message: error.message
        });
    }
};

const getTeacher = async (req, res) => {
    const data = await getTeacherService();
    return res.status(200).json(data);
};

const deleteTeacher = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await deleteTeacherService(email);
        return res.status(200).json({ 
            success: true, 
            message: "Xóa tài khoản giáo viên thành công" 
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const getTeacherByEmail = async (req, res) => {
    const email = req.query.email;

    if (!email) {
        return res.status(400).json({ success: false, message: "Email is required" });
    }

    try {
        const result = await getTeacherByEmailService(email);
        
        if (!result.success) {
            return res.status(404).json({ success: false, message: result.message });
        }
        
        return res.status(200).json({
            success: true,
            ...result.data
        });
    } catch (error) {
        console.error("Error fetching teacher:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

const forgotTeacherPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false });

        const teacher = await findTeacherByEmail(email);
        if (!teacher) return res.status(404).json({ success: false });

        const token = createResetToken(teacher.id);
        const emailSent = await sendResetEmail(email, token);

        if (emailSent) {
            return res.status(200).json({ success: true });
        } else {
            return res.status(500).json({ success: false, message: "Gửi email thất bại" });
        }
    } catch (error) {
        console.error("Forgot teacher password error:", error);
        return res.status(500).json({ success: false });
    }
};

const resetTeacherPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) return res.status(400).json({ success: false });

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{6,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).send("Mật khẩu phải có ít nhất 6 ký tự, bao gồm chữ cái in hoa, chữ cái thường, và ký tự đặc biệt.");
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updated = await updateTeacherPassword(decoded.userId, hashedPassword);

        if (updated) {
            return res.status(200).send("Mật khẩu đã được cập nhật thành công.");
        } else {
            return res.status(500).send("Đã có lỗi, cập nhật mật khẩu thất bại!");
        }
    } catch (error) {
        console.error("Reset teacher password error:", error);
        return res.status(400).send("Đã có lỗi, cập nhật mật khẩu thất bại!");
    }
};

module.exports = {
    createTeacher,
    handleTeacherLogin,
    getTeacher,
    deleteTeacher,
    getTeacherByEmail,
    forgotTeacherPassword,
    resetTeacherPassword
};
