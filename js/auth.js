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

        // ======================================
// REFERRAL SAVE
// AUTOMATIC REFERRAL SYSTEM
// ======================================

if (
    referralCode &&
    referralCode.trim() !== ""
) {

    const cleanReferralCode =
        referralCode.trim().toUpperCase();

    const usersRef =
        ref(db, "users");

    const snapshot =
        await get(usersRef);


    if (snapshot.exists()) {

        let referrerUid = null;


        snapshot.forEach((child) => {

            const data = child.val();


            const savedCode =
                String(
                    data.referralCode || ""
                ).trim().toUpperCase();


            if (
                savedCode ===
                cleanReferralCode
            ) {

                // Prevent self-referral
                if (
                    child.key !== user.uid
                ) {

                    referrerUid =
                        child.key;

                }

            }

        });


        // ==================================
        // REFERRER FOUND
        // ==================================

        if (referrerUid) {

            // Save referrer on new user
            await update(
                ref(
                    db,
                    "users/" +
                    user.uid
                ),
                {

                    referredBy:
                        referrerUid,

                    referralBonusGiven:
                        false

                }
            );


            // Increase referrer's count
            await runTransaction(
                ref(
                    db,
                    "users/" +
                    referrerUid +
                    "/referralCount"
                ),
                current => {

                    return (
                        Number(current || 0) +
                        1
                    );

                }
            );


            console.log(
                "Referral connected:",
                referrerUid
            );

        }
        else {

            console.log(
                "Referral code not found:",
                cleanReferralCode
            );

        }

    }

}

    // ==================================
    // IF VALID REFERRAL CODE FOUND
    // ==================================

    if (referrerUid) {

        await update(
            ref(db, "users/" + user.uid),
            {

                referredBy:
                    referrerUid,

                referralCodeUsed:
                    enteredCode,

                referralBonusGiven:
                    false

            }
        );


        // ==================================
        // INCREASE REFERRAL COUNT
        // ==================================

        const referrerSnap =
            await get(
                ref(
                    db,
                    "users/" +
                    referrerUid
                )
            );


        if (referrerSnap.exists()) {

            const referrer =
                referrerSnap.val();

            await update(
                ref(
                    db,
                    "users/" +
                    referrerUid
                ),
                {

                    referralCount:
                        Number(
                            referrer.referralCount ||
                            0
                        ) + 1

                }
            );

        }

    }

}

// ======================================
// REGISTER SUCCESS
// ======================================

return true;


} catch (error) {


    console.error(error);

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

        setTimeout(()=>{

    window.location.href = "dashboard.html";

},500);

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
