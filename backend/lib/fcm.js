// lib/fcm.js
const admin = require("firebase-admin");

// 1) If you’ve set FCM_SA_JSON in Render (or .env) to the literal contents
//    of your service-account JSON, parse it and use that:
let credential;
if (process.env.FCM_SA_JSON) {
  let svc;
  try {
    svc = JSON.parse(process.env.FCM_SA_JSON);
  } catch (err) {
    console.error("❌ FCM_SA_JSON was not valid JSON!", err);
    process.exit(1);
  }
  credential = admin.credential.cert(svc);

// 2) Otherwise, let the SDK fall back to ADC (i.e. GOOGLE_APPLICATION_CREDENTIALS)
} else {
  credential = admin.credential.applicationDefault();
}

admin.initializeApp({ credential });

module.exports = admin;
