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
    // Raise GROUP_CONCAT length limit so JSON aggregation of categories/variants
    // does not get truncated at the default 1024 bytes. GLOBAL sets the default
    // for future sessions (the root user has privileges). Wrapped in try/catch
    // so a privilege failure never blocks startup.
    try {
      await db.query('SET GLOBAL group_concat_max_len = 1048576');
    } catch (_) { /* ignore — insufficient privileges or unsupported */ }

    // Check if core tables exist (MySQL/MariaDB information_schema)
    const checkTableQuery = `
      SELECT COUNT(*) AS cnt FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = 'users';
    `;
    const res = await db.query(checkTableQuery);
    const tablesExist = Number(res.rows[0].cnt) > 0;

    if (!tablesExist) {
      console.log('ℹ️ Core database tables do not exist. Running schema.sql...');
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      // Execute the schema SQL (multipleStatements is enabled in db.js)
      await db.query(schemaSql);
      console.log('✅ Schema executed successfully.');
    } else {
      console.log('ℹ️ Core database tables already exist. Skipping schema.sql execution to preserve existing data.');
    }

    // Seed default admin if no admins exist
    const adminCheck = await db.query('SELECT COUNT(*) AS cnt FROM admins');
    const adminCount = Number(adminCheck.rows[0].cnt);

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
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
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
