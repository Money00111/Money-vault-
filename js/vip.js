// =========================================================
// MONEY VAULT - VIP.JS
// COMPLETE CLEAN VERSION
// CURRENCY: RWF / FRW
//
// RULES:
// - User can own MANY DIFFERENT VIP plans.
// - Same VIP PLAN ID cannot be purchased twice.
// - Starter + Bronze + Silver + Gold = ALLOWED.
// - Starter + Starter = NOT ALLOWED.
// - Purchase is a REQUEST.
// - Admin approves the request.
// - VIP becomes active only after admin approval.
// - Daily income is claimed once every 24 hours.
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
    push,
    update,
    onValue,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// =========================================================
// DOM ELEMENTS
// =========================================================

const vipGrid =
    document.querySelector(".vip-grid");

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
    document.getElementById("claimIncomeBtn");

const claimTimer =
    document.getElementById("claimTimer");


// =========================================================
// GLOBAL STATE
// =========================================================

let currentUser = null;

let userData = {};

let userVipPlans = {};

let availableVipPlans = {};

let vipRequests = {};

let userListenerStarted = false;

let requestListenerStarted = false;

let vipPlansListenerStarted = false;

let claimTimerInterval = null;


// =========================================================
// CONSTANTS
// =========================================================

const ONE_DAY =
    24 * 60 * 60 * 1000;

const CURRENCY =
    "RWF";


// =========================================================
// HELPERS
// =========================================================

function money(value) {

    return (
        Number(value || 0)
            .toLocaleString("en-US", {
                maximumFractionDigits: 2
            }) +
        " " +
        CURRENCY
    );
}


function numberValue(value) {

    const n = Number(value);

    return Number.isFinite(n)
        ? n
        : 0;
}


function normalizeName(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}


function normalizeStatus(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
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
        Number(timestamp || 0);

    if (!value) {
        return "N/A";
    }

    return new Date(value)
        .toLocaleString();
}


function getDurationDays(plan) {

    return numberValue(
        plan?.duration ??
        plan?.totalDays ??
        0
    );
}


function getPlanDailyIncome(plan) {

    return numberValue(
        plan?.dailyIncome
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


function showMessage(message) {

    alert(message);
}


// =========================================================
// VIP ID NORMALIZATION
// =========================================================
//
// IMPORTANT:
//
// VIP ID is the primary identity.
//
// Example:
// starter
// bronze
// silver
// gold
//
// If Firebase uses:
// Starter Plan
//
// the ID is still more reliable than the name.
//

function normalizePlanId(value) {

    return String(value || "")
        .trim()
        .toLowerCase();
}


// =========================================================
// GET PLAN ID FROM OWNED VIP
// =========================================================

function getOwnedPlanId(id, plan) {

    if (!plan) {
        return "";
    }

    return normalizePlanId(
        plan.vipPlanId ||
        plan.planId ||
        plan.vipId ||
        plan.id ||
        id
    );
}


// =========================================================
// GET REQUEST PLAN ID
// =========================================================

function getRequestPlanId(request) {

    if (!request) {
        return "";
    }

    return normalizePlanId(
        request.vipPlanId ||
        request.planId ||
        request.vipId ||
        ""
    );
}


// =========================================================
// GET PLAN NAME
// =========================================================

function getVipName(plan) {

    return String(
        plan?.vipName ||
        plan?.name ||
        plan?.planName ||
        ""
    ).trim();
}


// =========================================================
// SIDEBAR
// =========================================================

menuBtn?.addEventListener(
    "click",
    () => {

        sidebar?.classList.toggle(
            "active"
        );

    }
);


// Close sidebar when link is clicked

document
    .querySelectorAll(".sidebar a")
    .forEach(link => {

        link.addEventListener(
            "click",
            () => {

                sidebar?.classList.remove(
                    "active"
                );

            }
        );

    });


// =========================================================
// LOGOUT
// =========================================================

logoutBtn?.addEventListener(
    "click",
    async () => {

        const ok =
            confirm(
                "Are you sure you want to logout?"
            );

        if (!ok) return;

        try {

            await signOut(auth);

            location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            showMessage(
                "Logout failed. Please try again."
            );

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

            location.href =
                "login.html";

            return;
        }

        currentUser =
            user;

        await initializeVipPage();

    }
);


// =========================================================
// INITIALIZE VIP PAGE
// =========================================================

async function initializeVipPage() {

    try {

        await loadUserData();

        loadVipPackages();

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

        showMessage(
            "Unable to load VIP page."
        );

    }
}


// =========================================================
// LOAD USER DATA
// =========================================================

function loadUserData() {

    return new Promise(resolve => {

        if (!currentUser) {

            resolve();

            return;
        }

        if (userListenerStarted) {

            resolve();

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

                if (!snapshot.exists()) {

                    userData = {};

                    userVipPlans = {};

                    updateBalanceUI();

                    calculateVipTotals();

                    renderOwnedVipPlans();

                    updateVipButtons();

                    resolve();

                    return;
                }

                userData =
                    snapshot.val() || {};

                userVipPlans =
                    userData.vipPlans || {};

                updateBalanceUI();

                checkLocalVipExpiration();

                calculateVipTotals();

                renderOwnedVipPlans();

                updateVipButtons();

                resolve();

            },

            error => {

                console.error(
                    "User listener error:",
                    error
                );

                resolve();

            }
        );

    });
}


// =========================================================
// UPDATE BALANCE UI
// =========================================================

function updateBalanceUI() {

    if (!balanceEl) return;

    balanceEl.textContent =
        money(
            userData.balance
        );
}


// =========================================================
// LOAD VIP PACKAGES
// =========================================================

function loadVipPackages() {

    if (!vipGrid) return;

    if (vipPlansListenerStarted) {
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

            if (!snapshot.exists()) {

                vipGrid.innerHTML = `
                    <div class="emptyVip">
                        <i class="fas fa-gem"></i>
                        <h3>No VIP Plans Available</h3>
                        <p>Please check again later.</p>
                    </div>
                `;

                return;
            }

            let html = "";

            snapshot.forEach(child => {

                const plan =
                    child.val() || {};

                const active =
                    plan.status === true ||
                    plan.status === "active" ||
                    plan.active === true;

                if (!active) {
                    return;
                }

                const planId =
                    String(child.key);

                availableVipPlans[
                    planId
                ] = plan;

                const name =
                    getVipName(plan) ||
                    "VIP Plan";

                const price =
                    numberValue(
                        plan.price
                    );

                const daily =
                    getPlanDailyIncome(
                        plan
                    );

                const duration =
                    getDurationDays(
                        plan
                    );

                const profit =
                    getPlanTotalProfit(
                        plan
                    );

                html += `

                    <div
                        class="vip-card"
                        data-plan-id="${escapeHTML(planId)}"
                    >

                        <div class="vip-badge">
                            ${escapeHTML(name)}
                        </div>

                        <h2>
                            ${money(price)}
                        </h2>

                        <ul>

                            <li>
                                <i class="fas fa-check"></i>

                                Daily Income:

                                <b>
                                    ${money(daily)}
                                </b>
                            </li>

                            <li>
                                <i class="fas fa-check"></i>

                                Duration:

                                <b>
                                    ${duration} Days
                                </b>
                            </li>

                            <li>
                                <i class="fas fa-check"></i>

                                Total Profit:

                                <b>
                                    ${money(profit)}
                                </b>
                            </li>

                        </ul>

                        <button
                            type="button"
                            class="buyVipBtn"
                            data-plan-id="${escapeHTML(planId)}"
                            data-vip="${escapeHTML(name)}"
                            data-price="${price}"
                            data-daily="${daily}"
                            data-profit="${profit}"
                            data-days="${duration}"
                        >

                            <i class="fas fa-crown"></i>

                            Buy Now

                        </button>

                    </div>

                `;

            });

            if (!html) {

                vipGrid.innerHTML = `
                    <div class="emptyVip">
                        <i class="fas fa-gem"></i>
                        <h3>No Active VIP Plans</h3>
                    </div>
                `;

                return;
            }

            vipGrid.innerHTML =
                html;

            registerVipButtons();

            updateVipButtons();

        },

        error => {

            console.error(
                "VIP plans error:",
                error
            );

            vipGrid.innerHTML = `
                <div class="emptyVip">
                    <h3>Unable to load VIP Plans</h3>
                    <p>Please refresh the page.</p>
                </div>
            `;

        }
    );
}


// =========================================================
// REGISTER BUY BUTTONS
// =========================================================

function registerVipButtons() {

    document
        .querySelectorAll(".buyVipBtn")
        .forEach(button => {

            button.onclick = () => {

                buyVip(button);

            };

        });
}


// =========================================================
// CHECK SAME VIP BY PLAN ID
// =========================================================
//
// THIS IS THE IMPORTANT FIX.
//
// We first compare:
// vipPlanId / planId / vipId
//
// Only when an old record has no ID,
// we use the name as fallback.
//

function hasActiveVipByPlan(
    planId,
    vipName
) {

    const targetId =
        normalizePlanId(planId);

    const targetName =
        normalizeName(vipName);

    return Object.entries(
        userVipPlans || {}
    ).some(
        ([id, plan]) => {

            if (!plan) {
                return false;
            }

            const status =
                normalizeStatus(
                    plan.status
                );

            if (
                status !== "active"
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

            const ownedId =
                getOwnedPlanId(
                    id,
                    plan
                );

            // Primary check: PLAN ID

            if (
                targetId &&
                ownedId
            ) {

                if (
                    targetId ===
                    ownedId
                ) {
                    return true;
                }

            }

            // Fallback for old records
            // which don't have a plan ID.

            if (
                !ownedId &&
                targetName
            ) {

                const ownedName =
                    normalizeName(
                        getVipName(plan)
                    );

                return (
                    ownedName ===
                    targetName
                );

            }

            return false;

        }
    );
}


// =========================================================
// CHECK PENDING / PROCESSING SAME VIP
// =========================================================
//
// Same VIP request is blocked only if:
//
// pending
// OR
// processing
//
// rejected and processing_error
// are allowed again.
//

function hasPendingVipRequest(
    planId,
    vipName
) {

    const targetId =
        normalizePlanId(planId);

    const targetName =
        normalizeName(vipName);

    return Object.values(
        vipRequests || {}
    ).some(
        request => {

            if (!request) {
                return false;
            }

            const status =
                normalizeStatus(
                    request.status
                );

            if (
                status !== "pending" &&
                status !== "processing"
            ) {

                return false;

            }

            const requestId =
                getRequestPlanId(
                    request
                );

            // Primary check: PLAN ID

            if (
                targetId &&
                requestId
            ) {

                return (
                    targetId ===
                    requestId
                );

            }

            // Fallback for old requests

            if (
                !requestId &&
                targetName
            ) {

                const requestName =
                    normalizeName(
                        request.vipName ||
                        request.name ||
                        request.planName
                    );

                return (
                    requestName ===
                    targetName
                );

            }

            return false;

        }
    );
}


// =========================================================
// UPDATE ALL BUY BUTTONS
// =========================================================

function updateVipButtons() {

    document
        .querySelectorAll(".buyVipBtn")
        .forEach(button => {

            const planId =
                button.dataset.planId ||
                "";

            const vipName =
                button.dataset.vip ||
                "";

            const purchased =
                hasActiveVipByPlan(
                    planId,
                    vipName
                );

            const pending =
                hasPendingVipRequest(
                    planId,
                    vipName
                );

            button.disabled =
                false;

            button.classList.remove(
                "activeVip"
            );

            button.classList.remove(
                "pendingVip"
            );

            if (purchased) {

                button.disabled =
                    true;

                button.classList.add(
                    "activeVip"
                );

                button.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    Purchased
                `;

                return;
            }

            if (pending) {

                button.disabled =
                    true;

                button.classList.add(
                    "pendingVip"
                );

                button.innerHTML = `
                    <i class="fas fa-clock"></i>
                    Request Pending
                `;

                return;
            }

            button.innerHTML = `
                <i class="fas fa-crown"></i>
                Buy Now
            `;

        });
}


// =========================================================
// BUY VIP
// =========================================================

async function buyVip(button) {

    if (!currentUser) {

        showMessage(
            "Please login first."
        );

        return;
    }

    if (
        !button ||
        button.disabled
    ) {

        return;
    }

    const planId =
        String(
            button.dataset.planId ||
            ""
        ).trim();

    const vipName =
        String(
            button.dataset.vip ||
            ""
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
            "VIP plan ID is missing. Please contact support."
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
        dailyIncome < 0 ||
        duration <= 0
    ) {

        showMessage(
            "This VIP plan has invalid information."
        );

        return;
    }


    // =====================================================
    // CHECK ACTIVE SAME VIP
    // =====================================================

    if (
        hasActiveVipByPlan(
            planId,
            vipName
        )
    ) {

        showMessage(
            "You already have " +
            vipName +
            ". You cannot buy the same VIP twice."
        );

        updateVipButtons();

        return;
    }


    // =====================================================
    // CHECK PENDING SAME VIP
    // =====================================================

    if (
        hasPendingVipRequest(
            planId,
            vipName
        )
    ) {

        showMessage(
            "You already have a pending request for " +
            vipName +
            "."
        );

        updateVipButtons();

        return;
    }


    // =====================================================
    // CHECK BALANCE
    // =====================================================

    const balanceNow =
        numberValue(
            userData.balance
        );

    if (
        balanceNow < price
    ) {

        showMessage(
            "Insufficient Balance.\n\n" +
            "Required: " +
            money(price) +
            "\nAvailable: " +
            money(balanceNow)
        );

        return;
    }


    // =====================================================
    // CONFIRM
    // =====================================================

    const ok =
        confirm(
            "Request " +
            vipName +
            "?\n\n" +
            "Price: " +
            money(price) +
            "\nDaily Income: " +
            money(dailyIncome) +
            "\nDuration: " +
            duration +
            " Days\n\n" +
            "The VIP will become active after admin approval."
        );

    if (!ok) {
        return;
    }


    // =====================================================
    // PREVENT DOUBLE CLICK
    // =====================================================

    button.disabled =
        true;

    const oldText =
        button.innerHTML;

    button.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        Sending...
    `;


    try {

        // =================================================
        // FINAL FRESH USER DATA CHECK
        // =================================================

        const freshUserSnapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    currentUser.uid
                )
            );

        if (
            freshUserSnapshot.exists()
        ) {

            userData =
                freshUserSnapshot.val() || {};

            userVipPlans =
                userData.vipPlans || {};

        }


        // =================================================
        // FINAL REQUEST CHECK
        // =================================================

        await loadUserVipRequestsOnce();


        if (
            hasActiveVipByPlan(
                planId,
                vipName
            )
        ) {

            throw new Error(
                "You already have " +
                vipName +
                ". You cannot buy the same VIP twice."
            );

        }


        if (
            hasPendingVipRequest(
                planId,
                vipName
            )
        ) {

            throw new Error(
                "You already have a pending request for " +
                vipName +
                "."
            );

        }


        // =================================================
        // CREATE REQUEST
        // =================================================

        const requestRef =
            push(
                ref(
                    db,
                    "vipPurchaseRequests"
                )
            );

        const requestId =
            requestRef.key;

        const now =
            Date.now();


        const requestData = {

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

            status:
                "pending",

            currency:
                CURRENCY,

            requestedAt:
                now,

            createdAt:
                now,

            requestId:
                requestId

        };


        await set(
            requestRef,
            requestData
        );


        // =================================================
        // LOCAL CACHE
        // =================================================

        vipRequests[
            requestId
        ] = requestData;


        updateVipButtons();


        showMessage(
            vipName +
            " purchase request submitted successfully.\n\n" +
            "Status: Pending\n\n" +
            "Your VIP will activate after admin approval."
        );


    } catch (error) {

        console.error(
            "VIP purchase request error:",
            error
        );

        button.disabled =
            false;

        button.innerHTML =
            oldText;

        showMessage(
            error.message ||
            "Unable to submit VIP request."
        );

        updateVipButtons();

    }

}


// =========================================================
// LOAD USER VIP REQUESTS
// =========================================================

function loadUserVipRequests() {

    if (!currentUser) {
        return;
    }

    if (requestListenerStarted) {
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
                "Could not load VIP requests:",
                error
            );

        }
    );
}


// =========================================================
// ONE-TIME REQUEST LOAD
// =========================================================

async function loadUserVipRequestsOnce() {

    if (!currentUser) {
        return;
    }

    try {

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

        const snapshot =
            await get(
                requestsRef
            );

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

    } catch (error) {

        // Do not hide Firebase permission
        // problems as duplicate purchases.

        console.warn(
            "One-time VIP request load failed:",
            error
        );

    }

}


// =========================================================
// CHECK LOCAL VIP EXPIRATION
// =========================================================

function checkLocalVipExpiration() {

    if (!userVipPlans) {
        return;
    }

    const now =
        Date.now();

    let changed =
        false;


    Object.entries(
        userVipPlans
    ).forEach(
        ([id, plan]) => {

            if (!plan) {
                return;
            }

            const status =
                normalizeStatus(
                    plan.status
                );

            if (
                status !== "active"
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

                plan.status =
                    "expired";

                plan.active =
                    false;

                plan.remainingDays =
                    0;

                changed =
                    true;

            }

        }
    );


    if (changed) {

        calculateVipTotals();

        renderOwnedVipPlans();

        updateVipButtons();

    }

}


// =========================================================
// CALCULATE TOTALS FOR ALL ACTIVE VIPS
// =========================================================

function calculateVipTotals() {

    let totalDaily =
        0;

    let totalRemainingProfit =
        0;

    let activeCount =
        0;

    const now =
        Date.now();


    Object.values(
        userVipPlans || {}
    ).forEach(
        plan => {

            if (!plan) {
                return;
            }

            const status =
                normalizeStatus(
                    plan.status
                );

            if (
                status !== "active"
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
                    plan.totalEarned
                );

            const remainingProfit =
                Math.max(
                    0,
                    totalProfit -
                    claimed
                );


            activeCount++;

            totalDaily +=
                daily;

            totalRemainingProfit +=
                remainingProfit;

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
// RENDER OWNED VIP PLANS
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

            <div class="emptyVip">

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
        ([, a], [, b]) =>

            numberValue(
                b.approvedAt ||
                b.startDate ||
                b.purchasedAt
            )

            -

            numberValue(
                a.approvedAt ||
                a.startDate ||
                a.purchasedAt
            )
    );


    plans.forEach(
        ([id, plan]) => {

            if (!plan) {
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
                    plan.totalEarned
                );


            const remainingProfit =
                Math.max(
                    0,
                    totalProfit -
                    claimed
                );


            let remainingDays =
                numberValue(
                    plan.remainingDays
                );


            const startDate =
                numberValue(
                    plan.startDate ||
                    plan.approvedAt ||
                    plan.purchasedAt
                );


            const endDate =
                numberValue(
                    plan.endDate
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


            const statusRaw =
                normalizeStatus(
                    plan.status
                );


            const isActive =
                statusRaw === "active" &&
                (
                    !endDate ||
                    Date.now() < endDate
                );


            const statusText =
                isActive
                    ? "ACTIVE"
                    : statusRaw === "expired"
                        ? "EXPIRED"
                        : String(
                            plan.status ||
                            "UNKNOWN"
                        ).toUpperCase();


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
                        }"
                    >
                        ${statusText}
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

                </div>

            `;


            ownedVipList.appendChild(
                card
            );

        }
    );

}


// =========================================================
// CLAIM BUTTON
// =========================================================

claimBtn?.addEventListener(
    "click",
    claimDailyIncome
);


// =========================================================
// CLAIM DAILY INCOME
// =========================================================

async function claimDailyIncome() {

    if (!currentUser) {

        showMessage(
            "Please login first."
        );

        return;
    }


    if (
        claimBtn?.disabled
    ) {

        return;
    }


    try {

        claimBtn.disabled =
            true;


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


        const lastClaim =
            numberValue(
                user.lastClaim
            );


        // =================================================
        // 24 HOUR LOCK
        // =================================================

        if (
            lastClaim > 0 &&
            now - lastClaim < ONE_DAY
        ) {

            const remaining =
                ONE_DAY -
                (
                    now -
                    lastClaim
                );


            const hours =
                Math.floor(
                    remaining /
                    3600000
                );


            const minutes =
                Math.floor(
                    (
                        remaining %
                        3600000
                    ) /
                    60000
                );


            throw new Error(
                "Daily income already claimed.\n\n" +
                "Try again after " +
                hours +
                "h " +
                minutes +
                "m."
            );

        }


        // =================================================
        // CALCULATE ALL ACTIVE VIP INCOME
        // =================================================

        let totalIncome =
            0;

        let activeCount =
            0;

        const updates = {};

        const claimedUpdates = {};


        Object.entries(
            plans
        ).forEach(
            ([id, plan]) => {

                if (!plan) {
                    return;
                }


                const status =
                    normalizeStatus(
                        plan.status
                    );


                if (
                    status !== "active"
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
                        plan.totalEarned
                    );


                const remainingProfit =
                    Math.max(
                        0,
                        totalProfit -
                        claimed
                    );


                if (
                    remainingProfit <= 0
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
                        remainingProfit
                    );


                if (
                    reward <= 0
                ) {

                    return;

                }


                totalIncome +=
                    reward;


                activeCount++;


                const newClaimed =
                    claimed +
                    reward;


                claimedUpdates[
                    "vipPlans/" +
                    id +
                    "/claimedAmount"
                ] =
                    Number(
                        newClaimed.toFixed(2)
                    );


                claimedUpdates[
                    "vipPlans/" +
                    id +
                    "/totalEarned"
                ] =
                    Number(
                        newClaimed.toFixed(2)
                    );


                claimedUpdates[
                    "vipPlans/" +
                    id +
                    "/claimCount"
                ] =
                    numberValue(
                        plan.claimCount
                    ) + 1;


                claimedUpdates[
                    "vipPlans/" +
                    id +
                    "/lastClaim"
                ] =
                    now;


                if (
                    totalProfit > 0 &&
                    newClaimed >= totalProfit
                ) {

                    claimedUpdates[
                        "vipPlans/" +
                        id +
                        "/status"
                    ] =
                        "completed";


                    claimedUpdates[
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
            activeCount <= 0
        ) {

            throw new Error(
                "No active VIP income is available to claim."
            );

        }


        // =================================================
        // UPDATE USER
        // =================================================

        const oldBalance =
            numberValue(
                user.balance
            );


        const newBalance =
            oldBalance +
            totalIncome;


        const oldTotalProfit =
            numberValue(
                user.totalProfit
            );


        const newTotalProfit =
            oldTotalProfit +
            totalIncome;


        const updateData = {

            balance:
                Number(
                    newBalance.toFixed(2)
                ),

            totalProfit:
                Number(
                    newTotalProfit.toFixed(2)
                ),

            lastClaim:
                now,

            ...updates,

            ...claimedUpdates

        };


        await update(
            userRef,
            updateData
        );


        // =================================================
        // TRANSACTION HISTORY
        // =================================================

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
                        "Daily income from multiple active VIP plans."

                }
            );


        } catch (transactionError) {

            console.warn(
                "Transaction history write failed:",
                transactionError
            );

        }


        // =================================================
        // UPDATE LOCAL DATA
        // =================================================

        userData =
            {
                ...user,
                ...updateData
            };


        userVipPlans =
            userData.vipPlans || {};


        updateBalanceUI();

        calculateVipTotals();

        renderOwnedVipPlans();

        updateVipButtons();

        updateClaimTimer();


        showMessage(
            "Daily Income Claimed Successfully!\n\n" +
            "+" +
            money(totalIncome)
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

        updateClaimTimer();

    }

}


// =========================================================
// CLAIM COUNTDOWN
// =========================================================

function updateClaimTimer() {

    if (!claimTimer) {
        return;
    }


    const lastClaim =
        numberValue(
            userData.lastClaim
        );


    if (!lastClaim) {

        claimTimer.textContent =
            "Ready to Claim";


        if (claimBtn) {

            claimBtn.disabled =
                false;

        }

        return;

    }


    const remaining =
        ONE_DAY -
        (
            Date.now() -
            lastClaim
        );


    if (
        remaining <= 0
    ) {

        claimTimer.textContent =
            "Ready to Claim";


        if (claimBtn) {

            claimBtn.disabled =
                false;

        }

        return;

    }


    const hours =
        Math.floor(
            remaining /
            3600000
        );


    const minutes =
        Math.floor(
            (
                remaining %
                3600000
            ) /
            60000
        );


    const seconds =
        Math.floor(
            (
                remaining %
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

    }

}


// =========================================================
// START CLAIM TIMER
// =========================================================

function startClaimTimer() {

    if (claimTimerInterval) {

        clearInterval(
            claimTimerInterval
        );

    }


    updateClaimTimer();


    claimTimerInterval =
        setInterval(
            updateClaimTimer,
            1000
        );

}


// =========================================================
// REFRESH WHEN PAGE BECOMES VISIBLE
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

            updateVipButtons();

            updateClaimTimer();

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
// GLOBAL EXPORTS
// =========================================================

window.buyVip =
    buyVip;

window.claimDailyIncome =
    claimDailyIncome;

window.calculateVipTotals =
    calculateVipTotals;

window.renderOwnedVipPlans =
    renderOwnedVipPlans;

window.updateVipButtons =
    updateVipButtons;

window.loadVipPackages =
    loadVipPackages;


// =========================================================
// READY
// =========================================================

console.log(
    "Money Vault VIP.JS loaded successfully."
);

console.log(
    "VIP rule: different VIP plans allowed; same VIP plan blocked."
);

console.log(
    "Currency: RWF / FRW"
);
