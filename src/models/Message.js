const db = require('../db');

class Message {
  // Get conversation messages between two users
  static async getConversation(userId, contactId, limit = 20, offset = 0) {
    const result = await db.query(
      `SELECT m.id, m.sender_id, m.recipient_id, m.content, m.created_at, 
              m.read_at, u.username as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2)
          OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.created_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, contactId, limit, offset]
    );
    
    // Mark messages as read
    await db.query(
      `UPDATE messages
       SET read_at = NOW()
       WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL`,
      [contactId, userId]
    );
    
    return result.rows;
  }
  
  // Create a new message
  static async create(senderId, recipientId, content) {
    const result = await db.query(
      `INSERT INTO messages (sender_id, recipient_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, sender_id, recipient_id, content, created_at`,
      [senderId, recipientId, content]
    );
    return result.rows[0];
  }
  
  // Mark message as read
  static async markAsRead(messageId) {
    const result = await db.query(
      'UPDATE messages SET read_at = NOW() WHERE id = $1 RETURNING *',
      [messageId]
    );
    return result.rows[0];
  }
  
  // Get unread message count
  static async getUnreadCount(userId) {
    const result = await db.query(
      `SELECT sender_id, COUNT(*) as count
       FROM messages
       WHERE recipient_id = $1 AND read_at IS NULL
       GROUP BY sender_id`,
      [userId]
    );
    return result.rows;
  }
}

module.exports = Message;
