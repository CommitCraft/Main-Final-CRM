const db = require('../config/db');

/**
 * Migration to add hierarchy support to pages table
 * Adds parent_id for submenu functionality and display_order for menu ordering
 */
async function up() {
  try {
    console.log('🔄 Starting migration: add_page_hierarchy...');

    // Check if columns already exist
    const [columns] = await db.pool.execute(`
      SHOW COLUMNS FROM pages LIKE 'parent_id'
    `);

    if (columns.length === 0) {
      // Add parent_id column
      await db.pool.execute(`
        ALTER TABLE pages 
        ADD COLUMN parent_id INT NULL AFTER id,
        ADD COLUMN display_order INT DEFAULT 0 AFTER status,
        ADD INDEX idx_parent_id (parent_id),
        ADD INDEX idx_display_order (display_order)
      `);
      console.log('✅ Added parent_id and display_order columns to pages table');

      // Add foreign key constraint
      await db.pool.execute(`
        ALTER TABLE pages 
        ADD CONSTRAINT fk_pages_parent 
        FOREIGN KEY (parent_id) REFERENCES pages(id) 
        ON DELETE CASCADE
      `);
      console.log('✅ Added foreign key constraint for parent_id');
    } else {
      console.log('ℹ️  Columns already exist, skipping migration');
    }

    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
}

/**
 * Rollback migration
 */
async function down() {
  try {
    console.log('🔄 Rolling back migration: add_page_hierarchy...');

    // Drop foreign key first
    await db.pool.execute(`
      ALTER TABLE pages DROP FOREIGN KEY fk_pages_parent
    `);

    // Drop columns
    await db.pool.execute(`
      ALTER TABLE pages 
      DROP COLUMN parent_id,
      DROP COLUMN display_order
    `);

    console.log('✅ Rollback completed successfully');
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  }
}

// Run migration if called directly
if (require.main === module) {
  (async () => {
    try {
      await up();
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  })();
}

module.exports = { up, down };
