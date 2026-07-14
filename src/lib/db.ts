import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

// We'll use a local SQLite database file in the root directory.
const DB_PATH = path.join(process.cwd(), 'weartome.db');

export const db = new Database(DB_PATH, { verbose: console.log });

// Enable foreign keys
db.pragma('foreign_keys = ON');

/**
 * Executes an SQL query with parameters.
 */
export function query(sql: string, params: any[] = []): any {
  const stmt = db.prepare(sql);
  if (sql.trim().toLowerCase().startsWith('select')) {
    return stmt.all(params);
  } else {
    return stmt.run(params);
  }
}

/**
 * Executes an SQL query expecting a single row outcome.
 */
export function queryOne(sql: string, params: any[] = []): any {
  const stmt = db.prepare(sql);
  return stmt.get(params);
}

/**
 * Initializes tables if they do not exist and populates them with baseline seed data.
 */
export function initializeDatabase() {
  console.log('Initializing database tables...');

  // 1. adminauth table (stores root admin credentials)
  db.exec(`
    CREATE TABLE IF NOT EXISTS adminauth (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      primaryPassword TEXT NOT NULL,
      secondaryPassword TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. users table (all customers and administrative accounts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'Customer', -- Admin, Sub-admin, Manager, Customer Care, Customer
      permissions TEXT DEFAULT '[]', -- JSON string containing overrides/permissions list
      gender TEXT, -- Onboarding Q1
      how_found TEXT, -- Onboarding Q2
      style_pref TEXT, -- Onboarding Q3
      category_pref TEXT, -- Onboarding Q4
      promotion_tier TEXT DEFAULT 'Standard', -- Standard, Loyal, Top User, VIP
      is_suspended INTEGER DEFAULT 0, -- 0 = Active, 1 = Suspended
      suspended_until TEXT, -- datetime string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. category table
  db.exec(`
    CREATE TABLE IF NOT EXISTS category (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );
  `);

  // 4. products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      category_id INTEGER REFERENCES category(id) ON DELETE SET NULL,
      subcategory TEXT,
      gender_target TEXT NOT NULL DEFAULT 'unisex', -- men, women, unisex, gen-z
      sizes TEXT DEFAULT '[]', -- JSON array of sizes: ["S", "M", "L"]
      colors TEXT DEFAULT '[]', -- JSON array of colors: ["#000000", "#FFFFFF"]
      quality_grade TEXT DEFAULT 'A', -- Quality / fabric grade
      grid_position INTEGER DEFAULT NULL, -- controls manual grid placement seating
      is_trending INTEGER DEFAULT 0, -- boolean
      discount_percent REAL DEFAULT 0,
      discount_active_from TEXT, -- ISO Date string
      discount_active_to TEXT, -- ISO Date string
      display_price_strikethrough INTEGER DEFAULT 0, -- boolean
      min_images INTEGER DEFAULT 2,
      max_images INTEGER DEFAULT 10,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. mediafile table
  db.exec(`
    CREATE TABLE IF NOT EXISTS mediafile (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filepath TEXT NOT NULL,
      entity_type TEXT NOT NULL, -- 'product', 'blog', etc.
      entity_id INTEGER NOT NULL,
      original_filename TEXT,
      file_size INTEGER,
      is_primary INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. refreshtoken table
  db.exec(`
    CREATE TABLE IF NOT EXISTS refreshtoken (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      revoked INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. websitesetting table (stores branding settings)
  db.exec(`
    CREATE TABLE IF NOT EXISTS websitesetting (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 8. systemsetting table (AI features / support configurations)
  db.exec(`
    CREATE TABLE IF NOT EXISTS systemsetting (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // 9. themepreset table
  db.exec(`
    CREATE TABLE IF NOT EXISTS themepreset (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      tokens TEXT NOT NULL -- JSON string of tokens
    );
  `);

  // 10. themecustomization table
  db.exec(`
    CREATE TABLE IF NOT EXISTS themecustomization (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      preset_id INTEGER REFERENCES themepreset(id),
      custom_tokens TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Cart table for server-side persistent cart
  db.exec(`
    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL,
      size TEXT,
      color TEXT
    );
  `);

  // 11. orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      total_price REAL NOT NULL,
      discount_applied REAL DEFAULT 0,
      coupon_code TEXT,
      status TEXT DEFAULT 'Pending', -- Pending, Shipped, Out for Delivery, Delivered, Cancelled, Return Requested, Return Approved
      shipping_address TEXT NOT NULL,
      payment_ref TEXT,
      payment_status TEXT DEFAULT 'Pending', -- Pending, Paid, Refunded
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 12. order_items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      color TEXT,
      size TEXT
    );
  `);

  // 13. coupons table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL, -- 'private', 'public_sub' (product-scoped), 'public_pro' (site-wide)
      discount_value REAL NOT NULL, -- percentage or flat amount
      discount_type TEXT NOT NULL DEFAULT 'percent', -- 'percent' or 'flat'
      max_redemptions INTEGER DEFAULT 9999, -- Private usage cap
      redeemed_count INTEGER DEFAULT 0,
      active_from TEXT, -- date string
      active_to TEXT, -- date string
      product_id INTEGER, -- Optional product scoping
      category_id INTEGER, -- Optional category scoping
      per_account_limit INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 14. coupon_redemptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupon_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
      redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 15. message table (support Chat inbox)
  db.exec(`
    CREATE TABLE IF NOT EXISTS message (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id),
      receiver_id INTEGER REFERENCES users(id), -- Null means sent to Customer Care general inbox
      content TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 16. notification table
  db.exec(`
    CREATE TABLE IF NOT EXISTS notification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- target recipient
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      type TEXT, -- order_status, coupon, chat, low_stock, career
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 17. career_applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS career_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      role_interest TEXT NOT NULL,
      resume_link TEXT,
      cover_letter TEXT,
      status TEXT DEFAULT 'Pending', -- Pending, Reviewed, Approved, Rejected
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 18. activitylog table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activitylog (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ==================== SEED DATA POPULATION ====================
  console.log('Seeding baseline database records...');

  // Seed super-admins in both adminauth and users table
  const adminEmail1 = 'admin@weartome.com';
  const adminEmail2 = 'weartome@admin.com';
  const salt = bcrypt.genSaltSync(10);
  const adminHash = bcrypt.hashSync('weartomeadmin@17', salt);

  // Check and insert seed admin accounts
  const existingAdminAuth = queryOne(`SELECT id FROM adminauth WHERE email = ?`, [adminEmail2]);
  if (!existingAdminAuth) {
    query(`INSERT INTO adminauth (email, primaryPassword, secondaryPassword) VALUES (?, ?, ?)`, [
      adminEmail2,
      adminHash,
      bcrypt.hashSync('backupadmin123', salt),
    ]);
    query(`INSERT INTO adminauth (email, primaryPassword, secondaryPassword) VALUES (?, ?, ?)`, [
      adminEmail1,
      adminHash,
      bcrypt.hashSync('backupadmin123', salt),
    ]);
  }

  const existingAdminUser = queryOne(`SELECT id FROM users WHERE email = ?`, [adminEmail2]);
  if (!existingAdminUser) {
    query(`INSERT INTO users (email, password, name, role, permissions) VALUES (?, ?, ?, ?, ?)`, [
      adminEmail2,
      adminHash,
      'Super Admin',
      'Admin',
      JSON.stringify(['all']),
    ]);
    query(`INSERT INTO users (email, password, name, role, permissions) VALUES (?, ?, ?, ?, ?)`, [
      adminEmail1,
      adminHash,
      'WearTome Manager',
      'Admin',
      JSON.stringify(['all']),
    ]);
  }

  // Seed category
  const categories = [
    { name: 'Apparel', slug: 'apparel' },
    { name: 'Accessories', slug: 'accessories' },
    { name: 'Trending', slug: 'trending' },
  ];
  for (const cat of categories) {
    const existing = queryOne(`SELECT id FROM category WHERE slug = ?`, [cat.slug]);
    if (!existing) {
      query(`INSERT INTO category (name, slug) VALUES (?, ?)`, [cat.name, cat.slug]);
    }
  }

  const apparelId = queryOne(`SELECT id FROM category WHERE slug = 'apparel'`)?.id || 1;
  const accessoriesId = queryOne(`SELECT id FROM category WHERE slug = 'accessories'`)?.id || 2;

  // Seed products (Silk Midnight Gown, Golden Hour Watch, Cashmere Scarf)
  const seedProducts = [
    {
      name: 'Silk Midnight Gown',
      slug: 'silk-midnight-gown',
      description: 'An elegant pure silk flowing evening gown inspired by Tokyo architecture night views. Designed with minimal seams and premium heavy drape.',
      price: 24000,
      stock: 15,
      category_id: apparelId,
      subcategory: 'Gowns',
      gender_target: 'women',
      sizes: JSON.stringify(['XS', 'S', 'M', 'L']),
      colors: JSON.stringify(['#0A0A0A', '#1F1F1F']),
      quality_grade: 'AAA Heavy Silk',
      grid_position: 1,
      is_trending: 1,
      discount_percent: 10,
      discount_active_from: '2026-01-01T00:00:00.000Z',
      discount_active_to: '2027-01-01T00:00:00.000Z',
      display_price_strikethrough: 1,
    },
    {
      name: 'Golden Hour Watch',
      slug: 'golden-hour-watch',
      description: 'A masterpiece watch crafted with brushed stainless gold finish and a minimalist matte black dial face. Swiss movement mechanisms with 2026 luxury style.',
      price: 45000,
      stock: 8,
      category_id: accessoriesId,
      subcategory: 'Watches',
      gender_target: 'unisex',
      sizes: JSON.stringify(['One Size']),
      colors: JSON.stringify(['#FFD700', '#1A1A1A']),
      quality_grade: 'Swiss Chrono Grade',
      grid_position: 2,
      is_trending: 1,
      discount_percent: 0,
      discount_active_from: null,
      discount_active_to: null,
      display_price_strikethrough: 0,
    },
    {
      name: 'Cashmere Scarf',
      slug: 'cashmere-scarf',
      description: 'Handcrafted ultra-soft double ply Himalayan cashmere scarf. Features raw edge fringes and delicate luxury cream coloring.',
      price: 8500,
      stock: 45,
      category_id: accessoriesId,
      subcategory: 'Scarves',
      gender_target: 'unisex',
      sizes: JSON.stringify(['One Size']),
      colors: JSON.stringify(['#F8F6F2', '#EAE6DF']),
      quality_grade: 'Grade A Cashmere',
      grid_position: 3,
      is_trending: 0,
      discount_percent: 0,
      discount_active_from: null,
      discount_active_to: null,
      display_price_strikethrough: 0,
    },
  ];

  for (const prod of seedProducts) {
    const existing = queryOne(`SELECT id FROM products WHERE slug = ?`, [prod.slug]);
    if (!existing) {
      query(
        `INSERT INTO products (
          name, slug, description, price, stock, category_id, subcategory, gender_target,
          sizes, colors, quality_grade, grid_position, is_trending, discount_percent,
          discount_active_from, discount_active_to, display_price_strikethrough
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          prod.name,
          prod.slug,
          prod.description,
          prod.price,
          prod.stock,
          prod.category_id,
          prod.subcategory,
          prod.gender_target,
          prod.sizes,
          prod.colors,
          prod.quality_grade,
          prod.grid_position,
          prod.is_trending,
          prod.discount_percent,
          prod.discount_active_from,
          prod.discount_active_to,
          prod.display_price_strikethrough,
        ]
      );

      const newId = queryOne(`SELECT id FROM products WHERE slug = ?`, [prod.slug]).id;
      // Seed initial 2 WebP placeholder images per product
      query(`INSERT INTO mediafile (filepath, entity_type, entity_id, original_filename, file_size, is_primary) VALUES (?, ?, ?, ?, ?, ?)`, [
        `/images/products/${prod.slug}-primary.webp`,
        'product',
        newId,
        `${prod.slug}-primary.png`,
        102400,
        1,
      ]);
      query(`INSERT INTO mediafile (filepath, entity_type, entity_id, original_filename, file_size, is_primary) VALUES (?, ?, ?, ?, ?, ?)`, [
        `/images/products/${prod.slug}-alternate.webp`,
        'product',
        newId,
        `${prod.slug}-alternate.png`,
        98200,
        0,
      ]);
    }
  }

  // Seed websitesetting
  const settings = [
    { key: 'site.name', value: 'Wear Tome' },
    { key: 'site.tagline', value: 'Luxury Streetwear Editorial' },
    { key: 'site.primary_color', value: '#0A0A0A' },
    { key: 'site.primary_font', value: 'Playfair Display' },
    { key: 'site.seo_title', value: 'Wear Tome — High-End Luxury Streetwear Storefront' },
  ];
  for (const set of settings) {
    const existing = queryOne(`SELECT key FROM websitesetting WHERE key = ?`, [set.key]);
    if (!existing) {
      query(`INSERT INTO websitesetting (key, value) VALUES (?, ?)`, [set.key, set.value]);
    }
  }

  // Seed systemsetting
  const sysSettings = [
    { key: 'ai_enabled', value: '1' },
    { key: 'voice_enabled', value: '1' },
    { key: 'theme_mode', value: 'dark' },
  ];
  for (const sys of sysSettings) {
    const existing = queryOne(`SELECT key FROM systemsetting WHERE key = ?`, [sys.key]);
    if (!existing) {
      query(`INSERT INTO systemsetting (key, value) VALUES (?, ?)`, [sys.key, sys.value]);
    }
  }

  // Seed themepreset
  const presets = [
    {
      name: 'Gucci Luxe',
      tokens: JSON.stringify({
        primaryBackground: '#0F0F0E',
        secondaryBackground: '#191917',
        cardBackground: '#22221E',
        borderColor: '#3B3B34',
        textPrimary: '#FFFFFF',
        textSecondary: '#DCD4C4',
        accentColor: '#D4AF37',
        fontFamily: 'Playfair Display',
      }),
    },
    {
      name: 'Minimal Dark',
      tokens: JSON.stringify({
        primaryBackground: '#000000',
        secondaryBackground: '#0D0D0D',
        cardBackground: '#141414',
        borderColor: '#222222',
        textPrimary: '#FFFFFF',
        textSecondary: '#A3A3A3',
        accentColor: '#FFFFFF',
        fontFamily: 'Inter',
      }),
    },
    {
      name: 'Vibrant Modern',
      tokens: JSON.stringify({
        primaryBackground: '#0F1219',
        secondaryBackground: '#181C26',
        cardBackground: '#212735',
        borderColor: '#2F384C',
        textPrimary: '#FFFFFF',
        textSecondary: '#94A3B8',
        accentColor: '#38BDF8',
        fontFamily: 'Poppins',
      }),
    },
  ];

  for (const pres of presets) {
    const existing = queryOne(`SELECT id FROM themepreset WHERE name = ?`, [pres.name]);
    if (!existing) {
      query(`INSERT INTO themepreset (name, tokens) VALUES (?, ?)`, [pres.name, pres.tokens]);
    }
  }

  // Seed some dummy active coupons
  const activeCoupons = [
    {
      code: 'WELCOME10',
      type: 'public_pro',
      discount_value: 10,
      discount_type: 'percent',
      max_redemptions: 1000,
      active_from: '2026-01-01',
      active_to: '2027-12-31',
      per_account_limit: 1,
    },
    {
      code: 'VIP500',
      type: 'private',
      discount_value: 500,
      discount_type: 'flat',
      max_redemptions: 5,
      active_from: '2026-01-01',
      active_to: '2027-12-31',
      per_account_limit: 1,
    },
  ];
  for (const coup of activeCoupons) {
    const existing = queryOne(`SELECT id FROM coupons WHERE code = ?`, [coup.code]);
    if (!existing) {
      query(
        `INSERT INTO coupons (code, type, discount_value, discount_type, max_redemptions, active_from, active_to, per_account_limit)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [coup.code, coup.type, coup.discount_value, coup.discount_type, coup.max_redemptions, coup.active_from, coup.active_to, coup.per_account_limit]
      );
    }
  }

  console.log('Database initialization and seeding completed successfully!');
}

// Automatically execute database setup
try {
  initializeDatabase();
} catch (error) {
  console.error('Error auto-initializing database:', error);
}
