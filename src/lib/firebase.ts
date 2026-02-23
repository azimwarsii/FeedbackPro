import { initializeApp, getApps } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAhED8RYsea-IUHa_--26GJFU39VX6Ph1g",
    authDomain: "feedbackpro-b609a.firebaseapp.com",
    projectId: "feedbackpro-b609a",
    storageBucket: "feedbackpro-b609a.firebasestorage.app",
    messagingSenderId: "504480544165",
    appId: "1:504480544165:web:2518f9f3908d1a2e49a44c",
};

// Initialize Firebase (prevent duplicate initialization)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Storage instance
export const storage = getStorage(app);

export default app;
