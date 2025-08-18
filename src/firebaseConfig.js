import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAnLmtlhOUUAbtRcOg64dXdCLbltv_iE4E",
  authDomain: "garden-c0b50.firebaseapp.com",
  databaseURL: "https://garden-c0b50.firebaseio.com",
  projectId: "garden-c0b50",
  storageBucket: "garden-c0b50.firebasestorage.app",
  messagingSenderId: "467344354997",
  appId: "1:467344354997:web:3c3397e0176060bb0c98fc"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);