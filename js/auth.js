// ======================================
// auth.js - PART 1
// REGISTER USER
// ======================================

import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    onAuthStateChanged
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
) {

    try {

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;

        const registrationBonus = 500;

        const myReferralCode =
            "MV" +
            user.uid.substring(0, 6).toUpperCase();

        await set(ref(db, "users/" + user.uid), {

            uid: user.uid,

            fullName: fullName,

            phone: phone,

            email: email,

            balance: registrationBonus,

            bonus: registrationBonus,

            referralBonus: 0,

            totalDeposit: 0,

            totalWithdraw: 0,

            totalTransactions: 0,

            totalEarnings: registrationBonus,

            vip: "VIP 0",

            vipActive: false,

            referralCode: myReferralCode,

            referredBy: "",

            referralCount: 0,

            country: "Rwanda",

            address: "",

            photoURL: "",

            createdAt: Date.now()

        });

        // ==========================
        // REFERRAL
        // ==========================

        if (referralCode.trim() !== "") {

            const usersRef = ref(db, "users");

            const snapshot = await get(usersRef);

            if (snapshot.exists()) {

                snapshot.forEach(async (child) => {

                    const data = child.val();

                    if (data.referralCode === referralCode) {

                        await update(
                            ref(db, "users/" + user.uid),
                            {
                                referredBy: child.key
                            }
                        );

                        await update(
                            ref(db, "users/" + child.key),
                            {
                                referralCount:
                                    Number(data.referralCount || 0) + 1,

                                referralBonus:
                                    Number(data.referralBonus || 0) + 500
                            }
                        );

                    }

                });

            }

        }

        alert("Registration Successful!\n500 RWF Bonus Added.");

        return true;

    } catch (error) {

        alert(error.message);

        return false;

    }

  }
// ======================================
// auth.js - PART 2
// LOGIN • LOGOUT • RESET PASSWORD
// ======================================


// ======================================
// LOGIN USER
// ======================================

export async function loginUser(email, password) {

    try {

        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = credential.user;

        const snapshot = await get(
            ref(db, "users/" + user.uid)
        );

        if (!snapshot.exists()) {

            alert("User account not found.");

            await signOut(auth);

            return false;

        }

        window.location.href = "dashboard.html";

        return true;

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

        await sendPasswordResetEmail(
            auth,
            email
        );

        alert("Password reset email sent.");

    } catch (error) {

        alert(error.message);

    }

}



console.log("Auth Part 2 Loaded Successfully");
  
// ======================================
// auth.js - PART 3
// CURRENT USER & AUTH STATE
// ======================================

// ======================================
// GET CURRENT USER
// ======================================

export function getCurrentUser() {

    return auth.currentUser;

}

// ======================================
// AUTH STATE LISTENER
// ======================================

export function checkAuth(callback) {

    onAuthStateChanged(auth, (user) => {

        if (user) {

            callback(user);

        } else {

            window.location.href = "login.html";

        }

    });

}

// ======================================
// REQUIRE LOGIN
// ======================================

export function requireLogin() {

    onAuthStateChanged(auth, (user) => {

        if (!user) {

            window.location.href = "login.html";

        }

    });

}

// ======================================
// CHECK LOGIN STATUS
// ======================================

export function isLoggedIn() {

    return auth.currentUser !== null;

}

console.log("Auth Part 3 Loaded Successfully");
