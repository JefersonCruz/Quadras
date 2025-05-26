
const functions = require("firebase-functions");
const next = require("next");

// Ensure you have the correct region if not us-central1
// For example: functions.region('europe-west1').https.onRequest...
const region = "us-central1"; // Change if your Firebase project uses a different default region for functions

const dev = process.env.NODE_ENV !== "production";
// The `conf` object should point to your Next.js build output.
// The `../.next` path is relative to the `functions` directory.
const app = next({ dev, conf: { distDir: "../.next" } });
const handle = app.getRequestHandler();

exports.nextApp = functions.region(region).https.onRequest((req, res) => {
  console.log("File: " + req.originalUrl); // log the page.js file that is being requested
  return app.prepare().then(() => handle(req, res));
});
