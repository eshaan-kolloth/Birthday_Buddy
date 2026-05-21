import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC00jRqsmnU6OI1fvQWldMO_cBdag79Fh4",
  authDomain: "birthdaybuddy-7ebac.firebaseapp.com",
  projectId: "birthdaybuddy-7ebac",
  storageBucket: "birthdaybuddy-7ebac.firebasestorage.app",
  messagingSenderId: "644507290316",
  appId: "1:644507290316:web:c4a72491f223c938b3d069",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
