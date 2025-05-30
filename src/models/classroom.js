const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema({
    className: {
        type: String,
        required: true
    },
    classCode: {
        type: String,
        required: true,
        unique: true
    },
    subject: {
        type: String,
        required: true
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true
    },
    teacherName: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Classroom', classroomSchema);
