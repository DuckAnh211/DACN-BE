const { createTeacherService, loginTeacherService, getTeacherService, deleteTeacherService, getTeacherByEmailService } = require("../services/teacherService");

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

module.exports = {
    createTeacher,
    handleTeacherLogin,
    getTeacher,
    deleteTeacher,
    getTeacherByEmail
};
