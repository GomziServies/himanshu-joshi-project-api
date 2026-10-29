const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, adminOnly } = require('../middleware/auth');

// Public endpoints
router.get('/', productController.getPublicProducts);
router.get('/:slugOrId', productController.getProductBySlugOrId);

// Admin endpoints (guarded)
router.post('/', protect, adminOnly, productController.createProduct);
router.put('/:id', protect, adminOnly, productController.updateProduct);
router.delete('/:id', protect, adminOnly, productController.deleteProduct);

module.exports = router;
