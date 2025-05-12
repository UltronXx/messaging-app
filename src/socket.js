const { query } = require('./db');

// Store connected users
const connectedUsers = new Map();

const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    
    // Handle user login
    socket.on('login', async (userId) => {
      connectedUsers.set(userId, socket.id);
      socket.userId = userId;
      
      // Get user's contacts and notify them that user is online
      try {
        const result = await query(
          'SELECT contact_id FROM contacts WHERE user_id = $1',
          [userId]
        );
        
        if (result.rows.length > 0) {
          result.rows.forEach(row => {
            const contactSocketId = connectedUsers.get(row.contact_id);
            if (contactSocketId) {
              io.to(contactSocketId).emit('user-status', { userId, status: 'online' });
            }
          });
        }
      } catch (err) {
        console.error('Error fetching contacts:', err);
      }
    });
    
    // Handle new messages
    socket.on('send-message', async (messageData) => {
      try {
        // Insert message into database
        const result = await query(
          'INSERT INTO messages (sender_id, recipient_id, content, created_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
          [messageData.senderId, messageData.recipientId, messageData.content]
        );
        
        const newMessage = result.rows[0];
        
        // Send to recipient if online
        const recipientSocketId = connectedUsers.get(messageData.recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit('new-message', newMessage);
        }
        
        // Confirm message was sent
        socket.emit('message-sent', { 
          messageId: newMessage.id, 
          timestamp: newMessage.created_at 
        });
      } catch (err) {
        console.error('Error saving message:', err);
        socket.emit('message-error', { error: 'Failed to send message' });
      }
    });
    
    // Handle typing indicators
    socket.on('typing', (data) => {
      const recipientSocketId = connectedUsers.get(data.recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('user-typing', { 
          userId: data.senderId, 
          isTyping: data.isTyping 
        });
      }
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        
        // Notify contacts that user went offline
        notifyUserOffline(socket.userId, io);
      }
      console.log('Client disconnected:', socket.id);
    });
  });
};

// Helper function to notify contacts when a user goes offline
async function notifyUserOffline(userId, io) {
  try {
    const result = await query(
      'SELECT contact_id FROM contacts WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length > 0) {
      result.rows.forEach(row => {
        const contactSocketId = connectedUsers.get(row.contact_id);
        if (contactSocketId) {
          io.to(contactSocketId).emit('user-status', { userId, status: 'offline' });
        }
      });
    }
  } catch (err) {
    console.error('Error notifying contacts of offline status:', err);
  }
}

module.exports = { setupSocketHandlers };
