/**
 * src/routes/index.js
 * Master Route Aggregator
 * Provides dual mount points to guarantee 100% compatibility with Website and Admin Dashboard clients.
 */

const express = require('express');
const router = express.Router();

const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const bannerRoutes = require('./bannerRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const receiptRoutes = require('./receiptRoutes');

// Controllers needed for explicit admin routing
const productController = require('../controllers/productController');
const bannerController = require('../controllers/bannerController');
const statsController = require('../controllers/statsController');
const { protect, adminOnly } = require('../middleware/auth');

// 1. Health (/api/health)
router.use('/health', healthRoutes);

// 2. Auth (/api/auth)
router.use('/auth', authRoutes);

// 3. Products (/api/products)
router.use('/products', productRoutes);

// Explicit Admin Products route (/api/admin/products)
const adminProductRouter = express.Router();
adminProductRouter.use(protect, adminOnly);
adminProductRouter.get('/', productController.getAdminProducts);
adminProductRouter.post('/', productController.createProduct);
adminProductRouter.put('/:id', productController.updateProduct);
adminProductRouter.delete('/:id', productController.deleteProduct);
router.use('/admin/products', adminProductRouter);

// 4. Banners (/api/banners)
router.use('/banners', bannerRoutes);

// Explicit Admin Banners route (/api/admin/banners)
const adminBannerRouter = express.Router();
adminBannerRouter.use(protect, adminOnly);
adminBannerRouter.get('/', bannerController.getAdminBanners);
adminBannerRouter.post('/', bannerController.createBanner);
adminBannerRouter.put('/:id', bannerController.updateBanner);
adminBannerRouter.patch('/:id/toggle', bannerController.toggleBannerStatus);
adminBannerRouter.delete('/:id', bannerController.deleteBanner);
router.use('/admin/banners', adminBannerRouter);

// 5. Orders (/api/orders and /api/admin/orders)
router.use('/orders', orderRoutes);
router.use('/admin/orders', orderRoutes);

// 6. Users (/api/users and /api/admin/users)
router.use('/users', userRoutes);
router.use('/admin/users', userRoutes);

// 7. Receipts (/api/receipts and /api/admin/receipts)
router.use('/receipts', receiptRoutes);
router.use('/admin/receipts', receiptRoutes);

// 8. Stats (/api/stats and /api/admin/stats)
router.get('/stats', protect, adminOnly, statsController.getAdminStats);
router.get('/admin/stats', protect, adminOnly, statsController.getAdminStats);

module.exports = router;
