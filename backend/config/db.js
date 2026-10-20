const mongoose = require('mongoose');

let isConnecting = false;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1 || isConnecting) return;
  isConnecting = true;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/college_grievance_portal';

  if (uri.includes('<db_password>') || uri.includes('<password>')) {
    isConnecting = false;
    console.error('\n❌ MongoDB Connection Error:');
    console.error('   Your backend/.env contains the placeholder "<db_password>".');
    console.error('   Please replace "<db_password>" in MONGODB_URI with your actual MongoDB Atlas database user password.\n');
    return;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    isConnecting = false;
    return conn;
  } catch (error) {
    isConnecting = false;
    console.error('❌ MongoDB Connection Warning:', error.message);
    console.log('💡 Note: Ensure your MongoDB Atlas user password is correct and your IP is whitelisted (0.0.0.0/0 in Atlas Network Access).');
    console.log('🔄 Will retry MongoDB connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected. Attempting reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected.');
});

module.exports = connectDB;
