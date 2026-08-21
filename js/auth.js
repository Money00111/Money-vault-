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
        // CLEAN REFERRAL CODE
        // ==================================

        const cleanReferralCode =
            String(referralCode || "")
                .trim()
                .toUpperCase();


        console.log(
            "================================"
        );

        console.log(
            "REGISTRATION START"
        );

        console.log(
            "REFERRAL CODE RECEIVED:",
            cleanReferralCode
        );

        console.log(
            "================================"
        );


        // ==================================
        // FIND REFERRER BEFORE CREATING USER
        // ==================================

        let referrerUid = "";

        let referrerData = null;


        if (cleanReferralCode !== "") {

            console.log(
                "SEARCHING REFERRER..."
            );


            const usersSnapshot =
                await get(
                    ref(db, "users")
                );


            if (usersSnapshot.exists()) {

                usersSnapshot.forEach(
                    (child) => {

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
                            child.key,
                            savedCode,
                            "VS",
                            cleanReferralCode
                        );


                        if (
                            savedCode ===
                            cleanReferralCode
                        ) {

                            referrerUid =
                                child.key;

                            referrerData =
                                data;

                        }

                    }
                );

            }


            // ==================================
            // REFERRER FOUND
            // ==================================

            if (referrerUid) {

                console.log(
                    "================================"
                );

                console.log(
                    "REFERRER FOUND:",
                    referrerUid
                );

                console.log(
                    "REFERRER CODE:",
                    cleanReferralCode
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
        // CREATE FIREBASE AUTH ACCOUNT
        // ==================================

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        const user =
            userCredential.user;


        console.log(
            "AUTH USER CREATED:",
            user.uid
        );


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
        // USER DATA
        // ==================================

        const userData = {

            uid:
                user.uid,

            fullName:
                fullName,

            phone:
                phone,

            email:
                email,

            balance:
                registrationBonus,

            bonus:
                registrationBonus,

            referralBonus:
                0,

            referralEarnings:
                0,

            totalDeposit:
                0,

            totalWithdraw:
                0,

            totalTransactions:
                0,

            totalEarnings:
                registrationBonus,

            vip:
                "VIP 0",

            vipActive:
                false,

            referralCode:
                myReferralCode,


            // ==================================
            // IMPORTANT REFERRAL DATA
            // ==================================

            referredBy:
                referrerUid || "",

            referralCodeUsed:
                referrerUid
                    ? cleanReferralCode
                    : "",

            referralCount:
                0,

            referralBonusGiven:
                false,


            country:
                "Rwanda",

            address:
                "",

            photoURL:
                "",

            createdAt:
                Date.now()

        };


        // ==================================
        // SAVE USER
        // ==================================

        await set(
            ref(
                db,
                "users/" +
                user.uid
            ),
            userData
        );


        console.log(
            "USER DATA SAVED"
        );


        // ==================================
        // CONNECT REFERRAL
        // ==================================

        if (referrerUid) {

            console.log(
                "CONNECTING REFERRAL..."
            );


            // ==================================
            // INCREASE REFERRAL COUNT
            // ==================================

            const referralCountRef =
                ref(
                    db,
                    "users/" +
                    referrerUid +
                    "/referralCount"
                );


            await runTransaction(
                referralCountRef,
                current => {

                    return (
                        Number(current || 0) + 1
                    );

                }
            );


            // ==================================
            // OPTIONAL: SAVE REFERRED USER
            // ==================================

            await update(
                ref(
                    db,
                    "users/" +
                    referrerUid +
                    "/referrals/" +
                    user.uid
                ),
                {

                    uid:
                        user.uid,

                    fullName:
                        fullName,

                    referralCode:
                        cleanReferralCode,

                    joinedAt:
                        Date.now(),

                    vipPurchased:
                        false,

                    referralBonusGiven:
                        false

                }
            );


            console.log(
                "================================"
            );

            console.log(
                "REFERRAL CONNECTED SUCCESSFULLY"
            );

            console.log(
                "New User:",
                user.uid
            );

            console.log(
                "Referrer:",
                referrerUid
            );

            console.log(
                "Used Code:",
                cleanReferralCode
            );

            console.log(
                "================================"
            );

        }

        else {

            console.log(
                "NO VALID REFERRER"
            );

        }


        // ==================================
        // REGISTRATION COMPLETE
        // ==================================

        console.log(
            "================================"
        );

        console.log(
            "REGISTRATION SUCCESSFUL"
        );

        console.log(
            "UID:",
            user.uid
        );

        console.log(
            "My Referral Code:",
            myReferralCode
        );

        console.log(
            "Referred By:",
            referrerUid || ""
        );

        console.log(
            "Referral Code Used:",
            referrerUid
                ? cleanReferralCode
                : ""
        );

        console.log(
            "================================"
        );


        return true;


    } catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "REGISTRATION ERROR:",
            error
        );

        console.error(
            "================================"
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
                error.message ||
                "Registration failed."
            );

        }


        return false;

    }

}



// ======================================
// LOGIN USER
// ======================================

export async function loginUser(
    email,
    password
) {

    try {

        // ==================================
        // WAIT FOR FIREBASE
        // ==================================

        await authReady;


        // ==================================
        // LOGIN
        // ==================================

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


        // ==================================
        // CHECK USER DATA
        // ==================================

        const snapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    user.uid
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


        // ==================================
        // GO TO DASHBOARD
        // ==================================

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



// ======================================
// AUTH READY
// ======================================

console.log(
    "=================================="
);

console.log(
    "Money Vault Auth.js Loaded"
);

console.log(
    "Registration Ready"
);

console.log(
    "Referral System Ready"
);

console.log(
    "Login Ready"
);

console.log(
    "=================================="
);
