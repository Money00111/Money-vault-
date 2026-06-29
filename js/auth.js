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

    // 🎁 Registration bonus
    const registrationBonus = 500;

    // Create user in database
    await set(ref(db, "users/" + uid), {
      fullName: fullName,
      phone: phone,
      email: email,
      balance: registrationBonus,
      totalDeposit: 0,
      totalWithdraw: 0,
      totalEarnings: registrationBonus,
      vipLevel: 0,
      vipActive: false,
      referralCode: uid.slice(0, 6),
      referredBy: referralCode || null,
      referralBonus: 0,
      referralCount: 0,
      createdAt: Date.now()
    });

    // 👥 Save pending referral (Option B logic)
    if (referralCode && referralCode !== "") {

      const refUsers = await get(ref(db, "users"));
      let referrerUid = null;

      refUsers.forEach((snap) => {
        if (snap.val().referralCode === referralCode) {
          referrerUid = snap.key;
        }
      });

      if (referrerUid) {
        await update(ref(db, "users/" + uid), {
          referredBy: referrerUid
        });
      }
    }

    alert("Account created successfully! +500 RWF bonus added.");

    return true;

  } catch (error) {
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
