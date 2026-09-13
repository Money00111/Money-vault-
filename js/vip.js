// =========================================================
// MONEY VAULT - VIP.JS
// AUTOMATIC VIP PURCHASE VERSION
// CURRENCY: RWF / FRW
//
// FLOW:
// 1. User chooses VIP
// 2. Balance is checked
// 3. VIP price is deducted immediately
// 4. VIP becomes ACTIVE immediately
// 5. First claim = 24 hours after purchase
// 6. Referral bonus = 1,000 RWF immediately
// 7. No Admin approval required
// 8. Same VIP plan cannot be purchased twice
// 9. User can own many different VIP plans
// =========================================================

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
    onValue,
    query,
    orderByChild,
    equalTo,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// =========================================================
// DOM
// =========================================================

const vipGrid =
    document.getElementById("vipGrid");

const loadingScreen =
    document.getElementById("loadingScreen");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const logoutBtn =
    document.getElementById("logoutBtn");

const balanceEl =
    document.getElementById("balance");

const currentVipEl =
    document.getElementById("currentVip");

const dailyIncomeEl =
    document.getElementById("dailyIncome");

const totalProfitEl =
    document.getElementById("totalProfit");

const ownedVipList =
    document.getElementById("ownedVipList");

const claimBtn =
    document.getElementById("claimDailyIncome");

const claimTimer =
    document.getElementById("claimTimer");


// =========================================================
// STATE
// =========================================================

let currentUser = null;

let userData = {};

let userVipPlans = {};

let availableVipPlans = {};

let vipRequests = {};

let claimTimerInterval = null;

let vipPlansListenerStarted = false;

let userListenerStarted = false;

let requestListenerStarted = false;

let purchaseInProgress = false;

let claimInProgress = false;


// =========================================================
// CONSTANTS
// =========================================================

const ONE_DAY =
    24 * 60 * 60 * 1000;

const REFERRAL_BONUS =
    1000;

const CURRENCY =
    "RWF";


// =========================================================
// HELPERS
// =========================================================

function numberValue(value) {

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;
}


function money(value) {

    return (
        numberValue(value)
            .toLocaleString("en-US", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            })
        + " "
        + CURRENCY
    );
}


function normalizeStatus(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


function normalizePlanId(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function formatDate(timestamp) {

    const value =
        numberValue(timestamp);

    if (!value) {
        return "N/A";
    }

    return new Date(value)
        .toLocaleString();
}


function showMessage(message) {

    alert(message);
}


function getVipName(plan) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {
        return "";
    }

    return String(
        plan.vipName ??
        plan.name ??
        plan.title ??
        ""
    ).trim();
}


function getDurationDays(plan) {

    const raw =
        plan?.duration ??
        plan?.totalDays ??
        plan?.days ??
        0;

    if (typeof raw === "number") {
        return raw;
    }

    const text =
        String(raw || "");

    const match =
        text.match(/\d+/);

    return match
        ? numberValue(match[0])
        : 0;
}


function getPlanPrice(plan) {

    return numberValue(
        plan?.price ??
        plan?.amount ??
        0
    );
}


function getPlanDailyIncome(plan) {

    return numberValue(
        plan?.dailyIncome ??
        plan?.dailyProfit ??
        plan?.income ??
        0
    );
}


function getPlanTotalProfit(plan) {

    const explicit =
        numberValue(
            plan?.totalProfit
        );

    if (explicit > 0) {
        return explicit;
    }

    return (
        getPlanDailyIncome(plan) *
        getDurationDays(plan)
    );
}


function getPlanId(plan, fallback = "") {

    if (
        !plan ||
        typeof plan !== "object"
    ) {
        return normalizePlanId(fallback);
    }

    return normalizePlanId(
        plan.vipPlanId ??
        plan.planId ??
        plan.vipId ??
        fallback
    );
}


// =========================================================
// CLAIM TIME
// =========================================================

function getVipClaimStartTime(plan) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {
        return 0;
    }

    const lastClaim =
        numberValue(
            plan.lastClaim
        );

    if (lastClaim > 0) {
        return lastClaim;
    }

    const lastClaimTime =
        numberValue(
            plan.lastClaimTime
        );

    if (lastClaimTime > 0) {
        return lastClaimTime;
    }

    const approvedAt =
        numberValue(
            plan.approvedAt
        );

    if (approvedAt > 0) {
        return approvedAt;
    }

    const purchasedAt =
        numberValue(
            plan.purchasedAt
        );

    if (purchasedAt > 0) {
        return purchasedAt;
    }

    return 0;
}


// =========================================================
// VIP ACTIVE
// =========================================================

function isVipActive(plan) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {
        return false;
    }

    const status =
        normalizeStatus(
            plan.status
        );

    const activeFlag =
        plan.active === true;

    if (
        status !== "active" &&
        !activeFlag
    ) {
        return false;
    }

    const endDate =
        numberValue(
            plan.endDate
        );

    if (
        endDate > 0 &&
        Date.now() >= endDate
    ) {
        return false;
    }

    return true;
}


// =========================================================
// CLAIM CHECK
// =========================================================

function canVipClaim(plan) {

    if (!isVipActive(plan)) {
        return false;
    }

    const start =
        getVipClaimStartTime(plan);

    if (start <= 0) {
        return false;
    }

    return (
        Date.now() - start >=
        ONE_DAY
    );
}


function getVipRemainingClaimTime(plan) {

    if (!isVipActive(plan)) {
        return null;
    }

    const start =
        getVipClaimStartTime(plan);

    if (start <= 0) {
        return null;
    }

    return Math.max(
        0,
        ONE_DAY -
        (
            Date.now() -
            start
        )
    );
}


// =========================================================
// MOBILE MENU
// =========================================================

menuBtn?.addEventListener(
    "click",
    () => {

        sidebar?.classList.toggle(
            "active"
        );

    }
);


document
    .querySelectorAll(".sidebar a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                if (
                    window.innerWidth <= 900
                ) {

                    sidebar?.classList.remove(
                        "active"
                    );

                }

            }
        );

    });


// =========================================================
// LOGOUT
// =========================================================

logoutBtn?.addEventListener(
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
                "Unable to logout."
            );

        }

    }
);


// =========================================================
// BALANCE UI
// =========================================================

function updateBalanceUI() {

    if (!balanceEl) {
        return;
    }

    balanceEl.textContent =
        money(
            userData.balance
        );
}


// =========================================================
// CHECK IF PLAN WAS EVER OWNED
// =========================================================
//
// IMPORTANT:
// Same plan cannot be purchased twice.
// Even if it later expires/completes,
// the same plan remains owned.
// =========================================================

function hasOwnedVipByPlan(
    planId,
    vipName = ""
) {

    const targetId =
        normalizePlanId(planId);

    const targetName =
        String(vipName || "")
            .trim()
            .toLowerCase();

    return Object.entries(
        userVipPlans || {}
    ).some(
        ([key, vip]) => {

            if (
                !vip ||
                typeof vip !== "object"
            ) {
                return false;
            }

            const ownedId =
                getPlanId(
                    vip,
                    key
                );

            if (
                targetId &&
                ownedId &&
                targetId === ownedId
            ) {
                return true;
            }

            const ownedName =
                String(
                    vip.vipName ||
                    vip.name ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            if (
                !targetId &&
                targetName &&
                ownedName &&
                targetName === ownedName
            ) {
                return true;
            }

            return false;

        }
    );
}


// =========================================================
// PENDING CHECK
// =========================================================
//
// Kept only for compatibility with old records.
// New purchases are automatically approved.
// =========================================================

function hasPendingVipRequest(
    planId,
    vipName = ""
) {

    const targetId =
        normalizePlanId(planId);

    const targetName =
        String(vipName || "")
            .trim()
            .toLowerCase();

    return Object.values(
        vipRequests || {}
    ).some(
        request => {

            if (
                !request ||
                typeof request !== "object"
            ) {
                return false;
            }

            if (
                normalizeStatus(
                    request.status
                ) !== "pending"
            ) {
                return false;
            }

            const requestId =
                normalizePlanId(
                    request.vipPlanId ??
                    request.planId ??
                    ""
                );

            const requestName =
                String(
                    request.vipName ||
                    request.name ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            if (
                targetId &&
                requestId &&
                targetId === requestId
            ) {
                return true;
            }

            if (
                !targetId &&
                targetName &&
                requestName &&
                targetName === requestName
            ) {
                return true;
            }

            return false;

        }
    );
}


// =========================================================
// RENDER VIP PLANS
// =========================================================

function renderVipPlans() {

    if (!vipGrid) {
        return;
    }

    vipGrid.innerHTML = "";

    const plans =
        Object.entries(
            availableVipPlans || {}
        );

    if (
        plans.length === 0
    ) {

        vipGrid.innerHTML = `

            <div class="empty-vip">

                <i class="fas fa-crown"></i>

                <h3>
                    No VIP Plans Available
                </h3>

                <p>
                    VIP plans are currently unavailable.
                </p>

            </div>

        `;

        return;
    }


    plans.forEach(
        ([firebaseId, plan]) => {

            if (
                !plan ||
                typeof plan !== "object"
            ) {
                return;
            }


            const planId =
                getPlanId(
                    plan,
                    firebaseId
                );


            const vipName =
                getVipName(plan) ||
                "VIP Plan";


            const price =
                getPlanPrice(plan);


            const dailyIncome =
                getPlanDailyIncome(plan);


            const duration =
                getDurationDays(plan);


            const totalProfit =
                getPlanTotalProfit(plan);


            // -------------------------------------------------
            // AVAILABILITY
            // -------------------------------------------------

            const status =
                normalizeStatus(
                    plan.status
                );

            const isAvailable =
                plan.status === true ||
                status === "active" ||
                status === "available" ||
                plan.active === true ||
                plan.enabled === true;

            if (!isAvailable) {
                return;
            }


            // -------------------------------------------------
            // OWNERSHIP
            // -------------------------------------------------

            const alreadyOwned =
                hasOwnedVipByPlan(
                    planId,
                    vipName
                );


            // -------------------------------------------------
            // CARD
            // -------------------------------------------------

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "vip-card";


            card.innerHTML = `

                <div class="vip-card-header">

                    <div class="vip-icon">

                        <i class="fas fa-crown"></i>

                    </div>

                    <h3>
                        ${escapeHTML(vipName)}
                    </h3>

                </div>


                <div class="vip-price">

                    ${money(price)}

                </div>


                <div class="vip-details">

                    <div class="vip-detail">

                        <i class="fas fa-coins"></i>

                        <span>
                            Daily Income
                        </span>

                        <strong>
                            ${money(dailyIncome)}
                        </strong>

                    </div>


                    <div class="vip-detail">

                        <i class="fas fa-calendar-days"></i>

                        <span>
                            Duration
                        </span>

                        <strong>
                            ${duration} Days
                        </strong>

                    </div>


                    <div class="vip-detail">

                        <i class="fas fa-chart-line"></i>

                        <span>
                            Total Profit
                        </span>

                        <strong>
                            ${money(totalProfit)}
                        </strong>

                    </div>

                </div>


                <button
                    type="button"
                    class="buyVipBtn"
                    data-plan-id="${escapeHTML(planId)}"
                    data-vip="${escapeHTML(vipName)}"
                    data-price="${price}"
                    data-daily="${dailyIncome}"
                    data-profit="${totalProfit}"
                    data-days="${duration}"
                    ${alreadyOwned ? "disabled" : ""}
                >

                    ${
                        alreadyOwned
                            ? '<i class="fas fa-check-circle"></i> Already Purchased'
                            : '<i class="fas fa-crown"></i> Buy Now'
                    }

                </button>

            `;


            const button =
                card.querySelector(
                    ".buyVipBtn"
                );


            button?.addEventListener(
                "click",
                () => buyVip(button)
            );


            vipGrid.appendChild(
                card
            );

        }
    );


    updateVipButtons();
}


// =========================================================
// LOAD VIP PLANS
// =========================================================

function loadVipPackages() {

    if (
        vipPlansListenerStarted
    ) {
        return;
    }

    vipPlansListenerStarted =
        true;


    const plansRef =
        ref(
            db,
            "vipPlans"
        );


    onValue(
        plansRef,

        snapshot => {

            availableVipPlans = {};

            if (
                snapshot.exists()
            ) {

                snapshot.forEach(
                    child => {

                        availableVipPlans[
                            child.key
                        ] =
                            child.val() || {};

                    }
                );

            }

            renderVipPlans();

        },

        error => {

            console.error(
                "VIP plans error:",
                error
            );


            if (vipGrid) {

                vipGrid.innerHTML = `

                    <div class="empty-vip">

                        <i class="fas fa-triangle-exclamation"></i>

                        <h3>
                            Unable to Load VIP Plans
                        </h3>

                        <p>
                            ${escapeHTML(
                                error?.message ||
                                "Permission denied."
                            )}
                        </p>

                    </div>

                `;

            }

        }
    );
}


// =========================================================
// USER LISTENER
// =========================================================

function startUserListener() {

    if (
        !currentUser ||
        userListenerStarted
    ) {
        return;
    }


    userListenerStarted =
        true;


    const userRef =
        ref(
            db,
            "users/" +
            currentUser.uid
        );


    onValue(

        userRef,

        snapshot => {

            if (
                !snapshot.exists()
            ) {

                userData = {};

                userVipPlans = {};

                updateBalanceUI();

                calculateVipTotals();

                renderOwnedVipPlans();

                renderVipPlans();

                updateClaimTimer();

                return;

            }


            userData =
                snapshot.val() || {};


            userVipPlans =
                userData.vipPlans || {};


            updateBalanceUI();

            calculateVipTotals();

            renderOwnedVipPlans();

            renderVipPlans();

            updateVipButtons();

            updateClaimTimer();

        },

        error => {

            console.error(
                "User listener error:",
                error
            );

        }

    );
}


// =========================================================
// LOAD USER VIP REQUESTS
// =========================================================

function loadUserVipRequests() {

    if (
        !currentUser ||
        requestListenerStarted
    ) {
        return;
    }


    requestListenerStarted =
        true;


    const requestsRef =
        query(
            ref(
                db,
                "vipPurchaseRequests"
            ),
            orderByChild("uid"),
            equalTo(
                currentUser.uid
            )
        );


    onValue(

        requestsRef,

        snapshot => {

            vipRequests = {};


            if (
                snapshot.exists()
            ) {

                snapshot.forEach(
                    child => {

                        vipRequests[
                            child.key
                        ] =
                            child.val() || {};

                    }
                );

            }


            updateVipButtons();

        },

        error => {

            console.warn(
                "VIP request listener:",
                error
            );

        }

    );
}


// =========================================================
// UPDATE BUY BUTTONS
// =========================================================

function updateVipButtons() {

    document
        .querySelectorAll(
            ".buyVipBtn"
        )
        .forEach(
            button => {

                const planId =
                    normalizePlanId(
                        button.dataset.planId
                    );


                const vipName =
                    String(
                        button.dataset.vip || ""
                    ).trim();


                const purchased =
                    hasOwnedVipByPlan(
                        planId,
                        vipName
                    );


                if (purchased) {

                    button.disabled =
                        true;

                    button.innerHTML = `

                        <i class="fas fa-check-circle"></i>
                        Already Purchased

                    `;

                    return;
                }


                if (
                    purchaseInProgress
                ) {

                    button.disabled =
                        true;

                    return;
                }


                button.disabled =
                    false;

                button.innerHTML = `

                    <i class="fas fa-crown"></i>
                    Buy Now

                `;

            }
        );
}


// =========================================================
// DEDUCT BALANCE
// =========================================================
//
// Uses Firebase transaction to avoid negative balance.
// =========================================================

async function deductVipPrice(price) {

    const userRef =
        ref(
            db,
            "users/" +
            currentUser.uid
        );


    const result =
        await runTransaction(
            userRef,
            current => {

                if (
                    !current ||
                    typeof current !== "object"
                ) {
                    return;
                }


                const balance =
                    numberValue(
                        current.balance
                    );


                if (
                    balance < price
                ) {
                    return;
                }


                return {
                    ...current,

                    balance:
                        Number(
                            (
                                balance -
                                price
                            ).toFixed(2)
                        )
                };

            }
        );


    if (
        !result.committed
    ) {

        throw new Error(
            "Insufficient balance or balance update failed."
        );

    }


    userData =
        result.snapshot.val() || {};


    userVipPlans =
        userData.vipPlans || {};


    updateBalanceUI();
}


// =========================================================
// REFUND
// =========================================================

async function refundVipPrice(price) {

    if (
        !currentUser ||
        price <= 0
    ) {
        return;
    }


    const userRef =
        ref(
            db,
            "users/" +
            currentUser.uid
        );


    const result =
        await runTransaction(
            userRef,
            current => {

                if (
                    !current ||
                    typeof current !== "object"
                ) {
                    return;
                }


                const balance =
                    numberValue(
                        current.balance
                    );


                return {
                    ...current,

                    balance:
                        Number(
                            (
                                balance +
                                price
                            ).toFixed(2)
                        )
                };

            }
        );


    if (
        result.committed
    ) {

        userData =
            result.snapshot.val() || {};

        userVipPlans =
            userData.vipPlans || {};

        updateBalanceUI();

    }
}


// =========================================================
// FIND REFERRER
// =========================================================

async function findReferrer() {

    if (
        !currentUser
    ) {
        return null;
    }


    const referredBy =
        String(
            userData.referredBy ||
            userData.referralCodeUsed ||
            ""
        ).trim();


    if (
        !referredBy
    ) {
        return null;
    }


    // -----------------------------------------------------
    // FIRST: referralCodes/{code}
    // -----------------------------------------------------

    try {

        const codeSnapshot =
            await get(
                ref(
                    db,
                    "referralCodes/" +
                    referredBy
                )
            );


        if (
            codeSnapshot.exists()
        ) {

            const codeData =
                codeSnapshot.val() || {};


            const referrerUid =
                String(
                    codeData.uid || ""
                ).trim();


            if (
                referrerUid &&
                referrerUid !==
                currentUser.uid
            ) {

                const userSnapshot =
                    await get(
                        ref(
                            db,
                            "users/" +
                            referrerUid
                        )
                    );


                if (
                    userSnapshot.exists()
                ) {

                    return {

                        uid:
                            referrerUid,

                        data:
                            userSnapshot.val() || {}

                    };

                }

            }

        }

    } catch (error) {

        console.warn(
            "Referral code lookup failed:",
            error
        );

    }


    // -----------------------------------------------------
    // FALLBACK:
    // Search users for referralCode
    // -----------------------------------------------------

    try {

        const usersQuery =
            query(
                ref(
                    db,
                    "users"
                ),
                orderByChild(
                    "referralCode"
                ),
                equalTo(
                    referredBy
                )
            );


        const snapshot =
            await get(
                usersQuery
            );


        if (
            snapshot.exists()
        ) {

            let result =
                null;


            snapshot.forEach(
                child => {

                    if (
                        result
                    ) {
                        return;
                    }


                    if (
                        child.key !==
                        currentUser.uid
                    ) {

                        result = {

                            uid:
                                child.key,

                            data:
                                child.val() || {}

                        };

                    }

                }
            );


            return result;

        }

    } catch (error) {

        console.warn(
            "Referral user lookup failed:",
            error
        );

    }


    return null;
}


// =========================================================
// PAY REFERRAL BONUS
// =========================================================
//
// Bonus:
// 1,000 RWF
//
// Updates:
// - balance
// - referralBonus
// - referralEarnings
// - referralCount
//
// Paid once for each VIP purchase request.
// =========================================================

async function payReferralBonus(
    requestId,
    vipName,
    purchasePrice
) {

    if (
        !currentUser ||
        !requestId
    ) {
        return {
            paid: false,
            reason: "No user/request"
        };
    }


    const referrer =
        await findReferrer();


    if (
        !referrer
    ) {

        return {
            paid: false,
            reason: "No referrer"
        };

    }


    const referrerUid =
        referrer.uid;


    const bonusRecordRef =
        ref(
            db,
            "vipReferralBonuses/" +
            requestId
        );


    // -----------------------------------------------------
    // ALREADY PAID?
    // -----------------------------------------------------

    const existingBonus =
        await get(
            bonusRecordRef
        );


    if (
        existingBonus.exists()
    ) {

        return {
            paid: false,
            alreadyPaid: true,
            referrerUid
        };

    }


    // -----------------------------------------------------
    // UPDATE REFERRER
    // -----------------------------------------------------

    const referrerRef =
        ref(
            db,
            "users/" +
            referrerUid
        );


    const transaction =
        await runTransaction(
            referrerRef,
            current => {

                if (
                    !current ||
                    typeof current !== "object"
                ) {
                    return;
                }


                const oldBalance =
                    numberValue(
                        current.balance
                    );


                const oldReferralBonus =
                    numberValue(
                        current.referralBonus
                    );


                const oldReferralEarnings =
                    numberValue(
                        current.referralEarnings
                    );


                const oldReferralCount =
                    numberValue(
                        current.referralCount
                    );


                return {

                    ...current,

                    balance:
                        Number(
                            (
                                oldBalance +
                                REFERRAL_BONUS
                            ).toFixed(2)
                        ),

                    referralBonus:
                        Number(
                            (
                                oldReferralBonus +
                                REFERRAL_BONUS
                            ).toFixed(2)
                        ),

                    referralEarnings:
                        Number(
                            (
                                oldReferralEarnings +
                                REFERRAL_BONUS
                            ).toFixed(2)
                        ),

                    referralCount:
                        oldReferralCount + 1

                };

            }
        );


    if (
        !transaction.committed
    ) {

        throw new Error(
            "Referral bonus update failed."
        );

    }


    // -----------------------------------------------------
    // RECORD BONUS
    // -----------------------------------------------------

    const now =
        Date.now();


    await set(
        bonusRecordRef,
        {

            id:
                requestId,

            referrerUid:
                referrerUid,

            referredUserUid:
                currentUser.uid,

            requestId:
                requestId,

            vipName:
                vipName,

            purchasePrice:
                Number(
                    purchasePrice.toFixed(2)
                ),

            amount:
                REFERRAL_BONUS,

            currency:
                CURRENCY,

            status:
                "paid",

            createdAt:
                now

        }
    );


    return {

        paid:
            true,

        referrerUid:
            referrerUid,

        amount:
            REFERRAL_BONUS

    };
}


// =========================================================
// CREATE VIP TRANSACTION
// =========================================================

async function createVipTransaction(
    requestId,
    planId,
    vipName,
    price,
    now
) {

    try {

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    currentUser.uid,

                email:
                    currentUser.email ||
                    userData.email ||
                    "",

                type:
                    "VIP Purchase",

                amount:
                    Number(
                        price.toFixed(2)
                    ),

                currency:
                    CURRENCY,

                status:
                    "approved",

                vipPlanId:
                    planId,

                vipName:
                    vipName,

                requestId:
                    requestId,

                createdAt:
                    now,

                description:
                    "VIP purchased automatically from account balance."

            }
        );


    } catch (error) {

        console.warn(
            "VIP transaction history failed:",
            error
        );

    }
}


// =========================================================
// BUY VIP
// =========================================================

async function buyVip(button) {

    if (
        !currentUser
    ) {

        showMessage(
            "Please login first."
        );

        return;
    }


    if (
        !button ||
        button.disabled ||
        purchaseInProgress
    ) {
        return;
    }


    const planId =
        normalizePlanId(
            button.dataset.planId
        );


    const vipName =
        String(
            button.dataset.vip || ""
        ).trim();


    const price =
        numberValue(
            button.dataset.price
        );


    const dailyIncome =
        numberValue(
            button.dataset.daily
        );


    const totalProfit =
        numberValue(
            button.dataset.profit
        );


    const duration =
        numberValue(
            button.dataset.days
        );


    if (!planId) {

        showMessage(
            "VIP plan ID is missing."
        );

        return;
    }


    if (!vipName) {

        showMessage(
            "VIP plan name is missing."
        );

        return;
    }


    if (
        price <= 0 ||
        duration <= 0 ||
        dailyIncome < 0
    ) {

        showMessage(
            "This VIP plan has invalid information."
        );

        return;
    }


    // -----------------------------------------------------
    // REFRESH USER
    // -----------------------------------------------------

    try {

        const freshUserSnapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    currentUser.uid
                )
            );


        if (
            !freshUserSnapshot.exists()
        ) {

            throw new Error(
                "User account not found."
            );

        }


        userData =
            freshUserSnapshot.val() || {};


        userVipPlans =
            userData.vipPlans || {};


        // -------------------------------------------------
        // SAME PLAN CHECK
        // -------------------------------------------------

        if (
            hasOwnedVipByPlan(
                planId,
                vipName
            )
        ) {

            throw new Error(
                "You already purchased this VIP plan. The same VIP plan cannot be purchased twice."
            );

        }


        // -------------------------------------------------
        // BALANCE
        // -------------------------------------------------

        const balance =
            numberValue(
                userData.balance
            );


        if (
            balance < price
        ) {

            showMessage(

                "Insufficient Balance.\n\n" +

                "VIP Price: " +
                money(price) +

                "\nYour Balance: " +
                money(balance)

            );

            return;
        }


        // -------------------------------------------------
        // CONFIRM
        // -------------------------------------------------

        const ok =
            confirm(

                "Buy " +
                vipName +
                "?\n\n" +

                "Price: " +
                money(price) +

                "\nDaily Income: " +
                money(dailyIncome) +

                "\nDuration: " +
                duration +
                " Days\n\n" +

                "Your balance will be reduced immediately.\n\n" +

                "VIP will become ACTIVE immediately.\n\n" +

                "First income claim will be available after 24 hours.\n\n" +

                "Referral bonus: " +
                money(REFERRAL_BONUS)

            );


        if (!ok) {
            return;
        }


        purchaseInProgress =
            true;


        button.disabled =
            true;


        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>
            Activating VIP...

        `;


        let balanceDeducted =
            false;


        let vipCreated =
            false;


        let requestId =
            "";


        try {

            // =================================================
            // STEP 1
            // DEDUCT BALANCE
            // =================================================

            await deductVipPrice(
                price
            );


            balanceDeducted =
                true;


            const now =
                Date.now();


            // =================================================
            // STEP 2
            // CREATE REQUEST RECORD
            //
            // It is automatically APPROVED.
            // =================================================

            const requestRef =
                push(
                    ref(
                        db,
                        "vipPurchaseRequests"
                    )
                );


            requestId =
                requestRef.key;


            const requestData = {

                requestId:
                    requestId,

                uid:
                    currentUser.uid,

                email:
                    currentUser.email ||
                    userData.email ||
                    "",

                vipPlanId:
                    planId,

                planId:
                    planId,

                vipName:
                    vipName,

                price:
                    Number(
                        price.toFixed(2)
                    ),

                dailyIncome:
                    Number(
                        dailyIncome.toFixed(2)
                    ),

                totalProfit:
                    Number(
                        totalProfit.toFixed(2)
                    ),

                duration:
                    duration,

                paymentMethod:
                    "Account Balance",

                currency:
                    CURRENCY,

                status:
                    "approved",

                autoApproved:
                    true,

                balanceDeducted:
                    true,

                balanceDeductedAmount:
                    Number(
                        price.toFixed(2)
                    ),

                requestedAt:
                    now,

                approvedAt:
                    now,

                createdAt:
                    now

            };


            await set(
                requestRef,
                requestData
            );


            // =================================================
            // STEP 3
            // CREATE ACTIVE VIP
            // =================================================

            const vipRef =
                ref(
                    db,
                    "users/" +
                    currentUser.uid +
                    "/vipPlans/" +
                    planId
                );


            const endDate =
                now +
                (
                    duration *
                    ONE_DAY
                );


            const activeVip = {

                vipPlanId:
                    planId,

                planId:
                    planId,

                vipName:
                    vipName,

                name:
                    vipName,

                price:
                    Number(
                        price.toFixed(2)
                    ),

                dailyIncome:
                    Number(
                        dailyIncome.toFixed(2)
                    ),

                totalProfit:
                    Number(
                        totalProfit.toFixed(2)
                    ),

                duration:
                    duration,

                totalDays:
                    duration,

                remainingDays:
                    duration,

                status:
                    "active",

                active:
                    true,

                purchasedAt:
                    now,

                startDate:
                    now,

                approvedAt:
                    now,

                autoApproved:
                    true,

                lastClaim:
                    now,

                lastClaimTime:
                    now,

                lastProfitTime:
                    now,

                endDate:
                    endDate,

                totalEarned:
                    0,

                earned:
                    0,

                claimedAmount:
                    0,

                claimCount:
                    0

            };


            await set(
                vipRef,
                activeVip
            );


            vipCreated =
                true;


            // =================================================
            // UPDATE LOCAL DATA
            // =================================================

            userVipPlans = {

                ...userVipPlans,

                [planId]:
                    activeVip

            };


            // =================================================
            // STEP 4
            // TRANSACTION HISTORY
            // =================================================

            await createVipTransaction(
                requestId,
                planId,
                vipName,
                price,
                now
            );


            // =================================================
            // STEP 5
            // REFERRAL BONUS
            // =================================================

            let referralResult =
                null;


            try {

                referralResult =
                    await payReferralBonus(
                        requestId,
                        vipName,
                        price
                    );

            } catch (referralError) {

                console.error(
                    "Referral bonus error:",
                    referralError
                );

                referralResult = {

                    paid:
                        false,

                    error:
                        referralError.message

                };

            }


            // =================================================
            // REFRESH
            // =================================================

            const finalSnapshot =
                await get(
                    ref(
                        db,
                        "users/" +
                        currentUser.uid
                    )
                );


            if (
                finalSnapshot.exists()
            ) {

                userData =
                    finalSnapshot.val() || {};

                userVipPlans =
                    userData.vipPlans || {};

            }


            updateBalanceUI();

            calculateVipTotals();

            renderOwnedVipPlans();

            renderVipPlans();

            updateVipButtons();

            updateClaimTimer();


            // =================================================
            // SUCCESS MESSAGE
            // =================================================

            let referralText =
                "No referral bonus was paid.";


            if (
                referralResult?.paid
            ) {

                referralText =
                    "Your referrer received " +
                    money(REFERRAL_BONUS) +
                    ".";

            } else if (
                referralResult?.alreadyPaid
            ) {

                referralText =
                    "Referral bonus was already paid.";

            }


            showMessage(

                "VIP PURCHASE SUCCESSFUL!\n\n" +

                "VIP: " +
                vipName +

                "\n\n" +

                "Amount Paid: " +
                money(price) +

                "\n\n" +

                "Status: ACTIVE\n\n" +

                "First Claim: 24 hours from now.\n\n" +

                referralText

            );


        } catch (error) {

            console.error(
                "VIP automatic purchase error:",
                error
            );


            // -------------------------------------------------
            // REFUND
            // -------------------------------------------------

            if (
                balanceDeducted &&
                !vipCreated
            ) {

                try {

                    await refundVipPrice(
                        price
                    );


                    showMessage(

                        "VIP purchase failed.\n\n" +

                        "Your " +
                        money(price) +
                        " was refunded."

                    );


                } catch (refundError) {

                    console.error(
                        "Refund failed:",
                        refundError
                    );


                    showMessage(

                        "VIP purchase failed and automatic refund failed.\n\n" +

                        "Please contact support."

                    );

                }

            } else {

                showMessage(
                    error.message ||
                    "Unable to purchase VIP."
                );

            }


            updateVipButtons();

        } finally {

            purchaseInProgress =
                false;

            updateVipButtons();

        }


    } catch (error) {

        console.error(
            "VIP validation error:",
            error
        );


        purchaseInProgress =
            false;


        updateVipButtons();


        showMessage(
            error.message ||
            "Unable to process VIP purchase."
        );

    }
}


// =========================================================
// CALCULATE VIP TOTALS
// =========================================================

function calculateVipTotals() {

    let totalDaily =
        0;

    let totalRemainingProfit =
        0;

    let activeCount =
        0;


    Object.values(
        userVipPlans || {}
    ).forEach(
        plan => {

            if (
                !plan ||
                typeof plan !== "object"
            ) {
                return;
            }


            if (
                !isVipActive(plan)
            ) {
                return;
            }


            const daily =
                getPlanDailyIncome(
                    plan
                );


            const totalProfit =
                getPlanTotalProfit(
                    plan
                );


            const claimed =
                numberValue(
                    plan.claimedAmount ??
                    plan.totalEarned ??
                    0
                );


            const remaining =
                Math.max(
                    0,
                    totalProfit -
                    claimed
                );


            activeCount++;

            totalDaily +=
                daily;

            totalRemainingProfit +=
                remaining;

        }
    );


    if (currentVipEl) {

        currentVipEl.textContent =
            activeCount +
            " Active VIP Plan(s)";

    }


    if (dailyIncomeEl) {

        dailyIncomeEl.textContent =
            money(
                totalDaily
            );

    }


    if (totalProfitEl) {

        totalProfitEl.textContent =
            money(
                totalRemainingProfit
            );

    }
}


// =========================================================
// RENDER OWNED VIPS
// =========================================================

function renderOwnedVipPlans() {

    if (!ownedVipList) {
        return;
    }


    ownedVipList.innerHTML =
        "";


    const plans =
        Object.entries(
            userVipPlans || {}
        );


    if (
        plans.length === 0
    ) {

        ownedVipList.innerHTML = `

            <div class="empty-vip">

                <i class="fas fa-gem"></i>

                <h3>
                    No VIP Purchased
                </h3>

                <p>
                    Choose a VIP plan above to get started.
                </p>

            </div>

        `;

        return;
    }


    plans.sort(
        ([, a], [, b]) => {

            const aTime =
                numberValue(
                    a?.purchasedAt ||
                    a?.approvedAt ||
                    0
                );


            const bTime =
                numberValue(
                    b?.purchasedAt ||
                    b?.approvedAt ||
                    0
                );


            return bTime - aTime;

        }
    );


    plans.forEach(
        ([id, plan]) => {

            if (
                !plan ||
                typeof plan !== "object"
            ) {
                return;
            }


            const name =
                escapeHTML(
                    getVipName(plan) ||
                    "VIP Plan"
                );


            const daily =
                getPlanDailyIncome(
                    plan
                );


            const totalProfit =
                getPlanTotalProfit(
                    plan
                );


            const claimed =
                numberValue(
                    plan.claimedAmount ??
                    plan.totalEarned ??
                    0
                );


            const remainingProfit =
                Math.max(
                    0,
                    totalProfit -
                    claimed
                );


            const endDate =
                numberValue(
                    plan.endDate
                );


            let remainingDays =
                numberValue(
                    plan.remainingDays
                );


            if (
                endDate > 0
            ) {

                remainingDays =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                endDate -
                                Date.now()
                            ) /
                            ONE_DAY
                        )
                    );

            }


            const startDate =
                numberValue(
                    plan.purchasedAt ||
                    plan.startDate ||
                    0
                );


            const isActive =
                isVipActive(plan);


            const status =
                normalizeStatus(
                    plan.status
                );


            const statusText =
                isActive
                    ? "ACTIVE"
                    : status === "completed"
                        ? "COMPLETED"
                        : status === "expired"
                            ? "EXPIRED"
                            : String(
                                plan.status ||
                                "UNKNOWN"
                            ).toUpperCase();


            let claimStatus =
                "Not Active";


            let claimClass =
                "waiting";


            if (isActive) {

                if (
                    canVipClaim(plan)
                ) {

                    claimStatus =
                        "READY TO CLAIM";

                    claimClass =
                        "ready";

                } else {

                    claimStatus =
                        "24h timer running";

                    claimClass =
                        "waiting";

                }

            }


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "owned-vip-card";


            card.innerHTML = `

                <div class="owned-vip-header">

                    <h3>

                        <i class="fas fa-crown"></i>

                        ${name}

                    </h3>


                    <span
                        class="vip-status ${
                            isActive
                                ? "active"
                                : "expired"
                        }">

                        ${escapeHTML(
                            statusText
                        )}

                    </span>

                </div>


                <div class="owned-vip-info">

                    <p>

                        <strong>
                            Daily Income:
                        </strong>

                        ${money(daily)}

                    </p>


                    <p>

                        <strong>
                            Remaining Profit:
                        </strong>

                        ${money(remainingProfit)}

                    </p>


                    <p>

                        <strong>
                            Remaining Days:
                        </strong>

                        ${remainingDays}

                    </p>


                    <p>

                        <strong>
                            Started:
                        </strong>

                        ${formatDate(startDate)}

                    </p>


                    <p>

                        <strong>
                            Expires:
                        </strong>

                        ${formatDate(endDate)}

                    </p>


                    <p
                        class="vip-claim-status ${claimClass}">

                        <strong>
                            Claim:
                        </strong>

                        ${claimStatus}

                    </p>

                </div>

            `;


            ownedVipList.appendChild(
                card
            );

        }
    );
}


// =========================================================
// CLAIM DAILY INCOME
// =========================================================

claimBtn?.addEventListener(
    "click",
    claimDailyIncome
);


async function claimDailyIncome() {

    if (
        !currentUser
    ) {

        showMessage(
            "Please login first."
        );

        return;
    }


    if (
        claimInProgress
    ) {
        return;
    }


    claimInProgress =
        true;


    try {

        if (claimBtn) {

            claimBtn.disabled =
                true;

            claimBtn.innerHTML = `

                <i class="fas fa-spinner fa-spin"></i>
                Processing...

            `;

        }


        const userRef =
            ref(
                db,
                "users/" +
                currentUser.uid
            );


        const snapshot =
            await get(
                userRef
            );


        if (
            !snapshot.exists()
        ) {

            throw new Error(
                "User account not found."
            );

        }


        const user =
            snapshot.val() || {};


        const plans =
            user.vipPlans || {};


        const now =
            Date.now();


        let totalIncome =
            0;


        let claimableCount =
            0;


        const updates =
            {};


        Object.entries(
            plans
        ).forEach(
            ([id, plan]) => {

                if (
                    !plan ||
                    typeof plan !== "object"
                ) {
                    return;
                }


                if (
                    !isVipActive(plan)
                ) {
                    return;
                }


                const endDate =
                    numberValue(
                        plan.endDate
                    );


                if (
                    endDate > 0 &&
                    now >= endDate
                ) {

                    updates[
                        "vipPlans/" +
                        id +
                        "/status"
                    ] =
                        "expired";


                    updates[
                        "vipPlans/" +
                        id +
                        "/active"
                    ] =
                        false;


                    updates[
                        "vipPlans/" +
                        id +
                        "/remainingDays"
                    ] =
                        0;


                    return;

                }


                const claimStart =
                    getVipClaimStartTime(
                        plan
                    );


                if (
                    claimStart <= 0
                ) {
                    return;
                }


                if (
                    now - claimStart <
                    ONE_DAY
                ) {
                    return;
                }


                const daily =
                    getPlanDailyIncome(
                        plan
                    );


                const totalProfit =
                    getPlanTotalProfit(
                        plan
                    );


                const claimed =
                    numberValue(
                        plan.claimedAmount ??
                        plan.totalEarned ??
                        0
                    );


                const remaining =
                    Math.max(
                        0,
                        totalProfit -
                        claimed
                    );


                if (
                    remaining <= 0
                ) {

                    updates[
                        "vipPlans/" +
                        id +
                        "/status"
                    ] =
                        "completed";


                    updates[
                        "vipPlans/" +
                        id +
                        "/active"
                    ] =
                        false;


                    return;

                }


                const reward =
                    Math.min(
                        daily,
                        remaining
                    );


                if (
                    reward <= 0
                ) {
                    return;
                }


                totalIncome +=
                    reward;


                claimableCount++;


                const newClaimed =
                    claimed +
                    reward;


                updates[
                    "vipPlans/" +
                    id +
                    "/claimedAmount"
                ] =
                    Number(
                        newClaimed.toFixed(2)
                    );


                updates[
                    "vipPlans/" +
                    id +
                    "/totalEarned"
                ] =
                    Number(
                        newClaimed.toFixed(2)
                    );


                updates[
                    "vipPlans/" +
                    id +
                    "/claimCount"
                ] =
                    numberValue(
                        plan.claimCount
                    ) + 1;


                updates[
                    "vipPlans/" +
                    id +
                    "/lastClaim"
                ] =
                    now;


                updates[
                    "vipPlans/" +
                    id +
                    "/lastClaimTime"
                ] =
                    now;


                updates[
                    "vipPlans/" +
                    id +
                    "/lastProfitTime"
                ] =
                    now;


                if (
                    newClaimed >=
                    totalProfit
                ) {

                    updates[
                        "vipPlans/" +
                        id +
                        "/status"
                    ] =
                        "completed";


                    updates[
                        "vipPlans/" +
                        id +
                        "/active"
                    ] =
                        false;

                }

            }
        );


        if (
            totalIncome <= 0 ||
            claimableCount <= 0
        ) {

            throw new Error(
                "No VIP income is ready yet. Wait until 24 hours are completed."
            );

        }


        const oldBalance =
            numberValue(
                user.balance
            );


        const oldTotalProfit =
            numberValue(
                user.totalProfit
            );


        updates.balance =
            Number(
                (
                    oldBalance +
                    totalIncome
                ).toFixed(2)
            );


        updates.totalProfit =
            Number(
                (
                    oldTotalProfit +
                    totalIncome
                ).toFixed(2)
            );


        updates.lastClaim =
            now;


        await update(
            userRef,
            updates
        );


        // -------------------------------------------------
        // TRANSACTION
        // -------------------------------------------------

        try {

            const transactionRef =
                push(
                    ref(
                        db,
                        "transactions"
                    )
                );


            await set(
                transactionRef,
                {

                    uid:
                        currentUser.uid,

                    email:
                        currentUser.email ||
                        user.email ||
                        "",

                    type:
                        "Daily Income",

                    amount:
                        Number(
                            totalIncome.toFixed(2)
                        ),

                    currency:
                        CURRENCY,

                    status:
                        "approved",

                    createdAt:
                        now,

                    description:
                        "Automatic VIP daily income claimed after 24 hours."

                }
            );

        } catch (transactionError) {

            console.warn(
                "Transaction history error:",
                transactionError
            );

        }


        // -------------------------------------------------
        // REFRESH
        // -------------------------------------------------

        const finalSnapshot =
            await get(
                userRef
            );


        if (
            finalSnapshot.exists()
        ) {

            userData =
                finalSnapshot.val() || {};

            userVipPlans =
                userData.vipPlans || {};

        }


        updateBalanceUI();

        calculateVipTotals();

        renderOwnedVipPlans();

        renderVipPlans();

        updateVipButtons();

        updateClaimTimer();


        showMessage(

            "Daily Income Claimed Successfully!\n\n" +

            "+" +
            money(totalIncome) +

            "\n\n" +

            "VIPs Claimed: " +
            claimableCount +

            "\n\n" +

            "A new 24-hour timer has started."

        );


    } catch (error) {

        console.error(
            "Claim error:",
            error
        );


        showMessage(
            error.message ||
            "Unable to claim daily income."
        );

    } finally {

        claimInProgress =
            false;

        updateClaimTimer();

    }
}


// =========================================================
// CLAIM TIMER
// =========================================================

function updateClaimTimer() {

    if (!claimTimer) {
        return;
    }


    const activePlans =
        Object.values(
            userVipPlans || {}
        ).filter(
            plan =>
                isVipActive(plan)
        );


    if (
        activePlans.length === 0
    ) {

        claimTimer.textContent =
            "No Active VIP";


        if (claimBtn) {

            claimBtn.disabled =
                true;

            claimBtn.innerHTML = `

                <i class="fas fa-lock"></i>
                Claim Daily Income

            `;

        }

        return;
    }


    const readyPlans =
        activePlans.filter(
            plan =>
                canVipClaim(plan)
        );


    if (
        readyPlans.length > 0
    ) {

        claimTimer.textContent =
            "Ready to Claim";


        if (claimBtn) {

            claimBtn.disabled =
                claimInProgress;

            claimBtn.innerHTML = `

                <i class="fas fa-coins"></i>
                Claim Daily Income

            `;

        }

        return;
    }


    let shortest =
        null;


    activePlans.forEach(
        plan => {

            const remaining =
                getVipRemainingClaimTime(
                    plan
                );


            if (
                remaining === null
            ) {
                return;
            }


            if (
                shortest === null ||
                remaining < shortest
            ) {

                shortest =
                    remaining;

            }

        }
    );


    if (
        shortest === null
    ) {

        claimTimer.textContent =
            "Timer unavailable";


        if (claimBtn) {

            claimBtn.disabled =
                true;

        }

        return;
    }


    const hours =
        Math.floor(
            shortest /
            3600000
        );


    const minutes =
        Math.floor(
            (
                shortest %
                3600000
            ) /
            60000
        );


    const seconds =
        Math.floor(
            (
                shortest %
                60000
            ) /
            1000
        );


    claimTimer.textContent =

        String(hours)
            .padStart(2, "0") +

        ":" +

        String(minutes)
            .padStart(2, "0") +

        ":" +

        String(seconds)
            .padStart(2, "0");


    if (claimBtn) {

        claimBtn.disabled =
            true;

        claimBtn.innerHTML = `

            <i class="fas fa-lock"></i>
            Claim Daily Income

        `;

    }
}


// =========================================================
// START TIMER
// =========================================================

function startClaimTimer() {

    if (
        claimTimerInterval
    ) {

        clearInterval(
            claimTimerInterval
        );

    }


    updateClaimTimer();


    claimTimerInterval =
        setInterval(
            () => {

                updateClaimTimer();

            },
            1000
        );
}


// =========================================================
// VISIBILITY
// =========================================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden
        ) {

            updateBalanceUI();

            calculateVipTotals();

            renderOwnedVipPlans();

            renderVipPlans();

            updateVipButtons();

            updateClaimTimer();

        }

    }
);


// =========================================================
// AUTH
// =========================================================

onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            currentUser =
                null;


            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";

            }


            window.location.href =
                "login.html";


            return;
        }


        currentUser =
            user;


        try {

            loadVipPackages();

            startUserListener();

            loadUserVipRequests();

            startClaimTimer();


            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";

            }

        } catch (error) {

            console.error(
                "VIP initialization error:",
                error
            );


            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";

            }

        }

    }
);


// =========================================================
// CLEANUP
// =========================================================

window.addEventListener(
    "beforeunload",
    () => {

        if (
            claimTimerInterval
        ) {

            clearInterval(
                claimTimerInterval
            );

        }

    }
);


// =========================================================
// GLOBAL FUNCTIONS
// =========================================================

window.buyVip =
    buyVip;

window.claimDailyIncome =
    claimDailyIncome;

window.updateClaimTimer =
    updateClaimTimer;

window.updateVipButtons =
    updateVipButtons;

window.renderVipPlans =
    renderVipPlans;

window.renderOwnedVipPlans =
    renderOwnedVipPlans;

window.calculateVipTotals =
    calculateVipTotals;

window.loadVipPackages =
    loadVipPackages;


// =========================================================
// DEBUG
// =========================================================

console.log(
    "Money Vault VIP.JS loaded successfully."
);

console.log(
    "Currency: RWF / FRW"
);

console.log(
    "VIP purchase mode: AUTOMATIC"
);

console.log(
    "VIP approval: NOT REQUIRED"
);

console.log(
    "VIP becomes ACTIVE immediately."
);

console.log(
    "Balance is deducted immediately."
);

console.log(
    "Referral bonus: 1,000 RWF"
);

console.log(
    "Referral bonus is paid immediately after VIP purchase."
);

console.log(
    "First claim: 24 hours after purchase."
);

console.log(
    "Same VIP plan cannot be purchased twice."
);

console.log(
    "User can own multiple different VIP plans."
);
