import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

class AuditService {
  constructor() {
    this.auditCollection = collection(db, 'audit_logs');
  }

  async logOperation({
    userId,
    operation,
    category,
    details,
    affectedItems,
    ipAddress,
    status = 'success'
  }) {
    const timestamp = new Date().toISOString();
    
    await addDoc(this.auditCollection, {
      userId,
      operation,
      category,
      details,
      affectedItems,
      ipAddress,
      status,
      timestamp,
      version: '1.0'
    });
  }

  async getOperationLogs(filters = {}) {
    const constraints = [];

    if (filters.userId) {
      constraints.push(where('userId', '==', filters.userId));
    }
    if (filters.category) {
      constraints.push(where('category', '==', filters.category));
    }
    if (filters.operation) {
      constraints.push(where('operation', '==', filters.operation));
    }
    if (filters.startDate) {
      constraints.push(where('timestamp', '>=', filters.startDate));
    }
    if (filters.endDate) {
      constraints.push(where('timestamp', '<=', filters.endDate));
    }

    const q = query(this.auditCollection, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  async getItemHistory(itemId) {
    const q = query(
      this.auditCollection,
      where('affectedItems', 'array-contains', itemId)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}

export const auditService = new AuditService();
