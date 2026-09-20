const { initDb } = require('./config/db');

try {
  console.log("Starting database initialization...");
  initDb();
  console.log("Database initialized successfully!");
  process.exit(0);
} catch (error) {
  console.error("Database initialization failed:", error);
  process.exit(1);
}
