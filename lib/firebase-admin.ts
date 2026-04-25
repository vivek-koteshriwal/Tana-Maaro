import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!admin.apps.length) {
        try {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                }),
            });
        } catch (error) {
            console.error('Firebase admin initialization error', error);
        }
    }
} else {
    console.warn("Firebase Admin credentials missing. Server-side Firebase operations will fail.");
}

const currentAdminApp = admin.apps[0];
const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;

export const adminAuth = currentAdminApp ? admin.auth() : null;
export const adminDb = currentAdminApp
    ? (databaseId ? getFirestore(currentAdminApp, databaseId) : getFirestore(currentAdminApp))
    : null;
export const FieldValue = admin.firestore.FieldValue;
export { admin };
