const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { protect, adminOnly } = require('../middleware/auth');

// Public
router.get('/', bannerController.getPublicBanners);

// Admin CRUD & Optimistic Toggle
router.post('/', protect, adminOnly, bannerController.createBanner);
router.put('/:id', protect, adminOnly, bannerController.updateBanner);
router.patch('/:id/toggle', protect, adminOnly, bannerController.toggleBannerStatus);
router.delete('/:id', protect, adminOnly, bannerController.deleteBanner);

module.exports = router;
