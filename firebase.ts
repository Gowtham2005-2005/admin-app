import { initializeApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { 
  getFirestore, Firestore, collection, getDocs, onSnapshot, 
  getDoc, where, query, updateDoc, doc 
} from "firebase/firestore";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Export initialized Firebase services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Export Firestore utilities
export { collection, getDocs, onSnapshot, updateDoc, doc, getDoc, where, query };
