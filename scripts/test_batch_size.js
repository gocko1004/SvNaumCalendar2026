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

const sendBatch = (messages) => {
    return new Promise((resolve) => {
        const data = JSON.stringify(messages);

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
            res.on('data', chunk => responseData += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: responseData
                });
            });
        });

        req.on('error', (e) => resolve({ error: e.message }));
        req.write(data);
        req.end();
    });
};

console.log("\n🧪  BATCH SIZE TESTER  🧪");
console.log("--------------------------------");
console.log("Hypothesis: Sending > 100 notifications at once crashes Expo.");
console.log("We will try to send 110 notifications in one request.");

rl.question('Admin Email: ', (email) => {
    rl.question('Admin Password: ', (password) => {
        auth.signInWithEmailAndPassword(email.trim(), password.trim())
            .then(async () => {
                console.log("Logged in. Getting ONE valid token...");

                const snapshot = await db.collection('pushTokens').limit(1).get();
                if (snapshot.empty) {
                    console.error("No tokens found!");
                    process.exit(1);
                }

                const validToken = snapshot.docs[0].data().token;
                console.log(`Using token: ${validToken}`);

                // Create a batch of 110 messages (Duplicates of the same token)
                console.log("Genering batch of 110 messages...");
                const messages = [];
                for (let i = 0; i < 110; i++) {
                    messages.push({
                        to: validToken,
                        title: `Batch Test ${i}`,
                        body: 'Testing batch limits',
                    });
                }

                console.log("Sending batch...");
                const result = await sendBatch(messages);

                console.log("\n--- RESULT ---");
                console.log(`Status Code: ${result.statusCode}`);
                console.log(`Response:`);
                console.log(result.body);

                if (result.statusCode !== 200 || result.body.includes("error")) {
                    console.log("\n✅ HYPOTHESIS CONFIRMED: Batch failed!");
                } else {
                    console.log("\n❌ HYPOTHESIS FAILED: Batch succeeded?");
                }

                process.exit(0);
            })
            .catch(err => {
                console.error(err);
                process.exit(1);
            });
    });
});
