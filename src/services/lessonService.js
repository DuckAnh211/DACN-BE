const Lesson = require('../models/lesson');
const Classroom = require('../models/classroom');
const Teacher = require('../models/teacher');
const fs = require('fs');
const path = require('path');

// Tạo bài học mới
const createLessonService = async (lessonData, file) => {
  try {
    // Tìm lớp học theo mã lớp thay vì ID
    const classroom = await Classroom.findOne({ classCode: lessonData.classCode });
    if (!classroom) {
      throw new Error('Lớp học không tồn tại');
    }

    // Tìm giáo viên theo email thay vì ID
    const teacher = await Teacher.findOne({ email: lessonData.teacherEmail });
    if (!teacher) {
      throw new Error('Giáo viên không tồn tại');
    }

    // Tạo đối tượng bài học mới
    const newLesson = new Lesson({
      title: lessonData.title,
      description: lessonData.description || '',
      classroomId: classroom._id, // Lưu ID lớp học vào database
      teacherId: teacher._id, // Lưu ID giáo viên vào database
      fileUrl: `/uploads/lessons/${file.filename}`,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size
    });

    // Lưu bài học vào database
    await newLesson.save();

    return {
      success: true,
      message: 'Tải lên bài học thành công',
      data: newLesson
    };
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách bài học theo mã lớp
const getLessonsByClassCodeService = async (classCode) => {
  try {
    // Tìm lớp học theo mã lớp
    const classroom = await Classroom.findOne({ classCode });
    if (!classroom) {
      throw new Error('Lớp học không tồn tại');
    }

    // Tìm tất cả bài học của lớp học này
    const lessons = await Lesson.find({ classroomId: classroom._id })
      .sort({ createdAt: -1 })
      .populate('teacherId', 'name email');

    return {
      success: true,
      data: lessons
    };
  } catch (error) {
    throw error;
  }
};

// Lấy chi tiết bài học
const getLessonByIdService = async (lessonId) => {
  try {
    const lesson = await Lesson.findById(lessonId)
      .populate('teacherId', 'name email')
      .populate('classroomId', 'className classCode');

    if (!lesson) {
      throw new Error('Không tìm thấy bài học');
    }

    return {
      success: true,
      data: lesson
    };
  } catch (error) {
    throw error;
  }
};

// Cập nhật bài học
const updateLessonService = async (lessonId, updateData, file = null) => {
  try {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error('Không tìm thấy bài học');
    }
    
    // Kiểm tra quyền chỉnh sửa (nếu có teacherEmail trong updateData)
    if (updateData.teacherEmail) {
      const teacher = await Teacher.findOne({ email: updateData.teacherEmail });
      if (!teacher) {
        throw new Error('Không tìm thấy giáo viên');
      }
      
      // Kiểm tra xem giáo viên có phải là người tạo bài học không
      if (lesson.teacherId.toString() !== teacher._id.toString()) {
        throw new Error('Bạn không có quyền chỉnh sửa bài học này');
      }
    }

    // Lưu thông tin cũ để ghi lịch sử nếu cần
    const oldTitle = lesson.title;
    const oldDescription = lesson.description;
    const oldFileName = lesson.fileName;

    // Cập nhật thông tin cơ bản - không bao gồm status
    if (updateData.title) lesson.title = updateData.title;
    if (updateData.description !== undefined) lesson.description = updateData.description;
    lesson.updatedAt = Date.now();

    // Nếu có file mới, cập nhật thông tin file
    if (file) {
      // Xóa file cũ nếu tồn tại
      const oldFilePath = path.join(__dirname, '..', lesson.fileUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }

      // Cập nhật thông tin file mới
      lesson.fileUrl = `/uploads/lessons/${file.filename}`;
      lesson.fileName = file.originalname;
      lesson.fileType = file.mimetype;
      lesson.fileSize = file.size;
    }

    await lesson.save();

    // Lấy thông tin bài học đã cập nhật với thông tin giáo viên và lớp học
    const updatedLesson = await Lesson.findById(lessonId)
      .populate('teacherId', 'name email')
      .populate('classroomId', 'className classCode');

    return {
      success: true,
      message: 'Cập nhật bài học thành công',
      data: updatedLesson
    };
  } catch (error) {
    throw error;
  }
};

// Xóa bài học
const deleteLessonService = async (lessonId) => {
  try {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error('Không tìm thấy bài học');
    }

    // Xóa file từ hệ thống
    const filePath = path.join(__dirname, '..', lesson.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Xóa bài học từ database
    await Lesson.findByIdAndDelete(lessonId);

    return {
      success: true,
      message: 'Xóa bài học thành công'
    };
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin file bài học để tải về
const getDownloadableLessonFileService = async (lessonId) => {
  try {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error('Không tìm thấy bài học');
    }
    
    if (lesson.status !== 'active') {
      throw new Error('Bài học không khả dụng');
    }
    
    // Lấy đường dẫn đầy đủ đến file
    const filePath = path.join(__dirname, '..', lesson.fileUrl);
    
    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new Error('File bài học không tồn tại');
    }
    
    return {
      success: true,
      filePath,
      fileName: lesson.fileName,
      fileType: lesson.fileType
    };
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin file PDF bài học để xem trực tiếp
const getViewableLessonPdfService = async (lessonId) => {
  try {
    const lesson = await Lesson.findById(lessonId);
    
    if (!lesson) {
      throw new Error('Không tìm thấy bài học');
    }
    
    if (lesson.status !== 'active') {
      throw new Error('Bài học không khả dụng');
    }
    
    // Kiểm tra xem file có phải là PDF không
    if (lesson.fileType !== 'application/pdf') {
      throw new Error('File không phải định dạng PDF');
    }
    
    // Lấy đường dẫn đầy đủ đến file
    const filePath = path.join(__dirname, '..', lesson.fileUrl);
    
    // Kiểm tra xem file có tồn tại không
    if (!fs.existsSync(filePath)) {
      throw new Error('File bài học không tồn tại');
    }
    
    // Tăng số lượt xem (nếu bạn muốn theo dõi)
    lesson.viewCount = (lesson.viewCount || 0) + 1;
    await lesson.save();
    
    return {
      success: true,
      filePath,
      fileName: lesson.fileName,
      fileType: lesson.fileType,
      lessonTitle: lesson.title
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createLessonService,
  getLessonsByClassCodeService,
  getLessonByIdService,
  updateLessonService,
  deleteLessonService,
  getDownloadableLessonFileService,
  getViewableLessonPdfService
};








