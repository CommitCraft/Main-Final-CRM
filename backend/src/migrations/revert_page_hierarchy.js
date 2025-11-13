const mysql = require('mysql2/promise');
require('dotenv').config();

async function revertPageHierarchy() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'cmscrm'
  });

  try {
    console.log('🔄 Reverting page hierarchy changes...');

    // Check if foreign key exists and drop it
    try {
      await connection.execute(`
        ALTER TABLE pages
        DROP FOREIGN KEY fk_parent_page
      `);
      console.log('✅ Dropped foreign key constraint');
    } catch (err) {
      console.log('ℹ️ Foreign key constraint does not exist or already dropped');
    }

    // Check and drop indexes
    try {
      await connection.execute(`
        ALTER TABLE pages
        DROP INDEX idx_parent_id
      `);
      console.log('✅ Dropped parent_id index');
    } catch (err) {
      console.log('ℹ️ parent_id index does not exist or already dropped');
    }

    try {
      await connection.execute(`
        ALTER TABLE pages
        DROP INDEX idx_display_order
      `);
      console.log('✅ Dropped display_order index');
    } catch (err) {
      console.log('ℹ️ display_order index does not exist or already dropped');
    }

    // Drop columns
    try {
      await connection.execute(`
        ALTER TABLE pages
        DROP COLUMN parent_id,
        DROP COLUMN display_order
      `);
      console.log('✅ Dropped parent_id and display_order columns');
    } catch (err) {
      console.log('ℹ️ Columns do not exist or already dropped');
    }

    console.log('✅ Successfully reverted page hierarchy changes');
  } catch (error) {
    console.error('❌ Error reverting page hierarchy:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run migration
revertPageHierarchy()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
