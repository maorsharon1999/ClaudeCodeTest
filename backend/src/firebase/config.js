const admin = require("firebase-admin");

// IMPORTANT: Please create a serviceAccountKey.json file in this same directory
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://your-project-id.firebaseio.com", // Replace with your project ID
});

module.exports = admin;
