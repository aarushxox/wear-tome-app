import assert from 'assert';
import Database from 'better-sqlite3';

function verifyDatabase() {
  console.log('--------------------------------------------------');
  console.log('STARTING INTEGRATION DATABASE VERIFICATION SCRIPT');
  console.log('--------------------------------------------------');

  const db = new Database('weartome.db');

  // 1. Verify existence of canonical tables
  const tables = [
    'adminauth', 'users', 'category', 'products', 'mediafile',
    'refreshtoken', 'websitesetting', 'systemsetting', 'themepreset',
    'themecustomization', 'cart', 'orders', 'order_items', 'coupons',
    'coupon_redemptions', 'message', 'notification', 'career_applications',
    'activitylog', 'blogs'
  ];

  console.log('1. Checking existence of all required canonical tables...');
  for (const table of tables) {
    const res = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    assert.ok(res, `Required canonical table '${table}' does not exist!`);
  }
  console.log('✓ All 20 required canonical tables are present.');

  // 2. Verify that there are no duplicate legacy tables
  console.log('2. Checking for old/legacy duplicate tables...');
  const legacyTables = ['product', 'order', 'user'];
  for (const table of legacyTables) {
    const res = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`).get(table);
    assert.strictEqual(res, undefined, `Legacy duplicate table '${table}' was found! It should be dropped/consolidated.`);
  }
  console.log('✓ No duplicate legacy tables detected.');

  // 3. Verify admin accounts in both adminauth and users
  console.log('3. Checking seeded administrative accounts...');
  const adminAuth1: any = db.prepare(`SELECT id, email FROM adminauth WHERE email = ?`).get('weartome@admin.com');
  const adminAuth2: any = db.prepare(`SELECT id, email FROM adminauth WHERE email = ?`).get('admin@weartome.com');
  assert.ok(adminAuth1, "Seeded super-admin 'weartome@admin.com' missing from 'adminauth'!");
  assert.ok(adminAuth2, "Seeded super-admin 'admin@weartome.com' missing from 'adminauth'!");

  const adminUser1: any = db.prepare(`SELECT id, email, role FROM users WHERE email = ?`).get('weartome@admin.com');
  const adminUser2: any = db.prepare(`SELECT id, email, role FROM users WHERE email = ?`).get('admin@weartome.com');
  assert.ok(adminUser1, "Seeded super-admin 'weartome@admin.com' missing from 'users'!");
  assert.ok(adminUser2, "Seeded super-admin 'admin@weartome.com' missing from 'users'!");
  assert.strictEqual(adminUser1.role, 'Admin', "Admin user 1 does not have 'Admin' role!");
  assert.strictEqual(adminUser2.role, 'Admin', "Admin user 2 does not have 'Admin' role!");
  console.log('✓ Admin records are fully verified across both tables.');

  // 4. Verify seeded products
  console.log('4. Checking seeded products and WebP image associations...');
  const seededSlugs = ['silk-midnight-gown', 'golden-hour-watch', 'cashmere-scarf'];
  for (const slug of seededSlugs) {
    const product: any = db.prepare(`SELECT id, name FROM products WHERE slug = ?`).get(slug);
    assert.ok(product, `Product with slug '${slug}' is missing from the database!`);

    // Check that there are WebP media files registered for this product
    const mediaCountObj: any = db.prepare(`SELECT COUNT(*) as count FROM mediafile WHERE entity_type = 'product' AND entity_id = ?`).get(product.id);
    const mediaCount = mediaCountObj?.count || 0;
    assert.ok(mediaCount >= 2, `Product '${slug}' should have at least 2 media files associated! Found: ${mediaCount}`);
  }
  console.log('✓ All 3 seeded products and their media associations are fully intact.');

  // 5. Verify website setting and system settings
  console.log('5. Checking branding and system configurations...');
  const siteName: any = db.prepare(`SELECT value FROM websitesetting WHERE key = ?`).get('site.name');
  assert.strictEqual(siteName?.value, 'Wear Tome', "Branding 'site.name' is not set to 'Wear Tome'!");

  const themeMode: any = db.prepare(`SELECT value FROM systemsetting WHERE key = ?`).get('theme_mode');
  assert.ok(themeMode, "System setting 'theme_mode' is missing!");
  console.log(`✓ Website configuration verified (site.name = '${siteName.value}', theme_mode = '${themeMode.value}').`);

  // 6. Verify three premium presets exist in themepreset
  console.log('6. Checking luxury design presets in themepreset...');
  const presetNames = ['Gucci Luxe', 'Minimal Dark', 'Vibrant Modern'];
  for (const presetName of presetNames) {
    const preset: any = db.prepare(`SELECT id, tokens FROM themepreset WHERE name = ?`).get(presetName);
    assert.ok(preset, `Theme preset '${presetName}' is missing!`);

    // Parse and verify tokens
    const tokens = JSON.parse(preset.tokens);
    assert.ok(tokens.primaryBackground, `Preset '${presetName}' does not have primaryBackground token defined!`);
  }
  console.log('✓ All 3 luxury design theme presets are present with complete token structures.');

  db.close();
  console.log('--------------------------------------------------');
  console.log('DATABASE INTEGRITY VERIFIED: ALL CHECKS PASSED!');
  console.log('--------------------------------------------------');
}

verifyDatabase();
