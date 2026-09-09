// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 1 — ADMIN AUTH + NAVIGATION
// CURRENCY: RWF / FRW
// ==========================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ==========================================
// GLOBAL ADMIN STATE
// ==========================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise = new Promise((resolve) => {
    resolveAdminReady = resolve;
});


// ==========================================
// LISTENER STORAGE
// Prevent duplicate Firebase listeners
// ==========================================

const listeners = {};


// Make available to other parts
window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    readyPromise: adminReadyPromise

};


window.waitForAdmin = function () {
    return adminReadyPromise;
};


// ==========================================
// DOM ELEMENTS
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
// OPEN PAGE
// ==========================================

function openPage(pageName) {

    if (!pageName) return;


    // Hide every section
    sections.forEach((section) => {

        section.style.display = "none";

        section.classList.remove("active");

    });


    // Remove active menu
    menuLinks.forEach((link) => {

        link.classList.remove("active");

    });


    // Find requested section
    const selectedSection =
        document.getElementById(
            `${pageName}Section`
        );


    if (selectedSection) {

        selectedSection.style.display = "block";

        selectedSection.classList.add("active");

    } else {

        console.warn(
            "ADMIN SECTION NOT FOUND:",
            `${pageName}Section`
        );

    }


    // Find menu link
    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");

    }


    // Page title
    if (pageTitle) {

        let title =
            activeLink?.getAttribute("data-title");


        if (!title) {

            const titleMap = {

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


            title =
                titleMap[pageName] ||
                pageName;

        }


        pageTitle.textContent = title;

    }


    // Close mobile sidebar
    if (sidebar) {

        sidebar.classList.remove("active");

    }


    console.log(
        "ADMIN PAGE:",
        pageName
    );
}


// Make globally available
window.openPage = openPage;


// ==========================================
// MENU LINKS
// ==========================================

menuLinks.forEach((link) => {

    link.addEventListener("click", (event) => {

        event.preventDefault();

        const page =
            link.getAttribute("data-page");

        if (page) {

            openPage(page);

        }

    });

});


// ==========================================
// MOBILE MENU
// ==========================================

if (menuBtn) {

    menuBtn.addEventListener("click", () => {

        if (!sidebar) return;

        sidebar.classList.toggle("active");

    });

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                const confirmed =
                    confirm(
                        "Are you sure you want to logout?"
                    );


                if (!confirmed) return;


                await signOut(auth);


                window.location.href =
                    "login.html";


            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );


                alert(
                    "Logout failed:\n" +
                    (error.message ||
                        "Unknown error")
                );

            }

        }
    );

}


// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

onAuthStateChanged(
    auth,
    async (user) => {

        try {

            showLoadingScreen();


            // ----------------------------------
            // USER NOT LOGGED IN
            // ----------------------------------

            if (!user) {

                console.warn(
                    "No authenticated user."
                );


                window.location.href =
                    "login.html";

                return;

            }


            console.log(
                "Checking administrator:",
                user.uid
            );


            // ----------------------------------
            // CHECK ADMIN RECORD
            // ----------------------------------

            const adminRef =
                ref(
                    db,
                    `admins/${user.uid}`
                );


            const adminSnapshot =
                await get(adminRef);


            // ----------------------------------
            // NOT ADMIN
            // ----------------------------------

            if (!adminSnapshot.exists()) {

                console.warn(
                    "ACCESS DENIED:",
                    user.uid
                );


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

                email:
                    user.email || "",

                ...adminData

            };


            adminReady = true;


            resolveAdminReady(
                currentAdmin
            );


            // ----------------------------------
            // ADMIN NAME
            // ----------------------------------

            if (adminName) {

                adminName.textContent =

                    currentAdmin.name ||

                    currentAdmin.displayName ||

                    currentAdmin.username ||

                    "Administrator";

            }


            // ----------------------------------
            // ADMIN EMAIL
            // ----------------------------------

            if (adminEmail) {

                adminEmail.textContent =
                    user.email || "";

            }


            // ----------------------------------
            // SHOW ADMIN PANEL
            // ----------------------------------

            hideLoadingScreen();


            console.log(
                "ADMIN AUTHENTICATED:",
                currentAdmin
            );


            // ----------------------------------
            // INITIALIZE AVAILABLE MODULES
            // ----------------------------------

            if (
                typeof window.loadDashboard ===
                "function"
            ) {

                window.loadDashboard();

            }


            if (
                typeof window.loadDeposits ===
                "function"
            ) {

                window.loadDeposits();

            }


            if (
                typeof window.loadWithdraws ===
                "function"
            ) {

                window.loadWithdraws();

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


            if (
                typeof window.loadBonusRequests ===
                "function"
            ) {

                window.loadBonusRequests();

            }


            if (
                typeof window.loadUsers ===
                "function"
            ) {

                window.loadUsers();

            }


            if (
                typeof window.loadTransactions ===
                "function"
            ) {

                window.loadTransactions();

            }


        } catch (error) {

            console.error(
                "ADMIN AUTH ERROR:",
                error
            );


            hideLoadingScreen();


            alert(
                "Erreur de connexion administrateur:\n" +
                (error.message ||
                    "Unknown error")
            );

        }

    }
);


// ==========================================
// DEFAULT PAGE
// ==========================================

openPage("dashboard");


console.log(
    "MONEY VAULT ADMIN.JS — PART 1 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 2 — DASHBOARD
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// COMMON HELPERS
// ==========================================

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (!element) return;

    element.textContent =
        value ?? "";

}


// ==========================================
// NUMBER HELPER
// ==========================================

function numberValue(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


// ==========================================
// STATUS HELPER
// ==========================================

function normalizeStatus(status) {

    return String(
        status ?? "pending"
    )
        .trim()
        .toLowerCase();

}


// ==========================================
// MONEY FORMAT
// FRW / RWF
// ==========================================

function formatMoney(amount) {

    const value =
        numberValue(amount);

    return value.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }
    ) + " RWF";

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(timestamp) {

    const value =
        numberValue(timestamp);

    if (!value) {

        return "N/A";

    }

    try {

        return new Date(value)
            .toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            });

    } catch (error) {

        return "N/A";

    }

}


// ==========================================
// HTML ESCAPE
// ==========================================

function escapeHTML(value) {

    return String(value ?? "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}


// ==========================================
// DASHBOARD CACHE
// ==========================================

let dashboardUsers = {};
let dashboardDeposits = {};
let dashboardWithdraws = {};
let dashboardTransactions = {};


// ==========================================
// DASHBOARD INITIALIZATION
// ==========================================

async function loadDashboard() {

    try {

        await window.waitForAdmin();


        console.log(
            "Loading Money Vault dashboard..."
        );


        // --------------------------------------
        // USERS LISTENER
        // --------------------------------------

        if (!listeners.dashboardUsers) {

            listeners.dashboardUsers =
                onValue(
                    ref(db, "users"),
                    (snapshot) => {

                        dashboardUsers =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard users error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // DEPOSITS LISTENER
        // --------------------------------------

        if (!listeners.dashboardDeposits) {

            listeners.dashboardDeposits =
                onValue(
                    ref(
                        db,
                        "depositRequests"
                    ),
                    (snapshot) => {

                        dashboardDeposits =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard deposits error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // WITHDRAWS LISTENER
        // --------------------------------------

        if (!listeners.dashboardWithdraws) {

            listeners.dashboardWithdraws =
                onValue(
                    ref(
                        db,
                        "withdrawRequests"
                    ),
                    (snapshot) => {

                        dashboardWithdraws =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard withdraws error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // TRANSACTIONS LISTENER
        // --------------------------------------

        if (!listeners.dashboardTransactions) {

            listeners.dashboardTransactions =
                onValue(
                    ref(
                        db,
                        "transactions"
                    ),
                    (snapshot) => {

                        dashboardTransactions =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDashboard();

                    },
                    (error) => {

                        console.error(
                            "Dashboard transactions error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // FIRST RENDER
        // --------------------------------------

        renderDashboard();


    } catch (error) {

        console.error(
            "DASHBOARD ERROR:",
            error
        );

    }

}


// ==========================================
// RENDER DASHBOARD
// ==========================================

function renderDashboard() {


    // ======================================
    // USERS
    // ======================================

    const users =
        dashboardUsers || {};

    const totalUsers =
        Object.keys(users).length;


    let systemBalance = 0;


    Object.values(users)
        .forEach((user) => {

            if (!user) return;

            systemBalance +=
                numberValue(
                    user.balance
                );

        });


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


    // ======================================
    // DEPOSITS
    // ======================================

    const deposits =
        dashboardDeposits || {};


    let pendingDeposits = 0;

    let approvedDeposits = 0;

    let rejectedDeposits = 0;

    let totalApprovedDeposits = 0;


    Object.values(deposits)
        .forEach((deposit) => {

            if (!deposit) return;


            const status =
                normalizeStatus(
                    deposit.status
                );


            const amount =
                numberValue(
                    deposit.amount
                );


            if (
                status ===
                "pending"
            ) {

                pendingDeposits++;

            }


            else if (
                status ===
                "approved"
            ) {

                approvedDeposits++;

                totalApprovedDeposits +=
                    amount;

            }


            else if (
                status ===
                "rejected"
            ) {

                rejectedDeposits++;

            }

        });


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


    // ======================================
    // WITHDRAWS
    // ======================================

    const withdraws =
        dashboardWithdraws || {};


    let pendingWithdraws = 0;

    let approvedWithdraws = 0;

    let rejectedWithdraws = 0;

    let totalApprovedWithdraws = 0;


    Object.values(withdraws)
        .forEach((withdraw) => {

            if (!withdraw) return;


            const status =
                normalizeStatus(
                    withdraw.status
                );


            const amount =
                numberValue(
                    withdraw.amount
                );


            if (
                status ===
                "pending"
            ) {

                pendingWithdraws++;

            }


            else if (
                status ===
                "approved"
            ) {

                approvedWithdraws++;

                totalApprovedWithdraws +=
                    amount;

            }


            else if (
                status ===
                "rejected"
            ) {

                rejectedWithdraws++;

            }

        });


    updateText(
        "dashboardTotalWithdraws",
        formatMoney(
            totalApprovedWithdraws
        )
    );


    // ======================================
    // RECENT TRANSACTIONS
    // ======================================

    const transactions =
        Object.entries(
            dashboardTransactions || {}
        )
        .map(
            ([id, transaction]) => ({
                id,
                ...(transaction || {})
            })
        );


    transactions.sort(
        (a, b) => {

            const dateA =
                numberValue(
                    a.createdAt ??
                    a.approvedAt ??
                    a.timestamp
                );

            const dateB =
                numberValue(
                    b.createdAt ??
                    b.approvedAt ??
                    b.timestamp
                );

            return dateB - dateA;

        }
    );


    renderRecentTransactions(
        transactions.slice(0, 10)
    );


    console.log(
        "Dashboard rendered:",
        {
            totalUsers,
            totalApprovedDeposits,
            totalApprovedWithdraws
        }
    );

}


// ==========================================
// RECENT ACTIVITY
// ==========================================

function renderRecentTransactions(
    transactions = []
) {

    const container =
        document.getElementById(
            "recentActivity"
        );


    if (!container) return;


    // --------------------------------------
    // EMPTY
    // --------------------------------------

    if (
        !transactions ||
        transactions.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    <i class="fas fa-receipt"></i>
                </div>

                <p>No Recent Activity</p>

            </div>

        `;

        return;

    }


    // --------------------------------------
    // RENDER
    // --------------------------------------

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


                const date =
                    transaction.createdAt ??
                    transaction.approvedAt ??
                    transaction.timestamp;


                // ------------------------------
                // TITLE
                // ------------------------------

                let title =
                    "Transaction";


                let icon =
                    "fa-exchange-alt";


                if (
                    type ===
                    "deposit"
                ) {

                    title =
                        "Deposit";

                    icon =
                        "fa-arrow-down";

                }


                else if (
                    type ===
                    "withdraw"
                ) {

                    title =
                        "Withdraw";

                    icon =
                        "fa-arrow-up";

                }


                else if (
                    type ===
                    "vip"
                ) {

                    title =
                        "VIP Purchase";

                    icon =
                        "fa-crown";

                }


                else if (
                    type ===
                    "profit"
                ) {

                    title =
                        "VIP Profit";

                    icon =
                        "fa-chart-line";

                }


                else if (
                    type ===
                    "bonus"
                ) {

                    title =
                        "Bonus";

                    icon =
                        "fa-gift";

                }


                else if (
                    type ===
                    "referral"
                ) {

                    title =
                        "Referral Bonus";

                    icon =
                        "fa-users";

                }


                // ------------------------------
                // STATUS
                // ------------------------------

                let statusText =
                    "Pending";


                if (
                    status ===
                    "approved"
                ) {

                    statusText =
                        "Approved";

                }


                else if (
                    status ===
                    "rejected"
                ) {

                    statusText =
                        "Rejected";

                }


                else if (
                    status ===
                    "processing"
                ) {

                    statusText =
                        "Processing";

                }


                else if (
                    status ===
                    "processing_error"
                ) {

                    statusText =
                        "Processing Error";

                }


                // ------------------------------
                // AMOUNT SIGN
                // ------------------------------

                let amountClass =
                    "";


                let amountPrefix =
                    "";


                if (
                    type ===
                    "deposit" ||
                    type ===
                    "profit" ||
                    type ===
                    "bonus" ||
                    type ===
                    "referral"
                ) {

                    amountPrefix =
                        "+";

                    amountClass =
                        "positive";

                }


                else if (
                    type ===
                    "withdraw" ||
                    type ===
                    "vip"
                ) {

                    amountPrefix =
                        "-";

                    amountClass =
                        "negative";

                }


                return `

                    <div
                        class="activity-item"
                        data-transaction-id="${escapeHTML(transaction.id)}"
                    >

                        <div class="activity-icon">

                            <i
                                class="fas ${icon}"
                            ></i>

                        </div>


                        <div class="activity-info">

                            <strong>
                                ${escapeHTML(title)}
                            </strong>

                            <small>
                                ${escapeHTML(
                                    formatDate(date)
                                )}
                            </small>

                            <small>
                                Status:
                                ${escapeHTML(
                                    statusText
                                )}
                            </small>

                        </div>


                        <div
                            class="activity-amount ${amountClass}"
                        >

                            ${amountPrefix}
                            ${formatMoney(amount)}

                        </div>

                    </div>

                `;

            })
            .join("");

}


// ==========================================
// REFRESH DASHBOARD
// ==========================================

const refreshDashboard =
    document.getElementById(
        "refreshDashboard"
    );


if (refreshDashboard) {

    refreshDashboard.addEventListener(
        "click",
        async () => {

            try {

                refreshDashboard.disabled =
                    true;


                refreshDashboard.classList
                    .add("loading");


                // Read fresh data once.
                // Existing listeners remain untouched.

                const [
                    usersSnapshot,
                    depositsSnapshot,
                    withdrawsSnapshot,
                    transactionsSnapshot
                ] = await Promise.all([

                    get(
                        ref(
                            db,
                            "users"
                        )
                    ),

                    get(
                        ref(
                            db,
                            "depositRequests"
                        )
                    ),

                    get(
                        ref(
                            db,
                            "withdrawRequests"
                        )
                    ),

                    get(
                        ref(
                            db,
                            "transactions"
                        )
                    )

                ]);


                dashboardUsers =
                    usersSnapshot.exists()
                        ? usersSnapshot.val() || {}
                        : {};


                dashboardDeposits =
                    depositsSnapshot.exists()
                        ? depositsSnapshot.val() || {}
                        : {};


                dashboardWithdraws =
                    withdrawSnapshotSafe(
                        withdrawsSnapshot
                    );


                dashboardTransactions =
                    transactionsSnapshot.exists()
                        ? transactionsSnapshot.val() || {}
                        : {};


                renderDashboard();


            } catch (error) {

                console.error(
                    "REFRESH DASHBOARD ERROR:",
                    error
                );


                alert(
                    "Dashboard refresh failed:\n" +
                    (
                        error.message ||
                        "Unknown error"
                    )
                );

            } finally {

                refreshDashboard.disabled =
                    false;

                refreshDashboard.classList
                    .remove("loading");

            }

        }
    );

}


// ==========================================
// SAFE WITHDRAW SNAPSHOT
// ==========================================

function withdrawSnapshotSafe(
    snapshot
) {

    if (!snapshot) {

        return {};

    }


    return snapshot.exists()
        ? snapshot.val() || {}
        : {};

}


// ==========================================
// OPTIONAL QUICK REFRESH BUTTON
// ==========================================

const refreshDashboardQuick =
    document.getElementById(
        "refreshDashboardQuick"
    );


if (refreshDashboardQuick) {

    refreshDashboardQuick.addEventListener(
        "click",
        async () => {

            if (
                typeof refreshDashboard
                !== "undefined" &&
                refreshDashboard
            ) {

                refreshDashboard.click();

            }

        }
    );

}


// ==========================================
// DASHBOARD QUICK NAVIGATION
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
// GLOBAL EXPORTS
// ==========================================

window.loadDashboard =
    loadDashboard;


window.renderDashboard =
    renderDashboard;


window.renderRecentTransactions =
    renderRecentTransactions;


window.updateText =
    updateText;


window.numberValue =
    numberValue;


window.normalizeStatus =
    normalizeStatus;


window.formatMoney =
    formatMoney;


window.formatDate =
    formatDate;


window.escapeHTML =
    escapeHTML;


console.log(
    "MONEY VAULT ADMIN.JS — PART 2 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 3 — DEPOSIT REQUESTS
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// DEPOSIT DATA
// ==========================================

let allDepositRequests = [];
let depositUsers = {};


// ==========================================
// LOAD DEPOSITS
// ==========================================

async function loadDeposits() {

    try {

        await window.waitForAdmin();

        console.log(
            "Loading deposit requests..."
        );


        // --------------------------------------
        // USERS LISTENER
        // --------------------------------------

        if (!listeners.depositUsers) {

            listeners.depositUsers =
                onValue(
                    ref(db, "users"),
                    (snapshot) => {

                        depositUsers =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};

                        renderDepositRequests();

                    },
                    (error) => {

                        console.error(
                            "Deposit users listener error:",
                            error
                        );

                    }
                );

        }


        // --------------------------------------
        // DEPOSIT LISTENER
        // --------------------------------------

        if (!listeners.depositRequests) {

            listeners.depositRequests =
                onValue(
                    ref(
                        db,
                        "depositRequests"
                    ),
                    (snapshot) => {

                        const data =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        allDepositRequests =
                            Object.entries(data)
                                .map(
                                    ([id, request]) => ({

                                        id,

                                        ...(request || {})

                                    })
                                );


                        // Newest first
                        allDepositRequests.sort(
                            (a, b) => {

                                const dateA =
                                    numberValue(
                                        a.createdAt ??
                                        a.timestamp
                                    );

                                const dateB =
                                    numberValue(
                                        b.createdAt ??
                                        b.timestamp
                                    );

                                return dateB - dateA;

                            }
                        );


                        renderDepositRequests();

                    },
                    (error) => {

                        console.error(
                            "Deposit requests listener error:",
                            error
                        );


                        const container =
                            document.getElementById(
                                "depositList"
                            );


                        if (container) {

                            container.innerHTML = `

                                <div class="error-message">

                                    <i class="fas fa-triangle-exclamation"></i>

                                    <p>
                                        Failed to load deposit requests.
                                    </p>

                                </div>

                            `;

                        }

                    }
                );

        }


        // --------------------------------------
        // INITIAL RENDER
        // --------------------------------------

        renderDepositRequests();


    } catch (error) {

        console.error(
            "loadDeposits error:",
            error
        );

    }

}


// ==========================================
// RENDER DEPOSIT REQUESTS
// ==========================================

function renderDepositRequests() {

    const container =
        document.getElementById(
            "depositList"
        );


    const emptyState =
        document.getElementById(
            "emptyDeposit"
        );


    if (!container) {

        console.warn(
            "depositList element not found."
        );

        return;

    }


    const searchInput =
        document.getElementById(
            "depositSearch"
        );


    const filterSelect =
        document.getElementById(
            "depositFilter"
        );


    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    const selectedFilter =
        normalizeStatus(
            filterSelect?.value || "all"
        );


    // ======================================
    // COUNTERS
    // ======================================

    let pendingCount = 0;

    let approvedCount = 0;

    let rejectedCount = 0;


    allDepositRequests.forEach(
        (request) => {

            const status =
                normalizeStatus(
                    request.status
                );


            if (
                status ===
                "pending"
            ) {

                pendingCount++;

            }


            else if (
                status ===
                "approved"
            ) {

                approvedCount++;

            }


            else if (
                status ===
                "rejected"
            ) {

                rejectedCount++;

            }

        }
    );


    updateText(
        "depositTotalCount",
        allDepositRequests.length
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


    // ======================================
    // SEARCH + FILTER
    // ======================================

    const filteredRequests =
        allDepositRequests.filter(
            (request) => {

                const status =
                    normalizeStatus(
                        request.status
                    );


                // Status filter
                if (
                    selectedFilter !==
                    "all" &&
                    status !==
                    selectedFilter
                ) {

                    return false;

                }


                if (!search) {

                    return true;

                }


                const uid =
                    String(
                        request.uid || ""
                    )
                    .toLowerCase();


                const user =
                    depositUsers[
                        request.uid
                    ] || {};


                const name =
                    String(
                        user.name ||
                        user.fullName ||
                        user.username ||
                        request.name ||
                        ""
                    )
                    .toLowerCase();


                const email =
                    String(
                        user.email ||
                        request.email ||
                        ""
                    )
                    .toLowerCase();


                const phone =
                    String(
                        user.phone ||
                        user.phoneNumber ||
                        request.phone ||
                        request.receiverPhone ||
                        ""
                    )
                    .toLowerCase();


                const transactionId =
                    String(
                        request.transactionId ||
                        request.txId ||
                        request.transactionID ||
                        ""
                    )
                    .toLowerCase();


                const paymentMethod =
                    String(
                        request.paymentMethod ||
                        request.method ||
                        ""
                    )
                    .toLowerCase();


                const requestId =
                    String(
                        request.id || ""
                    )
                    .toLowerCase();


                return (

                    uid.includes(search) ||

                    name.includes(search) ||

                    email.includes(search) ||

                    phone.includes(search) ||

                    transactionId.includes(search) ||

                    paymentMethod.includes(search) ||

                    requestId.includes(search)

                );

            }
        );


    // ======================================
    // EMPTY RESULT
    // ======================================

    container.innerHTML = "";


    if (
        filteredRequests.length ===
        0
    ) {

        if (emptyState) {

            emptyState.style.display =
                "block";


            emptyState.innerHTML = `

                <i class="fas fa-inbox"></i>

                <p>
                    ${
                        allDepositRequests.length === 0
                            ? "No deposit requests found."
                            : "No deposits match your search."
                    }
                </p>

            `;

        }


        return;

    }


    if (emptyState) {

        emptyState.style.display =
            "none";

    }


    // ======================================
    // RENDER CARDS
    // ======================================

    container.innerHTML =
        filteredRequests
            .map(
                (request) => {

                    const user =
                        depositUsers[
                            request.uid
                        ] || {};


                    return renderDepositCard(
                        request,
                        user
                    );

                }
            )
            .join("");


    activateDepositButtons();

}


// ==========================================
// RENDER ONE DEPOSIT CARD
// ==========================================

function renderDepositCard(
    request,
    user = {}
) {

    const id =
        request.id || "";


    const uid =
        request.uid || "";


    const status =
        normalizeStatus(
            request.status
        );


    const amount =
        numberValue(
            request.amount
        );


    const userName =
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
        request.phone ||
        request.receiverPhone ||
        "N/A";


    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        "N/A";


    const transactionId =
        request.transactionId ||
        request.txId ||
        request.transactionID ||
        "N/A";


    const createdAt =
        request.createdAt ??
        request.timestamp ??
        0;


    const approvedAt =
        request.approvedAt ||
        0;


    const rejectedAt =
        request.rejectedAt ||
        0;


    const proofUrl =
        request.proofUrl ||
        request.proof ||
        request.receiptUrl ||
        request.screenshotUrl ||
        "";


    // ======================================
    // STATUS LABEL
    // ======================================

    let statusText =
        "Pending";


    if (
        status ===
        "approved"
    ) {

        statusText =
            "Approved";

    }


    else if (
        status ===
        "rejected"
    ) {

        statusText =
            "Rejected";

    }


    else if (
        status ===
        "processing"
    ) {

        statusText =
            "Processing";

    }


    else if (
        status ===
        "processing_error"
    ) {

        statusText =
            "Processing Error";

    }


    // ======================================
    // ACTIONS
    // ======================================

    let actions = "";


    if (
        status ===
        "pending"
    ) {

        actions = `

            <div class="request-actions">

                <button
                    type="button"
                    class="approve-deposit-btn"
                    data-id="${escapeHTML(id)}"
                >

                    <i class="fas fa-check"></i>

                    Approve

                </button>


                <button
                    type="button"
                    class="reject-deposit-btn"
                    data-id="${escapeHTML(id)}"
                >

                    <i class="fas fa-times"></i>

                    Reject

                </button>

            </div>

        `;

    }


    // ======================================
    // PROOF
    // ======================================

    let proofHTML = "";


    if (proofUrl) {

        proofHTML = `

            <div class="deposit-proof">

                <span>
                    <i class="fas fa-image"></i>
                    Payment Proof
                </span>

                <a
                    href="${escapeHTML(proofUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                >

                    View Proof

                </a>

            </div>

        `;

    }


    // ======================================
    // CARD
    // ======================================

    return `

        <div
            class="deposit-card"
            data-id="${escapeHTML(id)}"
            data-uid="${escapeHTML(uid)}"
            data-status="${escapeHTML(status)}"
        >


            <!-- ==========================
                 HEADER
            =========================== -->

            <div class="deposit-card-header">

                <div class="deposit-user">

                    <div class="user-avatar">

                        <i class="fas fa-user"></i>

                    </div>


                    <div>

                        <strong>
                            ${escapeHTML(userName)}
                        </strong>

                        <small>
                            ${escapeHTML(email)}
                        </small>

                    </div>

                </div>


                <span
                    class="status-badge ${escapeHTML(status)}"
                >

                    ${escapeHTML(statusText)}

                </span>

            </div>


            <!-- ==========================
                 AMOUNT
            =========================== -->

            <div class="deposit-amount">

                <span>
                    Deposit Amount
                </span>

                <strong>
                    ${formatMoney(amount)}
                </strong>

            </div>


            <!-- ==========================
                 DETAILS
            =========================== -->

            <div class="deposit-details">


                <div class="detail-item">

                    <span>
                        <i class="fas fa-fingerprint"></i>
                        User UID
                    </span>

                    <strong>
                        ${escapeHTML(uid || "N/A")}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-mobile-screen"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-credit-card"></i>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(paymentMethod)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-receipt"></i>
                        Transaction ID
                    </span>

                    <strong>
                        ${escapeHTML(transactionId)}
                    </strong>

                </div>


                <div class="detail-item">

                    <span>
                        <i class="fas fa-calendar"></i>
                        Request Date
                    </span>

                    <strong>
                        ${escapeHTML(
                            formatDate(createdAt)
                        )}
                    </strong>

                </div>


                ${
                    approvedAt
                        ? `

                        <div class="detail-item">

                            <span>
                                <i class="fas fa-check-circle"></i>
                                Approved Date
                            </span>

                            <strong>
                                ${escapeHTML(
                                    formatDate(
                                        approvedAt
                                    )
                                )}
                            </strong>

                        </div>

                        `
                        : ""
                }


                ${
                    rejectedAt
                        ? `

                        <div class="detail-item">

                            <span>
                                <i class="fas fa-times-circle"></i>
                                Rejected Date
                            </span>

                            <strong>
                                ${escapeHTML(
                                    formatDate(
                                        rejectedAt
                                    )
                                )}
                            </strong>

                        </div>

                        `
                        : ""
                }

            </div>


            ${proofHTML}


            <!-- ==========================
                 REQUEST ID
            =========================== -->

            <div class="request-id">

                <span>
                    Request ID:
                </span>

                <code>
                    ${escapeHTML(id)}
                </code>

            </div>


            ${actions}

        </div>

    `;

}


// ==========================================
// ACTIVATE DEPOSIT BUTTONS
// ==========================================

function activateDepositButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".approve-deposit-btn"
        );


    approveButtons.forEach(
        (button) => {

            if (
                button.dataset.bound ===
                "true"
            ) {

                return;

            }


            button.dataset.bound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        alert(
                            "Deposit request ID is missing."
                        );

                        return;

                    }


                    if (
                        typeof window
                            .approveDeposit ===
                        "function"
                    ) {

                        await window
                            .approveDeposit(id);

                    }

                }
            );

        }
    );


    const rejectButtons =
        document.querySelectorAll(
            ".reject-deposit-btn"
        );


    rejectButtons.forEach(
        (button) => {

            if (
                button.dataset.bound ===
                "true"
            ) {

                return;

            }


            button.dataset.bound =
                "true";


            button.addEventListener(
                "click",
                async () => {

                    const id =
                        button.dataset.id;


                    if (!id) {

                        alert(
                            "Deposit request ID is missing."
                        );

                        return;

                    }


                    if (
                        typeof window
                            .rejectDeposit ===
                        "function"
                    ) {

                        await window
                            .rejectDeposit(id);

                    }

                }
            );

        }
    );

}


// ==========================================
// SEARCH
// ==========================================

const depositSearch =
    document.getElementById(
        "depositSearch"
    );


if (depositSearch) {

    depositSearch.addEventListener(
        "input",
        () => {

            renderDepositRequests();

        }
    );

}


// ==========================================
// FILTER
// ==========================================

const depositFilter =
    document.getElementById(
        "depositFilter"
    );


if (depositFilter) {

    depositFilter.addEventListener(
        "change",
        () => {

            renderDepositRequests();

        }
    );

}


// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.loadDeposits =
    loadDeposits;


window.renderDepositRequests =
    renderDepositRequests;


window.renderDepositCard =
    renderDepositCard;


window.activateDepositButtons =
    activateDepositButtons;


window.allDepositRequests =
    allDepositRequests;


console.log(
    "MONEY VAULT ADMIN.JS — PART 3 READY"
);

// ==========================================
// MONEY VAULT - ADMIN.JS
// PART 4 — APPROVE / REJECT DEPOSIT
// CURRENCY: RWF / FRW
// ==========================================


// ==========================================
// APPROVE DEPOSIT
// ==========================================

async function approveDeposit(id) {

    try {

        await window.waitForAdmin();


        if (!id) {

            alert(
                "Deposit request ID is missing."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to approve this deposit?"
            );


        if (!confirmed) return;


        // ======================================
        // REQUEST REFERENCE
        // ======================================

        const depositRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        // ======================================
        // READ REQUEST
        // ======================================

        const snapshot =
            await get(depositRef);


        if (!snapshot.exists()) {

            alert(
                "Deposit request not found."
            );

            return;

        }


        const deposit =
            snapshot.val() || {};


        const currentStatus =
            normalizeStatus(
                deposit.status
            );


        // ======================================
        // ONLY PENDING CAN BE APPROVED
        // ======================================

        if (
            currentStatus !==
            "pending"
        ) {

            alert(
                `This deposit is already ${currentStatus}.`
            );

            return;

        }


        // ======================================
        // USER UID
        // ======================================

        const uid =
            deposit.uid;


        if (!uid) {

            alert(
                "This deposit has no user UID."
            );

            return;

        }


        // ======================================
        // AMOUNT
        // ======================================

        const amount =
            numberValue(
                deposit.amount
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            alert(
                "Invalid deposit amount."
            );

            return;

        }


        // ======================================
        // LOCK REQUEST
        // Prevent double approval
        // ======================================

        const lockResult =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {

                        return;

                    }


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    if (
                        status !==
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
                            auth.currentUser?.uid ||
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


        // ======================================
        // USER REFERENCE
        // ======================================

        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        const userSnapshot =
            await get(userRef);


        if (!userSnapshot.exists()) {

            await update(
                depositRef,
                {

                    status:
                        "rejected",

                    rejectedAt:
                        Date.now(),

                    rejectedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        null,

                    rejectionReason:
                        "User account not found.",

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Deposit rejected: user account not found."
            );

            return;

        }


        const user =
            userSnapshot.val() || {};


        // ======================================
        // CURRENT USER BALANCE
        // ======================================

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


        const now =
            Date.now();


        // ======================================
        // UPDATE BALANCE
        // ======================================

        const balanceResult =
            await runTransaction(
                userRef,
                (currentUser) => {

                    if (!currentUser) {

                        return;

                    }


                    const balance =
                        numberValue(
                            currentUser.balance
                        );


                    return {

                        ...currentUser,

                        balance:
                            balance + amount,

                        totalDeposits:
                            numberValue(
                                currentUser.totalDeposits
                            ) + amount,

                        totalTransactions:
                            numberValue(
                                currentUser.totalTransactions
                            ) + 1

                    };

                }
            );


        if (!balanceResult.committed) {

            await update(
                depositRef,
                {

                    status:
                        "processing_error",

                    processingError:
                        "Could not update user balance.",

                    errorAt:
                        Date.now(),

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Deposit approval failed: balance could not be updated."
            );

            return;

        }


        // ======================================
        // CREATE TRANSACTION
        // ======================================

        let transactionKey =
            null;


        try {

            const transactionRef =
                push(
                    ref(
                        db,
                        "transactions"
                    )
                );


            transactionKey =
                transactionRef.key;


            if (!transactionKey) {

                throw new Error(
                    "Could not generate transaction ID."
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

                    currency:
                        "RWF",

                    paymentMethod:
                        deposit.paymentMethod ||
                        deposit.method ||
                        "",

                    phone:
                        deposit.phone ||
                        deposit.phoneNumber ||
                        "",

                    transactionId:
                        deposit.transactionId ||
                        deposit.txId ||
                        deposit.transactionID ||
                        "",

                    depositRequestId:
                        id,

                    createdAt:
                        now,

                    approvedAt:
                        now,

                    approvedBy:
                        currentAdmin?.uid ||
                        auth.currentUser?.uid ||
                        ""

                }
            );

        } catch (transactionError) {

            console.error(
                "DEPOSIT TRANSACTION ERROR:",
                transactionError
            );


            /*
             * Balance has already been updated.
             * We mark the request as processing_error
             * instead of pretending everything succeeded.
             */

            await update(
                depositRef,
                {

                    status:
                        "processing_error",

                    processingError:
                        transactionError.message ||
                        "Transaction creation failed.",

                    errorAt:
                        Date.now(),

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );


            alert(
                "Deposit balance was updated, but transaction recording failed. Check the transaction manually."
            );

            return;

        }


        // ======================================
        // FINALIZE DEPOSIT REQUEST
        // ======================================

        await update(
            depositRef,
            {

                status:
                    "approved",

                approvedAt:
                    now,

                approvedBy:
                    currentAdmin?.uid ||
                    auth.currentUser?.uid ||
                    "",

                transactionKey:
                    transactionKey,

                processedAt:
                    now,

                processingAt:
                    null,

                processingBy:
                    null

            }
        );


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            `Deposit approved successfully.\n\nAmount: ${formatMoney(amount)}`
        );


        // Refresh dashboard data
        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        if (
            typeof window.renderDepositRequests ===
            "function"
        ) {

            window.renderDepositRequests();

        }


    } catch (error) {

        console.error(
            "APPROVE DEPOSIT ERROR:",
            error
        );


        // --------------------------------------
        // MARK ERROR
        // --------------------------------------

        try {

            if (id) {

                const errorRef =
                    ref(
                        db,
                        `depositRequests/${id}`
                    );


                const errorSnapshot =
                    await get(errorRef);


                if (
                    errorSnapshot.exists()
                ) {

                    const currentData =
                        errorSnapshot.val() || {};


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    /*
                     * Do not overwrite an already
                     * approved/rejected request.
                     */

                    if (
                        status !==
                            "approved" &&
                        status !==
                            "rejected"
                    ) {

                        await update(
                            errorRef,
                            {

                                status:
                                    "processing_error",

                                processingError:
                                    error.message ||
                                    "Unknown error",

                                errorAt:
                                    Date.now(),

                                processingAt:
                                    null,

                                processingBy:
                                    null

                            }
                        );

                    }

                }

            }

        } catch (markError) {

            console.error(
                "Could not mark deposit error:",
                markError
            );

        }


        alert(
            "Deposit approval failed:\n" +
            (
                error.message ||
                "Unknown error"
            )
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

            alert(
                "Deposit request ID is missing."
            );

            return;

        }


        const confirmed =
            confirm(
                "Are you sure you want to reject this deposit?"
            );


        if (!confirmed) return;


        const depositRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        // ======================================
        // ATOMIC REJECTION
        // ======================================

        const result =
            await runTransaction(
                depositRef,
                (currentData) => {

                    if (!currentData) {

                        return;

                    }


                    const status =
                        normalizeStatus(
                            currentData.status
                        );


                    if (
                        status !==
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
                            auth.currentUser?.uid ||
                            null,

                        processingAt:
                            null,

                        processingBy:
                            null

                    };

                }
            );


        if (!result.committed) {

            alert(
                "This deposit is no longer pending."
            );

            return;

        }


        // ======================================
        // SUCCESS
        // ======================================

        alert(
            "Deposit rejected successfully."
        );


        if (
            typeof window.loadDashboard ===
            "function"
        ) {

            window.loadDashboard();

        }


        if (
            typeof window.renderDepositRequests ===
            "function"
        ) {

            window.renderDepositRequests();

        }


    } catch (error) {

        console.error(
            "REJECT DEPOSIT ERROR:",
            error
        );


        alert(
            "Deposit rejection failed:\n" +
            (
                error.message ||
                "Unknown error"
            )
        );

    }

}


// ==========================================
// GLOBAL EXPORTS
// ==========================================

window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


console.log(
    "MONEY VAULT ADMIN.JS — PART 4 READY"
);

