import { auth, db } from "./firebase.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  ref,
  onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// 🔐 AUTH GUARD
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const uid = user.uid;

  // USER DATA
  const userRef = ref(db, "users/" + uid);

  onValue(userRef, (snapshot) => {

    const data = snapshot.val();

    if (data) {
      document.getElementById("username").innerText = data.name;
      document.getElementById("balance").innerText = data.balance + " RWF";
      document.getElementById("refCode").innerText = data.referralCode;
    }

  });

});

document.getElementById("logoutBtn").addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "login.html";
  });
});
