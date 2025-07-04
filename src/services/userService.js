require("dotenv").config();
const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt'); 
const nodemailer = require('nodemailer');


// Hàm tạo token đặt lại mật khẩu
function createResetToken(userId) {
    return jwt.sign(
        { userId }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE } 
    );
}

// Hàm gửi email đặt lại mật khẩu bằng nodemailer
async function sendResetEmail(userEmail, token) {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS
            }
        });

        const resetLink = `${process.env.CLIENT_URL}/v1/api/reset-password?token=${token}`;
        const mailOptions = {
            from: `"FutureClass" <${process.env.GMAIL_USER}>`,
            to: userEmail,
            subject: "Yêu cầu đặt lại mật khẩu",
            html: `<h3>Đặt lại mật khẩu của bạn</h3><p>Nhấn vào <a href="${resetLink}">đây</a> để đặt lại mật khẩu</p>`
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

// Hàm tạo người dùng mới
const createUserService = async (name, email, password, phone, dateOfBirth, gender, address) => {
    try {
        // Check if user already exists - using Mongoose syntax
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return {
                status: 'error',
                message: 'Email already exists'
            };
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with profile information
        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            dateOfBirth,
            gender,
            address
        });

        return {
            status: 'success',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                phone: newUser.phone,
                dateOfBirth: newUser.dateOfBirth,
                gender: newUser.gender,
                address: newUser.address
            }
        };
    } catch (error) {
        console.error('Error creating user:', error);
        return {
            status: 'error',
            message: 'Failed to create user'
        };
    }
};

// Hàm tìm người dùng qua email
const findUserByEmail = async (email) => {
    try {
        const user = await User.findOne({ email });
        return user;
    } catch (error) {
        console.log("Lỗi khi tìm người dùng:", error);
        return null;
    }
};

// Hàm đăng nhập
const loginService = async (email1, password) => {
    try {
        // fetch user by email
        const user = await User.findOne({ email: email1 });
        if (user) {
            // So sánh mật khẩu bằng bcrypt
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const payload = {
                    email: user.email,
                    name: user.name
                };
                
                const access_token = jwt.sign(
                    payload,
                    process.env.JWT_SECRET,
                    {
                        expiresIn: process.env.JWT_EXPIRE
                    }
                );

                return {
                    EM: "Login successful",
                };
            } else {
                return {
                    EM: "Password incorrect"
                };
            }
        } else {
            return {
                EM: "Email incorrect"
            };
        }
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Hàm lấy danh sách người dùng
const getUserService = async () => {
    try {
        const result = await User.find({});
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

// Hàm cập nhật mật khẩu mới
const updateUserPassword = async (userId, newPassword) => {
    try {
        // Lưu mật khẩu mới mà không mã hóa
        await User.findByIdAndUpdate(userId, { password: newPassword });
        return true;
    } catch (error) {
        console.log("Lỗi khi cập nhật mật khẩu:", error);
        return false;
    }
};

const updateUser = async (email, data) => {
    try {
      // Tìm và cập nhật user theo email
      const updatedUser = await User.findOneAndUpdate(
        { email: email }, // Điều kiện tìm kiếm
        { 
          name: data.name, 
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          address: data.address
        }, // Dữ liệu cần cập nhật
        { new: true } // Tùy chọn: trả về bản ghi đã cập nhật
      );
  
      // Trả về người dùng đã được cập nhật
      return updatedUser;
    } catch (error) {
      console.error('Lỗi trong quá trình cập nhật user:', error);
      throw error; // Ném lỗi để xử lý bên ngoài
    }
  };
  // Hàm xóa người dùng
const deleteUserService = async (email) => {
    try {
        const user = await User.findOneAndDelete({ email });
        if (!user) {
            return {
                status: 'error',
                message: 'Không tìm thấy người dùng'
            };
        }
        return {
            status: 'success',
            message: 'Xóa người dùng thành công'
        };
    } catch (error) {
        console.error('Lỗi khi xóa người dùng:', error);
        return {
            status: 'error',
            message: 'Không thể xóa người dùng'
        };
    }
};

module.exports = {
    updateUser,
    createUserService,
    loginService,
    getUserService,
    sendResetEmail,
    findUserByEmail,
    updateUserPassword,
    createResetToken,
    deleteUserService
};

