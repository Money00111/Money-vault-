/* =========================================================
   MONEY VAULT - ADMIN.JS
   COMPLETE ADMIN PANEL
   =========================================================

   CURRENCY:
   RWF / FRW

   ADMIN SECURITY:
   admins/{uid}

   FEATURES:
   - Firebase Authentication
   - Admin verification
   - Dashboard
   - Deposits
   - Withdraws
   - VIP Requests
   - VIP Buyers
   - Bonus Requests
   - Users
   - Transactions
   - Quick Actions
   - Settings
   - Search / Filters
   - Mobile Sidebar
   - Toast Notifications

   IMPORTANT:
   Request statuses are always:
       pending
       approved
       rejected

   No hard-coded admin email.
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    auth,
    db,
    authReady
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
    push,
    onValue,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentAdmin = null;
let adminData = null;

let allDeposits = {};
let allWithdraws = {};
let allVipRequests = {};
let allVipBuyers = {};
let allBonusRequests = {};
let allUsers = {};
let allTransactions = {};

let selectedWithdrawId = null;

let dashboardListenersStarted = false;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   MAIN ELEMENTS
========================================================= */

const loadingScreen = $("loadingScreen");
const sidebar = $("sidebar");
const menuBtn = $("menuBtn");
const logoutBtn = $("logoutBtn");

const adminNameEl = $("adminName");
const adminEmailEl = $("adminEmail");

const pageTitle = $("pageTitle");
const contentArea = $("contentArea");


/* =========================================================
   TOAST
========================================================= */

function showToast(message, type = "success") {

    const container = $("toastContainer");

    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    let icon = "fa-circle-check";

    if (type === "error") {
        icon = "fa-circle-xmark";
    }

    if (type === "warning") {
        icon = "fa-triangle-exclamation";
    }

    if (type === "info") {
        icon = "fa-circle-info";
    }

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("show");
    }, 10);

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 3500);
}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    if (!status) {
        return "pending";
    }

    const value =
        String(status).trim().toLowerCase();

    if (
        value === "approved" ||
        value === "approve" ||
        value === "accepted" ||
        value === "success" ||
        value === "successful"
    ) {
        return "approved";
    }

    if (
        value === "rejected" ||
        value === "reject" ||
        value === "declined" ||
        value === "cancelled" ||
        value === "canceled"
    ) {
        return "rejected";
    }

    return "pending";
}


/* =========================================================
   FORMAT MONEY
========================================================= */

function formatMoney(value) {

    const amount = Number(value || 0);

    return amount.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    ) + " RWF";
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date = new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString(
        "en-GB",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   GET REQUEST NAME
========================================================= */

function getUserName(data) {

    return (
        data?.fullName ||
        data?.name ||
        data?.userName ||
        "Unknown User"
    );
}


/* =========================================================
   GET REQUEST EMAIL
========================================================= */

function getEmail(data) {

    return (
        data?.email ||
        data?.userEmail ||
        "-"
    );
}


/* =========================================================
   GET AMOUNT
========================================================= */

function getAmount(data) {

    return Number(
        data?.amount ??
        data?.price ??
        data?.value ??
        0
    );
}


/* =========================================================
   AUTH WAIT
========================================================= */

async function waitForAuthPersistence() {

    try {

        if (authReady) {
            await authReady;
        }

    } catch (error) {

        console.warn(
            "Auth persistence warning:",
            error
        );

    }
}


/* =========================================================
   ADMIN VERIFICATION
========================================================= */

async function verifyAdmin(user) {

    if (!user) {
        return false;
    }

    try {

        const adminRef =
            ref(db, `admins/${user.uid}`);

        const snapshot =
            await get(adminRef);

        if (!snapshot.exists()) {
            return false;
        }

        adminData =
            snapshot.val();

        return true;

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        return false;
    }
}


/* =========================================================
   AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async (user) => {

    try {

        await waitForAuthPersistence();

        if (!user) {

            window.location.href =
                "login.html";

            return;
        }

        const isAdmin =
            await verifyAdmin(user);

        if (!isAdmin) {

            showToast(
                "Access denied. You are not an administrator.",
                "error"
            );

            await signOut(auth);

            setTimeout(() => {
                window.location.href =
                    "dashboard.html";
            }, 800);

            return;
        }

        currentAdmin = user;

        loadAdminInformation();

        hideLoadingScreen();

        initializeAdminPanel();

        console.log(
            "✅ Money Vault Admin authenticated"
        );

    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        showToast(
            error.message ||
            "Failed to load admin panel.",
            "error"
        );

        hideLoadingScreen();
    }

});


/* =========================================================
   ADMIN INFORMATION
========================================================= */

function loadAdminInformation() {

    const name =
        adminData?.name ||
        adminData?.fullName ||
        currentAdmin?.displayName ||
        "Administrator";

    const email =
        currentAdmin?.email ||
        adminData?.email ||
        "-";

    if (adminNameEl) {
        adminNameEl.textContent =
            name;
    }

    if (adminEmailEl) {
        adminEmailEl.textContent =
            email;
    }

    const adminNameInput =
        $("adminNameInput");

    const adminEmailInput =
        $("adminEmailInput");

    if (adminNameInput) {
        adminNameInput.value =
            name;
    }

    if (adminEmailInput) {
        adminEmailInput.value =
            email;
    }
}


/* =========================================================
   HIDE LOADING
========================================================= */

function hideLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.style.opacity = "0";

    setTimeout(() => {

        loadingScreen.style.display =
            "none";

    }, 300);
}


/* =========================================================
   INITIALIZE ADMIN PANEL
========================================================= */

function initializeAdminPanel() {

    if (dashboardListenersStarted) {
        return;
    }

    dashboardListenersStarted = true;

    initializeNavigation();
    initializeQuickActions();
    initializeSearchFilters();
    initializeSettings();

    loadUsers();
    loadDeposits();
    loadWithdraws();
    loadVipRequests();
    loadVipBuyers();
    loadBonusRequests();
    loadTransactions();

    loadDashboardData();

    console.log(
        "✅ Money Vault Admin Panel initialized"
    );
}


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

function initializeNavigation() {

    document
        .querySelectorAll(".menu-link")
        .forEach((link) => {

            link.addEventListener(
                "click",
                (event) => {

                    event.preventDefault();

                    const page =
                        link.dataset.page;

                    if (!page) {
                        return;
                    }

                    openPage(page);

                    sidebar?.classList.remove(
                        "active"
                    );
                }
            );

        });


    menuBtn?.addEventListener(
        "click",
        () => {

            sidebar?.classList.toggle(
                "active"
            );

        }
    );


    logoutBtn?.addEventListener(
        "click",
        handleLogout
    );
}


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(page) {

    document
        .querySelectorAll(".page-section")
        .forEach((section) => {

            section.classList.remove(
                "active"
            );

        });


    document
        .querySelectorAll(".menu-link")
        .forEach((link) => {

            link.classList.remove(
                "active"
            );

        });


    const section =
        $(`${page}Section`);

    if (section) {

        section.classList.add(
            "active"
        );

    }


    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${page}"]`
        );

    if (activeLink) {

        activeLink.classList.add(
            "active"
        );

    }


    const titles = {

        dashboard:
            "Dashboard",

        deposits:
            "Deposits",

        withdraws:
            "Withdraws",

        vipRequests:
            "VIP Requests",

        vipBuyers:
            "VIP Buyers",

        bonusRequests:
            "Bonus Requests",

        users:
            "Users",

        transactions:
            "Transactions",

        quickActions:
            "Quick Actions",

        settings:
            "Settings"

    };


    if (pageTitle) {

        pageTitle.textContent =
            titles[page] ||
            "Dashboard";

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout(event) {

    event?.preventDefault();

    const confirmLogout =
        confirm(
            "Logout from Money Vault Admin Panel?"
        );

    if (!confirmLogout) {
        return;
    }

    try {

        await signOut(auth);

        window.location.href =
            "login.html";

    } catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Logout failed.",
            "error"
        );

    }
}


/* =========================================================
   DASHBOARD DATA
========================================================= */

function loadDashboardData() {

    /* USERS */

    onValue(
        ref(db, "users"),
        (snapshot) => {

            allUsers = {};

            let total = 0;
            let balance = 0;

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const user =
                        child.val() || {};

                    allUsers[child.key] =
                        user;

                    total++;

                    balance +=
                        Number(
                            user.balance || 0
                        );

                });

            }

            const totalUsersEl =
                $("totalUsers");

            const systemBalanceEl =
                $("systemBalance");

            if (totalUsersEl) {

                totalUsersEl.textContent =
                    total.toLocaleString();

            }

            if (systemBalanceEl) {

                systemBalanceEl.textContent =
                    formatMoney(balance);

            }

            renderUsers();

        },
        (error) => {

            console.error(
                "Users listener:",
                error
            );

        }
    );


    /* DEPOSITS */

    onValue(
        ref(db, "depositRequests"),
        (snapshot) => {

            calculateDepositDashboard(
                snapshot
            );

        }
    );


    /* WITHDRAWS */

    onValue(
        ref(db, "withdrawRequests"),
        (snapshot) => {

            calculateWithdrawDashboard(
                snapshot
            );

        }
    );

}


/* =========================================================
   DEPOSIT DASHBOARD
========================================================= */

function calculateDepositDashboard(snapshot) {

    let total = 0;
    let pending = 0;
    let approved = 0;
    let amount = 0;

    if (snapshot.exists()) {

        snapshot.forEach((child) => {

            const data =
                child.val() || {};

            const status =
                normalizeStatus(
                    data.status
                );

            total++;

            amount +=
                getAmount(data);

            if (status === "pending") {
                pending++;
            }

            if (status === "approved") {
                approved++;
            }

        });

    }

    const totalEl =
        $("dashboardTotalDeposits");

    const pendingEl =
        $("dashboardPendingDeposits");

    const approvedEl =
        $("dashboardApprovedDeposits");

    if (totalEl) {
        totalEl.textContent =
            total.toLocaleString();
    }

    if (pendingEl) {
        pendingEl.textContent =
            pending.toLocaleString();
    }

    if (approvedEl) {
        approvedEl.textContent =
            approved.toLocaleString();
    }

}


/* =========================================================
   WITHDRAW DASHBOARD
========================================================= */

function calculateWithdrawDashboard(snapshot) {

    let total = 0;

    if (snapshot.exists()) {

        snapshot.forEach(() => {
            total++;
        });

    }

    const totalEl =
        $("dashboardTotalWithdraws");

    if (totalEl) {

        totalEl.textContent =
            total.toLocaleString();

    }

}


/* =========================================================
   DEPOSITS
========================================================= */

function loadDeposits() {

    onValue(
        ref(db, "depositRequests"),
        (snapshot) => {

            allDeposits = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allDeposits[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderDeposits();

        },
        (error) => {

            console.error(
                "Deposit listener:",
                error
            );

            showToast(
                "Unable to load deposits.",
                "error"
            );

        }
    );

}


/* =========================================================
   RENDER DEPOSITS
========================================================= */

function renderDeposits() {

    const list =
        $("depositList");

    const empty =
        $("emptyDeposit");

    if (!list) {
        return;
    }

    const search =
        (
            $("depositSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();

    const filter =
        $("depositFilter")?.value ||
        "all";


    const deposits =
        Object.values(allDeposits)
            .filter((data) => {

                const status =
                    normalizeStatus(
                        data.status
                    );

                if (
                    filter !== "all" &&
                    status !== filter
                ) {
                    return false;
                }

                if (!search) {
                    return true;
                }

                const text =
                    [
                        getUserName(data),
                        getEmail(data),
                        data.transactionId,
                        data.senderPhone,
                        data.paymentMethod
                    ]
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);

            })
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    updateDepositSummary();


    if (deposits.length === 0) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    list.innerHTML =
        deposits.map(renderDepositCard)
        .join("");


    activateDepositButtons();
}


/* =========================================================
   DEPOSIT CARD
========================================================= */

function renderDepositCard(data) {

    const status =
        normalizeStatus(data.status);

    const amount =
        getAmount(data);

    const statusClass =
        status;

    let buttons = "";

    if (status === "pending") {

        buttons = `
            <div class="action-buttons">

                <button
                    class="approveBtn"
                    data-id="${escapeHtml(data.id)}">

                    <i class="fa-solid fa-circle-check"></i>
                    Approve

                </button>

                <button
                    class="rejectBtn"
                    data-id="${escapeHtml(data.id)}">

                    <i class="fa-solid fa-circle-xmark"></i>
                    Reject

                </button>

            </div>
        `;

    }


    return `
        <div class="request-card">

            <div class="request-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            getUserName(data)
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            getEmail(data)
                        )}
                    </p>

                </div>

                <span class="status ${statusClass}">
                    ${escapeHtml(
                        status.toUpperCase()
                    )}
                </span>

            </div>


            <div class="request-details">

                <p>
                    <strong>Amount:</strong>
                    ${formatMoney(amount)}
                </p>

                <p>
                    <strong>Payment Method:</strong>
                    ${escapeHtml(
                        data.paymentMethod ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Sender Phone:</strong>
                    ${escapeHtml(
                        data.senderPhone ||
                        data.phone ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Transaction ID:</strong>
                    ${escapeHtml(
                        data.transactionId ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Payment Date:</strong>
                    ${escapeHtml(
                        data.paymentDate ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Request Date:</strong>
                    ${formatDate(
                        data.createdAt
                    )}
                </p>

            </div>


            ${data.note ? `
                <div class="request-note">

                    <strong>Note:</strong>

                    <p>
                        ${escapeHtml(
                            data.note
                        )}
                    </p>

                </div>
            ` : ""}


            ${buttons}

        </div>
    `;
}


/* =========================================================
   DEPOSIT SUMMARY
========================================================= */

function updateDepositSummary() {

    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    Object.values(allDeposits)
        .forEach((data) => {

            const status =
                normalizeStatus(
                    data.status
                );

            total++;

            if (status === "pending") {
                pending++;
            }

            if (status === "approved") {
                approved++;
            }

            if (status === "rejected") {
                rejected++;
            }

        });


    if ($("depositTotalCount")) {
        $("depositTotalCount").textContent =
            total;
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

}


/* =========================================================
   DEPOSIT BUTTONS
========================================================= */

function activateDepositButtons() {

    document
        .querySelectorAll(".approveBtn")
        .forEach((button) => {

            button.onclick = () => {

                approveDeposit(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(".rejectBtn")
        .forEach((button) => {

            button.onclick = () => {

                rejectDeposit(
                    button.dataset.id
                );

            };

        });

}


/* =========================================================
   APPROVE DEPOSIT
========================================================= */

async function approveDeposit(id) {

    if (!currentAdmin) {
        showToast(
            "Admin session not ready.",
            "error"
        );
        return;
    }

    const confirmed =
        confirm(
            "Approve this deposit and add the amount to the user's balance?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `depositRequests/${id}`
            );

        const requestSnapshot =
            await get(requestRef);

        if (!requestSnapshot.exists()) {

            showToast(
                "Deposit request not found.",
                "error"
            );

            return;
        }


        const request =
            requestSnapshot.val() || {};

        const status =
            normalizeStatus(
                request.status
            );


        if (status === "approved") {

            showToast(
                "This deposit is already approved.",
                "warning"
            );

            return;
        }


        if (status === "rejected") {

            showToast(
                "A rejected deposit cannot be approved.",
                "warning"
            );

            return;
        }


        const uid =
            request.uid;

        if (!uid) {

            showToast(
                "Deposit has no user UID.",
                "error"
            );

            return;
        }


        const amount =
            Number(request.amount || 0);


        if (!Number.isFinite(amount) ||
            amount <= 0) {

            showToast(
                "Invalid deposit amount.",
                "error"
            );

            return;
        }


        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        /* -----------------------------------------
           FIRST:
           Update user balance safely with transaction
        ----------------------------------------- */

        const transactionResult =
            await runTransaction(
                userRef,
                (currentData) => {

                    if (!currentData) {
                        return currentData;
                    }

                    const alreadyProcessed =
                        currentData.lastApprovedDepositId;

                    if (
                        alreadyProcessed === id
                    ) {
                        return;
                    }

                    const currentBalance =
                        Number(
                            currentData.balance || 0
                        );

                    const currentDeposits =
                        Number(
                            currentData.totalDeposit ||
                            currentData.totalDeposits ||
                            0
                        );

                    const currentTransactions =
                        Number(
                            currentData.totalTransactions ||
                            0
                        );

                    return {
                        ...currentData,

                        balance:
                            currentBalance +
                            amount,

                        totalDeposit:
                            currentDeposits +
                            amount,

                        totalTransactions:
                            currentTransactions +
                            1,

                        lastApprovedDepositId:
                            id,

                        lastDepositApprovedAt:
                            Date.now()
                    };

                }
            );


        if (!transactionResult.committed) {

            showToast(
                "User balance could not be updated.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           SECOND:
           Mark request APPROVED
        ----------------------------------------- */

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid,

                approvedByEmail:
                    currentAdmin.email || "",

                processed:
                    true

            }
        );


        /* -----------------------------------------
           TRANSACTION RECORD
        ----------------------------------------- */

        const transactionKey =
            push(
                ref(db, "transactions")
            ).key;


        if (transactionKey) {

            await set(
                ref(
                    db,
                    `transactions/${transactionKey}`
                ),
                {

                    uid:
                        uid,

                    email:
                        request.email || "",

                    type:
                        "deposit",

                    category:
                        "deposit",

                    amount:
                        amount,

                    currency:
                        "RWF",

                    status:
                        "approved",

                    requestId:
                        id,

                    description:
                        "Deposit approved by admin",

                    createdAt:
                        Date.now(),

                    adminUid:
                        currentAdmin.uid

                }
            );

        }


        /* -----------------------------------------
           NOTIFICATION
        ----------------------------------------- */

        const notificationKey =
            push(
                ref(
                    db,
                    `notifications/${uid}`
                )
            ).key;


        if (notificationKey) {

            await set(
                ref(
                    db,
                    `notifications/${uid}/${notificationKey}`
                ),
                {

                    type:
                        "deposit",

                    title:
                        "Deposit Approved",

                    message:
                        `${formatMoney(amount)} has been added to your balance.`,

                    amount:
                        amount,

                    read:
                        false,

                    createdAt:
                        Date.now()

                }
            );

        }


        showToast(
            "Deposit approved successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );

        showToast(
            error.message ||
            "Failed to approve deposit.",
            "error"
        );

    }

}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    if (!currentAdmin) {
        return;
    }


    const confirmed =
        confirm(
            "Reject this deposit request?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `depositRequests/${id}`
            );

        const snapshot =
            await get(requestRef);

        if (!snapshot.exists()) {

            showToast(
                "Deposit request not found.",
                "error"
            );

            return;
        }


        const data =
            snapshot.val() || {};

        const status =
            normalizeStatus(
                data.status
            );


        if (status === "approved") {

            showToast(
                "Approved deposit cannot be rejected.",
                "warning"
            );

            return;
        }


        if (status === "rejected") {

            showToast(
                "This deposit is already rejected.",
                "warning"
            );

            return;
        }


        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid,

                rejectedByEmail:
                    currentAdmin.email || ""

            }
        );


        showToast(
            "Deposit rejected.",
            "success"
        );


    } catch (error) {

        console.error(
            "Reject deposit:",
            error
        );

        showToast(
            error.message ||
            "Failed to reject deposit.",
            "error"
        );

    }

}


/* =========================================================
   WITHDRAWS
========================================================= */

function loadWithdraws() {

    onValue(
        ref(db, "withdrawRequests"),
        (snapshot) => {

            allWithdraws = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allWithdraws[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderWithdraws();

        },
        (error) => {

            console.error(
                "Withdraw listener:",
                error
            );

            showToast(
                "Unable to load withdraws.",
                "error"
            );

        }
    );

}


/* =========================================================
   RENDER WITHDRAWS
========================================================= */

function renderWithdraws() {

    const list =
        $("withdrawList");

    const empty =
        $("emptyWithdraw");

    if (!list) {
        return;
    }


    const search =
        (
            $("withdrawSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();

    const filter =
        $("withdrawFilter")?.value ||
        "all";


    const requests =
        Object.values(allWithdraws)
            .filter((data) => {

                const status =
                    normalizeStatus(
                        data.status
                    );

                if (
                    filter !== "all" &&
                    status !== filter
                ) {
                    return false;
                }

                if (!search) {
                    return true;
                }

                const text =
                    [
                        getUserName(data),
                        getEmail(data),
                        data.transactionId,
                        data.phone,
                        data.accountName,
                        data.paymentMethod
                    ]
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);

            })
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    updateWithdrawSummary();


    if (requests.length === 0) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    list.innerHTML =
        requests
            .map(renderWithdrawCard)
            .join("");


    activateWithdrawButtons();
}


/* =========================================================
   WITHDRAW CARD
========================================================= */

function renderWithdrawCard(data) {

    const status =
        normalizeStatus(data.status);

    const amount =
        Number(data.amount || 0);

    const receive =
        Number(
            data.receive ??
            (
                amount -
                Number(data.fee || 0)
            )
        );


    const buttons =
        status === "pending"
            ? `
                <div class="action-buttons">

                    <button
                        class="approveWithdrawBtn"
                        data-id="${escapeHtml(data.id)}">

                        <i class="fa-solid fa-circle-check"></i>
                        Approve

                    </button>

                    <button
                        class="viewWithdrawBtn"
                        data-id="${escapeHtml(data.id)}">

                        <i class="fa-solid fa-eye"></i>
                        View

                    </button>

                    <button
                        class="rejectWithdrawBtn"
                        data-id="${escapeHtml(data.id)}">

                        <i class="fa-solid fa-circle-xmark"></i>
                        Reject

                    </button>

                </div>
            `
            : `
                <div class="action-buttons">

                    <button
                        class="viewWithdrawBtn"
                        data-id="${escapeHtml(data.id)}">

                        <i class="fa-solid fa-eye"></i>
                        View

                    </button>

                </div>
            `;


    return `
        <div class="request-card">

            <div class="request-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            getUserName(data)
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            getEmail(data)
                        )}
                    </p>

                </div>

                <span class="status ${status}">
                    ${escapeHtml(
                        status.toUpperCase()
                    )}
                </span>

            </div>


            <div class="request-details">

                <p>
                    <strong>Amount:</strong>
                    ${formatMoney(amount)}
                </p>

                <p>
                    <strong>Fee:</strong>
                    ${formatMoney(
                        data.fee || 0
                    )}
                </p>

                <p>
                    <strong>Receive:</strong>
                    ${formatMoney(receive)}
                </p>

                <p>
                    <strong>Payment Method:</strong>
                    ${escapeHtml(
                        data.paymentMethod ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Phone:</strong>
                    ${escapeHtml(
                        data.phone ||
                        data.receiverPhone ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Account Name:</strong>
                    ${escapeHtml(
                        data.accountName ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Request Date:</strong>
                    ${formatDate(
                        data.createdAt
                    )}
                </p>

            </div>


            ${buttons}

        </div>
    `;
}


/* =========================================================
   WITHDRAW SUMMARY
========================================================= */

function updateWithdrawSummary() {

    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;


    Object.values(allWithdraws)
        .forEach((data) => {

            const status =
                normalizeStatus(
                    data.status
                );

            total++;

            if (status === "pending") {
                pending++;
            }

            if (status === "approved") {
                approved++;
            }

            if (status === "rejected") {
                rejected++;
            }

        });


    if ($("withdrawTotalCount")) {
        $("withdrawTotalCount").textContent =
            total;
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

}


/* =========================================================
   WITHDRAW BUTTONS
========================================================= */

function activateWithdrawButtons() {

    document
        .querySelectorAll(".approveWithdrawBtn")
        .forEach((button) => {

            button.onclick = () => {

                approveWithdraw(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(".rejectWithdrawBtn")
        .forEach((button) => {

            button.onclick = () => {

                rejectWithdraw(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(".viewWithdrawBtn")
        .forEach((button) => {

            button.onclick = () => {

                openWithdrawModal(
                    button.dataset.id
                );

            };

        });

}


/* =========================================================
   APPROVE WITHDRAW
========================================================= */

async function approveWithdraw(id) {

    if (!currentAdmin) {
        return;
    }


    const confirmed =
        confirm(
            "Approve this withdraw request?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `withdrawRequests/${id}`
            );

        const requestSnapshot =
            await get(requestRef);


        if (!requestSnapshot.exists()) {

            showToast(
                "Withdraw request not found.",
                "error"
            );

            return;
        }


        const request =
            requestSnapshot.val() || {};

        const status =
            normalizeStatus(
                request.status
            );


        if (status === "approved") {

            showToast(
                "This withdraw is already approved.",
                "warning"
            );

            return;
        }


        if (status === "rejected") {

            showToast(
                "Rejected withdraw cannot be approved.",
                "warning"
            );

            return;
        }


        const uid =
            request.uid;

        if (!uid) {

            showToast(
                "Withdraw has no user UID.",
                "error"
            );

            return;
        }


        const amount =
            Number(request.amount || 0);


        if (!Number.isFinite(amount) ||
            amount <= 0) {

            showToast(
                "Invalid withdraw amount.",
                "error"
            );

            return;
        }


        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        const transactionResult =
            await runTransaction(
                userRef,
                (currentData) => {

                    if (!currentData) {
                        return currentData;
                    }


                    if (
                        currentData.lastApprovedWithdrawId === id
                    ) {
                        return;
                    }


                    const balance =
                        Number(
                            currentData.balance || 0
                        );


                    if (balance < amount) {

                        return;

                    }


                    const totalWithdraw =
                        Number(
                            currentData.totalWithdraw ||
                            currentData.totalWithdraws ||
                            0
                        );


                    const totalTransactions =
                        Number(
                            currentData.totalTransactions ||
                            0
                        );


                    return {

                        ...currentData,

                        balance:
                            balance - amount,

                        totalWithdraw:
                            totalWithdraw +
                            amount,

                        totalTransactions:
                            totalTransactions +
                            1,

                        lastApprovedWithdrawId:
                            id,

                        lastWithdrawApprovedAt:
                            Date.now()

                    };

                }
            );


        if (!transactionResult.committed) {

            const freshUser =
                await get(userRef);

            if (freshUser.exists()) {

                const freshData =
                    freshUser.val();

                const freshBalance =
                    Number(
                        freshData.balance || 0
                    );

                if (freshBalance < amount) {

                    showToast(
                        "Insufficient user balance.",
                        "error"
                    );

                    return;
                }

                if (
                    freshData.lastApprovedWithdrawId === id
                ) {

                    showToast(
                        "This withdraw was already processed.",
                        "warning"
                    );

                    return;
                }
            }


            showToast(
                "Could not update user balance.",
                "error"
            );

            return;
        }


        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid,

                approvedByEmail:
                    currentAdmin.email || "",

                processed:
                    true

            }
        );


        const transactionKey =
            push(
                ref(db, "transactions")
            ).key;


        if (transactionKey) {

            await set(
                ref(
                    db,
                    `transactions/${transactionKey}`
                ),
                {

                    uid:
                        uid,

                    email:
                        request.email || "",

                    type:
                        "withdraw",

                    category:
                        "withdraw",

                    amount:
                        amount,

                    currency:
                        "RWF",

                    status:
                        "approved",

                    requestId:
                        id,

                    description:
                        "Withdraw approved by admin",

                    createdAt:
                        Date.now(),

                    adminUid:
                        currentAdmin.uid

                }
            );

        }


        const notificationKey =
            push(
                ref(
                    db,
                    `notifications/${uid}`
                )
            ).key;


        if (notificationKey) {

            await set(
                ref(
                    db,
                    `notifications/${uid}/${notificationKey}`
                ),
                {

                    type:
                        "withdraw",

                    title:
                        "Withdraw Approved",

                    message:
                        `${formatMoney(amount)} withdraw has been approved.`,

                    amount:
                        amount,

                    read:
                        false,

                    createdAt:
                        Date.now()

                }
            );

        }


        showToast(
            "Withdraw approved successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Approve withdraw:",
            error
        );

        showToast(
            error.message ||
            "Failed to approve withdraw.",
            "error"
        );

    }

}


/* =========================================================
   REJECT WITHDRAW
========================================================= */

async function rejectWithdraw(id) {

    if (!currentAdmin) {
        return;
    }


    const confirmed =
        confirm(
            "Reject this withdraw request?"
        );

    if (!confirmed) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `withdrawRequests/${id}`
            );

        const snapshot =
            await get(requestRef);


        if (!snapshot.exists()) {

            showToast(
                "Withdraw request not found.",
                "error"
            );

            return;
        }


        const data =
            snapshot.val() || {};

        const status =
            normalizeStatus(
                data.status
            );


        if (status === "approved") {

            showToast(
                "Approved withdraw cannot be rejected.",
                "warning"
            );

            return;
        }


        if (status === "rejected") {

            showToast(
                "This withdraw is already rejected.",
                "warning"
            );

            return;
        }


        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid,

                rejectedByEmail:
                    currentAdmin.email || ""

            }
        );


        showToast(
            "Withdraw rejected.",
            "success"
        );


    } catch (error) {

        console.error(
            "Reject withdraw:",
            error
        );

        showToast(
            error.message ||
            "Failed to reject withdraw.",
            "error"
        );

    }

}


/* =========================================================
   WITHDRAW MODAL
========================================================= */

function openWithdrawModal(id) {

    const data =
        allWithdraws[id];

    if (!data) {
        return;
    }


    selectedWithdrawId =
        id;


    if ($("modalWithdrawName")) {
        $("modalWithdrawName").textContent =
            getUserName(data);
    }

    if ($("modalWithdrawEmail")) {
        $("modalWithdrawEmail").textContent =
            getEmail(data);
    }

    if ($("modalWithdrawAmount")) {
        $("modalWithdrawAmount").textContent =
            formatMoney(
                data.amount || 0
            );
    }

    if ($("modalWithdrawPhone")) {
        $("modalWithdrawPhone").textContent =
            data.phone ||
            data.receiverPhone ||
            "-";
    }

    if ($("modalWithdrawMethod")) {
        $("modalWithdrawMethod").textContent =
            data.paymentMethod ||
            "-";
    }

    if ($("modalWithdrawAccount")) {
        $("modalWithdrawAccount").textContent =
            data.accountNumber ||
            data.accountName ||
            "-";
    }

    if ($("modalWithdrawDate")) {
        $("modalWithdrawDate").textContent =
            formatDate(
                data.createdAt
            );
    }


    const status =
        normalizeStatus(
            data.status
        );


    if ($("modalWithdrawStatus")) {

        $("modalWithdrawStatus").textContent =
            status.toUpperCase();

        $("modalWithdrawStatus").className =
            `status ${status}`;

    }


    const modal =
        $("withdrawModal");

    if (modal) {
        modal.style.display =
            "flex";
    }

}


function closeWithdrawModal() {

    const modal =
        $("withdrawModal");

    if (modal) {
        modal.style.display =
            "none";
    }

    selectedWithdrawId =
        null;
}


$("closeWithdrawModal")
    ?.addEventListener(
        "click",
        closeWithdrawModal
    );


$("modalApproveWithdraw")
    ?.addEventListener(
        "click",
        async () => {

            if (!selectedWithdrawId) {
                return;
            }

            await approveWithdraw(
                selectedWithdrawId
            );

            closeWithdrawModal();

        }
    );


$("modalRejectWithdraw")
    ?.addEventListener(
        "click",
        async () => {

            if (!selectedWithdrawId) {
                return;
            }

            await rejectWithdraw(
                selectedWithdrawId
            );

            closeWithdrawModal();

        }
    );


/* =========================================================
   VIP REQUESTS
========================================================= */

function loadVipRequests() {

    onValue(
        ref(db, "vipPurchaseRequests"),
        (snapshot) => {

            allVipRequests = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allVipRequests[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderVipRequests();

        },
        (error) => {

            console.error(
                "VIP request listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER VIP REQUESTS
========================================================= */

function renderVipRequests() {

    const list =
        $("vipRequestList");

    const empty =
        $("emptyVipRequest");

    if (!list) {
        return;
    }


    const requests =
        Object.values(allVipRequests)
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;


    requests.forEach((data) => {

        const status =
            normalizeStatus(
                data.status
            );

        total++;

        if (status === "pending") {
            pending++;
        }

        if (status === "approved") {
            approved++;
        }

        if (status === "rejected") {
            rejected++;
        }

    });


    if ($("vipTotalCount")) {
        $("vipTotalCount").textContent =
            total;
    }

    if ($("vipPendingCount")) {
        $("vipPendingCount").textContent =
            pending;
    }

    if ($("vipApprovedCount")) {
        $("vipApprovedCount").textContent =
            approved;
    }

    if ($("vipRejectedCount")) {
        $("vipRejectedCount").textContent =
            rejected;
    }


    if (requests.length === 0) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    list.innerHTML =
        requests
            .map(renderVipRequestCard)
            .join("");


    activateVipRequestButtons();
}


/* =========================================================
   VIP REQUEST CARD
========================================================= */

function renderVipRequestCard(data) {

    const status =
        normalizeStatus(data.status);

    const price =
        Number(
            data.price ||
            data.amount ||
            0
        );


    return `
        <div class="request-card">

            <div class="request-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            getUserName(data)
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            getEmail(data)
                        )}
                    </p>

                </div>

                <span class="status ${status}">
                    ${escapeHtml(
                        status.toUpperCase()
                    )}
                </span>

            </div>


            <div class="request-details">

                <p>
                    <strong>VIP Plan:</strong>
                    ${escapeHtml(
                        data.vipName ||
                        data.planName ||
                        data.name ||
                        "VIP"
                    )}
                </p>

                <p>
                    <strong>Price:</strong>
                    ${formatMoney(price)}
                </p>

                <p>
                    <strong>Duration:</strong>
                    ${escapeHtml(
                        data.duration ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Request Date:</strong>
                    ${formatDate(
                        data.createdAt
                    )}
                </p>

            </div>


            ${
                status === "pending"
                    ? `
                        <div class="action-buttons">

                            <button
                                class="approveVipBtn"
                                data-id="${escapeHtml(data.id)}">

                                <i class="fa-solid fa-circle-check"></i>
                                Approve

                            </button>

                            <button
                                class="rejectVipBtn"
                                data-id="${escapeHtml(data.id)}">

                                <i class="fa-solid fa-circle-xmark"></i>
                                Reject

                            </button>

                        </div>
                    `
                    : ""
            }

        </div>
    `;
}


/* =========================================================
   VIP BUTTONS
========================================================= */

function activateVipRequestButtons() {

    document
        .querySelectorAll(".approveVipBtn")
        .forEach((button) => {

            button.onclick = () => {

                approveVipRequest(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(".rejectVipBtn")
        .forEach((button) => {

            button.onclick = () => {

                rejectVipRequest(
                    button.dataset.id
                );

            };

        });

}




       // ======================================
// APPROVE VIP REQUEST
// FIX: DO NOT DEDUCT BALANCE AGAIN
// ======================================

async function approveVipRequest(id) {

    if (!currentAdmin) {
        alert("Admin not logged in.");
        return;
    }

    if (!confirm("Approve this VIP request?")) {
        return;
    }

    try {

        // --------------------------------------
        // 1. GET REQUEST
        // --------------------------------------

        const requestRef =
            ref(db, "vipPurchaseRequests/" + id);

        const requestSnap =
            await get(requestRef);

        if (!requestSnap.exists()) {
            alert("VIP request not found.");
            return;
        }

        const request =
            requestSnap.val() || {};

        // Already approved
        if (
            String(request.status || "").toLowerCase()
            === "approved"
        ) {
            alert("This VIP request is already approved.");
            return;
        }

        const uid =
            request.uid ||
            request.userId ||
            request.userUID ||
            "";

        if (!uid) {
            throw new Error("Invalid user ID.");
        }

        // --------------------------------------
        // 2. VIP INFORMATION
        // --------------------------------------

        const vipName =
            request.vipName ||
            request.planName ||
            request.name ||
            "VIP Plan";

        const price =
            Number(
                request.price ??
                request.vipPrice ??
                request.amount ??
                0
            );

        const dailyIncome =
            Number(
                request.dailyIncome ??
                request.daily ??
                request.dailyProfit ??
                0
            );

        let duration =
            Number(
                request.duration ??
                request.durationDays ??
                request.days ??
                0
            );

        const totalProfit =
            Number(
                request.totalProfit ??
                request.profit ??
                request.total ??
                0
            );

        // --------------------------------------
        // 3. VALIDATION
        // --------------------------------------

        if (!Number.isFinite(price) || price <= 0) {
            throw new Error("Invalid VIP price.");
        }

        if (
            !Number.isFinite(dailyIncome) ||
            dailyIncome <= 0
        ) {
            throw new Error("Invalid daily income.");
        }

        if (!Number.isFinite(duration) || duration <= 0) {

            if (
                totalProfit > 0 &&
                dailyIncome > 0
            ) {
                duration =
                    Math.round(
                        totalProfit / dailyIncome
                    );
            }
        }

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new Error("VIP duration is invalid.");
        }

        // --------------------------------------
        // 4. GET USER
        // --------------------------------------

        const userRef =
            ref(db, "users/" + uid);

        const userSnap =
            await get(userRef);

        if (!userSnap.exists()) {
            throw new Error("User account not found.");
        }

        const user =
            userSnap.val() || {};

        // --------------------------------------
        // IMPORTANT
        // --------------------------------------
        // DO NOT CHECK BALANCE
        // DO NOT DEDUCT PRICE HERE
        //
        // Buy Now already deducted the balance.
        // --------------------------------------

        // --------------------------------------
        // 5. APPROVAL TIME
        // --------------------------------------

        const approvedAt =
            Date.now();

        const endDate =
            approvedAt +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );

        // --------------------------------------
        // 6. CREATE VIP BUYER
        // --------------------------------------

        const vipBuyerRef =
            push(ref(db, "vipBuyers"));

        const vipBuyerId =
            vipBuyerRef.key;

        // --------------------------------------
        // 7. CREATE USER VIP PLAN
        // --------------------------------------

        const userVipRef =
            push(
                ref(
                    db,
                    "users/" +
                    uid +
                    "/vipPlans"
                )
            );

        const vipPlanId =
            userVipRef.key;

        const vipData = {

            uid: uid,

            requestId: id,

            vipBuyerId: vipBuyerId,

            vipName: vipName,

            price: price,

            dailyIncome: dailyIncome,

            totalProfit:
                totalProfit > 0
                    ? totalProfit
                    : dailyIncome * duration,

            duration: duration,

            totalDays: duration,

            remainingDays: duration,

            status: "active",

            purchasedAt: approvedAt,

            approvedAt: approvedAt,

            approvedBy:
                currentAdmin.uid,

            endDate: endDate,

            // First claim ONLY after 24 hours
            lastClaim: approvedAt,

            lastClaimTime: approvedAt,

            lastProfitTime: approvedAt,

            totalEarned: 0,

            earned: 0,

            claimedAmount: 0,

            claimCount: 0
        };

        const vipBuyerData = {
            ...vipData,
            id: vipBuyerId
        };

        // --------------------------------------
        // 8. FIND REFERRER
        // --------------------------------------

        let referrer = null;

        if (typeof findReferrer === "function") {
            referrer =
                await findReferrer(user);
        }

        // --------------------------------------
        // 9. PREPARE ALL UPDATES
        // --------------------------------------

        const updates = {};

        // IMPORTANT:
        // NO USER BALANCE UPDATE HERE.
        // Balance was already deducted by Buy Now.

        // User VIP
        updates[
            "users/" +
            uid +
            "/vipPlans/" +
            vipPlanId
        ] = vipData;

        // VIP Buyers
        updates[
            "vipBuyers/" +
            vipBuyerId
        ] = vipBuyerData;

        // --------------------------------------
        // 10. VIP PURCHASE TRANSACTION
        // --------------------------------------

        const purchaseTxRef =
            push(ref(db, "transactions"));

        updates[
            "transactions/" +
            purchaseTxRef.key
        ] = {

            uid: uid,

            email:
                user.email ||
                request.email ||
                "",

            type: "vip_purchase",

            amount: price,

            vipName: vipName,

            dailyIncome: dailyIncome,

            duration: duration,

            status: "approved",

            requestId: id,

            vipBuyerId: vipBuyerId,

            approvedBy:
                currentAdmin.uid,

            createdAt: approvedAt
        };

        // --------------------------------------
        // 11. REFERRAL BONUS
        // --------------------------------------

        const REFERRAL_BONUS_AMOUNT = 1000;

        if (referrer) {

            const refUid =
                referrer.uid;

            const refData =
                referrer.data || {};

            const currentBalance =
                Number(
                    refData.balance || 0
                );

            const currentBonus =
                Number(
                    refData.referralBonus || 0
                );

            const currentEarnings =
                Number(
                    refData.referralEarnings || 0
                );

            const currentCount =
                Number(
                    refData.referralCount || 0
                );

            // Give 1,000 RWF
            updates[
                "users/" +
                refUid +
                "/balance"
            ] =
                currentBalance +
                REFERRAL_BONUS_AMOUNT;

            updates[
                "users/" +
                refUid +
                "/referralBonus"
            ] =
                currentBonus +
                REFERRAL_BONUS_AMOUNT;

            updates[
                "users/" +
                refUid +
                "/referralEarnings"
            ] =
                currentEarnings +
                REFERRAL_BONUS_AMOUNT;

            updates[
                "users/" +
                refUid +
                "/referralCount"
            ] =
                currentCount + 1;

            // Referral transaction
            const referralTxRef =
                push(ref(db, "transactions"));

            updates[
                "transactions/" +
                referralTxRef.key
            ] = {

                uid: refUid,

                type: "referralBonus",

                amount:
                    REFERRAL_BONUS_AMOUNT,

                sourceUid: uid,

                sourceRequestId: id,

                vipName: vipName,

                status: "completed",

                createdAt: approvedAt
            };

            // Save referral information
            updates[
                "vipPurchaseRequests/" +
                id +
                "/referralBonus"
            ] =
                REFERRAL_BONUS_AMOUNT;

            updates[
                "vipPurchaseRequests/" +
                id +
                "/referralBonusUid"
            ] =
                refUid;

            updates[
                "vipPurchaseRequests/" +
                id +
                "/referralBonusGiven"
            ] = true;
        }

        // --------------------------------------
        // 12. FINAL STATUS = APPROVED
        // --------------------------------------

        updates[
            "vipPurchaseRequests/" +
            id +
            "/status"
        ] = "approved";

        updates[
            "vipPurchaseRequests/" +
            id +
            "/approvedAt"
        ] = approvedAt;

        updates[
            "vipPurchaseRequests/" +
            id +
            "/approvedBy"
        ] =
            currentAdmin.uid;

        updates[
            "vipPurchaseRequests/" +
            id +
            "/duration"
        ] = duration;

        updates[
            "vipPurchaseRequests/" +
            id +
            "/days"
        ] = duration;

        updates[
            "vipPurchaseRequests/" +
            id +
            "/durationDays"
        ] = duration;

        updates[
            "vipPurchaseRequests/" +
            id +
            "/vipBuyerId"
        ] = vipBuyerId;

        // --------------------------------------
        // 13. SAVE EVERYTHING AT ONCE
        // --------------------------------------

        await update(
            ref(db),
            updates
        );

        // --------------------------------------
        // 14. SUCCESS
        // --------------------------------------

        let message =
            "VIP approved successfully.";

        if (referrer) {
            message +=
                "\n\nReferral bonus: 1,000 RWF";
        }

        alert(message);

    } catch (error) {

        console.error(
            "APPROVE VIP ERROR:",
            error
        );

        // IMPORTANT:
        // DO NOT change approved back to pending.
        // There is no processing status anymore.

        alert(
            "VIP approval failed: " +
            (
                error.message ||
                "Unknown error"
            )
        );
    }
}


// ======================================
// GLOBAL
// ======================================

window.approveVipRequest =
    approveVipRequest; 

            
            


/* =========================================================
   REJECT VIP REQUEST
========================================================= */

async function rejectVipRequest(id) {

    if (!currentAdmin) {
        return;
    }


    if (
        !confirm(
            "Reject this VIP purchase?"
        )
    ) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );

        const snapshot =
            await get(requestRef);


        if (!snapshot.exists()) {

            showToast(
                "VIP request not found.",
                "error"
            );

            return;
        }


        const data =
            snapshot.val() || {};

        const status =
            normalizeStatus(
                data.status
            );


        if (status !== "pending") {

            showToast(
                `This VIP request is already ${status}.`,
                "warning"
            );

            return;
        }


        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid,

                rejectedByEmail:
                    currentAdmin.email || ""

            }
        );


        showToast(
            "VIP request rejected.",
            "success"
        );


    } catch (error) {

        console.error(
            "Reject VIP:",
            error
        );

        showToast(
            error.message ||
            "Failed to reject VIP request.",
            "error"
        );

    }

}


/* =========================================================
   VIP BUYERS
========================================================= */

function loadVipBuyers() {

    onValue(
        ref(db, "vipBuyers"),
        (snapshot) => {

            allVipBuyers = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allVipBuyers[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderVipBuyers();

        },
        (error) => {

            console.error(
                "VIP buyers listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER VIP BUYERS
========================================================= */

function renderVipBuyers() {

    const list =
        $("vipBuyerList");

    const empty =
        $("emptyVipBuyer");

    if (!list) {
        return;
    }


    const buyers =
        Object.values(allVipBuyers);


    let active = 0;
    let expired = 0;


    buyers.forEach((data) => {

        const endDate =
            Number(
                data.endDate ||
                data.vipEndDate ||
                0
            );


        const isActive =
            (
                data.active === true ||
                data.status === "active"
            ) &&
            (
                !endDate ||
                endDate > Date.now()
            );


        if (isActive) {
            active++;
        } else {
            expired++;
        }

    });


    if ($("vipBuyerTotalCount")) {
        $("vipBuyerTotalCount").textContent =
            buyers.length;
    }

    if ($("vipBuyerActiveCount")) {
        $("vipBuyerActiveCount").textContent =
            active;
    }

    if ($("vipBuyerExpiredCount")) {
        $("vipBuyerExpiredCount").textContent =
            expired;
    }


    if (buyers.length === 0) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    list.innerHTML =
        buyers
            .sort(
                (a, b) =>
                    Number(
                        b.startDate || 0
                    ) -
                    Number(
                        a.startDate || 0
                    )
            )
            .map((data) => {

                const endDate =
                    Number(
                        data.endDate ||
                        data.vipEndDate ||
                        0
                    );

                const isActive =
                    (
                        data.active === true ||
                        data.status === "active"
                    ) &&
                    (
                        !endDate ||
                        endDate > Date.now()
                    );


                return `
                    <div class="request-card">

                        <div class="request-header">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        data.fullName ||
                                        data.name ||
                                        data.email ||
                                        "VIP User"
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        data.email ||
                                        data.userEmail ||
                                        "-"
                                    )}
                                </p>

                            </div>

                            <span class="status ${
                                isActive
                                    ? "approved"
                                    : "rejected"
                            }">

                                ${
                                    isActive
                                        ? "ACTIVE"
                                        : "EXPIRED"
                                }

                            </span>

                        </div>


                        <div class="request-details">

                            <p>
                                <strong>VIP:</strong>
                                ${escapeHtml(
                                    data.vipPlan ||
                                    data.vipName ||
                                    "VIP"
                                )}
                            </p>

                            <p>
                                <strong>Daily Income:</strong>
                                ${formatMoney(
                                    data.dailyIncome || 0
                                )}
                            </p>

                            <p>
                                <strong>Start:</strong>
                                ${formatDate(
                                    data.startDate
                                )}
                            </p>

                            <p>
                                <strong>End:</strong>
                                ${formatDate(
                                    data.endDate
                                )}
                            </p>

                            <p>
                                <strong>Total Earned:</strong>
                                ${formatMoney(
                                    data.totalEarned || 0
                                )}
                            </p>

                        </div>

                    </div>
                `;

            })
            .join("");

}


/* =========================================================
   BONUS REQUESTS
========================================================= */

function loadBonusRequests() {

    onValue(
        ref(db, "bonusRequests"),
        (snapshot) => {

            allBonusRequests = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allBonusRequests[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderBonusRequests();

        },
        (error) => {

            console.error(
                "Bonus request listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER BONUS REQUESTS
========================================================= */

function renderBonusRequests() {

    const list =
        $("bonusRequestList");

    const empty =
        $("emptyBonusRequest");

    if (!list) {
        return;
    }


    const requests =
        Object.values(allBonusRequests)
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (requests.length === 0) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    list.innerHTML =
        requests
            .map((data) => {

                const status =
                    normalizeStatus(
                        data.status
                    );


                return `
                    <div class="request-card">

                        <div class="request-header">

                            <div>

                                <h3>
                                    ${escapeHtml(
                                        getUserName(data)
                                    )}
                                </h3>

                                <p>
                                    ${escapeHtml(
                                        getEmail(data)
                                    )}
                                </p>

                            </div>

                            <span class="status ${status}">
                                ${escapeHtml(
                                    status.toUpperCase()
                                )}
                            </span>

                        </div>


                        <div class="request-details">

                            <p>
                                <strong>Amount:</strong>
                                ${formatMoney(
                                    data.amount || 0
                                )}
                            </p>

                            <p>
                                <strong>Type:</strong>
                                ${escapeHtml(
                                    data.type ||
                                    "Bonus"
                                )}
                            </p>

                            <p>
                                <strong>Date:</strong>
                                ${formatDate(
                                    data.createdAt
                                )}
                            </p>

                        </div>

                    </div>
                `;

            })
            .join("");

}


/* =========================================================
   USERS
========================================================= */

function loadUsers() {

    onValue(
        ref(db, "users"),
        (snapshot) => {

            allUsers = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allUsers[child.key] =
                        {
                            uid: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderUsers();

        },
        (error) => {

            console.error(
                "Users listener:",
                error
            );

            showToast(
                "Unable to load users.",
                "error"
            );

        }
    );

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    const list =
        $("usersList");

    const empty =
        $("emptyUsers");

    if (!list) {
        return;
    }


    const search =
        (
            $("userSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const users =
        Object.values(allUsers)
            .filter((user) => {

                if (!search) {
                    return true;
                }

                const text =
                    [
                        user.fullName,
                        user.name,
                        user.email,
                        user.phone,
                        user.country,
                        user.vip,
                        user.vipPlan
                    ]
                    .join(" ")
                    .toLowerCase();

                return text.includes(search);

            })
            .sort(
                (a, b) =>
                    String(
                        a.fullName ||
                        a.name ||
                        ""
                    )
                    .localeCompare(
                        String(
                            b.fullName ||
                            b.name ||
                            ""
                        )
                    )
            );


    if (users.length === 0) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    list.innerHTML =
        users
            .map(renderUserCard)
            .join("");

}


/* =========================================================
   USER CARD
========================================================= */

function renderUserCard(user) {

    const vip =
        user.vipPlan ||
        user.vip ||
        "VIP 0";


    return `
        <div class="user-card">

            <div class="user-header">

                <div class="user-avatar">

                    <i class="fa-solid fa-user"></i>

                </div>

                <div>

                    <h3>
                        ${escapeHtml(
                            getUserName(user)
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            getEmail(user)
                        )}
                    </p>

                </div>

            </div>


            <div class="user-details">

                <p>
                    <strong>Phone:</strong>
                    ${escapeHtml(
                        user.phone ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Balance:</strong>
                    ${formatMoney(
                        user.balance || 0
                    )}
                </p>

                <p>
                    <strong>VIP:</strong>
                    ${escapeHtml(
                        vip
                    )}
                </p>

                <p>
                    <strong>Deposits:</strong>
                    ${formatMoney(
                        user.totalDeposit ||
                        user.totalDeposits ||
                        0
                    )}
                </p>

                <p>
                    <strong>Withdraws:</strong>
                    ${formatMoney(
                        user.totalWithdraw ||
                        user.totalWithdraws ||
                        0
                    )}
                </p>

                <p>
                    <strong>Referral Earnings:</strong>
                    ${formatMoney(
                        user.referralEarnings ||
                        0
                    )}
                </p>

            </div>

        </div>
    `;
}


/* =========================================================
   TRANSACTIONS
========================================================= */

function loadTransactions() {

    onValue(
        ref(db, "transactions"),
        (snapshot) => {

            allTransactions = {};

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    allTransactions[child.key] =
                        {
                            id: child.key,
                            ...(child.val() || {})
                        };

                });

            }

            renderTransactions();

        },
        (error) => {

            console.error(
                "Transactions listener:",
                error
            );

        }
    );

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

    const list =
        $("transactionList");

    const empty =
        $("emptyTransaction");

    if (!list) {
        return;
    }


    const search =
        (
            $("transactionSearch")?.value ||
            ""
        )
        .trim()
        .toLowerCase();

    const filter =
        $("transactionFilter")?.value ||
        "all";


    const transactions =
        Object.values(allTransactions)
            .filter((data) => {

                const status =
                    normalizeStatus(
                        data.status
                    );

                const type =
                    String(
                        data.type ||
                        data.category ||
                        ""
                    )
                    .toLowerCase();


                if (filter !== "all") {

                    const filterValue =
                        filter.toLowerCase();


                    const typeMatches =
                        type === filterValue;


                    const statusMatches =
                        status === filterValue;


                    if (
                        !typeMatches &&
                        !statusMatches
                    ) {
                        return false;
                    }

                }


                if (!search) {
                    return true;
                }


                const text =
                    [
                        data.uid,
                        data.email,
                        data.type,
                        data.category,
                        data.description,
                        data.requestId,
                        data.vipPlan
                    ]
                    .join(" ")
                    .toLowerCase();


                return text.includes(
                    search
                );

            })
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (transactions.length === 0) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display =
                "block";
        }

        return;
    }


    if (empty) {
        empty.style.display =
            "none";
    }


    list.innerHTML =
        transactions
            .map(renderTransactionCard)
            .join("");

}


/* =========================================================
   TRANSACTION CARD
========================================================= */

function renderTransactionCard(data) {

    const status =
        normalizeStatus(
            data.status
        );


    const type =
        data.type ||
        data.category ||
        "transaction";


    const amount =
        Number(
            data.amount || 0
        );


    return `
        <div class="request-card">

            <div class="request-header">

                <div>

                    <h3>
                        ${escapeHtml(
                            String(type)
                                .toUpperCase()
                        )}
                    </h3>

                    <p>
                        ${escapeHtml(
                            data.email ||
                            data.uid ||
                            "-"
                        )}
                    </p>

                </div>

                <span class="status ${status}">
                    ${escapeHtml(
                        status.toUpperCase()
                    )}
                </span>

            </div>


            <div class="request-details">

                <p>
                    <strong>Amount:</strong>
                    ${formatMoney(amount)}
                </p>

                <p>
                    <strong>Type:</strong>
                    ${escapeHtml(
                        type
                    )}
                </p>

                <p>
                    <strong>Description:</strong>
                    ${escapeHtml(
                        data.description ||
                        "-"
                    )}
                </p>

                <p>
                    <strong>Date:</strong>
                    ${formatDate(
                        data.createdAt
                    )}
                </p>

            </div>

        </div>
    `;
}


/* =========================================================
   SEARCH + FILTERS
========================================================= */

function initializeSearchFilters() {

    $("depositSearch")
        ?.addEventListener(
            "input",
            renderDeposits
        );

    $("depositFilter")
        ?.addEventListener(
            "change",
            renderDeposits
        );


    $("withdrawSearch")
        ?.addEventListener(
            "input",
            renderWithdraws
        );

    $("withdrawFilter")
        ?.addEventListener(
            "change",
            renderWithdraws
        );


    $("userSearch")
        ?.addEventListener(
            "input",
            renderUsers
        );


    $("transactionSearch")
        ?.addEventListener(
            "input",
            renderTransactions
        );

    $("transactionFilter")
        ?.addEventListener(
            "change",
            renderTransactions
        );

}


/* =========================================================
   QUICK ACTIONS
========================================================= */

function initializeQuickActions() {

    $("refreshDashboard")
        ?.addEventListener(
            "click",
            () => {

                loadDashboardData();

                showToast(
                    "Dashboard refreshed.",
                    "success"
                );

            }
        );


    $("refreshDashboardQuick")
        ?.addEventListener(
            "click",
            () => {

                loadDashboardData();

                showToast(
                    "Dashboard refreshed.",
                    "success"
                );

            }
        );


    $("openDeposits")
        ?.addEventListener(
            "click",
            () => openPage("deposits")
        );


    $("openWithdraws")
        ?.addEventListener(
            "click",
            () => openPage("withdraws")
        );


    $("openUsers")
        ?.addEventListener(
            "click",
            () => openPage("users")
        );


    $("openTransactions")
        ?.addEventListener(
            "click",
            () => openPage("transactions")
        );


    $("openSettings")
        ?.addEventListener(
            "click",
            () => openPage("settings")
        );


    $("openVipRequests")
        ?.addEventListener(
            "click",
            () => openPage("vipRequests")
        );


    $("openUsersBtn")
        ?.addEventListener(
            "click",
            () => openPage("users")
        );


    $("openTransactionsBtn")
        ?.addEventListener(
            "click",
            () => openPage("transactions")
        );


    $("openSettingsBtn")
        ?.addEventListener(
            "click",
            () => openPage("settings")
        );


    $("approveAllDeposits")
        ?.addEventListener(
            "click",
            approveAllPendingDeposits
        );


    $("approveAllWithdraws")
        ?.addEventListener(
            "click",
            approveAllPendingWithdraws
        );

}


/* =========================================================
   APPROVE ALL DEPOSITS
========================================================= */

async function approveAllPendingDeposits() {

    const pending =
        Object.values(allDeposits)
            .filter(
                (data) =>
                    normalizeStatus(
                        data.status
                    ) === "pending"
            );


    if (pending.length === 0) {

        showToast(
            "No pending deposits.",
            "info"
        );

        return;
    }


    if (
        !confirm(
            `Approve ${pending.length} pending deposit(s)?`
        )
    ) {
        return;
    }


    let success = 0;


    for (const deposit of pending) {

        try {

            await approveDeposit(
                deposit.id
            );

            success++;

        } catch (error) {

            console.error(error);

        }

    }


    showToast(
        `${success} deposit(s) processed.`,
        "success"
    );

}


/* =========================================================
   APPROVE ALL WITHDRAWS
========================================================= */

async function approveAllPendingWithdraws() {

    const pending =
        Object.values(allWithdraws)
            .filter(
                (data) =>
                    normalizeStatus(
                        data.status
                    ) === "pending"
            );


    if (pending.length === 0) {

        showToast(
            "No pending withdraws.",
            "info"
        );

        return;
    }


    if (
        !confirm(
            `Approve ${pending.length} pending withdraw(s)?`
        )
    ) {
        return;
    }


    let success = 0;


    for (const withdraw of pending) {

        try {

            await approveWithdraw(
                withdraw.id
            );

            success++;

        } catch (error) {

            console.error(error);

        }

    }


    showToast(
        `${success} withdraw(s) processed.`,
        "success"
    );

}


/* =========================================================
   SETTINGS
========================================================= */

function initializeSettings() {

    $("saveSettings")
        ?.addEventListener(
            "click",
            saveAdminSettings
        );

}


/* =========================================================
   SAVE ADMIN SETTINGS
========================================================= */

async function saveAdminSettings() {

    if (!currentAdmin) {
        return;
    }


    const input =
        $("adminNameInput");

    if (!input) {
        return;
    }


    const name =
        input.value.trim();


    if (!name) {

        showToast(
            "Admin name cannot be empty.",
            "warning"
        );

        return;
    }


    try {

        await update(
            ref(
                db,
                `admins/${currentAdmin.uid}`
            ),
            {

                name:
                    name,

                updatedAt:
                    Date.now()

            }
        );


        adminData =
            {
                ...(adminData || {}),
                name:
                    name
            };


        loadAdminInformation();


        showToast(
            "Admin settings saved.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save admin settings:",
            error
        );

        showToast(
            error.message ||
            "Could not save settings.",
            "error"
        );

    }

}


/* =========================================================
   CLOSE MODAL WHEN CLICKING OUTSIDE
========================================================= */

$("withdrawModal")
    ?.addEventListener(
        "click",
        (event) => {

            if (
                event.target ===
                $("withdrawModal")
            ) {

                closeWithdrawModal();

            }

        }
    );


/* =========================================================
   WINDOW EVENTS
========================================================= */

window.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Escape") {

            closeWithdrawModal();

        }

    }
);


/* =========================================================
   INITIAL CONSOLE
========================================================= */

console.log(
    "=========================================="
);

console.log(
    "💰 MONEY VAULT ADMIN.JS"
);

console.log(
    "Firebase Realtime Database"
);

console.log(
    "Admin verification: admins/{uid}"
);

console.log(
    "Currency: RWF / FRW"
);

console.log(
    "Status: pending / approved / rejected"
);

console.log(
    "=========================================="
);
