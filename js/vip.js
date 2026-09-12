// =========================================================
// MONEY VAULT - VIP.JS
// COMPLETE CLEAN VERSION
// CURRENCY: RWF / FRW
//
// VIP SYSTEM
// ---------------------------------------------------------
// 1. User can own MANY DIFFERENT VIP plans.
// 2. Same VIP PLAN cannot be purchased twice.
// 3. User must have enough balance.
// 4. VIP price is deducted immediately when Buy Now is confirmed.
// 5. Purchase request is created as PENDING.
// 6. Admin approves the request.
// 7. VIP becomes ACTIVE only after Admin approval.
// 8. Approval gives NO daily income immediately.
// 9. First claim is available EXACTLY 24 HOURS after approval.
// 10. Every VIP has its OWN 24-hour timer.
// 11. After claiming, that VIP starts another 24-hour timer.
// 12. VIP plans source: vipPlans
// 13. User VIP ownership source: users/{uid}/vipPlans
// 14. Purchase requests source: vipPurchaseRequests
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
    runTransaction,
    remove
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


// =========================================================
// GET PLAN ID
// =========================================================

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
// GET CLAIM START
// =========================================================
//
// IMPORTANT:
//
// For ACTIVE VIP:
//
// lastClaim = approval time
//
// After claim:
//
// lastClaim = claim time
//
// We intentionally DO NOT use purchasedAt
// as the first claim timer.
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

    return 0;
}


// =========================================================
// CHECK VIP ACTIVE
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
// CHECK CAN CLAIM
// =========================================================

function canVipClaim(plan) {

    if (!isVipActive(plan)) {
        return false;
    }

    const claimStart =
        getVipClaimStartTime(plan);

    if (claimStart <= 0) {
        return false;
    }

    return (
        Date.now() - claimStart >=
        ONE_DAY
    );
}


// =========================================================
// GET REMAINING CLAIM TIME
// =========================================================

function getVipRemainingClaimTime(plan) {

    if (!isVipActive(plan)) {
        return null;
    }

    const claimStart =
        getVipClaimStartTime(plan);

    if (claimStart <= 0) {
        return null;
    }

    const remaining =
        ONE_DAY -
        (
            Date.now() -
            claimStart
        );

    return Math.max(
        0,
        remaining
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
// FIND OWNED VIP
// =========================================================

function hasActiveVipByPlan(
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

            if (
                !isVipActive(vip)
            ) {
                return false;
            }

            const ownedId =
                getPlanId(
                    vip,
                    key
                );

            const ownedName =
                String(
                    vip.vipName ||
                    vip.name ||
                    ""
                )
                    .trim()
                    .toLowerCase();

            if (
                targetId &&
                ownedId
            ) {

                return (
                    targetId ===
                    ownedId
                );

            }

            if (
                targetName &&
                ownedName
            ) {

                return (
                    targetName ===
                    ownedName
                );

            }

            return false;

        }
    );
}


// =========================================================
// PENDING REQUEST CHECK
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
                    request.vipId ??
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
                requestId
            ) {

                return (
                    targetId ===
                    requestId
                );

            }

            if (
                targetName &&
                requestName
            ) {

                return (
                    targetName ===
                    requestName
                );

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


            // ---------------------------------------------
            // PLAN AVAILABILITY
            // ---------------------------------------------

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


            // ---------------------------------------------
            // OWNERSHIP
            // ---------------------------------------------

            const alreadyOwned =
                hasActiveVipByPlan(
                    planId,
                    vipName
                );

            const pending =
                hasPendingVipRequest(
                    planId,
                    vipName
                );


            // ---------------------------------------------
            // CARD
            // ---------------------------------------------

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
                    ${alreadyOwned || pending ? "disabled" : ""}
                >

                    ${
                        alreadyOwned
                            ? '<i class="fas fa-check-circle"></i> Already Active'
                            : pending
                                ? '<i class="fas fa-clock"></i> Pending Approval'
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
                            Please refresh the page.
                        </p>

                    </div>

                `;

            }

        }
    );
}


// =========================================================
// LOAD CURRENT USER
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

                updateVipButtons();

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

            renderVipPlans();

        },

        error => {

            console.error(
                "VIP request error:",
                error
            );

        }

    );
}


// =========================================================
// LOAD REQUESTS ONCE
// =========================================================

async function loadUserVipRequestsOnce() {

    if (!currentUser) {
        return;
    }

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
                    hasActiveVipByPlan(
                        planId,
                        vipName
                    );

                const pending =
                    hasPendingVipRequest(
                        planId,
                        vipName
                    );


                if (purchased) {

                    button.disabled =
                        true;

                    button.innerHTML = `

                        <i class="fas fa-check-circle"></i>
                        Already Active

                    `;

                    return;
                }


                if (pending) {

                    button.disabled =
                        true;

                    button.innerHTML = `

                        <i class="fas fa-clock"></i>
                        Pending Approval

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
// DEDUCT VIP PRICE SAFELY
// =========================================================
//
// This transaction is important.
//
// It guarantees that balance does not become negative.
//
// If balance = 10,000
// VIP price = 5,000
//
// New balance = 5,000
//
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


                const newBalance =
                    Number(
                        (
                            balance -
                            price
                        ).toFixed(2)
                    );


                return {
                    ...current,
                    balance:
                        newBalance
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


    const updated =
        result.snapshot.val() || {};

    userData =
        updated;

    userVipPlans =
        updated.vipPlans || {};

    updateBalanceUI();
}


// =========================================================
// REFUND VIP PRICE
// =========================================================
//
// Used only if request creation fails after
// the balance was already deducted.
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

                    return current;

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
    // ACTIVE VIP CHECK
    // -----------------------------------------------------

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

        return;
    }


    // -----------------------------------------------------
    // PENDING REQUEST CHECK
    // -----------------------------------------------------

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

        return;
    }


    // -----------------------------------------------------
    // FRESH USER DATA
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
        // FRESH REQUEST DATA
        // -------------------------------------------------

        await loadUserVipRequestsOnce();


        if (
            hasActiveVipByPlan(
                planId,
                vipName
            )
        ) {

            throw new Error(
                "You already have this VIP active."
            );

        }


        if (
            hasPendingVipRequest(
                planId,
                vipName
            )
        ) {

            throw new Error(
                "You already have a pending request for this VIP."
            );

        }


        // -------------------------------------------------
        // BALANCE CHECK
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

                "The VIP price will be deducted from your balance now.\n\n" +

                "VIP activation requires Admin approval.\n\n" +

                "No profit will be added at approval.\n\n" +

                "First claim will be available 24 hours after Admin approval."

            );


        if (!ok) {
            return;
        }


        purchaseInProgress =
            true;


        const oldButtonText =
            button.innerHTML;


        button.disabled =
            true;


        button.innerHTML = `

            <i class="fas fa-spinner fa-spin"></i>
            Processing...

        `;


        let balanceDeducted =
            false;

        let requestCreated =
            false;

        let requestId =
            "";


        try {

            // -------------------------------------------------
            // STEP 1
            // DEDUCT BALANCE
            // -------------------------------------------------

            await deductVipPrice(
                price
            );

            balanceDeducted =
                true;


            // -------------------------------------------------
            // STEP 2
            // CREATE REQUEST
            // -------------------------------------------------

            const requestRef =
                push(
                    ref(
                        db,
                        "vipPurchaseRequests"
                    )
                );


            requestId =
                requestRef.key;


            const now =
                Date.now();


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
                    "pending",

                balanceDeducted:
                    true,

                balanceDeductedAmount:
                    Number(
                        price.toFixed(2)
                    ),

                requestedAt:
                    now,

                createdAt:
                    now

            };


            await set(
                requestRef,
                requestData
            );


            requestCreated =
                true;


            vipRequests[
                requestId
            ] =
                requestData;


            // -------------------------------------------------
            // TRANSACTION HISTORY
            // -------------------------------------------------
            //
            // This records the VIP purchase.
            // It does NOT add money to the balance.
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
                            "pending",

                        vipPlanId:
                            planId,

                        vipName:
                            vipName,

                        requestId:
                            requestId,

                        createdAt:
                            now,

                        description:
                            "VIP purchase paid from account balance and waiting for Admin approval."

                    }
                );

            } catch (transactionError) {

                console.warn(
                    "VIP transaction history error:",
                    transactionError
                );

            }


            // -------------------------------------------------
            // REFRESH UI
            // -------------------------------------------------

            updateBalanceUI();

            updateVipButtons();

            renderVipPlans();


            showMessage(

                vipName +
                " purchase submitted successfully.\n\n" +

                "Amount deducted: " +
                money(price) +

                "\n\n" +

                "Status: PENDING\n\n" +

                "Wait for Admin approval.\n\n" +

                "After approval, your VIP becomes ACTIVE.\n\n" +

                "First claim: 24 hours after approval."

            );


        } catch (error) {

            console.error(
                "VIP purchase process error:",
                error
            );


            // -------------------------------------------------
            // REFUND IF BALANCE WAS DEDUCTED BUT REQUEST FAILED
            // -------------------------------------------------

            if (
                balanceDeducted &&
                !requestCreated
            ) {

                try {

                    await refundVipPrice(
                        price
                    );

                    console.log(
                        "VIP purchase refund completed."
                    );

                } catch (refundError) {

                    console.error(
                        "VIP refund error:",
                        refundError
                    );

                    showMessage(

                        "VIP purchase failed, but automatic refund also failed.\n\n" +

                        "Please contact support."

                    );

                    return;
                }

            }


            showMessage(

                error.message ||
                "Unable to purchase VIP."

            );


            button.disabled =
                false;

            button.innerHTML =
                oldButtonText;

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

        button.disabled =
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
                    a?.approvedAt ||
                    a?.startDate ||
                    0
                );

            const bTime =
                numberValue(
                    b?.approvedAt ||
                    b?.startDate ||
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
                    plan.startDate ||
                    plan.approvedAt ||
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


            // -------------------------------------------------
            // CLAIM STATUS
            // -------------------------------------------------

            let claimStatus =
                "Waiting for approval";

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

                    const remaining =
                        getVipRemainingClaimTime(
                            plan
                        );


                    if (
                        remaining !== null
                    ) {

                        claimStatus =
                            "24h timer running";

                        claimClass =
                            "waiting";

                    }

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

                        ${escapeHTML(statusText)}

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


        // -------------------------------------------------
        // GET FRESH USER
        // -------------------------------------------------

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


        // -------------------------------------------------
        // PROCESS EVERY VIP SEPARATELY
        // -------------------------------------------------

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


                // -------------------------------------------------
                // EXPIRED
                // -------------------------------------------------

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


                // -------------------------------------------------
                // APPROVAL / LAST CLAIM TIME
                // -------------------------------------------------

                const claimStart =
                    getVipClaimStartTime(
                        plan
                    );


                // No approval time
                // = cannot claim
                if (
                    claimStart <= 0
                ) {

                    return;

                }


                // -------------------------------------------------
                // 24 HOURS NOT COMPLETED
                // -------------------------------------------------

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


                // -------------------------------------------------
                // CLAIMED AMOUNT
                // -------------------------------------------------

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


                // -------------------------------------------------
                // START NEW 24 HOUR TIMER
                // -------------------------------------------------

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


                // -------------------------------------------------
                // COMPLETED
                // -------------------------------------------------

                if (
                    totalProfit > 0 &&
                    newClaimed >= totalProfit
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


        // -------------------------------------------------
        // NOTHING READY
        // -------------------------------------------------

        if (
            totalIncome <= 0 ||
            claimableCount <= 0
        ) {

            throw new Error(
                "No VIP income is ready yet. You must wait 24 hours after approval or after your previous claim."
            );

        }


        // -------------------------------------------------
        // UPDATE BALANCE
        // -------------------------------------------------

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


        updates.balance =
            Number(
                newBalance.toFixed(2)
            );


        updates.totalProfit =
            Number(
                (
                    oldTotalProfit +
                    totalIncome
                ).toFixed(2)
            );


        // -------------------------------------------------
        // GLOBAL LAST CLAIM
        // -------------------------------------------------

        updates.lastClaim =
            now;


        // -------------------------------------------------
        // WRITE USER UPDATE
        // -------------------------------------------------

        await update(
            userRef,
            updates
        );


        // -------------------------------------------------
        // TRANSACTION HISTORY
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
                        "Daily VIP income claimed after completing the 24-hour timer."

                }
            );

        } catch (transactionError) {

            console.warn(
                "Transaction history error:",
                transactionError
            );

        }


        // -------------------------------------------------
        // UPDATE LOCAL STATE
        // -------------------------------------------------

        userData =
            {
                ...user,
                ...updates
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
            money(totalIncome) +

            "\n\n" +

            "VIPs claimed: " +
            claimableCount +

            "\n\n" +

            "Each claimed VIP now has a new 24-hour timer."

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
//
// CLAIM BUTTON REMAINS DISABLED
// UNTIL AT LEAST ONE ACTIVE VIP
// COMPLETES 24 HOURS.
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


    // -----------------------------------------------------
    // NO ACTIVE VIP
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // CHECK READY VIP
    // -----------------------------------------------------

    const readyPlans =
        activePlans.filter(
            plan =>
                canVipClaim(plan)
        );


    // -----------------------------------------------------
    // READY
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // FIND SHORTEST TIMER
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // WAITING FOR APPROVAL TIME
    // -----------------------------------------------------

    if (
        shortest === null
    ) {

        claimTimer.textContent =
            "Waiting for Admin Approval";


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


    // -----------------------------------------------------
    // FORMAT TIMER
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // VERY IMPORTANT
    // DISABLED WHILE TIMER IS RUNNING
    // -----------------------------------------------------

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
// START CLAIM TIMER
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
// PAGE VISIBILITY
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

            // -------------------------------------------------
            // LOAD VIP PLANS
            // -------------------------------------------------

            loadVipPackages();


            // -------------------------------------------------
            // LOAD USER
            // -------------------------------------------------

            startUserListener();


            // -------------------------------------------------
            // LOAD PURCHASE REQUESTS
            // -------------------------------------------------

            loadUserVipRequests();


            // -------------------------------------------------
            // START TIMER
            // -------------------------------------------------

            startClaimTimer();


            // -------------------------------------------------
            // HIDE LOADING
            // -------------------------------------------------

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
    "VIP source: vipPlans"
);

console.log(
    "Owned VIP source: users/{uid}/vipPlans"
);

console.log(
    "Purchase request source: vipPurchaseRequests"
);

console.log(
    "VIP price is deducted immediately from user balance."
);

console.log(
    "VIP becomes ACTIVE only after Admin approval."
);

console.log(
    "NO profit is credited at Admin approval."
);

console.log(
    "FIRST CLAIM = EXACTLY 24 HOURS AFTER APPROVAL."
);

console.log(
    "EVERY VIP HAS ITS OWN 24-HOUR CLAIM TIMER."
);
