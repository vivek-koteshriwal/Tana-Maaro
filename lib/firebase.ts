import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Only initialize Firebase if we have a real API key to prevent console errors in Dev
const hasValidConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

let app: FirebaseApp | undefined;
if (hasValidConfig) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;

export const auth = app ? getAuth(app) : null;
export const db = app
    ? (databaseId ? getFirestore(app, databaseId) : getFirestore(app))
    : null;
export const storage = app ? getStorage(app) : null;

// Analytics (only on client side, if valid config, and in production)
let analytics;
if (typeof window !== "undefined" && hasValidConfig && process.env.NODE_ENV === "production") {
    import("firebase/analytics").then(({ getAnalytics, isSupported }) => {
        isSupported().then((yes) => {
            try {
                if (yes) analytics = getAnalytics(app);
            } catch (e) {
                console.warn("Firebase Analytics failed to initialize", e);
            }
        }).catch(() => {});
    }).catch(() => {});
}
export { analytics };
