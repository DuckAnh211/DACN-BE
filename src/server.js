// Load environment variables
require('dotenv').config();

// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Import custom modules
const configViewEngine = require('./config/viewEngine');
const apiRoutes = require('./routes/api');
const meetingRoutes = require('./routes/meetingRoutes');
const connection = require('./config/database');
const { getHomepage } = require('./controllers/homeController');
const { createMediasoupWorker, handleSocket } = require('./sfu/mediasoupManager');

// Initialize Express app and HTTP server
const app = express();
const port = process.env.PORT || 8080;
const server = http.createServer(app);

// Create Socket.IO instance with CORS config
const io = socketIo(server, {
  cors: {
    origin: '*', // Or specify your domains
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 5000
});

// Configure CORS for Express
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.1.26:5173'],
  credentials: true
}));

// Serve static files for style and images
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Configure body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configure view engine
configViewEngine(app);

// Configure static directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define routes
const webAPI = express.Router();
webAPI.get("/", getHomepage);

// Apply routes to app
app.use('/', webAPI);
app.use('/v1/api/', apiRoutes);
app.use('/api/meetings', meetingRoutes); // Add this line to register meeting routes

// Hàm chính khởi động server và các thành phần cần thiết
(async () => {
  try {
    // Kết nối cơ sở dữ liệu MongoDB (sử dụng mongoose)
    await connection();

    // Khởi tạo worker của mediasoup để quản lý luồng media (video/audio)
    await createMediasoupWorker();
    console.log('Mediasoup worker initialized successfully');

    // Xử lý sự kiện client kết nối tới Socket.IO
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      // Handle socket errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
      
      // Then handle mediasoup connections
      handleSocket(socket, io);
    });

    // Bắt đầu lắng nghe server tại cổng được chỉ định
    server.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize mediasoup worker:', error);
    process.exit(1);
  }
})();
