// src/firebase.js

// 1. Import the necessary functions from the Firebase SDK
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 2. Your Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyBAUhK848xHLdwmy0rVd2s69G_auQCLq4U",
  authDomain: "bus-pass-d8cdf.firebaseapp.com",
  projectId: "bus-pass-d8cdf",
  storageBucket: "bus-pass-d8cdf.firebasestorage.app",  // ✅ CHANGED: Updated to correct bucket
  messagingSenderId: "753848152486",
  appId: "1:753848152486:web:51553a1e3df9cadd6b1f67"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);

// 4. Get references to the services you need
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// 5. Export
export { auth, db, storage };