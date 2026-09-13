/* =========================================================
   MONEY VAULT - ADMIN.JS
   ADMIN PANEL
   CURRENCY: RWF / FRW

   VIP FLOW:
   - User buys VIP directly
   - No Admin VIP approval required
   - Admin only views VIP Requests / VIP Buyers

   QUICK ACTIONS:
   - Every quick action opens the correct section
   - Refresh works
   - Approve All Deposits works
   - Approve All Withdraws works
========================================================= */

import { auth, db, authReady } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue,
    get,
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentAdmin = null;
let adminData = null;

let allUsers = [];
let allDeposits = [];
let allWithdraws = [];
let allVipRequests = [];
let allVipBuyers = [];
let allBonusRequests = [];
let allTransactions = [];

let selectedWithdrawId = null;

let listenersStarted = false;
let adminReady = false;


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);

function numberValue(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function money(value) {
    return `${numberValue(value).toLocaleString()} RWF`;
}

function normalizeStatus(value) {
    return String(value || "pending").toLowerCase().trim();
}

function safeText(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(timestamp) {
    if (!timestamp) return "-";

    const date = new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString();
}

function getUser(uid) {
    return allUsers.find(u => u.uid === uid) || null;
}

function showToast(message, type = "info") {

    const container = $("toastContainer");

    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = `toast ${type}`;

    toast.innerHTML = `
        <span>${safeText(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}


/* =========================================================
   ADMIN CHECK
========================================================= */

async function verifyAdmin(user) {

    if (!user) {
        throw new Error("No authenticated user.");
    }

    const adminSnap = await get(
        ref(db, `admins/${user.uid}`)
    );

    if (!adminSnap.exists()) {
        throw new Error("You are not an administrator.");
    }

    currentAdmin = user;

    adminData = adminSnap.val();

    adminReady = true;

    return true;
}


/* =========================================================
   ADMIN UI
========================================================= */

function showAdminPanel() {

    const loading = $("loadingScreen");

    if (loading) {
        loading.style.display = "none";
    }

    const adminName =
        adminData?.name ||
        adminData?.fullName ||
        currentAdmin?.displayName ||
        "Administrator";

    if ($("adminName")) {
        $("adminName").textContent = adminName;
    }

    if ($("adminEmail")) {
        $("adminEmail").textContent =
            currentAdmin?.email || "";
    }

    if ($("adminNameInput")) {
        $("adminNameInput").value = adminName;
    }

    if ($("adminEmailInput")) {
        $("adminEmailInput").value =
            currentAdmin?.email || "";
    }
}


/* =========================================================
   NAVIGATION
========================================================= */

const pageNames = {
    dashboard: "Dashboard",
    deposits: "Deposits",
    withdraws: "Withdraws",
    vipRequests: "VIP Requests",
    vipBuyers: "VIP Buyers",
    bonusRequests: "Bonus Requests",
    users: "Users",
    transactions: "Transactions",
    quickActions: "Quick Actions",
    settings: "Settings"
};

function openPage(page) {

    if (!page) return;

    document
        .querySelectorAll(".page-section")
        .forEach(section => {
            section.classList.remove("active");
        });

    const target = $(`${page}Section`);

    if (target) {
        target.classList.add("active");
    }

    document
        .querySelectorAll(".menu-link")
        .forEach(link => {
            link.classList.remove("active");

            if (link.dataset.page === page) {
                link.classList.add("active");
            }
        });

    if ($("pageTitle")) {
        $("pageTitle").textContent =
            pageNames[page] || "Dashboard";
    }

    window.location.hash = page;

    if (page === "dashboard") {
        renderDashboard();
    }

    if (page === "deposits") {
        renderDeposits();
    }

    if (page === "withdraws") {
        renderWithdraws();
    }

    if (page === "vipRequests") {
        renderVipRequests();
    }

    if (page === "vipBuyers") {
        renderVipBuyers();
    }

    if (page === "bonusRequests") {
        renderBonusRequests();
    }

    if (page === "users") {
        renderUsers();
    }

    if (page === "transactions") {
        renderTransactions();
    }
}


/* =========================================================
   MENU
========================================================= */

function initializeNavigation() {

    document
        .querySelectorAll(".menu-link")
        .forEach(link => {

            link.addEventListener("click", event => {

                event.preventDefault();

                openPage(link.dataset.page);
            });
        });


    const menuBtn = $("menuBtn");
    const sidebar = $("sidebar");

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("open");

        });
    }


    const logoutBtn = $("logoutBtn");

    if (logoutBtn) {

        logoutBtn.addEventListener("click", async () => {

            try {

                await signOut(auth);

                window.location.href = "login.html";

            } catch (error) {

                console.error(error);

                showToast(
                    "Logout failed.",
                    "error"
                );
            }
        });
    }
}


/* =========================================================
   DATABASE LISTENERS
========================================================= */

function startDatabaseListeners() {

    if (listenersStarted) return;

    listenersStarted = true;


    /* USERS */

    onValue(
        ref(db, "users"),
        snapshot => {

            const data = snapshot.val() || {};

            allUsers = Object.entries(data)
                .map(([uid, user]) => ({
                    uid,
                    ...(user || {})
                }));

            renderDashboard();
            renderUsers();
        },
        error => {

            console.error(
                "Users listener:",
                error
            );
        }
    );


    /* DEPOSITS */

    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            const data = snapshot.val() || {};

            allDeposits = Object.entries(data)
                .map(([id, item]) => ({
                    id,
                    ...(item || {})
                }))
                .sort(
                    (a, b) =>
                        numberValue(b.createdAt) -
                        numberValue(a.createdAt)
                );

            renderDeposits();
            renderDashboard();
        },
        error => {

            console.error(
                "Deposits listener:",
                error
            );
        }
    );


    /* WITHDRAWS */

    onValue(
        ref(db, "withdrawRequests"),
        snapshot => {

            const data = snapshot.val() || {};

            allWithdraws = Object.entries(data)
                .map(([id, item]) => ({
                    id,
                    ...(item || {})
                }))
                .sort(
                    (a, b) =>
                        numberValue(b.createdAt) -
                        numberValue(a.createdAt)
                );

            renderWithdraws();
            renderDashboard();
        },
        error => {

            console.error(
                "Withdraws listener:",
                error
            );
        }
    );


    /* VIP REQUESTS */

    onValue(
        ref(db, "vipPurchaseRequests"),
        snapshot => {

            const data = snapshot.val() || {};

            allVipRequests = Object.entries(data)
                .map(([id, item]) => ({
                    id,
                    ...(item || {})
                }))
                .sort(
                    (a, b) =>
                        numberValue(b.createdAt) -
                        numberValue(a.createdAt)
                );

            renderVipRequests();
        },
        error => {

            console.error(
                "VIP requests listener:",
                error
            );
        }
    );


    /* VIP BUYERS */

    onValue(
        ref(db, "vipBuyers"),
        snapshot => {

            const data = snapshot.val() || {};

            allVipBuyers = Object.entries(data)
                .map(([id, item]) => ({
                    id,
                    ...(item || {})
                }))
                .sort(
                    (a, b) =>
                        numberValue(b.purchasedAt) -
                        numberValue(a.purchasedAt)
                );

            renderVipBuyers();
        },
        error => {

            console.error(
                "VIP buyers listener:",
                error
            );
        }
    );


    /* BONUS REQUESTS */

    onValue(
        ref(db, "bonusRequests"),
        snapshot => {

            const data = snapshot.val() || {};

            allBonusRequests = Object.entries(data)
                .map(([id, item]) => ({
                    id,
                    ...(item || {})
                }))
                .sort(
                    (a, b) =>
                        numberValue(b.createdAt) -
                        numberValue(a.createdAt)
                );

            renderBonusRequests();
        },
        error => {

            console.error(
                "Bonus listener:",
                error
            );
        }
    );


    /* TRANSACTIONS */

    onValue(
        ref(db, "transactions"),
        snapshot => {

            const data = snapshot.val() || {};

            allTransactions = Object.entries(data)
                .map(([id, item]) => ({
                    id,
                    ...(item || {})
                }))
                .sort(
                    (a, b) =>
                        numberValue(b.createdAt) -
                        numberValue(a.createdAt)
                );

            renderTransactions();
        },
        error => {

            console.error(
                "Transactions listener:",
                error
            );
        }
    );
}

// ======================================
// DASHBOARD STATISTICS
// USERS + SYSTEM BALANCE
// ======================================

const totalUsersEl =
    document.getElementById("totalUsers");

const systemBalanceEl =
    document.getElementById("systemBalance");

const activeUsersEl =
    document.getElementById("activeUsers");

const blockedUsersEl =
    document.getElementById("blockedUsers");

const usersContainer =
    document.getElementById("usersContainer");

let allUsersData = {};

// ======================================
// LOAD USERS + SYSTEM BALANCE
// ======================================

function loadUsersAndSystemBalance() {

    const usersRef = ref(db, "users");

    onValue(
        usersRef,
        (snapshot) => {

            allUsersData = {};

            let totalUsers = 0;
            let totalBalance = 0;
            let activeUsers = 0;
            let blockedUsers = 0;

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const uid = child.key;
                    const user = child.val() || {};

                    allUsersData[uid] = user;

                    totalUsers++;

                    totalBalance +=
                        Number(user.balance || 0);

                    const status =
                        String(user.status || "active")
                            .toLowerCase();

                    if (
                        status === "blocked" ||
                        status === "suspended"
                    ) {
                        blockedUsers++;
                    } else {
                        activeUsers++;
                    }

                });
            }

            // ==============================
            // DASHBOARD
            // ==============================

            if (totalUsersEl) {
                totalUsersEl.textContent =
                    totalUsers.toLocaleString();
            }

            if (systemBalanceEl) {
                systemBalanceEl.textContent =
                    totalBalance.toLocaleString() +
                    " RWF";
            }

            if (activeUsersEl) {
                activeUsersEl.textContent =
                    activeUsers.toLocaleString();
            }

            if (blockedUsersEl) {
                blockedUsersEl.textContent =
                    blockedUsers.toLocaleString();
            }

            // ==============================
            // USERS LIST
            // ==============================

            renderUsersList(allUsersData);

        },
        (error) => {

            console.error(
                "Users Load Error:",
                error
            );

            if (usersContainer) {

                usersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <h3>Failed to Load Users</h3>
                        <p>${error.message}</p>
                    </div>
                `;

            }

        }
    );
}


// ======================================
// RENDER USERS
// ======================================

function renderUsersList(users) {

    if (!usersContainer) return;

    const entries =
        Object.entries(users);

    if (!entries.length) {

        usersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-users"></i>
                <h3>No Users Found</h3>
                <p>No registered users yet.</p>
            </div>
        `;

        return;
    }

    usersContainer.innerHTML = "";

    entries.forEach(([uid, user]) => {

        const name =
            user.fullName ||
            user.name ||
            "Unknown User";

        const email =
            user.email ||
            "-";

        const phone =
            user.phone ||
            "-";

        const balance =
            Number(user.balance || 0);

        const status =
            String(user.status || "active")
                .toLowerCase();

        const blocked =
            status === "blocked" ||
            status === "suspended";

        const vip =
            user.vip ||
            "VIP 0";

        const card =
            document.createElement("div");

        card.className = "user-card";

        card.innerHTML = `
            <div class="user-card-header">

                <div class="user-avatar">
                    <i class="fa-solid fa-user"></i>
                </div>

                <div class="user-main-info">

                    <h3>
                        ${escapeHTML(name)}
                    </h3>

                    <p>
                        ${escapeHTML(email)}
                    </p>

                </div>

                <span class="status ${
                    blocked
                        ? "blocked"
                        : "active"
                }">
                    ${
                        blocked
                            ? "Blocked"
                            : "Active"
                    }
                </span>

            </div>

            <div class="user-card-details">

                <div>
                    <small>Phone</small>
                    <strong>
                        ${escapeHTML(phone)}
                    </strong>
                </div>

                <div>
                    <small>Balance</small>
                    <strong>
                        ${balance.toLocaleString()} RWF
                    </strong>
                </div>

                <div>
                    <small>VIP</small>
                    <strong>
                        ${escapeHTML(String(vip))}
                    </strong>
                </div>

            </div>

            <div class="user-card-footer">

                <small>
                    UID: ${escapeHTML(uid)}
                </small>

            </div>
        `;

        usersContainer.appendChild(card);

    });

}


// ======================================
// SEARCH USERS
// ======================================

const userSearch =
    document.getElementById("userSearch");

userSearch?.addEventListener(
    "input",
    () => {

        const keyword =
            userSearch.value
                .trim()
                .toLowerCase();

        if (!keyword) {

            renderUsersList(
                allUsersData
            );

            return;
        }

        const filtered = {};

        Object.entries(allUsersData)
            .forEach(([uid, user]) => {

                const text = [

                    user.fullName,
                    user.name,
                    user.email,
                    user.phone,
                    uid

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

                if (text.includes(keyword)) {
                    filtered[uid] = user;
                }

            });

        renderUsersList(filtered);

    }
);


// ======================================
// HTML ESCAPE
// ======================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ======================================
// START
// ======================================

loadUsersAndSystemBalance();

console.log(
    "✅ Users + System Balance Loaded"
);


/* =========================================================
   RECENT ACTIVITY
========================================================= */

function renderRecentActivity() {

    const box = $("recentActivity");

    if (!box) return;

    const recent = [
        ...allDeposits.map(x => ({
            type: "Deposit",
            amount: x.amount,
            status: x.status,
            createdAt: x.createdAt,
            uid: x.uid
        })),

        ...allWithdraws.map(x => ({
            type: "Withdraw",
            amount: x.amount,
            status: x.status,
            createdAt: x.createdAt,
            uid: x.uid
        })),

        ...allVipRequests.map(x => ({
            type: "VIP",
            amount: x.price,
            status: x.status,
            createdAt: x.createdAt,
            uid: x.uid
        }))
    ]
    .sort(
        (a, b) =>
            numberValue(b.createdAt) -
            numberValue(a.createdAt)
    )
    .slice(0, 8);


    if (!recent.length) {

        box.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <h3>No Recent Activity</h3>
                <p>There is no recent activity.</p>
            </div>
        `;

        return;
    }


    box.innerHTML = recent.map(item => {

        const user = getUser(item.uid);

        return `
            <div class="activity-item">

                <div>
                    <strong>
                        ${safeText(item.type)}
                    </strong>

                    <p>
                        ${safeText(
                            user?.fullName ||
                            user?.email ||
                            item.uid ||
                            "-"
                        )}
                    </p>
                </div>

                <div>
                    <strong>
                        ${money(item.amount)}
                    </strong>

                    <small>
                        ${safeText(
                            normalizeStatus(item.status)
                        )}
                    </small>
                </div>

            </div>
        `;

    }).join("");
}


/* =========================================================
   DEPOSITS
========================================================= */

function renderDeposits() {

    const list = $("depositList");
    const empty = $("emptyDeposit");

    if (!list) return;


    const search =
        ($("depositSearch")?.value || "")
        .toLowerCase()
        .trim();

    const filter =
        $("depositFilter")?.value || "all";


    let items = allDeposits.filter(item => {

        const user = getUser(item.uid);

        const text = `
            ${item.id}
            ${item.transactionId || ""}
            ${user?.fullName || ""}
            ${user?.email || ""}
            ${user?.phone || ""}
        `.toLowerCase();

        const matchesSearch =
            !search ||
            text.includes(search);

        const status =
            normalizeStatus(item.status);

        const matchesFilter =
            filter === "all" ||
            status === filter;

        return matchesSearch && matchesFilter;
    });


    const pending =
        allDeposits.filter(
            x => normalizeStatus(x.status) === "pending"
        ).length;

    const approved =
        allDeposits.filter(
            x => normalizeStatus(x.status) === "approved"
        ).length;

    const rejected =
        allDeposits.filter(
            x => normalizeStatus(x.status) === "rejected"
        ).length;


    if ($("depositTotalCount")) {
        $("depositTotalCount").textContent =
            allDeposits.length;
    }

    if ($("depositPendingCount")) {
        $("depositPendingCount").textContent =
            pending;
    }

    if ($("depositApprovedCount")) {
        $("depositApprovedCount").textContent =
            approved;
    }

    if ($("depositRejectedCount")) {
        $("depositRejectedCount").textContent =
            rejected;
    }


    if (!items.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML = items.map(item => {

        const user = getUser(item.uid);
        const status = normalizeStatus(item.status);

        return `
            <div class="request-card">

                <div class="request-header">

                    <h3>
                        ${safeText(
                            user?.fullName ||
                            user?.email ||
                            item.uid
                        )}
                    </h3>

                    <span class="status ${status}">
                        ${safeText(status)}
                    </span>

                </div>

                <p>
                    <strong>Amount:</strong>
                    ${money(item.amount)}
                </p>

                <p>
                    <strong>Email:</strong>
                    ${safeText(user?.email || item.email || "-")}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${safeText(user?.phone || item.phone || "-")}
                </p>

                <p>
                    <strong>Transaction ID:</strong>
                    ${safeText(
                        item.transactionId ||
                        item.reference ||
                        item.id
                    )}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${formatDate(item.createdAt)}
                </p>

                ${
                    status === "pending"
                    ? `
                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            onclick="approveDeposit('${safeText(item.id)}')">

                            <i class="fa-solid fa-circle-check"></i>
                            Approve

                        </button>

                        <button
                            class="rejectBtn"
                            onclick="rejectDeposit('${safeText(item.id)}')">

                            <i class="fa-solid fa-circle-xmark"></i>
                            Reject

                        </button>

                    </div>
                    `
                    : ""
                }

            </div>
        `;

    }).join("");
}


/* =========================================================
   APPROVE DEPOSIT
========================================================= */

async function approveDeposit(id) {

    if (!adminReady) {
        showToast("Admin is not ready.", "error");
        return;
    }

    try {

        const requestSnap =
            await get(
                ref(db, `depositRequests/${id}`)
            );

        if (!requestSnap.exists()) {
            throw new Error("Deposit request not found.");
        }

        const request = requestSnap.val();

        if (
            normalizeStatus(request.status) !==
            "pending"
        ) {
            showToast(
                "This deposit has already been processed.",
                "info"
            );
            return;
        }

        const uid = request.uid;

        if (!uid) {
            throw new Error("Deposit user not found.");
        }

        const amount =
            numberValue(request.amount);

        if (amount <= 0) {
            throw new Error("Invalid deposit amount.");
        }


        const userSnap =
            await get(
                ref(db, `users/${uid}`)
            );

        if (!userSnap.exists()) {
            throw new Error("User account not found.");
        }


        const user = userSnap.val();

        const currentBalance =
            numberValue(user.balance);

        const currentTotalDeposit =
            numberValue(
                user.totalDeposit
            );

        const currentTotalDeposits =
            numberValue(
                user.totalDeposits
            );

        const currentTotalTransactions =
            numberValue(
                user.totalTransactions
            );


        const updates = {};


        updates[`users/${uid}/balance`] =
            currentBalance + amount;

        updates[`users/${uid}/totalDeposit`] =
            currentTotalDeposit + amount;

        updates[`users/${uid}/totalDeposits`] =
            currentTotalDeposits + amount;

        updates[`users/${uid}/totalTransactions`] =
            currentTotalTransactions + 1;


        updates[`depositRequests/${id}/status`] =
            "approved";

        updates[`depositRequests/${id}/approvedAt`] =
            Date.now();

        updates[`depositRequests/${id}/approvedBy`] =
            currentAdmin.uid;


        const transactionId =
            `deposit_${id}`;


        updates[
            `transactions/${transactionId}`
        ] = {

            uid,

            type: "deposit",

            amount,

            currency: "RWF",

            status: "approved",

            requestId: id,

            createdAt: Date.now(),

            approvedAt: Date.now(),

            approvedBy: currentAdmin.uid

        };


        await update(
            ref(db),
            updates
        );


        showToast(
            "Deposit approved successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Deposit approve error:",
            error
        );

        showToast(
            `Deposit approve failed: ${error.message}`,
            "error"
        );
    }
}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    if (!adminReady) return;

    try {

        const snap =
            await get(
                ref(db, `depositRequests/${id}`)
            );

        if (!snap.exists()) {
            throw new Error("Deposit not found.");
        }

        const data = snap.val();

        if (
            normalizeStatus(data.status) !==
            "pending"
        ) {
            showToast(
                "This request has already been processed.",
                "info"
            );
            return;
        }


        await update(
            ref(db, `depositRequests/${id}`),
            {
                status: "rejected",
                rejectedAt: Date.now(),
                rejectedBy: currentAdmin.uid
            }
        );


        showToast(
            "Deposit rejected.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            `Deposit reject failed: ${error.message}`,
            "error"
        );
    }
}


/* =========================================================
   WITHDRAWS
========================================================= */

function renderWithdraws() {

    const list = $("withdrawList");
    const empty = $("emptyWithdraw");

    if (!list) return;


    const search =
        ($("withdrawSearch")?.value || "")
        .toLowerCase()
        .trim();

    const filter =
        $("withdrawFilter")?.value || "all";


    const items =
        allWithdraws.filter(item => {

            const user = getUser(item.uid);

            const text = `
                ${item.id}
                ${item.transactionId || ""}
                ${user?.fullName || ""}
                ${user?.email || ""}
                ${user?.phone || ""}
                ${item.accountNumber || ""}
            `.toLowerCase();

            const status =
                normalizeStatus(item.status);

            return (
                (!search || text.includes(search)) &&
                (filter === "all" || status === filter)
            );

        });


    const pending =
        allWithdraws.filter(
            x => normalizeStatus(x.status) === "pending"
        ).length;

    const approved =
        allWithdraws.filter(
            x => normalizeStatus(x.status) === "approved"
        ).length;

    const rejected =
        allWithdraws.filter(
            x => normalizeStatus(x.status) === "rejected"
        ).length;


    if ($("withdrawTotalCount")) {
        $("withdrawTotalCount").textContent =
            allWithdraws.length;
    }

    if ($("withdrawPendingCount")) {
        $("withdrawPendingCount").textContent =
            pending;
    }

    if ($("withdrawApprovedCount")) {
        $("withdrawApprovedCount").textContent =
            approved;
    }

    if ($("withdrawRejectedCount")) {
        $("withdrawRejectedCount").textContent =
            rejected;
    }


    if (!items.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML = items.map(item => {

        const user = getUser(item.uid);

        const status =
            normalizeStatus(item.status);

        return `
            <div class="request-card">

                <div class="request-header">

                    <h3>
                        ${safeText(
                            user?.fullName ||
                            user?.email ||
                            item.uid
                        )}
                    </h3>

                    <span class="status ${status}">
                        ${safeText(status)}
                    </span>

                </div>

                <p>
                    <strong>Amount:</strong>
                    ${money(item.amount)}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${safeText(
                        user?.phone ||
                        item.phone ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Payment:</strong>
                    ${safeText(
                        item.paymentMethod ||
                        item.method ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Account:</strong>
                    ${safeText(
                        item.accountNumber ||
                        item.account ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${formatDate(item.createdAt)}
                </p>

                ${
                    status === "pending"
                    ? `
                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            onclick="openWithdrawDetails('${safeText(item.id)}')">

                            <i class="fa-solid fa-circle-check"></i>
                            Review / Approve

                        </button>

                        <button
                            class="rejectBtn"
                            onclick="rejectWithdraw('${safeText(item.id)}')">

                            <i class="fa-solid fa-circle-xmark"></i>
                            Reject

                        </button>

                    </div>
                    `
                    : ""
                }

            </div>
        `;

    }).join("");
}


/* =========================================================
   OPEN WITHDRAW DETAILS
========================================================= */

function openWithdrawDetails(id) {

    const item =
        allWithdraws.find(x => x.id === id);

    if (!item) return;

    selectedWithdrawId = id;

    const user = getUser(item.uid);

    if ($("modalWithdrawName")) {
        $("modalWithdrawName").textContent =
            user?.fullName ||
            item.fullName ||
            "-";
    }

    if ($("modalWithdrawEmail")) {
        $("modalWithdrawEmail").textContent =
            user?.email ||
            item.email ||
            "-";
    }

    if ($("modalWithdrawAmount")) {
        $("modalWithdrawAmount").textContent =
            money(item.amount);
    }

    if ($("modalWithdrawPhone")) {
        $("modalWithdrawPhone").textContent =
            user?.phone ||
            item.phone ||
            "-";
    }

    if ($("modalWithdrawMethod")) {
        $("modalWithdrawMethod").textContent =
            item.paymentMethod ||
            item.method ||
            "-";
    }

    if ($("modalWithdrawAccount")) {
        $("modalWithdrawAccount").textContent =
            item.accountNumber ||
            item.account ||
            "-";
    }

    if ($("modalWithdrawDate")) {
        $("modalWithdrawDate").textContent =
            formatDate(item.createdAt);
    }

    if ($("modalWithdrawStatus")) {
        $("modalWithdrawStatus").textContent =
            normalizeStatus(item.status);
    }

    const modal = $("withdrawModal");

    if (modal) {
        modal.style.display = "flex";
    }
}


/* =========================================================
   APPROVE WITHDRAW
========================================================= */

async function approveWithdraw(id) {

    if (!adminReady) return;

    try {

        const snap =
            await get(
                ref(db, `withdrawRequests/${id}`)
            );

        if (!snap.exists()) {
            throw new Error("Withdraw request not found.");
        }

        const request = snap.val();

        if (
            normalizeStatus(request.status) !==
            "pending"
        ) {
            showToast(
                "This withdraw has already been processed.",
                "info"
            );
            return;
        }


        const amount =
            numberValue(request.amount);

        if (
            amount < 4000 ||
            amount > 500000
        ) {
            throw new Error(
                "Withdraw must be between 4,000 and 500,000 RWF."
            );
        }


        const uid = request.uid;

        const userSnap =
            await get(
                ref(db, `users/${uid}`)
            );

        if (!userSnap.exists()) {
            throw new Error("User not found.");
        }

        const user = userSnap.val();

        const balance =
            numberValue(user.balance);


        if (balance < amount) {
            throw new Error(
                "User has insufficient balance."
            );
        }


        const newBalance =
            balance - amount;

        const newTotalWithdraw =
            numberValue(user.totalWithdraw) +
            amount;

        const newTotalWithdraws =
            numberValue(user.totalWithdraws) +
            amount;

        const newTotalTransactions =
            numberValue(user.totalTransactions) +
            1;


        const now = Date.now();

        const transactionId =
            `withdraw_${id}`;


        const updates = {};


        updates[`users/${uid}/balance`] =
            newBalance;

        updates[`users/${uid}/totalWithdraw`] =
            newTotalWithdraw;

        updates[`users/${uid}/totalWithdraws`] =
            newTotalWithdraws;

        updates[`users/${uid}/totalTransactions`] =
            newTotalTransactions;


        updates[`withdrawRequests/${id}/status`] =
            "approved";

        updates[`withdrawRequests/${id}/approvedAt`] =
            now;

        updates[`withdrawRequests/${id}/approvedBy`] =
            currentAdmin.uid;


        updates[
            `transactions/${transactionId}`
        ] = {

            uid,

            type: "withdraw",

            amount,

            currency: "RWF",

            status: "approved",

            requestId: id,

            createdAt: now,

            approvedAt: now,

            approvedBy: currentAdmin.uid

        };


        await update(
            ref(db),
            updates
        );


        closeWithdrawModal();


        showToast(
            "Withdraw approved successfully.",
            "success"
        );

    } catch (error) {

        console.error(
            "Withdraw approve error:",
            error
        );

        showToast(
            `Withdraw approve failed: ${error.message}`,
            "error"
        );
    }
}


/* =========================================================
   REJECT WITHDRAW
========================================================= */

async function rejectWithdraw(id) {

    if (!adminReady) return;

    try {

        const snap =
            await get(
                ref(db, `withdrawRequests/${id}`)
            );

        if (!snap.exists()) {
            throw new Error("Withdraw not found.");
        }

        const data = snap.val();

        if (
            normalizeStatus(data.status) !==
            "pending"
        ) {
            showToast(
                "This request has already been processed.",
                "info"
            );
            return;
        }


        await update(
            ref(db, `withdrawRequests/${id}`),
            {
                status: "rejected",
                rejectedAt: Date.now(),
                rejectedBy: currentAdmin.uid
            }
        );


        closeWithdrawModal();


        showToast(
            "Withdraw rejected.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            `Withdraw reject failed: ${error.message}`,
            "error"
        );
    }
}


/* =========================================================
   VIP REQUESTS
   IMPORTANT:
   NO APPROVE / REJECT BUTTONS
   VIP IS ACTIVATED BY USER PURCHASE FLOW
========================================================= */

function renderVipRequests() {

    const list = $("vipRequestList");
    const empty = $("emptyVipRequest");

    if (!list) return;


    const total =
        allVipRequests.length;

    const pending =
        allVipRequests.filter(
            x => normalizeStatus(x.status) === "pending"
        ).length;

    const approved =
        allVipRequests.filter(
            x => normalizeStatus(x.status) === "approved"
        ).length;

    const rejected =
        allVipRequests.filter(
            x => normalizeStatus(x.status) === "rejected"
        ).length;


    if ($("vipTotalCount")) {
        $("vipTotalCount").textContent = total;
    }

    if ($("vipPendingCount")) {
        $("vipPendingCount").textContent = pending;
    }

    if ($("vipApprovedCount")) {
        $("vipApprovedCount").textContent = approved;
    }

    if ($("vipRejectedCount")) {
        $("vipRejectedCount").textContent = rejected;
    }


    if (!allVipRequests.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML =
        allVipRequests.map(item => {

            const user =
                getUser(item.uid);

            const status =
                normalizeStatus(item.status);

            return `
                <div class="request-card">

                    <div class="request-header">

                        <h3>
                            <i class="fa-solid fa-crown"></i>

                            ${safeText(
                                item.vipName ||
                                item.planName ||
                                item.planId ||
                                "VIP Plan"
                            )}
                        </h3>

                        <span class="status ${status}">
                            ${safeText(status)}
                        </span>

                    </div>

                    <p>
                        <strong>User:</strong>
                        ${safeText(
                            user?.fullName ||
                            user?.email ||
                            item.uid ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Price:</strong>
                        ${money(item.price)}
                    </p>

                    <p>
                        <strong>Daily Income:</strong>
                        ${money(item.dailyIncome)}
                    </p>

                    <p>
                        <strong>Total Profit:</strong>
                        ${money(item.totalProfit)}
                    </p>

                    <p>
                        <strong>Payment:</strong>
                        ${safeText(
                            item.paymentMethod ||
                            "Account Balance"
                        )}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${formatDate(item.createdAt)}
                    </p>

                    <div class="request-note">

                        <i class="fa-solid fa-circle-info"></i>

                        VIP purchase is handled automatically.
                        No admin approval is required.

                    </div>

                </div>
            `;

        }).join("");
}


/* =========================================================
   VIP BUYERS
========================================================= */

function renderVipBuyers() {

    const list = $("vipBuyerList");
    const empty = $("emptyVipBuyer");

    if (!list) return;


    const now = Date.now();

    const active =
        allVipBuyers.filter(item => {

            const status =
                normalizeStatus(item.status);

            const endDate =
                numberValue(item.endDate);

            return (
                status === "active" &&
                (!endDate || endDate > now)
            );

        });


    const expired =
        allVipBuyers.filter(item => {

            const endDate =
                numberValue(item.endDate);

            return (
                normalizeStatus(item.status) ===
                "expired" ||
                (endDate && endDate <= now)
            );

        });


    if ($("vipBuyerTotalCount")) {
        $("vipBuyerTotalCount").textContent =
            allVipBuyers.length;
    }

    if ($("vipBuyerActiveCount")) {
        $("vipBuyerActiveCount").textContent =
            active.length;
    }

    if ($("vipBuyerExpiredCount")) {
        $("vipBuyerExpiredCount").textContent =
            expired.length;
    }


    if (!allVipBuyers.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML =
        allVipBuyers.map(item => {

            const user =
                getUser(item.uid);

            const status =
                normalizeStatus(item.status);

            return `
                <div class="request-card">

                    <div class="request-header">

                        <h3>

                            <i class="fa-solid fa-crown"></i>

                            ${safeText(
                                item.vipName ||
                                item.planName ||
                                "VIP"
                            )}

                        </h3>

                        <span class="status ${status}">
                            ${safeText(status)}
                        </span>

                    </div>

                    <p>
                        <strong>User:</strong>
                        ${safeText(
                            user?.fullName ||
                            user?.email ||
                            item.uid ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Price:</strong>
                        ${money(item.price)}
                    </p>

                    <p>
                        <strong>Daily Income:</strong>
                        ${money(item.dailyIncome)}
                    </p>

                    <p>
                        <strong>Total Profit:</strong>
                        ${money(item.totalProfit)}
                    </p>

                    <p>
                        <strong>Purchased:</strong>
                        ${formatDate(
                            item.purchasedAt ||
                            item.createdAt
                        )}
                    </p>

                    <p>
                        <strong>End:</strong>
                        ${formatDate(item.endDate)}
                    </p>

                </div>
            `;

        }).join("");
}


/* =========================================================
   BONUS REQUESTS
========================================================= */

function renderBonusRequests() {

    const list = $("bonusRequestList");
    const empty = $("emptyBonusRequest");

    if (!list) return;


    if (!allBonusRequests.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML =
        allBonusRequests.map(item => {

            const user =
                getUser(item.uid);

            const status =
                normalizeStatus(item.status);

            return `
                <div class="request-card">

                    <div class="request-header">

                        <h3>
                            <i class="fa-solid fa-gift"></i>

                            Bonus Request
                        </h3>

                        <span class="status ${status}">
                            ${safeText(status)}
                        </span>

                    </div>

                    <p>
                        <strong>User:</strong>
                        ${safeText(
                            user?.fullName ||
                            user?.email ||
                            item.uid ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Amount:</strong>
                        ${money(item.amount)}
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${formatDate(item.createdAt)}
                    </p>

                </div>
            `;

        }).join("");
}


/* =========================================================
   USERS
========================================================= */

function renderUsers() {

    const list = $("usersList");
    const empty = $("emptyUsers");

    if (!list) return;


    const search =
        ($("userSearch")?.value || "")
        .toLowerCase()
        .trim();


    const users =
        allUsers.filter(user => {

            const text = `
                ${user.fullName || ""}
                ${user.email || ""}
                ${user.phone || ""}
                ${user.uid || ""}
                ${user.referralCode || ""}
            `.toLowerCase();

            return (
                !search ||
                text.includes(search)
            );

        });


    if (!users.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML =
        users.map(user => {

            return `
                <div class="user-card">

                    <div class="request-header">

                        <h3>
                            ${safeText(
                                user.fullName ||
                                "User"
                            )}
                        </h3>

                        <span>
                            ${safeText(
                                user.vip ||
                                "VIP 0"
                            )}
                        </span>

                    </div>

                    <p>
                        <strong>Email:</strong>
                        ${safeText(
                            user.email || "-"
                        )}
                    </p>

                    <p>
                        <strong>Phone:</strong>
                        ${safeText(
                            user.phone || "-"
                        )}
                    </p>

                    <p>
                        <strong>Balance:</strong>
                        ${money(user.balance)}
                    </p>

                    <p>
                        <strong>Referral Code:</strong>
                        ${safeText(
                            user.referralCode || "-"
                        )}
                    </p>

                    <p>
                        <strong>Referral Count:</strong>
                        ${numberValue(
                            user.referralCount
                        )}
                    </p>

                </div>
            `;

        }).join("");
}


/* =========================================================
   TRANSACTIONS
========================================================= */

function renderTransactions() {

    const list = $("transactionList");
    const empty = $("emptyTransaction");

    if (!list) return;


    const search =
        ($("transactionSearch")?.value || "")
        .toLowerCase()
        .trim();

    const filter =
        $("transactionFilter")?.value ||
        "all";


    const items =
        allTransactions.filter(item => {

            const user =
                getUser(item.uid);

            const text = `
                ${item.id}
                ${item.type || ""}
                ${item.status || ""}
                ${item.transactionId || ""}
                ${user?.fullName || ""}
                ${user?.email || ""}
                ${user?.phone || ""}
            `.toLowerCase();


            const type =
                String(item.type || "")
                .toLowerCase();

            const status =
                normalizeStatus(item.status);


            let filterMatch = true;


            if (
                [
                    "deposit",
                    "withdraw",
                    "vip",
                    "profit",
                    "bonus",
                    "referral"
                ].includes(filter)
            ) {
                filterMatch =
                    type === filter;
            }


            if (
                [
                    "approved",
                    "pending",
                    "rejected",
                    "processing"
                ].includes(filter)
            ) {
                filterMatch =
                    status === filter;
            }


            return (
                (!search ||
                    text.includes(search)) &&
                filterMatch
            );

        });


    if (!items.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    list.innerHTML =
        items.map(item => {

            const user =
                getUser(item.uid);

            const status =
                normalizeStatus(item.status);

            return `
                <div class="request-card">

                    <div class="request-header">

                        <h3>
                            ${safeText(
                                item.type ||
                                "Transaction"
                            )}
                        </h3>

                        <span class="status ${status}">
                            ${safeText(status)}
                        </span>

                    </div>

                    <p>
                        <strong>User:</strong>
                        ${safeText(
                            user?.fullName ||
                            user?.email ||
                            item.uid ||
                            "-"
                        )}
                    </p>

                    <p>
                        <strong>Amount:</strong>
                        ${money(item.amount)}
                    </p>

                    <p>
                        <strong>Currency:</strong>
                        RWF
                    </p>

                    <p>
                        <strong>Date:</strong>
                        ${formatDate(item.createdAt)}
                    </p>

                </div>
            `;

        }).join("");
}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function initializeQuickActions() {

    const actions = {

        refreshDashboard:
            () => {
                refreshAll();
                openPage("dashboard");
            },

        openDeposits:
            () => openPage("deposits"),

        openWithdraws:
            () => openPage("withdraws"),

        openUsers:
            () => openPage("users"),

        openTransactions:
            () => openPage("transactions"),

        openSettings:
            () => openPage("settings"),

        openVipRequests:
            () => openPage("vipRequests"),

        refreshDashboardQuick:
            () => {
                refreshAll();
                openPage("dashboard");
            },

        openUsersBtn:
            () => openPage("users"),

        openTransactionsBtn:
            () => openPage("transactions"),

        openSettingsBtn:
            () => openPage("settings")
    };


    Object.entries(actions)
        .forEach(([id, action]) => {

            const button = $(id);

            if (button) {
                button.addEventListener(
                    "click",
                    action
                );
            }

        });


    const approveAllDeposits =
        $("approveAllDeposits");

    if (approveAllDeposits) {

        approveAllDeposits.addEventListener(
            "click",
            approveAllPendingDeposits
        );
    }


    const approveAllWithdraws =
        $("approveAllWithdraws");

    if (approveAllWithdraws) {

        approveAllWithdraws.addEventListener(
            "click",
            approveAllPendingWithdraws
        );
    }
}


/* =========================================================
   APPROVE ALL PENDING DEPOSITS
========================================================= */

async function approveAllPendingDeposits() {

    const pending =
        allDeposits.filter(
            item =>
                normalizeStatus(item.status) ===
                "pending"
        );


    if (!pending.length) {

        showToast(
            "There are no pending deposits.",
            "info"
        );

        return;
    }


    const confirmed =
        confirm(
            `Approve ${pending.length} pending deposit(s)?`
        );

    if (!confirmed) return;


    for (const item of pending) {

        try {

            await approveDeposit(item.id);

        } catch (error) {

            console.error(
                "Approve all deposit error:",
                error
            );
        }
    }


    showToast(
        "Pending deposits processed.",
        "success"
    );
}


/* =========================================================
   APPROVE ALL PENDING WITHDRAWS
========================================================= */

async function approveAllPendingWithdraws() {

    const pending =
        allWithdraws.filter(
            item =>
                normalizeStatus(item.status) ===
                "pending"
        );


    if (!pending.length) {

        showToast(
            "There are no pending withdraws.",
            "info"
        );

        return;
    }


    const confirmed =
        confirm(
            `Approve ${pending.length} pending withdraw(s)?`
        );

    if (!confirmed) return;


    for (const item of pending) {

        try {

            await approveWithdraw(item.id);

        } catch (error) {

            console.error(
                "Approve all withdraw error:",
                error
            );
        }
    }


    showToast(
        "Pending withdraws processed.",
        "success"
    );
}


/* =========================================================
   SETTINGS
========================================================= */

function initializeSettings() {

    const save =
        $("saveSettings");

    if (!save) return;


    save.addEventListener(
        "click",
        async () => {

            try {

                const name =
                    $("adminNameInput")?.value
                    ?.trim();

                if (!name) {
                    showToast(
                        "Enter admin name.",
                        "error"
                    );
                    return;
                }


                await update(
                    ref(
                        db,
                        `admins/${currentAdmin.uid}`
                    ),
                    {
                        name
                    }
                );


                adminData = {
                    ...(adminData || {}),
                    name
                };


                showAdminPanel();


                showToast(
                    "Settings saved.",
                    "success"
                );

            } catch (error) {

                console.error(error);

                showToast(
                    `Settings failed: ${error.message}`,
                    "error"
                );
            }

        }
    );
}


/* =========================================================
   SEARCH / FILTER EVENTS
========================================================= */

function initializeFilters() {

    [
        "depositSearch",
        "depositFilter",
        "withdrawSearch",
        "withdrawFilter",
        "userSearch",
        "transactionSearch",
        "transactionFilter"
    ]
    .forEach(id => {

        const element = $(id);

        if (!element) return;

        element.addEventListener(
            "input",
            () => {

                if (
                    id.includes("deposit")
                ) {
                    renderDeposits();
                }

                if (
                    id.includes("withdraw")
                ) {
                    renderWithdraws();
                }

                if (
                    id === "userSearch"
                ) {
                    renderUsers();
                }

                if (
                    id.includes("transaction")
                ) {
                    renderTransactions();
                }
            }
        );

        element.addEventListener(
            "change",
            () => {

                if (
                    id.includes("deposit")
                ) {
                    renderDeposits();
                }

                if (
                    id.includes("withdraw")
                ) {
                    renderWithdraws();
                }

                if (
                    id.includes("transaction")
                ) {
                    renderTransactions();
                }
            }
        );

    });
}


/* =========================================================
   WITHDRAW MODAL EVENTS
========================================================= */

function initializeWithdrawModal() {

    const close =
        $("closeWithdrawModal");

    if (close) {

        close.addEventListener(
            "click",
            closeWithdrawModal
        );
    }


    const approve =
        $("modalApproveWithdraw");

    if (approve) {

        approve.addEventListener(
            "click",
            async () => {

                if (!selectedWithdrawId) return;

                await approveWithdraw(
                    selectedWithdrawId
                );

            }
        );
    }


    const reject =
        $("modalRejectWithdraw");

    if (reject) {

        reject.addEventListener(
            "click",
            async () => {

                if (!selectedWithdrawId) return;

                await rejectWithdraw(
                    selectedWithdrawId
                );

            }
        );
    }
}


function closeWithdrawModal() {

    const modal =
        $("withdrawModal");

    if (modal) {
        modal.style.display = "none";
    }

    selectedWithdrawId = null;
}


/* =========================================================
   REFRESH
========================================================= */

async function refreshAll() {

    try {

        renderDashboard();
        renderDeposits();
        renderWithdraws();
        renderVipRequests();
        renderVipBuyers();
        renderBonusRequests();
        renderUsers();
        renderTransactions();

        showToast(
            "Admin data refreshed.",
            "success"
        );

    } catch (error) {

        console.error(error);

        showToast(
            "Refresh failed.",
            "error"
        );
    }
}


/* =========================================================
   AUTH INITIALIZATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        try {

            await authReady;


            if (!user) {

                window.location.href =
                    "login.html";

                return;
            }


            await verifyAdmin(user);


            showAdminPanel();


            initializeNavigation();

            initializeQuickActions();

            initializeSettings();

            initializeFilters();

            initializeWithdrawModal();


            startDatabaseListeners();


            const hash =
                window.location.hash
                .replace("#", "");


            if (
                hash &&
                pageNames[hash]
            ) {
                openPage(hash);
            } else {
                openPage("dashboard");
            }


            console.log(
                "Money Vault Admin Panel ready."
            );


        } catch (error) {

            console.error(
                "ADMIN INITIALIZATION ERROR:",
                error
            );


            const loading =
                $("loadingScreen");

            if (loading) {

                loading.innerHTML = `
                    <div style="padding:30px;text-align:center;">

                        <h2>
                            Admin Access Error
                        </h2>

                        <p>
                            ${safeText(error.message)}
                        </p>

                        <button
                            onclick="location.href='login.html'">

                            Return to Login

                        </button>

                    </div>
                `;
            }
        }

    }
);


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openPage =
    openPage;

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;

window.openWithdrawDetails =
    openWithdrawDetails;

window.closeWithdrawModal =
    closeWithdrawModal;

window.refreshAll =
    refreshAll;
