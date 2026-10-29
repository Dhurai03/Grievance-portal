/**
 * Database Seeder - College Grievance Portal
 * Run: node backend/seed.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Department = require('./models/Department');

const DEPARTMENTS = [
  { name: 'Academic Affairs', code: 'ACAD', description: 'Handles examination, grades, curriculum, and academic policies.', contactEmail: 'academic@college.edu', slaConfig: { LOW: 168, MEDIUM: 72, HIGH: 48, CRITICAL: 24 } },
  { name: 'Hostel & Accommodation', code: 'HSTL', description: 'Manages student hostel facilities, rooms, and mess services.', contactEmail: 'hostel@college.edu', slaConfig: { LOW: 120, MEDIUM: 48, HIGH: 24, CRITICAL: 12 } },
  { name: 'Library', code: 'LIB', description: 'Library resources, book availability, and reading room management.', contactEmail: 'library@college.edu', slaConfig: { LOW: 240, MEDIUM: 120, HIGH: 72, CRITICAL: 24 } },
  { name: 'IT & Technical Support', code: 'IT', description: 'Network, software, hardware, and digital services support.', contactEmail: 'it@college.edu', slaConfig: { LOW: 120, MEDIUM: 48, HIGH: 24, CRITICAL: 8 } },
  { name: 'Finance & Fees', code: 'FIN', description: 'Fee collection, scholarships, refunds, and financial matters.', contactEmail: 'finance@college.edu', slaConfig: { LOW: 168, MEDIUM: 72, HIGH: 48, CRITICAL: 24 } },
  { name: 'Student Welfare & Counseling', code: 'WELF', description: 'Mental health support, student welfare, and counseling services.', contactEmail: 'welfare@college.edu', slaConfig: { LOW: 72, MEDIUM: 24, HIGH: 12, CRITICAL: 4 } },
  { name: 'Sports & Extracurricular', code: 'SPRT', description: 'Sports facilities, equipment, and extracurricular activities.', contactEmail: 'sports@college.edu', slaConfig: { LOW: 240, MEDIUM: 120, HIGH: 72, CRITICAL: 48 } },
  { name: 'Transportation', code: 'TRNS', description: 'College bus services, routes, and transportation management.', contactEmail: 'transport@college.edu', slaConfig: { LOW: 168, MEDIUM: 72, HIGH: 24, CRITICAL: 8 } },
  { name: 'Canteen & Food Services', code: 'CANT', description: 'Canteen management, food quality, and hygiene standards.', contactEmail: 'canteen@college.edu', slaConfig: { LOW: 168, MEDIUM: 72, HIGH: 24, CRITICAL: 8 } },
  { name: 'Placement & Career Services', code: 'PLCMNT', description: 'Campus placements, internships, and career guidance.', contactEmail: 'placement@college.edu', slaConfig: { LOW: 240, MEDIUM: 120, HIGH: 72, CRITICAL: 24 } },
  { name: 'Ragging & Discipline', code: 'DISC', description: 'Anti-ragging cell, discipline committee, and conduct matters.', contactEmail: 'antirag@college.edu', slaConfig: { LOW: 48, MEDIUM: 24, HIGH: 12, CRITICAL: 4 } },
  { name: 'Faculty & Teaching Quality', code: 'FACTL', description: 'Teaching quality, faculty conduct, and academic standards.', contactEmail: 'faculty@college.edu', slaConfig: { LOW: 168, MEDIUM: 72, HIGH: 48, CRITICAL: 24 } }
];

const USERS = [
  { name: 'Admin User', email: 'admin@college.edu', password: 'admin123', role: 'admin', designation: 'System Administrator' },
  { name: 'Dean Dr. Ramesh Kumar', email: 'dean@college.edu', password: 'dean123', role: 'dean', designation: 'Dean of Students' },
  { name: 'Academic HOD', email: 'academic.officer@college.edu', password: 'officer123', role: 'officer', designation: 'Head of Academic Affairs' },
  { name: 'Hostel Warden', email: 'hostel.warden@college.edu', password: 'officer123', role: 'officer', designation: 'Chief Warden' },
  { name: 'IT Officer', email: 'it.support@college.edu', password: 'officer123', role: 'officer', designation: 'IT Support Manager' },
  { name: 'Student Arjun S', email: 'student@college.edu', password: 'student123', role: 'student', studentId: 'CS2024001', department: 'Computer Science', year: 2, section: 'A' },
];

async function seedData() {
  console.log('\n🌱 Checking and seeding initial database data...\n');

  // Upsert departments
  const deptMap = {};
  for (const deptData of DEPARTMENTS) {
    const d = await Department.findOneAndUpdate(
      { code: deptData.code },
      { $set: deptData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    deptMap[d.code] = d;
  }
  console.log(`✅ Verified/Created ${DEPARTMENTS.length} departments`);

  // Upsert demo users
  for (const userData of USERS) {
    let user = await User.findOne({ email: userData.email.toLowerCase() });
    if (!user) {
      user = new User(userData);
    } else {
      user.name = userData.name;
      user.role = userData.role;
      user.password = userData.password;
      if (userData.studentId) user.studentId = userData.studentId;
      if (userData.designation) user.designation = userData.designation;
    }

    if (userData.role === 'officer') {
      let deptCode = null;
      if (userData.email.includes('academic')) deptCode = 'ACAD';
      if (userData.email.includes('hostel')) deptCode = 'HSTL';
      if (userData.email.includes('it')) deptCode = 'IT';

      if (deptCode && deptMap[deptCode]) {
        user.assignedDepartment = deptMap[deptCode]._id;
        await Department.findByIdAndUpdate(deptMap[deptCode]._id, {
          $set: { head: user._id },
          $addToSet: { officers: user._id }
        });
      }
    }

    await user.save();
    console.log(`✅ Verified/Created user: ${user.email} (${user.role})`);
  }

  console.log('\n🎉 Database ready with demo credentials:');
  console.log('   Admin:   admin@college.edu / admin123');
  console.log('   Dean:    dean@college.edu / dean123');
  console.log('   Officer: academic.officer@college.edu / officer123');
  console.log('   Student: student@college.edu / student123\n');
}

if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      await seedData();
      process.exit(0);
    } catch (error) {
      console.error('❌ Seed error:', error);
      process.exit(1);
    }
  })();
}

module.exports = { seedData, DEPARTMENTS, USERS };
