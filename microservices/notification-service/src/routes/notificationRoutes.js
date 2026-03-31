const express = require('express');
const {
  createNotification,
  getNotificationsByClassCode,
  markNotificationAsRead,
  deleteNotification
} = require('../controllers/notificationController');

const router = express.Router();

router.post('/notifications', createNotification);
router.get('/notifications/classroom/:classCode', getNotificationsByClassCode);
router.post('/notifications/:notificationId/read', markNotificationAsRead);
router.delete('/notifications/:notificationId', deleteNotification);

module.exports = router;
