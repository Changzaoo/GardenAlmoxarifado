import { db } from '../firebaseConfig';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { DATA_RETENTION_PERIODS } from '../constants/lgpd';
import { auditService } from './auditService';

class DataRetentionService {
  constructor() {
    this.collections = {
      emprestimos: collection(db, 'emprestimos'),
      funcionarios: collection(db, 'usuarios'),
      ferramentas: collection(db, 'inventario'),
      audit_logs: collection(db, 'audit_logs')
    };
  }

  async cleanupExpiredData() {
    const now = new Date();
    
    // Cleanup old loans
    const loanExpiryDate = new Date(now.getTime() - (DATA_RETENTION_PERIODS.LOANS * 24 * 60 * 60 * 1000));
    await this.cleanupCollection('emprestimos', 'dataDevolucao', loanExpiryDate);

    // Cleanup old employee records
    const employeeExpiryDate = new Date(now.getTime() - (DATA_RETENTION_PERIODS.EMPLOYEE_RECORDS * 24 * 60 * 60 * 1000));
    await this.cleanupCollection('funcionarios', 'dataDemissao', employeeExpiryDate);

    // Cleanup old tool history
    const toolExpiryDate = new Date(now.getTime() - (DATA_RETENTION_PERIODS.TOOL_HISTORY * 24 * 60 * 60 * 1000));
    await this.cleanupCollection('ferramentas', 'dataBaixa', toolExpiryDate);

    // Cleanup old audit logs
    const auditExpiryDate = new Date(now.getTime() - (DATA_RETENTION_PERIODS.AUDIT_LOGS * 24 * 60 * 60 * 1000));
    await this.cleanupCollection('audit_logs', 'timestamp', auditExpiryDate);
  }

  async cleanupCollection(collectionName, dateField, expiryDate) {
    const q = query(
      this.collections[collectionName],
      where(dateField, '<=', expiryDate.toISOString())
    );

    const snapshot = await getDocs(q);
    const deletedItems = [];

    for (const document of snapshot.docs) {
      await deleteDoc(doc(db, collectionName, document.id));
      deletedItems.push(document.id);
    }

    if (deletedItems.length > 0) {
      await auditService.logOperation({
        userId: 'system',
        operation: 'data_cleanup',
        category: 'data_retention',
        details: `Cleaned up ${deletedItems.length} expired records from ${collectionName}`,
        affectedItems: deletedItems
      });
    }

    return deletedItems.length;
  }

  async anonymizeEmployeeData(employeeId) {
    const employeeDoc = doc(db, 'usuarios', employeeId);
    const timestamp = new Date().toISOString();

    await updateDoc(employeeDoc, {
      nome: `ANONIMIZADO_${timestamp}`,
      email: `anonimizado_${timestamp}@redacted.com`,
      documento: 'REDACTED',
      telefone: 'REDACTED',
      status: 'inativo',
      dataAnonimizacao: timestamp
    });

    await auditService.logOperation({
      userId: 'system',
      operation: 'data_anonymization',
      category: 'data_privacy',
      details: 'Employee data anonymized as per request',
      affectedItems: [employeeId]
    });
  }
}

export const dataRetentionService = new DataRetentionService();
