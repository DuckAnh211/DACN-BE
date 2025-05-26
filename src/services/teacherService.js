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
        message: "Đăng nhập thành công",
        token,
        teacher: {
            name: teacher.name,
            email: teacher.email,
            subject: teacher.subject
        }
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

module.exports = {
    createTeacherService,
    loginTeacherService,
    getTeacherService,
    deleteTeacherService,
    updateTeacherService
};