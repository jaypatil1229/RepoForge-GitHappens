import { Router } from 'express';
import { qrController } from '../controllers/qr.controller';
import { authenticateUser } from '../middleware/authMiddleware';

const router = Router();

// All QR endpoints require authentication
router.use(authenticateUser);

// Generate QR code for a consent request (verifier → citizen)
router.post('/consent/:id/generate', (req, res, next) => qrController.generateConsentQr(req, res, next));

// Generate QR code for a credential (subject or issuer)
router.post('/credential/:id/generate', (req, res, next) => qrController.generateCredentialQr(req, res, next));

// Resolve scanned QR payload (citizen scans → backend validates → returns details)
router.post('/resolve', (req, res, next) => qrController.resolve(req, res, next));

export default router;
