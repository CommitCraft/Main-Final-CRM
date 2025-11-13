const db = require('./src/config/db');

async function checkDatabase() {
  try {
    console.log('🔍 Checking database tables...\n');
    
    // Show all tables
    const tables = await db.executeQuery('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    
    console.log('📋 Database Tables:');
    tableNames.forEach(table => {
      console.log(`  - ${table}`);
    });
    
    // Check if role_pages_order exists
    if (tableNames.includes('role_pages_order')) {
      console.log('\n✅ role_pages_order table exists!');
      
      // Show structure
      const structure = await db.executeQuery('DESCRIBE role_pages_order');
      console.log('\n📊 role_pages_order structure:');
      structure.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `[${col.Key}]` : ''}`);
      });
    } else {
      console.log('\n❌ role_pages_order table NOT found!');
      console.log('Creating tables...');
      await db.createTables();
      console.log('✅ Tables created successfully!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
