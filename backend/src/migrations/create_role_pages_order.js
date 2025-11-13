const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRolePagesOrderTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cmscrm'
  });

  try {
    console.log('🔄 Creating role_pages_order table...');

    // Create the new table for role-based page ordering
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS role_pages_order (
        id INT PRIMARY KEY AUTO_INCREMENT,
        role_id INT NOT NULL,
        page_id INT NOT NULL,
        parent_page_id INT NULL,
        display_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_page_id) REFERENCES pages(id) ON DELETE CASCADE,
        UNIQUE KEY unique_role_page (role_id, page_id),
        INDEX idx_role_id (role_id),
        INDEX idx_page_id (page_id),
        INDEX idx_parent_page_id (parent_page_id),
        INDEX idx_display_order (display_order)
      )
    `);
    console.log('✅ Created role_pages_order table');

    // Migrate existing role_pages data to role_pages_order with default ordering
    await connection.execute(`
      INSERT IGNORE INTO role_pages_order (role_id, page_id, parent_page_id, display_order)
      SELECT 
        role_id, 
        page_id, 
        NULL as parent_page_id,
        0 as display_order
      FROM role_pages
    `);
    console.log('✅ Migrated existing role_pages data to role_pages_order');

    console.log('✅ Successfully created role-based page ordering system');
  } catch (error) {
    console.error('❌ Error creating role_pages_order table:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
createRolePagesOrderTable()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
