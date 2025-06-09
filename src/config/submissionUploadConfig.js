const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads/submissions nếu chưa tồn tại
const uploadDir = path.join(__dirname, '../uploads/submissions');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Tạo tên file duy nhất bằng cách thêm timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExt = path.extname(file.originalname);
    cb(null, 'submission-' + uniqueSuffix + fileExt);
  }
});

// Lọc file
const fileFilter = (req, file, cb) => {
  // Chấp nhận các loại file phổ biến cho bài nộp
  const allowedTypes = [
    'application/pdf'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Định dạng file không được hỗ trợ. Vui lòng tải lên file PDF.'), false);
  }
};

// Giới hạn kích thước file (20MB)
const limits = {
  fileSize: 20 * 1024 * 1024
};

const submissionUpload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: limits
});

module.exports = submissionUpload;
