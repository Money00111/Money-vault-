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
// FIND REFERRER BEFORE CREATING USER
// ==================================

let referrerUid = "";

let referrerData = null;


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
                // READ ONLY THE REFERRER USER
                // ==================================

                if (referrerUid) {

                    const referrerSnapshot =
                        await get(
                            ref(
                                db,
                                "users/" +
                                referrerUid
                            )
                        );


                    if (
                        referrerSnapshot.exists()
                    ) {

                        referrerData =
                            referrerSnapshot.val() || {};

                    }

                }

            }

            else {

                console.warn(
                    "REFERRAL CODE NOT FOUND:",
                    cleanReferralCode
                );

                // IMPORTANT:
                // We DO NOT stop registration.
                // User can still register without
                // a valid referral.

                referrerUid = "";

            }

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
        // GENERATE REFERRAL CODE
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
            // REFERRAL INFORMATION
            // ==================================

            referredBy:
                referrerUid || "",

            referralCodeUsed:
                referrerUid
                    ? cleanReferralCode
                    : "",

            referralCount:
                0,

            // IMPORTANT:
            // This belongs to the referred USER.
            // It becomes true when the first
            // qualifying VIP referral bonus
            // is actually given.

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
// SAVE MY REFERRAL CODE
// ==================================

await set(
    ref(
        db,
        "referralCodes/" +
        myReferralCode
    ),
    {
        uid:
            user.uid
    }
);

console.log(
    "MY REFERRAL CODE SAVED:",
    myReferralCode
);


        // ==================================
        // SAVE MY REFERRAL CODE
        // ==================================

        await set(
            ref(
                db,
                "referralCodes/" +
                myReferralCode
            ),
            {

                uid:
                    user.uid,

                createdAt:
                    Date.now()

            }
        );


        console.log(
            "MY REFERRAL CODE SAVED:",
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
            // INCREASE REFERRER COUNT
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
                "REFERRAL CONNECTED"
            );

            console.log(
                "NEW USER:",
                user.uid
            );

            console.log(
                "REFERRER:",
                referrerUid
            );

            console.log(
                "CODE:",
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
            "MY REFERRAL CODE:",
            myReferralCode
        );

        console.log(
            "REFERRED BY:",
            referrerUid || ""
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
            "PERMISSION_DENIED"
        ) {

            alert(
                "Permission denied. Please check Firebase Rules."
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


        // ==================================
        // CHECK OWN USER DATA
        // ==================================

        const userRef = ref(
    db,
    "users/" + user.uid
);

console.log(
    "LOGIN UID:",
    user.uid
);

console.log(
    "READING USER PATH:",
    "users/" + user.uid
);

const snapshot =
    await get(userRef);

console.log(
    "USER DATA EXISTS:",
    snapshot.exists()
);

console.log(
    "USER DATA:",
    snapshot.val()
);

if (!snapshot.exists()) {

    alert(
        "Firebase Auth login successful, but users/" +
        user.uid +
        " was not found."
    );

    return false;
}

console.log(
    "USER DATA FOUND - GOING DASHBOARD"
);

window.location.href =
    "dashboard.html";

return true;
         {

            alert(
                "User account data not found."
            );

            return false;

        }


        console.log(
            "USER DATA FOUND"
        );


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
