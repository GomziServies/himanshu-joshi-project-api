/**
 * src/controllers/statsController.js
 * Executive Dashboard Analytics for Brown-and-White Admin Portal
 */

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

exports.getAdminStats = async (req, res, next) => {
  try {
    const [totalProducts, totalUsers, totalOrders, testPaidSummary, paidOrdersSummary, recentOrders] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: 'customer' }),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: 'PAID', isTest: true } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.aggregate([
        { $match: { status: 'PAID', isTest: { $ne: true } } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('orderNumber customer.name totalAmount status paymentStatus createdAt')
        .lean()
    ]);

    const revenue = paidOrdersSummary.length > 0 ? paidOrdersSummary[0].totalRevenue : 0;
    const paidCount = paidOrdersSummary.length > 0 ? paidOrdersSummary[0].count : 0;

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: revenue,
        totalOrders,
        paidOrdersCount: paidCount,
        testRevenue: testPaidSummary.length > 0 ? testPaidSummary[0].totalRevenue : 0,
        testPaidCount: testPaidSummary.length > 0 ? testPaidSummary[0].count : 0,
        totalProducts,
        totalUsers,
        recentOrders: recentOrders || []
      }
    });
  } catch (error) {
    next(error);
  }
};
