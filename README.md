# DACN-BE

Backend cho hệ thống E-Learning/FutureClass, được tổ chức theo kiến trúc microservices bằng Node.js và Express. Dự án cung cấp các service phục vụ xác thực, người dùng, lớp học, bài học, bài tập, bài kiểm tra, bài nộp, thông báo và phòng học trực tuyến.

## Giới thiệu

DACN-BE là phần backend của nền tảng học trực tuyến, kết nối với frontend `DACN-FE`. Mỗi nghiệp vụ chính được tách thành một service riêng, giúp dễ phát triển, triển khai và mở rộng từng phần của hệ thống.

API Gateway đóng vai trò điểm vào chung cho client, sau đó proxy request đến các service tương ứng. Các service dùng Express để xây dựng API, MongoDB/Mongoose để lưu dữ liệu, JWT cho xác thực và MediaSoup cho chức năng họp trực tuyến.

## Tính năng chính

- Xác thực người dùng, đăng nhập, đăng ký và xử lý token.
- Quản lý học sinh, giáo viên và hồ sơ người dùng.
- Quản lý lớp học, mã lớp và tham gia lớp.
- Quản lý bài học, tài liệu học tập và nội dung lớp học.
- Quản lý bài tập, file bài tập và bài nộp của học sinh.
- Quản lý bài kiểm tra, câu hỏi, quiz và kết quả làm bài.
- Gửi và đọc thông báo theo lớp học.
- Quản lý phòng học trực tuyến.
- Hỗ trợ video meeting realtime thông qua MediaSoup.
- API Gateway gom các endpoint backend dưới cùng một cổng truy cập.

## Công nghệ sử dụng

- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcrypt
- Multer
- MediaSoup
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
CLIENT_URL=http://localhost:5173
```

Ghi chú:

- `PORT` có thể khác nhau theo từng service.
- `MONGO_DB_URL` cần được cấu hình cho các service dùng database.
- `JWT_SECRET` cần có cho các service xử lý xác thực/token.
- `CLIENT_URL` dùng cho các luồng liên quan đến frontend, ví dụ reset password.

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
- Tạo WebRTC transport.
- Produce/consume audio, video và screen share.
- Gửi chat realtime trong phòng.
- Thông báo khi người dùng rời phòng hoặc dừng chia sẻ.

Frontend tương ứng nằm ở repo:

```text
https://github.com/DuckAnh211/DACN-FE
```

## Ghi chú phát triển

- Không commit thông tin nhạy cảm thật trong `.env`.
- Nên đồng bộ `PORT`, `MONGO_DB_URL`, `JWT_SECRET` giữa các service khi chạy local.
- API Gateway hiện được cấu hình thuận tiện cho môi trường Docker network; khi chạy thủ công từng service trên localhost cần điều chỉnh target proxy.
- Một số service đang tách controller/service/model nhưng route public chủ yếu đi qua `index.js`, cần kiểm tra thêm khi mở rộng API.
- Code hiện có sử dụng thêm các module như `mongoose`, `jsonwebtoken`, `bcrypt`, `multer` và `mediasoup`; nếu chạy gặp lỗi `MODULE_NOT_FOUND`, cần bổ sung các dependency còn thiếu vào `package.json` của service tương ứng.

## Repository liên quan

- Frontend: [DuckAnh211/DACN-FE](https://github.com/DuckAnh211/DACN-FE)
- Backend: [DuckAnh211/DACN-BE](https://github.com/DuckAnh211/DACN-BE)
