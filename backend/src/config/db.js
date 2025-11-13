const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'cmscrm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: 'Z'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection function
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Initialize database and tables
const initializeDatabase = async () => {
  try {
    // Create database if not exists
    const createDbConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      charset: 'utf8mb4'
    });

    await createDbConnection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'cmscrm'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await createDbConnection.end();

    // Create tables
    await createTables();
    console.log('✅ Database and tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    throw error;
  }
};

// Drop and recreate database
const dropDatabase = async () => {
  try {
    // Create connection without specifying database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      charset: 'utf8mb4'
    });

    // Drop and recreate database
    await connection.execute(`DROP DATABASE IF EXISTS \`${process.env.DB_NAME || 'cmscrm'}\``);
    console.log('✅ Dropped database');
    
    await connection.execute(`CREATE DATABASE \`${process.env.DB_NAME || 'cmscrm'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Created database');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error with database operations:', error.message);
    throw error;
  }
};

// Drop and recreate all tables
const dropTables = async () => {
  try {
    // Drop tables in reverse order due to foreign keys
    const tables = [
      'api_stats',
      'login_activities', 
      'activity_logs',
      'role_pages_order',
      'role_pages',
      'user_roles',
      'pages',
      'roles',
      'users'
    ];
    
    // Disable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    for (const table of tables) {
      await pool.execute(`DROP TABLE IF EXISTS ${table}`);
      console.log(`✅ Dropped table: ${table}`);
    }
    
    // Re-enable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ All tables dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping tables:', error.message);
    throw error;
  }
};

// Create all tables
const createTables = async () => {
  try {
    // Disable foreign key checks temporarily
    await pool.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Users table (base table, no foreign keys)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_login TIMESTAMP NULL,
        created_by INT NULL,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created users table');

    // Roles table (base table, no foreign keys)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT NULL,
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created roles table');

    // Pages table (base table, no foreign keys)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        url VARCHAR(255) NOT NULL,
        icon VARCHAR(255) NULL,
        is_external BOOLEAN DEFAULT FALSE,
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT NULL,
        INDEX idx_name (name),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created pages table');

    // User Roles junction table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        role_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INT NULL,
        UNIQUE KEY unique_user_role (user_id, role_id),
        INDEX idx_user_id (user_id),
        INDEX idx_role_id (role_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created user_roles table');

    // Role Pages junction table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS role_pages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        page_id INT NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INT NULL,
        UNIQUE KEY unique_role_page (role_id, page_id),
        INDEX idx_role_id (role_id),
        INDEX idx_page_id (page_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created role_pages table');

    // Role Pages Order table (for page hierarchy)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS role_pages_order (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        page_id INT NOT NULL,
        parent_page_id INT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_role_page_order (role_id, page_id),
        INDEX idx_role_id (role_id),
        INDEX idx_page_id (page_id),
        INDEX idx_parent_page_id (parent_page_id),
        INDEX idx_display_order (display_order),
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_page_id) REFERENCES pages(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created role_pages_order table');

    // Activity Log table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(50) NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100) NULL,
        resource_id INT NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        details JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_action (action),
        INDEX idx_created_at (created_at),
        INDEX idx_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created activity_logs table');

    // Login Activity table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS login_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        username VARCHAR(50) NULL,
        ip_address VARCHAR(45) NULL,
        user_agent TEXT NULL,
        success BOOLEAN NOT NULL DEFAULT TRUE,
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        logout_time TIMESTAMP NULL,
        session_duration INT NULL,
        INDEX idx_user_id (user_id),
        INDEX idx_username (username),
        INDEX idx_login_time (login_time),
        INDEX idx_success (success)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created login_activities table');

    // API Stats table for latency tracking
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS api_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        response_time_ms INT NOT NULL,
        status_code INT NOT NULL,
        user_id INT NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_endpoint (endpoint),
        INDEX idx_method (method),
        INDEX idx_response_time (response_time_ms),
        INDEX idx_created_at (created_at),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Created api_stats table');

    // Re-enable foreign key checks
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ All database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    // Re-enable foreign key checks even if there's an error
    await pool.execute('SET FOREIGN_KEY_CHECKS = 1');
    throw error;
  }
};

// Execute query with error handling
const executeQuery = async (query, params = []) => {
  try {
    // For complex queries with JOINs, GROUP BY, aggregates, or subqueries, use query instead of execute
    if (query.includes('GROUP BY') || query.includes('COUNT(') || query.includes('GROUP_CONCAT') ||
        query.includes('JOIN') || query.includes('UNION') || query.includes('HAVING') ||
        query.includes('DISTINCT') || query.includes('ORDER BY') || query.includes('LIMIT')) {
      const [rows] = await pool.query(query, params);
      return rows;
    } else {
      const [rows] = await pool.execute(query, params);
      return rows;
    }
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Get connection from pool
const getConnection = async () => {
  return await pool.getConnection();
};

// Close pool
const closePool = async () => {
  await pool.end();
  console.log('Database pool closed');
};

module.exports = {
  pool,
  executeQuery,
  getConnection,
  testConnection,
  initializeDatabase,
  createTables,
  dropTables,
  dropDatabase,
  closePool,
  execute: executeQuery
};