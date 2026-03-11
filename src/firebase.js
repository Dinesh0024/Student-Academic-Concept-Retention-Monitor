// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyD17fHx-vsxSYnDaV0iAATbejCDTsYWBu8",
    authDomain: "academic-cac6d.firebaseapp.com",
    projectId: "academic-cac6d",
    storageBucket: "academic-cac6d.firebasestorage.app",
    messagingSenderId: "597185950649",
    appId: "1:597185950649:web:e29a12b80ed6a150233c68",
    measurementId: "G-LHEHRHY50B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);

export { auth, analytics, googleProvider, db };
export default app;
