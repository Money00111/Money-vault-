// ==========================================
// ADMIN.JS — PART 1
// Money Vault Admin Panel
// Firebase Auth + Realtime Database
// ==========================================

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
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ==========================================
// ADMIN STATE
// ==========================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise = new Promise((resolve) => {
    resolveAdminReady = resolve;
});


// ==========================================
// GLOBAL ADMIN STATE
// ==========================================

window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    readyPromise: adminReadyPromise

};


// ==========================================
// WAIT FOR ADMIN
// ==========================================

window.waitForAdmin = function () {

    return adminReadyPromise;

};


// ==========================================
// HTML ELEMENTS
// ==========================================

const loadingScreen =
    document.getElementById("loadingScreen");

const adminName =
    document.getElementById("adminName");

const adminEmail =
    document.getElementById("adminEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const pageTitle =
    document.getElementById("pageTitle");

const menuLinks =
    document.querySelectorAll(".menu-link");


// IMPORTANT:
// HTML ikoresha .page-section
// ntabwo ikoresha .admin-section

const sections =
    document.querySelectorAll(".page-section");


// ==========================================
// LOADING SCREEN
// ==========================================

function hideLoadingScreen() {

    if (!loadingScreen) return;

    loadingScreen.style.display = "none";

}


function showLoadingScreen() {

    if (!loadingScreen) return;

    loadingScreen.style.display = "flex";

}


// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

onAuthStateChanged(auth, async (user) => {

    try {

        // ----------------------------------
        // USER ATARI LOGGED IN
        // ----------------------------------

        if (!user) {

            window.location.href = "login.html";

            return;

        }


        console.log(
            "Checking administrator:",
            user.uid
        );


        // ----------------------------------
        // CHECK ADMIN
        // ----------------------------------

        const adminRef =
            ref(db, `admins/${user.uid}`);

        const adminSnapshot =
            await get(adminRef);


        // ----------------------------------
        // NOT ADMIN
        // ----------------------------------

        if (!adminSnapshot.exists()) {

            alert(
                "Accès refusé. Vous n'êtes pas administrateur."
            );

            await signOut(auth);

            window.location.href =
                "login.html";

            return;

        }


        // ----------------------------------
        // ADMIN DATA
        // ----------------------------------

        const adminData =
            adminSnapshot.val() || {};


        currentAdmin = {

            uid: user.uid,

            email: user.email || "",

            ...adminData

        };


        adminReady = true;


        resolveAdminReady(
            currentAdmin
        );


        // ----------------------------------
        // DISPLAY ADMIN NAME
        // ----------------------------------

        if (adminName) {

            adminName.textContent =
                currentAdmin.name ||
                currentAdmin.displayName ||
                "Administrator";

        }


        // ----------------------------------
        // DISPLAY ADMIN EMAIL
        // ----------------------------------

        if (adminEmail) {

            adminEmail.textContent =
                user.email || "";

        }


        // ----------------------------------
        // HIDE LOADING
        // ----------------------------------

        hideLoadingScreen();


        // ==================================
        // LOAD DASHBOARD
        // ==================================

        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        // ==================================
        // LOAD DEPOSITS
        // ==================================

        if (
            typeof window.loadDeposits ===
            "function"
        ) {

            window.loadDeposits();

        }


        // ==================================
        // LOAD WITHDRAWS
        // ==================================

        if (
            typeof window.loadWithdraws ===
            "function"
        ) {

            window.loadWithdraws();

        }


        // ==================================
        // LOAD VIP REQUESTS
        // ==================================

        if (
            typeof window.loadVipRequests ===
            "function"
        ) {

            window.loadVipRequests();

        }


        // ==================================
        // LOAD VIP BUYERS
        // ==================================

        if (
            typeof window.loadVipBuyers ===
            "function"
        ) {

            window.loadVipBuyers();

        }


        // ==================================
        // LOAD BONUS REQUESTS
        // ==================================

        if (
            typeof window.loadBonusRequests ===
            "function"
        ) {

            window.loadBonusRequests();

        }


        // ==================================
        // LOAD USERS
        // ==================================

        if (
            typeof window.loadUsers ===
            "function"
        ) {

            window.loadUsers();

        }


        // ==================================
        // LOAD TRANSACTIONS
        // ==================================

        if (
            typeof window.loadTransactions ===
            "function"
        ) {

            window.loadTransactions();

        }


        console.log(
            "ADMIN AUTHENTICATED:",
            currentAdmin
        );


    } catch (error) {

        console.error(
            "ADMIN AUTH ERROR:",
            error
        );


        alert(
            "Erreur de connexion administrateur : " +
            error.message
        );


        hideLoadingScreen();

    }

});


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                alert(
                    "Erreur lors de la déconnexion."
                );

            }

        }
    );

}


// ==========================================
// MOBILE MENU
// ==========================================

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            if (!sidebar) return;

            sidebar.classList.toggle(
                "active"
            );

        }
    );

}


// ==========================================
// OPEN ADMIN PAGE
// ==========================================

function openPage(pageName) {

    if (!pageName) return;


    // --------------------------------------
    // HIDE ALL SECTIONS
    // --------------------------------------

    sections.forEach((section) => {

        section.style.display = "none";

        section.classList.remove("active");

    });


    // --------------------------------------
    // REMOVE ACTIVE MENU
    // --------------------------------------

    menuLinks.forEach((link) => {

        link.classList.remove("active");

    });


    // --------------------------------------
    // IMPORTANT:
    // HTML IDs are:
    //
    // dashboardSection
    // depositsSection
    // withdrawsSection
    // vipRequestsSection
    // vipBuyersSection
    // bonusRequestsSection
    // usersSection
    // transactionsSection
    // quickActionsSection
    // settingsSection
    // --------------------------------------

    const selectedSection =
        document.getElementById(
            `${pageName}Section`
        );


    if (selectedSection) {

        selectedSection.style.display =
            "block";

        selectedSection.classList.add(
            "active"
        );

    } else {

        console.warn(
            "SECTION NOT FOUND:",
            `${pageName}Section`
        );

    }


    // --------------------------------------
    // ACTIVE MENU
    // --------------------------------------

    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add(
            "active"
        );

    }


    // --------------------------------------
    // PAGE TITLE
    // --------------------------------------

    if (pageTitle) {

        let title =
            activeLink?.getAttribute(
                "data-title"
            );


        if (!title) {

            const titleMap = {

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


            title =
                titleMap[pageName] ||
                pageName;

        }


        pageTitle.textContent =
            title;

    }


    // --------------------------------------
    // CLOSE MOBILE SIDEBAR
    // --------------------------------------

    if (sidebar) {

        sidebar.classList.remove(
            "active"
        );

    }

}


// ==========================================
// MAKE OPENPAGE GLOBAL
// ==========================================

window.openPage =
    openPage;


// ==========================================
// SIDEBAR MENU EVENTS
// ==========================================

menuLinks.forEach((link) => {

    link.addEventListener(
        "click",
        (event) => {

            event.preventDefault();


            const page =
                link.getAttribute(
                    "data-page"
                );


            if (page) {

                openPage(page);

            }

        }
    );

});


// ==========================================
// INITIAL PAGE
// ==========================================

openPage("dashboard");


// ==========================================
// READY
// ==========================================

console.log(
    "ADMIN.JS PART 1 READY"
);

// ==========================================
// ADMIN.JS — PART 2
// DASHBOARD
// ==========================================


// ==========================================
// HELPER FUNCTIONS
// ==========================================

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value ?? "";

}


function numberValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


function normalizeStatus(status) {

    return String(
        status ?? "pending"
    )
    .trim()
    .toLowerCase();

}


function formatMoney(amount) {

    const value =
        numberValue(amount);

    return (
        value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }) + " RWF"
    );

}


function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// LOAD DASHBOARD
// ==========================================

async function loadDashboard() {

    try {

        await window.waitForAdmin();

        console.log(
            "Loading admin dashboard..."
        );


        // ==================================
        // DATABASE REFERENCES
        // ==================================

        const usersRef =
            ref(db, "users");

        const depositsRef =
            ref(db, "depositRequests");

        const withdrawsRef =
            ref(db, "withdrawRequests");

        const transactionsRef =
            ref(db, "transactions");


        // ==================================
        // USERS
        // ==================================

        onValue(usersRef, (snapshot) => {

            let totalUsers = 0;
            let systemBalance = 0;


            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const user =
                        child.val() || {};

                    totalUsers++;

                    systemBalance +=
                        numberValue(
                            user.balance
                        );

                });

            }


            updateText(
                "totalUsers",
                totalUsers
            );


            updateText(
                "systemBalance",
                formatMoney(
                    systemBalance
                )
            );

        });


        // ==================================
        // DEPOSITS
        // ==================================

        onValue(depositsRef, (snapshot) => {

            let pendingDeposits = 0;

            let approvedDeposits = 0;

            let rejectedDeposits = 0;

            let totalApprovedDeposits = 0;


            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    const status =
                        normalizeStatus(
                            data.status
                        );

                    const amount =
                        numberValue(
                            data.amount
                        );


                    if (
                        status === "pending"
                    ) {

                        pendingDeposits++;

                    }


                    if (
                        status === "approved"
                    ) {

                        approvedDeposits++;

                        totalApprovedDeposits +=
                            amount;

                    }


                    if (
                        status === "rejected"
                    ) {

                        rejectedDeposits++;

                    }

                });

            }


            // --------------------------------
            // DASHBOARD
            // --------------------------------

            updateText(
                "dashboardTotalDeposits",
                formatMoney(
                    totalApprovedDeposits
                )
            );


            updateText(
                "dashboardPendingDeposits",
                pendingDeposits
            );


            updateText(
                "dashboardApprovedDeposits",
                approvedDeposits
            );


            console.log(
                "Deposits:",
                {
                    pending:
                        pendingDeposits,

                    approved:
                        approvedDeposits,

                    rejected:
                        rejectedDeposits,

                    total:
                        totalApprovedDeposits
                }
            );

        });


        // ==================================
        // WITHDRAWS
        // ==================================

        onValue(withdrawsRef, (snapshot) => {

            let pendingWithdraws = 0;

            let approvedWithdraws = 0;

            let rejectedWithdraws = 0;

            let totalApprovedWithdraws = 0;


            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    const status =
                        normalizeStatus(
                            data.status
                        );

                    const amount =
                        numberValue(
                            data.amount
                        );


                    if (
                        status === "pending"
                    ) {

                        pendingWithdraws++;

                    }


                    if (
                        status === "approved"
                    ) {

                        approvedWithdraws++;

                        totalApprovedWithdraws +=
                            amount;

                    }


                    if (
                        status === "rejected"
                    ) {

                        rejectedWithdraws++;

                    }

                });

            }


            // --------------------------------
            // DASHBOARD
            // --------------------------------

            updateText(
                "dashboardTotalWithdraws",
                formatMoney(
                    totalApprovedWithdraws
                )
            );


            console.log(
                "Withdraws:",
                {
                    pending:
                        pendingWithdraws,

                    approved:
                        approvedWithdraws,

                    rejected:
                        rejectedWithdraws,

                    total:
                        totalApprovedWithdraws
                }
            );

        });


        // ==================================
        // TRANSACTIONS
        // ==================================

        onValue(
            transactionsRef,
            (snapshot) => {

                let transactionCount = 0;

                const transactions = [];


                if (snapshot.exists()) {

                    snapshot.forEach(
                        (child) => {

                            const data =
                                child.val() || {};


                            transactionCount++;


                            transactions.push({

                                id:
                                    child.key,

                                ...data

                            });

                        }
                    );

                }


                // --------------------------------
                // SORT NEWEST FIRST
                // --------------------------------

                transactions.sort(
                    (a, b) => {

                        return (
                            numberValue(
                                b.createdAt
                            ) -
                            numberValue(
                                a.createdAt
                            )
                        );

                    }
                );


                // --------------------------------
                // RECENT ACTIVITY
                // --------------------------------

                renderRecentTransactions(
                    transactions.slice(
                        0,
                        10
                    )
                );


                console.log(
                    "Transactions:",
                    transactionCount
                );

            }
        );


        console.log(
            "ADMIN DASHBOARD LOADED"
        );


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

    }

}


// ==========================================
// RENDER RECENT TRANSACTIONS
// ==========================================

function renderRecentTransactions(
    transactions = []
) {

    const container =
        document.getElementById(
            "recentActivity"
        );


    if (!container) {

        console.warn(
            "recentActivity element not found."
        );

        return;

    }


    // ==================================
    // EMPTY STATE
    // ==================================

    if (
        !transactions ||
        transactions.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No Recent Activity</p>
            </div>
        `;

        return;

    }


    // ==================================
    // RENDER
    // ==================================

    container.innerHTML =
        transactions
            .map((transaction) => {

                const type =
                    String(
                        transaction.type ??
                        "transaction"
                    )
                    .trim()
                    .toLowerCase();


                const status =
                    normalizeStatus(
                        transaction.status
                    );


                const amount =
                    numberValue(
                        transaction.amount
                    );


                const createdAt =
                    numberValue(
                        transaction.createdAt
                    );


                let dateText =
                    "Unknown date";


                if (createdAt > 0) {

                    try {

                        dateText =
                            new Date(
                                createdAt
                            ).toLocaleString(
                                "en-GB"
                            );

                    } catch (error) {

                        dateText =
                            "Unknown date";

                    }

                }


                // --------------------------------
                // TRANSACTION TITLE
                // --------------------------------

                let title =
                    "Transaction";


                if (
                    type === "deposit"
                ) {

                    title =
                        "Deposit";

                } else if (
                    type === "withdraw"
                ) {

                    title =
                        "Withdraw";

                } else if (
                    type === "vip"
                ) {

                    title =
                        "VIP Purchase";

                } else if (
                    type === "bonus"
                ) {

                    title =
                        "Bonus";

                } else if (
                    type === "profit"
                ) {

                    title =
                        "VIP Profit";

                } else if (
                    type === "referral"
                ) {

                    title =
                        "Referral Bonus";

                }


                // --------------------------------
                // STATUS
                // --------------------------------

                let statusText =
                    "Pending";


                if (
                    status === "approved"
                ) {

                    statusText =
                        "Approved";

                } else if (
                    status === "rejected"
                ) {

                    statusText =
                        "Rejected";

                } else if (
                    status === "processing"
                ) {

                    statusText =
                        "Processing";

                }


                // --------------------------------
                // RETURN HTML
                // --------------------------------

                return `
                    <div class="activity-item">

                        <div class="activity-icon">
                            <i class="fas fa-exchange-alt"></i>
                        </div>

                        <div class="activity-info">

                            <strong>
                                ${escapeHTML(title)}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    dateText
                                )}
                            </small>

                            <small>
                                Status:
                                ${escapeHTML(
                                    statusText
                                )}
                            </small>

                        </div>

                        <div class="activity-amount">

                            ${formatMoney(amount)}

                        </div>

                    </div>
                `;

            })
            .join("");

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.loadDashboard =
    loadDashboard;

window.renderRecentTransactions =
    renderRecentTransactions;


// ==========================================
// DASHBOARD REFRESH BUTTON
// ==========================================

const refreshDashboard =
    document.getElementById(
        "refreshDashboard"
    );


if (refreshDashboard) {

    refreshDashboard.addEventListener(
        "click",
        async () => {

            console.log(
                "Refreshing dashboard..."
            );

            await loadDashboard();

        }
    );

}


// ==========================================
// QUICK ACTION — REFRESH DASHBOARD
// ==========================================

const refreshDashboardQuick =
    document.getElementById(
        "refreshDashboardQuick"
    );


if (refreshDashboardQuick) {

    refreshDashboardQuick.addEventListener(
        "click",
        async () => {

            await loadDashboard();

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN DEPOSITS
// ==========================================

const openDeposits =
    document.getElementById(
        "openDeposits"
    );


if (openDeposits) {

    openDeposits.addEventListener(
        "click",
        () => {

            window.openPage(
                "deposits"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN WITHDRAWS
// ==========================================

const openWithdraws =
    document.getElementById(
        "openWithdraws"
    );


if (openWithdraws) {

    openWithdraws.addEventListener(
        "click",
        () => {

            window.openPage(
                "withdraws"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN USERS
// ==========================================

const openUsers =
    document.getElementById(
        "openUsers"
    );


if (openUsers) {

    openUsers.addEventListener(
        "click",
        () => {

            window.openPage(
                "users"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN TRANSACTIONS
// ==========================================

const openTransactions =
    document.getElementById(
        "openTransactions"
    );


if (openTransactions) {

    openTransactions.addEventListener(
        "click",
        () => {

            window.openPage(
                "transactions"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN SETTINGS
// ==========================================

const openSettings =
    document.getElementById(
        "openSettings"
    );


if (openSettings) {

    openSettings.addEventListener(
        "click",
        () => {

            window.openPage(
                "settings"
            );

        }
    );

}


// ==========================================
// QUICK ACTION — OPEN VIP REQUESTS
// ==========================================

const openVipRequests =
    document.getElementById(
        "openVipRequests"
    );


if (openVipRequests) {

    openVipRequests.addEventListener(
        "click",
        () => {

            window.openPage(
                "vipRequests"
            );

        }
    );

}


// ==========================================
// PART 2 READY
// ==========================================

console.log(
    "ADMIN.JS PART 2 READY"
);

// ======================================
// PART 3 - DEPOSITS
// Money Vault Admin
// ======================================

let allDepositRequests = [];
let depositUsers = {};

/* ======================================
   LOAD DEPOSITS
====================================== */

async function loadDeposits() {
    try {
        await waitForAdmin();

        const depositsRef = ref(db, "depositRequests");

        onValue(depositsRef, async (snapshot) => {

            const data = snapshot.val() || {};

            // ----------------------------------
            // GET ALL USERS
            // ----------------------------------
            try {
                const usersSnapshot = await get(ref(db, "users"));
                depositUsers = usersSnapshot.val() || {};
            } catch (userError) {
                console.error("Error loading users:", userError);
                depositUsers = {};
            }

            allDepositRequests = Object.entries(data)
                .map(([id, request]) => ({
                    id,
                    ...(request || {})
                }))
                .sort((a, b) => {
                    const dateA = Number(a.createdAt || 0);
                    const dateB = Number(b.createdAt || 0);
                    return dateB - dateA;
                });

            renderDepositRequests();

        }, (error) => {

            console.error("Deposits listener error:", error);

            const list = document.getElementById("depositList");

            if (list) {
                list.innerHTML = `
                    <div class="error-state">
                        <i class="fas fa-exclamation-triangle"></i>
                        <h3>Failed to load deposits</h3>
                        <p>${escapeHTML(error.message)}</p>
                    </div>
                `;
            }
        });

    } catch (error) {
        console.error("loadDeposits error:", error);
    }
}


/* ======================================
   RENDER ALL DEPOSITS
====================================== */

function renderDepositRequests() {

    const list = document.getElementById("depositList");
    const empty = document.getElementById("emptyDeposit");

    if (!list) return;

    const searchInput = document.getElementById("depositSearch");
    const filterInput = document.getElementById("depositFilter");

    const search = String(searchInput?.value || "")
        .trim()
        .toLowerCase();

    const filter = String(filterInput?.value || "all")
        .trim()
        .toLowerCase();

    const filtered = allDepositRequests.filter(request => {

        const uid = String(request.uid || "").toLowerCase();

        const user = depositUsers[request.uid] || {};

        const name = String(
            user.name ||
            user.fullName ||
            user.username ||
            request.name ||
            ""
        ).toLowerCase();

        const email = String(
            user.email ||
            request.email ||
            ""
        ).toLowerCase();

        const phone = String(
            user.phone ||
            user.phoneNumber ||
            request.senderPhone ||
            request.phone ||
            ""
        ).toLowerCase();

        const txId = String(
            request.transactionId ||
            request.txId ||
            ""
        ).toLowerCase();

        const status = normalizeStatus(request.status);

        const matchesSearch =
            !search ||
            uid.includes(search) ||
            name.includes(search) ||
            email.includes(search) ||
            phone.includes(search) ||
            txId.includes(search);

        const matchesFilter =
            filter === "all" ||
            status === filter;

        return matchesSearch && matchesFilter;
    });


    // ----------------------------------
    // COUNTERS
    // ----------------------------------

    const total = allDepositRequests.length;

    const pending = allDepositRequests.filter(
        x => normalizeStatus(x.status) === "pending"
    ).length;

    const approved = allDepositRequests.filter(
        x => normalizeStatus(x.status) === "approved"
    ).length;

    const rejected = allDepositRequests.filter(
        x => normalizeStatus(x.status) === "rejected"
    ).length;

    updateText("depositTotalCount", total);
    updateText("depositPendingCount", pending);
    updateText("depositApprovedCount", approved);
    updateText("depositRejectedCount", rejected);


    // ----------------------------------
    // EMPTY
    // ----------------------------------

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {
            empty.style.display = "block";
        }

        return;
    }

    if (empty) {
        empty.style.display = "none";
    }


    // ----------------------------------
    // RENDER CARDS
    // ----------------------------------

    list.innerHTML = filtered
        .map(request => renderDepositCard(request))
        .join("");

    activateDepositButtons();
}


/* ======================================
   DEPOSIT CARD
====================================== */

function renderDepositCard(request) {

    const uid = request.uid || "";

    const user = depositUsers[uid] || {};

    // ----------------------------------
    // USER PROFILE
    // ----------------------------------

    const name =
        user.name ||
        user.fullName ||
        user.username ||
        request.name ||
        "Unknown User";

    const email =
        user.email ||
        request.email ||
        "No email";

    const phone =
        user.phone ||
        user.phoneNumber ||
        request.senderPhone ||
        request.phone ||
        "No phone";

    // ----------------------------------
    // DEPOSIT DATA
    // ----------------------------------

    const amount = numberValue(
        request.amount
    );

    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        "Unknown";

    const transactionId =
        request.transactionId ||
        request.txId ||
        "N/A";

    const paymentDate =
        request.paymentDate ||
        request.date ||
        "N/A";

    const createdAt =
        request.createdAt
            ? formatDate(request.createdAt)
            : "N/A";

    const status =
        normalizeStatus(request.status);

    const proofUrl =
        request.proofUrl ||
        request.proof ||
        request.screenshotUrl ||
        "";

    // ----------------------------------
    // STATUS
    // ----------------------------------

    let statusClass = "pending";
    let statusIcon = "fa-clock";
    let statusText = "Pending";

    if (status === "approved") {
        statusClass = "approved";
        statusIcon = "fa-check-circle";
        statusText = "Approved";
    }

    if (status === "rejected") {
        statusClass = "rejected";
        statusIcon = "fa-times-circle";
        statusText = "Rejected";
    }

    if (status === "processing") {
        statusClass = "processing";
        statusIcon = "fa-spinner";
        statusText = "Processing";
    }

    if (status === "processing_error") {
        statusClass = "error";
        statusIcon = "fa-exclamation-circle";
        statusText = "Processing Error";
    }


    // ----------------------------------
    // ACTION BUTTONS
    // ----------------------------------

    let actionButtons = "";

    if (status === "pending") {

        actionButtons = `
            <div class="request-actions">

                <button
                    type="button"
                    class="deposit-action-btn reject-btn rejectDepositBtn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fas fa-times"></i>
                    Reject
                </button>

                <button
                    type="button"
                    class="deposit-action-btn approve-btn approveDepositBtn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fas fa-check"></i>
                    Approve
                </button>

            </div>
        `;
    }


    // ----------------------------------
    // PROOF
    // ----------------------------------

    let proofHTML = "";

    if (proofUrl) {

        proofHTML = `
            <div class="deposit-proof">
                <a
                    href="${escapeHTML(proofUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="proof-btn"
                >
                    <i class="fas fa-image"></i>
                    View Payment Proof
                </a>
            </div>
        `;
    }


    // ----------------------------------
    // CARD
    // ----------------------------------

    return `
        <div
            class="deposit-card request-card"
            data-id="${escapeHTML(request.id)}"
            data-status="${escapeHTML(status)}"
        >

            <!-- ==========================
                 HEADER
            =========================== -->

            <div class="request-card-header">

                <div class="user-profile">

                    <div class="user-avatar">
                        <i class="fas fa-user"></i>
                    </div>

                    <div class="user-profile-info">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <span>
                            <i class="fas fa-envelope"></i>
                            ${escapeHTML(email)}
                        </span>

                    </div>

                </div>


                <div class="request-status ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    ${escapeHTML(statusText)}
                </div>

            </div>


            <!-- ==========================
                 USER INFORMATION
            =========================== -->

            <div class="profile-section">

                <div class="section-title">
                    <i class="fas fa-user-circle"></i>
                    User Information
                </div>

                <div class="profile-grid">

                    <div class="profile-item">
                        <span class="label">
                            <i class="fas fa-user"></i>
                            Name
                        </span>

                        <strong>
                            ${escapeHTML(name)}
                        </strong>
                    </div>


                    <div class="profile-item">
                        <span class="label">
                            <i class="fas fa-envelope"></i>
                            Email
                        </span>

                        <strong>
                            ${escapeHTML(email)}
                        </strong>
                    </div>


                    <div class="profile-item">
                        <span class="label">
                            <i class="fas fa-phone"></i>
                            Phone
                        </span>

                        <strong>
                            ${escapeHTML(phone)}
                        </strong>
                    </div>


                    <div class="profile-item uid-item">
                        <span class="label">
                            <i class="fas fa-id-card"></i>
                            UID
                        </span>

                        <strong title="${escapeHTML(uid)}">
                            ${escapeHTML(uid)}
                        </strong>
                    </div>

                </div>

            </div>


            <!-- ==========================
                 DEPOSIT INFORMATION
            =========================== -->

            <div class="deposit-info-section">

                <div class="section-title">
                    <i class="fas fa-money-bill-wave"></i>
                    Deposit Information
                </div>

                <div class="deposit-info-grid">

                    <div class="deposit-info-item amount-item">

                        <span class="label">
                            <i class="fas fa-coins"></i>
                            Amount
                        </span>

                        <strong class="amount-value">
                            ${formatMoney(amount)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-credit-card"></i>
                            Payment Method
                        </span>

                        <strong>
                            ${escapeHTML(paymentMethod)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-mobile-alt"></i>
                            Sender Phone
                        </span>

                        <strong>
                            ${escapeHTML(
                                request.senderPhone ||
                                request.phone ||
                                phone
                            )}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-receipt"></i>
                            Transaction ID
                        </span>

                        <strong class="transaction-id">
                            ${escapeHTML(transactionId)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-calendar-alt"></i>
                            Payment Date
                        </span>

                        <strong>
                            ${escapeHTML(paymentDate)}
                        </strong>

                    </div>


                    <div class="deposit-info-item">

                        <span class="label">
                            <i class="fas fa-clock"></i>
                            Request Created
                        </span>

                        <strong>
                            ${escapeHTML(createdAt)}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- ==========================
                 PROOF
            =========================== -->

            ${proofHTML}


            <!-- ==========================
                 REQUEST ID
            =========================== -->

            <div class="request-id">

                <span>
                    Request ID
                </span>

                <code>
                    ${escapeHTML(request.id)}
                </code>

            </div>


            <!-- ==========================
                 ACTIONS
            =========================== -->

            ${actionButtons}

        </div>
    `;
}


/* ======================================
   ACTIVATE DEPOSIT BUTTONS
====================================== */

function activateDepositButtons() {

    // ----------------------------------
    // APPROVE
    // ----------------------------------

    document
        .querySelectorAll(".approveDepositBtn")
        .forEach(button => {

            if (button.dataset.active === "true") {
                return;
            }

            button.dataset.active = "true";

            button.addEventListener("click", async () => {

                const id = button.dataset.id;

                if (!id) return;

                if (
                    typeof window.approveDeposit === "function"
                ) {
                    await window.approveDeposit(id);
                } else {
                    console.error(
                        "approveDeposit function not found"
                    );
                }

            });

        });


    // ----------------------------------
    // REJECT
    // ----------------------------------

    document
        .querySelectorAll(".rejectDepositBtn")
        .forEach(button => {

            if (button.dataset.active === "true") {
                return;
            }

            button.dataset.active = "true";

            button.addEventListener("click", async () => {

                const id = button.dataset.id;

                if (!id) return;

                if (
                    typeof window.rejectDeposit === "function"
                ) {
                    await window.rejectDeposit(id);
                } else {
                    console.error(
                        "rejectDeposit function not found"
                    );
                }

            });

        });
}


/* ======================================
   FORMAT DATE
====================================== */

function formatDate(value) {

    if (!value) return "N/A";

    try {

        const date = new Date(Number(value));

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });

    } catch (error) {

        return String(value);
    }
}


/* ======================================
   SEARCH
====================================== */

const depositSearchInput =
    document.getElementById("depositSearch");

if (depositSearchInput) {

    depositSearchInput.addEventListener(
        "input",
        () => {
            renderDepositRequests();
        }
    );
}


/* ======================================
   FILTER
====================================== */

const depositFilterInput =
    document.getElementById("depositFilter");

if (depositFilterInput) {

    depositFilterInput.addEventListener(
        "change",
        () => {
            renderDepositRequests();
        }
    );
}


/* ======================================
   GLOBAL FUNCTIONS
====================================== */

window.loadDeposits =
    loadDeposits;

window.renderDepositCard =
    renderDepositCard;

window.renderDepositRequests =
    renderDepositRequests;

window.activateDepositButtons =
    activateDepositButtons;

