// ======================================
// AUTH.JS - MONEY VAULT
// REGISTER • LOGIN • LOGOUT • RESET
// AUTH STATE
// ======================================

import {
    auth,
    db,
    authReady
} from "./firebase.js";

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
    update,
    runTransaction
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

        // ==================================
        // CREATE FIREBASE AUTH ACCOUNT
        // ==================================

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

        const user = userCredential.user;


        // ==================================
        // REGISTRATION BONUS
        // ==================================

        const registrationBonus = 500;


        // ==================================
        // GENERATE MY REFERRAL CODE
        // ==================================

        const myReferralCode =
            "MV" +
            user.uid
                .substring(0, 6)
                .toUpperCase();


        // ==================================
        // CREATE USER ACCOUNT
        // ==================================

        await set(
            ref(db, "users/" + user.uid),
            {

                uid: user.uid,

                fullName: fullName,

                phone: phone,

                email: email,

                balance: registrationBonus,

                bonus: registrationBonus,

                referralBonus: 0,

                referralEarnings: 0,

                totalDeposit: 0,

                totalWithdraw: 0,

                totalTransactions: 0,

                totalEarnings: registrationBonus,

                vip: "VIP 0",

                vipActive: false,

                referralCode: myReferralCode,

                referredBy: "",

                referralCodeUsed: "",

                referralCount: 0,

                referralBonusGiven: false,

                country: "Rwanda",

                address: "",

                photoURL: "",

                createdAt: Date.now()

            }
        );


// ======================================
// REFERRAL SYSTEM
// ======================================

let referrerUid = null;

const cleanReferralCode =
    String(referralCode || "")
        .trim()
        .toUpperCase();


// ======================================
// DEBUG
// ======================================

console.log(
    "REFERRAL CODE RECEIVED:",
    cleanReferralCode
);


// ======================================
// FIND REFERRER BY REFERRAL CODE
// ======================================

if (cleanReferralCode !== "") {

    const usersSnapshot =
        await get(
            ref(db, "users")
        );


    if (usersSnapshot.exists()) {

        usersSnapshot.forEach((child) => {

            const data =
                child.val() || {};

            const savedCode =
                String(
                    data.referralCode || ""
                )
                    .trim()
                    .toUpperCase();


            console.log(
                "CHECK REFERRAL:",
                savedCode,
                "vs",
                cleanReferralCode
            );


            // ==================================
            // MATCH REFERRAL CODE
            // ==================================

            if (
                savedCode === cleanReferralCode &&
                child.key !== user.uid
            ) {

                referrerUid =
                    child.key;

            }

        });

    }


    // ==================================
    // VALID REFERRER FOUND
    // ==================================

    if (referrerUid) {

        console.log(
            "REFERRER FOUND:",
            referrerUid
        );


        // ==================================
        // SAVE REFERRAL INFORMATION
        // ==================================

        await update(
            ref(
                db,
                "users/" + user.uid
            ),
            {

                referredBy:
                    referrerUid,

                referralCodeUsed:
                    cleanReferralCode,

                referralBonusGiven:
                    false

            }
        );


        // ==================================
        // INCREASE REFERRAL COUNT
        // ==================================

        await runTransaction(
            ref(
                db,
                "users/" +
                referrerUid +
                "/referralCount"
            ),
            current => {

                return (
                    Number(current || 0) + 1
                );

            }
        );


        console.log(
            "================================"
        );

        console.log(
            "REFERRAL CONNECTED SUCCESSFULLY"
        );

        console.log(
            "New User UID:",
            user.uid
        );

        console.log(
            "Referral Code:",
            cleanReferralCode
        );

        console.log(
            "Referred By UID:",
            referrerUid
        );

        console.log(
            "================================"
        );

    }

    else {

        console.warn(
            "REFERRAL CODE NOT FOUND:",
            cleanReferralCode
        );

    }

}

else {

    console.log(
        "NO REFERRAL CODE USED"
    );

}
        // ==================================
        // REGISTRATION COMPLETE
        // ==================================

        console.log(
            "Registration successful:",
            user.uid
        );


        return true;


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        // ==================================
        // FIREBASE ERROR MESSAGE
        // ==================================

        if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            alert(
                "This email is already registered."
            );

        }

        else if (
            error.code ===
            "auth/invalid-email"
        ) {

            alert(
                "Please enter a valid email address."
            );

        }

        else if (
            error.code ===
            "auth/weak-password"
        ) {

            alert(
                "Password is too weak."
            );

        }

        else {

            alert(
                error.message
            );

        }


        return false;

    }

}



 

// ======================================
// LOGIN USER
// ======================================

export async function loginUser(email, password) {

    try {

        // Wait for Firebase persistence
        await authReady;


        // LOGIN
        const credential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            credential.user;


        console.log(
            "LOGIN SUCCESS:",
            user.uid
        );


        // CHECK USER DATA
        const snapshot =
            await get(
                ref(
                    db,
                    "users/" + user.uid
                )
            );


        if (!snapshot.exists()) {

            alert(
                "User account data not found."
            );

            return false;

        }


        console.log(
            "USER DATA FOUND"
        );


        // GO DIRECTLY TO DASHBOARD
        window.location.href =
            "dashboard.html";


        return true;


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        alert(
            error.message
        );

        return false;

    }

}



// ======================================
// LOGOUT USER
// ======================================

export async function logoutUser() {

    try {

        await signOut(auth);


        window.location.href =
            "login.html";


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            error.message
        );

    }

}



// ======================================
// RESET PASSWORD
// ======================================

export async function resetPassword(
    email
) {

    try {

        await sendPasswordResetEmail(
            auth,
            email
        );


        alert(
            "Password reset email sent."
        );


    } catch (error) {

        console.error(
            "Password reset error:",
            error
        );


        alert(
            error.message
        );

    }

}



// ======================================
// GET CURRENT USER
// ======================================

export function getCurrentUser() {

    return auth.currentUser;

}



// ======================================
// AUTH STATE LISTENER
// ======================================

export function checkAuth(
    callback
) {

    onAuthStateChanged(
        auth,
        (user) => {

            if (user) {

                callback(user);

            }

            else {

                window.location.href =
                    "login.html";

            }

        }
    );

}



// ======================================
// REQUIRE LOGIN
// ======================================

export function requireLogin() {

    onAuthStateChanged(
        auth,
        (user) => {

            if (!user) {

                window.location.href =
                    "login.html";

            }

        }
    );

}



// ======================================
// CHECK LOGIN STATUS
// ======================================

export function isLoggedIn() {

    return auth.currentUser !== null;

}



console.log(
    "Auth.js Loaded Successfully"
);
