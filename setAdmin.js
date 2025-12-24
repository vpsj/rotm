const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uid = "h2lasa3xrcT3MWW0FKeiQqta6f42";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log("✅ Admin claim set successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error setting admin claim:", error);
    process.exit(1);
  });
