/**
 * src/app.js
 * Express Application Configuration & Middleware Pipeline
 * Exported separately from server.js to enable headless Supertest integration tests.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const AppError = require('./utils/appError');
const errorHandler = require('./middleware/errorHandler');

// Route Aggregator
const apiRoutes = require('./routes');

const app = express();

// 1. Trust proxy headers when deployed behind reverse proxy (Nginx / Cloud Run / Load Balancers)
app.set('trust proxy', 1);

// 2. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false // Disabled for REST API to allow image loading across domains
}));

// 3. CORS Configuration supporting Website (5173, 3000) & Admin (5174, 3001)
const allowedOriginsEnv = process.env.CORS_ORIGINS || '';
const defaultOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
];

const whitelist = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map((o) => o.trim()).filter(Boolean)
  : defaultOrigins;

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. mobile apps, curl, Supertest, server-to-server)
    if (!origin) return callback(null, true);
    if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    return callback(new AppError(`CORS blocked for origin: ${origin}`, 403));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Total-Count'],
  maxAge: 86400 // 24 hours preflight cache
};

app.use(cors(corsOptions));
// Explicit preflight handling
app.options('*', cors(corsOptions));

// 4. Request Logging (skip during automated test runs)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// 5. Body Parsing with safe size limits (10MB handles high-res base64 temple images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Global Rate Limiter (200-300 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // bypass in tests
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});
app.use('/api', globalLimiter);

// 7. Mount Master API Routes under /api
app.use('/api', apiRoutes);

// Root informational endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shree Temple Platform API Gateway',
    documentation: '/api/health',
    version: '1.0.0'
  });
});

// 8. 404 Catch-All Handler for unmatched routes
app.all('*', (req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404));
});

// 9. Centralized Error Handling Middleware
app.use(errorHandler);

module.exports = app;
