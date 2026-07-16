// ===============================
// Money Vault Pro
// File: js/auth.js
// PART 1 - REGISTER
// ===============================

import { auth, db } from "./firebase.js";

import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  ref,
  set,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// REGISTER USER
// ======================================

export async function registerUser(
  fullName,
  phone,
  email,
  password,
  referralCode
  address: "",
  country: "Rwanda",
  photoURL: "",
  
) {

  try {

    // Create Firebase Auth Account
    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

    const user = userCredential.user;

    // Registration Bonus
    const registrationBonus = 500;

    // Generate Referral Code
    const myReferralCode =
      "MV" + user.uid.substring(0, 6).toUpperCase();

    // Save User
    await set(ref(db, "users/" + user.uid), {

      uid: user.uid,

      fullName: fullName,

      phone: phone,

      email: email,

      balance: registrationBonus,

      bonus: registrationBonus,

      totalDeposit: 0,

      totalWithdraw: 0,
      
      totalTransactions: 0,
      
      totalEarnings: registrationBonus,

      vip: "VIP 0",
      vipActive: false,
      
      referralCode: myReferralCode,

      referredBy: "",

      referralBonus: 0,

      referralCount: 0,

      createdAt: Date.now()

    });


    // ==========================
    // Referral (Option B)
    // ==========================

    if (referralCode !== "") {

      const usersRef = ref(db, "users");

      const snapshot = await get(usersRef);

      if (snapshot.exists()) {

        snapshot.forEach((child) => {

          const data = child.val();

          if (data.referralCode === referralCode) {

            update(
              ref(db, "users/" + user.uid),
              {
                referredBy: child.key

                referralCount
                referralBonus
                balance
              }
            );

          }

        });

      }

    }

    alert("Registration Successful!\n\n500 RWF Bonus Added.");

    return true;

  }

  catch (error) {

    alert(error.message);

    return false;

  }

      }

// ======================================
// LOGIN USER
// ======================================

const credential = await signInWithEmailAndPassword(auth, email, password);

window.location.href = "dashboard.html";
export async function loginUser(email, password) {

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    alert("Login Successful!");

    window.location.href = "dashboard.html";

  } catch (error) {

    alert(error.message);

    return false;

  }

}



// ======================================
// LOGOUT USER
// ======================================

export async function logoutUser() {

  try {

    await signOut(auth);

    window.location.href = "login.html";

  } catch (error) {

    alert(error.message);

  }

}



// ======================================
// RESET PASSWORD
// ======================================

export async function resetPassword(email) {

  try {

    await sendPasswordResetEmail(auth, email);

    alert("Password reset email sent successfully.");

  } catch (error) {

    alert(error.message);

  }

      }
