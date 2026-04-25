/**
 * One-time script to create the admin user in Firestore.
 *
 * Usage:
 *   node scripts/create-admin.js
 *
 * Prerequisites:
 *   - Set FIREBASE_SERVICE_ACCOUNT_KEY in your .env.local (path to service account JSON)
 *     OR place the service account JSON at the project root as serviceAccountKey.json
 *   - npm install (bcryptjs and firebase-admin must be installed)
 *
 * What it does:
 *   1. Hashes the password with bcrypt
 *   2. Creates a user document in Firestore `users` collection with role: "admin"
 *   3. Creates the username lookup in `usernames` collection
 *
 * After running, log in at /admin-login with the credentials below.
 */

require("dotenv").config({ path: ".env.local" });

const admin = require("firebase-admin");
const bcrypt = require("bcryptjs");

// ── CONFIGURE THESE ──────────────────────────────────────────────────────────
const ADMIN_EMAIL    = "admin@tanamaaro.com";
const ADMIN_PASSWORD = "ChangeThisPassword123!";   // Change before running
const ADMIN_NAME     = "Admin";
const ADMIN_USERNAME = "admin";
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
    // Initialize Firebase Admin using env vars (same as the app)
    if (!admin.apps.length) {
        const projectId   = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        const privateKey  = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

        if (!projectId || !clientEmail || !privateKey) {
            console.error(
                "❌  Missing Firebase credentials in .env.local\n" +
                "    Required: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY\n"
            );
            process.exit(1);
        }

        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
    }

    const databaseId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "(default)";
    const db = admin.firestore();
    db.settings({ databaseId });

    // Check if admin already exists
    const existing = await db
        .collection("users")
        .where("email", "==", ADMIN_EMAIL)
        .limit(1)
        .get();

    if (!existing.empty) {
        const doc = existing.docs[0];
        if (doc.data().role === "admin") {
            console.log("✅  Admin user already exists. Nothing to do.");
            process.exit(0);
        }
        // Upgrade existing user to admin
        await doc.ref.update({ role: "admin" });
        console.log(`✅  Existing user ${ADMIN_EMAIL} promoted to admin.`);
        process.exit(0);
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // Generate a new Firestore document ID
    const userRef = db.collection("users").doc();
    const uid = userRef.id;

    const userData = {
        id: uid,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        username: ADMIN_USERNAME,
        passwordHash,
        role: "admin",
        status: "active",
        profileImage: "",
        city: "",
        followerCount: 0,
        followingCount: 0,
        postsCount: 0,
        likesCount: 0,
        showRealName: true,
        usernameChangeCount: 0,
        lastUsernameChange: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Batch write: user doc + username lookup
    const batch = db.batch();
    batch.set(userRef, userData);
    batch.set(db.collection("usernames").doc(ADMIN_USERNAME), { uid });
    await batch.commit();

    console.log("✅  Admin user created successfully!");
    console.log(`    Email:    ${ADMIN_EMAIL}`);
    console.log(`    Password: ${ADMIN_PASSWORD}`);
    console.log(`    UID:      ${uid}`);
    console.log("\n⚠️   Remember to change the password after first login.");
    process.exit(0);
}

main().catch((err) => {
    console.error("❌  Script failed:", err);
    process.exit(1);
});
