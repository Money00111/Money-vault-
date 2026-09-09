// ======================================
// VIP.JS
// Money Vault - VIP System
// ======================================

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


// ======================================
// DOM
// ======================================

const sidebar =
    document.getElementById("sidebar");

const menuBtn =
    document.getElementById("menuBtn");

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

const vipGrid =
    document.getElementById("vipGrid");

const claimButton =
    document.getElementById("claimDailyIncome");

const claimTimer =
    document.getElementById("claimTimer");


// ======================================
// VARIABLES
// ======================================

let currentUser = null;
let userData = {};
let userVipPlans = {};

let claimInProgress = false;
let claimTimerInterval = null;
let authStarted = false;


// ======================================
// CONSTANTS
// ======================================

const DAY = 24 * 60 * 60 * 1000;


// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar?.classList.toggle("active");

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (event) => {

    event.preventDefault();

    if (!confirm("Logout?")) {
        return;
    }

    try {

        await signOut(auth);

        location.href = "login.html";

    } catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

        alert(
            "Logout failed: " +
            (error.message || error)
        );

    }

});


// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        currentUser = null;

        stopClaimTimer();

        location.href = "login.html";

        return;

    }

    currentUser = user;

    console.log(
        "VIP AUTH:",
        currentUser.uid
    );

    if (authStarted) {

        refreshVipSystem();

        return;

    }

    authStarted = true;

    loadUserData();

    loadVipPackages();

    loadUserVipPlans();

    checkVipExpiration();

    startClaimTimer();

});


// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    if (!currentUser) {
        return;
    }

    const userRef =
        ref(
            db,
            `users/${currentUser.uid}`
        );

    onValue(
        userRef,
        (snapshot) => {

            if (!snapshot.exists()) {

                userData = {};

                updateBalance(0);

                return;

            }

            userData =
                snapshot.val() || {};

            const amount =
                Number(
                    userData.balance || 0
                );

            updateBalance(amount);

        },
        (error) => {

            console.error(
                "USER DATA ERROR:",
                error
            );

        }
    );

}


// ======================================
// BALANCE
// ======================================

function updateBalance(amount) {

    if (!balanceEl) {
        return;
    }

    balanceEl.textContent =
        `${Number(amount || 0).toLocaleString()} RWF`;

}


// ======================================
// VIP COLOR
// ======================================

function getVipColorClass(name, index) {

    const value =
        String(name || "")
            .toLowerCase()
            .trim();

    const colors = [
        "bronze",
        "starter",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "premium",
        "elite",
        "royal",
        "ultimate"
    ];

    for (const color of colors) {

        if (value.includes(color)) {

            return color;

        }

    }

    return colors[index] || "bronze";

}


// ======================================
// VIP NUMBER
// ======================================

function getVipNumber(plan, key) {

    const name =
        String(
            plan?.name ||
            plan?.vipName ||
            ""
        );

    const firebaseKey =
        String(key || "");

    const text =
        `${name} ${firebaseKey}`;

    const match =
        text.match(
            /(?:vip\s*)?[-_#:]?\s*(\d+)/i
        );

    if (match) {

        return Number(match[1]);

    }

    return 999999;

}


// ======================================
// LOAD VIP PACKAGES
// ======================================

function loadVipPackages() {

    const vipRef =
        ref(
            db,
            "vipPlans"
        );

    onValue(
        vipRef,
        (snapshot) => {

            if (!vipGrid) {
                return;
            }

            vipGrid.innerHTML = "";

            if (!snapshot.exists()) {

                vipGrid.innerHTML = `
                    <div class="emptyVip">
                        No VIP Plans Available
                    </div>
                `;

                return;

            }

            const plans = [];

            snapshot.forEach((child) => {

                plans.push({
                    key: child.key,
                    data: child.val() || {}
                });

            });

            plans.sort((a, b) => {

                return (
                    getVipNumber(
                        a.data,
                        a.key
                    ) -
                    getVipNumber(
                        b.data,
                        b.key
                    )
                );

            });

            plans.forEach((item, index) => {

                createVipCard(
                    item.key,
                    item.data,
                    index
                );

            });

            updateVipButtons();

        },
        (error) => {

            console.error(
                "VIP PLANS ERROR:",
                error
            );

            if (vipGrid) {

                vipGrid.innerHTML = `
                    <div class="emptyVip">
                        Unable to load VIP Plans.
                    </div>
                `;

            }

        }
    );

}


// ======================================
// CREATE VIP CARD
// ======================================

function createVipCard(key, vip, index) {

    const name =
        String(
            vip.name ||
            vip.vipName ||
            "VIP Plan"
        );

    const price =
        Number(
            vip.price ??
            vip.vipPrice ??
            0
        );

    const daily =
        Number(
            vip.dailyIncome ??
            vip.daily ??
            0
        );

    const duration =
        Number(
            vip.duration ??
            vip.totalDays ??
            vip.days ??
            0
        );

    const profit =
        Number(
            vip.totalProfit ??
            vip.profit ??
            (
                daily * duration
            )
        );

    const color =
        getVipColorClass(
            name,
            index
        );

    const card =
        document.createElement("div");

    card.className =
        `vip-card ${color}`;

    card.innerHTML = `

        <div class="vip-badge">
            ${escapeHtml(name)}
        </div>

        <i class="fas fa-gem vip-icon"></i>

        <h2>
            ${escapeHtml(name)}
        </h2>

        <h1>
            ${price.toLocaleString()} RWF
        </h1>

        <p>
            Daily Income:
            <b>
                ${daily.toLocaleString()} RWF
            </b>
        </p>

        <p>
            Duration:
            <b>
                ${duration} Days
            </b>
        </p>

        <p>
            Total Profit:
            <b>
                ${profit.toLocaleString()} RWF
            </b>
        </p>

        <button
            type="button"
            class="buyVipBtn"
            data-vip="${escapeHtml(name)}"
            data-price="${price}"
            data-daily="${daily}"
            data-profit="${profit}"
            data-days="${duration}"
        >

            <i class="fas fa-cart-shopping"></i>

            Buy Now

        </button>

    `;

    vipGrid.appendChild(card);

    const button =
        card.querySelector(".buyVipBtn");

    button?.addEventListener(
        "click",
        () => {

            buyVip(button);

        }
    );

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================
// BUY VIP
// ======================================

async function buyVip(button) {

    if (
        !button ||
        button.dataset.buying === "true"
    ) {
        return;
    }

    if (!currentUser) {

        alert("Please login first.");

        return;

    }

    button.dataset.buying = "true";
    button.disabled = true;

    const originalHTML =
        button.innerHTML;

    try {

        const vipName =
            button.dataset.vip || "";

        const price =
            Number(
                button.dataset.price || 0
            );

        const dailyIncome =
            Number(
                button.dataset.daily || 0
            );

        const totalProfit =
            Number(
                button.dataset.profit || 0
            );

        const totalDays =
            Number(
                button.dataset.days || 0
            );


        if (
            !vipName ||
            !Number.isFinite(price) ||
            price <= 0 ||
            !Number.isFinite(dailyIncome) ||
            dailyIncome <= 0 ||
            !Number.isFinite(totalDays) ||
            totalDays <= 0
        ) {

            throw new Error(
                "Invalid VIP plan information."
            );

        }


        // ==================================
        // GET FRESH BALANCE
        // ==================================

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


        const currentBalance =
            Number(
                freshUser.balance || 0
            );


        if (currentBalance < price) {

            throw new Error(
                `Insufficient balance.\n\n` +
                `VIP Price: ${price.toLocaleString()} RWF\n` +
                `Your Balance: ${currentBalance.toLocaleString()} RWF`
            );

        }


        // ==================================
        // CONFIRM
        // ==================================

        const confirmed =
            confirm(
                `Buy ${vipName}?\n\n` +
                `Price: ${price.toLocaleString()} RWF\n` +
                `Daily Income: ${dailyIncome.toLocaleString()} RWF\n` +
                `Duration: ${totalDays} Days\n` +
                `Total Profit: ${totalProfit.toLocaleString()} RWF\n\n` +
                `Your balance will be deducted after Admin approval.`
            );


        if (!confirmed) {

            button.disabled = false;
            button.dataset.buying = "false";

            return;

        }


        button.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            Processing...
        `;


        // ==================================
        // CHECK EXISTING REQUESTS
        // ==================================

        const requestsQuery =
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
            await get(requestsQuery);


        let alreadyExists = false;


        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const request =
                    child.val() || {};


                const requestName =
                    request.vipName ||
                    request.name ||
                    request.planName ||
                    "";


                const status =
                    String(
                        request.status || ""
                    ).toLowerCase();


                if (
                    requestName === vipName &&
                    (
                        status === "pending" ||
                        status === "processing" ||
                        status === "approved"
                    )
                ) {

                    alreadyExists = true;

                }

            });

        }


        if (alreadyExists) {

            button.innerHTML = `
                <i class="fas fa-clock"></i>
                Pending
            `;

            button.style.display =
                "none";

            alert(
                `You already have a request or purchase for ${vipName}.`
            );

            return;

        }


        // ==================================
        // CREATE REQUEST
        // ==================================

        const requestRef =
            push(
                ref(
                    db,
                    "vipPurchaseRequests"
                )
            );


        await set(
            requestRef,
            {

                uid:
                    currentUser.uid,

                email:
                    currentUser.email || "",

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

                status:
                    "pending",

                createdAt:
                    Date.now()

            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        button.innerHTML = `
            <i class="fas fa-clock"></i>
            Pending
        `;

        button.classList.add(
            "purchased"
        );

        button.style.display =
            "none";

        button.disabled = true;


        alert(
            `VIP purchase request sent successfully!\n\n` +
            `${vipName}\n` +
            `Price: ${price.toLocaleString()} RWF\n\n` +
            `Please wait for Admin approval.`
        );


        console.log(
            "VIP REQUEST CREATED:",
            requestRef.key
        );


    } catch (error) {

        console.error(
            "BUY VIP ERROR:",
            error
        );


        button.innerHTML =
            originalHTML;

        button.disabled =
            false;

        button.dataset.buying =
            "false";


        alert(
            "VIP purchase failed:\n\n" +
            (
                error.message ||
                error
            )
        );

    }

}


// ======================================
// LOAD USER VIP PLANS
// ======================================

function loadUserVipPlans() {

    if (!currentUser) {
        return;
    }


    const vipRef =
        ref(
            db,
            `users/${currentUser.uid}/vipPlans`
        );


    onValue(
        vipRef,
        (snapshot) => {

            userVipPlans =
                snapshot.exists()
                    ? (
                        snapshot.val() ||
                        {}
                    )
                    : {};


            renderOwnedVipPlans();

            updateVipButtons();

            startClaimTimer();

        },
        (error) => {

            console.error(
                "USER VIP PLANS ERROR:",
                error
            );

        }
    );

}


// ======================================
// RENDER OWNED VIP
// ======================================

function renderOwnedVipPlans() {

    if (!ownedVipList) {
        return;
    }


    ownedVipList.innerHTML =
        "";


    const entries =
        Object.entries(
            userVipPlans || {}
        );


    if (!entries.length) {

        ownedVipList.innerHTML = `
            <div class="empty-vip">
                No VIP purchased.
            </div>
        `;

        updateSummary(
            0,
            0,
            0
        );

        return;

    }


    let activeCount = 0;

    let dailyTotal = 0;

    let profitTotal = 0;


    entries.sort(
        ([keyA, a], [keyB, b]) =>
            getVipNumber(
                a,
                keyA
            ) -
            getVipNumber(
                b,
                keyB
            )
    );


    entries.forEach(
        ([id, plan]) => {

            if (!plan) {
                return;
            }


            const name =
                plan.vipName ||
                plan.name ||
                "VIP Plan";


            const price =
                Number(
                    plan.price ??
                    plan.vipPrice ??
                    0
                );


            const daily =
                Number(
                    plan.dailyIncome ??
                    plan.daily ??
                    0
                );


            const duration =
                Number(
                    plan.totalDays ??
                    plan.duration ??
                    plan.days ??
                    0
                );


            const profit =
                Number(
                    plan.totalProfit ??
                    plan.profit ??
                    0
                );


            const startDate =
                Number(
                    plan.startDate ??
                    plan.approvedAt ??
                    plan.createdAt ??
                    0
                );


            let endDate =
                Number(
                    plan.endDate || 0
                );


            if (
                !endDate &&
                startDate &&
                duration > 0
            ) {

                endDate =
                    startDate +
                    duration * DAY;

            }


            let remainingDays = 0;


            if (endDate) {

                remainingDays =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                endDate -
                                Date.now()
                            ) / DAY
                        )
                    );

            }


            let status =
                String(
                    plan.status ||
                    "active"
                ).toLowerCase();


            if (
                endDate &&
                Date.now() > endDate
            ) {

                status =
                    "expired";

            }


            if (
                status === "active"
            ) {

                activeCount++;

                dailyTotal += daily;

            }


            profitTotal += profit;


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "owned-vip-card";


            card.dataset.vipId =
                id;


            card.innerHTML = `

                <div class="owned-vip-header">

                    <div class="owned-vip-name">

                        <i class="fas fa-crown"></i>

                        <span>
                            ${escapeHtml(name)}
                        </span>

                    </div>

                    <span
                        class="vip-status ${status}">
                        ${status.toUpperCase()}
                    </span>

                </div>


                <div class="owned-vip-info">

                    <div class="vip-info-item">

                        <span>
                            Price
                        </span>

                        <strong>
                            ${price.toLocaleString()} RWF
                        </strong>

                    </div>


                    <div class="vip-info-item">

                        <span>
                            Daily Income
                        </span>

                        <strong>
                            ${daily.toLocaleString()} RWF
                        </strong>

                    </div>


                    <div class="vip-info-item">

                        <span>
                            Duration
                        </span>

                        <strong>
                            ${duration} Days
                        </strong>

                    </div>


                    <div class="vip-info-item">

                        <span>
                            Remaining
                        </span>

                        <strong>
                            ${remainingDays} Days
                        </strong>

                    </div>


                    <div class="vip-info-item">

                        <span>
                            Total Profit
                        </span>

                        <strong>
                            ${profit.toLocaleString()} RWF
                        </strong>

                    </div>


                    <div class="vip-info-item">

                        <span>
                            Started
                        </span>

                        <strong>
                            ${
                                startDate
                                    ? new Date(
                                        startDate
                                    ).toLocaleDateString()
                                    : "N/A"
                            }
                        </strong>

                    </div>

                </div>

            `;


            ownedVipList.appendChild(
                card
            );

        }
    );


    updateSummary(
        activeCount,
        dailyTotal,
        profitTotal
    );

}


// ======================================
// UPDATE SUMMARY
// ======================================

function updateSummary(
    activeCount,
    dailyTotal,
    profitTotal
) {

    if (currentVipEl) {

        currentVipEl.textContent =
            activeCount > 0
                ? `${activeCount} Active`
                : "No Active VIP";

    }


    if (dailyIncomeEl) {

        dailyIncomeEl.textContent =
            `${Number(
                dailyTotal || 0
            ).toLocaleString()} RWF`;

    }


    if (totalProfitEl) {

        totalProfitEl.textContent =
            `${Number(
                profitTotal || 0
            ).toLocaleString()} RWF`;

    }

}


// ======================================
// UPDATE BUY BUTTONS
// ======================================

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

        // ==============================
        // OWNED VIP
        // ==============================

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
                    ownedSnapshot.val() ||
                    {}
                )
                : {};


        // ==============================
        // REQUESTS
        // ==============================

        const requestsQuery =
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


        const requestSnapshot =
            await get(
                requestsQuery
            );


        const requests =
            requestSnapshot.exists()
                ? (
                    requestSnapshot.val() ||
                    {}
                )
                : {};


        // ==============================
        // BUTTONS
        // ==============================

        buttons.forEach(
            (button) => {

                const vipName =
                    button.dataset.vip ||
                    "";


                let ownedVip =
                    false;

                let pendingVip =
                    false;


                // ==========================
                // CHECK OWNED
                // ==========================

                Object.values(
                    owned
                ).forEach(
                    (plan) => {

                        if (!plan) {
                            return;
                        }


                        const name =
                            plan.vipName ||
                            plan.name ||
                            "";


                        const status =
                            String(
                                plan.status ||
                                "active"
                            ).toLowerCase();


                        if (
                            name === vipName &&
                            (
                                status === "active" ||
                                status === "expired"
                            )
                        ) {

                            ownedVip =
                                true;

                        }

                    }
                );


                // ==========================
                // CHECK REQUEST
                // ==========================

                Object.values(
                    requests
                ).forEach(
                    (request) => {

                        if (!request) {
                            return;
                        }


                        const name =
                            request.vipName ||
                            request.name ||
                            "";


                        const status =
                            String(
                                request.status ||
                                ""
                            ).toLowerCase();


                        if (
                            name === vipName &&
                            (
                                status === "pending" ||
                                status === "processing"
                            )
                        ) {

                            pendingVip =
                                true;

                        }

                    }
                );


                // ==========================
                // OWNED
                // ==========================

                if (ownedVip) {

                    button.disabled =
                        true;

                    button.style.display =
                        "none";

                    return;

                }


                // ==========================
                // PENDING
                // ==========================

                if (pendingVip) {

                    button.disabled =
                        true;

                    button.style.display =
                        "none";

                    return;

                }


                // ==========================
                // AVAILABLE
                // ==========================

                if (
                    button.dataset.buying !==
                    "true"
                ) {

                    button.disabled =
                        false;

                    button.style.display =
                        "";

                    button.classList.remove(
                        "purchased"
                    );

                    button.innerHTML = `
                        <i class="fas fa-cart-shopping"></i>
                        Buy Now
                    `;

                }

            }
        );


    } catch (error) {

        console.error(
            "UPDATE VIP BUTTONS ERROR:",
            error
        );

    }

}


// ======================================
// VIP EXPIRATION
// ======================================

async function checkVipExpiration() {

    if (!currentUser) {
        return;
    }


    try {

        const vipRef =
            ref(
                db,
                `users/${currentUser.uid}/vipPlans`
            );


        const snapshot =
            await get(vipRef);


        if (!snapshot.exists()) {
            return;
        }


        const plans =
            snapshot.val() || {};


        const now =
            Date.now();


        const updates = {};


        Object.entries(
            plans
        ).forEach(
            ([id, plan]) => {

                if (!plan) {
                    return;
                }


                const duration =
                    Number(
                        plan.totalDays ??
                        plan.duration ??
                        plan.days ??
                        0
                    );


                const startDate =
                    Number(
                        plan.startDate ??
                        plan.approvedAt ??
                        plan.createdAt ??
                        0
                    );


                let endDate =
                    Number(
                        plan.endDate || 0
                    );


                if (
                    !endDate &&
                    startDate &&
                    duration > 0
                ) {

                    endDate =
                        startDate +
                        duration * DAY;


                    updates[
                        `${id}/endDate`
                    ] =
                        endDate;

                }


                if (!endDate) {
                    return;
                }


                const remainingDays =
                    Math.max(
                        0,
                        Math.ceil(
                            (
                                endDate -
                                now
                            ) / DAY
                        )
                    );


                updates[
                    `${id}/remainingDays`
                ] =
                    remainingDays;


                if (
                    now >= endDate
                ) {

                    updates[
                        `${id}/status`
                    ] =
                        "expired";

                } else {

                    if (
                        String(
                            plan.status ||
                            "active"
                        ).toLowerCase() !==
                        "expired"
                    ) {

                        updates[
                            `${id}/status`
                        ] =
                            "active";

                    }

                }

            }
        );


        if (
            Object.keys(updates).length
        ) {

            await update(
                vipRef,
                updates
            );

        }


    } catch (error) {

        console.error(
            "VIP EXPIRATION ERROR:",
            error
        );

    }

}


// ======================================
// CLAIM TIMER
// ======================================

function startClaimTimer() {

    stopClaimTimer();

    updateClaimTimer();

    claimTimerInterval =
        setInterval(
            updateClaimTimer,
            1000
        );

}


// ======================================
// STOP CLAIM TIMER
// ======================================

function stopClaimTimer() {

    if (claimTimerInterval) {

        clearInterval(
            claimTimerInterval
        );

        claimTimerInterval =
            null;

    }

}


// ======================================
// UPDATE CLAIM TIMER
// ======================================

function updateClaimTimer() {

    if (!claimButton) {
        return;
    }


    if (!currentUser) {

        claimButton.disabled =
            true;

        return;

    }


    const plans =
        userVipPlans || {};


    const now =
        Date.now();


    let earliestNextClaim =
        Infinity;


    let canClaim =
        false;


    Object.values(
        plans
    ).forEach(
        (plan) => {

            if (!plan) {
                return;
            }


            const status =
                String(
                    plan.status ||
                    "active"
                ).toLowerCase();


            if (
                status !== "active"
            ) {
                return;
            }


            const daily =
                Number(
                    plan.dailyIncome ??
                    plan.daily ??
                    0
                );


            if (daily <= 0) {
                return;
            }


            const startDate =
                Number(
                    plan.startDate ??
                    plan.approvedAt ??
                    plan.createdAt ??
                    0
                );


            const duration =
                Number(
                    plan.totalDays ??
                    plan.duration ??
                    plan.days ??
                    0
                );


            let endDate =
                Number(
                    plan.endDate || 0
                );


            if (
                !endDate &&
                startDate &&
                duration > 0
            ) {

                endDate =
                    startDate +
                    duration * DAY;

            }


            if (
                endDate &&
                now > endDate
            ) {
                return;
            }


            const lastClaim =
                Number(
                    plan.lastClaim || 0
                );


            const nextClaim =
                lastClaim > 0
                    ? lastClaim + DAY
                    : startDate + DAY;


            if (
                now >= nextClaim
            ) {

                canClaim =
                    true;

            } else {

                if (
                    nextClaim <
                    earliestNextClaim
                ) {

                    earliestNextClaim =
                        nextClaim;

                }

            }

        }
    );


    if (canClaim) {

        claimButton.disabled =
            false;

        claimButton.innerHTML = `
            <i class="fas fa-coins"></i>
            Claim Daily Income
        `;


        if (claimTimer) {

            claimTimer.textContent =
                "Available now";

        }

        return;

    }


    claimButton.disabled =
        true;


    if (
        earliestNextClaim ===
        Infinity
    ) {

        claimButton.innerHTML = `
            <i class="fas fa-clock"></i>
            Claim Daily Income
        `;


        if (claimTimer) {

            claimTimer.textContent =
                "No active VIP income available";

        }

        return;

    }


    const remaining =
        Math.max(
            0,
            earliestNextClaim -
            now
        );


    const hours =
        Math.floor(
            remaining /
            (60 * 60 * 1000)
        );


    const minutes =
        Math.floor(
            (
                remaining %
                (60 * 60 * 1000)
            ) /
            (60 * 1000)
        );


    const seconds =
        Math.floor(
            (
                remaining %
                (60 * 1000)
            ) /
            1000
        );


    if (claimTimer) {

        claimTimer.textContent =
            `Next claim in ${String(hours).padStart(2, "0")}:` +
            `${String(minutes).padStart(2, "0")}:` +
            `${String(seconds).padStart(2, "0")}`;

    }

}


// ======================================
// CLAIM DAILY INCOME
// ======================================

async function claimDailyIncome() {

    if (claimInProgress) {
        return;
    }


    if (!currentUser) {

        alert(
            "Please login first."
        );

        return;

    }


    claimInProgress =
        true;


    if (claimButton) {

        claimButton.disabled =
            true;

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
                (user) => {

                    if (!user) {
                        return;
                    }


                    const plans =
                        user.vipPlans || {};


                    let balance =
                        Number(
                            user.balance || 0
                        );


                    const now =
                        Date.now();


                    let claimedTotal =
                        0;


                    Object.entries(
                        plans
                    ).forEach(
                        ([id, plan]) => {

                            if (!plan) {
                                return;
                            }


                            const status =
                                String(
                                    plan.status ||
                                    "active"
                                ).toLowerCase();


                            if (
                                status !== "active"
                            ) {
                                return;
                            }


                            const daily =
                                Number(
                                    plan.dailyIncome ??
                                    plan.daily ??
                                    0
                                );


                            if (
                                daily <= 0
                            ) {
                                return;
                            }


                            const startDate =
                                Number(
                                    plan.startDate ??
                                    plan.approvedAt ??
                                    plan.createdAt ??
                                    0
                                );


                            const duration =
                                Number(
                                    plan.totalDays ??
                                    plan.duration ??
                                    plan.days ??
                                    0
                                );


                            let endDate =
                                Number(
                                    plan.endDate || 0
                                );


                            if (
                                !endDate &&
                                startDate &&
                                duration > 0
                            ) {

                                endDate =
                                    startDate +
                                    duration * DAY;

                            }


                            if (
                                endDate &&
                                now > endDate
                            ) {

                                return;

                            }


                            const lastClaim =
                                Number(
                                    plan.lastClaim ||
                                    0
                                );


                            const nextClaim =
                                lastClaim > 0
                                    ? lastClaim + DAY
                                    : startDate + DAY;


                            if (
                                now < nextClaim
                            ) {

                                return;

                            }


                            // ==========================
                            // PAY DAILY INCOME ONCE
                            // ==========================

                            balance +=
                                daily;


                            claimedTotal +=
                                daily;


                            plan.lastClaim =
                                now;


                            const oldEarned =
                                Number(
                                    plan.totalEarned ??
                                    plan.earned ??
                                    0
                                );


                            plan.totalEarned =
                                oldEarned +
                                daily;


                            plan.earned =
                                plan.totalEarned;


                            plan.claimedAmount =
                                Number(
                                    plan.claimedAmount ||
                                    0
                                ) +
                                daily;


                            plan.claimCount =
                                Number(
                                    plan.claimCount ||
                                    0
                                ) +
                                1;


                            plans[id] =
                                plan;

                        }
                    );


                    if (
                        claimedTotal <= 0
                    ) {

                        return;

                    }


                    user.balance =
                        balance;


                    user.vipPlans =
                        plans;


                    return user;

                }
            );


        if (
            !result.committed
        ) {

            throw new Error(
                "No VIP income is available yet. Please wait until the 24-hour timer finishes."
            );

        }


        const updated =
            result.snapshot.val() ||
            {};


        userData =
            updated;


        userVipPlans =
            updated.vipPlans ||
            {};


        updateBalance(
            Number(
                updated.balance ||
                0
            )
        );


        if (claimButton) {

            claimButton.disabled =
                true;

            claimButton.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Claimed
            `;

        }


        console.log(
            "VIP CLAIM SUCCESS"
        );


        alert(
            "Daily VIP income claimed successfully!"
        );


        startClaimTimer();


    } catch (error) {

        console.error(
            "CLAIM ERROR:",
            error
        );


        if (claimButton) {

            claimButton.disabled =
                false;

            claimButton.innerHTML = `
                <i class="fas fa-coins"></i>
                Claim Daily Income
            `;

        }


        alert(
            "Claim failed:\n\n" +
            (
                error.message ||
                error
            )
        );


    } finally {

        claimInProgress =
            false;

    }

}


// ======================================
// CLAIM BUTTON
// ======================================

claimButton?.addEventListener(
    "click",
    claimDailyIncome
);


// ======================================
// REFRESH
// ======================================

function refreshVipSystem() {

    if (!currentUser) {
        return;
    }


    updateVipButtons();

    checkVipExpiration();

    startClaimTimer();

}


// ======================================
// PAGE VISIBILITY
// ======================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            refreshVipSystem();

        }

    }
);


// ======================================
// FINAL
// ======================================

console.log(
    "================================"
);

console.log(
    "MONEY VAULT VIP.JS LOADED"
);

console.log(
    "BUY + CLAIM SYSTEM READY"
);

console.log(
    "================================"
);
