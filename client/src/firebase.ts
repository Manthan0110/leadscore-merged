// client/src/firebase.ts
// modular Firebase v9+ API
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA-DPQiznxwhRKSl-OI7vEViabO8I7KyTE",
  authDomain: "leadscore-merged.firebaseapp.com",
  projectId: "leadscore-merged",
  storageBucket: "leadscore-merged.firebasestorage.app",
  messagingSenderId: "877661634087",
  appId: "1:877661634087:web:cfcb639f31ad01475dd802",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
