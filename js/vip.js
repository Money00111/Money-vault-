/* =========================================================
   MONEY VAULT - VIP.JS
   AUTOMATIC VIP PURCHASE VERSION

   CURRENCY: RWF / FRW

   FEATURES
   ---------------------------------------------------------
   1. User buys VIP automatically
   2. Balance is deducted immediately
   3. VIP becomes ACTIVE immediately
   4. No Admin approval required
   5. Same VIP plan cannot be bought twice
   6. Different VIP plans can be owned together
   7. Daily income available after 24 hours
   8. Referral bonus = 1,000 RWF
   9. Referral bonus paid once only
   10. Referral bonus goes to referrer's balance
   11. Transaction records created
   12. Realtime Firebase listeners
   13. Mobile sidebar
========================================================= */

import {
    auth,
    db
} from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    set,
    update,
    onValue,
    runTransaction,
    push,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   CONFIG
========================================================= */

const CURRENCY = "RWF";

const REFERRAL_BONUS = 1000;

const DAY_MS = 24 * 60 * 60 * 1000;

const VIP_PLANS_PATH = "vipPlans";
const USERS_PATH = "users";
const VIP_BUYERS_PATH = "vipBuyers";
const TRANSACTIONS_PATH = "transactions";


/* =========================================================
   STATE
========================================================= */

let currentUser = null;

let userData = {};

let vipPlans = {};

let ownedVIPs = [];

let selectedClaimVIP = null;

let claimInterval = null;

let userUnsubscribe = null;
let plansUnsubscribe = null;
let buyersUnsubscribe = null;


/* =========================================================
   DOM
========================================================= */

const balanceEl =
    document.getElementById("balance");

const vipGrid =
    document.getElementById("vipGrid");

const ownedVipList =
    document.getElementById("ownedVipList");

const currentVipEl =
    document.getElementById("currentVip");

const dailyIncomeEl =
    document.getElementById("dailyIncome");

const totalProfitEl =
    document.getElementById("totalProfit");

const claimTimerEl =
    document.getElementById("claimTimer");

const claimButton =
    document.getElementById("claimDailyIncome");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const logoutBtn =
    document.getElementById("logoutBtn");


/* =========================================================
   HELPERS
========================================================= */

function numberValue(value) {

    const n = Number(value);

    return Number.isFinite(n) ? n : 0;
}


function money(value) {

    return `${numberValue(value).toLocaleString()} ${CURRENCY}`;

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function normalizeStatus(status) {

    return String(status ?? "")
        .trim()
        .toLowerCase();

}


function getPlanName(plan) {

    return (
        plan.vipName ||
        plan.name ||
        "VIP"
    );

}


function getPlanDays(plan) {

    return numberValue(
        plan.totalDays ??
        plan.duration ??
        plan.days ??
        30
    );

}


function getPlanPrice(plan) {

    return numberValue(
        plan.price ??
        plan.amount ??
        0
    );

}


function getDailyIncome(plan) {

    return numberValue(
        plan.dailyIncome ??
        plan.daily ??
        0
    );

}


function getTotalProfit(plan) {

    const savedProfit =
        numberValue(plan.totalProfit);

    if (savedProfit > 0) {

        return savedProfit;

    }

    return (
        getDailyIncome(plan) *
        getPlanDays(plan)
    );

}


function getPlanClass(name) {

    const text =
        String(name ?? "")
            .toLowerCase();

    if (text.includes("bronze"))
        return "bronze";

    if (text.includes("starter"))
        return "starter";

    if (text.includes("silver"))
        return "silver";

    if (text.includes("gold"))
        return "gold";

    if (text.includes("platinum"))
        return "platinum";

    if (text.includes("diamond"))
        return "diamond";

    if (text.includes("premium"))
        return "premium";

    if (text.includes("elite"))
        return "elite";

    if (text.includes("royal"))
        return "royal";

    if (text.includes("ultimate"))
        return "ultimate";

    return "starter";

}


/* =========================================================
   TOAST
========================================================= */

function showToast(message, success = true) {

    let toast =
        document.querySelector(".toast");

    if (!toast) {

        toast =
            document.createElement("div");

        toast.className = "toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.style.background =
        success
            ? "linear-gradient(135deg,#16a34a,#22c55e)"
            : "linear-gradient(135deg,#dc2626,#ef4444)";

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3500);

}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href =
            "login.html";

        return;

    }

    currentUser = user;

    await startVIPSystem();

});


/* =========================================================
   START SYSTEM
========================================================= */

async function startVIPSystem() {

    try {

        await loadUserOnce();

        startUserListener();

        startPlansListener();

        startBuyersListener();

        setupMenu();

        setupLogout();

        startClaimTimer();

    } catch (error) {

        console.error(
            "VIP system error:",
            error
        );

        showToast(
            "Failed to load VIP system.",
            false
        );

    }

}


/* =========================================================
   LOAD USER
========================================================= */

async function loadUserOnce() {

    const snapshot =
        await get(
            ref(
                db,
                `${USERS_PATH}/${currentUser.uid}`
            )
        );

    if (!snapshot.exists()) {

        throw new Error(
            "User account not found."
        );

    }

    userData =
        snapshot.val() || {};

    updateBalanceUI();

}


/* =========================================================
   USER LISTENER
========================================================= */

function startUserListener() {

    if (userUnsubscribe)
        userUnsubscribe();

    const userRef =
        ref(
            db,
            `${USERS_PATH}/${currentUser.uid}`
        );

    userUnsubscribe =
        onValue(userRef, snapshot => {

            userData =
                snapshot.val() || {};

            updateBalanceUI();

            updateHeroStats();

        });

}


/* =========================================================
   PLANS LISTENER
========================================================= */

function startPlansListener() {

    if (plansUnsubscribe)
        plansUnsubscribe();

    const plansRef =
        ref(db, VIP_PLANS_PATH);

    plansUnsubscribe =
        onValue(plansRef, snapshot => {

            vipPlans =
                snapshot.val() || {};

            renderVIPPlans();

            updateHeroStats();

        });

}


/* =========================================================
   BUYERS LISTENER
========================================================= */

function startBuyersListener() {

    if (buyersUnsubscribe)
        buyersUnsubscribe();

    const buyersRef =
        ref(
            db,
            `${VIP_BUYERS_PATH}/${currentUser.uid}`
        );

    buyersUnsubscribe =
        onValue(
            buyersRef,
            snapshot => {

                const data =
                    snapshot.val() || {};

                ownedVIPs =
                    Object.entries(data)
                        .map(([id, value]) => ({
                            id,
                            ...(value || {})
                        }));

                renderOwnedVIPs();

                renderVIPPlans();

                updateHeroStats();

                updateClaimVIP();

            }
        );

}


/* =========================================================
   UPDATE BALANCE UI
========================================================= */

function updateBalanceUI() {

    if (!balanceEl)
        return;

    balanceEl.textContent =
        money(userData.balance);

}


/* =========================================================
   GET ACTIVE VIPS
========================================================= */

function getActiveVIPs() {

    const now =
        Date.now();

    return ownedVIPs.filter(vip => {

        const status =
            normalizeStatus(vip.status);

        if (
            status &&
            status !== "active"
        ) {

            return false;

        }

        const start =
            numberValue(
                vip.startTime ||
                vip.approvedAt ||
                vip.createdAt
            );

        const days =
            numberValue(
                vip.totalDays ||
                vip.duration ||
                30
            );

        if (!start)
            return true;

        const expiry =
            start +
            days * DAY_MS;

        return now < expiry;

    });

}


/* =========================================================
   RENDER VIP PLANS
========================================================= */

function renderVIPPlans() {

    if (!vipGrid)
        return;

    const entries =
        Object.entries(vipPlans || {});

    if (!entries.length) {

        vipGrid.innerHTML = `
            <div style="
                grid-column:1/-1;
                text-align:center;
                padding:40px;
                color:#cbd5e1;
            ">
                No VIP plans available.
            </div>
        `;

        return;

    }

    const ownedIds =
        new Set(
            ownedVIPs.map(v =>
                String(
                    v.vipPlanId ||
                    v.planId ||
                    ""
                )
            )
        );

    vipGrid.innerHTML =
        entries.map(([planId, rawPlan]) => {

            const plan =
                rawPlan || {};

            const name =
                getPlanName(plan);

            const price =
                getPlanPrice(plan);

            const daily =
                getDailyIncome(plan);

            const days =
                getPlanDays(plan);

            const profit =
                getTotalProfit(plan);

            const className =
                getPlanClass(name);

            const alreadyOwned =
                ownedIds.has(
                    String(planId)
                );

            return `

                <div class="vip-card ${className} ${
                    alreadyOwned ? "active" : ""
                }">

                    <div class="vip-badge">
                        ${
                            alreadyOwned
                                ? "ACTIVE"
                                : "VIP PLAN"
                        }
                    </div>

                    <i class="fas fa-crown vip-icon"></i>

                    <h2>
                        ${escapeHTML(name)}
                    </h2>

                    <h1>
                        ${money(price)}
                    </h1>

                    <ul>

                        <li>
                            <i class="fas fa-coins"></i>
                            Daily Income:
                            <strong>
                                ${money(daily)}
                            </strong>
                        </li>

                        <li>
                            <i class="fas fa-calendar"></i>
                            Duration:
                            <strong>
                                ${days} Days
                            </strong>
                        </li>

                        <li>
                            <i class="fas fa-chart-line"></i>
                            Total Profit:
                            <strong>
                                ${money(profit)}
                            </strong>
                        </li>

                        <li>
                            <i class="fas fa-bolt"></i>
                            Automatic Activation
                        </li>

                        <li>
                            <i class="fas fa-clock"></i>
                            First claim after 24 hours
                        </li>

                    </ul>

                    <button
                        class="buyVipBtn"
                        type="button"
                        data-plan-id="${escapeHTML(planId)}"
                        ${
                            alreadyOwned
                                ? "disabled"
                                : ""
                        }
                    >

                        <i class="fas ${
                            alreadyOwned
                                ? "fa-check"
                                : "fa-cart-shopping"
                        }"></i>

                        ${
                            alreadyOwned
                                ? "Already Active"
                                : "Buy Now"
                        }

                    </button>

                </div>

            `;

        }).join("");

    document
        .querySelectorAll(".buyVipBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const planId =
                        button.dataset.planId;

                    buyVIP(planId);

                }
            );

        });

}


/* =========================================================
   BUY VIP AUTOMATICALLY
========================================================= */

async function buyVIP(planId) {

    if (!currentUser)
        return;

    const plan =
        vipPlans?.[planId];

    if (!plan) {

        showToast(
            "VIP plan not found.",
            false
        );

        return;

    }

    const price =
        getPlanPrice(plan);

    const dailyIncome =
        getDailyIncome(plan);

    const totalDays =
        getPlanDays(plan);

    const totalProfit =
        getTotalProfit(plan);

    const vipName =
        getPlanName(plan);

    if (price <= 0) {

        showToast(
            "Invalid VIP price.",
            false
        );

        return;

    }


    /* -----------------------------------------------------
       PREVENT SAME VIP TWICE
    ----------------------------------------------------- */

    const alreadyOwned =
        ownedVIPs.some(vip => {

            return String(
                vip.vipPlanId ||
                vip.planId ||
                ""
            ) === String(planId);

        });

    if (alreadyOwned) {

        showToast(
            "You already own this VIP plan.",
            false
        );

        return;

    }


    /* -----------------------------------------------------
       CHECK BALANCE
    ----------------------------------------------------- */

    const balance =
        numberValue(
            userData.balance
        );

    if (balance < price) {

        showToast(
            `Insufficient balance. You need ${money(price)}.`,
            false
        );

        return;

    }


    /* -----------------------------------------------------
       CONFIRM
    ----------------------------------------------------- */

    const confirmed =
        confirm(
            `Buy ${vipName} for ${money(price)}?\n\n` +
            `Your balance will be reduced immediately.`
        );

    if (!confirmed)
        return;


    /* -----------------------------------------------------
       DISABLE ALL BUY BUTTONS
    ----------------------------------------------------- */

    document
        .querySelectorAll(".buyVipBtn")
        .forEach(btn => {

            btn.disabled = true;

        });


    try {

        const now =
            Date.now();

        const requestId =
            push(
                ref(
                    db,
                    `${VIP_BUYERS_PATH}/${currentUser.uid}`
                )
            ).key;


        if (!requestId) {

            throw new Error(
                "Could not create VIP ID."
            );

        }


        /* =================================================
           STEP 1
           ATOMIC BALANCE DEDUCTION
        ================================================= */

        const userRef =
            ref(
                db,
                `${USERS_PATH}/${currentUser.uid}`
            );

        let deductionSuccess =
            false;

        await runTransaction(
            userRef,
            current => {

                if (!current)
                    return;

                const currentBalance =
                    numberValue(
                        current.balance
                    );

                if (
                    currentBalance <
                    price
                ) {

                    return;

                }

                current.balance =
                    currentBalance -
                    price;

                current.totalTransactions =
                    numberValue(
                        current.totalTransactions
                    ) + 1;

                current.totalVipPurchases =
                    numberValue(
                        current.totalVipPurchases
                    ) + 1;

                return current;

            }
        ).then(result => {

            deductionSuccess =
                result.committed;

        });


        if (!deductionSuccess) {

            throw new Error(
                "Balance deduction failed."
            );

        }


        /* =================================================
           STEP 2
           CREATE ACTIVE VIP
        ================================================= */

        const buyerData = {

            uid:
                currentUser.uid,

            userId:
                currentUser.uid,

            vipBuyerId:
                requestId,

            vipPlanId:
                planId,

            planId:
                planId,

            vipName:
                vipName,

            price:
                price,

            dailyIncome:
                dailyIncome,

            totalProfit:
                totalProfit,

            duration:
                totalDays,

            totalDays:
                totalDays,

            currency:
                CURRENCY,

            paymentMethod:
                "Account Balance",

            status:
                "active",

            active:
                true,

            createdAt:
                now,

            activatedAt:
                now,

            startTime:
                now,

            lastClaim:
                now,

            totalClaimed:
                0,

            claimCount:
                0,

            userName:
                userData.fullName ||
                "",

            phone:
                userData.phone ||
                "",

            email:
                userData.email ||
                ""

        };


        await set(
            ref(
                db,
                `${VIP_BUYERS_PATH}/${currentUser.uid}/${requestId}`
            ),
            buyerData
        );


        /* =================================================
           STEP 3
           TRANSACTION RECORD
        ================================================= */

        const transactionId =
            push(
                ref(
                    db,
                    `${TRANSACTIONS_PATH}/${currentUser.uid}`
                )
            ).key;

        if (transactionId) {

            await set(
                ref(
                    db,
                    `${TRANSACTIONS_PATH}/${currentUser.uid}/${transactionId}`
                ),
                {

                    type:
                        "vip_purchase",

                    category:
                        "VIP Purchase",

                    uid:
                        currentUser.uid,

                    vipPlanId:
                        planId,

                    vipName:
                        vipName,

                    amount:
                        price,

                    currency:
                        CURRENCY,

                    status:
                        "completed",

                    description:
                        `Purchased ${vipName}`,

                    createdAt:
                        now

                }
            );

        }


        /* =================================================
           STEP 4
           REFERRAL BONUS
        ================================================= */

        await processReferralBonus(
            now,
            vipName,
            planId
        );


        /* =================================================
           SUCCESS
        ================================================= */

        showToast(
            `${vipName} activated successfully!`
        );

        renderVIPPlans();

        updateHeroStats();

        updateClaimVIP();


    } catch (error) {

        console.error(
            "Automatic VIP purchase error:",
            error
        );

        showToast(
            "VIP purchase failed: " +
            (error?.message ||
                "Unknown error"),
            false
        );

        /*
         IMPORTANT:
         If VIP creation failed AFTER balance deduction,
         the balance is restored below.
        */

        try {

            await runTransaction(
                ref(
                    db,
                    `${USERS_PATH}/${currentUser.uid}`
                ),
                current => {

                    if (!current)
                        return;

                    current.balance =
                        numberValue(
                            current.balance
                        ) + price;

                    current.totalTransactions =
                        Math.max(
                            0,
                            numberValue(
                                current.totalTransactions
                            ) - 1
                        );

                    current.totalVipPurchases =
                        Math.max(
                            0,
                            numberValue(
                                current.totalVipPurchases
                            ) - 1
                        );

                    return current;

                }
            );

        } catch (rollbackError) {

            console.error(
                "Balance rollback failed:",
                rollbackError
            );

        }

    } finally {

        document
            .querySelectorAll(".buyVipBtn")
            .forEach(btn => {

                btn.disabled = false;

            });

    }

}


/* =========================================================
   REFERRAL BONUS
   1,000 RWF
   PAID ONCE AFTER VIP PURCHASE
========================================================= */

async function processReferralBonus(
    purchaseTime,
    vipName,
    planId
) {

    try {


/* -------------------------------------------------
   GET REFERRER UID
   Supports both:
   - Firebase UID
   - Referral Code
------------------------------------------------- */

const referrerValue =
    String(
        userData.referredBy ||
        userData.referrerUid ||
        userData.referrerId ||
        userData.referralCodeUsed ||
        ""
    ).trim();

if (!referrerValue) {

    console.log(
        "No referrer found for this user."
    );

    return;

}

let referrerUid = referrerValue;


/* -------------------------------------------------
   FIRST: CHECK IF VALUE IS A REAL USER UID
------------------------------------------------- */

let referrerRef =
    ref(
        db,
        `${USERS_PATH}/${referrerValue}`
    );

let referrerSnapshot =
    await get(referrerRef);


/* -------------------------------------------------
   IF NOT UID, SEARCH BY referralCode
------------------------------------------------- */

if (!referrerSnapshot.exists()) {

    const usersQuery =
        query(
            ref(db, USERS_PATH),
            orderByChild("referralCode"),
            equalTo(referrerValue)
        );

    const codeSnapshot =
        await get(usersQuery);

    if (codeSnapshot.exists()) {

        const matches =
            codeSnapshot.val();

        const firstMatch =
            Object.entries(matches)[0];

        if (firstMatch) {

            referrerUid =
                firstMatch[0];

            referrerRef =
                ref(
                    db,
                    `${USERS_PATH}/${referrerUid}`
                );

            referrerSnapshot =
                await get(referrerRef);

        }

    }

}


/* -------------------------------------------------
   CHECK REFERRER EXISTS
------------------------------------------------- */

if (!referrerSnapshot.exists()) {

    console.error(
        "Referrer user not found:",
        referrerValue
    );

    return;

}


/* -------------------------------------------------
   PREVENT SELF REFERRAL
------------------------------------------------- */

if (
    referrerUid ===
    currentUser.uid
) {

    console.log(
        "Invalid self-referral."
    );

    return;

}
       
        /* -------------------------------------------------
           CHECK BONUS ALREADY GIVEN
        ------------------------------------------------- */

        const markerRef =
            ref(
                db,
                `${USERS_PATH}/${currentUser.uid}/referralBonusGiven`
            );


        const markerSnapshot =
            await get(markerRef);


        if (
            markerSnapshot.exists() &&
            markerSnapshot.val() === true
        ) {

            console.log(
                "Referral bonus already paid."
            );

            return;

        }


        /* -------------------------------------------------
           PAY REFERRER
        ------------------------------------------------- */

        const bonusResult =
            await runTransaction(
                referrerRef,
                referrer => {

                    if (!referrer)
                        return;

                    referrer.balance =
                        numberValue(
                            referrer.balance
                        ) + REFERRAL_BONUS;

                    referrer.referralBonus =
                        numberValue(
                            referrer.referralBonus
                        ) + REFERRAL_BONUS;

                    referrer.referralEarnings =
                        numberValue(
                            referrer.referralEarnings
                        ) + REFERRAL_BONUS;

                    referrer.referralCount =
                        numberValue(
                            referrer.referralCount
                        ) + 1;

                    referrer.totalEarnings =
                        numberValue(
                            referrer.totalEarnings
                        ) + REFERRAL_BONUS;

                    return referrer;

                }
            );


        if (!bonusResult.committed) {

            throw new Error(
                "Referral bonus transaction failed."
            );

        }


        /* -------------------------------------------------
           MARK BONUS AS PAID
        ------------------------------------------------- */

        await set(
            markerRef,
            true
        );


        /* -------------------------------------------------
           CREATE REFERRAL TRANSACTION
        ------------------------------------------------- */

        const transactionId =
            push(
                ref(
                    db,
                    `${TRANSACTIONS_PATH}/${referrerUid}`
                )
            ).key;


        if (transactionId) {

            await set(
                ref(
                    db,
                    `${TRANSACTIONS_PATH}/${referrerUid}/${transactionId}`
                ),
                {

                    type:
                        "referral_bonus",

                    category:
                        "Referral Bonus",

                    uid:
                        referrerUid,

                    referredUser:
                        currentUser.uid,

                    amount:
                        REFERRAL_BONUS,

                    currency:
                        CURRENCY,

                    vipPlanId:
                        planId,

                    vipName:
                        vipName,

                    status:
                        "completed",

                    description:
                        "Referral bonus from VIP purchase",

                    createdAt:
                        purchaseTime

                }
            );

        }


        /* -------------------------------------------------
           SUCCESS MESSAGE
        ------------------------------------------------- */

        showToast(
            `Referral bonus ${money(
                REFERRAL_BONUS
            )} paid to your referrer.`
        );


        console.log(
            "Referral bonus paid:",
            REFERRAL_BONUS,
            "RWF to:",
            referrerUid
        );


    } catch (error) {

        console.error(
            "Referral bonus error:",
            error
        );

        /*
          IMPORTANT:
          VIP purchase itself should NOT fail
          because referral bonus failed.
        */

        showToast(
            "VIP purchased successfully, but referral bonus could not be processed.",
            false
        );

    }

}

/* =========================================================
   RENDER OWNED VIPS
========================================================= */

function renderOwnedVIPs() {

    if (!ownedVipList)
        return;

    if (!ownedVIPs.length) {

        ownedVipList.innerHTML = `
            <div class="empty-vip">
                No VIP purchased.
            </div>
        `;

        return;

    }


    const now =
        Date.now();


    ownedVipList.innerHTML =
        ownedVIPs.map(vip => {

            const name =
                vip.vipName ||
                "VIP";

            const daily =
                numberValue(
                    vip.dailyIncome
                );

            const totalProfit =
                numberValue(
                    vip.totalProfit
                );

            const days =
                numberValue(
                    vip.totalDays ||
                    vip.duration ||
                    30
                );

            const start =
                numberValue(
                    vip.startTime ||
                    vip.activatedAt ||
                    vip.createdAt
                );

            const expiry =
                start +
                days * DAY_MS;

            const expired =
                start &&
                now >= expiry;

            const status =
                expired
                    ? "expired"
                    : "active";


            return `

                <div class="owned-vip-card">

                    <div class="owned-vip-header">

                        <div class="owned-vip-name">

                            <i class="fas fa-crown"></i>

                            ${escapeHTML(name)}

                        </div>

                        <span class="vip-status ${status}">

                            ${
                                status === "active"
                                    ? "Active"
                                    : "Expired"
                            }

                        </span>

                    </div>


                    <div class="owned-vip-info">

                        <div class="vip-info-item">

                            <span>
                                Price
                            </span>

                            <strong>
                                ${money(vip.price)}
                            </strong>

                        </div>


                        <div class="vip-info-item">

                            <span>
                                Daily Income
                            </span>

                            <strong>
                                ${money(daily)}
                            </strong>

                        </div>


                        <div class="vip-info-item">

                            <span>
                                Total Profit
                            </span>

                            <strong>
                                ${money(totalProfit)}
                            </strong>

                        </div>


                        <div class="vip-info-item">

                            <span>
                                Duration
                            </span>

                            <strong>
                                ${days} Days
                            </strong>

                        </div>

                    </div>

                </div>

            `;

        }).join("");

}


/* =========================================================
   HERO STATS
========================================================= */

function updateHeroStats() {

    const activeVIPs =
        getActiveVIPs();


    if (currentVipEl) {

        if (!activeVIPs.length) {

            currentVipEl.textContent =
                "VIP 0";

        } else if (
            activeVIPs.length === 1
        ) {

            currentVipEl.textContent =
                activeVIPs[0].vipName ||
                "VIP";

        } else {

            currentVipEl.textContent =
                `${activeVIPs.length} VIPs`;

        }

    }


    let totalDaily =
        0;

    let totalProfit =
        0;


    activeVIPs.forEach(vip => {

        totalDaily +=
            numberValue(
                vip.dailyIncome
            );

        totalProfit +=
            numberValue(
                vip.totalProfit
            );

    });


    if (dailyIncomeEl) {

        dailyIncomeEl.textContent =
            money(totalDaily);

    }


    if (totalProfitEl) {

        totalProfitEl.textContent =
            money(totalProfit);

    }

}


/* =========================================================
   CLAIM VIP SELECTION
========================================================= */

function updateClaimVIP() {

    const activeVIPs =
        getActiveVIPs();

    if (!activeVIPs.length) {

        selectedClaimVIP =
            null;

        if (claimButton) {

            claimButton.disabled =
                true;

            claimButton.innerHTML =
                `<i class="fas fa-lock"></i>
                 Claim Daily Income`;

        }

        if (claimTimerEl) {

            claimTimerEl.textContent =
                "No Active VIP";

        }

        return;

    }


    const now =
        Date.now();


    const readyVIP =
        activeVIPs.find(vip => {

            const lastClaim =
                numberValue(
                    vip.lastClaim
                );

            return (
                !lastClaim ||
                now - lastClaim >= DAY_MS
            );

        });


    selectedClaimVIP =
        readyVIP ||
        activeVIPs[0];


    if (readyVIP) {

        if (claimButton) {

            claimButton.disabled =
                false;

            claimButton.innerHTML =
                `<i class="fas fa-coins"></i>
                 Claim ${money(
                     readyVIP.dailyIncome
                 )}`;

        }

        if (claimTimerEl) {

            claimTimerEl.textContent =
                `${readyVIP.vipName || "VIP"} is ready to claim.`;

        }

    } else {

        if (claimButton) {

            claimButton.disabled =
                true;

            claimButton.innerHTML =
                `<i class="fas fa-clock"></i>
                 Claim Daily Income`;

        }

    }

}


/* =========================================================
   CLAIM DAILY INCOME
========================================================= */

if (claimButton) {

    claimButton.addEventListener(
        "click",
        claimDailyIncome
    );

}


async function claimDailyIncome() {

    if (!currentUser)
        return;

    const vip =
        selectedClaimVIP;

    if (!vip) {

        showToast(
            "No active VIP available.",
            false
        );

        return;

    }


    const now =
        Date.now();

    const lastClaim =
        numberValue(
            vip.lastClaim
        );


    if (
        lastClaim &&
        now - lastClaim < DAY_MS
    ) {

        showToast(
            "Your daily income is not ready yet.",
            false
        );

        return;

    }


    const income =
        numberValue(
            vip.dailyIncome
        );


    if (income <= 0) {

        showToast(
            "Invalid daily income.",
            false
        );

        return;

    }


    claimButton.disabled =
        true;


    try {

        const userRef =
            ref(
                db,
                `${USERS_PATH}/${currentUser.uid}`
            );


        /* -------------------------------------------------
           ATOMIC BALANCE CREDIT
        ------------------------------------------------- */

        const result =
            await runTransaction(
                userRef,
                user => {

                    if (!user)
                        return;

                    const currentBalance =
                        numberValue(
                            user.balance
                        );

                    user.balance =
                        currentBalance +
                        income;

                    user.totalEarnings =
                        numberValue(
                            user.totalEarnings
                        ) + income;

                    user.totalTransactions =
                        numberValue(
                            user.totalTransactions
                        ) + 1;

                    return user;

                }
            );


        if (!result.committed) {

            throw new Error(
                "Income transaction failed."
            );

        }


        /* -------------------------------------------------
           UPDATE VIP
        ------------------------------------------------- */

        const newClaimCount =
            numberValue(
                vip.claimCount
            ) + 1;

        const newTotalClaimed =
            numberValue(
                vip.totalClaimed
            ) + income;


        await update(
            ref(
                db,
                `${VIP_BUYERS_PATH}/${currentUser.uid}/${vip.id}`
            ),
            {

                lastClaim:
                    now,

                claimCount:
                    newClaimCount,

                totalClaimed:
                    newTotalClaimed

            }
        );


        /* -------------------------------------------------
           TRANSACTION
        ------------------------------------------------- */

        const transactionId =
            push(
                ref(
                    db,
                    `${TRANSACTIONS_PATH}/${currentUser.uid}`
                )
            ).key;


        if (transactionId) {

            await set(
                ref(
                    db,
                    `${TRANSACTIONS_PATH}/${currentUser.uid}/${transactionId}`
                ),
                {

                    type:
                        "vip_daily_income",

                    category:
                        "Daily VIP Income",

                    uid:
                        currentUser.uid,

                    vipId:
                        vip.id,

                    vipPlanId:
                        vip.vipPlanId ||
                        vip.planId,

                    vipName:
                        vip.vipName,

                    amount:
                        income,

                    currency:
                        CURRENCY,

                    status:
                        "completed",

                    description:
                        `Daily income from ${vip.vipName}`,

                    createdAt:
                        now

                }
            );

        }


        showToast(
            `${money(income)} daily income added!`
        );


        updateClaimVIP();

    } catch (error) {

        console.error(
            "Claim income error:",
            error
        );

        showToast(
            "Claim failed: " +
            (error?.message ||
                "Unknown error"),
            false
        );

        updateClaimVIP();

    }

}


/* =========================================================
   CLAIM TIMER
========================================================= */

function startClaimTimer() {

    if (claimInterval) {

        clearInterval(
            claimInterval
        );

    }


    claimInterval =
        setInterval(
            updateClaimTimer,
            1000
        );


    updateClaimTimer();

}


function updateClaimTimer() {

    const activeVIPs =
        getActiveVIPs();


    if (!activeVIPs.length) {

        if (claimTimerEl) {

            claimTimerEl.textContent =
                "No Active VIP";

        }

        return;

    }


    const now =
        Date.now();


    const readyVIP =
        activeVIPs.find(vip => {

            const last =
                numberValue(
                    vip.lastClaim
                );

            return (
                !last ||
                now - last >= DAY_MS
            );

        });


    if (readyVIP) {

        selectedClaimVIP =
            readyVIP;

        if (claimTimerEl) {

            claimTimerEl.textContent =
                `${readyVIP.vipName || "VIP"} is ready to claim.`;

        }

        if (claimButton) {

            claimButton.disabled =
                false;

            claimButton.innerHTML =
                `<i class="fas fa-coins"></i>
                 Claim ${money(
                     readyVIP.dailyIncome
                 )}`;

        }

        return;

    }


    let nearest =
        null;

    let nearestTime =
        Infinity;


    activeVIPs.forEach(vip => {

        const last =
            numberValue(
                vip.lastClaim
            );

        const next =
            last +
            DAY_MS;

        if (next < nearestTime) {

            nearestTime =
                next;

            nearest =
                vip;

        }

    });


    if (!nearest)
        return;


    selectedClaimVIP =
        nearest;


    const remaining =
        Math.max(
            0,
            nearestTime - now
        );


    const hours =
        Math.floor(
            remaining /
            (60 * 60 * 1000)
        );


    const minutes =
        Math.floor(
            (remaining %
                (60 * 60 * 1000)) /
            (60 * 1000)
        );


    const seconds =
        Math.floor(
            (remaining %
                (60 * 1000)) /
            1000
        );


    if (claimTimerEl) {

        claimTimerEl.textContent =
            `${nearest.vipName || "VIP"} next claim in ` +
            `${hours}h ${minutes}m ${seconds}s`;

    }


    if (claimButton) {

        claimButton.disabled =
            true;

        claimButton.innerHTML =
            `<i class="fas fa-clock"></i>
             Claim Daily Income`;

    }

}


/* =========================================================
   MOBILE MENU
========================================================= */

function setupMenu() {

    if (!menuBtn || !sidebar)
        return;


    menuBtn.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "active"
            );

        }
    );


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

function setupLogout() {

    if (!logoutBtn)
        return;


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

                showToast(
                    "Logout failed.",
                    false
                );

            }

        }
    );

}


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        if (claimInterval) {

            clearInterval(
                claimInterval
            );

        }

        if (userUnsubscribe)
            userUnsubscribe();

        if (plansUnsubscribe)
            plansUnsubscribe();

        if (buyersUnsubscribe)
            buyersUnsubscribe();

    }
);
