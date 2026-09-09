// ============================================================
// MONEY VAULT - VIP.JS
// VERSION: CLEAN / FIXED
// CURRENCY: RWF / FRW
// ============================================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue,
    get,
    push,
    set,
    update,
    runTransaction,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ============================================================
// DOM ELEMENTS
// ============================================================

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");

const balanceEl = document.getElementById("balance");
const currentVipEl = document.getElementById("currentVip");
const dailyIncomeEl = document.getElementById("dailyIncome");
const totalProfitEl = document.getElementById("totalProfit");

const ownedVipList = document.getElementById("ownedVipList");
const vipGrid = document.getElementById("vipGrid");

const claimButton = document.getElementById("claimButton");
const claimTimer = document.getElementById("claimTimer");


// ============================================================
// GLOBAL STATE
// ============================================================

let currentUser = null;
let userData = {};
let userVipPlans = {};

let claimInProgress = false;
let claimTimerInterval = null;
let authStarted = false;

const DAY = 24 * 60 * 60 * 1000;


// ============================================================
// BASIC HELPERS
// ============================================================

function numberValue(value, fallback = 0) {
    const n = Number(value);

    return Number.isFinite(n) ? n : fallback;
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


function formatMoney(value) {
    const amount = numberValue(value);

    return `${amount.toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    })} RWF`;
}


function formatDate(value) {
    const timestamp = numberValue(value);

    if (!timestamp) {
        return "—";
    }

    try {
        return new Date(timestamp).toLocaleString("en-GB", {
            year: "numeric",
            month: "short",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    } catch {
        return "—";
    }
}


function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


function getVipName(plan) {
    if (!plan) return "";

    return String(
        plan.vipName ||
        plan.name ||
        plan.planName ||
        ""
    ).trim();
}


function getVipPrice(plan) {
    return numberValue(
        plan?.price ??
        plan?.amount ??
        plan?.cost
    );
}


function getVipDailyIncome(plan) {
    return numberValue(
        plan?.dailyIncome ??
        plan?.dailyProfit ??
        plan?.daily
    );
}


function getVipTotalProfit(plan) {
    return numberValue(
        plan?.totalProfit ??
        plan?.profit ??
        plan?.totalIncome
    );
}


function getVipDuration(plan) {
    return numberValue(
        plan?.duration ??
        plan?.totalDays ??
        plan?.days
    );
}


function getVipStartDate(plan) {
    return numberValue(
        plan?.startDate ??
        plan?.approvedAt ??
        plan?.createdAt
    );
}


function getVipEndDate(plan) {

    const savedEndDate = numberValue(plan?.endDate);

    if (savedEndDate) {
        return savedEndDate;
    }

    const startDate = getVipStartDate(plan);
    const duration = getVipDuration(plan);

    if (startDate && duration) {
        return startDate + (duration * DAY);
    }

    return 0;
}


function isVipExpired(plan, now = Date.now()) {

    const endDate = getVipEndDate(plan);

    if (!endDate) {
        return false;
    }

    return now >= endDate;
}


function isVipActive(plan, now = Date.now()) {

    if (!plan) {
        return false;
    }

    const status = normalizeStatus(plan.status);

    if (isVipExpired(plan, now)) {
        return false;
    }

    if (status === "expired") {
        return false;
    }

    if (status === "inactive") {
        return false;
    }

    return status === "active" || status === "";
}


// ============================================================
// SIDEBAR
// ============================================================

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        sidebar?.classList.toggle("active");

    });

}


document.querySelectorAll(".sidebar a").forEach(link => {

    link.addEventListener("click", () => {

        sidebar?.classList.remove("active");

    });

});


// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener("click", async () => {

        try {

            stopClaimTimer();

            await signOut(auth);

            window.location.href = "login.html";

        } catch (error) {

            console.error("Logout error:", error);

            alert("Failed to logout.");

        }

    });

}


// ============================================================
// AUTHENTICATION
// ============================================================

function startAuthentication() {

    if (authStarted) {
        return;
    }

    authStarted = true;

    onAuthStateChanged(auth, async user => {

        if (!user) {

            currentUser = null;

            stopClaimTimer();

            window.location.href = "login.html";

            return;
        }

        currentUser = user;

        console.log("VIP AUTH USER:", user.uid);

        try {

            await loadUserData();
            await loadVipPackages();
            await loadUserVipPlans();

            await checkVipExpiration();

            updateBalanceUI();

            updateVipSummary();

            await updateVipButtons();

            startClaimTimer();

        } catch (error) {

            console.error("VIP INITIALIZATION ERROR:", error);

        }

    });

}


// ============================================================
// LOAD USER DATA
// ============================================================

async function loadUserData() {

    if (!currentUser) {
        return;
    }

    const userRef = ref(
        db,
        `users/${currentUser.uid}`
    );

    const snapshot = await get(userRef);

    if (snapshot.exists()) {

        userData = snapshot.val() || {};

    } else {

        userData = {};

    }

    updateBalanceUI();

}


// ============================================================
// USER DATA REALTIME LISTENER
// ============================================================

function listenToUserData() {

    if (!currentUser) {
        return;
    }

    const userRef = ref(
        db,
        `users/${currentUser.uid}`
    );

    onValue(userRef, snapshot => {

        if (!snapshot.exists()) {
            return;
        }

        userData = snapshot.val() || {};

        updateBalanceUI();

        updateVipSummary();

    });

}


// ============================================================
// BALANCE UI
// ============================================================

function updateBalanceUI() {

    if (!balanceEl) {
        return;
    }

    const balance = numberValue(
        userData?.balance
    );

    balanceEl.textContent = formatMoney(balance);

}


// ============================================================
// LOAD VIP PACKAGES
// ============================================================

async function loadVipPackages() {

    if (!vipGrid) {
        console.warn("vipGrid not found.");
        return;
    }

    const vipRef = ref(db, "vipPlans");

    onValue(vipRef, snapshot => {

        vipGrid.innerHTML = "";

        if (!snapshot.exists()) {

            vipGrid.innerHTML = `
                <div class="empty-vip">
                    <i class="fas fa-box-open"></i>
                    <p>No VIP plans available.</p>
                </div>
            `;

            return;
        }

        const plans = [];

        snapshot.forEach(child => {

            const plan = child.val() || {};

            plans.push({
                id: child.key,
                ...plan
            });

        });

        plans.sort((a, b) => {

            return getVipNumber(a) - getVipNumber(b);

        });

        plans.forEach(plan => {

            createVipCard(plan);

        });

        updateVipButtons();

    });

}


// ============================================================
// VIP NUMBER
// ============================================================

function getVipNumber(plan) {

    const name = getVipName(plan);

    const match = name.match(
        /(?:vip\s*)?(\d+)/i
    );

    if (match) {
        return numberValue(match[1]);
    }

    const price = getVipPrice(plan);

    return price || 999999;
}


// ============================================================
// VIP CARD
// ============================================================

function createVipCard(plan) {

    if (!vipGrid) {
        return;
    }

    const vipName = getVipName(plan);

    if (!vipName) {
        return;
    }

    const price = getVipPrice(plan);
    const dailyIncome = getVipDailyIncome(plan);
    const totalProfit = getVipTotalProfit(plan);
    const duration = getVipDuration(plan);

    const card = document.createElement("div");

    card.className = "vip-card";

    card.innerHTML = `
        <div class="vip-card-header">

            <div class="vip-icon">
                <i class="fas fa-crown"></i>
            </div>

            <div class="vip-title">
                <h3>${escapeHTML(vipName)}</h3>
                <span>VIP Investment Plan</span>
            </div>

        </div>

        <div class="vip-price">
            ${formatMoney(price)}
        </div>

        <div class="vip-details">

            <div class="vip-detail">
                <span>Daily Income</span>
                <strong>${formatMoney(dailyIncome)}</strong>
            </div>

            <div class="vip-detail">
                <span>Total Profit</span>
                <strong>${formatMoney(totalProfit)}</strong>
            </div>

            <div class="vip-detail">
                <span>Duration</span>
                <strong>${duration} Days</strong>
            </div>

        </div>

        <button
            type="button"
            class="buyVipBtn"
        >
            <i class="fas fa-cart-shopping"></i>
            Buy Now
        </button>
    `;

    const button = card.querySelector(".buyVipBtn");

    if (!button) {
        return;
    }

    button.dataset.vip = vipName;
    button.dataset.price = String(price);
    button.dataset.daily = String(dailyIncome);
    button.dataset.profit = String(totalProfit);
    button.dataset.days = String(duration);
    button.dataset.buying = "false";

    button.addEventListener("click", () => {

        buyVip(button);

    });

    vipGrid.appendChild(card);

}


// ============================================================
// LOAD USER VIP PLANS
// ============================================================

async function loadUserVipPlans() {

    if (!currentUser) {
        return;
    }

    const plansRef = ref(
        db,
        `users/${currentUser.uid}/vipPlans`
    );

    onValue(plansRef, snapshot => {

        userVipPlans = {};

        if (snapshot.exists()) {

            userVipPlans = snapshot.val() || {};

        }

        renderOwnedVipPlans();

        updateVipSummary();

        updateVipButtons();

        startClaimTimer();

    });

}


// ============================================================
// RENDER OWNED VIP PLANS
// ============================================================

function renderOwnedVipPlans() {

    if (!ownedVipList) {
        return;
    }

    ownedVipList.innerHTML = "";

    const plans = Object.entries(
        userVipPlans || {}
    );

    if (!plans.length) {

        ownedVipList.innerHTML = `
            <div class="empty-vip">
                <i class="fas fa-crown"></i>
                <p>You do not have an active VIP plan yet.</p>
            </div>
        `;

        return;
    }

    const now = Date.now();

    plans.sort((a, b) => {

        return getVipStartDate(b[1]) -
               getVipStartDate(a[1]);

    });

    plans.forEach(([id, plan]) => {

        if (!plan) {
            return;
        }

        const vipName = getVipName(plan);

        const price = getVipPrice(plan);

        const dailyIncome =
            getVipDailyIncome(plan);

        const totalProfit =
            getVipTotalProfit(plan);

        const duration =
            getVipDuration(plan);

        const startDate =
            getVipStartDate(plan);

        const endDate =
            getVipEndDate(plan);

        const expired =
            isVipExpired(plan, now);

        const status =
            expired
                ? "expired"
                : (
                    normalizeStatus(plan.status) ||
                    "active"
                );

        let remainingDays = 0;

        if (endDate > now) {

            remainingDays = Math.ceil(
                (endDate - now) / DAY
            );

        }

        const card = document.createElement("div");

        card.className =
            `owned-vip-card ${status}`;

        card.innerHTML = `

            <div class="owned-vip-header">

                <div>

                    <h3>
                        ${escapeHTML(vipName)}
                    </h3>

                    <span class="vip-status ${status}">
                        ${status.toUpperCase()}
                    </span>

                </div>

                <i class="fas fa-crown"></i>

            </div>

            <div class="owned-vip-info">

                <div>
                    <span>Price</span>
                    <strong>
                        ${formatMoney(price)}
                    </strong>
                </div>

                <div>
                    <span>Daily Income</span>
                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>
                </div>

                <div>
                    <span>Total Profit</span>
                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>
                </div>

                <div>
                    <span>Duration</span>
                    <strong>
                        ${duration} Days
                    </strong>
                </div>

                <div>
                    <span>Remaining</span>
                    <strong>
                        ${remainingDays} Days
                    </strong>
                </div>

                <div>
                    <span>Earned</span>
                    <strong>
                        ${formatMoney(
                            plan.totalEarned ??
                            plan.earned ??
                            plan.claimedAmount ??
                            0
                        )}
                    </strong>
                </div>

            </div>

            <div class="owned-vip-dates">

                <div>
                    <span>Started</span>
                    <strong>
                        ${formatDate(startDate)}
                    </strong>
                </div>

                <div>
                    <span>Ends</span>
                    <strong>
                        ${formatDate(endDate)}
                    </strong>
                </div>

            </div>

        `;

        ownedVipList.appendChild(card);

    });

}


// ============================================================
// VIP SUMMARY
// ============================================================

function updateVipSummary() {

    const now = Date.now();

    let activeCount = 0;
    let dailyTotal = 0;
    let totalProfit = 0;

    Object.values(userVipPlans || {})
        .forEach(plan => {

            if (!plan) {
                return;
            }

            if (!isVipActive(plan, now)) {
                return;
            }

            activeCount++;

            dailyTotal +=
                getVipDailyIncome(plan);

            totalProfit +=
                getVipTotalProfit(plan);

        });

    if (currentVipEl) {

        currentVipEl.textContent =
            activeCount > 0
                ? `${activeCount} Active`
                : "VIP 0";

    }

    if (dailyIncomeEl) {

        dailyIncomeEl.textContent =
            formatMoney(dailyTotal);

    }

    if (totalProfitEl) {

        totalProfitEl.textContent =
            formatMoney(totalProfit);

    }

}


// ============================================================
// GET ACTIVE OWNED VIP BY NAME
// ============================================================

function hasActiveVip(vipName) {

    const target =
        normalizeName(vipName);

    const now = Date.now();

    return Object.values(userVipPlans || {})
        .some(plan => {

            if (!plan) {
                return false;
            }

            const name =
                normalizeName(
                    getVipName(plan)
                );

            if (name !== target) {
                return false;
            }

            return isVipActive(plan, now);

        });

}


// ============================================================
// LOAD USER VIP PURCHASE REQUESTS
// ============================================================

async function getUserVipRequests() {

    if (!currentUser) {
        return {};
    }

    const requestsQuery = query(
        ref(db, "vipPurchaseRequests"),
        orderByChild("uid"),
        equalTo(currentUser.uid)
    );

    const snapshot =
        await get(requestsQuery);

    if (!snapshot.exists()) {
        return {};
    }

    return snapshot.val() || {};

}


// ============================================================
// CHECK PENDING / PROCESSING REQUEST
// ============================================================

async function getVipRequestState(vipName) {

    const target =
        normalizeName(vipName);

    const requests =
        await getUserVipRequests();

    let pending = false;
    let processing = false;

    Object.values(requests)
        .forEach(request => {

            if (!request) {
                return;
            }

            const requestName =
                normalizeName(
                    request.vipName ||
                    request.name ||
                    request.planName
                );

            if (requestName !== target) {
                return;
            }

            const status =
                normalizeStatus(
                    request.status
                );

            if (status === "pending") {

                pending = true;

            }

            if (status === "processing") {

                processing = true;

            }

        });

    return {
        pending,
        processing
    };

}


// ============================================================
// UPDATE ALL BUY BUTTONS
// ============================================================

async function updateVipButtons() {

    if (!currentUser) {
        return;
    }

    const buttons =
        document.querySelectorAll(
            ".buyVipBtn"
        );

    if (!buttons.length) {
        return;
    }

    try {

        const ownedSnapshot =
            await get(
                ref(
                    db,
                    `users/${currentUser.uid}/vipPlans`
                )
            );

        const owned =
            ownedSnapshot.exists()
                ? (
                    ownedSnapshot.val() || {}
                )
                : {};

        const requestsQuery = query(
            ref(db, "vipPurchaseRequests"),
            orderByChild("uid"),
            equalTo(currentUser.uid)
        );

        const requestSnapshot =
            await get(requestsQuery);

        const requests =
            requestSnapshot.exists()
                ? (
                    requestSnapshot.val() || {}
                )
                : {};

        const now = Date.now();

        buttons.forEach(button => {

            const vipName =
                String(
                    button.dataset.vip || ""
                ).trim();

            if (!vipName) {
                return;
            }

            const target =
                normalizeName(vipName);

            let activeVip = false;
            let pendingRequest = false;
            let processingRequest = false;

            // ----------------------------------------
            // CHECK OWNED VIP
            // ----------------------------------------

            Object.values(owned)
                .forEach(plan => {

                    if (!plan) {
                        return;
                    }

                    const ownedName =
                        normalizeName(
                            getVipName(plan)
                        );

                    if (ownedName !== target) {
                        return;
                    }

                    if (
                        isVipActive(
                            plan,
                            now
                        )
                    ) {

                        activeVip = true;

                    }

                });


            // ----------------------------------------
            // CHECK REQUESTS
            // ----------------------------------------

            Object.values(requests)
                .forEach(request => {

                    if (!request) {
                        return;
                    }

                    const requestName =
                        normalizeName(
                            request.vipName ||
                            request.name ||
                            request.planName
                        );

                    if (requestName !== target) {
                        return;
                    }

                    const status =
                        normalizeStatus(
                            request.status
                        );

                    if (status === "pending") {

                        pendingRequest = true;

                    }

                    if (status === "processing") {

                        processingRequest = true;

                    }

                });


            // ----------------------------------------
            // ACTIVE VIP
            // ----------------------------------------

            if (activeVip) {

                button.disabled = true;

                button.dataset.buying =
                    "false";

                button.classList.add(
                    "purchased"
                );

                button.style.display = "";

                button.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    Active
                `;

                return;
            }


            // ----------------------------------------
            // PROCESSING
            // ----------------------------------------

            if (processingRequest) {

                button.disabled = true;

                button.dataset.buying =
                    "false";

                button.classList.add(
                    "purchased"
                );

                button.style.display = "";

                button.innerHTML = `
                    <i class="fas fa-spinner fa-spin"></i>
                    Processing...
                `;

                return;
            }


            // ----------------------------------------
            // PENDING
            // ----------------------------------------

            if (pendingRequest) {

                button.disabled = true;

                button.dataset.buying =
                    "false";

                button.classList.add(
                    "purchased"
                );

                button.style.display = "";

                button.innerHTML = `
                    <i class="fas fa-clock"></i>
                    Pending
                `;

                return;
            }


            // ----------------------------------------
            // AVAILABLE
            // ----------------------------------------

            button.disabled = false;

            button.dataset.buying =
                "false";

            button.classList.remove(
                "purchased"
            );

            button.style.display = "";

            button.innerHTML = `
                <i class="fas fa-cart-shopping"></i>
                Buy Now
            `;

        });

    } catch (error) {

        console.error(
            "UPDATE VIP BUTTONS ERROR:",
            error
        );

    }

}


// ============================================================
// BUY VIP
// ============================================================

async function buyVip(button) {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }

    if (!button) {
        return;
    }

    if (
        button.dataset.buying ===
        "true"
    ) {

        return;

    }

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


    if (!vipName) {

        alert(
            "VIP plan name is missing."
        );

        return;

    }


    if (
        price <= 0 ||
        duration <= 0
    ) {

        alert(
            "Invalid VIP plan information."
        );

        return;

    }


    // ========================================================
    // LOCK BUTTON
    // ========================================================

    button.dataset.buying =
        "true";

    button.disabled = true;


    try {

        // ====================================================
        // CHECK ACTIVE OWNED VIP
        // ====================================================

        const ownedSnapshot =
            await get(
                ref(
                    db,
                    `users/${currentUser.uid}/vipPlans`
                )
            );

        const owned =
            ownedSnapshot.exists()
                ? (
                    ownedSnapshot.val() || {}
                )
                : {};

        const target =
            normalizeName(vipName);

        let activeOwnedVip = false;

        Object.values(owned)
            .forEach(plan => {

                if (!plan) {
                    return;
                }

                const name =
                    normalizeName(
                        getVipName(plan)
                    );

                if (name !== target) {
                    return;
                }

                if (
                    isVipActive(plan)
                ) {

                    activeOwnedVip = true;

                }

            });


        if (activeOwnedVip) {

            alert(
                `You already have an active ${vipName}.`
            );

            await updateVipButtons();

            return;

        }


        // ====================================================
        // CHECK EXISTING REQUESTS
        // ====================================================

        const requests =
            await getUserVipRequests();

        let pendingRequest = false;
        let processingRequest = false;

        Object.values(requests)
            .forEach(request => {

                if (!request) {
                    return;
                }

                const requestName =
                    normalizeName(
                        request.vipName ||
                        request.name ||
                        request.planName
                    );

                if (requestName !== target) {
                    return;
                }

                const status =
                    normalizeStatus(
                        request.status
                    );

                if (
                    status === "pending"
                ) {

                    pendingRequest = true;

                }

                if (
                    status === "processing"
                ) {

                    processingRequest = true;

                }

            });


        if (processingRequest) {

            alert(
                `${vipName} is currently being processed. Please wait.`
            );

            await updateVipButtons();

            return;

        }


        if (pendingRequest) {

            alert(
                `You already have a pending request for ${vipName}.`
            );

            await updateVipButtons();

            return;

        }


        // ====================================================
        // GET LATEST USER BALANCE
        // ====================================================

        const userSnapshot =
            await get(
                ref(
                    db,
                    `users/${currentUser.uid}`
                )
            );

        if (!userSnapshot.exists()) {

            alert(
                "User account data was not found."
            );

            return;

        }

        const latestUser =
            userSnapshot.val() || {};

        userData =
            latestUser;


        const balance =
            numberValue(
                latestUser.balance
            );


        if (balance < price) {

            alert(
                `Insufficient balance.\n\n` +
                `Required: ${formatMoney(price)}\n` +
                `Available: ${formatMoney(balance)}`
            );

            return;

        }


        // ====================================================
        // CONFIRM PURCHASE REQUEST
        // ====================================================

        const confirmed =
            confirm(
                `Buy ${vipName}?\n\n` +
                `Price: ${formatMoney(price)}\n` +
                `Daily Income: ${formatMoney(dailyIncome)}\n` +
                `Total Profit: ${formatMoney(totalProfit)}\n` +
                `Duration: ${duration} Days`
            );

        if (!confirmed) {

            return;

        }


        // ====================================================
        // CREATE REQUEST
        // ====================================================

        const requestRef =
            push(
                ref(
                    db,
                    "vipPurchaseRequests"
                )
            );

        const now =
            Date.now();


        const requestData = {

            uid: currentUser.uid,

            email:
                currentUser.email ||
                latestUser.email ||
                "",

            fullName:
                latestUser.fullName ||
                latestUser.name ||
                currentUser.displayName ||
                "User",

            phone:
                latestUser.phone ||
                latestUser.phoneNumber ||
                "",

            vipName,

            price,

            dailyIncome,

            totalProfit,

            duration,

            currency: "RWF",

            paymentMethod:
                "Account Balance",

            status:
                "pending",

            createdAt:
                now,

            requestedAt:
                now

        };


        await set(
            requestRef,
            requestData
        );


        // ====================================================
        // SUCCESS
        // ====================================================

        button.dataset.buying =
            "false";

        button.disabled = true;

        button.classList.add(
            "purchased"
        );

        button.style.display = "";

        button.innerHTML = `
            <i class="fas fa-clock"></i>
            Pending
        `;


        alert(
            `${vipName} purchase request submitted successfully.\n\n` +
            `Please wait for admin approval.`
        );


        await updateVipButtons();


    } catch (error) {

        console.error(
            "BUY VIP ERROR:",
            error
        );

        alert(
            "Unable to submit VIP request.\n\n" +
            (error?.message || "Please try again.")
        );

    } finally {

        if (
            button.dataset.buying ===
            "true"
        ) {

            button.dataset.buying =
                "false";

            button.disabled = false;

        }

        await updateVipButtons();

    }

}


// ============================================================
// VIP EXPIRATION
// ============================================================

async function checkVipExpiration() {

    if (!currentUser) {
        return;
    }

    const plansRef =
        ref(
            db,
            `users/${currentUser.uid}/vipPlans`
        );

    const snapshot =
        await get(plansRef);

    if (!snapshot.exists()) {
        return;
    }

    const plans =
        snapshot.val() || {};

    const now =
        Date.now();

    const updates = {};

    Object.entries(plans)
        .forEach(([id, plan]) => {

            if (!plan) {
                return;
            }

            const endDate =
                getVipEndDate(plan);

            if (!endDate) {
                return;
            }

            if (
                now >= endDate &&
                normalizeStatus(plan.status) !==
                "expired"
            ) {

                updates[
                    `${id}/status`
                ] = "expired";

                updates[
                    `${id}/active`
                ] = false;

            }

        });


    if (Object.keys(updates).length) {

        await update(
            plansRef,
            updates
        );

    }

}


// ============================================================
// CLAIM TIMER
// ============================================================

function startClaimTimer() {

    stopClaimTimer();

    updateClaimTimer();

    claimTimerInterval =
        setInterval(
            updateClaimTimer,
            1000
        );

}


function stopClaimTimer() {

    if (claimTimerInterval) {

        clearInterval(
            claimTimerInterval
        );

        claimTimerInterval = null;

    }

}


function getNextClaimTime() {

    const now =
        Date.now();

    let nextTime = 0;

    Object.values(userVipPlans || {})
        .forEach(plan => {

            if (!plan) {
                return;
            }

            if (!isVipActive(plan, now)) {
                return;
            }

            const lastClaim =
                numberValue(
                    plan.lastClaim ??
                    plan.lastClaimTime ??
                    plan.lastProfitTime ??
                    getVipStartDate(plan)
                );

            const nextClaim =
                lastClaim + DAY;

            if (
                nextClaim > now &&
                (
                    !nextTime ||
                    nextClaim < nextTime
                )
            ) {

                nextTime = nextClaim;

            }

        });

    return nextTime;

}


function updateClaimTimer() {

    if (!claimTimer) {
        return;
    }

    const now =
        Date.now();

    let activeCount = 0;
    let claimAvailable = false;
    let nextClaimTime = 0;

    Object.values(userVipPlans || {})
        .forEach(plan => {

            if (!plan) {
                return;
            }

            if (!isVipActive(plan, now)) {
                return;
            }

            activeCount++;

            const lastClaim =
                numberValue(
                    plan.lastClaim ??
                    plan.lastClaimTime ??
                    plan.lastProfitTime ??
                    getVipStartDate(plan)
                );

            const next =
                lastClaim + DAY;

            if (now >= next) {

                claimAvailable = true;

            } else if (
                !nextClaimTime ||
                next < nextClaimTime
            ) {

                nextClaimTime = next;

            }

        });


    if (!activeCount) {

        claimTimer.textContent =
            "No active VIP";

        if (claimButton) {
            claimButton.disabled = true;
        }

        return;

    }


    if (claimAvailable) {

        claimTimer.textContent =
            "Daily income is ready!";

        if (claimButton) {
            claimButton.disabled =
                claimInProgress;
        }

        return;

    }


    if (!nextClaimTime) {

        claimTimer.textContent =
            "Waiting...";

        if (claimButton) {
            claimButton.disabled = true;
        }

        return;

    }


    const remaining =
        Math.max(
            0,
            nextClaimTime - now
        );


    const hours =
        Math.floor(
            remaining / (60 * 60 * 1000)
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


    claimTimer.textContent =
        `Next claim in ${String(hours).padStart(2, "0")}:` +
        `${String(minutes).padStart(2, "0")}:` +
        `${String(seconds).padStart(2, "0")}`;


    if (claimButton) {

        claimButton.disabled =
            true;

    }

}


// ============================================================
// CLAIM DAILY INCOME
// ============================================================

async function claimDailyIncome() {

    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }

    if (claimInProgress) {
        return;
    }

    claimInProgress = true;

    if (claimButton) {

        claimButton.disabled = true;

        claimButton.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Claiming...
        `;

    }


    try {

        const userRef =
            ref(
                db,
                `users/${currentUser.uid}`
            );


        const result =
            await runTransaction(
                userRef,
                currentData => {

                    if (!currentData) {
                        return;
                    }

                    const now =
                        Date.now();

                    const plans =
                        currentData.vipPlans ||
                        {};

                    let totalClaim =
                        0;

                    let changed =
                        false;

                    const updatedPlans =
                        {
                            ...plans
                        };


                    Object.entries(plans)
                        .forEach(([id, plan]) => {

                            if (!plan) {
                                return;
                            }

                            const startDate =
                                getVipStartDate(plan);

                            const endDate =
                                getVipEndDate(plan);

                            const status =
                                normalizeStatus(
                                    plan.status
                                );

                            if (
                                status ===
                                "expired"
                            ) {
                                return;
                            }

                            if (
                                endDate &&
                                now >= endDate
                            ) {

                                updatedPlans[id] = {

                                    ...plan,

                                    status:
                                        "expired",

                                    active:
                                        false

                                };

                                changed = true;

                                return;

                            }


                            if (
                                status &&
                                status !== "active"
                            ) {
                                return;
                            }


                            if (
                                startDate &&
                                now < startDate
                            ) {
                                return;
                            }


                            const dailyIncome =
                                getVipDailyIncome(
                                    plan
                                );

                            if (
                                dailyIncome <= 0
                            ) {
                                return;
                            }


                            const lastClaim =
                                numberValue(
                                    plan.lastClaim ??
                                    plan.lastClaimTime ??
                                    plan.lastProfitTime ??
                                    startDate
                                );


                            const nextClaim =
                                lastClaim + DAY;


                            if (
                                now < nextClaim
                            ) {
                                return;
                            }


                            const totalEarned =
                                numberValue(
                                    plan.totalEarned ??
                                    plan.earned ??
                                    plan.claimedAmount
                                );


                            const maxProfit =
                                getVipTotalProfit(
                                    plan
                                );


                            let claimAmount =
                                dailyIncome;


                            if (
                                maxProfit > 0
                            ) {

                                const remainingProfit =
                                    Math.max(
                                        0,
                                        maxProfit -
                                        totalEarned
                                    );

                                claimAmount =
                                    Math.min(
                                        claimAmount,
                                        remainingProfit
                                    );

                            }


                            if (
                                claimAmount <= 0
                            ) {

                                updatedPlans[id] = {

                                    ...plan,

                                    status:
                                        "completed",

                                    active:
                                        false

                                };

                                changed = true;

                                return;

                            }


                            const newTotalEarned =
                                totalEarned +
                                claimAmount;


                            const newClaimCount =
                                numberValue(
                                    plan.claimCount
                                ) + 1;


                            updatedPlans[id] = {

                                ...plan,

                                lastClaim:
                                    now,

                                lastClaimTime:
                                    now,

                                lastProfitTime:
                                    now,

                                totalEarned:
                                    newTotalEarned,

                                earned:
                                    newTotalEarned,

                                claimedAmount:
                                    newTotalEarned,

                                claimCount:
                                    newClaimCount,

                                active:
                                    true,

                                status:
                                    "active"

                            };


                            totalClaim +=
                                claimAmount;

                            changed = true;

                        });


                    if (!changed) {
                        return;
                    }


                    const oldBalance =
                        numberValue(
                            currentData.balance
                        );


                    return {

                        ...currentData,

                        balance:
                            oldBalance +
                            totalClaim,

                        vipPlans:
                            updatedPlans

                    };

                }
            );


        if (!result.committed) {

            alert(
                "No daily income is available yet."
            );

            return;

        }


        await loadUserData();

        userVipPlans =
            (
                await get(
                    ref(
                        db,
                        `users/${currentUser.uid}/vipPlans`
                    )
                )
            ).val() || {};


        renderOwnedVipPlans();

        updateVipSummary();

        updateBalanceUI();

        updateClaimTimer();


        alert(
            "Daily income claimed successfully."
        );


    } catch (error) {

        console.error(
            "CLAIM DAILY INCOME ERROR:",
            error
        );

        alert(
            "Failed to claim daily income.\n\n" +
            (error?.message || "")
        );

    } finally {

        claimInProgress = false;

        if (claimButton) {

            claimButton.disabled = false;

            claimButton.innerHTML = `
                <i class="fas fa-hand-holding-dollar"></i>
                Claim Daily Income
            `;

        }

        updateClaimTimer();

    }

}


// ============================================================
// CLAIM BUTTON
// ============================================================

if (claimButton) {

    claimButton.addEventListener(
        "click",
        claimDailyIncome
    );

}


// ============================================================
// VISIBILITY REFRESH
// ============================================================

document.addEventListener(
    "visibilitychange",
    async () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (currentUser) {

                try {

                    await loadUserData();

                    await checkVipExpiration();

                    const plansSnapshot =
                        await get(
                            ref(
                                db,
                                `users/${currentUser.uid}/vipPlans`
                            )
                        );

                    userVipPlans =
                        plansSnapshot.exists()
                            ? (
                                plansSnapshot.val() ||
                                {}
                            )
                            : {};

                    renderOwnedVipPlans();

                    updateVipSummary();

                    updateBalanceUI();

                    await updateVipButtons();

                    updateClaimTimer();

                } catch (error) {

                    console.error(
                        "VIP VISIBILITY REFRESH ERROR:",
                        error
                    );

                }

            }

        }

    }
);


// ============================================================
// WINDOW HELPERS
// ============================================================

window.buyVip = buyVip;

window.claimDailyIncome =
    claimDailyIncome;

window.updateVipButtons =
    updateVipButtons;

window.loadVipPackages =
    loadVipPackages;

window.loadUserVipPlans =
    loadUserVipPlans;

window.checkVipExpiration =
    checkVipExpiration;


// ============================================================
// START
// ============================================================

startAuthentication();


// ============================================================
// USER REALTIME DATA
// ============================================================

onAuthStateChanged(auth, user => {

    if (!user) {
        return;
    }

    currentUser = user;

    listenToUserData();

});


console.log(
    "Money Vault VIP.js loaded successfully - RWF version"
);
