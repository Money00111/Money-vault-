// ======================================
// AUTH.JS - MONEY VAULT
// REGISTER • LOGIN • LOGOUT • RESET
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

        await authReady;

        // ==================================
        // CLEAN REFERRAL CODE
        // ==================================

        const cleanReferralCode =
            String(referralCode || "")
                .trim()
                .toUpperCase();

        console.log("================================");
        console.log("REGISTRATION START");
        console.log("REFERRAL CODE:", cleanReferralCode);
        console.log("================================");


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

            if (referralSnapshot.exists()) {

                const referralData =
                    referralSnapshot.val() || {};

                referrerUid =
                    referralData.uid || "";

                console.log(
                    "REFERRER FOUND:",
                    referrerUid
                );

            } else {

                console.warn(
                    "REFERRAL CODE NOT FOUND:",
                    cleanReferralCode
                );

            }

        } else {

            console.log(
                "NO REFERRAL CODE USED"
            );

        }


        // ==================================
        // CREATE AUTH ACCOUNT
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

            referredBy: referrerUid || "",

            referralCodeUsed:
                referrerUid
                    ? cleanReferralCode
                    : "",

            referralCount: 0,

            referralBonusGiven: false,

            country: "Rwanda",

            address: "",

            photoURL: "",

            createdAt: Date.now()

        };


        // ==================================
        // SAVE USER DATA
        // ==================================

        await set(
            ref(
                db,
                "users/" + user.uid
            ),
            userData
        );

        console.log(
            "USER DATA SAVED:",
            user.uid
        );


        // ==================================
        // SAVE REFERRAL CODE
        // ==================================

        await set(
            ref(
                db,
                "referralCodes/" +
                myReferralCode
            ),
            {

                uid: user.uid,

                createdAt: Date.now()

            }
        );

        console.log(
            "REFERRAL CODE SAVED:",
            myReferralCode
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


            // ==================================
            // SAVE REFERRED USER
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

                    uid: user.uid,

                    fullName: fullName,

                    referralCode:
                        cleanReferralCode,

                    joinedAt: Date.now(),

                    vipPurchased: false,

                    referralBonusGiven: false

                }

            );


            console.log(
                "REFERRAL CONNECTED SUCCESSFULLY"
            );

        }


        // ==================================
        // REGISTRATION SUCCESS
        // ==================================

        console.log("================================");
        console.log("REGISTRATION SUCCESSFUL");
        console.log("UID:", user.uid);
        console.log(
            "MY REFERRAL CODE:",
            myReferralCode
        );
        console.log(
            "REFERRED BY:",
            referrerUid || ""
        );
        console.log("================================");


        return true;


    } catch (error) {

        console.error(
            "REGISTRATION ERROR:",
            error
        );

        console.error(
            "ERROR CODE:",
            error.code
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

        else if (
            error.code ===
            "PERMISSION_DENIED" ||
            error.code ===
            "database/permission-denied"
        ) {

            alert(
                "Permission denied. Check Firebase Rules."
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
        // FIREBASE AUTH LOGIN
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
            "================================"
        );

        console.log(
            "LOGIN SUCCESS"
        );

        console.log(
            "AUTH UID:",
            user.uid
        );


        // ==================================
        // READ ONLY OWN USER DATA
        // ==================================

        const userRef =
            ref(
                db,
                "users/" + user.uid
            );


        console.log(
            "READING:",
            "users/" + user.uid
        );


        const snapshot =
            await get(userRef);


        console.log(
            "USER DATA EXISTS:",
            snapshot.exists()
        );


        // ==================================
        // USER DATA NOT FOUND
        // ==================================

        if (!snapshot.exists()) {

            console.error(
                "AUTH EXISTS BUT DATABASE USER DOES NOT EXIST"
            );

            console.error(
                "EXPECTED PATH:",
                "users/" + user.uid
            );


            alert(
                "Your login is correct, but your Money Vault account data was not found."
            );


            // Sign out so the broken session
            // does not remain active.

            await signOut(auth);

            return false;

        }


        // ==================================
        // USER DATA FOUND
        // ==================================

        console.log(
            "USER DATA FOUND"
        );

        console.log(
            "USER DATA:",
            snapshot.val()
        );


        console.log(
            "GOING TO DASHBOARD..."
        );


        // ==================================
        // DASHBOARD
        // ==================================

        window.location.replace(
            "./dashboard.html"
        );


        return true;


    } catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "LOGIN ERROR:",
            error
        );

        console.error(
            "ERROR CODE:",
            error.code
        );

        console.error(
            "ERROR MESSAGE:",
            error.message
        );

        console.error(
            "================================"
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
                "Account not found."
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

        else if (
            error.code ===
            "PERMISSION_DENIED" ||
            error.code ===
            "database/permission-denied"
        ) {

            alert(
                "Permission denied while reading your account. Check Firebase Rules."
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
// LOGOUT
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
// AUTH STATE
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
// LOGIN STATUS
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
