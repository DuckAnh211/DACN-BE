const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const teacherSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    dateOfBirth: {
        type: String
    },
    gender: {
        type: String
    },
    address: {
        type: String
    },
    subject: {
        type: String,
        required: true
    },
    qualification: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Teacher', teacherSchema);