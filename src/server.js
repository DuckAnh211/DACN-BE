// Tải các biến môi trường từ file .env
require('dotenv').config();

// Import các module cần thiết
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import các module tự xây dựng
const configViewEngine = require('./config/viewEngine');
const apiRoutes = require('./routes/api');
const connection = require('./config/database');
const { getHomepage } = require('./controllers/homeController');
const { createMediasoupWorker, handleSocket } = require('./sfu/mediasoupManager');

// Khởi tạo ứng dụng Express và server HTTP
const app = express();
const port = process.env.PORT || 8080;
const server = http.createServer(app);

// Tạo instance Socket.IO kèm cấu hình CORS (chống lỗi chặn Cross-Origin)
const io = socketIo(server, {
  cors: {
    origin: ['http://localhost:5500', 'http://192.168.1.26:5500'], // Cho phép các domain này kết nối
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Cấu hình CORS cho Express (dành cho API)
app.use(cors({
  origin: ['http://localhost:5500', 'http://192.168.1.26:5500'],
  credentials: true
}));

// Cấu hình middleware xử lý dữ liệu gửi lên từ client (POST body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Cấu hình view engine (template HTML nếu có sử dụng)
configViewEngine(app);

// Cấu hình thư mục public chứa các file tĩnh (CSS, JS, ảnh,...)
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình đường dẫn để truy cập file upload
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Định nghĩa route trang chủ
const webAPI = express.Router();
webAPI.get("/", getHomepage);

// Áp dụng các route vào app
app.use('/', webAPI);
app.use('/v1/api/', apiRoutes);

// Hàm chính khởi động server và các thành phần cần thiết
(async () => {
  try {
    // Kết nối cơ sở dữ liệu MongoDB (sử dụng mongoose)
    await connection();

    // Khởi tạo worker của mediasoup để quản lý luồng media (video/audio)
    await createMediasoupWorker();

    // Xử lý sự kiện client kết nối tới Socket.IO
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      handleSocket(socket, io); // Giao tiếp truyền thông qua mediasoup
    });

    // Bắt đầu lắng nghe server tại cổng được chỉ định
    server.listen(port, () => {
      console.log(`Backend Nodejs App đang chạy tại cổng ${port}`);
    });

  } catch (error) {
    // Xử lý lỗi trong quá trình khởi động
    console.error('>>> Lỗi khi khởi động server:', error);
    process.exit(1); // Thoát tiến trình nếu có lỗi nghiêm trọng
  }
})();
