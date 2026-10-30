const Product = require('../models/Product');
const Banner = require('../models/Banner');
const User = require('../models/User');

const SEED_OFFERINGS = [
  {
    title: 'Salahkareshwar Shivling Sthapana',
    slug: 'shivling-sthapana',
    category: 'Offering',
    subtitle: 'श्री सलाहकारेश्वर महादेव शिवलिंग स्थापना एवं षोडशोपचार वैदिक प्रतिष्ठा',
    price: 5100,
    originalPrice: 7100,
    shortDescription: 'Consecrate your home with an authentic Swayambhu Shivling blessed at Sri Salahkareshwar Mahadev Tirth, installed with Vedic rituals.',
    description: `The sacred Shivling Sthapana is performed according to Shiva Agamas at Sri Salahkareshwar Mahadev Tirth in Gotri, Vadodara. The naturally sanctified Swayambhu stone holds the vibrational resonance of Lord Shiva.

During this auspicious Seva:
1. Ganpati Puja & Punyahavachanam for purifying the altar and removing impediments.
2. Kalash Sthapana & Invocation of Divine Deities through ancient Rigvedic hymns.
3. Consecration (Pran Pratishtha) transferring divine cosmic energy into the Lingam.
4. Detailed Rudrabhishek with 5 sacred liquids (Panchamrit) and bilva patra offerings.
5. Sankalp blessing uttered in the devotee's specific Gotra and Nakshatra for prosperity and longevity.

The consecrated Prasad box is carefully packed and dispatched via Speed Post directly to your residence, carrying the holy sanctum blessings to your home temple.`,
    images: [
      '/salahkareshwar-shivling.jpg',
      '/punya-passport-logo.jpg'
    ],
    featuredImage: '/salahkareshwar-shivling.jpg',
    inStock: true,
    stockQuantity: 108,
    isActive: true,
    isFeatured: true,
    displayOrder: 1,
    prasadIncludes: [
      'Consecrated Salahkareshwar Mahadev Shivling with Brass Yoni Peeth',
      'Sanctum Bhasma & Holy Gangajal vial (100ml)',
      '108-bead Sacred Panchmukhi Rudraksha Mala',
      'Silver-plated Consecrated Bilva Leaf',
      'Blessed Raksha Sutra Thread',
      'Official Seva Certificate signed by Head Priest'
    ],
    ritualsIncluded: [
      'Ganpati & Kalash Sthapana',
      'Vedic Pran Pratishtha',
      'Panchamrit Rudrabhishek',
      '108 Bilva Archana',
      'Family Gotra Sankalp'
    ],
    ritualDetails: {
      duration: '2.5 Hours',
      priestsCount: 2,
      sanctum: 'Salahkareshwar Mahadev Tirth Sanctum & Yagyashala',
      samagriProvided: true
    },
    specifications: [
      { key: 'Lingam Stone', value: 'Swayambhu Sanctified Stone (Salahkareshwar)' },
      { key: 'Base (Yoni Peeth)', value: 'Pure Solid Brass with Engraved Tridents' },
      { key: 'Vedic Samhita', value: 'Rigvedic Rudra Sukta & Namakam-Chamakam' },
      { key: 'Fulfillment', value: 'Puja Video Recording + Sanctified Prasad Box' }
    ]
  }
];

const SEED_BANNERS = [
  {
    title: 'Maha Shivling Sthapana & Vedic Abhishek',
    subtitle: 'Invite Divine Auspiciousness, Peace & Prosperity into your home with consecrated Salahkareshwar Shivling',
    imageUrl: 'https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'Book Seva Now',
    ctaLink: '/offerings/shivling-sthapana',
    badgeText: 'Sacred Consecration Offering',
    displayOrder: 1,
    isActive: true
  },
  {
    title: 'Shravan Somwar Special Rudrabhishek',
    subtitle: 'Perform laghu-rudra archana in your family Gotra for health, longevity, and divine grace',
    imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'Explore Rituals',
    ctaLink: '/offerings/rudrabhishek-puja',
    badgeText: 'Auspicious Month Seva',
    displayOrder: 2,
    isActive: true
  },
  {
    title: 'Authentic Vedic Vidhi & Sanctified Temple Prasad',
    subtitle: 'Every offering is performed strictly according to Shastras by learned Kashi Brahmins',
    imageUrl: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1600&auto=format&fit=crop',
    ctaText: 'View All Offerings',
    ctaLink: '/offerings',
    badgeText: '100% Shastra Consecrated',
    displayOrder: 3,
    isActive: true
  }
];

const SEED_ADMIN = {
  name: 'Shree Temple Trust Administrator',
  email: 'admin@temple.org',
  password: 'Admin@Temple2026',
  role: 'admin',
  phone: '+91 9876543210',
  address: {
    street: 'Sanctum Office, Temple Complex',
    city: 'Varanasi',
    state: 'Uttar Pradesh',
    postalCode: '221001',
    country: 'India'
  }
};

/**
 * Idempotently seeds the database.
 */
async function seedDatabase() {
  console.log('[Seeder] Checking database state for initial seeding...');

  // 1. Seed Admin User
  const existingAdmin = await User.findOne({ email: SEED_ADMIN.email });
  if (!existingAdmin) {
    console.log(`[Seeder] Creating default administrator (${SEED_ADMIN.email})...`);
    await User.create(SEED_ADMIN);
    console.log('[Seeder] Default administrator successfully created.');
  } else {
    console.log('[Seeder] Default administrator already exists. Skipping user creation.');
  }

  // 2. Seed Offerings (Products)
  for (const offering of SEED_OFFERINGS) {
    const existing = await Product.findOne({ slug: offering.slug });
    if (!existing) {
      console.log(`[Seeder] Inserting offering: "${offering.title}"...`);
      await Product.create(offering);
    }
  }

  // 3. Seed Banners
  for (const banner of SEED_BANNERS) {
    const existing = await Banner.findOne({ title: banner.title });
    if (!existing) {
      console.log(`[Seeder] Inserting banner: "${banner.title}"...`);
      await Banner.create(banner);
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
