const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
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
    enrolledClasses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom'
    }]
});

module.exports = mongoose.model('User', userSchema);
