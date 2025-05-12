const db = require('../db');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    try {
      const result = await db.query(
        'INSERT INTO users (username, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, username, email, created_at',
        [username, email, hashedPassword]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') { // Unique constraint violation
        throw new Error('Username or email already exists');
      }
      throw err;
    }
  }
  
  // Find user by email
  static async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }
  
  // Find user by ID
  static async findById(id) {
    const result = await db.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }
  
  // Get user contacts
  static async getContacts(userId) {
    const result = await db.query(
      `SELECT u.id, u.username, u.email, c.created_at AS connected_since
       FROM contacts c
       JOIN users u ON c.contact_id = u.id
       WHERE c.user_id = $1`,
      [userId]
    );
    return result.rows;
  }
  
  // Add a contact
  static async addContact(userId, contactId) {
    try {
      await db.query(
        'INSERT INTO contacts (user_id, contact_id, created_at) VALUES ($1, $2, NOW())',
        [userId, contactId]
      );
      // Add reverse relationship
      await db.query(
        'INSERT INTO contacts (user_id, contact_id, created_at) VALUES ($1, $2, NOW())',
        [contactId, userId]
      );
      return true;
    } catch (err) {
      if (err.code === '23505') { // Unique constraint violation
        throw new Error('Contact already exists');
      }
      throw err;
    }
  }
  
  // Search users (for adding contacts)
  static async searchUsers(query, currentUserId) {
    const result = await db.query(
      `SELECT id, username, email
       FROM users
       WHERE (username ILIKE $1 OR email ILIKE $1)
       AND id != $2
       LIMIT 10`,
      [`%${query}%`, currentUserId]
    );
    return result.rows;
  }
  
  // Verify user password
  static async verifyPassword(user, password) {
    if (!user) return false;
    return bcrypt.compare(password, user.password_hash);
  }
}

module.exports = User;
