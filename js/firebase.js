import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB",
  projectId: "YOUR_ID",
  storageBucket: "YOUR_BUCKET",
  messagingSenderId: "YOUR_SENDER",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);

export const db = getDatabase(app);
export const auth = getAuth(app);

import { auth, db } from "./firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { ref, onValue, push } from "firebase/database";

onAuthStateChanged(auth, (user) => {
  if (!user) return (window.location.href = "login.html");

  const uid = user.uid;

  // BALANCE
  onValue(ref(db, "users/" + uid + "/balance"), (snap) => {
    document.getElementById("balanceBox").innerText =
      "Balance: " + (snap.val() || 0) + " RWF";
  });
});
