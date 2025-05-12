const Message = require('../models/Message');

// Get conversation messages
const getConversation = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const messages = await Message.getConversation(
      req.userId, 
      contactId, 
      parseInt(limit), 
      parseInt(offset)
    );
    
    res.json({ messages });
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ error: 'An error occurred while fetching messages' });
  }
};

// Send a message (without socket.io)
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    
    if (!recipientId || !content) {
      return res.status(400).json({ error: 'Recipient ID and content are required' });
    }
    
    const message = await Message.create(req.userId, recipientId, content);
    
    res.status(201).json({ message });
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ error: 'An error occurred while sending message' });
  }
};

// Mark message as read
const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const message = await Message.markAsRead(messageId);
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json({ message });
  } catch (err) {
    console.error('Mark message as read error:', err);
    res.status(500).json({ error: 'An error occurred while marking message as read' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const unreadCounts = await Message.getUnreadCount(req.userId);
    res.json({ unreadCounts });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ error: 'An error occurred while fetching unread messages' });
  }
};

module.exports = {
  getConversation,
  sendMessage,
  markAsRead,
  getUnreadCount
};
