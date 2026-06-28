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
export async function loginUser(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    alert("Login Success");

    console.log(userCredential.user);

    window.location.replace("./dashboard.html");

  } catch (error) {
    alert(error.code + "\n" + error.message);
    console.error(error);
  }
}
