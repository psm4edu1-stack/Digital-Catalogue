const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require('./config/db');
const { verifyToken, verifyAdmin, JWT_SECRET } = require('./middleware/authMiddleware');
const upload = require('./config/multer');
const { initDatabase } = require('./config/initDb');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Public files / uploads routing using path.join
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mysql: db.isConfigured ? 'connected' : 'not_connected',
    timestamp: new Date()
  });
});

// ==========================================
// HELPER: Build image URL from request (relative path)
// ==========================================
const buildImageUrl = (req, filename) => {
  if (!filename) return null;
  return `/uploads/${filename}`;
};

// Parse a JSON column that may arrive as a string (depends on driver config)
const asJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
};

// ==========================================
// AUTHENTICATION APIs
// ==========================================

// Register Admin (setup brand profile) — supports multipart for logo
app.post('/api/auth/admin/register', upload.single('brandLogoFile'), async (req, res) => {
  const { email, password, brandName, tagline, description, contactInfo, howToOrder, themeColor, fontFamily, brandLogo } = req.body;

  if (!email || !password || !brandName) {
    return res.status(400).json({ message: 'Email, password, and brand name are required.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine logo: uploaded file takes priority over URL
    let logoUrl = brandLogo || null;
    let logoFilename = null;
    let logoPath = null;
    let logoType = null;

    if (req.file) {
      logoFilename = req.file.filename;
      logoPath = req.file.path;
      logoType = req.file.mimetype;
      logoUrl = `/uploads/${req.file.filename}`;
    }

    const exists = await db.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'Admin email already exists.' });

    const contactInfoStr = typeof contactInfo === 'string' ? contactInfo : JSON.stringify(contactInfo || {});

    const ins = await db.query(
      `INSERT INTO admins (email, password, brand_name, tagline, description, contact_info, how_to_order, theme_color, font_family, brand_logo, logo_filename, logo_path, logo_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [email, hashedPassword, brandName, tagline, description, contactInfoStr, howToOrder, themeColor || '#3b82f6', fontFamily || 'Outfit', logoUrl, logoFilename, logoPath, logoType]
    );

    const sel = await db.query(
      'SELECT id, email, brand_name, tagline, description, contact_info, how_to_order, theme_color, font_family, brand_logo, logo_filename FROM admins WHERE id = ?',
      [ins.insertId]
    );
    const admin = sel.rows[0];
    admin.contact_info = asJson(admin.contact_info, {});
    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, admin });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Admin Login
app.post('/api/auth/admin/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

  try {
    const result = await db.query('SELECT * FROM admins WHERE email = ?', [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid admin credentials.' });

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid admin credentials.' });

    const token = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    delete admin.password;
    return res.json({ token, admin });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// User Registration
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields required.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const exists = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'Email already exists.' });

    const ins = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    const user = { id: ins.insertId, name, email };
    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (result.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials.' });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password;
    return res.json({ token, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// BRAND SETTINGS PROFILE APIs
// ==========================================

// GET current brand profile (public)
app.get('/api/admin/profile', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, brand_name, brand_logo, logo_filename, logo_path, logo_type, tagline, description, contact_info, how_to_order, theme_color, font_family FROM admins ORDER BY id ASC LIMIT 1'
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No merchant profile configured.' });
    }
    const admin = result.rows[0];
    return res.json({
      id: admin.id,
      email: admin.email,
      brandName: admin.brand_name,
      brandLogo: admin.brand_logo,
      logo_filename: admin.logo_filename,
      tagline: admin.tagline,
      brandDescription: admin.description,
      contactInfo: asJson(admin.contact_info, {}),
      howToOrder: admin.how_to_order,
      primaryColor: admin.theme_color,
      fontFamily: admin.font_family
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT current brand profile (admin only) - supports logo file upload
app.put('/api/admin/profile', verifyAdmin, upload.single('brandLogoFile'), async (req, res) => {
  const { brandName, tagline, description, contactInfo, howToOrder, themeColor, fontFamily, brandLogo } = req.body;

  let logoUrl = brandLogo || null;
  let logoFilename = null;
  let logoPath = null;
  let logoType = null;

  if (req.file) {
    logoFilename = req.file.filename;
    logoPath = req.file.path;
    logoType = req.file.mimetype;
    logoUrl = `/uploads/${req.file.filename}`;
  }

  const contactInfoStr = typeof contactInfo === 'string' ? contactInfo : JSON.stringify(contactInfo || {});

  try {
    const adminId = req.user.id;

    if (req.file) {
      await db.query(
        `UPDATE admins
         SET brand_name=?, tagline=?, description=?, contact_info=?, how_to_order=?,
             theme_color=?, font_family=?, brand_logo=?, logo_filename=?, logo_path=?, logo_type=?
         WHERE id=?`,
        [brandName, tagline, description, contactInfoStr, howToOrder, themeColor, fontFamily, logoUrl, logoFilename, logoPath, logoType, adminId]
      );
    } else {
      await db.query(
        `UPDATE admins
         SET brand_name=?, tagline=?, description=?, contact_info=?, how_to_order=?,
             theme_color=?, font_family=?, brand_logo=COALESCE(?, brand_logo)
         WHERE id=?`,
        [brandName, tagline, description, contactInfoStr, howToOrder, themeColor, fontFamily, logoUrl, adminId]
      );
    }

    const sel = await db.query(
      'SELECT id, email, brand_name, brand_logo, logo_filename, tagline, description, contact_info, how_to_order, theme_color, font_family FROM admins WHERE id = ?',
      [adminId]
    );
    if (sel.rows.length === 0) return res.status(404).json({ message: 'Admin not found.' });

    const admin = sel.rows[0];
    return res.json({
      message: 'Brand settings updated successfully.',
      admin: {
        id: admin.id,
        email: admin.email,
        brandName: admin.brand_name,
        brandLogo: admin.brand_logo,
        logo_filename: admin.logo_filename,
        tagline: admin.tagline,
        brandDescription: admin.description,
        contactInfo: asJson(admin.contact_info, {}),
        howToOrder: admin.how_to_order,
        primaryColor: admin.theme_color,
        fontFamily: admin.font_family
      }
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// IMAGE UPLOAD ENDPOINTS
// ==========================================

// Generic image upload (product images)
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
  }
  const imageUrl = `/uploads/products/${req.file.filename}`;
  return res.json({
    imageUrl,
    filename: req.file.filename,
    path: req.file.path,
    type: req.file.mimetype,
    originalName: req.file.originalname
  });
});

// Brand logo upload
app.post('/api/upload/logo', upload.single('logo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded or invalid file type.' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  return res.json({
    imageUrl,
    filename: req.file.filename,
    path: req.file.path,
    type: req.file.mimetype
  });
});

// Multer error handler middleware
app.use((err, req, res, next) => {
  if (err && err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({ message: err.message });
  }
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
  }
  next(err);
});

// ==========================================
// PRODUCT INVENTORY ROUTING (CRUD)
// ==========================================

// Helper to build product query result (MariaDB 10.4-compatible: GROUP_CONCAT + JSON_OBJECT,
// since JSON_ARRAYAGG is only available in MariaDB 10.5+ / MySQL 8+).
const buildProductQueryText = () => `
  SELECT p.*,
         COALESCE(
           (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('id', c.id, 'name', c.name) SEPARATOR ','), ']')
            FROM categories c
            INNER JOIN product_categories pc ON c.id = pc.category_id
            WHERE pc.product_id = p.id),
           '[]'
         ) AS categories,
         COALESCE(
           (SELECT CONCAT('[', GROUP_CONCAT(JSON_OBJECT('id', v.id, 'product_id', v.product_id, 'name', v.name, 'price', v.price, 'special_price', v.special_price, 'availability_status', v.availability_status, 'image_url', v.image_url, 'image_filename', v.image_filename) ORDER BY v.id SEPARATOR ','), ']')
            FROM product_variants v
            WHERE v.product_id = p.id),
           '[]'
         ) AS variants,
         (SELECT COALESCE(SUM(views),0) FROM analytics WHERE product_id = p.id) AS likes_count
  FROM products p
`;

const enrichProduct = (p) => {
  p.categories = asJson(p.categories, []);
  p.variants = asJson(p.variants, []);
  const firstCategoryName = p.categories.length > 0 ? p.categories[0].name : 'General';
  return { ...p, category: firstCategoryName };
};

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const queryText = buildProductQueryText() + ' ORDER BY p.id DESC';
    const prods = await db.query(queryText);
    return res.json(prods.rows.map(enrichProduct));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get featured products
app.get('/api/products/featured', async (req, res) => {
  try {
    const queryText = buildProductQueryText() + ' WHERE p.is_featured = TRUE AND p.is_active = TRUE ORDER BY p.id DESC';
    const prods = await db.query(queryText);
    return res.json(prods.rows.map(enrichProduct));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Get single product by ID
app.get('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const queryText = buildProductQueryText() + ' WHERE p.id = ?';
    const result = await db.query(queryText, [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'Product not found.' });
    return res.json(enrichProduct(result.rows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Create product (Admin) — supports multipart for image upload
app.post('/api/products', verifyAdmin, upload.single('productImage'), async (req, res) => {
  const {
    name, description, price, special_price, offer_percentage,
    image_url, categoryIds, availability_status, variants, is_active, is_featured
  } = req.body;

  if (!name || !price) return res.status(400).json({ message: 'Name and Price required.' });

  // Determine image: uploaded file takes priority over URL
  let finalImageUrl = image_url || null;
  let imageFilename = null;
  let imagePath = null;
  let imageType = null;

  if (req.file) {
    imageFilename = req.file.filename;
    imagePath = req.file.path;
    imageType = req.file.mimetype;
    finalImageUrl = `/uploads/products/${req.file.filename}`;
  }

  // Parse categoryIds and variants from form-data (strings) or JSON body
  let parsedCategoryIds = categoryIds;
  let parsedVariants = variants;
  if (typeof categoryIds === 'string') {
    try { parsedCategoryIds = JSON.parse(categoryIds); } catch { parsedCategoryIds = []; }
  }
  if (typeof variants === 'string') {
    try { parsedVariants = JSON.parse(variants); } catch { parsedVariants = []; }
  }

  try {
    const ins = await db.query(
      `INSERT INTO products (name, description, price, special_price, offer_percentage, image_url, image_filename, image_path, image_type, availability_status, is_active, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, description, price, special_price || null, offer_percentage || 0, finalImageUrl, imageFilename, imagePath, imageType, availability_status || 'in_stock', is_active !== false && is_active !== 'false', is_featured === true || is_featured === 'true']
    );
    const newProdId = ins.insertId;

    // Insert categories
    if (parsedCategoryIds && parsedCategoryIds.length > 0) {
      await Promise.all(
        parsedCategoryIds.map(categoryId =>
          db.query('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [newProdId, categoryId])
        )
      );
    }

    // Insert variants
    if (parsedVariants && parsedVariants.length > 0) {
      await Promise.all(parsedVariants.map(v =>
        db.query(
          'INSERT INTO product_variants (product_id, name, price, special_price, availability_status) VALUES (?, ?, ?, ?, ?)',
          [newProdId, v.name, v.price, v.special_price || null, v.availability_status || 'in_stock']
        )
      ));
    }

    // Initialize analytics row
    await db.query(
      `INSERT IGNORE INTO analytics (product_id, views, likes, sales, viral_clicks, enquiries, cart_adds, cart_removals)
       VALUES (?, 0, 0, 0, 0, 0, 0, 0)`,
      [newProdId]
    );

    // Return full product with joins
    const fullQuery = buildProductQueryText() + ' WHERE p.id = ?';
    const finalResult = await db.query(fullQuery, [newProdId]);
    return res.status(201).json(enrichProduct(finalResult.rows[0]));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Update product (Admin) — supports multipart for image
app.put('/api/products/:id', verifyAdmin, upload.single('productImage'), async (req, res) => {
  const { id } = req.params;
  const {
    name, description, price, special_price, offer_percentage,
    image_url, categoryIds, availability_status, variants, is_active, is_featured
  } = req.body;

  // Determine image
  let finalImageUrl = image_url || null;
  let imageFilename = null;
  let imagePath = null;
  let imageType = null;

  if (req.file) {
    imageFilename = req.file.filename;
    imagePath = req.file.path;
    imageType = req.file.mimetype;
    finalImageUrl = `/uploads/products/${req.file.filename}`;
  }

  let parsedCategoryIds = categoryIds;
  let parsedVariants = variants;
  if (typeof categoryIds === 'string') {
    try { parsedCategoryIds = JSON.parse(categoryIds); } catch { parsedCategoryIds = []; }
  }
  if (typeof variants === 'string') {
    try { parsedVariants = JSON.parse(variants); } catch { parsedVariants = []; }
  }

  try {
    // Build dynamic UPDATE — only update image fields if a new file was provided
    if (req.file) {
      await db.query(
        `UPDATE products SET name=?, description=?, price=?, special_price=?, offer_percentage=?,
         image_url=?, image_filename=?, image_path=?, image_type=?,
         availability_status=?, is_active=?, is_featured=? WHERE id=?`,
        [name, description, price, special_price || null, offer_percentage || 0, finalImageUrl, imageFilename, imagePath, imageType, availability_status, is_active !== false && is_active !== 'false', is_featured === true || is_featured === 'true', id]
      );
    } else {
      await db.query(
        `UPDATE products SET name=?, description=?, price=?, special_price=?, offer_percentage=?,
         ${finalImageUrl ? 'image_url=?,' : ''}
         availability_status=?, is_active=?, is_featured=? WHERE id=?`,
        finalImageUrl
          ? [name, description, price, special_price || null, offer_percentage || 0, finalImageUrl, availability_status, is_active !== false && is_active !== 'false', is_featured === true || is_featured === 'true', id]
          : [name, description, price, special_price || null, offer_percentage || 0, availability_status, is_active !== false && is_active !== 'false', is_featured === true || is_featured === 'true', id]
      );
    }

    // Refresh categories
    await db.query('DELETE FROM product_categories WHERE product_id = ?', [id]);
    if (parsedCategoryIds && parsedCategoryIds.length > 0) {
      await Promise.all(
        parsedCategoryIds.map(categoryId =>
          db.query('INSERT INTO product_categories (product_id, category_id) VALUES (?, ?)', [id, categoryId])
        )
      );
    }

    // Refresh variants
    await db.query('DELETE FROM product_variants WHERE product_id = ?', [id]);
    if (parsedVariants && parsedVariants.length > 0) {
      await Promise.all(parsedVariants.map(v =>
        db.query(
          'INSERT INTO product_variants (product_id, name, price, special_price, availability_status) VALUES (?, ?, ?, ?, ?)',
          [id, v.name, v.price, v.special_price || null, v.availability_status || 'in_stock']
        )
      ));
    }

    return res.json({ message: 'Product updated successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Delete product
app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    return res.json({ message: 'Product deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Toggle featured status
app.patch('/api/products/:id/featured', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { is_featured } = req.body;
  try {
    await db.query('UPDATE products SET is_featured = ? WHERE id = ?', [is_featured, id]);
    return res.json({ message: 'Featured status updated.', is_featured });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// CATEGORIES ROUTING
// ==========================================

app.get('/api/categories', async (req, res) => {
  try {
    const cats = await db.query('SELECT * FROM categories ORDER BY id ASC');
    return res.json(cats.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.post('/api/categories', verifyAdmin, upload.single('categoryImage'), async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Category name required' });
  }

  const image_url = req.file ? `/uploads/categories/${req.file.filename}` : null;

  try {
    const ins = await db.query(
      `INSERT INTO categories (name, description, image_url)
       VALUES (?, ?, ?)`,
      [name, description || null, image_url]
    );
    const sel = await db.query('SELECT * FROM categories WHERE id = ?', [ins.insertId]);
    res.status(201).json(sel.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/categories/:id', verifyAdmin, upload.single('categoryImage'), async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  let image_url = null;
  if (req.file) {
    image_url = `/uploads/categories/${req.file.filename}`;
  }

  try {
    await db.query(
      `UPDATE categories
       SET name = ?,
           description = ?,
           image_url = COALESCE(?, image_url)
       WHERE id = ?`,
      [name, description, image_url, id]
    );
    const sel = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.json(sel.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/categories/:id', verifyAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM categories WHERE id = ?', [id]);
    return res.json({ message: 'Category deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// OFFERS ROUTING
// ==========================================

app.get('/api/offers', async (req, res) => {
  try {
    const queryText = buildProductQueryText() + ' WHERE p.special_price IS NOT NULL AND p.special_price < p.price AND p.is_active = TRUE ORDER BY p.id DESC';
    const result = await db.query(queryText);
    return res.json(result.rows.map(enrichProduct));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// CART & LIKES ROUTING
// ==========================================

app.get('/api/cart', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      `SELECT c.quantity, p.*,
              (SELECT cat.name FROM categories cat
               INNER JOIN product_categories pc ON cat.id = pc.category_id
               WHERE pc.product_id = p.id LIMIT 1) AS category,
              v.id as var_id, v.name as var_name, v.price as var_price, v.special_price as var_spec_price
       FROM carts c
       JOIN products p ON c.product_id = p.id
       LEFT JOIN product_variants v ON c.variant_id = v.id
       WHERE c.user_id = ?`,
      [userId]
    );
    const parsedCart = result.rows.map(row => ({
      product: {
        id: row.id,
        name: row.name,
        description: row.description,
        image_url: row.image_url,
        price: row.price,
        special_price: row.special_price,
        availability_status: row.availability_status,
        category: row.category || 'General'
      },
      variant: row.var_id ? {
        id: row.var_id, name: row.var_name, price: row.var_price, special_price: row.var_spec_price
      } : null,
      quantity: row.quantity
    }));
    return res.json(parsedCart);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.post('/api/cart/sync', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { cart } = req.body;

  try {
    await db.query('DELETE FROM carts WHERE user_id = ?', [userId]);
    if (cart && cart.length > 0) {
      await Promise.all(cart.map(item =>
        db.query(
          'INSERT INTO carts (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)',
          [userId, item.product.id, item.variant?.id || null, item.quantity]
        )
      ));
      // Track cart_adds in analytics
      await Promise.all(cart.map(item =>
        db.query(
          `INSERT INTO analytics (product_id, cart_adds) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE cart_adds = cart_adds + VALUES(cart_adds)`,
          [item.product.id, item.quantity]
        ).catch(() => {}) // Ignore if analytics row doesn't exist
      ));
    }
    return res.json({ message: 'Cart synced.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.get('/api/likes', verifyToken, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query('SELECT product_id FROM likes WHERE user_id = ?', [userId]);
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

app.post('/api/likes/sync', verifyToken, async (req, res) => {
  const userId = req.user.id;
  const { likes } = req.body;

  try {
    await db.query('DELETE FROM likes WHERE user_id = ?', [userId]);
    if (likes && likes.length > 0) {
      await Promise.all(likes.map(prodId =>
        db.query('INSERT INTO likes (user_id, product_id) VALUES (?, ?)', [userId, prodId])
      ));
    }
    return res.json({ message: 'Likes synced.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// ANALYTICS TRACKING
// ==========================================

// Track product view
app.post('/api/products/:id/view', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `INSERT INTO analytics (product_id, views) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE views = views + 1`,
      [id]
    );
    return res.json({ message: 'View tracked.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Track product enquiry
app.post('/api/products/:id/enquiry', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query(
      `INSERT INTO analytics (product_id, enquiries) VALUES (?, 1)
       ON DUPLICATE KEY UPDATE enquiries = enquiries + 1`,
      [id]
    );
    return res.json({ message: 'Enquiry tracked.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// ANALYTICS & STATS APIs
// ==========================================
app.get('/api/analytics', verifyAdmin, async (req, res) => {
  try {
    // Totals
    const totals = await db.query(
      'SELECT COALESCE(SUM(views),0) as v, COALESCE(SUM(likes),0) as l, COALESCE(SUM(sales),0) as s, COALESCE(SUM(enquiries),0) as e FROM analytics'
    );

    // Full per-product breakdown
    const breakdown = await db.query(
      `SELECT p.id, p.name, p.image_url, p.is_featured,
              CAST(COALESCE(a.views, 0) AS DECIMAL(20,4)) AS views,
              CAST(COALESCE(a.likes, 0) AS DECIMAL(20,4)) AS likes,
              CAST(COALESCE(a.sales, 0) AS DECIMAL(20,4)) AS sales,
              CAST(COALESCE(a.viral_clicks, 0) AS DECIMAL(20,4)) AS virality,
              CAST(COALESCE(a.enquiries, 0) AS DECIMAL(20,4)) AS enquiries,
              CAST(COALESCE(a.cart_adds, 0) AS DECIMAL(20,4)) AS cart_adds,
              CAST((SELECT COUNT(*) FROM likes lk WHERE lk.product_id = p.id) AS DECIMAL(20,4)) AS real_likes_count,
              CAST((SELECT COUNT(*) FROM carts c WHERE c.product_id = p.id) AS DECIMAL(20,4)) AS cart_count
       FROM products p
       LEFT JOIN analytics a ON p.id = a.product_id
       WHERE p.is_active = TRUE
       ORDER BY COALESCE(a.views, 0) DESC`
    );

    // Liked but NOT in cart (cart abandonment candidates)
    const likedNotInCart = await db.query(
      `SELECT p.id, p.name, p.image_url,
              CAST(COUNT(DISTINCT l.user_id) AS DECIMAL(20,4)) AS liked_by,
              CAST(COUNT(DISTINCT c.user_id) AS DECIMAL(20,4)) AS in_cart_by
       FROM products p
       INNER JOIN likes l ON l.product_id = p.id
       LEFT JOIN carts c ON c.product_id = p.id AND c.user_id = l.user_id
       GROUP BY p.id, p.name, p.image_url
       HAVING COUNT(DISTINCT c.user_id) = 0
       ORDER BY liked_by DESC
       LIMIT 10`
    );

    // Cart abandonment (added to cart but low sales)
    const cartAbandonment = await db.query(
      `SELECT p.id, p.name, p.image_url,
              CAST(COALESCE(a.cart_adds, 0) AS DECIMAL(20,4)) AS cart_adds,
              CAST(COALESCE(a.sales, 0) AS DECIMAL(20,4)) AS sales,
              CASE WHEN COALESCE(a.cart_adds, 0) > 0
                   THEN ROUND((1 - COALESCE(a.sales, 0) / COALESCE(a.cart_adds, 1)) * 100, 1)
                   ELSE 0 END as abandonment_rate
       FROM products p
       LEFT JOIN analytics a ON p.id = a.product_id
       WHERE COALESCE(a.cart_adds, 0) > 0
       ORDER BY abandonment_rate DESC
       LIMIT 10`
    );

    const stats = {
      views: Number(totals.rows[0].v || 0),
      likes: Number(totals.rows[0].l || 0),
      sales: Number(totals.rows[0].s || 0),
      enquiries: Number(totals.rows[0].e || 0),
      virality: 85,
      productStats: breakdown.rows,
      likedNotInCart: likedNotInCart.rows,
      cartAbandonment: cartAbandonment.rows
    };
    return res.json(stats);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Admin Dashboard stats endpoint
app.get('/api/admin/dashboard', verifyAdmin, async (req, res) => {
  try {
    const products = await db.query('SELECT COUNT(*) AS count FROM products');
    const categories = await db.query('SELECT COUNT(*) AS count FROM categories');
    const offers = await db.query('SELECT COUNT(*) AS count FROM products WHERE special_price IS NOT NULL AND special_price < price AND is_active = TRUE');
    const activeProducts = await db.query('SELECT COUNT(*) AS count FROM products WHERE is_active = TRUE');
    const views = await db.query('SELECT COALESCE(SUM(views),0) AS total_views FROM analytics');

    // Fetch recent 5 products
    const recentQuery = buildProductQueryText() + ' ORDER BY p.id DESC LIMIT 5';
    const recent = await db.query(recentQuery);
    const recentEnriched = recent.rows.map(enrichProduct);

    res.json({
      totalProducts: Number(products.rows[0].count),
      totalCategories: Number(categories.rows[0].count),
      totalOffers: Number(offers.rows[0].count),
      activeProducts: Number(activeProducts.rows[0].count),
      catalogueViews: Number(views.rows[0].total_views),
      recentProducts: recentEnriched
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Boot listening server after database initialization
const startServer = async () => {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`Digital Catalogue Express server running on port: ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start database or server:', err);
    process.exit(1);
  }
};

startServer();
