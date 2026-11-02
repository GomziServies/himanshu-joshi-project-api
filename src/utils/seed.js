const Product = require('../models/Product');
const User = require('../models/User');

const SEED_OFFERINGS = [
  {
    title: 'Salahkareshwar Mahadev Shivling',
    slug: 'salahkareshwar-shivling',
    category: 'Offering',
    subtitle: 'श्री सलाहकारेश्वर महादेव शिवलिंग',
    price: 501,
    shortDescription: 'A Shivling blessed at Sri Salahkareshwar Mahadev Tirth, Gotri, Vadodara, in your name and gotra.',
    description: 'A Shivling blessed at Sri Salahkareshwar Mahadev Tirth in Gotri, Vadodara. Your name and gotra are taken in the sankalp at the temple, and the Shivling is then sent to the address you give.',
    images: ['/salahkareshwar-shivling.jpg'],
    featuredImage: '/salahkareshwar-shivling.jpg',
    inStock: true,
    isActive: true,
    isFeatured: true,
    displayOrder: 1,
    prasadIncludes: [
      'Shivling blessed at the temple',
      'Sankalp in your name and gotra',
      'Payment receipt on your email'
    ]
  }
];

/**
 * Idempotently seeds the database. Existing records are never overwritten,
 * so changes made from the admin panel survive restarts.
 */
async function seedDatabase() {
  console.log('[Seeder] Checking database state for initial seeding...');

  // 1. Seed Admin User (credentials come only from the environment)
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@temple.org';
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (existingAdmin) {
    console.log('[Seeder] Default administrator already exists. Skipping user creation.');
  } else if (!process.env.ADMIN_DEFAULT_PASSWORD) {
    console.warn('[Seeder] ADMIN_DEFAULT_PASSWORD is not set. Skipping administrator creation.');
  } else {
    console.log(`[Seeder] Creating default administrator (${adminEmail})...`);
    await User.create({
      name: process.env.ADMIN_DEFAULT_NAME || 'Temple Admin',
      email: adminEmail,
      password: process.env.ADMIN_DEFAULT_PASSWORD,
      role: 'admin'
    });
    console.log('[Seeder] Default administrator successfully created.');
  }

  // 2. Seed Offerings (Products)
  for (const offering of SEED_OFFERINGS) {
    const existing = await Product.findOne({ slug: offering.slug });
    if (!existing) {
      console.log(`[Seeder] Inserting offering: "${offering.title}"...`);
      await Product.create(offering);
    }
  }

  console.log('[Seeder] Database pre-seeding complete.');
}

// Standalone execution support
if (require.main === module) {
  const { connectDB, disconnectDB } = require('../config/db');
  (async () => {
    try {
      await connectDB();
      await seedDatabase();
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error('[Seeder] Execution failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = seedDatabase;
