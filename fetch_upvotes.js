const admin = require("firebase-admin");
const fs = require("fs");
const snoowrap = require("snoowrap");

const reddit = new snoowrap({
  userAgent: process.env.REDDIT_USER_AGENT,
  clientId: process.env.REDDIT_CLIENT_ID,
  clientSecret: process.env.REDDIT_CLIENT_SECRET,
  username: process.env.REDDIT_USERNAME,
  password: process.env.REDDIT_PASSWORD
});

// ---- Firebase Admin via ENV (GitHub Actions safe) ----
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
  })
});

const db = admin.firestore();

// ---- Load links ----
const links = JSON.parse(fs.readFileSync("links.json", "utf8"));

async function main() {
  for (const url of links) {
    try {
      const res = await fetch(url + ".json");
      const json = await res.json();

      const post = json[0].data.children[0].data;
      const docId = post.id;

      await db.collection("videos").doc(docId).set(
        {
          id: docId,
          title: post.title,
          redditUrl: "https://redd.it/" + docId,
          upvotes: post.ups,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      console.log("Saved:", post.title, post.ups);
    } catch (err) {
      console.error("Failed for", url, err.message);
    }
  }

  console.log("Done.");
}

function extractPostId(url) {
  const match = url.match(/comments\/([a-z0-9]+)\//i);
  return match ? match[1] : null;
}

async function main() {
  const me = await reddit.getMe();
  console.log("Logged in as:", me.name);

  for (const url of links) {
    try {
      const postId = extractPostId(url);

      if (!postId) {
        console.log("Could not extract ID from:", url);
        continue;
      }

      const post = await reddit.getSubmission(postId).fetch();

      await db.collection("videos").doc(postId).set(
        {
          id: postId,
          title: post.title,
          redditUrl: url,
          upvotes: post.score,
          author: post.author?.name || "unknown",
          thumbnail: post.thumbnail,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      console.log(
        "Saved:",
        post.title,
        "| Upvotes:",
        post.score
      );

    } catch (err) {
      console.error("Failed:", url);
      console.error(err.message);
    }
  }

  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
