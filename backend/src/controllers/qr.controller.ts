import { Response, NextFunction } from 'express';
import { qrService } from '../services/qr.service';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { ApiResponse } from '../types/index';

export class QrController {
  /**
   * POST /api/qr/consent/:id/generate
   * Generate a QR code for a consent request.
   * Used by verifier organization to show QR to citizen.
   */
  async generateConsentQr(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication context missing',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const consentId = req.params.id as string;
      const result = await qrService.generateConsentQr(req.user, consentId);

      const response: ApiResponse = {
        success: true,
        message: 'QR code generated successfully',
        data: {
          qrDataUrl: result.qrDataUrl,
          payload: result.payload,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/qr/credential/:id/generate
   * Generate a QR code for a credential.
   * Used by credential subject or issuing organization.
   */
  async generateCredentialQr(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication context missing',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const credentialId = req.params.id as string;
      const result = await qrService.generateCredentialQr(req.user, credentialId);

      const response: ApiResponse = {
        success: true,
        message: 'Credential QR code generated successfully',
        data: {
          qrDataUrl: result.qrDataUrl,
          payload: result.payload,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/qr/resolve
   * Resolve a scanned QR payload. The citizen sends the raw scanned string.
   * Backend validates, parses, and returns the associated resource details.
   */
  async resolve(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication context missing',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const { payload: rawPayload } = req.body;

      if (typeof rawPayload !== 'string' || !rawPayload.trim()) {
        res.status(400).json({
          success: false,
          error: 'Missing or invalid QR payload string',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Parse and validate the payload (treats input as untrusted)
      const parsed = qrService.parsePayload(rawPayload);

      let data: unknown;

      if (parsed.type === 'consent_request') {
        data = await qrService.resolveConsentQr(req.user, parsed);
      } else if (parsed.type === 'credential') {
        // For credential type, just return the payload info — actual credential
        // access requires separate consent-based API calls
        data = {
          type: 'credential',
          credentialId: parsed.id,
          message: 'Use the credentials API to access this credential with proper consent.',
        };
      } else {
        res.status(400).json({
          success: false,
          error: `Unsupported QR payload type: ${parsed.type}`,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        message: 'QR code resolved successfully',
        data: {
          ...data as object,
          qrType: parsed.type,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
}

export const qrController = new QrController();
