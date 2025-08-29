import { db } from '../firebaseConfig';
import { collection, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { LGPD_CONSENT_VERSION, LGPD_PURPOSES, DATA_CATEGORIES } from '../constants/lgpd';

class LGPDService {
  constructor() {
    this.consentCollection = collection(db, 'user_consents');
    this.dataRequestsCollection = collection(db, 'data_requests');
  }

  async registerConsent(userId, purposes) {
    const consentDoc = doc(this.consentCollection, userId);
    const timestamp = new Date().toISOString();

    await setDoc(consentDoc, {
      version: LGPD_CONSENT_VERSION,
      purposes,
      timestamp,
      status: 'active'
    });
  }

  async requestDataDeletion(userId, categories = Object.values(DATA_CATEGORIES)) {
    const requestDoc = doc(this.dataRequestsCollection, userId);
    const timestamp = new Date().toISOString();

    await setDoc(requestDoc, {
      categories,
      timestamp,
      status: 'pending',
      type: 'deletion'
    });
  }

  async requestDataAccess(userId) {
    const requestDoc = doc(this.dataRequestsCollection, userId);
    const timestamp = new Date().toISOString();

    await setDoc(requestDoc, {
      timestamp,
      status: 'pending',
      type: 'access'
    });
  }

  async updateConsent(userId, purposes) {
    const consentDoc = doc(this.consentCollection, userId);
    const timestamp = new Date().toISOString();

    await updateDoc(consentDoc, {
      purposes,
      timestamp,
      status: 'active'
    });
  }

  async revokeConsent(userId) {
    const consentDoc = doc(this.consentCollection, userId);
    const timestamp = new Date().toISOString();

    await updateDoc(consentDoc, {
      status: 'revoked',
      revocationDate: timestamp
    });
  }

  async getConsentStatus(userId) {
    const consentDoc = doc(this.consentCollection, userId);
    const consentData = await getDoc(consentDoc);
    return consentData.exists() ? consentData.data() : null;
  }
}

export const lgpdService = new LGPDService();
