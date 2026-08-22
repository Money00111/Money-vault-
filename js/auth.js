// ======================================
// AUTH.JS - MONEY VAULT
// REGISTER • LOGIN • LOGOUT • RESET
// SECURE REFERRAL SYSTEM
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

        await authReady;


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
            "REFERRAL CODE:",
            cleanReferralCode
        );

        console.log(
            "================================"
        );


        // ==================================
        // CREATE AUTH ACCOUNT FIRST
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
        // FIND REFERRER
        // ==================================

        let referrerUid = "";


        if (cleanReferralCode !== "") {

            console.log(
                "SEARCHING REFERRAL CODE..."
            );


            const referralSnapshot =
                await get(
                    ref(
                        db,
                        "referralCodes/" +
                        cleanReferralCode
                    )
                );


            if (
                referralSnapshot.exists()
            ) {

                const referralData =
                    referralSnapshot.val() || {};


                const possibleUid =
                    String(
                        referralData.uid || ""
                    ).trim();


                // ==================================
                // PREVENT SELF REFERRAL
                // ==================================

                if (
                    possibleUid &&
                    possibleUid !== user.uid
                ) {

                    referrerUid =
                        possibleUid;


                    console.log(
                        "REFERRER FOUND:",
                        referrerUid
                    );

                }

            }

            else {

                console.warn(
                    "REFERRAL CODE NOT FOUND:",
                    cleanReferralCode
                );

            }

        }


        // ==================================
        // REGISTRATION BONUS
        // ==================================

        const registrationBonus =
            500;


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
        // PREPARE DATABASE UPDATE
        // ==================================

        const updates = {};


        // ==================================
        // SAVE USER
        // ==================================

        updates[
            "users/" +
            user.uid
        ] =
            userData;


        // ==================================
        // SAVE MY REFERRAL CODE
        // ==================================

        updates[
            "referralCodes/" +
            myReferralCode
        ] = {

            uid:
                user.uid

        };


        // ==================================
        // SAVE REFERRAL CONNECTION
        // ==================================

        if (referrerUid) {

            updates[
                "users/" +
                referrerUid +
                "/referrals/" +
                user.uid
            ] = {

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

            };

        }


        // ==================================
        // SAVE EVERYTHING
        // ==================================

        await update(
            ref(db),
            updates
        );


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
            "MY REFERRAL CODE:",
            myReferralCode
        );

        console.log(
            "REFERRED BY:",
            referrerUid || ""
        );

        console.log(
            "REFERRAL CODE USED:",
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

        await authReady;


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


        const snapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    user.uid
                )
            );


        if (
            !snapshot.exists()
        ) {

            alert(
                "User account data not found."
            );

            return false;

        }


        // ==================================
        // BACKUP REFERRAL CODE FOR OLD USERS
        // ==================================

        const userData =
            snapshot.val() || {};


        const myReferralCode =
            String(
                userData.referralCode || ""
            )
                .trim()
                .toUpperCase();


        if (myReferralCode !== "") {

            const codeRef =
                ref(
                    db,
                    "referralCodes/" +
                    myReferralCode
                );


            const codeSnapshot =
                await get(codeRef);


            if (
                !codeSnapshot.exists()
            ) {

                await set(
                    codeRef,
                    {
                        uid:
                            user.uid
                    }
                );


                console.log(
                    "OLD USER REFERRAL CODE RESTORED:",
                    myReferralCode
                );

            }

        }


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

    }

    catch (error) {

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

    }

    catch (error) {

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
// READY
// ======================================

console.log(
    "=================================="
);

console.log(
    "Money Vault Auth.js Loaded"
);

console.log(
    "Secure Referral System Ready"
);

console.log(
    "Registration Ready"
);

console.log(
    "Login Ready"
);

console.log(
    "=================================="
);
