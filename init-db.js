require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./src/db');

async function initializeDatabase() {
  try {
    console.log('Connecting to Neon Postgres database...');
    
    // Read SQL schema from file
    const schemaSQL = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
    
    console.log('Executing schema creation...');
    await pool.query(schemaSQL);
    
    console.log('Database schema created successfully');
    
    // Close the database connection
    await pool.end();
    
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// Run initialization
initializeDatabase();
