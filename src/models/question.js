const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  code: { type: String, required: true },
  content: { type: String, required: true },
  grade: { type: String, required: true },   
  subject: { type: String, required: true }, 
  status: { type: Boolean, default: true },  
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);