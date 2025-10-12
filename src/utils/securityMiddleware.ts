import { SecurityUtils } from './security';
import { AuditLogger } from './auditLogger';
import { SECURITY_CONFIG } from '../config/security';

export class SecurityMiddleware {
  static async verifyRequest(req, res, next) {
    try {
      // Verify authentication
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new Error('No authentication token');
      }

      const userId = SecurityUtils.validateSessionToken(token);
      if (!userId) {
        throw new Error('Invalid or expired token');
      }

      // Check rate limits
      if (!SecurityUtils.checkRateLimit(userId)) {
        await AuditLogger.logSecurityEvent(userId, 'RATE_LIMIT_EXCEEDED', {
          endpoint: req.path,
          method: req.method
        });
        throw new Error('Rate limit exceeded');
      }

      // Add security headers
      Object.entries(SECURITY_CONFIG.headers).forEach(([header, value]) => {
        res.setHeader(header, value);
      });

      // Sanitize input
      if (req.body) {
        req.sanitizedBody = this.deepSanitize(req.body);
      }
      if (req.query) {
        req.sanitizedQuery = this.deepSanitize(req.query);
      }

      // Add request context
      req.securityContext = {
        userId,
        timestamp: Date.now()
      };

      // Log access
      await AuditLogger.logDataAccess(userId, 'API_ACCESS', req.path, req.method);

      next();
    } catch (error) {
      res.status(401).json({
        error: 'Unauthorized',
        message: error.message
      });
    }
  }

  static deepSanitize(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return SecurityUtils.sanitizeInput(obj);
    }

    return Object.entries(obj).reduce((acc, [key, value]) => {
      acc[SecurityUtils.sanitizeInput(key)] = this.deepSanitize(value);
      return acc;
    }, Array.isArray(obj) ? [] : {});
  }

  static async validatePermissions(requiredLevel) {
    return async (req, res, next) => {
      try {
        const { userId } = req.securityContext;
        
        // Check user permissions
        const userDoc = await db.collection('usuarios').doc(userId).get();
        const userLevel = userDoc.data()?.nivel || 0;

        if (userLevel < requiredLevel) {
          await AuditLogger.logSecurityEvent(userId, 'PERMISSION_DENIED', {
            requiredLevel,
            userLevel,
            endpoint: req.path
          });
          throw new Error('Insufficient permissions');
        }

        next();
      } catch (error) {
        res.status(403).json({
          error: 'Forbidden',
          message: error.message
        });
      }
    };
  }

  static validateInputs(schema) {
    return async (req, res, next) => {
      try {
        // Deep clone and sanitize input
        const sanitizedBody = this.deepSanitize(req.body);
        
        // Validate against schema
        await schema.validate(sanitizedBody);
        
        // If validation passes, attach sanitized body
        req.validatedBody = sanitizedBody;
        
        next();
      } catch (error) {
        res.status(400).json({
          error: 'Invalid Input',
          message: error.message
        });
      }
    };
  }
}
