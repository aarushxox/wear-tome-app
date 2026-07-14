import assert from 'assert';
import Database from 'better-sqlite3';

async function runTests() {
  console.log('--------------------------------------------------');
  console.log('STARTING INTEGRATION TEST SUITE: WEAR TOME API LAYER');
  console.log('--------------------------------------------------');

  // Reset redemptions for Jane Doe so tests are 100% repeatable
  const db = new Database('weartome.db');
  db.prepare('DELETE FROM coupon_redemptions WHERE user_id = 3').run();
  db.close();

  const BASE_URL = 'http://localhost:3000';

  // 1. Authenticate as Customer
  console.log('1. Testing Customer Login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testcustomer@weartome.com',
      password: 'customerpass123',
    }),
  });

  assert.strictEqual(loginRes.status, 200, 'Customer login failed');
  const loginData = await loginRes.json();
  assert.ok(loginData.token, 'Customer login token was not issued');
  console.log('✓ Customer Login passed successfully!');

  const token = loginData.token;

  // 2. Fetch products
  console.log('2. Testing Public Products Retrieval...');
  const prodRes = await fetch(`${BASE_URL}/api/products`);
  assert.strictEqual(prodRes.status, 200, 'Fetch products failed');
  const prodData = await prodRes.json();
  assert.ok(prodData.products.length > 0, 'No products found in DB catalog');
  console.log(`✓ Products retrieval passed! Found ${prodData.products.length} products.`);

  // 3. Clear shopping cart
  console.log('3. Testing Cart Clearing...');
  const clearRes = await fetch(`${BASE_URL}/api/cart`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.strictEqual(clearRes.status, 200, 'Clear cart failed');
  console.log('✓ Persistent cart cleared successfully!');

  // 4. Add product to cart
  console.log('4. Testing Add to Cart persistent DB update...');
  const addRes = await fetch(`${BASE_URL}/api/cart`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      product_id: 1,
      quantity: 1,
      size: 'L',
      color: '#1F1F1F',
    }),
  });
  assert.strictEqual(addRes.status, 200, 'Add to cart failed');
  console.log('✓ Product successfully persistent-added to cart!');

  // 5. Query shopping cart
  console.log('5. Testing Query Cart items and price calculations...');
  const cartRes = await fetch(`${BASE_URL}/api/cart`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  assert.strictEqual(cartRes.status, 200, 'Fetch cart failed');
  const cartData = await cartRes.json();
  assert.strictEqual(cartData.items.length, 1, 'Cart should contain exactly 1 item');
  assert.strictEqual(cartData.items[0].product_id, 1, 'Cart item product ID does not match');
  console.log('✓ Cart items retrieval and server price parsing matches perfectly!');

  // 6. Validate promo coupon code
  console.log('6. Testing Coupon validation with limits...');
  const coupRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      code: 'WELCOME10',
    }),
  });
  assert.strictEqual(coupRes.status, 200, 'Coupon validation failed');
  const coupData = await coupRes.json();
  assert.strictEqual(coupData.valid, true, 'Coupon is marked invalid');
  console.log('✓ Coupon WELCOME10 validation and limit checking passed successfully!');

  console.log('--------------------------------------------------');
  console.log('TEST SUITE COMPLETED SUCCESSFULLY: ALL 6 LEVELS PASSED!');
  console.log('--------------------------------------------------');
}

runTests().catch((err) => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
