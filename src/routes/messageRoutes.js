const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const auth = require('../middleware/auth');

// All message routes require authentication
router.use(auth);

router.get('/conversation/:contactId', messageController.getConversation);
router.post('/', messageController.sendMessage);
router.put('/:messageId/read', messageController.markAsRead);
router.get('/unread', messageController.getUnreadCount);

module.exports = router;
