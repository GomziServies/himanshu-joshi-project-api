const Product = require('../models/Product');
const Banner = require('../models/Banner');
const User = require('../models/User');

const SEED_OFFERINGS = [
  {
    title: 'Shivling Sthapana & Rudrabhishek Offering',
    slug: 'shivling-sthapana',
    category: 'Offering',
    subtitle: 'Sacred Narmadeshwar Shivling Consecration with Vedic Pran Pratishtha & Bilva Abhishek',
    price: 5100,
    originalPrice: 7100,
    shortDescription: 'Consecrate your home with an authentic Narmadeshwar Shivling installed with Vedic rituals, followed by a personalized Rudrabhishek performed in your family Gotra.',
    description: `The sacred Shivling Sthapana is among the most revered Vedic rituals described in the Shiva Purana. Sourced directly from the sanctified Narmada River bed, the naturally rounded Swayambhu Narmadeshwar stone holds the vibrational resonance of Lord Shiva.

During this auspicious Seva:
1. Ganpati Puja & Punyahavachanam for purifying the altar and removing impediments.
2. Kalash Sthapana & Invocation of Divine Deities through ancient Rigvedic hymns.
3. Consecration (Pran Pratishtha) transferring divine cosmic energy into the Lingam.
4. Detailed Rudrabhishek with 5 sacred liquids (Panchamrit) and bilva patra offerings.
5. Sankalp blessing uttered in the devotee's specific Gotra and Nakshatra for prosperity and longevity.

The consecrated Prasad box is carefully packed and dispatched via Speed Post directly to your residence, carrying the holy sanctum blessings to your home temple.`,
    images: [
      'https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1200&auto=format&fit=crop'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?q=80&w=1200&auto=format&fit=crop',
    inStock: true,
    stockQuantity: 108,
    isActive: true,
    isFeatured: true,
    displayOrder: 1,
    prasadIncludes: [
      'Consecrated Narmadeshwar Shivling with Brass Yoni Peeth',
      'Sanctum Bhasma & Holy Gangajal vial from Varanasi',
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
      sanctum: 'Temple Inner Sanctum & Yagyashala',
      samagriProvided: true
    },
    specifications: [
      { key: 'Lingam Stone', value: 'Original Narmada River Natural Pebble' },
      { key: 'Base (Yoni Peeth)', value: 'Pure Solid Brass with Engraved Tridents' },
      { key: 'Vedic Samhita', value: 'Rigvedic Rudra Sukta & Namakam-Chamakam' },
      { key: 'Fulfillment', value: 'Puja Video Recording + Sanctified Prasad Box' }
    ]
  },
  {
    title: 'Maha Rudrabhishek & 108 Bilva Archana',
    slug: 'rudrabhishek-puja',
    category: 'Puja',
    subtitle: 'Elaborate Rudra Chanting for Family Health, Peace, and Removal of Graha Dosha',
    price: 2100,
    originalPrice: 3100,
    shortDescription: 'Dedicated Rudrabhishek Seva performed by two Vedic scholars chanting Sri Rudram with fresh cow milk, honey, sugarcane juice, and 108 fresh bilva leaves.',
    description: 'A powerful spiritual recitation invoking the 11 forms of Lord Shiva for relief from ailments, ancestral peace, and spiritual illumination.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=1200&auto=format&fit=crop',
    inStock: true,
    stockQuantity: 500,
    isActive: true,
    isFeatured: true,
    displayOrder: 2,
    prasadIncludes: [
      'Rudrabhishek Sacred Bhasma',
      'Sanctified Dry Fruit Prasad Box',
      'Blessed Raksha Sutra'
    ],
    ritualsIncluded: [
      'Sri Rudram Recitation',
      'Panchamrit Snan',
      'Bilva Patra Samarpana'
    ],
    ritualDetails: {
      duration: '1.5 Hours',
      priestsCount: 2,
      sanctum: 'Shiva Mandapam',
      samagriProvided: true
    },
    specifications: [
      { key: 'Ritual Type', value: 'Panchamrit Rudrabhishek' },
      { key: 'Chanting', value: 'Namakam Chamakam Complete Recitation' }
    ]
  },
  {
    title: 'Maha Mrityunjaya Jaap & Havan (1,100 Chants)',
    slug: 'maha-mrityunjaya-jaap',
    category: 'Ritual',
    subtitle: 'Intensive Vedic Havan for Longevity, Protection, and Vital Energy',
    price: 11000,
    originalPrice: 15000,
    shortDescription: 'Consecrated Yagya with 1,100 sacred oblations into the consecrated fire pit by 3 priests for supreme spiritual protection and recovery.',
    description: 'The Maha Mrityunjaya Mantra is the great death-conquering mantra from the Rigveda, generating healing vibrations that dissolve fear and negativity.',
    images: [
      'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1200&auto=format&fit=crop'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?q=80&w=1200&auto=format&fit=crop',
    inStock: true,
    stockQuantity: 50,
    isActive: true,
    isFeatured: false,
    displayOrder: 3,
    prasadIncludes: [
      'Havan Bhasma',
      'Panchamrit Prasad',
      'Blessed Copper Yantra'
    ],
    ritualsIncluded: [
      '1,100 Maha Mrityunjaya Chants',
      'Vedic Havan with Pure Ghee',
      'Purna Ahuti'
    ],
    ritualDetails: {
      duration: '3.5 Hours',
      priestsCount: 3,
      sanctum: 'Yagya Shala',
      samagriProvided: true
    },
    specifications: [
      { key: 'Oblations', value: '1,100 Ahutis with Ghee and Sacred Herbs' }
    ]
  }
];

const SEED_BANNERS = [
  {
    title: 'Maha Shivling Sthapana & Vedic Abhishek',
    subtitle: 'Invite Divine Auspiciousness, Peace & Prosperity into your home with consecrated Narmadeshwar Shivling',
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
    title: 'Authentic Vedic Vidhi & Pure Narmada Prasad',
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
