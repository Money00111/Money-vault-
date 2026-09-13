/* =========================================================
   MONEY VAULT - VIP.JS
   AUTOMATIC VIP PURCHASE VERSION

   CURRENCY: RWF / FRW

   FEATURES
   ---------------------------------------------------------
   1. Firebase Authentication
   2. Loads active VIP plans
   3. Shows current user balance
   4. Automatic VIP purchase
   5. Balance deducted immediately
   6. VIP becomes ACTIVE immediately
   7. Same VIP plan cannot be bought twice
   8. Different VIP plans can be owned together
   9. Referral bonus = 1,000 RWF
   10. Referral bonus paid automatically on first VIP purchase
   11. Referral bonus paid only once
   12. Daily income claim every 24 hours
   13. Transaction records
   14. Owned VIP list
   15. Mobile sidebar
   16. Logout
   ========================================================= */


/* =========================================================
   FIREBASE IMPORTS
   ========================================================= */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    set,
    update,
    push,
    runTransaction,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   CONSTANTS
   ========================================================= */

const CURRENCY = "RWF";

const REFERRAL_BONUS = 1000;

const CLAIM_INTERVAL = 24 * 60 * 60 * 1000;


/* =========================================================
   GLOBAL VARIABLES
   ========================================================= */

let currentUser = null;

let userData = {};

let vipPlans = {};

let ownedVIPs = {};

let selectedVIP = null;

let claimTimerInterval = null;

let balanceListener = null;


/* =========================================================
   DOM ELEMENTS
   ========================================================= */

const balanceEl = document.getElementById("balance");

const vipGridEl = document.getElementById("vipGrid");

const ownedVipListEl = document.getElementById("ownedVipList");

const currentVipEl = document.getElementById("currentVip");

const dailyIncomeEl = document.getElementById("dailyIncome");

const totalProfitEl = document.getElementById("totalProfit");

const claimTimerEl = document.getElementById("claimTimer");

const claimButtonEl = document.getElementById("claimDailyIncome");

const menuBtn = document.getElementById("menuBtn");

const sidebar = document.getElementById("sidebar");

const logoutBtn = document.getElementById("logoutBtn");


/* =========================================================
   HELPER - FORMAT MONEY
   ========================================================= */

function formatMoney(amount) {

    const number = Number(amount) || 0;

    return number.toLocaleString("en-US") + " " + CURRENCY;
}


/* =========================================================
   HELPER - SAFE NUMBER
   ========================================================= */

function numberValue(value) {

    const number = Number(value);

    if (Number.isFinite(number)) {
        return number;
    }

    return 0;
}


/* =========================================================
   HELPER - ESCAPE HTML
   ========================================================= */

function escapeHTML(value) {

    const div = document.createElement("div");

    div.textContent = value ?? "";

    return div.innerHTML;
}


/* =========================================================
   SHOW MESSAGE
   ========================================================= */

function showMessage(message, type = "info") {

    const oldMessage = document.getElementById("vipMessage");

    if (oldMessage) {
        oldMessage.remove();
    }

    const messageBox = document.createElement("div");

    messageBox.id = "vipMessage";

    messageBox.textContent = message;

    messageBox.style.position = "fixed";
    messageBox.style.top = "20px";
    messageBox.style.left = "50%";
    messageBox.style.transform = "translateX(-50%)";
    messageBox.style.zIndex = "99999";
    messageBox.style.padding = "14px 22px";
    messageBox.style.borderRadius = "12px";
    messageBox.style.fontWeight = "600";
    messageBox.style.fontSize = "14px";
    messageBox.style.maxWidth = "90%";
    messageBox.style.textAlign = "center";
    messageBox.style.boxShadow = "0 8px 30px rgba(0,0,0,0.20)";
    messageBox.style.background =
        type === "success"
            ? "#16a34a"
            : type === "error"
                ? "#dc2626"
                : "#2563eb";

    messageBox.style.color = "#ffffff";

    document.body.appendChild(messageBox);

    setTimeout(() => {

        if (messageBox) {
            messageBox.remove();
        }

    }, 3500);
}


/* =========================================================
   LOAD CURRENT USER
   ========================================================= */

async function loadCurrentUser(uid) {

    const userRef = ref(db, `users/${uid}`);

    const snapshot = await get(userRef);

    if (!snapshot.exists()) {

        throw new Error(
            "User account was not found in the database."
        );
    }

    userData = snapshot.val() || {};

    updateBalanceUI();

    updateVIPSummary();
}


/* =========================================================
   UPDATE BALANCE UI
   ========================================================= */

function updateBalanceUI() {

    if (!balanceEl) {
        return;
    }

    balanceEl.textContent =
        formatMoney(numberValue(userData.balance));
}


/* =========================================================
   REALTIME BALANCE LISTENER
   ========================================================= */

function startBalanceListener(uid) {

    if (balanceListener) {
        balanceListener();
        balanceListener = null;
    }

    const userRef = ref(db, `users/${uid}`);

    balanceListener = onValue(
        userRef,
        snapshot => {

            if (!snapshot.exists()) {
                return;
            }

            userData = snapshot.val() || {};

            updateBalanceUI();

            updateVIPSummary();

        },
        error => {

            console.error(
                "Balance listener error:",
                error
            );

        }
    );
}


/* =========================================================
   LOAD VIP PLANS
   ========================================================= */

async function loadVIPPlans() {

    if (!vipGridEl) {
        return;
    }

    vipGridEl.innerHTML = `
        <div class="loading-vip">
            <i class="fas fa-spinner fa-spin"></i>
            Loading VIP Plans...
        </div>
    `;

    try {

        const snapshot = await get(
            ref(db, "vipPlans")
        );

        if (!snapshot.exists()) {

            vipPlans = {};

            vipGridEl.innerHTML = `
                <div class="empty-vip">
                    No VIP plans available.
                </div>
            `;

            return;
        }

        vipPlans = snapshot.val() || {};

        renderVIPPlans();

    } catch (error) {

        console.error(
            "VIP Plans Error:",
            error
        );

        vipGridEl.innerHTML = `
            <div class="empty-vip">
                Unable to load VIP Plans.
            </div>
        `;

        showMessage(
            "VIP Plans failed to load.",
            "error"
        );
    }
}


/* =========================================================
   CHECK IF PLAN IS ACTIVE
   ========================================================= */

function isPlanActive(plan) {

    if (!plan) {
        return false;
    }

    if (
        plan.active === true ||
        plan.status === true ||
        plan.status === "active" ||
        plan.status === "Active"
    ) {

        return true;
    }

    return false;
}


/* =========================================================
   GET PLAN NAME
   ========================================================= */

function getPlanName(plan) {

    return (
        plan.name ||
        plan.vipName ||
        plan.title ||
        "VIP Plan"
    );
}


/* =========================================================
   GET PLAN PRICE
   ========================================================= */

function getPlanPrice(plan) {

    return numberValue(
        plan.price ??
        plan.amount ??
        plan.cost ??
        plan.vipPrice ??
        plan.packagePrice ??
        0
    );
   }


/* =========================================================
   GET DAILY INCOME
   ========================================================= */

function getPlanDailyIncome(plan) {

    return numberValue(
        plan.dailyIncome ??
        plan.daily ??
        plan.dailyProfit ??
        plan.dailyEarning ??
        plan.incomePerDay ??
        0
    );
}


/* =========================================================
   GET TOTAL PROFIT
   ========================================================= */

function getPlanTotalProfit(plan) {

    return numberValue(
        plan.totalProfit ??
        plan.profit ??
        plan.totalIncome ??
        plan.totalEarnings ??
        plan.totalProfitAmount ??
        0
    );
   }


/* =========================================================
   GET PLAN DURATION
   ========================================================= */
function getPlanDuration(plan) {

    return numberValue(
        plan.duration ??
        plan.totalDays ??
        plan.days ??
        plan.durationDays ??
        plan.validityDays ??
        0
    );
}



/* =========================================================
   RENDER VIP PLANS
   ========================================================= */

function renderVIPPlans() {

    if (!vipGridEl) {
        return;
    }

    vipGridEl.innerHTML = "";

    const entries = Object.entries(vipPlans);

    const activePlans = entries.filter(
        ([, plan]) => isPlanActive(plan)
    );

    if (activePlans.length === 0) {

        vipGridEl.innerHTML = `
            <div class="empty-vip">
                No active VIP plans available.
            </div>
        `;

        return;
    }

    activePlans.forEach(
        ([planId, plan]) => {

            const card = createVIPCard(
                planId,
                plan
            );

            vipGridEl.appendChild(card);

        }
    );
}


/* =========================================================
   CHECK OWNED PLAN
   ========================================================= */

function hasOwnedPlan(planId) {

    if (!ownedVIPs) {
        return false;
    }

    if (ownedVIPs[planId]) {
        return true;
    }

    const plan = vipPlans[planId];

    if (!plan) {
        return false;
    }

    const planName = getPlanName(plan);

    for (const key of Object.keys(ownedVIPs)) {

        const owned = ownedVIPs[key];

        if (!owned) {
            continue;
        }

        if (
            owned.vipPlanId === planId ||
            owned.planId === planId
        ) {

            return true;
        }

        if (
            owned.vipName &&
            owned.vipName === planName
        ) {

            return true;
        }
    }

    return false;
}


/* =========================================================
   CREATE VIP CARD
   ========================================================= */

function createVIPCard(planId, plan) {

    const card = document.createElement("div");

    card.className = "vip-card";

    const name = getPlanName(plan);

    const price = getPlanPrice(plan);

    const dailyIncome = getPlanDailyIncome(plan);

    const totalProfit = getPlanTotalProfit(plan);

    const duration = getPlanDuration(plan);

    const alreadyOwned = hasOwnedPlan(planId);

    card.innerHTML = `
        <div class="vip-card-header">

            <div class="vip-icon">
                <i class="fas fa-crown"></i>
            </div>

            <h3>
                ${escapeHTML(name)}
            </h3>

        </div>

        <div class="vip-card-price">
            ${formatMoney(price)}
        </div>

        <div class="vip-details">

            <div class="vip-detail">
                <span>Daily Income</span>
                <strong>
                    ${formatMoney(dailyIncome)}
                </strong>
            </div>

            <div class="vip-detail">
                <span>Total Profit</span>
                <strong>
                    ${formatMoney(totalProfit)}
                </strong>
            </div>

            <div class="vip-detail">
                <span>Duration</span>
                <strong>
                    ${duration} Days
                </strong>
            </div>

        </div>

        <button
            class="buy-vip-btn"
            type="button"
            data-plan-id="${escapeHTML(planId)}"
            ${alreadyOwned ? "disabled" : ""}>

            <i class="fas ${
                alreadyOwned
                    ? "fa-check"
                    : "fa-cart-shopping"
            }"></i>

            ${
                alreadyOwned
                    ? "Already Owned"
                    : "Buy Now"
            }

        </button>
    `;

    const button = card.querySelector(
        ".buy-vip-btn"
    );

    if (button && !alreadyOwned) {

        button.addEventListener(
            "click",
            () => buyVIP(planId, plan, button)
        );

    }

    return card;
}


/* =========================================================
   BUY VIP
   ========================================================= */

async function buyVIP(planId, plan, button) {

    if (!currentUser) {

        showMessage(
            "Please login first.",
            "error"
        );

        return;
    }

    if (!plan) {

        showMessage(
            "VIP plan not found.",
            "error"
        );

        return;
    }

    if (!isPlanActive(plan)) {

        showMessage(
            "This VIP plan is not active.",
            "error"
        );

        return;
    }

    if (hasOwnedPlan(planId)) {

        showMessage(
            "You already own this VIP plan.",
            "error"
        );

        return;
    }

    const price = getPlanPrice(plan);

    if (price <= 0) {

        showMessage(
            "Invalid VIP price.",
            "error"
        );

        return;
    }

    const balance = numberValue(
        userData.balance
    );

    if (balance < price) {

        showMessage(
            `Insufficient balance. You need ${formatMoney(price)}.`,
            "error"
        );

        return;
    }

    const confirmed = confirm(
        `Buy ${getPlanName(plan)} for ${formatMoney(price)}?`
    );

    if (!confirmed) {
        return;
    }

    if (button) {

        button.disabled = true;

        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Processing...
        `;
    }

    try {

        /* -------------------------------------------------
           STEP 1 - CHECK AGAIN FROM DATABASE
           ------------------------------------------------- */

        const userSnapshot = await get(
            ref(db, `users/${currentUser.uid}`)
        );

        if (!userSnapshot.exists()) {

            throw new Error(
                "User account not found."
            );
        }

        const freshUser =
            userSnapshot.val() || {};

        const freshBalance =
            numberValue(freshUser.balance);

        if (freshBalance < price) {

            throw new Error(
                "Insufficient balance."
            );
        }


        /* -------------------------------------------------
           STEP 2 - CHECK VIP ALREADY EXISTS
           ------------------------------------------------- */

        const ownedRef = ref(
            db,
            `vipBuyers/${currentUser.uid}/${planId}`
        );

        const ownedSnapshot =
            await get(ownedRef);

        if (ownedSnapshot.exists()) {

            throw new Error(
                "This VIP plan has already been purchased."
            );
        }


        /* -------------------------------------------------
           STEP 3 - DEDUCT BALANCE SAFELY
           ------------------------------------------------- */

        const balanceRef = ref(
            db,
            `users/${currentUser.uid}/balance`
        );

        const transactionResult =
            await runTransaction(
                balanceRef,
                currentBalance => {

                    const current =
                        numberValue(currentBalance);

                    if (current < price) {

                        return;
                    }

                    return current - price;
                }
            );

        if (!transactionResult.committed) {

            throw new Error(
                "Balance deduction failed."
            );
        }


        /* -------------------------------------------------
           STEP 4 - CREATE VIP BUYER RECORD
           ------------------------------------------------- */

        const purchaseTime =
            Date.now();

        const vipBuyerData = {

            uid: currentUser.uid,

            vipPlanId: planId,

            planId: planId,

            vipName: getPlanName(plan),

            price: price,

            dailyIncome:
                getPlanDailyIncome(plan),

            totalProfit:
                getPlanTotalProfit(plan),

            duration:
                getPlanDuration(plan),

            paymentMethod:
                "Account Balance",

            currency:
                CURRENCY,

            status:
                "active",

            active:
                true,

            purchasedAt:
                purchaseTime,

            activatedAt:
                purchaseTime,

            lastClaim:
                purchaseTime,

            totalClaimed:
                0

        };


        /* -------------------------------------------------
           STEP 5 - CREATE PURCHASE REQUEST / RECORD
           ------------------------------------------------- */

        const purchaseRef =
            push(
                ref(db, "vipPurchaseRequests")
            );

        const requestId =
            purchaseRef.key;


        const purchaseRecord = {

            uid: currentUser.uid,

            vipPlanId: planId,

            planId: planId,

            vipName: getPlanName(plan),

            price: price,

            dailyIncome:
                getPlanDailyIncome(plan),

            totalProfit:
                getPlanTotalProfit(plan),

            duration:
                getPlanDuration(plan),

            paymentMethod:
                "Account Balance",

            currency:
                CURRENCY,

            status:
                "approved",

            purchasedAt:
                purchaseTime,

            approvedAt:
                purchaseTime,

            autoApproved:
                true

        };


        /* -------------------------------------------------
           STEP 6 - TRANSACTION RECORD
           ------------------------------------------------- */

        const transactionRef =
            push(
                ref(
                    db,
                    `transactions/${currentUser.uid}`
                )
            );

        const transactionId =
            transactionRef.key;


        const transactionRecord = {

            id:
                transactionId,

            uid:
                currentUser.uid,

            type:
                "VIP Purchase",

            category:
                "VIP",

            amount:
                price,

            currency:
                CURRENCY,

            description:
                `Purchased ${getPlanName(plan)}`,

            vipPlanId:
                planId,

            status:
                "approved",

            createdAt:
                purchaseTime

        };


        /* -------------------------------------------------
           STEP 7 - REFERRAL BONUS
           ------------------------------------------------- */

        let referralUpdate = {};

        let referralPaid = false;

        const referredBy =
            freshUser.referredBy ||
            freshUser.referrerUid ||
            freshUser.referredByUid ||
            null;


        if (
            referredBy &&
            referredBy !== currentUser.uid
        ) {

            const referralGiven =
                freshUser.referralBonusGiven === true;


            if (!referralGiven) {

                const referrerRef =
                    ref(
                        db,
                        `users/${referredBy}`
                    );

                const referrerSnapshot =
                    await get(referrerRef);


                if (referrerSnapshot.exists()) {

                    const referrer =
                        referrerSnapshot.val() || {};


                    const newReferrerBalance =
                        numberValue(
                            referrer.balance
                        ) + REFERRAL_BONUS;


                    const newReferralBonus =
                        numberValue(
                            referrer.referralBonus
                        ) + REFERRAL_BONUS;


                    const newReferralEarnings =
                        numberValue(
                            referrer.referralEarnings
                        ) + REFERRAL_BONUS;


                    const newReferralCount =
                        numberValue(
                            referrer.referralCount
                        ) + 1;


                    referralUpdate =
                        {

                            [`users/${referredBy}/balance`]:
                                newReferrerBalance,

                            [`users/${referredBy}/bonus`]:
                                numberValue(
                                    referrer.bonus
                                ) + REFERRAL_BONUS,

                            [`users/${referredBy}/referralBonus`]:
                                newReferralBonus,

                            [`users/${referredBy}/referralEarnings`]:
                                newReferralEarnings,

                            [`users/${referredBy}/referralCount`]:
                                newReferralCount

                        };


                    referralPaid = true;

                }

            }

        }


        /* -------------------------------------------------
           STEP 8 - BUILD ALL DATABASE UPDATES
           ------------------------------------------------- */

        const updates = {};


        updates[
            `vipBuyers/${currentUser.uid}/${planId}`
        ] = vipBuyerData;


        updates[
            `vipPurchaseRequests/${requestId}`
        ] = purchaseRecord;


        updates[
            `transactions/${currentUser.uid}/${transactionId}`
        ] = transactionRecord;


        updates[
            `users/${currentUser.uid}/totalTransactions`
        ] =
            numberValue(
                freshUser.totalTransactions
            ) + 1;


        updates[
            `users/${currentUser.uid}/totalEarnings`
        ] =
            numberValue(
                freshUser.totalEarnings
            );


        updates[
            `users/${currentUser.uid}/referralBonusGiven`
        ] =
            referralPaid
                ? true
                : (
                    freshUser.referralBonusGiven === true
                );


        Object.assign(
            updates,
            referralUpdate
        );


        /* -------------------------------------------------
           STEP 9 - WRITE RECORDS
           ------------------------------------------------- */

        try {

            await update(
                ref(db),
                updates
            );

        } catch (writeError) {

            console.error(
                "VIP record write failed:",
                writeError
            );


            /* ---------------------------------------------
               IMPORTANT

               Balance was already deducted.
               Try to restore it if database writes fail.
               --------------------------------------------- */

            try {

                await runTransaction(
                    balanceRef,
                    currentBalance => {

                        return numberValue(
                            currentBalance
                        ) + price;

                    }
                );

            } catch (restoreError) {

                console.error(
                    "Balance restore failed:",
                    restoreError
                );

            }

            throw writeError;
        }


        /* -------------------------------------------------
           STEP 10 - REFRESH USER DATA
           ------------------------------------------------- */

        const refreshedUser =
            await get(
                ref(
                    db,
                    `users/${currentUser.uid}`
                )
            );

        if (refreshedUser.exists()) {

            userData =
                refreshedUser.val() || {};

        }


        /* -------------------------------------------------
           STEP 11 - REFRESH OWNED VIPS
           ------------------------------------------------- */

        await loadOwnedVIPs();

        updateBalanceUI();

        updateVIPSummary();

        renderVIPPlans();


        /* -------------------------------------------------
           SUCCESS MESSAGE
           ------------------------------------------------- */

        if (referralPaid) {

            showMessage(
                `${getPlanName(plan)} activated successfully. Your referrer received ${formatMoney(REFERRAL_BONUS)}.`,
                "success"
            );

        } else {

            showMessage(
                `${getPlanName(plan)} activated successfully.`,
                "success"
            );

        }

    } catch (error) {

        console.error(
            "VIP purchase error:",
            error
        );


        let message =
            "VIP purchase failed.";


        if (
            error.message &&
            error.message.length > 0
        ) {

            message =
                error.message;
        }


        if (
            error.code ===
            "PERMISSION_DENIED"
        ) {

            message =
                "Firebase permission denied. Check your Realtime Database Rules.";
        }


        showMessage(
            message,
            "error"
        );


        renderVIPPlans();
    }
}


/* =========================================================
   LOAD OWNED VIPS
   ========================================================= */

async function loadOwnedVIPs() {

    if (!currentUser) {
        return;
    }

    try {

        const snapshot =
            await get(
                ref(
                    db,
                    `vipBuyers/${currentUser.uid}`
                )
            );


        if (!snapshot.exists()) {

            ownedVIPs = {};

        } else {

            ownedVIPs =
                snapshot.val() || {};

        }


        renderOwnedVIPs();

        updateVIPSummary();

    } catch (error) {

        console.error(
            "Owned VIP load error:",
            error
        );

        ownedVIPs = {};

        renderOwnedVIPs();
    }
}


/* =========================================================
   RENDER OWNED VIPS
   ========================================================= */

function renderOwnedVIPs() {

    if (!ownedVipListEl) {
        return;
    }

    ownedVipListEl.innerHTML = "";


    const entries =
        Object.entries(ownedVIPs || {});


    if (entries.length === 0) {

        ownedVipListEl.innerHTML = `
            <div class="empty-vip">
                No VIP purchased.
            </div>
        `;

        return;
    }


    entries.forEach(
        ([planId, vip]) => {

            if (!vip) {
                return;
            }

            const item =
                document.createElement("div");

            item.className =
                "owned-vip-item";


            const vipName =
                vip.vipName ||
                (
                    vipPlans[planId]
                        ? getPlanName(
                            vipPlans[planId]
                        )
                        : "VIP Plan"
                );


            const daily =
                numberValue(
                    vip.dailyIncome
                );


            const status =
                String(
                    vip.status ||
                    "active"
                ).toLowerCase();


            item.innerHTML = `

                <div class="owned-vip-info">

                    <h4>
                        <i class="fas fa-crown"></i>
                        ${escapeHTML(vipName)}
                    </h4>

                    <p>
                        Daily:
                        <strong>
                            ${formatMoney(daily)}
                        </strong>
                    </p>

                </div>

                <div class="owned-vip-status">

                    <span class="vip-status active">
                        ${escapeHTML(status)}
                    </span>

                </div>

            `;


            ownedVipListEl.appendChild(
                item
            );

        }
    );
}


/* =========================================================
   UPDATE VIP SUMMARY
   ========================================================= */

function updateVIPSummary() {

    const activeVIPs =
        Object.entries(
            ownedVIPs || {}
        )
        .filter(
            ([, vip]) =>
                vip &&
                (
                    vip.active === true ||
                    String(
                        vip.status || ""
                    ).toLowerCase() === "active"
                )
        );


    if (activeVIPs.length === 0) {

        if (currentVipEl) {
            currentVipEl.textContent =
                "VIP 0";
        }

        if (dailyIncomeEl) {
            dailyIncomeEl.textContent =
                formatMoney(0);
        }

        if (totalProfitEl) {
            totalProfitEl.textContent =
                formatMoney(0);
        }

        if (claimTimerEl) {
            claimTimerEl.textContent =
                "No Active VIP";
        }

        if (claimButtonEl) {

            claimButtonEl.disabled =
                true;

            claimButtonEl.innerHTML = `
                <i class="fas fa-lock"></i>
                Claim Daily Income
            `;
        }

        stopClaimTimer();

        return;
    }


    let totalDailyIncome = 0;

    let totalProfit = 0;

    let highestVIP = null;


    activeVIPs.forEach(
        ([planId, vip]) => {

            totalDailyIncome +=
                numberValue(
                    vip.dailyIncome
                );

            totalProfit +=
                numberValue(
                    vip.totalProfit
                );


            if (!highestVIP) {

                highestVIP = {
                    planId,
                    vip
                };

                return;
            }


            const currentDaily =
                numberValue(
                    vip.dailyIncome
                );


            const highestDaily =
                numberValue(
                    highestVIP.vip.dailyIncome
                );


            if (
                currentDaily >
                highestDaily
            ) {

                highestVIP = {
                    planId,
                    vip
                };

            }

        }
    );


    if (currentVipEl) {

        currentVipEl.textContent =
            highestVIP
                ? (
                    highestVIP.vip.vipName ||
                    "VIP"
                )
                : "VIP 0";
    }


    if (dailyIncomeEl) {

        dailyIncomeEl.textContent =
            formatMoney(
                totalDailyIncome
            );
    }


    if (totalProfitEl) {

        totalProfitEl.textContent =
            formatMoney(
                totalProfit
            );
    }


    prepareClaimTimer(
        activeVIPs
    );
}


/* =========================================================
   FIND NEXT CLAIM
   ========================================================= */

function prepareClaimTimer(activeVIPs) {

    let nextClaimTime =
        Infinity;


    activeVIPs.forEach(
        ([, vip]) => {

            const lastClaim =
                numberValue(
                    vip.lastClaim
                );


            const nextClaim =
                lastClaim +
                CLAIM_INTERVAL;


            if (
                nextClaim <
                nextClaimTime
            ) {

                nextClaimTime =
                    nextClaim;
            }

        }
    );


    if (
        nextClaimTime ===
        Infinity
    ) {

        stopClaimTimer();

        return;
    }


    updateClaimTimer(
        activeVIPs
    );
}


/* =========================================================
   UPDATE CLAIM TIMER
   ========================================================= */

function updateClaimTimer(activeVIPs) {

    stopClaimTimer();


    const update = () => {

        const now =
            Date.now();


        let available =
            false;


        let earliestRemaining =
            Infinity;


        activeVIPs.forEach(
            ([, vip]) => {

                const lastClaim =
                    numberValue(
                        vip.lastClaim
                    );


                const nextClaim =
                    lastClaim +
                    CLAIM_INTERVAL;


                if (
                    now >= nextClaim
                ) {

                    available =
                        true;

                } else {

                    const remaining =
                        nextClaim -
                        now;


                    if (
                        remaining <
                        earliestRemaining
                    ) {

                        earliestRemaining =
                            remaining;
                    }

                }

            }
        );


        if (available) {

            if (claimTimerEl) {

                claimTimerEl.textContent =
                    "Daily income is ready to claim.";
            }


            if (claimButtonEl) {

                claimButtonEl.disabled =
                    false;

                claimButtonEl.innerHTML = `
                    <i class="fas fa-coins"></i>
                    Claim Daily Income
                `;

            }

            return;
        }


        if (
            earliestRemaining !==
            Infinity
        ) {

            const seconds =
                Math.floor(
                    earliestRemaining / 1000
                );


            const hours =
                Math.floor(
                    seconds / 3600
                );


            const minutes =
                Math.floor(
                    (seconds % 3600) /
                    60
                );


            const secs =
                seconds % 60;


            if (claimTimerEl) {

                claimTimerEl.textContent =
                    `Next claim in ${hours}h ${minutes}m ${secs}s`;
            }

        }


        if (claimButtonEl) {

            claimButtonEl.disabled =
                true;

            claimButtonEl.innerHTML = `
                <i class="fas fa-lock"></i>
                Claim Daily Income
            `;
        }

    };


    update();


    claimTimerInterval =
        setInterval(
            update,
            1000
        );
}


/* =========================================================
   STOP CLAIM TIMER
   ========================================================= */

function stopClaimTimer() {

    if (claimTimerInterval) {

        clearInterval(
            claimTimerInterval
        );

        claimTimerInterval =
            null;
    }
}


/* =========================================================
   CLAIM DAILY INCOME
   ========================================================= */

async function claimDailyIncome() {

    if (!currentUser) {

        showMessage(
            "Please login first.",
            "error"
        );

        return;
    }


    if (claimButtonEl) {

        claimButtonEl.disabled =
            true;

        claimButtonEl.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Claiming...
        `;
    }


    try {

        const userSnapshot =
            await get(
                ref(
                    db,
                    `users/${currentUser.uid}`
                )
            );


        if (!userSnapshot.exists()) {

            throw new Error(
                "User account not found."
            );
        }


        const freshUser =
            userSnapshot.val() || {};


        const vipSnapshot =
            await get(
                ref(
                    db,
                    `vipBuyers/${currentUser.uid}`
                )
            );


        if (!vipSnapshot.exists()) {

            throw new Error(
                "No active VIP found."
            );
        }


        const freshVIPs =
            vipSnapshot.val() || {};


        let totalIncome =
            0;

        const updates = {};

        let claimedAny =
            false;


        for (
            const [planId, vip]
            of Object.entries(freshVIPs)
        ) {

            if (!vip) {
                continue;
            }


            const status =
                String(
                    vip.status ||
                    ""
                ).toLowerCase();


            const active =
                vip.active === true ||
                status === "active";


            if (!active) {
                continue;
            }


            const dailyIncome =
                numberValue(
                    vip.dailyIncome
                );


            if (dailyIncome <= 0) {
                continue;
            }


            const lastClaim =
                numberValue(
                    vip.lastClaim
                );


            const now =
                Date.now();


            if (
                now -
                lastClaim <
                CLAIM_INTERVAL
            ) {

                continue;
            }


            totalIncome +=
                dailyIncome;


            claimedAny =
                true;


            updates[
                `vipBuyers/${currentUser.uid}/${planId}/lastClaim`
            ] =
                now;


            updates[
                `vipBuyers/${currentUser.uid}/${planId}/totalClaimed`
            ] =
                numberValue(
                    vip.totalClaimed
                ) + dailyIncome;

        }


        if (!claimedAny) {

            throw new Error(
                "Daily income is not ready yet."
            );
        }


        /* -------------------------------------------------
           ADD INCOME TO BALANCE SAFELY
           ------------------------------------------------- */

        const balanceRef =
            ref(
                db,
                `users/${currentUser.uid}/balance`
            );


        const balanceTransaction =
            await runTransaction(
                balanceRef,
                currentBalance => {

                    return (
                        numberValue(
                            currentBalance
                        ) +
                        totalIncome
                    );

                }
            );


        if (
            !balanceTransaction.committed
        ) {

            throw new Error(
                "Could not update balance."
            );
        }


        /* -------------------------------------------------
           UPDATE USER TOTAL EARNINGS
           ------------------------------------------------- */

        updates[
            `users/${currentUser.uid}/totalEarnings`
        ] =
            numberValue(
                freshUser.totalEarnings
            ) + totalIncome;


        updates[
            `users/${currentUser.uid}/totalTransactions`
        ] =
            numberValue(
                freshUser.totalTransactions
            ) + 1;


        /* -------------------------------------------------
           CREATE TRANSACTION
           ------------------------------------------------- */

        const transactionRef =
            push(
                ref(
                    db,
                    `transactions/${currentUser.uid}`
                )
            );


        const transactionId =
            transactionRef.key;


        updates[
            `transactions/${currentUser.uid}/${transactionId}`
        ] = {

            id:
                transactionId,

            uid:
                currentUser.uid,

            type:
                "Daily Income",

            category:
                "VIP",

            amount:
                totalIncome,

            currency:
                CURRENCY,

            description:
                "VIP daily income",

            status:
                "approved",

            createdAt:
                Date.now()

        };


        /* -------------------------------------------------
           SAVE CLAIM DATA
           ------------------------------------------------- */

        try {

            await update(
                ref(db),
                updates
            );

        } catch (updateError) {

            console.error(
                "Claim update failed:",
                updateError
            );


            /* Restore balance if record update failed */

            try {

                await runTransaction(
                    balanceRef,
                    currentBalance => {

                        return (
                            numberValue(
                                currentBalance
                            ) -
                            totalIncome
                        );

                    }
                );

            } catch (restoreError) {

                console.error(
                    "Income restore failed:",
                    restoreError
                );

            }


            throw updateError;
        }


        /* -------------------------------------------------
           REFRESH
           ------------------------------------------------- */

        const refreshedUser =
            await get(
                ref(
                    db,
                    `users/${currentUser.uid}`
                )
            );


        if (refreshedUser.exists()) {

            userData =
                refreshedUser.val() || {};

        }


        await loadOwnedVIPs();


        updateBalanceUI();

        updateVIPSummary();


        showMessage(
            `You received ${formatMoney(totalIncome)} daily income.`,
            "success"
        );

    } catch (error) {

        console.error(
            "Claim error:",
            error
        );


        let message =
            "Daily income claim failed.";


        if (
            error.message
        ) {

            message =
                error.message;
        }


        if (
            error.code ===
            "PERMISSION_DENIED"
        ) {

            message =
                "Firebase permission denied. Check your database rules.";
        }


        showMessage(
            message,
            "error"
        );


        updateVIPSummary();
    }
}


/* =========================================================
   MOBILE MENU
   ========================================================= */

if (menuBtn && sidebar) {

    menuBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();

            sidebar.classList.toggle(
                "active"
            );

        }
    );

}


/* =========================================================
   CLOSE SIDEBAR WHEN LINK IS CLICKED
   ========================================================= */

if (sidebar) {

    sidebar
        .querySelectorAll("a")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "active"
                    );

                }
            );

        });

}


/* =========================================================
   LOGOUT
   ========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                showMessage(
                    "Logout failed.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   CLAIM BUTTON
   ========================================================= */

if (claimButtonEl) {

    claimButtonEl.addEventListener(
        "click",
        claimDailyIncome
    );

}


/* =========================================================
   AUTH STATE
   ========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        try {

            if (!user) {

                window.location.href =
                    "login.html";

                return;
            }


            currentUser =
                user;


            await loadCurrentUser(
                user.uid
            );


            startBalanceListener(
                user.uid
            );


            await loadVIPPlans();


            await loadOwnedVIPs();


            renderVIPPlans();


            updateBalanceUI();

            updateVIPSummary();


        } catch (error) {

            console.error(
                "VIP initialization error:",
                error
            );


            showMessage(
                "Unable to load your VIP account.",
                "error"
            );

        }

    }
);


/* =========================================================
   PAGE CLEANUP
   ========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopClaimTimer();

        if (balanceListener) {

            balanceListener();

            balanceListener =
                null;
        }

    }
);
