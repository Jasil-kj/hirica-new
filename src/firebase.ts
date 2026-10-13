import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDDNBvf8Vj0YCCDiCpm6H3MF_97OrZk2X0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hirica-5827f.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hirica-5827f",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hirica-5827f.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1054454629108",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1054454629108:web:119949ce848d3a5e2114a1",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0N9QDTD60H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log('Firebase initialized successfully with direct config');

export { auth, db, storage, analytics };
export default app;