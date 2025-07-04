require("dotenv").config();
const Teacher = require("../models/teacher");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');

const createTeacherService = async (name, email, password, phone, dateOfBirth, gender, address, subject, qualification) => {
    try {
        const existingTeacher = await Teacher.findOne({ email });
        if (existingTeacher) {
            throw new Error("Email đã được sử dụng");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newTeacher = new Teacher({
            name,
            email,
            password: hashedPassword,
            phone,
            dateOfBirth,
            gender,
            address,
            subject,
            qualification
        });

        await newTeacher.save();
        return {
            message: "Tạo tài khoản giáo viên thành công",
            
        };
    } catch (error) {

    }
};

const loginTeacherService = async (email, password) => {
    const teacher = await Teacher.findOne({ email });
    if (!teacher) {
        throw new Error("Email không tồn tại");
    }

    const isValidPassword = await bcrypt.compare(password, teacher.password);
    if (!isValidPassword) {
        throw new Error("Mật khẩu không chính xác");
    }

    const token = jwt.sign(
        { teacherId: teacher._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );

    return {
        "EM": "Login successful"
    };
};

const getTeacherService = async () => {
    try {
        const teachers = await Teacher.find({});
        return {
            status: 'success',
            data: teachers.map(teacher => ({
                id: teacher.id,
                name: teacher.name,
                email: teacher.email,
                phone: teacher.phone,
                dateOfBirth: teacher.dateOfBirth,
                gender: teacher.gender,
                address: teacher.address,
                subject: teacher.subject,
                qualification: teacher.qualification
            }))
        };
    } catch (error) {
        console.error('Error getting teachers:', error);
        return {
            status: 'error',
            message: 'Failed to get teachers'
        };
    }
};

// Tìm giáo viên theo email
const findTeacherByEmail = async (email) => {
    try {
        return await Teacher.findOne({ email });
    } catch (error) {
        console.error("Lỗi khi tìm giáo viên theo email:", error);
        throw error;
    }
};

// Cập nhật mật khẩu giáo viên (đã mã hóa)
const updateTeacherPassword = async (teacherId, newPassword) => {
    try {
        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updated = await Teacher.findByIdAndUpdate(
            teacherId,
            { password: hashedPassword },
            { new: true }
        );
        return !!updated;
    } catch (error) {
        console.error("Lỗi khi cập nhật mật khẩu giáo viên:", error);
        throw error;
    }
};

// Gửi email đặt lại mật khẩu cho giáo viên
const nodemailer = require('nodemailer');
const sendResetEmail = async (email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        const resetLink = `${process.env.CLIENT_URL}/v1/api/teacher/reset-password?token=${token}`;
        const mailOptions = {
            from: process.env.GMAIL_USER,
            to: email,
            subject: 'Đặt lại mật khẩu giáo viên',
            html: `<p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào <a href="${resetLink}">đây</a> để đặt lại mật khẩu.</p>`
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Lỗi khi gửi email đặt lại mật khẩu giáo viên:", error);
        return false;
    }
};

const deleteTeacherService = async (email) => {
    try {
        const teacher = await Teacher.findOneAndDelete({ email });
        if (!teacher) {
            throw new Error("Không tìm thấy giáo viên với email này");
        }
        return teacher;
    } catch (error) {
        throw error;
    }
};

const updateTeacherService = async (email, data) => {
    try {
        const updatedTeacher = await Teacher.findOneAndUpdate(
            { email: email },
            { 
                name: data.name, 
                phone: data.phone,
                dateOfBirth: data.dateOfBirth,
                gender: data.gender,
                address: data.address,
                subject: data.subject,
                qualification: data.qualification
            },
            { new: true }
        );
        return updatedTeacher;
    } catch (error) {
        console.error('Lỗi trong quá trình cập nhật giáo viên:', error);
        throw error;
    }
};

const getTeacherByEmailService = async (email) => {
    try {
        const teacher = await Teacher.findOne({ email });
        
        if (!teacher) {
            return {
                success: false,
                message: "Không tìm thấy giáo viên với email này"
            };
        }
        
        return {
            success: true,
            data: {
                id: teacher._id,
                name: teacher.name,
                email: teacher.email,
                phone: teacher.phone,
                dateOfBirth: teacher.dateOfBirth,
                gender: teacher.gender,
                address: teacher.address,
                subject: teacher.subject,
                qualification: teacher.qualification
            }
        };
    } catch (error) {
        console.error("Lỗi khi tìm giáo viên:", error);
        throw error;
    }
};

const createResetToken = (teacherId) => {
    return jwt.sign(
        { userId: teacherId },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );
};

module.exports = {
    createTeacherService,
    loginTeacherService,
    getTeacherService,
    deleteTeacherService,
    updateTeacherService,
    getTeacherByEmailService,
    findTeacherByEmail,
    updateTeacherPassword,
    createResetToken,
    sendResetEmail
};
