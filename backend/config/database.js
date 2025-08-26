const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance and connection management
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'gebeyanet_db',
  port: process.env.DB_PORT || 3306,
  
  // Connection pool settings
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
 
  // Character set for Ethiopian text support
  charset: 'utf8mb4',
  
  // Timezone setting
  timezone: '+03:00', // Ethiopian timezone (EAT)
  
 
  
  // Date handling
  dateStrings: false,
  
  // Multiple statements (for setup scripts)
  multipleStatements: true
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    console.error('📋 Connection details:', {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      database: process.env.DB_NAME || 'gebeyanet_db',
      port: process.env.DB_PORT || 3306
    });
    
    // Provide helpful error messages
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('🔑 Access denied. Please check your MySQL username and password.');
    } else if (err.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused. Please ensure MySQL server is running.');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('🗄️ Database does not exist. Please create the database first.');
    }
    
    return;
  }
  
  console.log('✅ Database connected successfully');
  console.log(`📦 Connected to MySQL database: ${process.env.DB_NAME || 'gebeyanet_db'}`);
  connection.release();
});

// Handle connection errors
pool.on('connection', (connection) => {
  console.log(`📦 New database connection established as id ${connection.threadId}`);
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('🔄 Attempting to reconnect to database...');
  } else {
    throw err;
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Closing database connections...');
  pool.end(() => {
    console.log('📦 Database connections closed.');
    process.exit(0);
  });
});

module.exports = pool;