// ======================================
// MONEY VAULT - REFERRAL.JS
// COMPLETE CLEAN VERSION
// CURRENCY: RWF / FRW
//
// FEATURES:
// - My referral code
// - My referral link
// - Referral count
// - Referral bonus
// - Referral earnings
// - Live Firebase updates
// - Copy referral link
// ======================================

import { auth, db } from "./firebase.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// DOM ELEMENTS
// ======================================

const referralCode =
    document.getElementById("referralCode");

const referralLink =
    document.getElementById("referralLink");

const referralCount =
    document.getElementById("referralCount");

const referralEarnings =
    document.getElementById("referralEarnings");


// Optional element.
// If your HTML has id="referralBonus",
// it will automatically be updated.
const referralBonus =
    document.getElementById("referralBonus");


// Optional copy button
const copyBtn =
    document.getElementById("copyReferralBtn");


// ======================================
// STATE
// ======================================

let currentUser = null;
let unsubscribeUser = null;


// ======================================
// MONEY FORMAT
// ======================================

function money(value) {

    const amount =
        Number(value || 0);

    return (
        amount.toLocaleString("en-US") +
        " RWF"
    );
}


// ======================================
// SAFE NUMBER
// ======================================

function numberValue(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


// ======================================
// AUTH STATE
// ======================================

auth.onAuthStateChanged((user) => {

    // ==================================
    // USER NOT LOGGED IN
    // ==================================

    if (!user) {

        currentUser = null;

        if (unsubscribeUser) {

            unsubscribeUser();

            unsubscribeUser = null;

        }

        return;

    }


    // ==================================
    // SAVE CURRENT USER
    // ==================================

    currentUser = user;


    console.log(
        "REFERRAL PAGE USER:",
        user.uid
    );


    // ==================================
    // LOAD REFERRAL DATA
    // ==================================

    loadReferralData();

});


// ======================================
// LOAD REFERRAL DATA
// ======================================

function loadReferralData() {

    if (!currentUser) {

        return;

    }


    const userRef =
        ref(
            db,
            "users/" + currentUser.uid
        );


    // ==================================
    // REMOVE OLD LISTENER
    // ==================================

    if (unsubscribeUser) {

        unsubscribeUser();

        unsubscribeUser = null;

    }


    // ==================================
    // LIVE USER LISTENER
    // ==================================

    unsubscribeUser =
        onValue(
            userRef,
            (snapshot) => {

                if (!snapshot.exists()) {

                    console.warn(
                        "USER DATA NOT FOUND"
                    );

                    return;

                }


                const user =
                    snapshot.val() || {};


                // ==================================
                // MY REFERRAL CODE
                // ==================================

                const code =
                    String(
                        user.referralCode ||
                        (
                            "MV" +
                            currentUser.uid
                                .substring(0, 6)
                                .toUpperCase()
                        )
                    );


                if (referralCode) {

                    referralCode.textContent =
                        code;

                }


                // ==================================
                // MY REFERRAL LINK
                // ==================================

                if (referralLink) {

                    referralLink.value =
                        window.location.origin +
                        "/register.html?ref=" +
                        encodeURIComponent(code);

                }


                // ==================================
                // REFERRAL COUNT
                //
                // First use referralCount.
                //
                // If old data has referrals object,
                // support that too.
                // ==================================

                let count =
                    numberValue(
                        user.referralCount
                    );


                if (
                    count <= 0 &&
                    user.referrals &&
                    typeof user.referrals === "object"
                ) {

                    count =
                        Object.keys(
                            user.referrals
                        ).length;

                }


                if (referralCount) {

                    referralCount.textContent =
                        count.toLocaleString();

                }


                // ==================================
                // REFERRAL BONUS
                //
                // This is the actual bonus field.
                // ==================================

                const bonus =
                    numberValue(
                        user.referralBonus
                    );


                if (referralBonus) {

                    referralBonus.textContent =
                        money(bonus);

                }


                // ==================================
                // REFERRAL EARNINGS
                // ==================================

                const earnings =
                    numberValue(
                        user.referralEarnings
                    );


                if (referralEarnings) {

                    referralEarnings.textContent =
                        money(earnings);

                }


                // ==================================
                // DEBUG
                // ==================================

                console.log(
                    "================================"
                );

                console.log(
                    "REFERRAL DATA UPDATED"
                );

                console.log(
                    "USER UID:",
                    currentUser.uid
                );

                console.log(
                    "MY CODE:",
                    code
                );

                console.log(
                    "REFERRAL COUNT:",
                    count
                );

                console.log(
                    "REFERRAL BONUS:",
                    bonus
                );

                console.log(
                    "REFERRAL EARNINGS:",
                    earnings
                );

                console.log(
                    "BALANCE:",
                    numberValue(user.balance)
                );

                console.log(
                    "REFERRED BY:",
                    user.referredBy || "NONE"
                );

                console.log(
                    "REFERRAL CODE USED:",
                    user.referralCodeUsed || "NONE"
                );

                console.log(
                    "================================"
                );

            },

            (error) => {

                console.error(
                    "REFERRAL USER LISTENER ERROR:",
                    error
                );

            }
        );

}


// ======================================
// COPY REFERRAL LINK
// ======================================

copyBtn?.addEventListener(
    "click",
    async () => {

        if (!referralLink) {

            return;

        }


        const link =
            referralLink.value;


        if (!link) {

            alert(
                "Referral link is not available yet."
            );

            return;

        }


        try {

            // ==================================
            // MODERN CLIPBOARD
            // ==================================

            if (
                navigator.clipboard &&
                navigator.clipboard.writeText
            ) {

                await navigator.clipboard.writeText(
                    link
                );

            }

            else {

                // ==================================
                // FALLBACK
                // ==================================

                referralLink.focus();

                referralLink.select();

                document.execCommand(
                    "copy"
                );

            }


            alert(
                "Referral link copied successfully."
            );

        }

        catch (error) {

            console.error(
                "COPY REFERRAL LINK ERROR:",
                error
            );


            alert(
                "Unable to copy referral link."
            );

        }

    }
);


// ======================================
// CLEANUP
// ======================================

window.addEventListener(
    "beforeunload",
    () => {

        if (unsubscribeUser) {

            unsubscribeUser();

            unsubscribeUser = null;

        }

    }
);


// ======================================
// READY
// ======================================

console.log(
    "=================================="
);

console.log(
    "Money Vault Referral.js Loaded"
);

console.log(
    "Referral System Ready"
);

console.log(
    "RWF / FRW"
);

console.log(
    "=================================="
);
