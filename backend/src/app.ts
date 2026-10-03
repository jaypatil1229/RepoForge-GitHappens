import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import healthRoutes from './routes/health.routes';
import authRoutes from './routes/auth.routes';
import profileRoutes from './routes/profile.routes';
import organizationRoutes from './routes/organization.routes';
import credentialRoutes from './routes/credential.routes';
import consentRoutes from './routes/consent.routes';
import trustRoutes from './routes/trust.routes';
import verificationRoutes from './routes/verification.routes';
import auditRoutes from './routes/audit.routes';
import demoRoutes from './routes/demo.routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

const app: Express = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration restricted to authorized origins
const normalizeOrigin = (url?: string) => (url ? url.replace(/\/+$/, '').toLowerCase() : '');
const frontendClean = normalizeOrigin(env.FRONTEND_URL);
const frontendSecure = frontendClean.replace(/^http:\/\//, 'https://');
const frontendInsecure = frontendClean.replace(/^https:\/\//, 'http://');

const allowedOrigins = new Set(
  [
    frontendClean,
    frontendSecure,
    frontendInsecure,
    'https://cred-link-connect.vercel.app',
    'http://cred-link-connect.vercel.app',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
  ].filter(Boolean)
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const normalized = normalizeOrigin(origin);
      if (
        allowedOrigins.has(normalized) ||
        normalized.endsWith('.vercel.app') ||
        normalized.includes('vercel.app') ||
        normalized.includes('localhost') ||
        normalized.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
    exposedHeaders: ['Authorization'],
    maxAge: 86400,
  })
);

// Request logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/credentials', credentialRoutes);
app.use('/api/consents', consentRoutes);
app.use('/api/trust-registry', trustRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/demo', demoRoutes);

// Catch-all 404 handler
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
