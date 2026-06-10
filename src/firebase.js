import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD-9zZzfheMpd71Tn74oTyKTeCld_-RBU4",
  authDomain: "al-driven-crime-anal-lbbcplfo.firebaseapp.com",
  projectId: "al-driven-crime-anal-lbbcplfo",
  storageBucket: "al-driven-crime-anal-lbbcplfo.firebasestorage.app",
  messagingSenderId: "258283061207",
  appId: "1:258283061207:web:a6eb1b4ce09b050c0ad592",
  measurementId: "G-G9Q9JRJS5E"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore Database
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

export default app;
