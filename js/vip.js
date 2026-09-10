// =========================================================
// MONEY VAULT - VIP.JS
// COMPLETE CLEAN VERSION
// CURRENCY: RWF / FRW
//
// RULES
// ---------------------------------------------------------
// 1. User can own MANY DIFFERENT VIP plans.
// 2. Same VIP PLAN ID cannot be purchased twice.
// 3. Starter + Bronze + Silver + Gold = ALLOWED.
// 4. Starter + Starter = NOT ALLOWED.
// 5. Purchase creates a REQUEST.
// 6. Admin approves the request.
// 7. VIP becomes ACTIVE only after Admin approval.
// 8. Daily income can be claimed once every 24 hours.
// 9. VIP plans are loaded from: vipPlans
// 10. User VIP ownership is loaded from:
//       users/{uid}/vipPlans
// 11. Purchase requests are loaded from:
//       vipPurchaseRequests
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

// IMPORTANT:
// HTML uses id="claimDailyIncome"
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


function getVipName(plan) {

    if (!plan || typeof plan !== "object") {
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

    return numberValue(
        plan?.duration ??
        plan?.totalDays ??
        plan?.days ??
        0
    );
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


function showMessage(message) {

    alert(message);
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


// Close sidebar after clicking a link
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
// UPDATE BALANCE
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
// GET OWNED PLAN ID
// =========================================================

function getOwnedPlanId(
    plan,
    fallbackKey = ""
) {

    if (
        !plan ||
        typeof plan !== "object"
    ) {

        return normalizePlanId(
            fallbackKey
        );

    }

    const explicitId =
        plan.vipPlanId ??
        plan.planId ??
        plan.vipId ??
        "";

    if (
        String(explicitId).trim() !== ""
    ) {

        return normalizePlanId(
            explicitId
        );

    }

    return normalizePlanId(
        fallbackKey
    );
}


// =========================================================
// GET REQUEST PLAN ID
// =========================================================

function getRequestPlanId(request) {

    if (
        !request ||
        typeof request !== "object"
    ) {

        return "";

    }

    return normalizePlanId(
        request.vipPlanId ??
        request.planId ??
        request.vipId ??
        ""
    );
}


// =========================================================
// ACTIVE VIP CHECK
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

            const status =
                normalizeStatus(
                    vip.status
                );

            if (
                status !== "active" &&
                status !== "approved"
            ) {

                return false;

            }

            const ownedId =
                getOwnedPlanId(
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

            // ID is primary identity
            if (
                targetId &&
                ownedId
            ) {

                return (
                    targetId ===
                    ownedId
                );

            }

            // Legacy fallback
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

            const status =
                normalizeStatus(
                    request.status
                );

            if (
                status !== "pending"
            ) {

                return false;

            }

            const requestId =
                getRequestPlanId(
                    request
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

            // ---------------------------------------------
            // PLAN ID
            // ---------------------------------------------

            const planId =
                normalizePlanId(
                    plan.vipPlanId ??
                    plan.planId ??
                    plan.vipId ??
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
            // PLAN STATUS
            // ---------------------------------------------

            const rawStatus =
                plan.status;


            /*
             * Support both:
             *
             * status: true
             * status: "active"
             *
             * and:
             *
             * active: true
             */

            const status =
                normalizeStatus(
                    rawStatus
                );

            const isAvailable =
                rawStatus === true ||
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
                    ${alreadyOwned || pending ? "disabled" : ""}>

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
// LOAD VIP PLANS FROM FIREBASE
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


            console.log(
                "VIP plans loaded:",
                availableVipPlans
            );


            renderVipPlans();

        },

        error => {

            console.error(
                "VIP plans loading error:",
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

                console.warn(
                    "User record does not exist."
                );

                userData = {};

                userVipPlans = {};

                updateBalanceUI();

                calculateVipTotals();

                renderOwnedVipPlans();

                updateVipButtons();

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
// LOAD VIP PURCHASE REQUESTS
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


            console.log(
                "VIP requests loaded:",
                vipRequests
            );


            updateVipButtons();

            renderVipPlans();

        },

        error => {

            console.error(
                "VIP request listener error:",
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
        .querySelectorAll(".buyVipBtn")
        .forEach(button => {

            const planId =
                normalizePlanId(
                    button.dataset.planId
                );


            const vipName =
                String(
                    button.dataset.vip || ""
                ).trim();


            if (
                !planId &&
                !vipName
            ) {

                button.disabled =
                    true;

                button.innerHTML =
                    "Unavailable";

                return;

            }


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


            button.classList.remove(
                "activeVip",
                "pendingVip",
                "disabled"
            );


            if (purchased) {

                button.disabled =
                    true;

                button.classList.add(
                    "activeVip"
                );

                button.innerHTML = `

                    <i class="fas fa-check-circle"></i>
                    Already Active

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
                    Pending Approval

                `;

                return;

            }


            button.disabled =
                false;


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
        dailyIncome < 0 ||
        duration <= 0
    ) {

        showMessage(
            "This VIP plan has invalid information."
        );

        return;

    }


    // -----------------------------------------------------
    // SAME VIP ALREADY ACTIVE
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
    // SAME VIP PENDING
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
    // CHECK BALANCE
    // -----------------------------------------------------

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


    // -----------------------------------------------------
    // CONFIRM
    // -----------------------------------------------------

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

            "The VIP will become active after Admin approval."

        );


    if (!ok) {
        return;
    }


    const oldText =
        button.innerHTML;


    button.disabled =
        true;


    button.innerHTML = `

        <i class="fas fa-spinner fa-spin"></i>
        Sending...

    `;


    try {

        // -------------------------------------------------
        // FRESH USER DATA
        // -------------------------------------------------

        const freshSnapshot =
            await get(
                ref(
                    db,
                    "users/" +
                    currentUser.uid
                )
            );


        if (
            !freshSnapshot.exists()
        ) {

            throw new Error(
                "User account not found."
            );

        }


        userData =
            freshSnapshot.val() || {};


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
        // CHECK BALANCE AGAIN
        // -------------------------------------------------

        const latestBalance =
            numberValue(
                userData.balance
            );


        if (
            latestBalance < price
        ) {

            throw new Error(
                "Insufficient Balance."
            );

        }


        // -------------------------------------------------
        // CREATE REQUEST
        // -------------------------------------------------

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

            currency:
                CURRENCY,

            status:
                "pending",

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


        vipRequests[
            requestId
        ] =
            requestData;


        updateVipButtons();

        renderVipPlans();


        showMessage(

            vipName +
            " purchase request submitted successfully.\n\n" +

            "Status: Pending\n\n" +

            "Your VIP will activate after Admin approval."

        );


    } catch (error) {

        console.error(
            "VIP purchase error:",
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


    }

}


// =========================================================
// CHECK VIP EXPIRATION
// =========================================================

function checkLocalVipExpiration() {

    if (
        !userVipPlans
    ) {

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

            if (
                !plan ||
                typeof plan !== "object"
            ) {

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
// CALCULATE VIP TOTALS
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

            if (
                !plan
            ) {

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
                    plan.purchasedAt
                );


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
                        }">

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
// CLAIM DAILY INCOME
// =========================================================

claimBtn?.addEventListener(
    "click",
    claimDailyIncome
);


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


        // -------------------------------------------------
        // GLOBAL 24 HOUR LOCK
        // -------------------------------------------------

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


        let totalIncome =
            0;


        let activeCount =
            0;


        const updates = {};


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


                activeCount++;


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


        if (
            totalIncome <= 0 ||
            activeCount <= 0
        ) {

            throw new Error(
                "No active VIP income is available to claim."
            );

        }


        // -------------------------------------------------
        // UPDATE USER BALANCE
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


        const updateData = {

            balance:
                Number(
                    newBalance.toFixed(2)
                ),

            totalProfit:
                Number(
                    (
                        oldTotalProfit +
                        totalIncome
                    ).toFixed(2)
                ),

            lastClaim:
                now,

            ...updates

        };


        await update(
            userRef,
            updateData
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
                        "Daily income from multiple active VIP plans."

                }

            );

        } catch (transactionError) {

            console.warn(
                "Transaction history write failed:",
                transactionError
            );

        }


        // -------------------------------------------------
        // LOCAL UPDATE
        // -------------------------------------------------

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
// CLAIM TIMER
// =========================================================

function updateClaimTimer() {

    if (!claimTimer) {
        return;
    }


    const lastClaim =
        numberValue(
            userData.lastClaim
        );


    // No claim yet
    if (!lastClaim) {

        const hasActive =
            Object.values(
                userVipPlans || {}
            ).some(
                plan =>
                    normalizeStatus(
                        plan?.status
                    ) === "active"
            );


        if (hasActive) {

            claimTimer.textContent =
                "Ready to Claim";


            if (claimBtn) {

                claimBtn.disabled =
                    false;

            }

        } else {

            claimTimer.textContent =
                "No Active VIP";


            if (claimBtn) {

                claimBtn.disabled =
                    true;

            }

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

        const hasActive =
            Object.values(
                userVipPlans || {}
            ).some(
                plan =>
                    normalizeStatus(
                        plan?.status
                    ) === "active"
            );


        claimTimer.textContent =
            hasActive
                ? "Ready to Claim"
                : "No Active VIP";


        if (claimBtn) {

            claimBtn.disabled =
                !hasActive;

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
            updateClaimTimer,
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


        console.log(
            "VIP page user:",
            currentUser.uid
        );


        try {

            // ---------------------------------------------
            // Start all listeners
            // ---------------------------------------------

            loadVipPackages();

            startUserListener();

            loadUserVipRequests();

            startClaimTimer();


            // ---------------------------------------------
            // Hide loading
            // ---------------------------------------------

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

window.renderVipPlans =
    renderVipPlans;


// =========================================================
// READY
// =========================================================

console.log(
    "Money Vault VIP.JS loaded successfully."
);

console.log(
    "VIP plans source: vipPlans"
);

console.log(
    "User VIP source: users/{uid}/vipPlans"
);

console.log(
    "VIP rule: different plans allowed; same plan blocked."
);

console.log(
    "Currency: RWF / FRW"
);
