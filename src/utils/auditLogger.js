import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { SecurityUtils } from './security';

export class AuditLogger {
  static async log(action, userId, details) {
    try {
      const sanitizedDetails = this.sanitizeLogDetails(details);
      
      const logEntry = {
        timestamp: Date.now(),
        action: action,
        userId: userId,
        details: sanitizedDetails,
        userAgent: navigator.userAgent,
        ip: await this.getClientIP(),
        sessionId: SecurityUtils.generateSecureToken(16)
      };

      await addDoc(collection(db, 'audit_logs'), logEntry);
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - logging should not interrupt main flow
    }
  }

  static sanitizeLogDetails(details) {
    const sensitiveFields = ['password', 'token', 'secret', 'credential'];
    
    return JSON.parse(JSON.stringify(details), (key, value) => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        return '[REDACTED]';
      }
      return value;
    });
  }

  static async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  // Métodos específicos para diferentes tipos de eventos
  static async logLogin(userId, success, failureReason = null) {
    await this.log('LOGIN', userId, {
      success,
      failureReason,
      timestamp: new Date().toISOString()
    });
  }

  static async logDataAccess(userId, collection, documentId, action) {
    await this.log('DATA_ACCESS', userId, {
      collection,
      documentId,
      action,
      timestamp: new Date().toISOString()
    });
  }

  static async logSecurityEvent(userId, eventType, details) {
    await this.log('SECURITY', userId, {
      eventType,
      details,
      timestamp: new Date().toISOString()
    });
  }

  static async logAdminAction(userId, action, target, changes) {
    await this.log('ADMIN', userId, {
      action,
      target,
      changes,
      timestamp: new Date().toISOString()
    });
  }
}
