// ======================================
// AUTH.JS - MONEY VAULT
// REGISTER • LOGIN • LOGOUT • RESET
// AUTH STATE
// REFERRAL SYSTEM
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
    onAuthStateChanged,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    set,
    get
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

    let createdUser = null;

    try {

        // ==================================
        // WAIT FOR FIREBASE AUTH
        // ==================================

        await authReady;


        // ==================================
        // CLEAN INPUT
        // ==================================

        const cleanFullName =
            String(fullName || "").trim();

        const cleanPhone =
            String(phone || "").trim();

        const cleanEmail =
            String(email || "").trim();

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
            "Referral code received:",
            cleanReferralCode
        );

        console.log(
            "================================"
        );


        // ==================================
        // BASIC VALIDATION
        // ==================================

        if (!cleanFullName) {

            throw new Error(
                "Please enter your full name."
            );
        }


        if (!cleanPhone) {

            throw new Error(
                "Please enter your phone number."
            );
        }


        if (!cleanEmail) {

            throw new Error(
                "Please enter your email."
            );
        }


        if (!password || password.length < 6) {

            throw new Error(
                "Password must contain at least 6 characters."
            );
        }


        // ==================================
        // IMPORTANT
        // CREATE AUTH ACCOUNT FIRST
        //
        // This is necessary because Firebase
        // Rules require auth != null before
        // reading /users.
        // ==================================

        const userCredential =
            await createUserWithEmailAndPassword(
                auth,
                cleanEmail,
                password
            );


        createdUser =
            userCredential.user;


        console.log(
            "AUTH USER CREATED:",
            createdUser.uid
        );


        // ==================================
        // NEW USER UID
        // ==================================

        const uid =
            createdUser.uid;


        // ==================================
        // FIND REFERRER
        //
        // NOW AUTH IS AVAILABLE
        // ==================================

        let referrerUid = "";

        let referrerData = null;


        if (cleanReferralCode) {

            console.log(
                "SEARCHING REFERRER..."
            );


            try {

                const usersSnapshot =
                    await get(
                        ref(db, "users")
                    );


                if (usersSnapshot.exists()) {

                    usersSnapshot.forEach(
                        child => {

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
                                !referrerUid &&
                                savedCode ===
                                cleanReferralCode &&
                                child.key !== uid
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

            catch (referralError) {

                // ==================================
                // IMPORTANT
                //
                // Referral lookup failing should
                // NOT destroy the new account.
                // ==================================

                console.error(
                    "REFERRER SEARCH ERROR:",
                    referralError
                );

                referrerUid = "";

                referrerData = null;

            }

        }

        else {

            console.log(
                "NO REFERRAL CODE USED"
            );

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
            uid
                .substring(0, 6)
                .toUpperCase();


        // ==================================
        // USER DATA
        // ==================================

        const userData = {

            uid:

                uid,


            fullName:

                cleanFullName,


            phone:

                cleanPhone,


            email:

                cleanEmail,


            // ==================================
            // REGISTRATION BONUS
            // ==================================

            balance:

                registrationBonus,


            bonus:

                registrationBonus,


            // ==================================
            // REFERRAL MONEY
            // ==================================

            referralBonus:

                0,


            referralEarnings:

                0,


            // ==================================
            // ACCOUNT STATISTICS
            // ==================================

            totalDeposit:

                0,


            totalWithdraw:

                0,


            totalTransactions:

                0,


            totalEarnings:

                registrationBonus,


            // ==================================
            // VIP
            // ==================================

            vip:

                "VIP 0",


            vipActive:

                false,


            // ==================================
            // MY REFERRAL CODE
            // ==================================

            referralCode:

                myReferralCode,


            // ==================================
            // WHO REFERRED ME
            // ==================================

            referredBy:

                referrerUid || "",


            // ==================================
            // CODE I USED
            // ==================================

            referralCodeUsed:

                referrerUid
                    ? cleanReferralCode
                    : "",


            // ==================================
            // REFERRAL COUNT
            // ==================================

            referralCount:

                0,


            // ==================================
            // IMPORTANT
            //
            // This belongs to THIS USER.
            // It means whether this referred
            // user has already generated the
            // 1,000 RWF referral bonus.
            // ==================================

            referralBonusGiven:

                false,


            // ==================================
            // PROFILE
            // ==================================

            country:

                "Rwanda",


            address:

                "",


            photoURL:

                "",


            // ==================================
            // CREATED
            // ==================================

            createdAt:

                Date.now()

        };


        // ==================================
        // SAVE USER
        //
        // This is allowed by your rules:
        //
        // auth.uid === uid
        // ==================================

        await set(
            ref(
                db,
                "users/" + uid
            ),
            userData
        );


        console.log(
            "USER DATA SAVED SUCCESSFULLY"
        );


        // ==================================
        // IMPORTANT
        //
        // DO NOT WRITE HERE:
        //
        // users/referrerUid/referralCount
        // users/referrerUid/referrals
        //
        // because a normal user is NOT allowed
        // to modify another user's account.
        //
        // Admin Part 7 will handle referral
        // bonus when VIP is approved.
        // ==================================

        if (referrerUid) {

            console.log(
                "================================"
            );

            console.log(
                "REFERRAL CONNECTED"
            );

            console.log(
                "New User:",
                uid
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
                "Referral bonus will be handled by ADMIN"
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
            uid
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


    }

    catch (error) {

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
        // IF AUTH ACCOUNT WAS CREATED BUT
        // DATABASE SAVE FAILED
        //
        // DELETE THE AUTH ACCOUNT SO WE DON'T
        // LEAVE A BROKEN ACCOUNT BEHIND.
        // ==================================

        if (createdUser) {

            try {

                await deleteUser(
                    createdUser
                );

                console.log(
                    "BROKEN AUTH ACCOUNT REMOVED"
                );

            }

            catch (deleteError) {

                console.error(
                    "COULD NOT DELETE AUTH ACCOUNT:",
                    deleteError
                );

            }

        }


        // ==================================
        // FIREBASE ERROR HANDLING
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

        else if (
            error.code ===
            "auth/network-request-failed"
        ) {

            alert(
                "Network error. Please check your internet connection."
            );

        }

        else if (
            error.code ===
            "PERMISSION_DENIED" ||
            error.code ===
            "permission_denied"
        ) {

            alert(
                "Firebase permission denied. Please check your database rules."
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
        // WAIT FOR FIREBASE AUTH
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


    }

    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );


        if (
            error.code ===
            "auth/invalid-credential"
        ) {

            alert(
                "Email or password is incorrect."
            );

        }

        else if (
            error.code ===
            "auth/user-not-found"
        ) {

            alert(
                "User account not found."
            );

        }

        else if (
            error.code ===
            "auth/wrong-password"
        ) {

            alert(
                "Incorrect password."
            );

        }

        else {

            alert(
                error.message ||
                "Login failed."
            );

        }


        return false;

    }

}



// ======================================
// LOGOUT USER
// ======================================

export async function logoutUser() {

    try {

        await signOut(
            auth
        );


        window.location.href =
            "login.html";


    }

    catch (error) {

        console.error(
            "Logout error:",
            error
        );


        alert(
            error.message ||
            "Logout failed."
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
            error.message ||
            "Password reset failed."
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
        user => {

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
        user => {

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

    return (
        auth.currentUser !== null
    );

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
