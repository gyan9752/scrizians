const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT) || 5001;

/*
 * =========================================================
 * TRUST PROXY
 * =========================================================
 */

if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY);
}

/*
 * =========================================================
 * CORS
 * =========================================================
 */

const allowedOrigins = (
  process.env.FRONTEND_ORIGINS ||
  process.env.FRONTEND_URL ||
  ''
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');

  res.setHeader('X-Frame-Options', 'DENY');

  res.setHeader(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );

  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // such as Postman/server-to-server requests.
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost during development.
      if (
        process.env.NODE_ENV !== 'production' &&
        /^https?:\/\/localhost(?::\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }

      // Allow approved Scrizians production and preview deployments (F-05)
      if (
        /^https:\/\/(scrizians|frontend)(-[a-z0-9_-]+)?\.vercel\.app$/i.test(origin) ||
        /^https:\/\/(www\.)?scrizians\.com$/i.test(origin)
      ) {
        return callback(null, true);
      }

      // Allow configured frontend origins.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error('Origin is not allowed by CORS.')
      );
    },

    credentials: true,

    methods: [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS'
    ],

    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'X-Device-ID',
      'X-Device-Name'
    ]
  })
);

/*
 * =========================================================
 * BODY PARSERS
 * =========================================================
 */

app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || '1mb'
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.JSON_BODY_LIMIT || '1mb'
  })
);

app.use(cookieParser());

/*
 * =========================================================
 * REQUEST ID
 * =========================================================
 */

app.use((req, res, next) => {
  const incomingRequestId =
    req.headers['x-request-id'];

  const requestId =
    typeof incomingRequestId === 'string' &&
    incomingRequestId.trim()
      ? incomingRequestId.trim()
      : crypto.randomUUID();

  req.requestId = requestId;

  res.setHeader(
    'X-Request-ID',
    requestId
  );

  next();
});

/*
 * =========================================================
 * HEALTH CHECK
 * =========================================================
 */

app.get('/api/v1/health', (req, res) => {
  return res.status(200).json({
    success: true,
    status: 'ONLINE',
    service: 'Scrizians REST API Backend',
    parentCompany: 'Scriza Private Limited',
    primaryContact: '+91 91191 12999',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  });
});

app.use(async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Database connection failed.',
      error: err.message
    });
  }
});

/*
 * =========================================================
 * API ROUTES
 * =========================================================
 */

// Auth
app.use(
  '/api/v1/auth',
  require('./src/routes/authRoutes')
);

// Talent
app.use(
  '/api/v1/talent',
  require('./src/routes/talentRoutes')
);

// Leads
app.use(
  '/api/v1/leads',
  require('./src/routes/leadRoutes')
);

// Jobs
app.use(
  '/api/v1/jobs',
  require('./src/routes/jobRoutes')
);

// Admin
app.use(
  '/api/v1/admin',
  require('./src/routes/adminRoutes')
);

// Client Requirements
app.use(
  '/api/v1/requirements',
  require('./src/routes/requirementRoutes')
);

// Shortlists
app.use(
  '/api/v1/shortlists',
  require('./src/routes/shortlistRoutes')
);
app.use(
  '/api/v1/shortlist',
  require('./src/routes/shortlistRoutes')
);

// Interviews
app.use(
  '/api/v1/interviews',
  require('./src/routes/interviewRequestRoutes')
);

// Portfolios
app.use(
  '/api/v1/portfolios',
  require('./src/routes/portfolioRoutes')
);

// Case Studies
app.use(
  '/api/v1/case-studies',
  require('./src/routes/caseStudyRoutes')
);

// Pricing
app.use(
  '/api/v1/pricing',
  require('./src/routes/pricingRoutes')
);

// Companies
app.use(
  '/api/v1/companies',
  require('./src/routes/companyRoutes')
);

// Engagements
app.use(
  '/api/v1/engagements',
  require('./src/routes/engagementRoutes')
);

// Authors
app.use(
  '/api/v1/authors',
  require('./src/routes/authorRoutes')
);

// Articles
app.use(
  '/api/v1/articles',
  require('./src/routes/articleRoutes')
);

// Notifications
app.use(
  '/api/v1/notifications',
  require('./src/routes/notificationRoutes')
);

/*
 * =========================================================
 * 404 HANDLER
 * MUST COME AFTER ALL API ROUTES
 * =========================================================
 */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
    requestId: req.requestId
  });
});

/*
 * =========================================================
 * GLOBAL ERROR HANDLER
 * MUST BE LAST
 * =========================================================
 */

app.use((err, req, res, next) => {
  console.error('[API Error]', {
    requestId: req.requestId,
    method: req.method,
    path: req.originalUrl,
    message: err.message,
    stack:
      process.env.NODE_ENV !== 'production'
        ? err.stack
        : undefined
  });

  if (res.headersSent) {
    return next(err);
  }

  /*
   * CORS error
   */
  if (
    err.message ===
    'Origin is not allowed by CORS.'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Request origin is not allowed.',
      requestId: req.requestId
    });
  }

  /*
   * Invalid JSON
   */
  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    err.type === 'entity.parse.failed'
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON request body.',
      requestId: req.requestId
    });
  }

  /*
   * Request body too large
   */
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Request body is too large.',
      requestId: req.requestId
    });
  }

  /*
   * Generic server error
   */
  return res.status(500).json({
    success: false,
    message: 'Server Internal Error.',
    requestId: req.requestId
  });
});

/*
 * =========================================================
 * SERVER START
 * =========================================================
 */

let server;

const startServer = async () => {
  try {
    await connectDB();

    if (
      (process.env.TWO_FACTOR_MODE || 'static').toLowerCase() !== 'totp' &&
      process.env.NODE_ENV === 'production'
    ) {
      console.warn(
        '[Scrizians Backend] WARNING: static OTP 2FA is active in production. Switch to TWO_FACTOR_MODE=totp or email OTP before going live.'
      );
    }

    server = app.listen(
      PORT,
      () => {
        console.log(
          `[Scrizians Backend] Server running on port ${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      '[Scrizians Backend] Startup failed:',
      error.message
    );

    process.exit(1);
  }
};

/*
 * =========================================================
 * GRACEFUL SHUTDOWN
 * =========================================================
 */

const shutdown = (signal) => {
  console.log(
    `[Scrizians Backend] ${signal} received. Shutting down...`
  );

  if (!server) {
    process.exit(0);
    return;
  }

  server.close(() => {
    console.log(
      '[Scrizians Backend] HTTP server closed.'
    );

    process.exit(0);
  });

  setTimeout(() => {
    console.error(
      '[Scrizians Backend] Forced shutdown after timeout.'
    );

    process.exit(1);
  }, 10000).unref();
};

process.on(
  'SIGTERM',
  () => shutdown('SIGTERM')
);

process.on(
  'SIGINT',
  () => shutdown('SIGINT')
);

/*
 * =========================================================
 * START & EXPORT
 * =========================================================
 */

if (process.env.VERCEL !== '1') {
  startServer();
}

module.exports = app;