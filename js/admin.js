/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 1
   ADMIN AUTH + NAVIGATION + INITIALIZATION
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import { auth, db } from "./firebase.js";


/* =========================================================
   FIREBASE AUTH
========================================================= */

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


/* =========================================================
   FIREBASE REALTIME DATABASE
   IMPORTANT:
   These imports are required by Parts 4, 6 and 8.
========================================================= */

import {
    ref,
    get,
    onValue,
    update,
    set,
    push,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   ADMIN STATE
========================================================= */

let currentAdmin = null;

let adminReady = false;


/* =========================================================
   ADMIN READY PROMISE
========================================================= */

let resolveAdminReady;

const adminReadyPromise =
    new Promise(resolve => {

        resolveAdminReady = resolve;

    });


/* =========================================================
   GLOBAL LISTENER STORAGE
   IMPORTANT:
   Declare this ONLY ONCE in the whole admin.js.
========================================================= */

const listeners = {};


/* =========================================================
   GLOBAL ADMIN STATE
========================================================= */

window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    get readyPromise() {
        return adminReadyPromise;
    }

};


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

window.waitForAdmin = function () {

    if (adminReady && currentAdmin) {
        return Promise.resolve(currentAdmin);
    }

    return adminReadyPromise;

};


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const adminNameElement =
    document.getElementById("adminName");

const adminEmailElement =
    document.getElementById("adminEmail");

const logoutBtn =
    document.getElementById("logoutBtn");

const menuBtn =
    document.getElementById("menuBtn");

const sidebar =
    document.getElementById("sidebar");

const pageTitle =
    document.getElementById("pageTitle");


/* =========================================================
   MENU LINKS + PAGE SECTIONS
========================================================= */

const menuLinks =
    document.querySelectorAll(".menu-link");

const pageSections =
    document.querySelectorAll(".page-section");


/* =========================================================
   LOADING SCREEN
========================================================= */

function hideLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.classList.add("hidden");

    setTimeout(() => {

        loadingScreen.style.display = "none";

    }, 300);

}


function showLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.style.display = "flex";

    requestAnimationFrame(() => {

        loadingScreen.classList.remove("hidden");

    });

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setAdminText(element, value) {

    if (!element) {
        return;
    }

    element.textContent =
        value === undefined ||
        value === null ||
        value === ""
            ? "-"
            : String(value);

}


/* =========================================================
   TOAST SYSTEM
========================================================= */

function adminEscapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function showToast(
    message,
    type = "info"
) {

    const container =
        document.getElementById("toastContainer");


    /* -----------------------------------------
       FALLBACK
    ----------------------------------------- */

    if (!container) {

        console.log(
            `[${type}] ${message}`
        );

        return;
    }


    const toast =
        document.createElement("div");


    toast.className =
        `toast toast-${String(type).toLowerCase()}`;


    let icon =
        "fa-circle-info";


    if (type === "success") {

        icon =
            "fa-circle-check";

    } else if (type === "error") {

        icon =
            "fa-circle-xmark";

    } else if (type === "warning") {

        icon =
            "fa-triangle-exclamation";

    }


    toast.innerHTML = `

        <div class="toast-icon">

            <i class="fa-solid ${icon}"></i>

        </div>

        <div class="toast-message">

            ${adminEscapeHTML(message)}

        </div>

        <button
            type="button"
            class="toast-close"
            aria-label="Close"
        >

            <i class="fa-solid fa-xmark"></i>

        </button>

    `;


    container.appendChild(toast);


    requestAnimationFrame(() => {

        toast.classList.add("show");

    });


    const closeToast = () => {

        toast.classList.remove("show");

        setTimeout(() => {

            if (toast.parentNode) {
                toast.remove();
            }

        }, 300);

    };


    toast
        .querySelector(".toast-close")
        ?.addEventListener(
            "click",
            closeToast
        );


    setTimeout(
        closeToast,
        4000
    );

}


/* =========================================================
   GLOBAL TOAST
========================================================= */

window.showToast =
    showToast;


/* =========================================================
   NAVIGATION PAGE TITLES
========================================================= */

const pageTitles = {

    dashboard:
        "Dashboard",

    deposits:
        "Deposit Requests",

    withdraws:
        "Withdraw Requests",

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


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(pageName) {

    if (!pageName) {
        return;
    }


    /* -----------------------------------------
       HIDE ALL SECTIONS
    ----------------------------------------- */

    pageSections.forEach(section => {

        section.classList.remove("active");

        section.style.display = "none";

    });


    /* -----------------------------------------
       REMOVE ACTIVE MENU
    ----------------------------------------- */

    menuLinks.forEach(link => {

        link.classList.remove("active");

    });


    /* -----------------------------------------
       FIND TARGET SECTION
    ----------------------------------------- */

    const targetSection =
        document.getElementById(
            `${pageName}Section`
        );


    if (!targetSection) {

        console.warn(
            `Page section not found: ${pageName}Section`
        );

        return;
    }


    /* -----------------------------------------
       SHOW TARGET SECTION
    ----------------------------------------- */

    targetSection.style.display =
        "block";

    targetSection.classList.add(
        "active"
    );


    /* -----------------------------------------
       ACTIVE MENU LINK
    ----------------------------------------- */

    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add(
            "active"
        );

    }


    /* -----------------------------------------
       PAGE TITLE
    ----------------------------------------- */

    const title =
        pageTitles[pageName] ||
        pageName;


    if (pageTitle) {

        pageTitle.textContent =
            title;

    }


    /* -----------------------------------------
       CLOSE MOBILE SIDEBAR
    ----------------------------------------- */

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    console.log(
        `Admin page opened: ${pageName}`
    );

}


/* =========================================================
   GLOBAL NAVIGATION
========================================================= */

window.openPage =
    openPage;


/* =========================================================
   MENU CLICK EVENTS
========================================================= */

menuLinks.forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();


            const page =
                link.dataset.page;


            if (page) {

                openPage(page);

            }

        }
    );

});


/* =========================================================
   MOBILE MENU
========================================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        () => {

            if (!sidebar) {
                return;
            }

            sidebar.classList.toggle(
                "open"
            );

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            try {

                showLoadingScreen();

                await signOut(auth);

                window.location.href =
                    "login.html";

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

                hideLoadingScreen();

                showToast(
                    "Failed to logout.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        try {

            showLoadingScreen();


            /* -----------------------------------------
               USER NOT LOGGED IN
            ----------------------------------------- */

            if (!user) {

                console.warn(
                    "No authenticated user."
                );


                window.location.href =
                    "login.html";


                return;
            }


            console.log(
                "Authenticated UID:",
                user.uid
            );


            /* -----------------------------------------
               CHECK ADMIN RECORD
            ----------------------------------------- */

            const adminRef =
                ref(
                    db,
                    `admins/${user.uid}`
                );


            const adminSnapshot =
                await get(adminRef);


            /* -----------------------------------------
               NOT ADMIN
            ----------------------------------------- */

            if (!adminSnapshot.exists()) {

                console.warn(
                    "User is not an administrator."
                );


                showToast(
                    "Access denied. Administrator account required.",
                    "error"
                );


                await signOut(auth);


                window.location.href =
                    "login.html";


                return;
            }


            /* -----------------------------------------
               ADMIN DATA
            ----------------------------------------- */

            const adminData =
                adminSnapshot.val() || {};


            currentAdmin = {

                uid:
                    user.uid,

                email:
                    user.email ||
                    adminData.email ||
                    "",

                name:
                    adminData.name ||
                    adminData.fullName ||
                    adminData.displayName ||
                    user.displayName ||
                    user.email ||
                    "Administrator",

                ...adminData

            };


            adminReady =
                true;


            /* -----------------------------------------
               RESOLVE ADMIN PROMISE
            ----------------------------------------- */

            resolveAdminReady(
                currentAdmin
            );


            /* -----------------------------------------
               DISPLAY ADMIN INFO
            ----------------------------------------- */

            setAdminText(
                adminNameElement,
                currentAdmin.name
            );


            setAdminText(
                adminEmailElement,
                currentAdmin.email
            );


            /* -----------------------------------------
               HIDE LOADING
            ----------------------------------------- */

            hideLoadingScreen();


            console.log(
                "Money Vault Admin authenticated:",
                currentAdmin
            );


            /* =================================================
               INITIALIZE ADMIN PAGES
            ================================================= */


            /* -----------------------------------------
               DASHBOARD
            ----------------------------------------- */

            if (
                typeof window.loadDashboard ===
                "function"
            ) {

                window.loadDashboard();

            }


            /* -----------------------------------------
               DEPOSITS
            ----------------------------------------- */

            if (
                typeof window.loadDeposits ===
                "function"
            ) {

                window.loadDeposits();

            }


            /* -----------------------------------------
               WITHDRAWS
            ----------------------------------------- */

            if (
                typeof window.loadWithdraws ===
                "function"
            ) {

                window.loadWithdraws();

            }


            /* -----------------------------------------
               VIP REQUESTS
            ----------------------------------------- */

            if (
                typeof window.loadVipRequests ===
                "function"
            ) {

                window.loadVipRequests();

            }


            /* -----------------------------------------
               VIP BUYERS
            ----------------------------------------- */

            if (
                typeof window.loadVipBuyers ===
                "function"
            ) {

                window.loadVipBuyers();

            }


            /* -----------------------------------------
               BONUS REQUESTS
            ----------------------------------------- */

            if (
                typeof window.loadBonusRequests ===
                "function"
            ) {

                window.loadBonusRequests();

            }


            /* -----------------------------------------
               USERS
            ----------------------------------------- */

            if (
                typeof window.loadUsers ===
                "function"
            ) {

                window.loadUsers();

            }


            /* -----------------------------------------
               TRANSACTIONS
            ----------------------------------------- */

            if (
                typeof window.loadTransactions ===
                "function"
            ) {

                window.loadTransactions();

            }


            /* -----------------------------------------
               QUICK ACTIONS
            ----------------------------------------- */

            if (
                typeof window.initializeQuickActions ===
                "function"
            ) {

                window.initializeQuickActions();

            }


            /* -----------------------------------------
               SETTINGS
            ----------------------------------------- */

            if (
                typeof window.loadSettings ===
                "function"
            ) {

                window.loadSettings();

            }


        } catch (error) {

            console.error(
                "Admin authentication error:",
                error
            );


            adminReady =
                false;


            hideLoadingScreen();


            showToast(
                error.message ||
                "Unable to initialize administrator panel.",
                "error"
            );


            /* -----------------------------------------
               SECURITY:
               If admin verification failed,
               return to login.
            ----------------------------------------- */

            if (
                !currentAdmin
            ) {

                try {

                    await signOut(auth);

                } catch (signOutError) {

                    console.error(
                        "Sign out error:",
                        signOutError
                    );

                }


                setTimeout(() => {

                    window.location.href =
                        "login.html";

                }, 1500);

            }

        }

    }
);


/* =========================================================
   INITIAL PAGE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        openPage(
            "dashboard"
        );

    }
);


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.currentAdmin =
    currentAdmin;


/* =========================================================
   ADMIN.JS PART 1 READY
========================================================= */

console.log(
    "Money Vault Admin.js Part 1 loaded successfully."
);

console.log(
    "Currency: RWF / FRW"
);

console.log(
    "Firebase Database imports: ref, get, onValue, update, set, push, runTransaction"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 2
   DASHBOARD + DATA LISTENERS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   COMMON DASHBOARD HELPERS
========================================================= */

function updateText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


/* =========================================================
   SAFE NUMBER
========================================================= */

function numberValue(value) {

    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


/* =========================================================
   FORMAT MONEY
   MONEY VAULT = RWF / FRW
========================================================= */

function formatMoney(amount) {

    return (
        numberValue(amount).toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }) + " RWF"
    );
}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {

    const value = numberValue(timestamp);

    if (!value) {
        return "N/A";
    }

    try {

        return new Date(value).toLocaleString("en-GB", {
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


/* =========================================================
   SAFE HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   DASHBOARD DATA CACHE
========================================================= */

let dashboardUsers = {};

let dashboardDeposits = {};

let dashboardWithdraws = {};

let dashboardTransactions = {};


/* =========================================================
   DASHBOARD LISTENER STATE
========================================================= */

let dashboardListenersStarted = false;


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    await window.waitForAdmin();

    if (dashboardListenersStarted) {

        renderDashboard();

        return;
    }

    dashboardListenersStarted = true;


    /* =====================================================
       USERS LISTENER
    ===================================================== */

    if (!listeners.dashboardUsers) {

        listeners.dashboardUsers = onValue(
            ref(db, "users"),

            snapshot => {

                dashboardUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard users listener error:",
                    error
                );

                showToast(
                    "Failed to load users data.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       DEPOSIT REQUESTS LISTENER
    ===================================================== */

    if (!listeners.dashboardDeposits) {

        listeners.dashboardDeposits = onValue(
            ref(db, "depositRequests"),

            snapshot => {

                dashboardDeposits =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard deposits listener error:",
                    error
                );

                showToast(
                    "Failed to load deposit data.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       WITHDRAW REQUESTS LISTENER
    ===================================================== */

    if (!listeners.dashboardWithdraws) {

        listeners.dashboardWithdraws = onValue(
            ref(db, "withdrawRequests"),

            snapshot => {

                dashboardWithdraws =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard withdraws listener error:",
                    error
                );

                showToast(
                    "Failed to load withdraw data.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       TRANSACTIONS LISTENER
    ===================================================== */

    if (!listeners.dashboardTransactions) {

        listeners.dashboardTransactions = onValue(
            ref(db, "transactions"),

            snapshot => {

                dashboardTransactions =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDashboard();
            },

            error => {

                console.error(
                    "Dashboard transactions listener error:",
                    error
                );

                showToast(
                    "Failed to load transactions.",
                    "error"
                );
            }
        );
    }


    /* =====================================================
       INITIAL RENDER
    ===================================================== */

    renderDashboard();
}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {

    /* =====================================================
       USERS
    ===================================================== */

    const users = Object.values(
        dashboardUsers || {}
    );

    const totalUsers = users.length;


    /* =====================================================
       SYSTEM BALANCE
       READ ONLY
    ===================================================== */

    let systemBalance = 0;

    users.forEach(user => {

        systemBalance += numberValue(
            user?.balance
        );

    });


    /* =====================================================
       DEPOSITS
    ===================================================== */

    const deposits = Object.values(
        dashboardDeposits || {}
    );

    let totalDeposits = 0;

    let pendingDeposits = 0;

    let approvedDeposits = 0;

    deposits.forEach(deposit => {

        const status = normalizeStatus(
            deposit?.status
        );

        const amount = numberValue(
            deposit?.amount
        );

        if (status === "approved") {

            approvedDeposits++;

            totalDeposits += amount;

        }

        if (
            status === "pending" ||
            status === "processing"
        ) {

            pendingDeposits++;

        }

    });


    /* =====================================================
       WITHDRAWS
    ===================================================== */

    const withdraws = Object.values(
        dashboardWithdraws || {}
    );

    let totalWithdraws = 0;

    withdraws.forEach(withdraw => {

        const status = normalizeStatus(
            withdraw?.status
        );

        const amount = numberValue(
            withdraw?.amount
        );

        if (status === "approved") {

            totalWithdraws += amount;

        }

    });


    /* =====================================================
       UPDATE DASHBOARD COUNTERS
    ===================================================== */

    updateText(
        "totalUsers",
        totalUsers.toLocaleString("en-US")
    );


    updateText(
        "dashboardTotalDeposits",
        formatMoney(totalDeposits)
    );


    updateText(
        "dashboardPendingDeposits",
        pendingDeposits.toLocaleString("en-US")
    );


    updateText(
        "dashboardApprovedDeposits",
        formatMoney(totalDeposits)
    );


    updateText(
        "dashboardTotalWithdraws",
        formatMoney(totalWithdraws)
    );


    updateText(
        "systemBalance",
        formatMoney(systemBalance)
    );


    /* =====================================================
       RECENT ACTIVITY
    ===================================================== */

    renderRecentActivity();

}


/* =========================================================
   RECENT ACTIVITY
========================================================= */

function renderRecentActivity() {

    const container =
        document.getElementById(
            "recentActivity"
        );

    if (!container) {
        return;
    }


    const transactions =
        Object.entries(
            dashboardTransactions || {}
        ).map(([id, transaction]) => {

            return {
                id,
                ...(transaction || {})
            };

        });


    /* =====================================================
       SORT NEWEST FIRST
    ===================================================== */

    transactions.sort((a, b) => {

        const dateA = numberValue(
            a.createdAt ??
            a.timestamp ??
            a.date ??
            0
        );

        const dateB = numberValue(
            b.createdAt ??
            b.timestamp ??
            b.date ??
            0
        );

        return dateB - dateA;

    });


    /* =====================================================
       ONLY LAST 10
    ===================================================== */

    const recent =
        transactions.slice(0, 10);


    if (!recent.length) {

        container.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clock-rotate-left"></i>
                <p>No recent activity.</p>
            </div>
        `;

        return;
    }


    /* =====================================================
       RENDER TRANSACTIONS
    ===================================================== */

    container.innerHTML =
        recent.map(transaction => {

            const type =
                String(
                    transaction.type ??
                    transaction.transactionType ??
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


            const userName =
                transaction.userName ??
                transaction.name ??
                transaction.displayName ??
                "User";


            const date =
                formatDate(
                    transaction.createdAt ??
                    transaction.timestamp ??
                    transaction.date
                );


            let icon =
                "fa-money-bill-transfer";


            let title =
                "Transaction";


            if (
                type === "deposit" ||
                type === "depositapproved"
            ) {

                icon =
                    "fa-circle-arrow-down";

                title =
                    "Deposit";

            } else if (
                type === "withdraw" ||
                type === "withdrawal"
            ) {

                icon =
                    "fa-circle-arrow-up";

                title =
                    "Withdraw";

            } else if (
                type === "vip" ||
                type === "vip_purchase" ||
                type === "vippurchase"
            ) {

                icon =
                    "fa-crown";

                title =
                    "VIP Purchase";

            } else if (
                type === "profit" ||
                type === "dailyprofit"
            ) {

                icon =
                    "fa-chart-line";

                title =
                    "Profit";

            } else if (
                type === "bonus" ||
                type === "registration_bonus"
            ) {

                icon =
                    "fa-gift";

                title =
                    "Bonus";

            } else if (
                type === "referral" ||
                type === "referral_bonus"
            ) {

                icon =
                    "fa-user-group";

                title =
                    "Referral Bonus";

            }


            return `
                <div class="activity-item">

                    <div class="activity-icon">

                        <i class="fa-solid ${icon}"></i>

                    </div>


                    <div class="activity-content">

                        <div class="activity-title">

                            ${escapeHTML(title)}

                        </div>

                        <div class="activity-user">

                            ${escapeHTML(userName)}

                        </div>

                        <div class="activity-date">

                            ${escapeHTML(date)}

                        </div>

                    </div>


                    <div class="activity-right">

                        <div class="activity-amount">

                            ${escapeHTML(
                                formatMoney(amount)
                            )}

                        </div>

                        <div class="
                            activity-status
                            status-${escapeHTML(status)}
                        ">

                            ${escapeHTML(
                                status
                            )}

                        </div>

                    </div>

                </div>
            `;

        })
        .join("");

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

function refreshDashboard() {

    renderDashboard();

    renderRecentActivity();

    showToast(
        "Dashboard refreshed.",
        "success"
    );

}


/* =========================================================
   DASHBOARD QUICK ACTIONS
========================================================= */

function setupDashboardQuickActions() {

    const actions = {

        openDeposits: "deposits",

        openWithdraws: "withdraws",

        openUsers: "users",

        openTransactions: "transactions",

        openSettings: "settings",

        openVipRequests: "vipRequests"

    };


    Object.entries(actions).forEach(
        ([id, page]) => {

            const button =
                document.getElementById(id);

            if (!button) {
                return;
            }


            if (
                button.dataset.dashboardBound ===
                "true"
            ) {

                return;

            }


            button.dataset.dashboardBound =
                "true";


            button.addEventListener(
                "click",
                event => {

                    event.preventDefault();

                    if (
                        typeof window.openPage ===
                        "function"
                    ) {

                        window.openPage(page);

                    }

                }
            );

        }
    );

}


/* =========================================================
   EXPORT COMMON HELPERS
   OTHER PARTS CAN USE THEM
========================================================= */

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


window.loadDashboard =
    loadDashboard;


window.renderDashboard =
    renderDashboard;


window.renderRecentActivity =
    renderRecentActivity;


window.refreshDashboard =
    refreshDashboard;


window.setupDashboardQuickActions =
    setupDashboardQuickActions;


/* =========================================================
   INITIALIZE DASHBOARD BUTTONS
========================================================= */

setupDashboardQuickActions();


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 2 loaded successfully."
);

console.log(
    "Dashboard currency: RWF / FRW"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 3
   DEPOSIT REQUESTS
   CURRENCY: RWF / FRW

   FEATURES:
   - Beautiful deposit request list
   - Search
   - Status filter
   - Counters
   - User information
   - Approve / Reject
   - ONE-TIME APPROVAL PROTECTION
   - Automatic balance update
   - Automatic totalDeposits update
   - Automatic totalTransactions update
========================================================= */


/* =========================================================
   DEPOSIT DATA
========================================================= */

let allDepositRequests = [];

let depositUsers = {};

let depositListenersStarted = false;


/* =========================================================
   SAFE DEPOSIT VALUE
========================================================= */

function depositValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


/* =========================================================
   DEPOSIT STATUS
========================================================= */

function depositStatus(status) {

    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


/* =========================================================
   DEPOSIT DATE
========================================================= */

function depositDate(value) {

    const timestamp = depositValue(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}


/* =========================================================
   DEPOSIT MONEY
========================================================= */

function depositMoney(value) {

    return formatMoney(
        depositValue(value)
    );
}


/* =========================================================
   USER NAME
========================================================= */

function depositUserName(user) {

    if (!user) {
        return "Unknown User";
    }

    return (
        user.name ||
        user.fullName ||
        user.displayName ||
        user.username ||
        user.email ||
        "Unknown User"
    );
}


/* =========================================================
   USER EMAIL
========================================================= */

function depositUserEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}


/* =========================================================
   USER PHONE
========================================================= */

function depositUserPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        user?.mobile ||
        "N/A"
    );
}


/* =========================================================
   PAYMENT METHOD
========================================================= */

function depositPaymentMethod(request) {

    return (
        request?.paymentMethod ||
        request?.method ||
        request?.provider ||
        "N/A"
    );
}


/* =========================================================
   TRANSACTION ID
========================================================= */

function depositTransactionId(request) {

    return (
        request?.transactionId ||
        request?.transactionID ||
        request?.txId ||
        request?.reference ||
        "N/A"
    );
}


/* =========================================================
   REQUEST DATE
========================================================= */

function depositRequestDate(request) {

    return (
        request?.createdAt ??
        request?.timestamp ??
        request?.date ??
        request?.requestedAt ??
        0
    );
}


/* =========================================================
   USER PHOTO
========================================================= */

function depositUserPhoto(user) {

    return (
        user?.photoURL ||
        user?.photo ||
        user?.profilePhoto ||
        user?.avatar ||
        ""
    );
}


/* =========================================================
   LOAD DEPOSITS
========================================================= */

async function loadDeposits() {

    await window.waitForAdmin();


    if (depositListenersStarted) {

        renderDepositRequests();

        return;
    }


    depositListenersStarted = true;


    /* =====================================================
       USERS LISTENER
    ===================================================== */

    if (!listeners.depositUsers) {

        listeners.depositUsers = onValue(
            ref(db, "users"),

            snapshot => {

                depositUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderDepositRequests();
            },

            error => {

                console.error(
                    "Deposit users listener error:",
                    error
                );

                showToast(
                    "Failed to load deposit users.",
                    "error"
                );
            }
        );

    }


    /* =====================================================
       DEPOSIT REQUESTS LISTENER
    ===================================================== */

    if (!listeners.depositRequests) {

        listeners.depositRequests = onValue(
            ref(db, "depositRequests"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                allDepositRequests =
                    Object.entries(data)
                        .map(
                            ([id, request]) => {

                                return {
                                    id,
                                    ...(request || {})
                                };

                            }
                        );


                allDepositRequests.sort(
                    (a, b) => {

                        return (
                            depositValue(
                                depositRequestDate(b)
                            ) -
                            depositValue(
                                depositRequestDate(a)
                            )
                        );

                    }
                );


                renderDepositRequests();

            },

            error => {

                console.error(
                    "Deposit requests listener error:",
                    error
                );

                showToast(
                    "Failed to load deposit requests.",
                    "error"
                );
            }
        );

    }


    renderDepositRequests();

}


/* =========================================================
   RENDER DEPOSIT REQUESTS
========================================================= */

function renderDepositRequests() {

    const list =
        document.getElementById(
            "depositList"
        );

    const empty =
        document.getElementById(
            "emptyDeposit"
        );


    if (!list) {
        return;
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchInput =
        document.getElementById(
            "depositSearch"
        );


    const search =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       FILTER
    ===================================================== */

    const filterInput =
        document.getElementById(
            "depositFilter"
        );


    const filter =
        String(
            filterInput?.value || "all"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       COUNTERS
    ===================================================== */

    let totalCount = 0;

    let pendingCount = 0;

    let approvedCount = 0;

    let rejectedCount = 0;


    allDepositRequests.forEach(
        request => {

            totalCount++;

            const status =
                depositStatus(
                    request.status
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

        }
    );


    updateText(
        "depositTotalCount",
        totalCount.toLocaleString("en-US")
    );


    updateText(
        "depositPendingCount",
        pendingCount.toLocaleString("en-US")
    );


    updateText(
        "depositApprovedCount",
        approvedCount.toLocaleString("en-US")
    );


    updateText(
        "depositRejectedCount",
        rejectedCount.toLocaleString("en-US")
    );


    /* =====================================================
       FILTER REQUESTS
    ===================================================== */

    const filtered =
        allDepositRequests.filter(
            request => {

                const status =
                    depositStatus(
                        request.status
                    );


                /* FILTER */

                if (
                    filter !== "all" &&
                    status !== filter
                ) {

                    return false;

                }


                /* USER */

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
                    depositUserName(
                        user
                    )
                    .toLowerCase();


                const email =
                    depositUserEmail(
                        user
                    )
                    .toLowerCase();


                const phone =
                    depositUserPhone(
                        user
                    )
                    .toLowerCase();


                const transactionId =
                    depositTransactionId(
                        request
                    )
                    .toLowerCase();


                const method =
                    depositPaymentMethod(
                        request
                    )
                    .toLowerCase();


                const requestId =
                    String(
                        request.id || ""
                    )
                    .toLowerCase();


                /* SEARCH */

                if (search) {

                    const searchableText = [

                        uid,

                        name,

                        email,

                        phone,

                        transactionId,

                        method,

                        requestId,

                        String(
                            request.amount || ""
                        )

                    ]
                    .join(" ");


                    if (
                        !searchableText.includes(
                            search
                        )
                    ) {

                        return false;

                    }

                }


                return true;

            }
        );


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display = "block";

            empty.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-inbox"></i>

                    <h3>
                        No Deposit Requests
                    </h3>

                    <p>
                        There are no deposit
                        requests matching your search.
                    </p>

                </div>
            `;

        }

        return;

    }


    if (empty) {
        empty.style.display = "none";
    }


    /* =====================================================
       RENDER LIST
    ===================================================== */

    list.innerHTML =
        filtered
            .map(
                request =>
                    renderDepositCard(
                        request,
                        depositUsers[
                            request.uid
                        ] || {}
                    )
            )
            .join("");


    activateDepositButtons();

}


/* =========================================================
   DEPOSIT CARD
========================================================= */

function renderDepositCard(
    request,
    user
) {

    const status =
        depositStatus(
            request.status
        );


    const amount =
        depositMoney(
            request.amount
        );


    const name =
        depositUserName(
            user
        );


    const email =
        depositUserEmail(
            user
        );


    const phone =
        depositUserPhone(
            user
        );


    const method =
        depositPaymentMethod(
            request
        );


    const transactionId =
        depositTransactionId(
            request
        );


    const date =
        depositDate(
            depositRequestDate(
                request
            )
        );


    const uid =
        request.uid ||
        "N/A";


    const photo =
        depositUserPhoto(
            user
        );


    const avatar =
        photo
            ? `
                <img
                    src="${escapeHTML(photo)}"
                    alt="User"
                    class="deposit-avatar"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="deposit-avatar-fallback"
                    style="display:none;"
                >
                    <i class="fa-solid fa-user"></i>
                </div>
              `
            : `
                <div class="deposit-avatar-fallback">
                    <i class="fa-solid fa-user"></i>
                </div>
              `;


    /* =====================================================
       STATUS CLASS
    ===================================================== */

    const statusClass =
        [
            "pending",
            "processing",
            "approved",
            "rejected",
            "processing_error"
        ].includes(status)
            ? status
            : "pending";


    /* =====================================================
       ACTION BUTTONS
    ===================================================== */

    let actions = "";


    if (status === "pending") {

        actions = `

            <div class="deposit-actions">

                <button
                    type="button"
                    class="deposit-action-btn approve-deposit-btn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fa-solid fa-check"></i>
                    Approve
                </button>


                <button
                    type="button"
                    class="deposit-action-btn reject-deposit-btn"
                    data-id="${escapeHTML(request.id)}"
                >
                    <i class="fa-solid fa-xmark"></i>
                    Reject
                </button>

            </div>

        `;

    } else {

        actions = `

            <div class="
                deposit-processed-message
                status-${escapeHTML(statusClass)}
            ">

                <i class="fa-solid
                    ${
                        status === "approved"
                            ? "fa-circle-check"
                            : status === "rejected"
                                ? "fa-circle-xmark"
                                : "fa-clock"
                    }
                "></i>

                ${escapeHTML(
                    status.replace(
                        "_",
                        " "
                    )
                )}

            </div>

        `;

    }


    return `

        <article
            class="deposit-card"
            data-id="${escapeHTML(request.id)}"
        >

            <!-- =========================================
                 HEADER
            ========================================== -->

            <div class="deposit-card-header">

                <div class="deposit-user">

                    <div class="deposit-avatar-wrap">

                        ${avatar}

                    </div>


                    <div class="deposit-user-info">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                    </div>

                </div>


                <div class="
                    deposit-status
                    status-${escapeHTML(statusClass)}
                ">

                    ${escapeHTML(
                        status.replace(
                            "_",
                            " "
                        )
                    )}

                </div>

            </div>


            <!-- =========================================
                 AMOUNT
            ========================================== -->

            <div class="deposit-amount-box">

                <span class="deposit-amount-label">
                    Deposit Amount
                </span>

                <strong class="deposit-amount">
                    ${escapeHTML(amount)}
                </strong>

            </div>


            <!-- =========================================
                 DETAILS
            ========================================== -->

            <div class="deposit-details">

                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-mobile-screen-button"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-wallet"></i>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeHTML(method)}
                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-receipt"></i>
                        Transaction ID
                    </span>

                    <strong
                        class="deposit-transaction-id"
                        title="${escapeHTML(transactionId)}"
                    >
                        ${escapeHTML(transactionId)}
                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>
                        <i class="fa-solid fa-calendar"></i>
                        Requested
                    </span>

                    <strong>
                        ${escapeHTML(date)}
                    </strong>

                </div>

            </div>


            <!-- =========================================
                 TECHNICAL INFO
            ========================================== -->

            <div class="deposit-meta">

                <span>
                    UID:
                    ${escapeHTML(uid)}
                </span>

                <span>
                    Request:
                    ${escapeHTML(request.id)}
                </span>

            </div>


            <!-- =========================================
                 ACTIONS
            ========================================== -->

            ${actions}

        </article>

    `;

}


/* =========================================================
   ACTIVATE DEPOSIT BUTTONS
========================================================= */

function activateDepositButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".approve-deposit-btn"
        );


    approveButtons.forEach(
        button => {

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
                        return;
                    }


                    /* =================================
                       DISABLE IMMEDIATELY
                    ================================= */

                    button.disabled = true;

                    button.classList.add(
                        "is-processing"
                    );


                    button.innerHTML = `
                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>
                        Processing...
                    `;


                    try {

                        await approveDeposit(
                            id
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        button.disabled =
                            false;

                        button.classList.remove(
                            "is-processing"
                        );

                        button.innerHTML = `
                            <i class="
                                fa-solid
                                fa-check
                            "></i>
                            Approve
                        `;

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
        button => {

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
                        return;
                    }


                    button.disabled =
                        true;


                    button.classList.add(
                        "is-processing"
                    );


                    button.innerHTML = `
                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>
                        Processing...
                    `;


                    try {

                        await rejectDeposit(
                            id
                        );

                    } catch (error) {

                        console.error(
                            error
                        );

                        button.disabled =
                            false;

                        button.classList.remove(
                            "is-processing"
                        );

                        button.innerHTML = `
                            <i class="
                                fa-solid
                                fa-xmark
                            "></i>
                            Reject
                        `;

                    }

                }
            );

        }
    );

}


/* =========================================================
   SEARCH
========================================================= */

function setupDepositSearch() {

    const search =
        document.getElementById(
            "depositSearch"
        );


    const filter =
        document.getElementById(
            "depositFilter"
        );


    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound =
            "true";


        search.addEventListener(
            "input",
            renderDepositRequests
        );

    }


    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound =
            "true";


        filter.addEventListener(
            "change",
            renderDepositRequests
        );

    }

}


/* =========================================================
   INITIALIZE SEARCH / FILTER
========================================================= */

setupDepositSearch();


/* =========================================================
   EXPORT
========================================================= */

window.loadDeposits =
    loadDeposits;


window.renderDepositRequests =
    renderDepositRequests;


window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 3 loaded successfully."
);

console.log(
    "Deposit currency: RWF / FRW"
);

