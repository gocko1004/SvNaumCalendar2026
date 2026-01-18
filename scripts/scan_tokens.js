const firebase = require('firebase/compat/app').default;
require('firebase/compat/auth');
require('firebase/compat/firestore');
const readline = require('readline');

// Config from src/firebase.ts
const firebaseConfig = {
    apiKey: "AIzaSyAGRl1kOe1ypzGhEfLTY-BIOGvYR_1iD70",
    authDomain: "svnaumcalendar.firebaseapp.com",
    projectId: "svnaumcalendar",
    storageBucket: "svnaumcalendar.firebasestorage.app",
    messagingSenderId: "46191164294",
    appId: "1:46191164294:web:1eb5dce072ee231f3d0a07",
    measurementId: "G-W87V472GVX"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("\n🔍  PUSH TOKEN SCANNER  🔍");
console.log("--------------------------------");
console.log("This script will find corrupted tokens (> 100 chars) that are crashing your app.");
console.log("You must enter your Admin Email and Password to scan the database.\n");

rl.question('Admin Email: ', (email) => {
    rl.question('Admin Password: ', (password) => {
        console.log("\nLogging in...");

        auth.signInWithEmailAndPassword(email.trim(), password.trim())
            .then(async () => {
                console.log("✅ Logged in successfully!");
                console.log("scanning 'pushTokens' collection...\n");

                const snapshot = await db.collection('pushTokens').get();
                console.log(`Found ${snapshot.size} total tokens. Checking for errors...\n`);

                let badCount = 0;

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const token = data.token;

                    if (!token) {
                        console.log(`❌ [EMPTY TOKEN] Doc ID: ${doc.id}`);
                        badCount++;
                    } else if (typeof token !== 'string') {
                        console.log(`❌ [INVALID TYPE] Doc ID: ${doc.id} (Type: ${typeof token})`);
                        badCount++;
                    } else if (token.length > 100) {
                        console.log(`❌ [BAD TOKEN FOUND]`);
                        console.log(`   ID:     ${doc.id}`);
                        console.log(`   Length: ${token.length} chars`);
                        console.log(`   Value:  ${token.substring(0, 50)}...`);
                        console.log("   ------------------------------------------------");
                        badCount++;
                    }
                });

                if (badCount === 0) {
                    console.log("✅ All tokens are clean! No tokens > 100 chars found.");
                } else {
                    console.log(`\n🚨 FOUND ${badCount} BAD TOKENS.`);
                    console.log("Please go to Firebase Console -> Firestore -> pushTokens and DELETE these documents.");
                }

                process.exit(0);
            })
            .catch(error => {
                console.error("\n❌ Login Failed:", error.message);
                process.exit(1);
            });
    });
});
