// import admin from "firebase-admin";
// import fs from "fs";
// import path from "path";
// import { fileURLToPath } from "url";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // ✅ absolute path to JSON
// const serviceAccountPath = path.join(
//   __dirname,
//   "serviceAccountKey.json"
// );

// const serviceAccount = JSON.parse(
//   fs.readFileSync(serviceAccountPath, "utf8")
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });
// console.log(admin.credential);

// // const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
// // admin.initializeApp({
// //   credential: admin.credential.cert(serviceAccount),
// // });

// export default admin;
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let serviceAccount;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Render/Production
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  // Local Development
  const serviceAccountPath = path.join(__dirname, "serviceAccountKey.json");
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
