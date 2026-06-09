import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  writeBatch 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC6IXCk6EXm0ndord8Is6cRZf_mG2MY5UM",
  authDomain: "kedinasan-d9051.firebaseapp.com",
  projectId: "kedinasan-d9051",
  storageBucket: "kedinasan-d9051.firebasestorage.app",
  messagingSenderId: "488517479224",
  appId: "1:488517479224:web:57ed244cf69e2a010c6fcd"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Determine App ID robustly in AI Studio environment
let resolvedAppId = 'DataBaseSekolah-App';
// @ts-ignore
if (typeof window !== 'undefined' && window.__app_id) {
  // @ts-ignore
  resolvedAppId = window.__app_id;
  // @ts-ignore
} else if (typeof __app_id !== 'undefined') {
  // @ts-ignore
  resolvedAppId = __app_id;
}
export const APP_ID = resolvedAppId;
export const COLLECTION_NAME = "DataBaseSekolah";

export const getDbCollectionPath = () => {
    return collection(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME);
};

export const getDbDocPath = (docId: string) => {
    return doc(db, 'artifacts', APP_ID, 'public', 'data', COLLECTION_NAME, docId);
};

export { 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  writeBatch 
};
