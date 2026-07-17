import Database from 'better-sqlite3';

function runVerification() {
  console.log('==================================================');
  console.log('RUNNING AUTOMATED DATABASE SCHEMA & SEED VERIFICATION');
  console.log('==================================================');

  const db = new Database('weartome.db');

  const expectedTables = [
    'adminauth',
    'users',
    'category',
    'products',
    'mediafile',
    'refreshtoken',
    'websitesetting',
    'systemsetting',
    'themepreset',
    'themecustomization',
    'orders',
    'order_items',
    'coupons',
    'coupon_redemptions',
    'message',
    'notification',
    'career_applications',
    'activitylog',
    'cart',
    'blogs'
  ];

  // 1. Check all tables exist
  console.log('1. Checking Table Existence...');
  const tablesResult = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
  const existingTables = tablesResult.map((r) => r.name);

  for (const table of expectedTables) {
    if (!existingTables.includes(table)) {
      throw new Error(`Critical Verification Failure: Table "${table}" is missing from the database.`);
    }
  }
  console.log(`✓ All ${expectedTables.length} expected canonical tables are present.`);

  // 2. Schema Specific Checks
  console.log('\n2. Verifying Key Table Columns...');

  // Products table columns check
  const productColumnsResult = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  const productCols = productColumnsResult.map((c) => c.name);
  const requiredProductCols = [
    'category_id', 'subcategory', 'gender_target', 'sizes', 'colors',
    'quality_grade', 'grid_position', 'is_trending', 'discount_percent',
    'discount_active_from', 'discount_active_to', 'display_price_strikethrough'
  ];
  for (const col of requiredProductCols) {
    if (!productCols.includes(col)) {
      throw new Error(`Critical Verification Failure: products table is missing column "${col}".`);
    }
  }
  console.log('✓ "products" schema contains all Phase 2 extended attributes.');

  // Users table columns check
  const userColumnsResult = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const userCols = userColumnsResult.map((c) => c.name);
  const requiredUserCols = [
    'role', 'permissions', 'gender', 'how_found', 'style_pref',
    'category_pref', 'promotion_tier', 'is_suspended', 'suspended_until'
  ];
  for (const col of requiredUserCols) {
    if (!userCols.includes(col)) {
      throw new Error(`Critical Verification Failure: users table is missing column "${col}".`);
    }
  }
  console.log('✓ "users" schema contains all administrative, role, onboarding, and suspension attributes.');

  // Coupons table columns check
  const couponColumnsResult = db.prepare("PRAGMA table_info(coupons)").all() as { name: string }[];
  const couponCols = couponColumnsResult.map((c) => c.name);
  const requiredCouponCols = [
    'code', 'type', 'discount_value', 'discount_type', 'max_redemptions',
    'redeemed_count', 'active_from', 'active_to', 'per_account_limit', 'is_active'
  ];
  for (const col of requiredCouponCols) {
    if (!couponCols.includes(col)) {
      throw new Error(`Critical Verification Failure: coupons table is missing column "${col}".`);
    }
  }
  console.log('✓ "coupons" schema matches the Phase 2 complex Coupon Engine specification.');

  // 3. Seed Content Validation
  console.log('\n3. Validating Baseline Seed Content...');

  // Seed Admin Check
  const seededAdmin = db.prepare("SELECT id, name, role FROM users WHERE email = 'weartome@admin.com'").get() as any;
  if (!seededAdmin || seededAdmin.role !== 'Admin') {
    throw new Error('Critical Verification Failure: Standard super-admin email "weartome@admin.com" with Admin role is missing.');
  }
  console.log(`✓ Seeded Admin account verified: ${seededAdmin.name} (${seededAdmin.role}).`);

  // Seed Products Check
  const productsCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
  if (productsCount.count < 3) {
    throw new Error(`Critical Verification Failure: Expected at least 3 products in catalog, found ${productsCount.count}.`);
  }
  const silkGown = db.prepare("SELECT name FROM products WHERE slug = 'silk-midnight-gown'").get() as any;
  if (!silkGown) {
    throw new Error('Critical Verification Failure: Canonical seeded product "Silk Midnight Gown" is missing.');
  }
  console.log(`✓ Seeded catalog products verified. Found ${productsCount.count} products, including "${silkGown.name}".`);

  // Seed Presets Check
  const presetsCount = db.prepare("SELECT COUNT(*) as count FROM themepreset").get() as { count: number };
  if (presetsCount.count < 3) {
    throw new Error(`Critical Verification Failure: Expected 3 theme presets (Gucci Luxe, Minimal Dark, Vibrant Modern), found ${presetsCount.count}.`);
  }
  console.log('✓ Theme presets (Gucci Luxe, Minimal Dark, Vibrant Modern) successfully loaded.');

  // Seed Coupons Check
  const couponsCount = db.prepare("SELECT COUNT(*) as count FROM coupons").get() as { count: number };
  if (couponsCount.count < 2) {
    throw new Error(`Critical Verification Failure: Expected baseline active coupons, found ${couponsCount.count}.`);
  }
  const welcomeCoup = db.prepare("SELECT code, type FROM coupons WHERE code = 'WELCOME10'").get() as any;
  if (!welcomeCoup) {
    throw new Error('Critical Verification Failure: Baseline coupon "WELCOME10" is missing.');
  }
  console.log(`✓ Active baseline coupons verified. Found "${welcomeCoup.code}" (${welcomeCoup.type}).`);

  db.close();

  console.log('==================================================');
  console.log('DATABASE SCHEMA & SEED VERIFICATION PASSED SUCCESSFULLY!');
  console.log('==================================================');
}

try {
  runVerification();
  process.exit(0);
} catch (error: any) {
  console.error('\n❌ DATABASE VERIFICATION FAILED:', error.message || error);
  process.exit(1);
}
