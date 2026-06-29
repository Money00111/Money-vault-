// js/auth.js

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ===============================
// 🟢 REGISTER USER
// ===============================

export async function registerUser(fullName, phone, email, password, referralCode) {
  try {

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const uid = user.uid;

    await set(ref(db, "users/" + uid), {
      fullName,
      phone,
      email,
      balance: 500,
      vipLevel: 0,
      referralCode: uid.slice(0, 6),
      referredBy: referralCode || null,
      createdAt: Date.now()
    });

    alert("Account created successfully!");
    return true;

  } catch (error) {
    console.log(error);
    alert(error.message);
    return false;
  }
}

// ===============================
// 🔵 LOGIN USER
// ===============================
export async function loginUser(email, password) {
  try {

    await signInWithEmailAndPassword(auth, email, password);

    alert("Login successful!");

    window.location.href = "dashboard.html";

  } catch (error) {
    alert(error.message);
  }
}


// ===============================
// 🔴 LOGOUT
// ===============================
export async function logoutUser() {
  await signOut(auth);
  window.location.href = "login.html";
}


// ===============================
// 🟡 RESET PASSWORD
// ===============================
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent!");
  } catch (error) {
    alert(error.message);
  }
}
