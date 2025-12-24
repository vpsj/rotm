const admin = require("firebase-admin");
const fs = require("fs");

// Load service account
const serviceAccount = require("./serviceAccountKey.json");

// Init Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Load links
const links = JSON.parse(fs.readFileSync("links.json", "utf8"));

async function main() {
  for (const url of links) {
    try {
      const res = await fetch(url + ".json");
      const json = await res.json();

      const post = json[0].data.children[0].data;
      const docId = post.id;

      await db.collection("videos").doc(docId).set({
        id: docId,
        title: post.title,
        redditUrl: "https://redd.it/" + docId,
        upvotes: post.ups,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      console.log("Saved:", post.title, post.ups);
    } catch (err) {
      console.error("Failed for", url, err.message);
    }
  }

  console.log("Done.");
  process.exit(0);
}

main();
