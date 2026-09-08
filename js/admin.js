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


// ==========================================
// ADMIN.JS — PART 3
// DEPOSIT REQUESTS
// ==========================================


// ==========================================
// LOAD DEPOSITS
// ==========================================

async function loadDeposits() {

    try {

        await window.waitForAdmin();

        console.log(
            "Loading deposit requests..."
        );


        const depositsRef =
            ref(db, "depositRequests");


        onValue(
            depositsRef,
            async (snapshot) => {

                const container =
                    document.getElementById(
                        "depositList"
                    );

                if (!container) {

                    console.warn(
                        "depositList element not found."
                    );

                    return;

                }


                const deposits = [];


                // ==================================
                // READ DEPOSITS
                // ==================================

                if (snapshot.exists()) {

                    snapshot.forEach((child) => {

                        const data =
                            child.val() || {};

                        deposits.push({

                            id:
                                child.key,

                            ...data

                        });

                    });

                }


                // ==================================
                // SORT NEWEST FIRST
                // ==================================

                deposits.sort(
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


                // ==================================
                // UPDATE COUNTERS
                // ==================================

                let pendingCount = 0;
                let approvedCount = 0;
                let rejectedCount = 0;


                deposits.forEach((deposit) => {

                    const status =
                        normalizeStatus(
                            deposit.status
                        );


                    if (
                        status === "pending"
                    ) {

                        pendingCount++;

                    } else if (
                        status === "approved"
                    ) {

                        approvedCount++;

                    } else if (
                        status === "rejected"
                    ) {

                        rejectedCount++;

                    }

                });


                updateText(
                    "depositTotalCount",
                    deposits.length
                );

                updateText(
                    "depositPendingCount",
                    pendingCount
                );

                updateText(
                    "depositApprovedCount",
                    approvedCount
                );

                updateText(
                    "depositRejectedCount",
                    rejectedCount
                );


                // ==================================
                // EMPTY STATE
                // ==================================

                const emptyElement =
                    document.getElementById(
                        "emptyDeposit"
                    );


                if (
                    deposits.length === 0
                ) {

                    container.innerHTML = "";


                    if (emptyElement) {

                        emptyElement.style.display =
                            "block";

                    }

                    return;

                }


                if (emptyElement) {

                    emptyElement.style.display =
                        "none";

                }


                // ==================================
                // RENDER DEPOSITS
                // ==================================

                container.innerHTML =
                    deposits
                        .map(
                            renderDepositCard
                        )
                        .join("");


                // ==================================
                // ACTIVATE BUTTONS
                // ==================================

                activateDepositButtons();

            }
        );


    } catch (error) {

        console.error(
            "LOAD DEPOSITS ERROR:",
            error
        );

    }

}


// ==========================================
// RENDER ONE DEPOSIT
// ==========================================

function renderDepositCard(
    deposit
) {

    const status =
        normalizeStatus(
            deposit.status
        );


    const amount =
        numberValue(
            deposit.amount
        );


    const paymentMethod =
        deposit.paymentMethod ||
        deposit.method ||
        "N/A";


    const senderPhone =
        deposit.senderPhone ||
        deposit.phone ||
        "N/A";


    const transactionId =
        deposit.transactionId ||
        "N/A";


    const paymentDate =
        deposit.paymentDate ||
        "N/A";


    const uid =
        deposit.uid ||
        "N/A";


    const createdAt =
        numberValue(
            deposit.createdAt
        );


    let createdDate =
        "N/A";


    if (createdAt > 0) {

        createdDate =
            new Date(
                createdAt
            ).toLocaleString(
                "en-GB"
            );

    }


    let statusClass =
        "pending";


    let statusText =
        "Pending";


    if (
        status === "approved"
    ) {

        statusClass =
            "approved";

        statusText =
            "Approved";

    } else if (
        status === "rejected"
    ) {

        statusClass =
            "rejected";

        statusText =
            "Rejected";

    } else if (
        status === "processing"
    ) {

        statusClass =
            "processing";

        statusText =
            "Processing";

    } else if (
        status === "processing_error"
    ) {

        statusClass =
            "rejected";

        statusText =
            "Processing Error";

    }


    // ==================================
    // ACTION BUTTONS
    // ==================================

    let actionButtons = "";


    if (
        status === "pending"
    ) {

        actionButtons = `

            <div class="request-actions">

                <button
                    type="button"
                    class="approveBtn"
                    data-id="${escapeHTML(
                        deposit.id
                    )}"
                >
                    <i class="fas fa-check"></i>
                    Approve
                </button>

                <button
                    type="button"
                    class="rejectBtn"
                    data-id="${escapeHTML(
                        deposit.id
                    )}"
                >
                    <i class="fas fa-times"></i>
                    Reject
                </button>

            </div>

        `;

    }


    return `

        <div
            class="request-card deposit-card"
            data-id="${escapeHTML(
                deposit.id
            )}"
        >

            <div class="request-card-header">

                <div>

                    <h3>
                        Deposit Request
                    </h3>

                    <small>
                        ID:
                        ${escapeHTML(
                            deposit.id
                        )}
                    </small>

                </div>


                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHTML(
                        statusText
                    )}
                </span>

            </div>


            <div class="request-card-body">

                <div class="request-info">

                    <span>
                        <strong>Amount</strong>
                        ${formatMoney(amount)}
                    </span>


                    <span>
                        <strong>Payment Method</strong>
                        ${escapeHTML(
                            paymentMethod
                        )}
                    </span>


                    <span>
                        <strong>Sender Phone</strong>
                        ${escapeHTML(
                            senderPhone
                        )}
                    </span>


                    <span>
                        <strong>Transaction ID</strong>
                        ${escapeHTML(
                            transactionId
                        )}
                    </span>


                    <span>
                        <strong>Payment Date</strong>
                        ${escapeHTML(
                            paymentDate
                        )}
                    </span>


                    <span>
                        <strong>User UID</strong>
                        ${escapeHTML(
                            uid
                        )}
                    </span>


                    <span>
                        <strong>Created At</strong>
                        ${escapeHTML(
                            createdDate
                        )}
                    </span>

                </div>


                ${
                    deposit.proofUrl
                        ? `
                            <div class="proof-section">

                                <a
                                    href="${escapeHTML(
                                        deposit.proofUrl
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="proof-link"
                                >
                                    <i class="fas fa-image"></i>
                                    View Payment Proof
                                </a>

                            </div>
                        `
                        : ""
                }


                ${actionButtons}

            </div>

        </div>

    `;

}


// ==========================================
// ACTIVATE DEPOSIT BUTTONS
// ==========================================

function activateDepositButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".approveBtn"
        );


    const rejectButtons =
        document.querySelectorAll(
            ".rejectBtn"
        );


    // ==================================
    // APPROVE
    // ==================================

    approveButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        console.error(
                            "Deposit ID missing."
                        );

                        return;

                    }


                    // Prevent double click
                    button.disabled = true;


                    try {

                        if (
                            typeof window.approveDeposit ===
                            "function"
                        ) {

                            await window.approveDeposit(
                                id
                            );

                        }

                    } catch (error) {

                        console.error(
                            "APPROVE DEPOSIT ERROR:",
                            error
                        );

                    } finally {

                        button.disabled = false;

                    }

                }
            );

        }
    );


    // ==================================
    // REJECT
    // ==================================

    rejectButtons.forEach(
        (button) => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        console.error(
                            "Deposit ID missing."
                        );

                        return;

                    }


                    button.disabled = true;


                    try {

                        if (
                            typeof window.rejectDeposit ===
                            "function"
                        ) {

                            await window.rejectDeposit(
                                id
                            );

                        }

                    } catch (error) {

                        console.error(
                            "REJECT DEPOSIT ERROR:",
                            error
                        );

                    } finally {

                        button.disabled = false;

                    }

                }
            );

        }
    );

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.loadDeposits =
    loadDeposits;

window.renderDepositCard =
    renderDepositCard;

window.activateDepositButtons =
    activateDepositButtons;


// ==========================================
// PART 3 READY
// ==========================================

console.log(
    "ADMIN.JS PART 3 READY"
);

// ==========================================
// ADMIN.JS — PART 4
// APPROVE / REJECT DEPOSITS
// ==========================================


// ==========================================
// APPROVE DEPOSIT
// ==========================================

async function approveDeposit(id) {

    try {

        await window.waitForAdmin();

        if (!id) {
            throw new Error("Deposit ID is missing.");
        }


        // ==================================
        // CONFIRM
        // ==================================

        const confirmed = confirm(
            "Are you sure you want to approve this deposit?"
        );

        if (!confirmed) {
            return;
        }


        // ==================================
        // DEPOSIT REQUEST
        // ==================================

        const depositRef =
            ref(db, `depositRequests/${id}`);

        const depositSnapshot =
            await get(depositRef);


        if (!depositSnapshot.exists()) {

            throw new Error(
                "Deposit request not found."
            );

        }


        const deposit =
            depositSnapshot.val() || {};


        // ==================================
        // ONLY PENDING CAN BE APPROVED
        // ==================================

        if (
            normalizeStatus(deposit.status) !==
            "pending"
        ) {

            alert(
                "This deposit has already been processed."
            );

            return;

        }


        const uid =
            deposit.uid;

        const amount =
            numberValue(
                deposit.amount
            );


        if (!uid) {

            throw new Error(
                "User UID is missing."
            );

        }


        if (amount <= 0) {

            throw new Error(
                "Invalid deposit amount."
            );

        }


        // ==================================
        // LOCK REQUEST
        // ==================================

        const lockResult =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {
                        return;
                    }


                    const currentStatus =
                        normalizeStatus(
                            currentData.status
                        );


                    if (
                        currentStatus !==
                        "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentData,

                        status:
                            "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin?.uid ||
                            null

                    };

                }
            );


        if (!lockResult.committed) {

            alert(
                "This deposit is already being processed."
            );

            return;

        }


        // ==================================
        // USER REFERENCE
        // ==================================

        const userRef =
            ref(db, `users/${uid}`);


        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            throw new Error(
                "User account not found."
            );

        }


        const user =
            userSnapshot.val() || {};


        const oldBalance =
            numberValue(
                user.balance
            );


        const oldTotalDeposits =
            numberValue(
                user.totalDeposits
            );


        const oldTotalTransactions =
            numberValue(
                user.totalTransactions
            );


        // ==================================
        // CREDIT USER BALANCE
        // ==================================

        const newBalance =
            oldBalance + amount;


        const newTotalDeposits =
            oldTotalDeposits + amount;


        const newTotalTransactions =
            oldTotalTransactions + 1;


        // ==================================
        // UPDATE USER
        // ==================================

        await update(
            userRef,
            {

                balance:
                    newBalance,

                totalDeposits:
                    newTotalDeposits,

                totalTransactions:
                    newTotalTransactions

            }
        );


        // ==================================
        // CREATE TRANSACTION
        // ==================================

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        const transactionKey =
            transactionRef.key;


        if (!transactionKey) {

            throw new Error(
                "Could not create transaction ID."
            );

        }


        await set(
            transactionRef,
            {

                uid:
                    uid,

                type:
                    "deposit",

                amount:
                    amount,

                status:
                    "approved",

                paymentMethod:
                    deposit.paymentMethod ||
                    deposit.method ||
                    "",

                transactionId:
                    deposit.transactionId ||
                    "",

                depositRequestId:
                    id,

                createdAt:
                    Date.now(),

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin?.uid ||
                    ""

            }
        );


        // ==================================
        // FINALIZE DEPOSIT REQUEST
        // ==================================

        await update(
            depositRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin?.uid ||
                    "",

                transactionKey:
                    transactionKey,

                processedAt:
                    Date.now()

            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        console.log(
            "DEPOSIT APPROVED:",
            id
        );


        alert(
            "Deposit approved successfully."
        );


    } catch (error) {

        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );


        // ==================================
        // MARK ERROR
        // ==================================

        try {

            if (id) {

                await update(
                    ref(
                        db,
                        `depositRequests/${id}`
                    ),
                    {

                        status:
                            "processing_error",

                        error:
                            error.message ||
                            "Unknown error",

                        errorAt:
                            Date.now(),

                        errorBy:
                            currentAdmin?.uid ||
                            ""

                    }
                );

            }

        } catch (updateError) {

            console.error(
                "COULD NOT MARK DEPOSIT ERROR:",
                updateError
            );

        }


        alert(
            "Deposit approval failed:\n" +
            (error.message || "Unknown error")
        );

    }

}


// ==========================================
// REJECT DEPOSIT
// ==========================================

async function rejectDeposit(id) {

    try {

        await window.waitForAdmin();

        if (!id) {

            throw new Error(
                "Deposit ID is missing."
            );

        }


        // ==================================
        // CONFIRM
        // ==================================

        const confirmed = confirm(
            "Are you sure you want to reject this deposit?"
        );

        if (!confirmed) {
            return;
        }


        // ==================================
        // REFERENCE
        // ==================================

        const depositRef =
            ref(db, `depositRequests/${id}`);


        // ==================================
        // ATOMIC STATUS CHANGE
        // ==================================

        const result =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {
                        return;
                    }


                    const currentStatus =
                        normalizeStatus(
                            currentData.status
                        );


                    // Only pending
                    if (
                        currentStatus !==
                        "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentData,

                        status:
                            "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin?.uid ||
                            ""

                    };

                }
            );


        if (!result.committed) {

            alert(
                "This deposit has already been processed."
            );

            return;

        }


        console.log(
            "DEPOSIT REJECTED:",
            id
        );


        alert(
            "Deposit rejected successfully."
        );


    } catch (error) {

        console.error(
            "REJECT DEPOSIT ERROR:",
            error
        );


        alert(
            "Deposit rejection failed:\n" +
            (error.message || "Unknown error")
        );

    }

}


// ==========================================
// GLOBAL FUNCTIONS
// ==========================================

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;


// ==========================================
// PART 4 READY
// ==========================================

console.log(
    "ADMIN.JS PART 4 READY"
);

// ======================================
// PART 5 — WITHDRAW REQUESTS
// Money Vault Admin Panel
// ======================================

async function loadWithdraws() {
    try {
        await window.waitForAdmin();

        const withdrawRef = ref(db, "withdrawRequests");

        onValue(withdrawRef, async (snapshot) => {

            const data = snapshot.val() || {};

            const withdraws = Object.entries(data).map(([id, item]) => ({
                id,
                ...item
            }));

            // Sort newest first
            withdraws.sort((a, b) => {
                const dateA = Number(a.createdAt) || 0;
                const dateB = Number(b.createdAt) || 0;
                return dateB - dateA;
            });

            // ==============================
            // COUNTERS
            // ==============================

            const total = withdraws.length;

            const pending = withdraws.filter(
                item => normalizeStatus(item.status) === "pending"
            ).length;

            const approved = withdraws.filter(
                item => normalizeStatus(item.status) === "approved"
            ).length;

            const rejected = withdraws.filter(
                item => normalizeStatus(item.status) === "rejected"
            ).length;

            updateText("withdrawTotalCount", total);
            updateText("withdrawPendingCount", pending);
            updateText("withdrawApprovedCount", approved);
            updateText("withdrawRejectedCount", rejected);

            // ==============================
            // CONTAINER
            // ==============================

            const container = document.getElementById("withdrawList");
            const emptyState = document.getElementById("emptyWithdraw");

            if (!container) {
                console.error("withdrawList element not found.");
                return;
            }

            container.innerHTML = "";

            // ==============================
            // EMPTY STATE
            // ==============================

            if (withdraws.length === 0) {

                if (emptyState) {
                    emptyState.style.display = "block";
                }

                return;
            }

            if (emptyState) {
                emptyState.style.display = "none";
            }

            // ==============================
            // RENDER WITHDRAWS
            // ==============================

            withdraws.forEach(withdraw => {

                container.insertAdjacentHTML(
                    "beforeend",
                    renderWithdrawCard(withdraw)
                );

            });

            // ==============================
            // ACTIVATE BUTTONS
            // ==============================

            activateWithdrawButtons();

        }, error => {

            console.error(
                "Error loading withdraw requests:",
                error
            );

            const container = document.getElementById("withdrawList");

            if (container) {
                container.innerHTML = `
                    <div class="error-message">
                        Failed to load withdraw requests.
                    </div>
                `;
            }

        });

    } catch (error) {

        console.error(
            "loadWithdraws error:",
            error
        );

    }
}


// ======================================
// RENDER WITHDRAW CARD
// ======================================

function renderWithdrawCard(withdraw) {

    const id = escapeHTML(withdraw.id);

    const uid = escapeHTML(withdraw.uid || "N/A");

    const amount = numberValue(withdraw.amount);

    const status = normalizeStatus(withdraw.status);

    const paymentMethod =
        escapeHTML(
            withdraw.paymentMethod ||
            withdraw.method ||
            "N/A"
        );

    const phone =
        escapeHTML(
            withdraw.phone ||
            withdraw.receiverPhone ||
            withdraw.withdrawPhone ||
            "N/A"
        );

    const accountName =
        escapeHTML(
            withdraw.accountName ||
            withdraw.name ||
            "N/A"
        );

    const createdAt =
        withdraw.createdAt
            ? new Date(
                Number(withdraw.createdAt)
              ).toLocaleString()
            : "N/A";

    const approvedAt =
        withdraw.approvedAt
            ? new Date(
                Number(withdraw.approvedAt)
              ).toLocaleString()
            : "";

    const rejectedAt =
        withdraw.rejectedAt
            ? new Date(
                Number(withdraw.rejectedAt)
              ).toLocaleString()
            : "";

    let statusText = "Pending";

    if (status === "approved") {
        statusText = "Approved";
    }

    if (status === "rejected") {
        statusText = "Rejected";
    }

    if (status === "processing") {
        statusText = "Processing";
    }

    if (status === "processing_error") {
        statusText = "Processing Error";
    }

    // ==============================
    // ACTION BUTTONS
    // ==============================

    let actions = "";

    if (status === "pending") {

        actions = `
            <div class="withdraw-actions">

                <button
                    type="button"
                    class="approveWithdrawBtn"
                    data-id="${id}">
                    Approve
                </button>

                <button
                    type="button"
                    class="rejectWithdrawBtn"
                    data-id="${id}">
                    Reject
                </button>

            </div>
        `;
    }

    return `
        <div
            class="withdraw-card"
            data-id="${id}"
            data-status="${status}">

            <div class="withdraw-card-header">

                <div>
                    <h3>
                        Withdraw Request
                    </h3>

                    <small>
                        ID: ${id}
                    </small>
                </div>

                <span class="status-badge status-${status}">
                    ${statusText}
                </span>

            </div>


            <div class="withdraw-amount">

                <span>Amount</span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <div class="withdraw-info">

                <div class="info-row">
                    <span>User UID</span>
                    <strong>${uid}</strong>
                </div>

                <div class="info-row">
                    <span>Payment Method</span>
                    <strong>${paymentMethod}</strong>
                </div>

                <div class="info-row">
                    <span>Phone</span>
                    <strong>${phone}</strong>
                </div>

                <div class="info-row">
                    <span>Account Name</span>
                    <strong>${accountName}</strong>
                </div>

                <div class="info-row">
                    <span>Created At</span>
                    <strong>${createdAt}</strong>
                </div>

                ${
                    approvedAt
                        ? `
                            <div class="info-row">
                                <span>Approved At</span>
                                <strong>${approvedAt}</strong>
                            </div>
                          `
                        : ""
                }

                ${
                    rejectedAt
                        ? `
                            <div class="info-row">
                                <span>Rejected At</span>
                                <strong>${rejectedAt}</strong>
                            </div>
                          `
                        : ""
                }

            </div>


            ${actions}

        </div>
    `;
}


// ======================================
// ACTIVATE WITHDRAW BUTTONS
// ======================================

function activateWithdrawButtons() {

    // ==============================
    // APPROVE BUTTONS
    // ==============================

    document
        .querySelectorAll(".approveWithdrawBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {
                        alert(
                            "Withdraw request ID is missing."
                        );
                        return;
                    }

                    if (
                        typeof window.approveWithdraw ===
                        "function"
                    ) {

                        await window.approveWithdraw(id);

                    } else {

                        console.error(
                            "approveWithdraw() is not available yet."
                        );

                    }

                }
            );

        });


    // ==============================
    // REJECT BUTTONS
    // ==============================

    document
        .querySelectorAll(".rejectWithdrawBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {
                        alert(
                            "Withdraw request ID is missing."
                        );
                        return;
                    }

                    if (
                        typeof window.rejectWithdraw ===
                        "function"
                    ) {

                        await window.rejectWithdraw(id);

                    } else {

                        console.error(
                            "rejectWithdraw() is not available yet."
                        );

                    }

                }
            );

        });
}


// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadWithdraws =
    loadWithdraws;

window.renderWithdrawCard =
    renderWithdrawCard;

window.activateWithdrawButtons =
    activateWithdrawButtons;

// ======================================
// PART 6 — APPROVE / REJECT WITHDRAW
// Money Vault Admin Panel
// ======================================


// ======================================
// APPROVE WITHDRAW
// ======================================

async function approveWithdraw(id) {

    try {

        await window.waitForAdmin();

        if (!id) {
            alert("Withdraw request ID is missing.");
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to approve this withdrawal?"
        );

        if (!confirmed) {
            return;
        }


        // ==================================
        // GET WITHDRAW REQUEST
        // ==================================

        const requestRef =
            ref(db, `withdrawRequests/${id}`);

        const requestSnapshot =
            await get(requestRef);

        if (!requestSnapshot.exists()) {
            alert("Withdraw request not found.");
            return;
        }

        const request =
            requestSnapshot.val();


        // ==================================
        // CHECK STATUS
        // ==================================

        const currentStatus =
            normalizeStatus(request.status);

        if (currentStatus !== "pending") {

            alert(
                `This request is already ${currentStatus}.`
            );

            return;
        }


        // ==================================
        // VALIDATE USER
        // ==================================

        const uid =
            request.uid;

        if (!uid) {

            alert(
                "This withdraw request has no user UID."
            );

            return;
        }


        // ==================================
        // VALIDATE AMOUNT
        // ==================================

        const amount =
            numberValue(request.amount);

        if (!Number.isFinite(amount) || amount <= 0) {

            alert(
                "Invalid withdrawal amount."
            );

            return;
        }


        // ==================================
        // LOCK REQUEST
        // pending → processing
        // ==================================

        const lockResult =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) {
                        return;
                    }

                    const status =
                        normalizeStatus(
                            currentData.status
                        );

                    if (status !== "pending") {
                        return;
                    }

                    return {
                        ...currentData,
                        status: "processing",
                        processingAt: Date.now(),
                        processingBy:
                            currentAdmin?.uid || auth.currentUser?.uid || null
                    };
                }
            );


        // ==================================
        // CHECK LOCK RESULT
        // ==================================

        if (!lockResult.committed) {

            alert(
                "This withdrawal is already being processed."
            );

            return;
        }


        // ==================================
        // GET USER
        // ==================================

        const userRef =
            ref(db, `users/${uid}`);

        const userSnapshot =
            await get(userRef);

        if (!userSnapshot.exists()) {

            await update(requestRef, {
                status: "pending",
                processingAt: null,
                processingBy: null
            });

            alert(
                "User account not found."
            );

            return;
        }

        const user =
            userSnapshot.val();


        // ==================================
        // CURRENT BALANCE
        // ==================================

        const currentBalance =
            numberValue(user.balance);


        // ==================================
        // CHECK BALANCE
        // ==================================

        if (currentBalance < amount) {

            await update(requestRef, {

                status: "rejected",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null,

                rejectionReason:
                    "Insufficient balance.",

                processingAt: null,

                processingBy: null

            });

            alert(
                "Withdrawal rejected: insufficient balance."
            );

            return;
        }


        // ==================================
        // NEW BALANCE
        // ==================================

        const newBalance =
            currentBalance - amount;


        // ==================================
        // TOTAL WITHDRAWALS
        // ==================================

        const oldTotalWithdrawals =
            numberValue(
                user.totalWithdrawals
            );

        const newTotalWithdrawals =
            oldTotalWithdrawals + amount;


        // ==================================
        // TOTAL TRANSACTIONS
        // ==================================

        const oldTotalTransactions =
            numberValue(
                user.totalTransactions
            );

        const newTotalTransactions =
            oldTotalTransactions + 1;


        // ==================================
        // UPDATE USER BALANCE
        // ==================================

        await update(userRef, {

            balance:
                newBalance,

            totalWithdrawals:
                newTotalWithdrawals,

            totalTransactions:
                newTotalTransactions

        });


        // ==================================
        // CREATE TRANSACTION
        // ==================================

        const transactionRef =
            push(ref(db, "transactions"));

        const transactionKey =
            transactionRef.key;

        const now =
            Date.now();

        await set(
            transactionRef,
            {

                uid:
                    uid,

                type:
                    "withdraw",

                amount:
                    amount,

                status:
                    "approved",

                paymentMethod:
                    request.paymentMethod ||
                    request.method ||
                    null,

                phone:
                    request.phone ||
                    request.receiverPhone ||
                    request.withdrawPhone ||
                    null,

                withdrawRequestId:
                    id,

                createdAt:
                    now,

                approvedAt:
                    now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null

            }
        );


        // ==================================
        // FINALIZE REQUEST
        // ==================================

        await update(requestRef, {

            status:
                "approved",

            approvedAt:
                now,

            approvedBy:
                currentAdmin?.uid ||
                auth.currentUser?.uid ||
                null,

            transactionKey:
                transactionKey,

            processingAt:
                null,

            processingBy:
                null

        });


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Withdrawal approved successfully."
        );


        // Refresh dashboard if available
        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


    } catch (error) {

        console.error(
            "approveWithdraw error:",
            error
        );


        // Try to mark request as processing error
        try {

            if (id) {

                await update(
                    ref(db, `withdrawRequests/${id}`),
                    {
                        status:
                            "processing_error",

                        processingError:
                            error?.message ||
                            String(error),

                        errorAt:
                            Date.now()
                    }
                );

            }

        } catch (updateError) {

            console.error(
                "Could not update withdraw error status:",
                updateError
            );

        }


        alert(
            "Failed to approve withdrawal: " +
            (error?.message || "Unknown error")
        );

    }
}



// ======================================
// REJECT WITHDRAW
// ======================================

async function rejectWithdraw(id) {

    try {

        await window.waitForAdmin();

        if (!id) {

            alert(
                "Withdraw request ID is missing."
            );

            return;
        }


        // ==================================
        // CONFIRM
        // ==================================

        const confirmed =
            confirm(
                "Are you sure you want to reject this withdrawal?"
            );

        if (!confirmed) {
            return;
        }


        // ==================================
        // REQUEST REF
        // ==================================

        const requestRef =
            ref(db, `withdrawRequests/${id}`);


        // ==================================
        // LOCK / REJECT TRANSACTION
        // ==================================

        const result =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) {
                        return;
                    }

                    const status =
                        normalizeStatus(
                            currentData.status
                        );

                    if (status !== "pending") {
                        return;
                    }

                    return {

                        ...currentData,

                        status:
                            "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin?.uid ||
                            auth.currentUser?.uid ||
                            null

                    };

                }
            );


        // ==================================
        // CHECK RESULT
        // ==================================

        if (!result.committed) {

            alert(
                "This request is no longer pending."
            );

            return;
        }


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Withdrawal rejected successfully."
        );


        // Refresh dashboard
        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


    } catch (error) {

        console.error(
            "rejectWithdraw error:",
            error
        );

        alert(
            "Failed to reject withdrawal: " +
            (error?.message || "Unknown error")
        );

    }
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;
// ======================================
// PART 7 — VIP PURCHASE REQUESTS
// Money Vault Admin Panel
// ======================================

async function loadVipRequests() {
    try {

        await window.waitForAdmin();

        const vipRef =
            ref(db, "vipPurchaseRequests");

        onValue(vipRef, async (snapshot) => {

            const data =
                snapshot.val() || {};

            const requests =
                Object.entries(data).map(
                    ([id, item]) => ({
                        id,
                        ...item
                    })
                );

            // ==============================
            // SORT NEWEST FIRST
            // ==============================

            requests.sort((a, b) => {

                const dateA =
                    Number(a.createdAt) || 0;

                const dateB =
                    Number(b.createdAt) || 0;

                return dateB - dateA;
            });


            // ==============================
            // COUNTERS
            // ==============================

            const total =
                requests.length;

            const pending =
                requests.filter(
                    item =>
                        normalizeStatus(item.status) ===
                        "pending"
                ).length;

            const approved =
                requests.filter(
                    item =>
                        normalizeStatus(item.status) ===
                        "approved"
                ).length;

            const rejected =
                requests.filter(
                    item =>
                        normalizeStatus(item.status) ===
                        "rejected"
                ).length;


            updateText(
                "vipTotalCount",
                total
            );

            updateText(
                "vipPendingCount",
                pending
            );

            updateText(
                "vipApprovedCount",
                approved
            );

            updateText(
                "vipRejectedCount",
                rejected
            );


            // ==============================
            // CONTAINER
            // ==============================

            const container =
                document.getElementById(
                    "vipRequestList"
                );

            const emptyState =
                document.getElementById(
                    "emptyVipRequest"
                );


            if (!container) {

                console.error(
                    "vipRequestList element not found."
                );

                return;
            }


            container.innerHTML = "";


            // ==============================
            // EMPTY STATE
            // ==============================

            if (requests.length === 0) {

                if (emptyState) {
                    emptyState.style.display =
                        "block";
                }

                return;
            }


            if (emptyState) {
                emptyState.style.display =
                    "none";
            }


            // ==============================
            // LOAD USERS
            // ==============================

            const usersSnapshot =
                await get(
                    ref(db, "users")
                );

            const users =
                usersSnapshot.exists()
                    ? usersSnapshot.val()
                    : {};


            // ==============================
            // RENDER
            // ==============================

            requests.forEach(request => {

                const user =
                    users[request.uid] || {};

                container.insertAdjacentHTML(
                    "beforeend",
                    renderVipRequestCard(
                        request,
                        user
                    )
                );

            });


            // ==============================
            // ACTIVATE BUTTONS
            // ==============================

            activateVipRequestButtons();

        }, error => {

            console.error(
                "Error loading VIP requests:",
                error
            );

            const container =
                document.getElementById(
                    "vipRequestList"
                );

            if (container) {

                container.innerHTML = `
                    <div class="error-message">
                        Failed to load VIP requests.
                    </div>
                `;
            }

        });

    } catch (error) {

        console.error(
            "loadVipRequests error:",
            error
        );
    }
}


// ======================================
// RENDER VIP REQUEST CARD
// ======================================

function renderVipRequestCard(
    request,
    user = {}
) {

    const id =
        escapeHTML(request.id);

    const uid =
        escapeHTML(request.uid || "N/A");


    // ==============================
    // SUPPORT MULTIPLE FIELD NAMES
    // ==============================

    const vipName =
        request.vipName ||
        request.name ||
        request.planName ||
        "VIP Plan";


    const price =
        numberValue(
            request.price ??
            request.vipPrice ??
            request.amount
        );


    const dailyIncome =
        numberValue(
            request.dailyIncome ??
            request.daily
        );


    const totalProfit =
        numberValue(
            request.totalProfit ??
            request.profit
        );


    const duration =
        request.duration ??
        request.days ??
        "";


    const status =
        normalizeStatus(
            request.status
        );


    const userName =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const userEmail =
        user.email ||
        "N/A";


    const createdAt =
        request.createdAt
            ? new Date(
                Number(request.createdAt)
            ).toLocaleString()
            : "N/A";


    const approvedAt =
        request.approvedAt
            ? new Date(
                Number(request.approvedAt)
            ).toLocaleString()
            : "";


    const rejectedAt =
        request.rejectedAt
            ? new Date(
                Number(request.rejectedAt)
            ).toLocaleString()
            : "";


    // ==============================
    // STATUS TEXT
    // ==============================

    let statusText = "Pending";

    if (status === "approved") {
        statusText = "Approved";
    }

    if (status === "rejected") {
        statusText = "Rejected";
    }

    if (status === "processing") {
        statusText = "Processing";
    }

    if (status === "processing_error") {
        statusText = "Processing Error";
    }


    // ==============================
    // ACTIONS
    // ==============================

    let actions = "";

    if (status === "pending") {

        actions = `
            <div class="vip-request-actions">

                <button
                    type="button"
                    class="vipApproveBtn"
                    data-id="${id}">
                    Approve
                </button>

                <button
                    type="button"
                    class="vipRejectBtn"
                    data-id="${id}">
                    Reject
                </button>

            </div>
        `;
    }


    return `
        <div
            class="vip-request-card"
            data-id="${id}"
            data-status="${status}">

            <div class="vip-request-header">

                <div>

                    <h3>
                        ${escapeHTML(vipName)}
                    </h3>

                    <small>
                        Request ID:
                        ${id}
                    </small>

                </div>

                <span
                    class="status-badge status-${status}">
                    ${statusText}
                </span>

            </div>


            <div class="vip-request-user">

                <div class="info-row">

                    <span>User</span>

                    <strong>
                        ${escapeHTML(userName)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Email</span>

                    <strong>
                        ${escapeHTML(userEmail)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>UID</span>

                    <strong>
                        ${uid}
                    </strong>

                </div>

            </div>


            <div class="vip-request-details">

                <div class="info-row">

                    <span>VIP Price</span>

                    <strong>
                        ${formatMoney(price)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Daily Income</span>

                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Total Profit</span>

                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Duration</span>

                    <strong>
                        ${escapeHTML(duration)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Created At</span>

                    <strong>
                        ${createdAt}
                    </strong>

                </div>


                ${
                    approvedAt
                        ? `
                            <div class="info-row">

                                <span>
                                    Approved At
                                </span>

                                <strong>
                                    ${approvedAt}
                                </strong>

                            </div>
                          `
                        : ""
                }


                ${
                    rejectedAt
                        ? `
                            <div class="info-row">

                                <span>
                                    Rejected At
                                </span>

                                <strong>
                                    ${rejectedAt}
                                </strong>

                            </div>
                          `
                        : ""
                }

            </div>


            ${actions}

        </div>
    `;
}


// ======================================
// ACTIVATE VIP REQUEST BUTTONS
// ======================================

function activateVipRequestButtons() {

    // ==============================
    // APPROVE
    // ==============================

    document
        .querySelectorAll(".vipApproveBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {

                        alert(
                            "VIP request ID is missing."
                        );

                        return;
                    }


                    if (
                        typeof window.approveVipRequest ===
                        "function"
                    ) {

                        await window.approveVipRequest(
                            id
                        );

                    } else {

                        console.error(
                            "approveVipRequest() is not available yet."
                        );
                    }

                }
            );

        });


    // ==============================
    // REJECT
    // ==============================

    document
        .querySelectorAll(".vipRejectBtn")
        .forEach(button => {

            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;

                    if (!id) {

                        alert(
                            "VIP request ID is missing."
                        );

                        return;
                    }


                    if (
                        typeof window.rejectVipRequest ===
                        "function"
                    ) {

                        await window.rejectVipRequest(
                            id
                        );

                    } else {

                        console.error(
                            "rejectVipRequest() is not available yet."
                        );
                    }

                }
            );

        });
}


// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadVipRequests =
    loadVipRequests;

window.renderVipRequestCard =
    renderVipRequestCard;

window.activateVipRequestButtons =
    activateVipRequestButtons;

// ======================================
// ADMIN.JS - PART 8
// VIP APPROVE / REJECT
// Referral Bonus
// ======================================

const REFERRAL_BONUS_AMOUNT = 1000;


// ======================================
// GET VIP DURATION
// ======================================

function getVipDuration(request) {

    const directDuration =
        request.duration ??
        request.days ??
        request.vipDuration;

    if (
        directDuration !== undefined &&
        directDuration !== null &&
        String(directDuration).trim() !== ""
    ) {
        return numberValue(directDuration);
    }

    const dailyIncome =
        numberValue(
            request.dailyIncome ??
            request.daily
        );

    const totalProfit =
        numberValue(
            request.totalProfit ??
            request.profit
        );

    if (dailyIncome > 0 && totalProfit > 0) {
        return Math.ceil(totalProfit / dailyIncome);
    }

    return 0;
}


// ======================================
// APPROVE VIP REQUEST
// ======================================

async function approveVipRequest(id) {

    try {

        await window.waitForAdmin();

        if (!id) {
            alert("VIP request ID is missing.");
            return;
        }

        const confirmed = confirm(
            "Are you sure you want to approve this VIP purchase?"
        );

        if (!confirmed) return;


        // --------------------------------------
        // GET REQUEST
        // --------------------------------------

        const requestRef =
            ref(db, `vipPurchaseRequests/${id}`);

        const requestSnapshot =
            await get(requestRef);

        if (!requestSnapshot.exists()) {

            alert("VIP request not found.");
            return;
        }

        const request = requestSnapshot.val();

        const status =
            normalizeStatus(request.status);


        if (status !== "pending") {

            alert(
                `This VIP request is already ${status}.`
            );

            return;
        }


        // --------------------------------------
        // VALIDATE USER
        // --------------------------------------

        const uid = request.uid;

        if (!uid) {

            alert(
                "This VIP request has no user UID."
            );

            return;
        }


        // --------------------------------------
        // VIP DATA
        // --------------------------------------

        const vipName =
            request.vipName ||
            request.name ||
            request.planName ||
            "VIP Plan";

        const price =
            numberValue(
                request.price ??
                request.vipPrice ??
                request.amount
            );

        const dailyIncome =
            numberValue(
                request.dailyIncome ??
                request.daily
            );

        const totalProfit =
            numberValue(
                request.totalProfit ??
                request.profit
            );

        const duration =
            getVipDuration(request);


        if (!Number.isFinite(price) || price <= 0) {

            alert("Invalid VIP price.");
            return;
        }

        if (
            !Number.isFinite(dailyIncome) ||
            dailyIncome <= 0
        ) {

            alert("Invalid VIP daily income.");
            return;
        }

        if (
            !Number.isFinite(totalProfit) ||
            totalProfit <= 0
        ) {

            alert("Invalid VIP total profit.");
            return;
        }

        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {

            alert("Invalid VIP duration.");
            return;
        }


        // --------------------------------------
        // LOCK REQUEST
        // --------------------------------------

        const lockResult =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) return;

                    if (
                        normalizeStatus(
                            currentData.status
                        ) !== "pending"
                    ) {
                        return;
                    }

                    return {
                        ...currentData,

                        status: "processing",

                        processingAt: Date.now(),

                        processingBy:
                            currentAdmin?.uid ||
                            auth.currentUser?.uid ||
                            null
                    };
                }
            );


        if (!lockResult.committed) {

            alert(
                "This VIP request is already being processed."
            );

            return;
        }


        // --------------------------------------
        // GET USER
        // --------------------------------------

        const userRef =
            ref(db, `users/${uid}`);

        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            await update(
                requestRef,
                {
                    status: "rejected",

                    rejectedAt: Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null,

                    rejectionReason:
                        "User account not found.",

                    processingAt: null,

                    processingBy: null
                }
            );

            alert("User account not found.");

            return;
        }


        const user =
            userSnapshot.val();


        // ======================================
        // CREATE VIP BUYER
        // ======================================

        const now = Date.now();

        const vipBuyerRef =
            push(ref(db, "vipBuyers"));

        const vipBuyerId =
            vipBuyerRef.key;


        await set(
            vipBuyerRef,
            {

                uid: uid,

                vipName: vipName,

                price: price,

                dailyIncome: dailyIncome,

                totalProfit: totalProfit,

                duration: duration,

                startDate: now,

                lastClaim: now,

                claimedAmount: 0,

                status: "active",

                purchaseRequestId: id,

                createdAt: now,

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            }
        );


        // ======================================
        // IMPORTANT
        // ======================================
        // Ntitwongeramo dailyIncome kuri balance hano.
        //
        // User azajya abona dailyIncome gusa
        // igihe akoresheje Claim Daily Income
        // nyuma y'amasaha 24.
        // ======================================


        // ======================================
        // CREATE TRANSACTION
        // ======================================

        const transactionRef =
            push(ref(db, "transactions"));

        const transactionKey =
            transactionRef.key;


        await set(
            transactionRef,
            {

                uid: uid,

                type: "vip",

                amount: price,

                status: "approved",

                vipName: vipName,

                vipBuyerId: vipBuyerId,

                vipPurchaseRequestId: id,

                createdAt: now,

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null
            }
        );


        // ======================================
        // REFERRAL BONUS
        // ======================================

        const referredBy =
            user.referredBy;


        if (referredBy && referredBy !== uid) {

            try {

                const referralUserRef =
                    ref(
                        db,
                        `users/${referredBy}`
                    );


                await runTransaction(
                    referralUserRef,
                    currentData => {

                        if (!currentData) return;

                        const currentReferralEarnings =
                            numberValue(
                                currentData.referralEarnings
                            );


                        return {

                            ...currentData,

                            referralEarnings:
                                currentReferralEarnings +
                                REFERRAL_BONUS_AMOUNT
                        };
                    }
                );


                console.log(
                    `Referral bonus ${REFERRAL_BONUS_AMOUNT} RWF added to ${referredBy}`
                );

            } catch (referralError) {

                console.error(
                    "Referral bonus error:",
                    referralError
                );

                // VIP approval ntihagarara
                // kubera referral bonus gusa.
            }
        }


        // ======================================
        // FINALIZE REQUEST
        // ======================================

        await update(
            requestRef,
            {

                status: "approved",

                approvedAt: now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    null,

                vipBuyerId: vipBuyerId,

                transactionKey: transactionKey,

                processingAt: null,

                processingBy: null
            }
        );


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            "VIP purchase approved successfully."
        );


        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


        if (
            typeof window.loadVipRequests ===
            "function"
        ) {
            window.loadVipRequests();
        }


        if (
            typeof window.loadVipBuyers ===
            "function"
        ) {
            window.loadVipBuyers();
        }

    } catch (error) {

        console.error(
            "approveVipRequest error:",
            error
        );


        // --------------------------------------
        // MARK PROCESSING ERROR
        // --------------------------------------

        try {

            await update(
                ref(db, `vipPurchaseRequests/${id}`),
                {

                    status: "processing_error",

                    processingError:
                        error?.message ||
                        String(error),

                    errorAt: Date.now()
                }
            );

        } catch (updateError) {

            console.error(
                "Could not update VIP request error:",
                updateError
            );
        }


        alert(
            "Failed to approve VIP request: " +
            (
                error?.message ||
                "Unknown error"
            )
        );
    }
}



// ======================================
// REJECT VIP REQUEST
// ======================================

async function rejectVipRequest(id) {

    try {

        await window.waitForAdmin();

        if (!id) {

            alert(
                "VIP request ID is missing."
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to reject this VIP purchase?"
            );


        if (!confirmed) return;


        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        const result =
            await runTransaction(
                requestRef,
                currentData => {

                    if (!currentData) return;

                    if (
                        normalizeStatus(
                            currentData.status
                        ) !== "pending"
                    ) {
                        return;
                    }


                    return {

                        ...currentData,

                        status: "rejected",

                        rejectedAt: Date.now(),

                        rejectedBy:
                            currentAdmin?.uid ||
                            auth.currentUser?.uid ||
                            null
                    };
                }
            );


        if (!result.committed) {

            alert(
                "This VIP request is no longer pending."
            );

            return;
        }


        alert(
            "VIP purchase rejected successfully."
        );


        if (
            typeof window.loadDashboard ===
            "function"
        ) {
            window.loadDashboard();
        }


        if (
            typeof window.loadVipRequests ===
            "function"
        ) {
            window.loadVipRequests();
        }

    } catch (error) {

        console.error(
            "rejectVipRequest error:",
            error
        );


        alert(
            "Failed to reject VIP request: " +
            (
                error?.message ||
                "Unknown error"
            )
        );
    }
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.REFERRAL_BONUS_AMOUNT =
    REFERRAL_BONUS_AMOUNT;

window.getVipDuration =
    getVipDuration;

window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;

// ======================================
// ADMIN.JS - PART 9
// VIP BUYERS
// ======================================

async function loadVipBuyers() {

    try {

        await window.waitForAdmin();

        const vipBuyersRef =
            ref(db, "vipBuyers");


        onValue(
            vipBuyersRef,
            async (snapshot) => {

                const data =
                    snapshot.val() || {};


                // --------------------------------------
                // CONVERT OBJECT TO ARRAY
                // --------------------------------------

                const buyers =
                    Object.entries(data)
                        .map(([id, item]) => ({
                            id,
                            ...item
                        }));


                // --------------------------------------
                // SORT NEWEST FIRST
                // --------------------------------------

                buyers.sort(
                    (a, b) =>
                        (Number(b.approvedAt) || Number(b.createdAt) || 0) -
                        (Number(a.approvedAt) || Number(a.createdAt) || 0)
                );


                // --------------------------------------
                // CHECK ACTIVE / EXPIRED
                // --------------------------------------

                const now = Date.now();


                const processedBuyers =
                    buyers.map(buyer => {

                        const startDate =
                            Number(
                                buyer.startDate ??
                                buyer.approvedAt ??
                                buyer.createdAt ??
                                0
                            );


                        const duration =
                            numberValue(
                                buyer.duration ??
                                buyer.days
                            );


                        const durationMs =
                            duration *
                            24 *
                            60 *
                            60 *
                            1000;


                        let calculatedStatus =
                            normalizeStatus(
                                buyer.status
                            );


                        // If duration exists, calculate expiration
                        if (
                            startDate > 0 &&
                            duration > 0
                        ) {

                            const expirationDate =
                                startDate + durationMs;


                            if (now >= expirationDate) {

                                calculatedStatus =
                                    "expired";

                            } else {

                                calculatedStatus =
                                    "active";
                            }
                        }


                        return {
                            ...buyer,
                            calculatedStatus
                        };

                    });


                // --------------------------------------
                // COUNTERS
                // --------------------------------------

                const total =
                    processedBuyers.length;


                const active =
                    processedBuyers.filter(
                        buyer =>
                            buyer.calculatedStatus ===
                            "active"
                    ).length;


                const expired =
                    processedBuyers.filter(
                        buyer =>
                            buyer.calculatedStatus ===
                            "expired"
                    ).length;


                updateText(
                    "vipBuyerTotalCount",
                    total
                );


                updateText(
                    "vipBuyerActiveCount",
                    active
                );


                updateText(
                    "vipBuyerExpiredCount",
                    expired
                );


                // --------------------------------------
                // HTML CONTAINER
                // --------------------------------------

                const container =
                    document.getElementById(
                        "vipBuyerList"
                    );


                const emptyState =
                    document.getElementById(
                        "emptyVipBuyer"
                    );


                if (!container) {

                    console.error(
                        "vipBuyerList element not found."
                    );

                    return;
                }


                container.innerHTML = "";


                // --------------------------------------
                // EMPTY STATE
                // --------------------------------------

                if (processedBuyers.length === 0) {

                    if (emptyState) {
                        emptyState.style.display =
                            "block";
                    }

                    return;
                }


                if (emptyState) {

                    emptyState.style.display =
                        "none";
                }


                // --------------------------------------
                // LOAD USERS
                // --------------------------------------

                let users = {};

                try {

                    const usersSnapshot =
                        await get(
                            ref(db, "users")
                        );


                    if (usersSnapshot.exists()) {

                        users =
                            usersSnapshot.val() || {};
                    }

                } catch (userError) {

                    console.error(
                        "Failed to load users:",
                        userError
                    );
                }


                // --------------------------------------
                // RENDER VIP BUYERS
                // --------------------------------------

                processedBuyers.forEach(
                    buyer => {

                        const user =
                            users[buyer.uid] || {};


                        container.insertAdjacentHTML(
                            "beforeend",
                            renderVipBuyerCard(
                                buyer,
                                user
                            )
                        );

                    }
                );

            },

            error => {

                console.error(
                    "Error loading VIP buyers:",
                    error
                );


                const container =
                    document.getElementById(
                        "vipBuyerList"
                    );


                if (container) {

                    container.innerHTML = `
                        <div class="error-message">
                            Failed to load VIP buyers.
                        </div>
                    `;
                }

            }
        );

    } catch (error) {

        console.error(
            "loadVipBuyers error:",
            error
        );
    }
}



// ======================================
// RENDER VIP BUYER CARD
// ======================================

function renderVipBuyerCard(
    buyer,
    user = {}
) {

    const id =
        escapeHTML(
            buyer.id
        );


    const uid =
        escapeHTML(
            buyer.uid || "N/A"
        );


    const vipName =
        escapeHTML(
            buyer.vipName ||
            buyer.name ||
            buyer.planName ||
            "VIP Plan"
        );


    const price =
        numberValue(
            buyer.price ??
            buyer.vipPrice ??
            buyer.amount
        );


    const dailyIncome =
        numberValue(
            buyer.dailyIncome ??
            buyer.daily
        );


    const totalProfit =
        numberValue(
            buyer.totalProfit ??
            buyer.profit
        );


    const duration =
        numberValue(
            buyer.duration ??
            buyer.days
        );


    const claimedAmount =
        numberValue(
            buyer.claimedAmount
        );


    const startDate =
        Number(
            buyer.startDate ??
            buyer.approvedAt ??
            buyer.createdAt ??
            0
        );


    const lastClaim =
        Number(
            buyer.lastClaim || 0
        );


    const approvedAt =
        Number(
            buyer.approvedAt ||
            buyer.createdAt ||
            0
        );


    // --------------------------------------
    // EXPIRATION DATE
    // --------------------------------------

    let expirationDate = 0;

    if (
        startDate > 0 &&
        duration > 0
    ) {

        expirationDate =
            startDate +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );
    }


    // --------------------------------------
    // STATUS
    // --------------------------------------

    let status =
        buyer.calculatedStatus ||
        normalizeStatus(
            buyer.status
        );


    if (
        expirationDate > 0 &&
        Date.now() >= expirationDate
    ) {

        status = "expired";

    } else if (
        expirationDate > 0 &&
        Date.now() < expirationDate
    ) {

        status = "active";
    }


    let statusText = "Active";


    if (status === "expired") {

        statusText = "Expired";

    } else if (status === "active") {

        statusText = "Active";

    } else if (status === "pending") {

        statusText = "Pending";

    } else if (status === "processing") {

        statusText = "Processing";

    } else {

        statusText =
            escapeHTML(status);
    }


    // --------------------------------------
    // USER INFORMATION
    // --------------------------------------

    const userName =
        user.name ||
        user.fullName ||
        user.username ||
        "Unknown User";


    const userEmail =
        user.email ||
        "N/A";


    // --------------------------------------
    // DATE FORMATTER
    // --------------------------------------

    const formatDate =
        timestamp => {

            if (
                !timestamp ||
                !Number.isFinite(
                    Number(timestamp)
                )
            ) {

                return "N/A";
            }


            return new Date(
                Number(timestamp)
            ).toLocaleString();
        };


    // --------------------------------------
    // EXPIRATION DISPLAY
    // --------------------------------------

    const expirationText =
        expirationDate > 0
            ? formatDate(expirationDate)
            : "N/A";


    // --------------------------------------
    // RETURN CARD
    // --------------------------------------

    return `
        <div
            class="vip-buyer-card"
            data-id="${id}"
            data-status="${escapeHTML(status)}"
        >

            <div class="vip-buyer-header">

                <div>

                    <h3>
                        ${vipName}
                    </h3>

                    <small>
                        Buyer ID: ${id}
                    </small>

                </div>


                <span
                    class="status-badge status-${escapeHTML(status)}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="vip-buyer-user">

                <div class="info-row">
                    <span>User</span>
                    <strong>
                        ${escapeHTML(userName)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Email</span>
                    <strong>
                        ${escapeHTML(userEmail)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>UID</span>
                    <strong>
                        ${uid}
                    </strong>
                </div>

            </div>


            <div class="vip-buyer-details">

                <div class="info-row">
                    <span>VIP Price</span>
                    <strong>
                        ${formatMoney(price)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Daily Income</span>
                    <strong>
                        ${formatMoney(dailyIncome)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Total Profit</span>
                    <strong>
                        ${formatMoney(totalProfit)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Duration</span>
                    <strong>
                        ${escapeHTML(duration)} Days
                    </strong>
                </div>


                <div class="info-row">
                    <span>Claimed Amount</span>
                    <strong>
                        ${formatMoney(claimedAmount)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Start Date</span>
                    <strong>
                        ${formatDate(startDate)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Last Claim</span>
                    <strong>
                        ${formatDate(lastClaim)}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Expiration Date</span>
                    <strong>
                        ${expirationText}
                    </strong>
                </div>


                <div class="info-row">
                    <span>Approved At</span>
                    <strong>
                        ${formatDate(approvedAt)}
                    </strong>
                </div>

            </div>

        </div>
    `;
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadVipBuyers =
    loadVipBuyers;

window.renderVipBuyerCard =
// ======================================
// ADMIN.JS - PART 10
// USERS MANAGEMENT
// ======================================

async function loadUsers() {

    try {

        await window.waitForAdmin();

        const usersRef =
            ref(db, "users");


        onValue(
            usersRef,
            snapshot => {

                const data =
                    snapshot.val() || {};


                // --------------------------------------
                // CONVERT USERS OBJECT TO ARRAY
                // --------------------------------------

                const users =
                    Object.entries(data)
                        .map(([uid, item]) => ({
                            uid,
                            ...item
                        }));


                // --------------------------------------
                // SORT NEWEST USERS FIRST
                // --------------------------------------

                users.sort(
                    (a, b) =>
                        (Number(b.createdAt) || 0) -
                        (Number(a.createdAt) || 0)
                );


                // --------------------------------------
                // GET HTML ELEMENTS
                // --------------------------------------

                const container =
                    document.getElementById(
                        "usersList"
                    );


                const emptyState =
                    document.getElementById(
                        "emptyUsers"
                    );


                if (!container) {

                    console.error(
                        "usersList element not found."
                    );

                    return;
                }


                container.innerHTML = "";


                // --------------------------------------
                // EMPTY USERS
                // --------------------------------------

                if (users.length === 0) {

                    if (emptyState) {

                        emptyState.style.display =
                            "block";
                    }

                    return;
                }


                if (emptyState) {

                    emptyState.style.display =
                        "none";
                }


                // --------------------------------------
                // RENDER USERS
                // --------------------------------------

                users.forEach(user => {

                    container.insertAdjacentHTML(
                        "beforeend",
                        renderUserCard(user)
                    );

                });


                // --------------------------------------
                // ACTIVATE USER SEARCH
                // --------------------------------------

                activateUserSearch();

            },

            error => {

                console.error(
                    "Error loading users:",
                    error
                );


                const container =
                    document.getElementById(
                        "usersList"
                    );


                if (container) {

                    container.innerHTML = `
                        <div class="error-message">
                            Failed to load users.
                        </div>
                    `;
                }

            }
        );

    } catch (error) {

        console.error(
            "loadUsers error:",
            error
        );
    }
}



// ======================================
// RENDER USER CARD
// ======================================

function renderUserCard(user) {

    const uid =
        escapeHTML(
            user.uid || "N/A"
        );


    const name =
        escapeHTML(
            user.name ||
            user.fullName ||
            user.username ||
            "Unknown User"
        );


    const email =
        escapeHTML(
            user.email ||
            "N/A"
        );


    const phone =
        escapeHTML(
            user.phone ||
            user.phoneNumber ||
            "N/A"
        );


    const balance =
        numberValue(
            user.balance
        );


    const totalDeposits =
        numberValue(
            user.totalDeposits
        );


    const totalWithdrawals =
        numberValue(
            user.totalWithdrawals
        );


    const referralEarnings =
        numberValue(
            user.referralEarnings
        );


    const referralCode =
        escapeHTML(
            user.referralCode ||
            "N/A"
        );


    const referredBy =
        escapeHTML(
            user.referredBy ||
            "N/A"
        );


    const totalTransactions =
        numberValue(
            user.totalTransactions
        );


    const createdAt =
        user.createdAt
            ? new Date(
                Number(user.createdAt)
              ).toLocaleString()
            : "N/A";


    return `
        <div
            class="user-card"
            data-uid="${uid}"
            data-name="${escapeHTML(
                (
                    user.name ||
                    user.fullName ||
                    user.username ||
                    ""
                ).toLowerCase()
            )}"
            data-email="${escapeHTML(
                (user.email || "").toLowerCase()
            )}"
        >

            <div class="user-card-header">

                <div>

                    <h3>
                        ${name}
                    </h3>

                    <small>
                        UID: ${uid}
                    </small>

                </div>

            </div>


            <div class="user-info">

                <div class="info-row">

                    <span>Email</span>

                    <strong>
                        ${email}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Phone</span>

                    <strong>
                        ${phone}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Balance</span>

                    <strong>
                        ${formatMoney(balance)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Total Deposits</span>

                    <strong>
                        ${formatMoney(totalDeposits)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Total Withdrawals</span>

                    <strong>
                        ${formatMoney(totalWithdrawals)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Referral Earnings</span>

                    <strong>
                        ${formatMoney(referralEarnings)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Referral Code</span>

                    <strong>
                        ${referralCode}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Referred By</span>

                    <strong>
                        ${referredBy}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Total Transactions</span>

                    <strong>
                        ${totalTransactions}
                    </strong>

                </div>


                <div class="info-row">

                    <span>Created At</span>

                    <strong>
                        ${createdAt}
                    </strong>

                </div>

            </div>

        </div>
    `;
}



// ======================================
// USER SEARCH
// ======================================

function activateUserSearch() {

    const searchInput =
        document.getElementById(
            "userSearch"
        );


    if (!searchInput) {
        return;
    }


    // Avoid attaching duplicate listeners
    if (
        searchInput.dataset.searchActive ===
        "true"
    ) {
        return;
    }


    searchInput.dataset.searchActive =
        "true";


    searchInput.addEventListener(
        "input",
        () => {

            const search =
                searchInput.value
                    .trim()
                    .toLowerCase();


            document
                .querySelectorAll(
                    "#usersList .user-card"
                )
                .forEach(card => {

                    const name =
                        card.dataset.name ||
                        "";


                    const email =
                        card.dataset.email ||
                        "";


                    const uid =
                        (
                            card.dataset.uid ||
                            ""
                        ).toLowerCase();


                    const matches =
                        !search ||
                        name.includes(search) ||
                        email.includes(search) ||
                        uid.includes(search);


                    card.style.display =
                        matches
                            ? ""
                            : "none";

                });

        }
    );
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadUsers =
    loadUsers;

window.renderUserCard =
    renderUserCard;

window.activateUserSearch =
    activateUserSearch;


    // ======================================
// ADMIN.JS - PART 11
// TRANSACTIONS
// ======================================

async function loadTransactions() {

    try {

        await window.waitForAdmin();

        const transactionsRef =
            ref(db, "transactions");


        onValue(
            transactionsRef,
            snapshot => {

                const data =
                    snapshot.val() || {};


                // --------------------------------------
                // CONVERT OBJECT TO ARRAY
                // --------------------------------------

                const transactions =
                    Object.entries(data)
                        .map(([id, item]) => ({
                            id,
                            ...item
                        }));


                // --------------------------------------
                // SORT NEWEST FIRST
                // --------------------------------------

                transactions.sort(
                    (a, b) =>
                        (Number(b.createdAt) || 0) -
                        (Number(a.createdAt) || 0)
                );


                // --------------------------------------
                // HTML ELEMENTS
                // --------------------------------------

                const container =
                    document.getElementById(
                        "transactionList"
                    );


                const emptyState =
                    document.getElementById(
                        "emptyTransaction"
                    );


                if (!container) {

                    console.error(
                        "transactionList element not found."
                    );

                    return;
                }


                container.innerHTML = "";


                // --------------------------------------
                // EMPTY STATE
                // --------------------------------------

                if (transactions.length === 0) {

                    if (emptyState) {

                        emptyState.style.display =
                            "block";
                    }

                    return;
                }


                if (emptyState) {

                    emptyState.style.display =
                        "none";
                }


                // --------------------------------------
                // RENDER TRANSACTIONS
                // --------------------------------------

                transactions.forEach(
                    transaction => {

                        container.insertAdjacentHTML(
                            "beforeend",
                            renderTransactionCard(
                                transaction
                            )
                        );

                    }
                );


                // --------------------------------------
                // ACTIVATE SEARCH / FILTER
                // --------------------------------------

                activateTransactionSearch();

            },

            error => {

                console.error(
                    "Error loading transactions:",
                    error
                );


                const container =
                    document.getElementById(
                        "transactionList"
                    );


                if (container) {

                    container.innerHTML = `
                        <div class="error-message">
                            Failed to load transactions.
                        </div>
                    `;
                }

            }
        );

    } catch (error) {

        console.error(
            "loadTransactions error:",
            error
        );
    }
}



// ======================================
// RENDER TRANSACTION CARD
// ======================================

function renderTransactionCard(
    transaction
) {

    const id =
        escapeHTML(
            transaction.id || "N/A"
        );


    const uid =
        escapeHTML(
            transaction.uid || "N/A"
        );


    const type =
        normalizeStatus(
            transaction.type ||
            "unknown"
        );


    const status =
        normalizeStatus(
            transaction.status ||
            "pending"
        );


    const amount =
        numberValue(
            transaction.amount
        );


    const paymentMethod =
        escapeHTML(
            transaction.paymentMethod ||
            transaction.method ||
            "N/A"
        );


    const phone =
        escapeHTML(
            transaction.phone ||
            transaction.senderPhone ||
            transaction.receiverPhone ||
            transaction.withdrawPhone ||
            "N/A"
        );


    const transactionId =
        escapeHTML(
            transaction.transactionId ||
            "N/A"
        );


    const createdAt =
        transaction.createdAt
            ? new Date(
                Number(transaction.createdAt)
              ).toLocaleString()
            : "N/A";


    const approvedAt =
        transaction.approvedAt
            ? new Date(
                Number(transaction.approvedAt)
              ).toLocaleString()
            : "";


    const rejectedAt =
        transaction.rejectedAt
            ? new Date(
                Number(transaction.rejectedAt)
              ).toLocaleString()
            : "";


    // --------------------------------------
    // TRANSACTION TYPE TEXT
    // --------------------------------------

    let typeText = "Transaction";


    if (type === "deposit") {

        typeText = "Deposit";

    } else if (type === "withdraw") {

        typeText = "Withdraw";

    } else if (type === "vip") {

        typeText = "VIP Purchase";

    } else if (type === "profit") {

        typeText = "Profit";

    } else if (type === "bonus") {

        typeText = "Bonus";

    } else if (type === "referral") {

        typeText = "Referral Bonus";

    } else {

        typeText =
            escapeHTML(
                transaction.type ||
                "Transaction"
            );
    }


    // --------------------------------------
    // STATUS TEXT
    // --------------------------------------

    let statusText = "Pending";


    if (status === "approved") {

        statusText = "Approved";

    } else if (status === "rejected") {

        statusText = "Rejected";

    } else if (status === "pending") {

        statusText = "Pending";

    } else if (status === "processing") {

        statusText = "Processing";

    } else if (
        status === "processing_error"
    ) {

        statusText = "Processing Error";

    } else {

        statusText =
            escapeHTML(
                transaction.status ||
                "Pending"
            );
    }


    // --------------------------------------
    // EXTRA DATA
    // --------------------------------------

    const vipName =
        escapeHTML(
            transaction.vipName ||
            ""
        );


    const withdrawRequestId =
        escapeHTML(
            transaction.withdrawRequestId ||
            ""
        );


    const depositRequestId =
        escapeHTML(
            transaction.depositRequestId ||
            ""
        );


    // --------------------------------------
    // RETURN CARD
    // --------------------------------------

    return `
        <div
            class="transaction-card"
            data-id="${id}"
            data-uid="${uid.toLowerCase()}"
            data-type="${escapeHTML(type)}"
            data-status="${escapeHTML(status)}"
            data-search="${escapeHTML(
                (
                    (
                        transaction.uid || ""
                    ) +
                    " " +
                    (
                        transaction.transactionId || ""
                    ) +
                    " " +
                    (
                        transaction.type || ""
                    ) +
                    " " +
                    (
                        transaction.vipName || ""
                    )
                ).toLowerCase()
            )}"
        >

            <div class="transaction-card-header">

                <div>

                    <h3>
                        ${escapeHTML(typeText)}
                    </h3>

                    <small>
                        ID: ${id}
                    </small>

                </div>


                <span
                    class="status-badge status-${escapeHTML(status)}"
                >
                    ${statusText}
                </span>

            </div>


            <div class="transaction-amount">

                <span>
                    Amount
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <div class="transaction-info">

                <div class="info-row">

                    <span>
                        User UID
                    </span>

                    <strong>
                        ${uid}
                    </strong>

                </div>


                <div class="info-row">

                    <span>
                        Type
                    </span>

                    <strong>
                        ${escapeHTML(typeText)}
                    </strong>

                </div>


                <div class="info-row">

                    <span>
                        Status
                    </span>

                    <strong>
                        ${statusText}
                    </strong>

                </div>


                ${
                    transaction.transactionId
                    ? `
                    <div class="info-row">

                        <span>
                            Transaction ID
                        </span>

                        <strong>
                            ${transactionId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    transaction.paymentMethod ||
                    transaction.method
                    ? `
                    <div class="info-row">

                        <span>
                            Payment Method
                        </span>

                        <strong>
                            ${paymentMethod}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    transaction.phone ||
                    transaction.senderPhone ||
                    transaction.receiverPhone ||
                    transaction.withdrawPhone
                    ? `
                    <div class="info-row">

                        <span>
                            Phone
                        </span>

                        <strong>
                            ${phone}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    vipName
                    ? `
                    <div class="info-row">

                        <span>
                            VIP Plan
                        </span>

                        <strong>
                            ${vipName}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    withdrawRequestId
                    ? `
                    <div class="info-row">

                        <span>
                            Withdraw Request
                        </span>

                        <strong>
                            ${withdrawRequestId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    depositRequestId
                    ? `
                    <div class="info-row">

                        <span>
                            Deposit Request
                        </span>

                        <strong>
                            ${depositRequestId}
                        </strong>

                    </div>
                    `
                    : ""
                }


                <div class="info-row">

                    <span>
                        Created At
                    </span>

                    <strong>
                        ${createdAt}
                    </strong>

                </div>


                ${
                    approvedAt
                    ? `
                    <div class="info-row">

                        <span>
                            Approved At
                        </span>

                        <strong>
                            ${approvedAt}
                        </strong>

                    </div>
                    `
                    : ""
                }


                ${
                    rejectedAt
                    ? `
                    <div class="info-row">

                        <span>
                            Rejected At
                        </span>

                        <strong>
                            ${rejectedAt}
                        </strong>

                    </div>
                    `
                    : ""
                }

            </div>

        </div>
    `;
}



// ======================================
// TRANSACTION SEARCH + FILTER
// ======================================

function activateTransactionSearch() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );


    if (
        !searchInput &&
        !filterSelect
    ) {
        return;
    }


    // --------------------------------------
    // PREVENT DUPLICATE LISTENERS
    // --------------------------------------

    if (
        searchInput &&
        searchInput.dataset.searchActive !== "true"
    ) {

        searchInput.dataset.searchActive =
            "true";


        searchInput.addEventListener(
            "input",
            applyTransactionFilters
        );
    }


    if (
        filterSelect &&
        filterSelect.dataset.filterActive !== "true"
    ) {

        filterSelect.dataset.filterActive =
            "true";


        filterSelect.addEventListener(
            "change",
            applyTransactionFilters
        );
    }
}



// ======================================
// APPLY TRANSACTION FILTERS
// ======================================

function applyTransactionFilters() {

    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );


    const search =
        (
            searchInput?.value ||
            ""
        )
            .trim()
            .toLowerCase();


    const selectedFilter =
        normalizeStatus(
            filterSelect?.value ||
            "all"
        );


    const cards =
        document.querySelectorAll(
            "#transactionList .transaction-card"
        );


    cards.forEach(card => {

        const cardSearch =
            (
                card.dataset.search ||
                ""
            ).toLowerCase();


        const cardType =
            normalizeStatus(
                card.dataset.type ||
                ""
            );


        const cardStatus =
            normalizeStatus(
                card.dataset.status ||
                ""
            );


        // --------------------------------------
        // SEARCH MATCH
        // --------------------------------------

        const searchMatch =
            !search ||
            cardSearch.includes(search);


        // --------------------------------------
        // FILTER MATCH
        // --------------------------------------

        let filterMatch = true;


        if (
            selectedFilter &&
            selectedFilter !== "all"
        ) {

            if (
                selectedFilter === "approved" ||
                selectedFilter === "rejected" ||
                selectedFilter === "pending" ||
                selectedFilter === "processing"
            ) {

                filterMatch =
                    cardStatus ===
                    selectedFilter;

            } else {

                filterMatch =
                    cardType ===
                    selectedFilter;
            }
        }


        // --------------------------------------
        // DISPLAY
        // --------------------------------------

        card.style.display =
            searchMatch &&
            filterMatch
                ? ""
                : "none";

    });
}



// ======================================
// EXPOSE FUNCTIONS
// ======================================

window.loadTransactions =
    loadTransactions;

window.renderTransactionCard =
    renderTransactionCard;

window.activateTransactionSearch =
    activateTransactionSearch;

window.applyTransactionFilters =
    applyTransactionFilters;
    

