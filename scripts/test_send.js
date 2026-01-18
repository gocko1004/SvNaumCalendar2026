const firebase = require('firebase/compat/app').default;
require('firebase/compat/auth');
require('firebase/compat/firestore');
const readline = require('readline');
const https = require('https');

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

const sendExpoNotification = (token) => {
    return new Promise((resolve) => {
        const message = {
            to: token,
            sound: 'default',
            title: 'Test Notification',
            body: 'This is a test to find the corrupted token.',
            priority: 'high',
            channelId: 'urgent-updates'
        };

        const data = JSON.stringify([message]);

        const options = {
            hostname: 'exp.host',
            path: '/--/api/v2/push/send',
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const json = JSON.parse(responseData);
                    if (res.statusCode !== 200) {
                        resolve({ success: false, error: responseData });
                    } else if (json.data && json.data[0].status === 'error') {
                        resolve({ success: false, error: json.data[0].message });
                    } else {
                        resolve({ success: true });
                    }
                } catch (e) {
                    resolve({ success: false, error: 'Invalid JSON response' });
                }
            });
        });

        req.on('error', (e) => {
            resolve({ success: false, error: e.message });
        });

        req.write(data);
        req.end();
    });
};

console.log("\n🚀  NOTIFICATION TESTER  🚀");
console.log("--------------------------------");
console.log("This script will attempt to send a REAL notification to EVERY token.");
console.log("This will find the EXACT token that causes the error.");

rl.question('Admin Email: ', (email) => {
    rl.question('Admin Password: ', (password) => {
        console.log("\nLogging in...");

        auth.signInWithEmailAndPassword(email.trim(), password.trim())
            .then(async () => {
                console.log("✅ Logged in!");
                console.log("Reading tokens...\n");

                const snapshot = await db.collection('pushTokens').get();
                console.log(`Found ${snapshot.size} tokens. Testing them one by one...\n`);

                let failureCount = 0;
                let successCount = 0;

                // Convert to array to use async/await loop
                const docs = [];
                snapshot.forEach(doc => docs.push(doc));

                for (const doc of docs) {
                    const token = doc.data().token;
                    if (!token) continue;

                    process.stdout.write(`Testing ID ${doc.id.substring(0, 10)}... `);

                    const result = await sendExpoNotification(token);

                    if (result.success) {
                        console.log("✅ OK");
                        successCount++;
                    } else {
                        console.log("\n❌ FAILED!");
                        console.log(`   ID:    ${doc.id}`);
                        console.log(`   Token: ${token}`);
                        console.log(`   Error: ${result.error}`);
                        console.log("   --------------------------------");
                        failureCount++;
                    }

                    // Small delay to be nice to the API
                    await new Promise(r => setTimeout(r, 100));
                }

                console.log(`\n\nFinished! Success: ${successCount}, Failures: ${failureCount}`);
                if (failureCount > 0) {
                    console.log("👉 Please DELETE the documents that failed above.");
                } else {
                    console.log("✅ All tokens accepted. The issue might be in the app code payload.");
                }

                process.exit(0);
            })
            .catch(error => {
                console.error("\n❌ Login Failed:", error.message);
                process.exit(1);
            });
    });
});
