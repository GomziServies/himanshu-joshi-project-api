/**
 * api/index.js
 * Vercel serverless entrypoint.
 *
 * On Vercel, src/server.js never runs (there is no app.listen), so the database
 * connection and startup seeding it performed must happen here instead. The
 * promise is cached on the warm lambda so we connect once per container, not
 * once per request.
 */

const app = require('../src/app');
const { connectDB } = require('../src/config/db');
const seedDatabase = require('../src/utils/seed');

let bootPromise = null;

async function boot() {
  await connectDB();
  try {
    await seedDatabase();
  } catch (seedErr) {
    console.warn('[Seeder] Startup seeding warning:', seedErr.message);
  }
}

module.exports = async (req, res) => {
  if (!bootPromise) {
    // Reset the cache on failure so the next request retries instead of
    // permanently serving a rejected promise.
    bootPromise = boot().catch((err) => {
      bootPromise = null;
      throw err;
    });
  }

  try {
    await bootPromise;
  } catch (err) {
    console.error('[Fatal] Database bootstrap failed:', err.message);
    return res.status(503).json({
      success: false,
      message: `Database unavailable: ${err.message}`
    });
  }

  return app(req, res);
};
