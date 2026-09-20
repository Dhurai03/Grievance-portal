const assert = require('assert');
const { db } = require('../config/db');
const { classifyGrievance } = require('../services/aiClassifier');
const bcrypt = require('bcryptjs');

console.log('=== JAN SUNIYE BACKEND VERIFICATION TEST ===');

function testDatabaseConnection() {
  console.log('Test 1: Database Connection & Integrity...');
  try {
    const tableCount = db.prepare(`
      SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
    `).get().count;
    
    console.log(`- Detected ${tableCount} operational tables.`);
    assert.ok(tableCount >= 13, 'Should have at least 13 tables defined.');
    console.log('✓ Database Connection Verified!');
  } catch (error) {
    console.error('✗ Database connection test failed:', error);
    process.exit(1);
  }
}

function testAuthUtilities() {
  console.log('\nTest 2: Authentication Hashing Security...');
  try {
    const password = 'demoSecurePassword2026';
    const hash = bcrypt.hashSync(password, 10);
    
    assert.notStrictEqual(password, hash, 'Hashed password should not equal plaintext.');
    assert.ok(bcrypt.compareSync(password, hash), 'Hashed validation comparison should succeed.');
    assert.ok(!bcrypt.compareSync('wrongPassword', hash), 'Hashed validation comparison should fail for incorrect input.');
    
    // Verify seeded users email exists
    const admin = db.prepare("SELECT email, role FROM users WHERE email = 'admin@example.com'").get();
    assert.ok(admin, 'Admin seed user should exist.');
    assert.strictEqual(admin.role, 'admin', 'Admin user should have admin role.');
    
    console.log('✓ Hashing Security & User Seeding Verified!');
  } catch (error) {
    console.error('✗ Authentication utilities test failed:', error);
    process.exit(1);
  }
}

function testAIClassifier() {
  console.log('\nTest 3: Smart AI Classifier heuristics...');
  try {
    // 1. Test Road keyword match
    const roadsSug = classifyGrievance('The road near block C is broken and filled with large potholes.');
    assert.strictEqual(roadsSug.category, 'Roads & Streets');
    assert.strictEqual(roadsSug.subcategory, 'Potholes on Main Road');
    
    // 2. Test Water leakage keyword match
    const waterSug = classifyGrievance('There is a huge water pipe leak overflowing down the street.');
    assert.strictEqual(waterSug.category, 'Water Supply');
    assert.strictEqual(waterSug.subcategory, 'Water Pipe Leakage');
    
    // 3. Test priority boost escalation
    const dangerousWireSug = classifyGrievance('Dangerous sparking wire hanging from the electricity post near the school fire danger.');
    assert.strictEqual(dangerousWireSug.priority, 'CRITICAL');
    
    console.log('✓ AI Classifier suggestions verified!');
  } catch (error) {
    console.error('✗ AI Classifier test failed:', error);
    process.exit(1);
  }
}

function runAll() {
  testDatabaseConnection();
  testAuthUtilities();
  testAIClassifier();
  console.log('\n======================================');
  console.log('ALL BACKEND SYSTEMS CHECKED & VERIFIED!');
  console.log('======================================');
}

runAll();
