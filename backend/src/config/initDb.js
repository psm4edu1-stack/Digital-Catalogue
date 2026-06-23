const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');

const initDatabase = async () => {
  if (!db.isConfigured) {
    console.log('⚠️ Database connection is not configured. Skipping initialization.');
    return;
  }

  try {
    // Check if core tables exist
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `;
    const res = await db.query(checkTableQuery);
    const tablesExist = res.rows[0].exists;

    if (!tablesExist) {
      console.log('ℹ️ Core database tables do not exist. Running schema.sql...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      
      // Execute the schema SQL
      await db.query(schemaSql);
      console.log('✅ Schema executed successfully.');
    } else {
      console.log('ℹ️ Core database tables already exist. Skipping schema.sql execution to preserve existing data.');
    }

    // Seed default admin if no admins exist
    const adminCheck = await db.query('SELECT COUNT(*) FROM admins');
    const adminCount = parseInt(adminCheck.rows[0].count, 10);

    if (adminCount === 0) {
      console.log('ℹ️ No admin account detected. Seeding default admin account...');
      const defaultEmail = 'admin@brand.com';
      const defaultPassword = 'password123';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const defaultBrandName = 'ECatalogue';
      const defaultTagline = 'Quality. Elegance. Simplicity.';
      const defaultDesc = 'A premium digital catalogue showcasing our finest products.';
      const defaultContactInfo = JSON.stringify({ phone: '+1234567890', instagram: '@brand', email: 'admin@brand.com' });
      const defaultHowToOrder = 'Add items to your cart, click checkout, and send the generated summary via Instagram DM or WhatsApp!';

      await db.query(
        `INSERT INTO admins (email, password, brand_name, tagline, description, contact_info, how_to_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [defaultEmail, hashedPassword, defaultBrandName, defaultTagline, defaultDesc, defaultContactInfo, defaultHowToOrder]
      );
      console.log(`✅ Default admin account seeded: \n   Email: ${defaultEmail}\n   Password: ${defaultPassword}`);
    } else {
      console.log('ℹ️ Admin account already exists. Skipping default admin seeding.');
    }
  } catch (err) {
    console.error('❌ Error during database initialization:', err);
    throw err;
  }
};

module.exports = { initDatabase };
