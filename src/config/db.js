const mongoose = require('mongoose');

let mongoMemoryServer = null;

/**
 * Establishes Mongoose connection with automatic in-memory fallback.
 * @returns {Promise<mongoose.Connection>}
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const configuredUri = process.env.MONGODB_URI;
  const isExplicitMemory = process.env.USE_IN_MEMORY_DB === 'true' || process.env.NODE_ENV === 'test';

  if (!isExplicitMemory && configuredUri) {
    try {
      console.log(`[Database] Attempting connection to MongoDB at: ${configuredUri.split('@').pop()}`);
      await mongoose.connect(configuredUri, {
        serverSelectionTimeoutMS: 2500,
        connectTimeoutMS: 2500
      });
      console.log('[Database] Successfully connected to external MongoDB.');
      return mongoose.connection;
    } catch (err) {
      console.warn(`[Database] External MongoDB connection failed (${err.message}). Falling back to in-memory MongoDB...`);
    }
  }

  // In-Memory Fallback
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    if (!mongoMemoryServer) {
      console.log('[Database] Starting in-memory MongoDB server (mongodb-memory-server)...');
      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'mandir_platform'
        }
      });
    }

    const memoryUri = mongoMemoryServer.getUri();
    console.log('[Database] Connecting Mongoose to in-memory MongoDB instance...');
    await mongoose.connect(memoryUri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('[Database] Successfully connected to in-memory MongoDB instance.');
    return mongoose.connection;
  } catch (memErr) {
    console.error('[Database] CRITICAL: Failed to initialize in-memory database:', memErr.message);
    throw memErr;
  }
}

/**
 * Disconnects Mongoose and stops in-memory server if running.
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
    mongoMemoryServer = null;
  }
  console.log('[Database] Disconnected from MongoDB.');
}

/**
 * Clears all collections (used in automated test suites).
 */
async function clearDatabase() {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
}

module.exports = {
  connectDB,
  disconnectDB,
  clearDatabase
};
