/**
 * src/server.js
 * Production Server Entrypoint & Process Lifecycle Manager
 * Handles database connectivity, HTTP port binding, and graceful OS shutdown signals.
 */

const app = require('./app');
const { connectDB } = require('./config/db');
const seedDatabase = require('./utils/seed');

// Ensure port configuration is parsed as an integer
const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;

function assertProductionConfig() {
  if (NODE_ENV !== 'production') return;
  const missing = ['JWT_SECRET', 'MONGODB_URI', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'].filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}

async function startServer() {
  try {
    assertProductionConfig();

    // 1. Establish database connection (Atlas/local, or in-memory when USE_IN_MEMORY_DB=true)
    await connectDB();
    console.log('[Database] MongoDB connection established successfully');

    // 2. Pre-seed database idempotently on startup
    if (NODE_ENV !== 'test') {
      try {
        await seedDatabase();
      } catch (seedErr) {
        console.warn('[Seeder] Startup seeding warning:', seedErr.message);
      }
    }

    // 3. Bind HTTP server to port
    server = app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`  SHREE TEMPLE PLATFORM BACKEND API RUNNING            `);
      console.log(`  Port:        ${PORT}                                 `);
      console.log(`  Environment: ${NODE_ENV}                             `);
      console.log(`  API Base:    http://localhost:${PORT}/api            `);
      console.log(`=======================================================`);
    });

    server.on('error', (error) => {
      if (error.syscall !== 'listen') throw error;
      switch (error.code) {
        case 'EACCES':
          console.error(`[Fatal] Port ${PORT} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          console.error(`[Fatal] Port ${PORT} is already in use by another process`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    console.error('[Fatal] Failed to bootstrap server:', error.message);
    process.exit(1);
  }
}

// Graceful Shutdown Handler
function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('[Server] HTTP connections closed.');
      try {
        const mongoose = require('mongoose');
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          await mongoose.connection.close(false);
          console.log('[Database] MongoDB connection pool terminated.');
        }
        process.exit(0);
      } catch (dbErr) {
        console.error('[Database] Error closing DB pool:', dbErr.message);
        process.exit(1);
      }
    });

    // Force close after 10s timeout
    setTimeout(() => {
      console.error('[Server] Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

// OS Signal Listeners
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Process Exception Safeguards
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection] at:', promise, 'reason:', reason);
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('[Uncaught Exception] thrown:', error);
  process.exit(1);
});

// Launch server if not imported by test suite
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
