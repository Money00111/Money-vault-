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


// ================= LOGIN =================
export function loginUser(email, password) {

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {

      console.log("LOGIN SUCCESS:", userCredential.user.email);

      window.location.href = "dashboard.html";

    })
    .catch((error) => {

      console.log("LOGIN ERROR:", error.code, error.message);

      alert("Login failed: " + error.message);

    });
          }
