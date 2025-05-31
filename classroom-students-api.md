# API Lấy Danh Sách Học Viên Của Một Lớp

## Endpoint
GET /v1/api/classroom-students/:classCode

## Mô tả
API này trả về danh sách tất cả học viên đã đăng ký vào một lớp học cụ thể, dựa vào mã lớp.

## Tham số URL
- `classCode`: Mã lớp học cần lấy danh sách học viên

## Ví dụ Request
```
GET http://localhost:8080/v1/api/classroom-students/MATH101
```

## Response thành công (200 OK)
```json
{
  "success": true,
  "data": {
    "classroom": {
      "id": "60a1e2b3c4d5e6f7g8h9i0j1",
      "className": "Toán cao cấp",
      "classCode": "MATH101",
      "subject": "Toán",
      "teacherName": "Phạm Văn A"
    },
    "students": [
      {
        "name": "Nguyễn Văn B",
        "email": "student1@example.com",
        "phone": "0987654321",
        "dateOfBirth": "2000-05-15",
        "gender": "Nam",
        "address": "Hà Nội"
      },
      {
        "name": "Trần Thị C",
        "email": "student2@example.com",
        "phone": "0912345678",
        "dateOfBirth": "2001-03-20",
        "gender": "Nữ",
        "address": "Hồ Chí Minh"
      }
    ]
  }
}
```

## Response lỗi (404 Not Found)
```json
{
  "success": false,
  "message": "Không tìm thấy lớp học với mã lớp này"
}
```

## Response lỗi (400 Bad Request)
```json
{
  "success": false,
  "message": "Vui lòng cung cấp mã lớp học"
}
```

## Response lỗi (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Đã xảy ra lỗi khi lấy danh sách học viên"
}
```