const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Meeting = require('../models/Meeting');
const auth = require('../middleware/auth');

// GET all meetings
router.get('/', auth, async (req, res) => {
  try {
    const meetings = await Meeting.find({ createdBy: req.user.id });
    res.json({
      success: true,
      data: meetings
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create a new meeting
router.post('/', auth, async (req, res) => {
  try {
    const { name, settings } = req.body;
    
    const meeting = new Meeting({
      id: uuidv4(),
      name: name || `Meeting ${new Date().toLocaleString()}`,
      createdBy: req.user.id,
      settings: settings || {},
      isActive: true
    });
    
    await meeting.save();
    
    res.status(201).json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET a specific meeting
router.get('/:id', auth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ id: req.params.id });
    
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }
    
    res.json({
      success: true,
      data: meeting
    });
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
