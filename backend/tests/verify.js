const assert = require('assert');
const { classifyGrievance } = require('../services/aiClassifier');
const bcrypt = require('bcryptjs');

console.log('=== EDUGRIEVE COLLEGE GRIEVANCE BACKEND VERIFICATION ===\n');

function testAuthUtilities() {
  console.log('Test 1: Authentication Hashing Security...');
  try {
    const password = 'collegeSecurePassword2026';
    const hash = bcrypt.hashSync(password, 10);
    
    assert.notStrictEqual(password, hash, 'Hashed password should not equal plaintext.');
    assert.ok(bcrypt.compareSync(password, hash), 'Hashed validation comparison should succeed.');
    assert.ok(!bcrypt.compareSync('wrongPassword', hash), 'Hashed validation comparison should fail for incorrect input.');
    console.log('✓ Password hashing and verification working correctly.');
  } catch (error) {
    console.error('✗ Auth test failed:', error);
    process.exit(1);
  }
}

async function testAIClassifier() {
  console.log('\nTest 2: NLP College Grievance Classifier heuristics...');
  try {
    // 1. Examination / Academic test
    const examClass = await classifyGrievance('My semester marks for mathematics are missing from the portal and hall ticket is not issued');
    assert.strictEqual(examClass.departmentCode, 'ACAD');
    assert.strictEqual(examClass.category, 'Academic Affairs');
    console.log(`✓ Exam grievance routed to: ${examClass.department} (${examClass.category} - ${examClass.subcategory})`);

    // 2. Hostel & Mess test
    const hostelClass = await classifyGrievance('The hostel room has broken bathroom pipe and water supply is completely stopped');
    assert.strictEqual(hostelClass.departmentCode, 'HSTL');
    assert.strictEqual(hostelClass.category, 'Hostel & Accommodation');
    console.log(`✓ Hostel grievance routed to: ${hostelClass.department}`);

    // 3. IT & WiFi test
    const itClass = await classifyGrievance('College campus wifi is down in computer science lab 3 and cannot login to portal');
    assert.strictEqual(itClass.departmentCode, 'IT');
    assert.strictEqual(itClass.department, 'IT & Technical Support');
    console.log(`✓ IT grievance routed to: ${itClass.department}`);

    // 4. Critical Anti-ragging escalation
    const raggingClass = await classifyGrievance('Urgent help seniors are ragging and threatening juniors near hostel block 4');
    assert.strictEqual(raggingClass.departmentCode, 'DISC');
    assert.strictEqual(raggingClass.priority, 'CRITICAL');
    console.log(`✓ Anti-ragging grievance classified with priority: ${raggingClass.priority}`);

    // 5. Finance & fees test
    const feesClass = await classifyGrievance('Paid semester tuition fee online but challan receipt is not generated');
    assert.strictEqual(feesClass.departmentCode, 'FIN');
    console.log(`✓ Finance grievance routed to: ${feesClass.department}`);

    console.log('✓ All College NLP classification test cases passed!');
  } catch (error) {
    console.error('✗ AI Classifier test failed:', error);
    process.exit(1);
  }
}

async function runAll() {
  testAuthUtilities();
  await testAIClassifier();
  console.log('\n======================================');
  console.log('ALL EDUGRIEVE BACKEND SYSTEMS VERIFIED!');
  console.log('======================================');
}

runAll();
