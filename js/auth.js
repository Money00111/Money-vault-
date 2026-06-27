import { auth, db } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import { ref, set } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ================= REGISTER =================
export function registerUser(email, password, name, phone, referral) {

  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {

      const user = userCredential.user;

      // Create user wallet in database
      set(ref(db, "users/" + user.uid), {
        name: name,
        email: email,
        phone: phone,
        balance: 0,
        referralCode: user.uid.slice(0, 6),
        referredBy: referral || null,
        createdAt: Date.now()
      });

      alert("Account created successfully!");
      window.location.href = "login.html";

    })
    .catch((error) => {
      alert(error.message);
    });
  }
