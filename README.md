# DACN-BE

Backend cho hệ thống E-Learning/FutureClass, được tổ chức theo kiến trúc microservices bằng Node.js và Express. Dự án cung cấp các service phục vụ xác thực, người dùng, lớp học, bài học, bài tập, bài kiểm tra, bài nộp, thông báo và phòng học trực tuyến.

## Giới thiệu

DACN-BE là phần backend của nền tảng học trực tuyến, kết nối với frontend `DACN-FE`. Mỗi nghiệp vụ chính được tách thành một service riêng, giúp dễ phát triển, triển khai và mở rộng từng phần của hệ thống.

API Gateway đóng vai trò điểm vào chung cho client, sau đó proxy request đến các service tương ứng. Các service dùng Express để xây dựng API, MongoDB/Mongoose để lưu dữ liệu, JWT cho xác thực và MediaSoup cho chức năng họp trực tuyến.

Tài liệu đồ án mô tả hệ thống theo mô hình client-server, RESTful API, NoSQL Database và realtime communication. Backend trong repo này là phần xử lý nghiệp vụ, dữ liệu và realtime cho website lớp học online.

## Tính năng chính

- Xác thực người dùng, đăng nhập, đăng ký và xử lý token.
- Quản lý học sinh, giáo viên và hồ sơ người dùng.
- Quản lý lớp học, mã lớp và tham gia lớp.
- Quản lý bài học, tài liệu học tập và nội dung lớp học.
- Quản lý bài tập, file bài tập và bài nộp của học sinh.
- Quản lý bài kiểm tra, câu hỏi, quiz và kết quả làm bài.
- Gửi và đọc thông báo theo lớp học.
- Gửi email khôi phục mật khẩu.
- Upload file bài học, bài tập và bài nộp.
- Quản lý phòng học trực tuyến.
- Hỗ trợ video meeting realtime thông qua MediaSoup.
- API Gateway gom các endpoint backend dưới cùng một cổng truy cập.

## Nghiệp vụ theo vai trò

### Học sinh

- Đăng ký, đăng nhập và quên mật khẩu.
- Cập nhật thông tin cá nhân.
- Tham gia hoặc rời lớp học bằng mã lớp.
- Xem lớp học đã tham gia, bài học, tài liệu và thông báo.
- Làm bài tập, nộp bài, xem điểm và nhận xét.
- Làm quiz/bài kiểm tra trực tuyến và nhận kết quả.
- Tham gia buổi học trực tuyến.

### Giáo viên

- Đăng nhập, quên mật khẩu và cập nhật hồ sơ cá nhân.
- Quản lý danh sách học sinh trong lớp.
- Đăng tải bài học và tài liệu.
- Giao bài tập, chấm điểm và nhận xét bài nộp.
- Tạo, thêm câu hỏi và quản lý bài kiểm tra.
- Xem kết quả làm bài của học sinh.
- Gửi thông báo cho học sinh trong lớp.
- Tổ chức phòng học/họp trực tuyến.

### Quản trị viên

- Quản lý và xóa tài khoản học sinh.
- Tạo, chỉnh sửa và xóa tài khoản giáo viên.
- Tạo, chỉnh sửa và xóa lớp học.
- Phân công hoặc thay đổi giáo viên giảng dạy cho từng lớp.
- Xem thống kê tổng quan hệ thống.

## Công nghệ sử dụng

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- MediaSoup
- WebRTC
- Socket.IO
- Nodemailer
- uuid
- CORS
- Morgan
- dotenv
- http-proxy-middleware
- Docker

## Cấu trúc thư mục

```text
DACN-BE/
├── microservices/
│   ├── api-gateway/           # Gateway proxy request đến các service
│   ├── auth-service/          # Xác thực, đăng nhập, đăng ký
│   ├── user-service/          # Quản lý học sinh, giáo viên, hồ sơ
│   ├── classroom-service/     # Quản lý lớp học và tham gia lớp
│   ├── lesson-service/        # Quản lý bài học, tài liệu học tập
│   ├── assignment-service/    # Quản lý bài tập
│   ├── submission-service/    # Quản lý bài nộp
│   ├── exam-service/          # Quản lý bài kiểm tra, câu hỏi, quiz
│   ├── meeting-service/       # Quản lý meeting và MediaSoup SFU
│   └── notification-service/  # Quản lý thông báo lớp học
├── .dockerignore
├── .gitignore
└── README.md
```

## Cấu trúc bên trong service

Các service chính thường được tổ chức theo các thư mục:

- `src/config`: cấu hình database, upload file hoặc cấu hình hệ thống.
- `src/controllers`: nhận request, kiểm tra input và trả response.
- `src/services`: xử lý nghiệp vụ, tách khỏi controller để dễ bảo trì.
- `src/models`: định nghĩa schema/model MongoDB bằng Mongoose.
- `src/routes`: khai báo endpoint API.
- `src/middleware`: middleware xác thực, phân quyền hoặc xử lý request.
- `src/sfu`: thành phần WebRTC/MediaSoup cho video conference.
- `src/server.js`: khởi tạo Express server, middleware, route và kết nối database.
- `uploads`: thư mục lưu file bài học, bài tập hoặc bài nộp nếu service có upload.

## Danh sách service

| Service | Port mặc định | Vai trò |
| --- | ---: | --- |
| api-gateway | 4000 | Điểm vào chung, proxy request đến các service |
| auth-service | 4001 | Xác thực tài khoản, đăng nhập, đăng ký |
| user-service | 4002 | Quản lý học sinh, giáo viên và hồ sơ |
| classroom-service | 4003 | Quản lý lớp học, mã lớp, ghi danh |
| lesson-service | 4004 | Quản lý bài học và tài liệu |
| assignment-service | 4005 | Quản lý bài tập |
| exam-service | 4006 | Quản lý đề kiểm tra, câu hỏi, quiz |
| submission-service | 4007 | Quản lý bài nộp của học sinh |
| meeting-service | 4008 | Quản lý phòng học trực tuyến và MediaSoup |
| notification-service | 4009 | Quản lý thông báo lớp học |

## Thiết kế dữ liệu

Hệ thống sử dụng MongoDB, mỗi thực thể chính được lưu trong một collection riêng. Các collection liên kết với nhau bằng `ObjectId` hoặc mã lớp/mã bài tùy nghiệp vụ.

| Collection | Vai trò chính |
| --- | --- |
| `users` | Lưu tài khoản học sinh/người dùng, thông tin cá nhân và danh sách lớp đã tham gia |
| `teachers` | Lưu tài khoản giáo viên, thông tin chuyên môn và hồ sơ cá nhân |
| `classrooms` | Lưu lớp học, mã lớp, môn học, giáo viên phụ trách và thành viên |
| `lessons` | Lưu bài học, mô tả, tài liệu đính kèm và lớp liên quan |
| `assignments` | Lưu bài tập, hạn nộp, điểm tối đa, file đính kèm và thống kê bài nộp |
| `submissions` | Lưu bài nộp của học sinh, file nộp, điểm, nhận xét và trạng thái chấm |
| `quizzes` | Lưu bài quiz, câu hỏi, đáp án, thời gian làm bài và lớp liên quan |
| `quizresults` | Lưu kết quả làm quiz, câu trả lời, điểm và thời gian nộp |
| `meetings` | Lưu buổi học trực tuyến, host, thời gian, link họp và người tham gia |
| `notifications` | Lưu thông báo lớp học, người gửi, nội dung và danh sách đã đọc |

Quan hệ chính:

- `classrooms` liên kết với `teachers` và danh sách `users`.
- `assignments`, `lessons`, `quizzes`, `meetings` liên kết với lớp học qua `classroomId` hoặc `classCode`.
- `submissions` liên kết với `assignments` và học sinh.
- `quizresults` liên kết với `quizzes` và học sinh.
- `notifications` liên kết với lớp học.

## API Gateway

API Gateway chạy mặc định tại:

```text
http://localhost:4000
```

Các route chính qua gateway:

| Gateway path | Service đích |
| --- | --- |
| `/api/auth` | auth-service |
| `/api/users` | user-service |
| `/api/classrooms` | classroom-service |
| `/api/lessons` | lesson-service |
| `/api/assignments` | assignment-service |
| `/api/exams` | exam-service |
| `/api/submissions` | submission-service |
| `/api/meetings` | meeting-service |
| `/api/notifications` | notification-service |

Một số nhóm route nghiệp vụ theo tài liệu thiết kế:

| Đối tượng | Endpoint tiêu biểu | Chức năng |
| --- | --- | --- |
| User | `POST /register`, `POST /login`, `GET /user` | Đăng ký, đăng nhập, lấy thông tin người dùng |
| Teacher | `GET /teacher`, `POST /teacher/register`, `POST /teacher/login` | Quản lý và xác thực giáo viên |
| Classroom | `POST /create-classroom`, `GET /classrooms`, `DELETE /delete-classroom`, `POST /join-classroom` | CRUD lớp học, tham gia lớp |
| Assignment | `POST /assignments`, `GET /assignments/class/:classCode`, `GET /assignments/:assignmentId` | Quản lý bài tập và file đính kèm |
| Lesson | `POST /lessons`, `GET /lessons/classroom/:classCode` | Quản lý bài học và tài liệu |
| Quiz | `POST /quizzes`, `GET /quizzes/class/:classCode`, `POST /quiz-results` | Quản lý quiz và kết quả |
| Notification | `POST /notifications`, `GET /notifications/classroom/:classCode` | Gửi và xem thông báo |

Kiểm tra gateway:

```bash
curl http://localhost:4000/health
```

Kiểm tra từng service:

```bash
curl http://localhost:<PORT>/api/ping
```

## Yêu cầu cài đặt

Trước khi chạy dự án, cần cài đặt:

- Node.js
- npm
- MongoDB hoặc MongoDB Atlas
- Docker nếu muốn chạy service bằng container

## Biến môi trường

Mỗi service có file `.env` riêng trong thư mục service. Các biến thường dùng:

```env
PORT=4001
MONGO_DB_URL=mongodb://localhost:27017/dacn
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=15m
CLIENT_URL=http://localhost:5173
GMAIL_USER=your_email@example.com
GMAIL_PASS=your_app_password
MEDIASOUP_LISTEN_IP=0.0.0.0
MEDIASOUP_ANNOUNCED_IP=127.0.0.1
```

Ghi chú:

- `PORT` có thể khác nhau theo từng service.
- `MONGO_DB_URL` cần được cấu hình cho các service dùng database.
- `JWT_SECRET` cần có cho các service xử lý xác thực/token.
- `CLIENT_URL` dùng cho các luồng liên quan đến frontend, ví dụ reset password.
- `GMAIL_USER` và `GMAIL_PASS` dùng cho chức năng gửi email khôi phục mật khẩu bằng Nodemailer.
- Các biến `MEDIASOUP_*` dùng cho meeting/video conference nếu service triển khai MediaSoup theo môi trường chạy.

## Cài đặt và chạy từng service

Clone repository:

```bash
git clone https://github.com/DuckAnh211/DACN-BE.git
cd DACN-BE
```

Cài đặt và chạy một service, ví dụ `auth-service`:

```bash
cd microservices/auth-service
npm install
npm run dev
```

Chạy production mode:

```bash
npm start
```

Lặp lại bước trên cho các service cần chạy.

## Chạy API Gateway

```bash
cd microservices/api-gateway
npm install
npm run dev
```

Gateway sẽ proxy request đến các service theo hostname nội bộ như `auth-service:3000`, `user-service:3000`, `classroom-service:3000`. Khi chạy local không qua Docker network, cần chỉnh target trong `microservices/api-gateway/src/server.js` hoặc cấu hình lại hostname/port phù hợp với môi trường local.

## Chạy bằng Docker

Mỗi service có Dockerfile riêng. Ví dụ build và chạy `auth-service`:

```bash
cd microservices/auth-service
docker build -t dacn-auth-service .
docker run --env-file .env -p 4001:3000 dacn-auth-service
```

Làm tương tự với các service khác. Nếu muốn chạy toàn bộ hệ thống thuận tiện hơn, có thể bổ sung `docker-compose.yml` để gom các service, MongoDB và API Gateway vào cùng một network.

## Meeting Service

`meeting-service` chứa phần quản lý phòng học trực tuyến và MediaSoup SFU:

- Tạo/lấy thông tin meeting.
- Quản lý participant trong phòng.
- Khởi tạo MediaSoup worker/router.
- Tạo WebRTC transport.
- Produce/consume audio, video và screen share.
- Broadcast trạng thái chia sẻ màn hình.
- Gửi chat realtime trong phòng.
- Thông báo khi người dùng rời phòng hoặc dừng chia sẻ.

Theo thiết kế, luồng realtime gồm client kết nối phòng bằng Socket.IO, server tạo WebRTC transport, người gửi media tạo producer, người nhận tạo consumer và server broadcast sự kiện producer/chat/screen share đến các thành viên trong phòng.

Frontend tương ứng nằm ở repo:

```text
https://github.com/DuckAnh211/DACN-FE
```

## Ghi chú phát triển

- Không commit thông tin nhạy cảm thật trong `.env`.
- Nên đồng bộ `PORT`, `MONGO_DB_URL`, `JWT_SECRET` giữa các service khi chạy local.
- API Gateway hiện được cấu hình thuận tiện cho môi trường Docker network; khi chạy thủ công từng service trên localhost cần điều chỉnh target proxy.
- Một số service đang tách controller/service/model nhưng route public chủ yếu đi qua `index.js`, cần kiểm tra thêm khi mở rộng API.
- Code hiện có sử dụng thêm các module như `mongoose`, `jsonwebtoken`, `bcrypt`, `multer`, `mediasoup`, `nodemailer`, `socket.io` và `uuid`; nếu chạy gặp lỗi `MODULE_NOT_FOUND`, cần bổ sung các dependency còn thiếu vào `package.json` của service tương ứng.

## Repository liên quan

- Frontend: [DuckAnh211/DACN-FE](https://github.com/DuckAnh211/DACN-FE)
- Backend: [DuckAnh211/DACN-BE](https://github.com/DuckAnh211/DACN-BE)
