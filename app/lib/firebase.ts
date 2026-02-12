import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBxVEeaKVlFlFOW6Qtb07LqoylF30vUsS8",
  authDomain: "couple-planner2026.firebaseapp.com",
  projectId: "couple-planner2026",
  storageBucket: "couple-planner2026.firebasestorage.app",
  messagingSenderId: "198001056323",
  appId: "1:198001056323:web:48acc7da697c91553a92f6",
  measurementId: "G-FELSDLFT4G"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
