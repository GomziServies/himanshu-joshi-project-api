/**
 * Jest Global Test Environment Setup
 * Connects to in-memory MongoDB runner, suppresses noise, clears collections between runs.
 */
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

jest.setTimeout(60000);

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_key_12345';
  process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret_67890';
  process.env.DEMO_PAYMENT_ENABLED = 'true';

  try {
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'mandir_test'
      }
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err) {
    console.warn('[test setup] MongoMemoryServer setup failed, falling back to local test DB:', err.message);
    const fallbackUri = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/mandir_test';
    await mongoose.connect(fallbackUri);
  }
}, 60000);

afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
