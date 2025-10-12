import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { encryptData, decryptData } from '../utils/crypto';

class LegalDocumentService {
  constructor() {
    this.termsCollection = collection(db, 'legal_documents');
    this.signaturesCollection = collection(db, 'document_signatures');
  }

  async createTermOfResponsibility(userId, items, deadline) {
    const timestamp = new Date().toISOString();
    const termId = `term_${userId}_${timestamp}`;
    const termDoc = doc(this.termsCollection, termId);

    const encryptedItems = encryptData(JSON.stringify(items));

    await setDoc(termDoc, {
      userId,
      type: 'responsibility',
      items: encryptedItems,
      deadline,
      status: 'pending',
      createdAt: timestamp,
      version: '1.0'
    });

    return termId;
  }

  async signDocument(termId, userId, signature) {
    const signatureDoc = doc(this.signaturesCollection, `${termId}_${userId}`);
    const timestamp = new Date().toISOString();

    const encryptedSignature = encryptData(signature);

    await setDoc(signatureDoc, {
      termId,
      userId,
      signature: encryptedSignature,
      timestamp,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent
    });

    const termDoc = doc(this.termsCollection, termId);
    await updateDoc(termDoc, {
      status: 'signed',
      signedAt: timestamp
    });
  }

  async getDocumentWithSignature(termId) {
    const termDoc = doc(this.termsCollection, termId);
    const termData = await getDoc(termDoc);

    if (!termData.exists()) {
      throw new Error('Document not found');
    }

    const data = termData.data();
    data.items = JSON.parse(decryptData(data.items));

    const signatureDoc = await getDoc(doc(this.signaturesCollection, `${termId}_${data.userId}`));
    if (signatureDoc.exists()) {
      data.signature = decryptData(signatureDoc.data().signature);
    }

    return data;
  }

  async getClientIP() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  }
}

export const legalDocumentService = new LegalDocumentService();
