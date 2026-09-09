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

let adminInitializationStarted = false;

let adminInitializationCompleted = false;

let authStateResolved = false;


/* =========================================================
   ADMIN READY PROMISE
========================================================= */

let resolveAdminReady;

let rejectAdminReady;

const adminReadyPromise =
    new Promise((resolve, reject) => {

        resolveAdminReady = resolve;

        rejectAdminReady = reject;

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

    get authResolved() {

        return authStateResolved;

    },

    get initialized() {

        return adminInitializationCompleted;

    },

    get readyPromise() {

        return adminReadyPromise;

    }

};


/* =========================================================
   CURRENT ADMIN GLOBAL ACCESS
   IMPORTANT:
   Use a getter instead of assigning a snapshot.
========================================================= */

Object.defineProperty(
    window,
    "currentAdmin",
    {

        configurable: true,

        enumerable: true,

        get() {

            return currentAdmin;

        }

    }
);


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

window.waitForAdmin =
    function () {

        if (
            adminReady &&
            currentAdmin
        ) {

            return Promise.resolve(
                currentAdmin
            );

        }

        return adminReadyPromise;

    };


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById(
        "loadingScreen"
    );

const adminNameElement =
    document.getElementById(
        "adminName"
    );

const adminEmailElement =
    document.getElementById(
        "adminEmail"
    );

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );

const menuBtn =
    document.getElementById(
        "menuBtn"
    );

const sidebar =
    document.getElementById(
        "sidebar"
    );

const pageTitle =
    document.getElementById(
        "pageTitle"
    );


/* =========================================================
   MENU LINKS + PAGE SECTIONS
========================================================= */

const menuLinks =
    document.querySelectorAll(
        ".menu-link"
    );

const pageSections =
    document.querySelectorAll(
        ".page-section"
    );


/* =========================================================
   LOADING SCREEN
========================================================= */

function hideLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.classList.add(
        "hidden"
    );

    setTimeout(() => {

        if (!loadingScreen) {
            return;
        }

        loadingScreen.style.display =
            "none";

    }, 300);

}


function showLoadingScreen() {

    if (!loadingScreen) {
        return;
    }

    loadingScreen.style.display =
        "flex";

    requestAnimationFrame(() => {

        if (!loadingScreen) {
            return;
        }

        loadingScreen.classList.remove(
            "hidden"
        );

    });

}


/* =========================================================
   SAFE TEXT UPDATE
========================================================= */

function setAdminText(
    element,
    value
) {

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
   HTML ESCAPE
========================================================= */

function adminEscapeHTML(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOAST SYSTEM
========================================================= */

function showToast(
    message,
    type = "info"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );


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
        document.createElement(
            "div"
        );


    toast.className =
        `toast toast-${String(
            type
        ).toLowerCase()}`;


    let icon =
        "fa-circle-info";


    if (
        type === "success"
    ) {

        icon =
            "fa-circle-check";

    } else if (
        type === "error"
    ) {

        icon =
            "fa-circle-xmark";

    } else if (
        type === "warning"
    ) {

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


    container.appendChild(
        toast
    );


    requestAnimationFrame(() => {

        toast.classList.add(
            "show"
        );

    });


    const closeToast =
        () => {

            toast.classList.remove(
                "show"
            );

            setTimeout(() => {

                if (
                    toast.parentNode
                ) {

                    toast.remove();

                }

            }, 300);

        };


    toast
        .querySelector(
            ".toast-close"
        )
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
   VALID PAGE NAMES
========================================================= */

const validPages =
    new Set(
        Object.keys(
            pageTitles
        )
    );


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(
    pageName
) {

    if (!pageName) {
        return false;
    }

   
/* =========================================================
   MONEY VAULT - ADMIN.JS
   QUICK ACTIONS
   RWF / FRW
   =========================================================
   PURPOSE:
   - Open the correct admin section
   - Immediately load/render its list
   - Prevent duplicate event listeners
   - Work with Parts 3, 5, 7, 10 and 11
========================================================= */


/* =========================================================
   SAFE QUICK ACTION RUNNER
========================================================= */

async function runQuickAction({
    buttonId,
    page,
    loader,
    renderer,
    label
}) {

    const button = document.getElementById(buttonId);

    if (!button) {
        console.warn(
            `Money Vault: Quick Action button #${buttonId} not found.`
        );
        return;
    }

    /* Prevent duplicate listener */
    if (button.dataset.quickActionBound === "true") {
        return;
    }

    button.dataset.quickActionBound = "true";

    button.addEventListener("click", async (event) => {

        event.preventDefault();

        try {

            /* -----------------------------------------
               1. OPEN PAGE FIRST
            ----------------------------------------- */

            if (typeof openPage === "function") {
                openPage(page);
            }
            else if (typeof window.openPage === "function") {
                window.openPage(page);
            }
            else {
                console.error(
                    "Money Vault: openPage() ntibonetse."
                );
                return;
            }


            /* -----------------------------------------
               2. SHOW LOADING STATE
            ----------------------------------------- */

            const originalHTML = button.innerHTML;

            button.disabled = true;

            button.dataset.originalHTML = originalHTML;

            button.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Loading...
            `;


            /* -----------------------------------------
               3. LOAD DATA
            ----------------------------------------- */

            if (typeof loader === "function") {
                await loader();
            }


            /* -----------------------------------------
               4. RENDER DATA
            ----------------------------------------- */

            if (typeof renderer === "function") {
                renderer();
            }


            /* -----------------------------------------
               5. RESTORE BUTTON
            ----------------------------------------- */

            button.disabled = false;

            if (button.dataset.originalHTML) {
                button.innerHTML =
                    button.dataset.originalHTML;
            }


            console.log(
                `✅ Quick Action loaded: ${label}`
            );

        }
        catch (error) {

            console.error(
                `❌ Quick Action error: ${label}`,
                error
            );

            button.disabled = false;

            if (button.dataset.originalHTML) {
                button.innerHTML =
                    button.dataset.originalHTML;
            }

            if (typeof showToast === "function") {
                showToast(
                    `Failed to load ${label}.`,
                    "error"
                );
            }
        }

    });
}


/* =========================================================
   DEPOSITS
   ========================================================= */

runQuickAction({
    buttonId: "openDeposits",
    page: "deposits",

    loader: async () => {

        if (typeof window.loadDeposits === "function") {
            await window.loadDeposits();
        }
    },

    renderer: () => {

        if (typeof window.renderDepositRequests === "function") {
            window.renderDepositRequests();
        }
    },

    label: "Deposits"
});


/* =========================================================
   WITHDRAWS
   ========================================================= */

runQuickAction({
    buttonId: "openWithdraws",
    page: "withdraws",

    loader: async () => {

        if (typeof window.loadWithdraws === "function") {
            await window.loadWithdraws();
        }
    },

    renderer: () => {

        if (typeof window.renderWithdrawRequests === "function") {
            window.renderWithdrawRequests();
        }
    },

    label: "Withdraws"
});


/* =========================================================
   VIP REQUESTS
   ========================================================= */

runQuickAction({
    buttonId: "openVipRequests",
    page: "vipRequests",

    loader: async () => {

        if (typeof window.loadVipRequests === "function") {
            await window.loadVipRequests();
        }
    },

    renderer: () => {

        if (typeof window.renderVipRequests === "function") {
            window.renderVipRequests();
        }
    },

    label: "VIP Requests"
});


/* =========================================================
   VIP BUYERS
   ========================================================= */

runQuickAction({
    buttonId: "openVipBuyers",
    page: "vipBuyers",

    loader: async () => {

        if (typeof window.loadVipBuyers === "function") {
            await window.loadVipBuyers();
        }
    },

    renderer: () => {

        if (typeof window.renderVipBuyers === "function") {
            window.renderVipBuyers();
        }
    },

    label: "VIP Buyers"
});


/* =========================================================
   USERS
   ========================================================= */

runQuickAction({
    buttonId: "openUsers",
    page: "users",

    loader: async () => {

        if (typeof window.loadUsers === "function") {
            await window.loadUsers();
        }
    },

    renderer: () => {

        if (typeof window.renderUsers === "function") {
            window.renderUsers();
        }
    },

    label: "Users"
});


/* =========================================================
   TRANSACTIONS
   ========================================================= */

runQuickAction({
    buttonId: "openTransactions",
    page: "transactions",

    loader: async () => {

        if (typeof window.loadTransactions === "function") {
            await window.loadTransactions();
        }
    },

    renderer: () => {

        if (typeof window.renderTransactions === "function") {
            window.renderTransactions();
        }
    },

    label: "Transactions"
});


/* =========================================================
   BONUS REQUESTS
========================================================= */

runQuickAction({
    buttonId: "openBonusRequests",
    page: "bonusRequests",

    loader: async () => {

        if (typeof window.loadBonusRequests === "function") {
            await window.loadBonusRequests();
        }
    },

    renderer: () => {

        if (typeof window.renderBonusRequests === "function") {
            window.renderBonusRequests();
        }
    },

    label: "Bonus Requests"
});


/* =========================================================
   SETTINGS
   =========================================================
   Settings nta list is required, therefore only page
   irafungurwa.
========================================================= */

runQuickAction({
    buttonId: "openSettings",
    page: "settings",

    loader: async () => {
        if (typeof window.loadSettings === "function") {
            await window.loadSettings();
        }
    },

    renderer: () => {},

    label: "Settings"
});


/* =========================================================
   DASHBOARD
   ========================================================= */

runQuickAction({
    buttonId: "openDashboard",
    page: "dashboard",

    loader: async () => {
        if (typeof window.loadDashboard === "function") {
            await window.loadDashboard();
        }
    },

    renderer: () => {
        if (typeof window.renderDashboard === "function") {
            window.renderDashboard();
        }
    },

    label: "Dashboard"
});


/* =========================================================
   OPTIONAL REFRESH CURRENT PAGE
========================================================= */

window.refreshQuickActionPage = async function () {

    const currentPage =
        window.adminState?.currentPage ||
        localStorage.getItem("adminCurrentPage") ||
        "dashboard";

    try {

        switch (currentPage) {

            case "deposits":
                if (window.loadDeposits)
                    await window.loadDeposits();

                if (window.renderDepositRequests)
                    window.renderDepositRequests();
                break;


            case "withdraws":
                if (window.loadWithdraws)
                    await window.loadWithdraws();

                if (window.renderWithdrawRequests)
                    window.renderWithdrawRequests();
                break;


            case "vipRequests":
                if (window.loadVipRequests)
                    await window.loadVipRequests();

                if (window.renderVipRequests)
                    window.renderVipRequests();
                break;


            case "vipBuyers":
                if (window.loadVipBuyers)
                    await window.loadVipBuyers();

                if (window.renderVipBuyers)
                    window.renderVipBuyers();
                break;


            case "users":
                if (window.loadUsers)
                    await window.loadUsers();

                if (window.renderUsers)
                    window.renderUsers();
                break;


            case "transactions":
                if (window.loadTransactions)
                    await window.loadTransactions();

                if (window.renderTransactions)
                    window.renderTransactions();
                break;


            case "bonusRequests":
                if (window.loadBonusRequests)
                    await window.loadBonusRequests();

                if (window.renderBonusRequests)
                    window.renderBonusRequests();
                break;


            case "settings":
                if (window.loadSettings)
                    await window.loadSettings();
                break;


            case "dashboard":
                if (window.loadDashboard)
                    await window.loadDashboard();

                if (window.renderDashboard)
                    window.renderDashboard();
                break;
        }

    }
    catch (error) {

        console.error(
            "Quick Action refresh error:",
            error
        );

    }

};


/* =========================================================
   INITIALIZATION
========================================================= */

console.log(
    "✅ Money Vault Quick Actions loaded."
);

console.log(
    "📋 Quick Actions: Deposits, Withdraws, VIP Requests, VIP Buyers, Users, Transactions, Bonus Requests, Settings."
);

console.log(
    "💰 Currency: RWF / FRW"
);
    /* -----------------------------------------
       VALIDATE PAGE
    ----------------------------------------- */

    if (
        !validPages.has(
            pageName
        )
    ) {

        console.warn(
            `Unknown admin page: ${pageName}`
        );

        return false;

    }


    /* -----------------------------------------
       HIDE ALL SECTIONS
    ----------------------------------------- */

    pageSections.forEach(
        section => {

            section.classList.remove(
                "active"
            );

            section.style.display =
                "none";

        }
    );


    /* -----------------------------------------
       REMOVE ACTIVE MENU
    ----------------------------------------- */

    menuLinks.forEach(
        link => {

            link.classList.remove(
                "active"
            );

            link.setAttribute(
                "aria-current",
                "false"
            );

        }
    );


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

        return false;

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

        activeLink.setAttribute(
            "aria-current",
            "page"
        );

    }


    /* -----------------------------------------
       PAGE TITLE
    ----------------------------------------- */

    if (pageTitle) {

        pageTitle.textContent =
            pageTitles[pageName] ||
            pageName;

    }


    /* -----------------------------------------
       CLOSE MOBILE SIDEBAR
    ----------------------------------------- */

    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    /* -----------------------------------------
       REMEMBER CURRENT PAGE
    ----------------------------------------- */

    window.adminState.currentPage =
        pageName;


    console.log(
        `Admin page opened: ${pageName}`
    );


    return true;

}


/* =========================================================
   GLOBAL NAVIGATION
========================================================= */

window.openPage =
    openPage;


/* =========================================================
   REFRESH CURRENT PAGE
   Used by Quick Actions / other modules.
========================================================= */

window.refreshCurrentPage =
    function () {

        const page =
            window.adminState.currentPage ||
            "dashboard";


        switch (page) {

            case "dashboard":

                if (
                    typeof window.loadDashboard ===
                    "function"
                ) {

                    window.loadDashboard();

                }

                break;


            case "deposits":

                if (
                    typeof window.loadDeposits ===
                    "function"
                ) {

                    window.loadDeposits();

                }

                break;


            case "withdraws":

                if (
                    typeof window.loadWithdraws ===
                    "function"
                ) {

                    window.loadWithdraws();

                }

                break;


            case "vipRequests":

                if (
                    typeof window.loadVipRequests ===
                    "function"
                ) {

                    window.loadVipRequests();

                }

                break;


            case "vipBuyers":

                if (
                    typeof window.loadVipBuyers ===
                    "function"
                ) {

                    window.loadVipBuyers();

                }

                break;


            case "bonusRequests":

                if (
                    typeof window.loadBonusRequests ===
                    "function"
                ) {

                    window.loadBonusRequests();

                }

                break;


            case "users":

                if (
                    typeof window.loadUsers ===
                    "function"
                ) {

                    window.loadUsers();

                }

                break;


            case "transactions":

                if (
                    typeof window.loadTransactions ===
                    "function"
                ) {

                    window.loadTransactions();

                }

                break;


            case "settings":

                if (
                    typeof window.loadSettings ===
                    "function"
                ) {

                    window.loadSettings();

                }

                break;

        }

    };


/* =========================================================
   MENU CLICK EVENTS
========================================================= */

menuLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const page =
                    link.dataset.page;


                if (page) {

                    openPage(
                        page
                    );

                }

            }
        );

    }
);


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
   LOGOUT FUNCTION
========================================================= */

async function adminLogout() {

    try {

        showLoadingScreen();

        await signOut(
            auth
        );


        currentAdmin =
            null;

        adminReady =
            false;

        adminInitializationCompleted =
            false;


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


/* =========================================================
   GLOBAL LOGOUT
========================================================= */

window.adminLogout =
    adminLogout;


/* =========================================================
   LOGOUT BUTTON
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        adminLogout
    );

}


/* =========================================================
   CLEAN FIREBASE LISTENERS
   IMPORTANT:
   All Parts should store unsubscribe functions
   inside the global listeners object.
========================================================= */

function cleanupAdminListeners() {

    Object.keys(
        listeners
    ).forEach(
        key => {

            const unsubscribe =
                listeners[key];


            if (
                typeof unsubscribe ===
                "function"
            ) {

                try {

                    unsubscribe();

                } catch (error) {

                    console.warn(
                        `Failed to remove listener: ${key}`,
                        error
                    );

                }

            }


            delete listeners[key];

        }
    );

}


/* =========================================================
   GLOBAL LISTENER CLEANUP
========================================================= */

window.cleanupAdminListeners =
    cleanupAdminListeners;


/* =========================================================
   ADMIN PAGE INITIALIZATION
========================================================= */

async function initializeAdminPages() {

    if (
        adminInitializationStarted
    ) {

        console.warn(
            "Admin initialization already started."
        );

        return;

    }


    adminInitializationStarted =
        true;


    try {

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


        adminInitializationCompleted =
            true;


        console.log(
            "All available admin modules initialized."
        );


    } catch (error) {

        adminInitializationCompleted =
            false;

        console.error(
            "Admin page initialization error:",
            error
        );

        showToast(
            "Some administrator modules could not be initialized.",
            "warning"
        );

    }

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

                authStateResolved =
                    true;

                adminReady =
                    false;

                currentAdmin =
                    null;


                console.warn(
                    "No authenticated user."
                );


                cleanupAdminListeners();


                window.location.href =
                    "login.html";


                return;

            }


            /* -----------------------------------------
               LOGGED-IN USER
            ----------------------------------------- */

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
                await get(
                    adminRef
                );


            /* -----------------------------------------
               NOT ADMIN
            ----------------------------------------- */

            if (
                !adminSnapshot.exists()
            ) {

                authStateResolved =
                    true;

                adminReady =
                    false;

                currentAdmin =
                    null;


                console.warn(
                    "User is not an administrator."
                );


                showToast(
                    "Access denied. Administrator account required.",
                    "error"
                );


                cleanupAdminListeners();


                try {

                    await signOut(
                        auth
                    );

                } catch (
                    signOutError
                ) {

                    console.error(
                        "Sign out error:",
                        signOutError
                    );

                }


                setTimeout(
                    () => {

                        window.location.href =
                            "login.html";

                    },
                    800
                );


                return;

            }


            /* -----------------------------------------
               ADMIN DATA
            ----------------------------------------- */

            const adminData =
                adminSnapshot.val() ||
                {};


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

                ...adminData,

                uid:
                    user.uid

            };


            /* -----------------------------------------
               AUTH STATE READY
            ----------------------------------------- */

            authStateResolved =
                true;

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
               ADMIN BODY STATE
            ----------------------------------------- */

            document.body.classList.add(
                "admin-authenticated"
            );


            document.body.dataset.adminUid =
                currentAdmin.uid;


            /* -----------------------------------------
               SHOW DEFAULT PAGE
            ----------------------------------------- */

            openPage(
                "dashboard"
            );


            /* -----------------------------------------
               HIDE LOADING
            ----------------------------------------- */

            hideLoadingScreen();


            console.log(
                "Money Vault Admin authenticated:",
                currentAdmin
            );


            /* -----------------------------------------
               INITIALIZE ALL ADMIN MODULES
            ----------------------------------------- */

            await initializeAdminPages();


        } catch (error) {

            console.error(
                "Admin authentication error:",
                error
            );


            adminReady =
                false;

            authStateResolved =
                true;


            hideLoadingScreen();


            showToast(
                error?.message ||
                "Unable to initialize administrator panel.",
                "error"
            );


            /* -----------------------------------------
               CLEANUP
            ----------------------------------------- */

            cleanupAdminListeners();


            /* -----------------------------------------
               SECURITY:
               If admin verification failed,
               return to login.
            ----------------------------------------- */

            currentAdmin =
                null;


            document.body.classList.remove(
                "admin-authenticated"
            );


            try {

                await signOut(
                    auth
                );

            } catch (
                signOutError
            ) {

                console.error(
                    "Sign out error:",
                    signOutError
                );

            }


            setTimeout(
                () => {

                    window.location.href =
                        "login.html";

                },
                1200
            );

        }

    }
);


/* =========================================================
   INITIAL PAGE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        /*
         * If authentication is still loading,
         * dashboard is shown visually but data waits
         * for admin authentication.
         */

        openPage(
            "dashboard"
        );

    }
);


/* =========================================================
   PAGE VISIBILITY HANDLER
   Helps mobile/browser tab restoration.
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            if (
                adminReady &&
                currentAdmin
            ) {

                /*
                 * Do not recreate Firebase listeners.
                 * Existing Parts control their own listeners.
                 */

                console.log(
                    "Money Vault Admin page active."
                );

            }

        }

    }
);


/* =========================================================
   BEFORE UNLOAD
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        /*
         * Firebase onValue listeners are normally
         * destroyed with the page, but this also cleans
         * our registered unsubscribe functions.
         */

        cleanupAdminListeners();

    }
);


/* =========================================================
   GLOBAL ADMIN HELPERS
========================================================= */

window.getCurrentAdmin =
    function () {

        return currentAdmin;

    };


window.isAdminReady =
    function () {

        return (
            adminReady &&
            !!currentAdmin
        );

    };


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
    "Admin authentication: Firebase Auth + admins/{uid}"
);

console.log(
    "Firebase Database imports: ref, get, onValue, update, set, push, runTransaction"
);

console.log(
    "Part 1: ADMIN AUTH + NAVIGATION + INITIALIZATION READY"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 2
   DASHBOARD + DATA LISTENERS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   COMMON DASHBOARD HELPERS
   IMPORTANT:
   These helpers are exported for Parts 3-11.
========================================================= */

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value === undefined ||
            value === null
                ? ""
                : String(value);

    }

}


/* =========================================================
   SAFE NUMBER
========================================================= */

function numberValue(value) {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return 0;

    }


    const number =
        Number(value);


    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    return String(
        status ?? "pending"
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

}


/* =========================================================
   NORMALIZE TYPE
========================================================= */

function normalizeTransactionType(type) {

    return String(
        type ?? "transaction"
    )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/-/g, "_");

}


/* =========================================================
   FORMAT MONEY
   MONEY VAULT = RWF / FRW
========================================================= */

function formatMoney(amount) {

    return (
        numberValue(amount)
            .toLocaleString(
                "en-US",
                {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }
            )
        + " RWF"
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(timestamp) {

    let value =
        numberValue(timestamp);


    if (!value) {

        return "N/A";

    }


    /*
     * Firebase timestamps are normally
     * milliseconds.
     *
     * If a timestamp is accidentally stored
     * in seconds, convert it.
     */

    if (
        value > 0 &&
        value < 100000000000
    ) {

        value *= 1000;

    }


    try {

        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return "N/A";

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

    } catch (error) {

        console.error(
            "formatDate error:",
            error
        );

        return "N/A";

    }

}


/* =========================================================
   SAFE HTML ESCAPE
========================================================= */

function escapeHTML(value) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   GET TIMESTAMP
   Supports multiple existing DB field names.
========================================================= */

function getDataTimestamp(data) {

    if (!data) {

        return 0;

    }


    const timestamp =
        data.createdAt ??
        data.timestamp ??
        data.date ??
        data.requestDate ??
        data.approvedAt ??
        data.updatedAt ??
        data.time ??
        0;


    return numberValue(
        timestamp
    );

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

let dashboardListenersStarted =
    false;


/* =========================================================
   DASHBOARD ERROR CONTROL
========================================================= */

let dashboardErrorShown = {

    users: false,

    deposits: false,

    withdraws: false,

    transactions: false

};


/* =========================================================
   LOAD DASHBOARD
========================================================= */

async function loadDashboard() {

    try {

        await window.waitForAdmin();


        /*
         * Prevent duplicate Firebase listeners.
         */

        if (
            dashboardListenersStarted
        ) {

            renderDashboard();

            return;

        }


        dashboardListenersStarted =
            true;
/* =========================================================
   QUICK ACTION — WITHDRAWS
========================================================= */

const openWithdrawsBtn = document.getElementById("openWithdraws");

if (openWithdrawsBtn && !openWithdrawsBtn.dataset.bound) {

    openWithdrawsBtn.dataset.bound = "true";

    openWithdrawsBtn.addEventListener("click", async () => {

        /* -----------------------------------------
           OPEN WITHDRAW PAGE
        ----------------------------------------- */

        openPage("withdraws");

        /* -----------------------------------------
           LOAD WITHDRAW LIST
        ----------------------------------------- */

        try {

            await loadWithdraws();

            /* Ensure list is rendered immediately */
            if (typeof renderWithdrawRequests === "function") {
                renderWithdrawRequests();
            }

            /* Ensure search/filter are active */
            if (typeof setupWithdrawSearch === "function") {
                setupWithdrawSearch();
            }

        } catch (error) {

            console.error(
                "Quick Action Withdraw error:",
                error
            );

            showToast(
                "Unable to load withdraw requests.",
                "error"
            );

        }

    });

}

        /* =================================================
           USERS LISTENER
        ================================================= */

        if (
            !listeners.dashboardUsers
        ) {

            listeners.dashboardUsers =
                onValue(

                    ref(
                        db,
                        "users"
                    ),

                    snapshot => {

                        dashboardUsers =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.users =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard users listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.users
                        ) {

                            dashboardErrorShown.users =
                                true;


                            showToast(
                                "Failed to load users data.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           DEPOSIT REQUESTS LISTENER
        ================================================= */

        if (
            !listeners.dashboardDeposits
        ) {

            listeners.dashboardDeposits =
                onValue(

                    ref(
                        db,
                        "depositRequests"
                    ),

                    snapshot => {

                        dashboardDeposits =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.deposits =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard deposits listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.deposits
                        ) {

                            dashboardErrorShown.deposits =
                                true;


                            showToast(
                                "Failed to load deposit data.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           WITHDRAW REQUESTS LISTENER
        ================================================= */

        if (
            !listeners.dashboardWithdraws
        ) {

            listeners.dashboardWithdraws =
                onValue(

                    ref(
                        db,
                        "withdrawRequests"
                    ),

                    snapshot => {

                        dashboardWithdraws =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.withdraws =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard withdraws listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.withdraws
                        ) {

                            dashboardErrorShown.withdraws =
                                true;


                            showToast(
                                "Failed to load withdraw data.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           TRANSACTIONS LISTENER
        ================================================= */

        if (
            !listeners.dashboardTransactions
        ) {

            listeners.dashboardTransactions =
                onValue(

                    ref(
                        db,
                        "transactions"
                    ),

                    snapshot => {

                        dashboardTransactions =
                            snapshot.exists()
                                ? snapshot.val() || {}
                                : {};


                        dashboardErrorShown.transactions =
                            false;


                        renderDashboard();

                    },

                    error => {

                        console.error(
                            "Dashboard transactions listener error:",
                            error
                        );


                        if (
                            !dashboardErrorShown.transactions
                        ) {

                            dashboardErrorShown.transactions =
                                true;


                            showToast(
                                "Failed to load transactions.",
                                "error"
                            );

                        }

                    }

                );

        }


        /* =================================================
           INITIAL RENDER
        ================================================= */

        renderDashboard();


        console.log(
            "Dashboard listeners initialized."
        );


    } catch (error) {

        console.error(
            "loadDashboard error:",
            error
        );


        dashboardListenersStarted =
            false;


        showToast(
            error?.message ||
            "Unable to load dashboard.",
            "error"
        );

    }

}


/* =========================================================
   RENDER DASHBOARD
========================================================= */

function renderDashboard() {


    /* =====================================================
       USERS
    ===================================================== */

    const users =
        Object.values(
            dashboardUsers || {}
        );


    const totalUsers =
        users.length;


    /* =====================================================
       SYSTEM BALANCE
       READ ONLY
    ===================================================== */

    let systemBalance =
        0;


    users.forEach(
        user => {

            if (!user) {
                return;
            }


            systemBalance +=
                numberValue(
                    user.balance
                );

        }
    );


    /* =====================================================
       DEPOSITS
    ===================================================== */

    const deposits =
        Object.values(
            dashboardDeposits || {}
        );


    let totalDeposits =
        0;


    let pendingDeposits =
        0;


    let approvedDeposits =
        0;


    deposits.forEach(
        deposit => {

            if (!deposit) {
                return;
            }


            const status =
                normalizeStatus(
                    deposit.status
                );


            const amount =
                numberValue(
                    deposit.amount
                );


            if (
                status === "approved"
            ) {

                approvedDeposits++;

                totalDeposits +=
                    amount;

            }


            if (
                status === "pending" ||
                status === "processing"
            ) {

                pendingDeposits++;

            }

        }
    );


    /* =====================================================
       WITHDRAWS
    ===================================================== */

    const withdraws =
        Object.values(
            dashboardWithdraws || {}
        );


    let totalWithdraws =
        0;


    withdraws.forEach(
        withdraw => {

            if (!withdraw) {
                return;
            }


            const status =
                normalizeStatus(
                    withdraw.status
                );


            const amount =
                numberValue(
                    withdraw.amount
                );


            if (
                status === "approved"
            ) {

                totalWithdraws +=
                    amount;

            }

        }
    );


    /* =====================================================
       UPDATE DASHBOARD
===================================================== */

    updateText(
        "totalUsers",
        totalUsers.toLocaleString(
            "en-US"
        )
    );


    updateText(
        "dashboardTotalDeposits",
        formatMoney(
            totalDeposits
        )
    );


    updateText(
        "dashboardPendingDeposits",
        pendingDeposits.toLocaleString(
            "en-US"
        )
    );


    /*
     * Existing HTML ID:
     * dashboardApprovedDeposits
     *
     * We keep it as approved deposit amount
     * to remain compatible with the current
     * Money Vault dashboard.
     */

    updateText(
        "dashboardApprovedDeposits",
        formatMoney(
            totalDeposits
        )
    );


    updateText(
        "dashboardTotalWithdraws",
        formatMoney(
            totalWithdraws
        )
    );


    updateText(
        "systemBalance",
        formatMoney(
            systemBalance
        )
    );


    /* =====================================================
       RECENT ACTIVITY
    ===================================================== */

    renderRecentActivity();

}


/* =========================================================
   GET TRANSACTION USER
========================================================= */

function getDashboardTransactionUser(
    transaction
) {

    if (!transaction) {

        return null;

    }


    const uid =
        transaction.uid ||
        transaction.userId;


    if (!uid) {

        return null;

    }


    return (
        dashboardUsers?.[uid] ||
        null
    );

}


/* =========================================================
   GET TRANSACTION USER NAME
========================================================= */

function getDashboardUserName(
    transaction
) {

    const user =
        getDashboardTransactionUser(
            transaction
        );


    return (
        transaction?.userName ||
        transaction?.name ||
        transaction?.displayName ||
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        user?.email ||
        "User"
    );

}


/* =========================================================
   GET TRANSACTION USER EMAIL
========================================================= */

function getDashboardUserEmail(
    transaction
) {

    const user =
        getDashboardTransactionUser(
            transaction
        );


    return (
        transaction?.userEmail ||
        transaction?.email ||
        user?.email ||
        ""
    );

}


/* =========================================================
   GET TRANSACTION USER PHONE
========================================================= */

function getDashboardUserPhone(
    transaction
) {

    const user =
        getDashboardTransactionUser(
            transaction
        );


    return (
        transaction?.phone ||
        transaction?.phoneNumber ||
        user?.phone ||
        user?.phoneNumber ||
        ""
    );

}


/* =========================================================
   GET TRANSACTION TYPE DISPLAY
========================================================= */

function getDashboardTransactionType(
    transaction
) {

    const type =
        normalizeTransactionType(
            transaction?.type ??
            transaction?.transactionType ??
            "transaction"
        );


    if (
        type === "deposit" ||
        type === "deposit_approved" ||
        type === "depositapproved"
    ) {

        return {

            key: "deposit",

            title: "Deposit",

            icon:
                "fa-circle-arrow-down",

            direction:
                "+",

            className:
                "deposit"

        };

    }


    if (
        type === "withdraw" ||
        type === "withdrawal" ||
        type === "withdraw_request"
    ) {

        return {

            key: "withdraw",

            title: "Withdraw",

            icon:
                "fa-circle-arrow-up",

            direction:
                "-",

            className:
                "withdraw"

        };

    }


    if (
        type === "vip" ||
        type === "vip_purchase" ||
        type === "vippurchase"
    ) {

        return {

            key: "vip",

            title:
                "VIP Purchase",

            icon:
                "fa-crown",

            direction:
                "-",

            className:
                "vip"

        };

    }


    if (
        type === "profit" ||
        type === "daily_profit" ||
        type === "dailyprofit"
    ) {

        return {

            key: "profit",

            title:
                "Profit",

            icon:
                "fa-chart-line",

            direction:
                "+",

            className:
                "profit"

        };

    }


    if (
        type === "bonus" ||
        type === "registration_bonus" ||
        type === "signup_bonus"
    ) {

        return {

            key: "bonus",

            title:
                "Bonus",

            icon:
                "fa-gift",

            direction:
                "+",

            className:
                "bonus"

        };

    }


    if (
        type === "referral" ||
        type === "referral_bonus" ||
        type === "referralbonus"
    ) {

        return {

            key: "referral",

            title:
                "Referral Bonus",

            icon:
                "fa-user-group",

            direction:
                "+",

            className:
                "referral"

        };

    }


    return {

        key:
            "transaction",

        title:
            "Transaction",

        icon:
            "fa-money-bill-transfer",

        direction:
            "",

        className:
            "transaction"

    };

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
        )
        .map(
            ([id, transaction]) => {

                return {

                    id,

                    ...(transaction || {})

                };

            }
        );


    /* =====================================================
       SORT NEWEST FIRST
    ===================================================== */

    transactions.sort(
        (a, b) => {

            return (
                getDataTimestamp(b) -
                getDataTimestamp(a)
            );

        }
    );


    /* =====================================================
       ONLY LAST 10
    ===================================================== */

    const recent =
        transactions.slice(
            0,
            10
        );


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (!recent.length) {

        container.innerHTML = `

            <div class="empty-state">

                <i class="
                    fa-solid
                    fa-clock-rotate-left
                "></i>

                <p>
                    No recent activity.
                </p>

            </div>

        `;

        return;

    }


    /* =====================================================
       RENDER
    ===================================================== */

    container.innerHTML =
        recent
            .map(
                transaction => {

                    const transactionInfo =
                        getDashboardTransactionType(
                            transaction
                        );


                    const status =
                        normalizeStatus(
                            transaction.status
                        );


                    const amount =
                        numberValue(
                            transaction.amount
                        );


                    const userName =
                        getDashboardUserName(
                            transaction
                        );


                    const userEmail =
                        getDashboardUserEmail(
                            transaction
                        );


                    const userPhone =
                        getDashboardUserPhone(
                            transaction
                        );


                    const date =
                        formatDate(
                            getDataTimestamp(
                                transaction
                            )
                        );


                    const amountDisplay =
                        `${transactionInfo.direction}${formatMoney(amount)}`;


                    const userExtra =
                        userEmail ||
                        userPhone ||
                        "";


                    return `

                        <div
                            class="
                                activity-item
                                activity-${escapeHTML(
                                    transactionInfo.className
                                )}
                            "
                            data-transaction-id="${escapeHTML(
                                transaction.id
                            )}"
                        >

                            <!-- ACTIVITY ICON -->

                            <div class="
                                activity-icon
                                activity-icon-${escapeHTML(
                                    transactionInfo.className
                                )}
                            ">

                                <i class="
                                    fa-solid
                                    ${escapeHTML(
                                        transactionInfo.icon
                                    )}
                                "></i>

                            </div>


                            <!-- ACTIVITY CONTENT -->

                            <div class="
                                activity-content
                            ">

                                <div class="
                                    activity-title
                                ">

                                    ${escapeHTML(
                                        transactionInfo.title
                                    )}

                                </div>


                                <div class="
                                    activity-user
                                ">

                                    ${escapeHTML(
                                        userName
                                    )}

                                </div>


                                ${
                                    userExtra
                                        ? `
                                            <div class="
                                                activity-user-extra
                                            ">

                                                ${escapeHTML(
                                                    userExtra
                                                )}

                                            </div>
                                        `
                                        : ""
                                }


                                <div class="
                                    activity-date
                                ">

                                    ${escapeHTML(
                                        date
                                    )}

                                </div>

                            </div>


                            <!-- ACTIVITY RIGHT -->

                            <div class="
                                activity-right
                            ">

                                <div class="
                                    activity-amount
                                    activity-amount-${escapeHTML(
                                        transactionInfo.className
                                    )}
                                ">

                                    ${escapeHTML(
                                        amountDisplay
                                    )}

                                </div>


                                <div class="
                                    activity-status
                                    status-${escapeHTML(
                                        status
                                    )}
                                ">

                                    ${escapeHTML(
                                        status
                                    )}

                                </div>

                            </div>

                        </div>

                    `;

                }
            )
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

        openDeposits:
            "deposits",

        openWithdraws:
            "withdraws",

        openUsers:
            "users",

        openTransactions:
            "transactions",

        openSettings:
            "settings",

        openVipRequests:
            "vipRequests"

    };


    Object.entries(
        actions
    ).forEach(
        ([id, page]) => {

            const button =
                document.getElementById(
                    id
                );


            if (!button) {

                return;

            }


            /*
             * Prevent duplicate
             * click listeners.
             */

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

                        window.openPage(
                            page
                        );

                    }

                }
            );

        }
    );

}


/* =========================================================
   GET DASHBOARD CACHE
   Useful for future Parts / debugging.
========================================================= */

window.getDashboardCache =
    function () {

        return {

            users:
                dashboardUsers,

            deposits:
                dashboardDeposits,

            withdraws:
                dashboardWithdraws,

            transactions:
                dashboardTransactions

        };

    };


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


window.normalizeTransactionType =
    normalizeTransactionType;


window.formatMoney =
    formatMoney;


window.formatDate =
    formatDate;


window.escapeHTML =
    escapeHTML;


window.getDataTimestamp =
    getDataTimestamp;


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

console.log(
    "Dashboard data paths:"
);

console.log(
    " - users"
);

console.log(
    " - depositRequests"
);

console.log(
    " - withdrawRequests"
);

console.log(
    " - transactions"
);

console.log(
    "Recent activity: user lookup by UID enabled."
);

console.log(
    "Dashboard listeners: protected against duplicates."
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
   - User avatar
   - Approve / Reject buttons
   - One-time button protection
   - Processing state support
   - Approved / Rejected history
   - Compatible with PART 1, PART 2 and PART 4
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
        .toLowerCase()
        .replace(/\s+/g, "_");
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
        user?.telephone ||
        "N/A"
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
   PAYMENT METHOD
========================================================= */

function depositPaymentMethod(request) {

    return (
        request?.paymentMethod ||
        request?.method ||
        request?.provider ||
        request?.network ||
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
        request?.referenceId ||
        "N/A"
    );
}


/* =========================================================
   REQUEST DATE
========================================================= */

function depositRequestDate(request) {

    if (!request) {
        return 0;
    }

    return (
        request.createdAt ??
        request.timestamp ??
        request.date ??
        request.requestedAt ??
        request.created_at ??
        0
    );
}


/* =========================================================
   NORMALIZE TIMESTAMP
========================================================= */

function normalizeDepositTimestamp(value) {

    let timestamp = depositValue(value);

    if (!timestamp) {
        return 0;
    }

    /*
       Firebase data can sometimes contain seconds
       instead of milliseconds.
    */

    if (timestamp < 100000000000) {
        timestamp *= 1000;
    }

    return timestamp;
}


/* =========================================================
   REQUEST STATUS LABEL
========================================================= */

function depositStatusLabel(status) {

    const normalized =
        depositStatus(status);

    switch (normalized) {

        case "pending":
            return "Pending";

        case "processing":
            return "Processing";

        case "approved":
            return "Approved";

        case "rejected":
            return "Rejected";

        case "processing_error":
            return "Processing Error";

        default:
            return normalized
                .replace(/_/g, " ")
                .replace(/\b\w/g, char =>
                    char.toUpperCase()
                );
    }
}


/* =========================================================
   STATUS ICON
========================================================= */

function depositStatusIcon(status) {

    switch (
        depositStatus(status)
    ) {

        case "approved":
            return "fa-circle-check";

        case "rejected":
            return "fa-circle-xmark";

        case "processing":
            return "fa-spinner fa-spin";

        case "processing_error":
            return "fa-triangle-exclamation";

        case "pending":
        default:
            return "fa-clock";
    }
}


/* =========================================================
   STATUS CLASS
========================================================= */

function depositStatusClass(status) {

    const normalized =
        depositStatus(status);

    return [
        "pending",
        "processing",
        "approved",
        "rejected",
        "processing_error"
    ].includes(normalized)
        ? normalized
        : "pending";
}


/* =========================================================
   LOAD DEPOSITS
========================================================= */

async function loadDeposits() {

    try {

        await window.waitForAdmin();


        /* =================================================
           PREVENT DUPLICATE LISTENERS
        ================================================= */

        if (depositListenersStarted) {

            renderDepositRequests();

            setupDepositSearch();

            return;
        }


        depositListenersStarted = true;


        /* =================================================
           USERS LISTENER
        ================================================= */

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


        /* =================================================
           DEPOSIT REQUESTS LISTENER
        ================================================= */

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


                    /* =====================================
                       NEWEST FIRST
                    ===================================== */

                    allDepositRequests.sort(
                        (a, b) => {

                            return (
                                normalizeDepositTimestamp(
                                    depositRequestDate(b)
                                ) -
                                normalizeDepositTimestamp(
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


        setupDepositSearch();

        renderDepositRequests();


    } catch (error) {

        console.error(
            "loadDeposits error:",
            error
        );

        depositListenersStarted = false;

        showToast(
            "Unable to load deposits.",
            "error"
        );

    }

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

            }


            else if (
                status === "approved"
            ) {

                approvedCount++;

            }


            else if (
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


                /* =========================================
                   STATUS FILTER
                ========================================= */

                if (
                    filter !== "all" &&
                    status !== filter
                ) {

                    return false;

                }


                /* =========================================
                   USER
                ========================================= */

                const uid =
                    String(
                        request.uid ||
                        request.userId ||
                        ""
                    )
                    .toLowerCase();


                const requestUid =
                    request.uid ||
                    request.userId ||
                    "";


                const user =
                    depositUsers[
                        requestUid
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


                /* =========================================
                   REQUEST DATA
                ========================================= */

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


                const amount =
                    String(
                        request.amount ?? ""
                    )
                    .toLowerCase();


                const requestStatus =
                    depositStatusLabel(
                        status
                    )
                    .toLowerCase();


                /* =========================================
                   SEARCH
                ========================================= */

                if (search) {

                    const searchableText = [

                        uid,

                        name,

                        email,

                        phone,

                        transactionId,

                        method,

                        requestId,

                        amount,

                        requestStatus

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

            empty.style.display =
                "block";


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

        empty.style.display =
            "none";

    }


    /* =====================================================
       RENDER LIST
    ===================================================== */

    list.innerHTML =
        filtered
            .map(
                request => {

                    const requestUid =
                        request.uid ||
                        request.userId ||
                        "";

                    return renderDepositCard(
                        request,
                        depositUsers[
                            requestUid
                        ] || {}
                    );

                }
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


    const statusClass =
        depositStatusClass(
            status
        );


    const statusLabel =
        depositStatusLabel(
            status
        );


    const statusIcon =
        depositStatusIcon(
            status
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
        request.userId ||
        "N/A";


    const photo =
        depositUserPhoto(
            user
        );


    /* =====================================================
       AVATAR
    ===================================================== */

    const avatar =
        photo
            ? `

                <img
                    src="${escapeHTML(photo)}"
                    alt="User"
                    class="deposit-avatar"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        if(this.nextElementSibling){
                            this.nextElementSibling.style.display='flex';
                        }
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

                <div
                    class="deposit-avatar-fallback"
                >
                    <i class="fa-solid fa-user"></i>
                </div>

              `;


    /* =====================================================
       ACTIONS
    ===================================================== */

    let actions = "";


    if (status === "pending") {

        actions = `

            <div class="deposit-actions">

                <button
                    type="button"
                    class="
                        deposit-action-btn
                        approve-deposit-btn
                    "
                    data-id="${escapeHTML(request.id)}"
                >

                    <i class="fa-solid fa-check"></i>

                    Approve

                </button>


                <button
                    type="button"
                    class="
                        deposit-action-btn
                        reject-deposit-btn
                    "
                    data-id="${escapeHTML(request.id)}"
                >

                    <i class="fa-solid fa-xmark"></i>

                    Reject

                </button>

            </div>

        `;

    }


    else {

        actions = `

            <div
                class="
                    deposit-processed-message
                    status-${escapeHTML(statusClass)}
                "
            >

                <i class="
                    fa-solid
                    ${escapeHTML(statusIcon)}
                "></i>

                ${escapeHTML(statusLabel)}

            </div>

        `;

    }


    /* =====================================================
       OPTIONAL ERROR / REJECTION MESSAGE
    ===================================================== */

    let statusMessage = "";


    if (
        request.rejectionReason ||
        request.reason ||
        request.error
    ) {

        const message =
            request.rejectionReason ||
            request.reason ||
            request.error;


        statusMessage = `

            <div class="deposit-status-message">

                <i class="
                    fa-solid
                    fa-circle-info
                "></i>

                <span>
                    ${escapeHTML(
                        String(message)
                    )}
                </span>

            </div>

        `;

    }


    /* =====================================================
       CARD
    ===================================================== */

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


                <div
                    class="
                        deposit-status
                        status-${escapeHTML(statusClass)}
                    "
                >

                    <i class="
                        fa-solid
                        ${escapeHTML(statusIcon)}
                    "></i>

                    ${escapeHTML(statusLabel)}

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

                        <i class="
                            fa-solid
                            fa-mobile-screen-button
                        "></i>

                        Phone

                    </span>


                    <strong>

                        ${escapeHTML(phone)}

                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>

                        <i class="
                            fa-solid
                            fa-wallet
                        "></i>

                        Payment Method

                    </span>


                    <strong>

                        ${escapeHTML(method)}

                    </strong>

                </div>


                <div class="deposit-detail">

                    <span>

                        <i class="
                            fa-solid
                            fa-receipt
                        "></i>

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

                        <i class="
                            fa-solid
                            fa-calendar
                        "></i>

                        Requested

                    </span>


                    <strong>

                        ${escapeHTML(date)}

                    </strong>

                </div>

            </div>


            <!-- =========================================
                 TECHNICAL INFORMATION
            ========================================== -->

            <div class="deposit-meta">

                <span>

                    UID:
                    ${escapeHTML(String(uid))}

                </span>


                <span>

                    Request:
                    ${escapeHTML(String(request.id))}

                </span>

            </div>


            <!-- =========================================
                 STATUS MESSAGE
            ========================================== -->

            ${statusMessage}


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


    /* =====================================================
       APPROVE BUTTONS
    ===================================================== */

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


                    /*
                       ONE-TIME UI PROTECTION

                       Prevent double-click while
                       Firebase approval is running.
                    */

                    if (
                        button.dataset.processing ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset.processing =
                        "true";


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

                        await approveDeposit(
                            id
                        );


                    } catch (error) {

                        console.error(
                            "Approve deposit button error:",
                            error
                        );


                        /*
                           Restore button only if
                           the card still exists.
                        */

                        button.disabled =
                            false;


                        button.dataset.processing =
                            "false";


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


    /* =====================================================
       REJECT BUTTONS
    ===================================================== */

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


                    /*
                       ONE-TIME UI PROTECTION
                    */

                    if (
                        button.dataset.processing ===
                        "true"
                    ) {

                        return;

                    }


                    button.dataset.processing =
                        "true";


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
                            "Reject deposit button error:",
                            error
                        );


                        button.disabled =
                            false;


                        button.dataset.processing =
                            "false";


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
   SEARCH + FILTER
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


    /* =====================================================
       SEARCH INPUT
    ===================================================== */

    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound =
            "true";


        search.addEventListener(
            "input",
            () => {

                renderDepositRequests();

            }
        );

    }


    /* =====================================================
       FILTER
    ===================================================== */

    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound =
            "true";


        filter.addEventListener(
            "change",
            () => {

                renderDepositRequests();

            }
        );

    }

}


/* =========================================================
   REFRESH DEPOSIT LIST
========================================================= */

function refreshDeposits() {

    renderDepositRequests();

}


/* =========================================================
   GET DEPOSIT CACHE
========================================================= */

function getDepositCache() {

    return {

        requests: allDepositRequests,

        users: depositUsers

    };

}


/* =========================================================
   INITIALIZE SEARCH / FILTER SAFELY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            setupDepositSearch();

        },
        {
            once: true
        }
    );

}

else {

    setupDepositSearch();

}


/* =========================================================
   EXPORT
========================================================= */

window.loadDeposits =
    loadDeposits;


window.renderDepositRequests =
    renderDepositRequests;


window.setupDepositSearch =
    setupDepositSearch;


window.refreshDeposits =
    refreshDeposits;


window.getDepositCache =
    getDepositCache;


/*
   approveDeposit() and rejectDeposit()
   are implemented in PART 4.

   We intentionally do NOT redefine them here.
*/


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 3 loaded successfully."
);

console.log(
    "Deposit currency: RWF / FRW"
);

console.log(
    "Deposit approval logic: PART 4"
);

console.log(
    "Deposit listeners ready:",
    {
        users: !!listeners.depositUsers,
        requests: !!listeners.depositRequests
    }
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 4
   APPROVE / REJECT DEPOSIT REQUESTS
   CURRENCY: RWF / FRW

   FEATURES:
   - Admin-only approval
   - One-time approval protection
   - Atomic request locking
   - Automatic balance update
   - Automatic totalDeposits update
   - Automatic totalTransactions update
   - Transaction history creation
   - Reject deposit
   - Processing / processing_error protection
   - Compatible with PART 1, PART 2 and PART 3

   IMPORTANT:
   - PART 3 handles the UI/list.
   - PART 4 handles the actual approval/rejection.
   - Do NOT redeclare listeners/currentAdmin here.
========================================================= */


/* =========================================================
   APPROVE DEPOSIT
========================================================= */

async function approveDeposit(id) {

    /* =====================================================
       ADMIN CHECK
    ===================================================== */

    await window.waitForAdmin();


    if (!currentAdmin?.uid) {

        showToast(
            "Administrator authentication required.",
            "error"
        );

        throw new Error(
            "Administrator is not authenticated."
        );

    }


    /* =====================================================
       VALIDATE REQUEST ID
    ===================================================== */

    if (!id) {

        showToast(
            "Invalid deposit request.",
            "error"
        );

        throw new Error(
            "Deposit request ID is missing."
        );

    }


    const requestRef =
        ref(
            db,
            `depositRequests/${id}`
        );


    /* =====================================================
       READ REQUEST
    ===================================================== */

    const requestSnapshot =
        await get(
            requestRef
        );


    if (!requestSnapshot.exists()) {

        showToast(
            "Deposit request was not found.",
            "error"
        );

        throw new Error(
            "Deposit request does not exist."
        );

    }


    const request =
        requestSnapshot.val() || {};


    const status =
        String(
            request.status ??
            "pending"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       ONE-TIME PROTECTION
    ===================================================== */

    if (status !== "pending") {

        showToast(
            `This deposit is already ${status.replace("_", " ")}.`,
            "warning"
        );

        return false;

    }


    /* =====================================================
       USER ID
    ===================================================== */

    const uid =
        request.uid ||
        request.userId ||
        null;


    if (!uid) {

        showToast(
            "Deposit request has no user ID.",
            "error"
        );

        throw new Error(
            "Deposit request UID is missing."
        );

    }


    /* =====================================================
       AMOUNT
    ===================================================== */

    const amount =
        Number(
            request.amount
        );


    if (
        !Number.isFinite(amount) ||
        amount <= 0
    ) {

        showToast(
            "Invalid deposit amount.",
            "error"
        );

        throw new Error(
            "Invalid deposit amount."
        );

    }


    /* =====================================================
       CONFIRM
    ===================================================== */

    const confirmed =
        window.confirm(
            `Approve deposit of ${formatMoney(amount)}?`
        );


    if (!confirmed) {

        return false;

    }


    /* =====================================================
       STEP 1
       LOCK REQUEST
    ===================================================== */

    let lockResult;


    try {

        lockResult =
            await runTransaction(
                requestRef,

                currentRequest => {

                    if (
                        currentRequest === null
                    ) {

                        return;

                    }


                    const currentStatus =
                        String(
                            currentRequest.status ??
                            "pending"
                        )
                        .trim()
                        .toLowerCase();


                    /*
                       Only PENDING can enter PROCESSING.

                       This is the database-level
                       one-time approval protection.
                    */

                    if (
                        currentStatus !== "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status: "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin.uid

                    };

                }
            );


    } catch (error) {

        console.error(
            "Deposit lock error:",
            error
        );

        showToast(
            "Unable to lock deposit request.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       CHECK LOCK
    ===================================================== */

    if (
        !lockResult.committed
    ) {

        showToast(
            "This deposit has already been processed.",
            "warning"
        );

        return false;

    }


    /* =====================================================
       STEP 2
       READ USER
    ===================================================== */

    const userRef =
        ref(
            db,
            `users/${uid}`
        );


    let userSnapshot;


    try {

        userSnapshot =
            await get(
                userRef
            );


    } catch (error) {

        console.error(
            "Deposit user read error:",
            error
        );


        await markDepositProcessingError(
            id,
            "Unable to read user account."
        );


        showToast(
            "Unable to read user account.",
            "error"
        );

        throw error;

    }


    if (
        !userSnapshot.exists()
    ) {

        await markDepositProcessingError(
            id,
            "User account not found."
        );


        showToast(
            "User account was not found.",
            "error"
        );

        throw new Error(
            "User account does not exist."
        );

    }


    const user =
        userSnapshot.val() || {};


    /* =====================================================
       CURRENT USER VALUES
    ===================================================== */

    const currentBalance =
        Number(
            user.balance
        ) || 0;


    const currentTotalDeposits =
        Number(
            user.totalDeposits
        ) || 0;


    const currentTotalTransactions =
        Number(
            user.totalTransactions
        ) || 0;


    const newBalance =
        currentBalance +
        amount;


    const newTotalDeposits =
        currentTotalDeposits +
        amount;


    const newTotalTransactions =
        currentTotalTransactions +
        1;


    const now =
        Date.now();


    /* =====================================================
       STEP 3
       UPDATE USER FINANCIAL DATA ATOMICALLY
    ===================================================== */

    let userTransactionResult;


    try {

        userTransactionResult =
            await runTransaction(
                userRef,

                currentUser => {

                    if (
                        currentUser === null
                    ) {

                        return;

                    }


                    const balance =
                        Number(
                            currentUser.balance
                        ) || 0;


                    const totalDeposits =
                        Number(
                            currentUser.totalDeposits
                        ) || 0;


                    const totalTransactions =
                        Number(
                            currentUser.totalTransactions
                        ) || 0;


                    return {

                        ...currentUser,

                        balance:
                            balance + amount,

                        totalDeposits:
                            totalDeposits + amount,

                        totalTransactions:
                            totalTransactions + 1

                    };

                }
            );


    } catch (error) {

        console.error(
            "Deposit user transaction error:",
            error
        );


        await markDepositProcessingError(
            id,
            "Unable to update user balance."
        );


        showToast(
            "Unable to update user balance.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       CHECK USER UPDATE
    ===================================================== */

    if (
        !userTransactionResult.committed
    ) {

        await markDepositProcessingError(
            id,
            "User account could not be updated."
        );


        showToast(
            "User account could not be updated.",
            "error"
        );

        throw new Error(
            "User transaction was not committed."
        );

    }


    /* =====================================================
       STEP 4
       CREATE TRANSACTION RECORD
    ===================================================== */

    const transactionRef =
        push(
            ref(
                db,
                "transactions"
            )
        );


    const transactionId =
        transactionRef.key;


    const paymentMethod =
        request.paymentMethod ||
        request.method ||
        request.provider ||
        "N/A";


    const userTransactionId =
        request.transactionId ||
        request.transactionID ||
        request.txId ||
        request.reference ||
        "";


    const transactionData = {

        uid: uid,

        type: "Deposit",

        transactionType:
            "deposit",

        amount: amount,

        status:
            "approved",

        currency:
            "RWF",

        paymentMethod:
            paymentMethod,

        transactionId:
            userTransactionId,

        requestId:
            id,

        createdAt:
            now,

        timestamp:
            now,

        approvedAt:
            now,

        approvedBy:
            currentAdmin.uid

    };


    try {

        await set(
            transactionRef,
            transactionData
        );


    } catch (error) {

        console.error(
            "Deposit transaction creation error:",
            error
        );


        /*
           Balance has already been updated.

           We DO NOT try to blindly subtract it again
           because that could damage a later balance.

           Instead, mark the request as
           processing_error so the admin knows
           manual reconciliation is required.
        */

        await markDepositProcessingError(
            id,
            "Balance updated, but transaction record could not be created."
        );


        showToast(
            "Balance updated, but transaction history failed.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       STEP 5
       FINALIZE DEPOSIT REQUEST
    ===================================================== */

    try {

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    now,

                approvedBy:
                    currentAdmin.uid,

                transactionRecordId:
                    transactionId,

                currency:
                    "RWF"

            }
        );


    } catch (error) {

        console.error(
            "Deposit request finalization error:",
            error
        );


        await markDepositProcessingError(
            id,
            "Balance and transaction updated, but request finalization failed."
        );


        showToast(
            "Deposit processed but final status update failed.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    showToast(
        `Deposit of ${formatMoney(amount)} approved successfully.`,
        "success"
    );


    /* =====================================================
       REFRESH UI
    ===================================================== */

    try {

        renderDepositRequests();

    } catch (error) {

        console.warn(
            "Deposit list refresh failed:",
            error
        );

    }


    try {

        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();

        }

    } catch (error) {

        console.warn(
            "Dashboard refresh failed:",
            error
        );

    }


    try {

        if (
            typeof refreshTransactions ===
            "function"
        ) {

            refreshTransactions();

        }

    } catch (error) {

        console.warn(
            "Transaction refresh failed:",
            error
        );

    }


    return true;

}


/* =========================================================
   MARK PROCESSING ERROR
========================================================= */

async function markDepositProcessingError(
    id,
    message
) {

    if (!id) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `depositRequests/${id}`
            );


        const snapshot =
            await get(
                requestRef
            );


        if (!snapshot.exists()) {
            return;
        }


        const request =
            snapshot.val() || {};


        const currentStatus =
            String(
                request.status ??
                ""
            )
            .trim()
            .toLowerCase();


        /*
           IMPORTANT:

           Do not overwrite an already approved
           or rejected request.
        */

        if (
            currentStatus !== "processing"
        ) {

            return;

        }


        await update(
            requestRef,
            {

                status:
                    "processing_error",

                error:
                    message ||
                    "Unknown processing error.",

                processingErrorAt:
                    Date.now(),

                processingErrorBy:
                    currentAdmin?.uid ||
                    null

            }
        );


    } catch (error) {

        console.error(
            "Unable to mark deposit processing error:",
            error
        );

    }

}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    /* =====================================================
       ADMIN CHECK
    ===================================================== */

    await window.waitForAdmin();


    if (!currentAdmin?.uid) {

        showToast(
            "Administrator authentication required.",
            "error"
        );

        throw new Error(
            "Administrator is not authenticated."
        );

    }


    /* =====================================================
       VALIDATE ID
    ===================================================== */

    if (!id) {

        showToast(
            "Invalid deposit request.",
            "error"
        );

        throw new Error(
            "Deposit request ID is missing."
        );

    }


    const requestRef =
        ref(
            db,
            `depositRequests/${id}`
        );


    /* =====================================================
       READ REQUEST
    ===================================================== */

    const snapshot =
        await get(
            requestRef
        );


    if (!snapshot.exists()) {

        showToast(
            "Deposit request was not found.",
            "error"
        );

        throw new Error(
            "Deposit request does not exist."
        );

    }


    const request =
        snapshot.val() || {};


    const status =
        String(
            request.status ??
            "pending"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       ONLY PENDING CAN BE REJECTED
    ===================================================== */

    if (
        status !== "pending"
    ) {

        showToast(
            `This deposit is already ${status.replace("_", " ")}.`,
            "warning"
        );

        return false;

    }


    /* =====================================================
       CONFIRM
    ===================================================== */

    const confirmed =
        window.confirm(
            "Are you sure you want to reject this deposit?"
        );


    if (!confirmed) {

        return false;

    }


    /* =====================================================
       OPTIONAL REASON
    ===================================================== */

    let rejectionReason = "";


    try {

        const enteredReason =
            window.prompt(
                "Reason for rejection (optional):"
            );


        if (
            enteredReason !== null
        ) {

            rejectionReason =
                String(
                    enteredReason
                )
                .trim()
                .slice(0, 500);

        }

    } catch (error) {

        console.warn(
            "Rejection reason prompt unavailable:",
            error
        );

    }


    /* =====================================================
       ATOMIC REJECTION
    ===================================================== */

    let result;


    try {

        result =
            await runTransaction(
                requestRef,

                currentRequest => {

                    if (
                        currentRequest === null
                    ) {

                        return;

                    }


                    const currentStatus =
                        String(
                            currentRequest.status ??
                            "pending"
                        )
                        .trim()
                        .toLowerCase();


                    /*
                       Only pending can become rejected.
                    */

                    if (
                        currentStatus !== "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status:
                            "rejected",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            currentAdmin.uid,

                        rejectionReason:
                            rejectionReason ||
                            "Rejected by administrator.",

                        currency:
                            "RWF"

                    };

                }
            );


    } catch (error) {

        console.error(
            "Reject deposit transaction error:",
            error
        );

        showToast(
            "Unable to reject deposit.",
            "error"
        );

        throw error;

    }


    /* =====================================================
       CHECK COMMIT
    ===================================================== */

    if (
        !result.committed
    ) {

        showToast(
            "This deposit has already been processed.",
            "warning"
        );

        return false;

    }


    /* =====================================================
       SUCCESS
    ===================================================== */

    showToast(
        "Deposit request rejected successfully.",
        "success"
    );


    /* =====================================================
       REFRESH UI
    ===================================================== */

    try {

        renderDepositRequests();

    } catch (error) {

        console.warn(
            "Deposit list refresh failed:",
            error
        );

    }


    return true;

}


/* =========================================================
   REFRESH DEPOSIT DATA
========================================================= */

async function refreshDepositData() {

    try {

        renderDepositRequests();

    } catch (error) {

        console.warn(
            "Deposit render refresh error:",
            error
        );

    }


    try {

        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();

        }

    } catch (error) {

        console.warn(
            "Dashboard refresh error:",
            error
        );

    }


    try {

        if (
            typeof refreshTransactions ===
            "function"
        ) {

            refreshTransactions();

        }

    } catch (error) {

        console.warn(
            "Transactions refresh error:",
            error
        );

    }

}


/* =========================================================
   EXPORT
========================================================= */

window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


window.markDepositProcessingError =
    markDepositProcessingError;


window.refreshDepositData =
    refreshDepositData;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault Admin Part 4 loaded successfully."
);

console.log(
    "Deposit approval currency: RWF / FRW"
);

console.log(
    "Deposit approval protection: ENABLED"
);

console.log(
    "Deposit balance update: ENABLED"
);

console.log(
    "Deposit transaction history: ENABLED"
);

   /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 5
   WITHDRAW REQUESTS
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   WITHDRAW STATE
========================================================= */

let allWithdrawRequests = [];
let withdrawUsers = {};

let withdrawListenersStarted = false;


/* =========================================================
   SAFE VALUE HELPERS
========================================================= */

function withdrawValue(value, fallback = "") {

    return value === undefined ||
           value === null ||
           value === ""
        ? fallback
        : value;
}


function withdrawNumber(value) {

    const n = Number(value);

    return Number.isFinite(n) ? n : 0;
}


function withdrawStatus(status) {

    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


function withdrawDate(value) {

    const timestamp = withdrawNumber(value);

    if (!timestamp) {
        return "N/A";
    }

    return new Date(timestamp).toLocaleString("en-GB", {

        day: "2-digit",
        month: "2-digit",
        year: "numeric",

        hour: "2-digit",
        minute: "2-digit"

    });
}


function withdrawMoney(value) {

    return withdrawNumber(value).toLocaleString("en-US", {

        minimumFractionDigits: 0,
        maximumFractionDigits: 0

    }) + " RWF";
}


/* =========================================================
   USER HELPERS
========================================================= */

function withdrawUserName(user, request = {}) {

    if (!user && !request) {
        return "Unknown User";
    }

    return (
        user?.fullName ||
        user?.name ||
        user?.displayName ||
        user?.username ||
        request?.fullName ||
        request?.name ||
        request?.username ||
        user?.email ||
        request?.email ||
        "Unknown User"
    );
}


function withdrawUserEmail(user, request = {}) {

    return (
        user?.email ||
        request?.email ||
        "N/A"
    );
}


function withdrawUserPhone(user, request = {}) {

    return (
        request?.phone ||
        request?.phoneNumber ||
        request?.mobile ||
        request?.telephone ||
        user?.phone ||
        user?.phoneNumber ||
        user?.mobile ||
        "N/A"
    );
}


function withdrawUserPhoto(user, request = {}) {

    return (
        user?.photoURL ||
        user?.photoUrl ||
        user?.photo ||
        user?.avatar ||
        request?.photoURL ||
        request?.photo ||
        ""
    );
}


/* =========================================================
   WITHDRAW REQUEST HELPERS
========================================================= */

function withdrawPaymentMethod(request) {

    return (
        request?.paymentMethod ||
        request?.method ||
        request?.provider ||
        request?.paymentProvider ||
        "N/A"
    );
}


function withdrawAccountName(request) {

    return (
        request?.accountName ||
        request?.accountHolder ||
        request?.receiverName ||
        request?.beneficiaryName ||
        request?.name ||
        "N/A"
    );
}


function withdrawAccountNumber(request) {

    return (
        request?.accountNumber ||
        request?.account ||
        request?.phone ||
        request?.phoneNumber ||
        request?.mobile ||
        "N/A"
    );
}


function withdrawRequestDate(request) {

    return (
        request?.createdAt ||
        request?.requestedAt ||
        request?.timestamp ||
        request?.date ||
        0
    );
}


function withdrawRequestUid(request) {

    return (
        request?.uid ||
        request?.userId ||
        request?.userUID ||
        ""
    );
}


function withdrawRequestAmount(request) {

    return withdrawNumber(
        request?.amount ??
        request?.withdrawAmount ??
        request?.requestedAmount ??
        0
    );
}


function withdrawRejectionReason(request) {

    return (
        request?.rejectionReason ||
        request?.rejectReason ||
        request?.reason ||
        ""
    );
}


/* =========================================================
   STATUS UI HELPERS
========================================================= */

function withdrawStatusLabel(status) {

    switch (withdrawStatus(status)) {

        case "pending":
            return "Pending";

        case "processing":
            return "Processing";

        case "approved":
            return "Approved";

        case "rejected":
            return "Rejected";

        case "processing_error":
            return "Processing Error";

        default:
            return String(status || "Pending");
    }
}


function withdrawStatusIcon(status) {

    switch (withdrawStatus(status)) {

        case "pending":
            return "fa-clock";

        case "processing":
            return "fa-spinner";

        case "approved":
            return "fa-circle-check";

        case "rejected":
            return "fa-circle-xmark";

        case "processing_error":
            return "fa-triangle-exclamation";

        default:
            return "fa-circle-info";
    }
}


function withdrawStatusClass(status) {

    switch (withdrawStatus(status)) {

        case "pending":
            return "pending";

        case "processing":
            return "processing";

        case "approved":
            return "approved";

        case "rejected":
            return "rejected";

        case "processing_error":
            return "error";

        default:
            return "pending";
    }
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeWithdrawHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   LOAD WITHDRAW REQUESTS
========================================================= */

async function loadWithdraws() {

    try {

        await waitForAdmin();

        if (!currentAdmin?.uid) {

            console.warn(
                "Withdraw loading stopped: admin not ready."
            );

            return;
        }


        /* -----------------------------------------
           PREVENT DUPLICATE LISTENERS
        ----------------------------------------- */

        if (withdrawListenersStarted) {

            renderWithdrawRequests();

            return;
        }


        withdrawListenersStarted = true;


        /* =====================================================
           USERS LISTENER
        ===================================================== */

        if (!listeners.withdrawUsers) {

            listeners.withdrawUsers = onValue(

                ref(db, "users"),

                snapshot => {

                    withdrawUsers = snapshot.val() || {};

                    renderWithdrawRequests();

                },

                error => {

                    console.error(
                        "Withdraw users listener error:",
                        error
                    );

                    withdrawUsers = {};

                    renderWithdrawRequests();

                }

            );

        }


        /* =====================================================
           WITHDRAW REQUESTS LISTENER
        ===================================================== */

        if (!listeners.withdrawRequests) {

            listeners.withdrawRequests = onValue(

                ref(db, "withdrawRequests"),

                snapshot => {

                    const data = snapshot.val() || {};


                    allWithdrawRequests = Object.entries(data)

                        .map(([id, request]) => ({

                            id,

                            ...(request || {})

                        }))

                        .sort((a, b) => {

                            return (

                                withdrawNumber(
                                    withdrawRequestDate(b)
                                ) -

                                withdrawNumber(
                                    withdrawRequestDate(a)
                                )

                            );

                        });


                    renderWithdrawRequests();

                },

                error => {

                    console.error(
                        "Withdraw requests listener error:",
                        error
                    );

                    allWithdrawRequests = [];

                    renderWithdrawRequests();

                    showToast(
                        "Unable to load withdraw requests.",
                        "error"
                    );

                }

            );

        }


        /* -----------------------------------------
           SEARCH / FILTER
        ----------------------------------------- */

        setupWithdrawSearch();


        console.log(
            "Money Vault: Withdraw listeners started."
        );

    } catch (error) {

        console.error(
            "loadWithdraws error:",
            error
        );

        showToast(
            "Unable to load withdraw section.",
            "error"
        );

    }

}


/* =========================================================
   RENDER WITHDRAW REQUESTS
========================================================= */

function renderWithdrawRequests() {

    const list = document.getElementById("withdrawList");
    const empty = document.getElementById("emptyWithdraw");

    if (!list) {
        return;
    }


    const searchInput =
        document.getElementById("withdrawSearch");

    const filterInput =
        document.getElementById("withdrawFilter");


    const search = String(
        searchInput?.value || ""
    )
        .trim()
        .toLowerCase();


    const filter = String(
        filterInput?.value || "all"
    )
        .trim()
        .toLowerCase();


    /* =====================================================
       FILTER DATA
    ===================================================== */

    const filtered = allWithdrawRequests.filter(request => {

        const uid = withdrawRequestUid(request);

        const user =
            withdrawUsers?.[uid] || {};

        const name =
            withdrawUserName(user, request);

        const email =
            withdrawUserEmail(user, request);

        const phone =
            withdrawUserPhone(user, request);

        const method =
            withdrawPaymentMethod(request);

        const accountName =
            withdrawAccountName(request);

        const accountNumber =
            withdrawAccountNumber(request);

        const amount =
            withdrawRequestAmount(request);

        const status =
            withdrawStatus(request.status);

        const searchableText = [

            request.id,
            uid,

            name,
            email,
            phone,

            method,
            accountName,
            accountNumber,

            request.transactionId,
            request.reference,
            request.referenceId,

            amount,
            status

        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


        const matchesSearch =
            !search ||
            searchableText.includes(search);


        const matchesFilter =
            !filter ||
            filter === "all" ||
            status === filter;


        return matchesSearch && matchesFilter;

    });


    /* =====================================================
       COUNTERS
    ===================================================== */

    const total =
        allWithdrawRequests.length;

    const pending =
        allWithdrawRequests.filter(
            item =>
                withdrawStatus(item.status) === "pending"
        ).length;

    const approved =
        allWithdrawRequests.filter(
            item =>
                withdrawStatus(item.status) === "approved"
        ).length;

    const rejected =
        allWithdrawRequests.filter(
            item =>
                withdrawStatus(item.status) === "rejected"
        ).length;


    updateWithdrawCounter(
        "withdrawTotalCount",
        total
    );

    updateWithdrawCounter(
        "withdrawPendingCount",
        pending
    );

    updateWithdrawCounter(
        "withdrawApprovedCount",
        approved
    );

    updateWithdrawCounter(
        "withdrawRejectedCount",
        rejected
    );


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display = "block";

            empty.innerHTML = `

                <div class="empty-icon">
                    <i class="fa-solid fa-money-bill-transfer"></i>
                </div>

                <h3>
                    No Withdraw Requests
                </h3>

                <p>
                    There are no withdraw requests
                    matching your search or filter.
                </p>

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

    list.innerHTML = filtered
        .map(request => renderWithdrawCard(request))
        .join("");


    activateWithdrawButtons();

}


/* =========================================================
   COUNTER HELPER
========================================================= */

function updateWithdrawCounter(id, value) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        Number(value || 0).toLocaleString("en-US");

}


/* =========================================================
   WITHDRAW CARD
========================================================= */

function renderWithdrawCard(request) {

    const uid =
        withdrawRequestUid(request);

    const user =
        withdrawUsers?.[uid] || {};

    const name =
        withdrawUserName(user, request);

    const email =
        withdrawUserEmail(user, request);

    const phone =
        withdrawUserPhone(user, request);

    const photo =
        withdrawUserPhoto(user, request);

    const amount =
        withdrawRequestAmount(request);

    const method =
        withdrawPaymentMethod(request);

    const accountName =
        withdrawAccountName(request);

    const accountNumber =
        withdrawAccountNumber(request);

    const status =
        withdrawStatus(request.status);

    const statusLabel =
        withdrawStatusLabel(status);

    const statusIcon =
        withdrawStatusIcon(status);

    const statusClass =
        withdrawStatusClass(status);

    const date =
        withdrawDate(
            withdrawRequestDate(request)
        );

    const reason =
        withdrawRejectionReason(request);


    const avatarHTML = photo

        ? `

            <img
                src="${escapeWithdrawHTML(photo)}"
                alt="User"
                class="withdraw-avatar-image"
                onerror="
                    this.style.display='none';
                    this.nextElementSibling.style.display='flex';
                "
            >

            <div
                class="withdraw-avatar-fallback"
                style="display:none;"
            >
                <i class="fa-solid fa-user"></i>
            </div>

          `

        : `

            <div class="withdraw-avatar-fallback">
                <i class="fa-solid fa-user"></i>
            </div>

          `;


    const actionButtons = status === "pending"

        ? `

            <div class="withdraw-actions">

                <button
                    type="button"
                    class="approve-withdraw-btn"
                    data-id="${escapeWithdrawHTML(request.id)}"
                >

                    <i class="fa-solid fa-check"></i>

                    Approve

                </button>


                <button
                    type="button"
                    class="reject-withdraw-btn"
                    data-id="${escapeWithdrawHTML(request.id)}"
                >

                    <i class="fa-solid fa-xmark"></i>

                    Reject

                </button>

            </div>

          `

        : `

            <div class="withdraw-processed">

                <i class="fa-solid ${statusIcon}"></i>

                <span>
                    ${escapeWithdrawHTML(statusLabel)}
                </span>

            </div>

          `;


    const reasonHTML =
        reason &&
        (status === "rejected" ||
         status === "processing_error")

        ? `

            <div class="withdraw-reason">

                <i class="fa-solid fa-circle-info"></i>

                <span>
                    ${escapeWithdrawHTML(reason)}
                </span>

            </div>

          `

        : "";


    return `

        <article
            class="withdraw-card"
            data-withdraw-id="${escapeWithdrawHTML(request.id)}"
        >


            <!-- =====================================
                 HEADER
            ====================================== -->

            <div class="withdraw-card-header">


                <div class="withdraw-user">


                    <div class="withdraw-avatar">

                        ${avatarHTML}

                    </div>


                    <div class="withdraw-user-info">

                        <h3>
                            ${escapeWithdrawHTML(name)}
                        </h3>

                        <p>
                            ${escapeWithdrawHTML(email)}
                        </p>

                        <small>
                            ${escapeWithdrawHTML(phone)}
                        </small>

                    </div>

                </div>


                <div
                    class="withdraw-status ${escapeWithdrawHTML(statusClass)}"
                >

                    <i
                        class="fa-solid ${escapeWithdrawHTML(statusIcon)}"
                    ></i>

                    <span>
                        ${escapeWithdrawHTML(statusLabel)}
                    </span>

                </div>


            </div>


            <!-- =====================================
                 AMOUNT
            ====================================== -->

            <div class="withdraw-amount-box">

                <span>
                    Withdrawal Amount
                </span>

                <strong>
                    ${escapeWithdrawHTML(
                        withdrawMoney(amount)
                    )}
                </strong>

            </div>


            <!-- =====================================
                 DETAILS
            ====================================== -->

            <div class="withdraw-details">


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-solid fa-mobile-screen"></i>
                        Payment Method
                    </span>

                    <strong>
                        ${escapeWithdrawHTML(method)}
                    </strong>

                </div>


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-solid fa-user"></i>
                        Account Name
                    </span>

                    <strong>
                        ${escapeWithdrawHTML(accountName)}
                    </strong>

                </div>


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-solid fa-phone"></i>
                        Account / Phone
                    </span>

                    <strong>
                        ${escapeWithdrawHTML(accountNumber)}
                    </strong>

                </div>


                <div class="withdraw-detail">

                    <span>
                        <i class="fa-regular fa-calendar"></i>
                        Requested
                    </span>

                    <strong>
                        ${escapeWithdrawHTML(date)}
                    </strong>

                </div>


            </div>


            ${reasonHTML}


            <!-- =====================================
                 IDS
            ====================================== -->

            <div class="withdraw-identifiers">

                <div>

                    <span>
                        Request ID
                    </span>

                    <code>
                        ${escapeWithdrawHTML(request.id)}
                    </code>

                </div>


                <div>

                    <span>
                        User UID
                    </span>

                    <code>
                        ${escapeWithdrawHTML(uid || "N/A")}
                    </code>

                </div>


                ${
                    request.transactionId
                    ? `

                        <div>

                            <span>
                                Transaction ID
                            </span>

                            <code>
                                ${escapeWithdrawHTML(
                                    request.transactionId
                                )}
                            </code>

                        </div>

                      `
                    : ""
                }

            </div>


            <!-- =====================================
                 ACTIONS
            ====================================== -->

            ${actionButtons}


        </article>

    `;

}


/* =========================================================
   ACTIVATE APPROVE / REJECT BUTTONS
========================================================= */

function activateWithdrawButtons() {

    const approveButtons =
        document.querySelectorAll(
            ".approve-withdraw-btn"
        );


    const rejectButtons =
        document.querySelectorAll(
            ".reject-withdraw-btn"
        );


    /* =====================================================
       APPROVE
    ===================================================== */

    approveButtons.forEach(button => {

        if (button.dataset.bound === "true") {
            return;
        }

        button.dataset.bound = "true";


        button.addEventListener("click", async () => {

            const id =
                button.dataset.id;

            if (!id) {
                return;
            }


            if (button.dataset.processing === "true") {
                return;
            }


            button.dataset.processing = "true";

            button.disabled = true;

            const originalHTML =
                button.innerHTML;


            button.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>
                Processing...

            `;


            try {

                if (
                    typeof window.approveWithdraw !==
                    "function"
                ) {

                    throw new Error(
                        "approveWithdraw() is not available."
                    );

                }


                await window.approveWithdraw(id);

            } catch (error) {

                console.error(
                    "Withdraw approval error:",
                    error
                );

                showToast(
                    error?.message ||
                    "Unable to approve withdrawal.",
                    "error"
                );

            } finally {

                button.dataset.processing = "false";

                button.disabled = false;

                button.innerHTML =
                    originalHTML;

            }

        });

    });


    /* =====================================================
       REJECT
    ===================================================== */

    rejectButtons.forEach(button => {

        if (button.dataset.bound === "true") {
            return;
        }

        button.dataset.bound = "true";


        button.addEventListener("click", async () => {

            const id =
                button.dataset.id;

            if (!id) {
                return;
            }


            if (button.dataset.processing === "true") {
                return;
            }


            button.dataset.processing = "true";

            button.disabled = true;

            const originalHTML =
                button.innerHTML;


            button.innerHTML = `

                <i class="fa-solid fa-spinner fa-spin"></i>
                Processing...

            `;


            try {

                if (
                    typeof window.rejectWithdraw !==
                    "function"
                ) {

                    throw new Error(
                        "rejectWithdraw() is not available."
                    );

                }


                await window.rejectWithdraw(id);

            } catch (error) {

                console.error(
                    "Withdraw rejection error:",
                    error
                );

                showToast(
                    error?.message ||
                    "Unable to reject withdrawal.",
                    "error"
                );

            } finally {

                button.dataset.processing = "false";

                button.disabled = false;

                button.innerHTML =
                    originalHTML;

            }

        });

    });

}


/* =========================================================
   SEARCH + FILTER
========================================================= */

let withdrawSearchInitialized = false;


function setupWithdrawSearch() {

    const searchInput =
        document.getElementById("withdrawSearch");

    const filterInput =
        document.getElementById("withdrawFilter");


    if (!searchInput && !filterInput) {
        return;
    }


    if (
        searchInput &&
        !searchInput.dataset.bound
    ) {

        searchInput.dataset.bound = "true";

        searchInput.addEventListener(
            "input",
            renderWithdrawRequests
        );

    }


    if (
        filterInput &&
        !filterInput.dataset.bound
    ) {

        filterInput.dataset.bound = "true";

        filterInput.addEventListener(
            "change",
            renderWithdrawRequests
        );

    }


    withdrawSearchInitialized = true;

}


/* =========================================================
   REFRESH WITHDRAW DATA
========================================================= */

async function refreshWithdraws() {

    try {

        await waitForAdmin();

        renderWithdrawRequests();

        setupWithdrawSearch();

    } catch (error) {

        console.error(
            "refreshWithdraws error:",
            error
        );

    }

}


/* =========================================================
   GET WITHDRAW CACHE
========================================================= */

function getWithdrawCache() {

    return {

        requests: allWithdrawRequests,

        users: withdrawUsers

    };

}


/* =========================================================
   QUICK ACTION SUPPORT
========================================================= */

function setupWithdrawQuickAction() {

    const button =
        document.getElementById("openWithdraws");


    if (!button) {
        return;
    }


    if (button.dataset.withdrawBound === "true") {
        return;
    }


    button.dataset.withdrawBound = "true";


    button.addEventListener("click", async () => {

        try {

            /* -----------------------------------------
               OPEN WITHDRAW PAGE
            ----------------------------------------- */

            openPage("withdraws");


            /* -----------------------------------------
               LOAD LIST
            ----------------------------------------- */

            await loadWithdraws();


            /* -----------------------------------------
               FORCE RENDER
            ----------------------------------------- */

            renderWithdrawRequests();


            /* -----------------------------------------
               SEARCH / FILTER
            ----------------------------------------- */

            setupWithdrawSearch();

        } catch (error) {

            console.error(
                "Withdraw Quick Action error:",
                error
            );

            showToast(
                "Unable to open withdraw requests.",
                "error"
            );

        }

    });

}


/* =========================================================
   EXPORTS
========================================================= */

window.loadWithdraws =
    loadWithdraws;

window.renderWithdrawRequests =
    renderWithdrawRequests;

window.setupWithdrawSearch =
    setupWithdrawSearch;

window.refreshWithdraws =
    refreshWithdraws;

window.getWithdrawCache =
    getWithdrawCache;

window.setupWithdrawQuickAction =
    setupWithdrawQuickAction;


/* =========================================================
   INITIAL SETUP
========================================================= */

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            setupWithdrawSearch();

            /*
             * Part 2 may already handle
             * the dashboard Quick Action.
             *
             * This setup is protected by
             * data-withdraw-bound.
             */

            setupWithdrawQuickAction();

        },
        { once: true }
    );

} else {

    setupWithdrawSearch();

    setupWithdrawQuickAction();

}


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault: Part 5 — Withdraw Requests loaded."
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 6
   APPROVE / REJECT WITHDRAW
   CURRENCY: RWF / FRW
========================================================= */


/* =========================================================
   APPROVE WITHDRAW
========================================================= */

async function approveWithdraw(id) {

    let requestRef = null;
    let userRef = null;

    try {

        await waitForAdmin();


        /* -----------------------------------------
           ADMIN CHECK
        ----------------------------------------- */

        if (!currentAdmin?.uid) {

            showToast(
                "Admin session is not ready.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           VALIDATE REQUEST ID
        ----------------------------------------- */

        if (!id) {

            showToast(
                "Invalid withdraw request.",
                "error"
            );

            return;
        }


        requestRef =
            ref(db, `withdrawRequests/${id}`);


        /* -----------------------------------------
           READ REQUEST
        ----------------------------------------- */

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
            normalizeStatus(request.status);


        /* -----------------------------------------
           ONLY PENDING CAN BE APPROVED
        ----------------------------------------- */

        if (status !== "pending") {

            showToast(
                `This request is already ${status}.`,
                "warning"
            );

            return;
        }


        /* -----------------------------------------
           USER ID
        ----------------------------------------- */

        const uid =
            request.uid ||
            request.userId ||
            request.userUID;


        if (!uid) {

            showToast(
                "Withdraw request has no user ID.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           AMOUNT
        ----------------------------------------- */

        const amount =
            numberValue(
                request.amount ??
                request.withdrawAmount ??
                request.requestedAmount
            );


        if (!Number.isFinite(amount) || amount <= 0) {

            showToast(
                "Invalid withdraw amount.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           CONFIRM APPROVAL
        ----------------------------------------- */

        const confirmed =
            window.confirm(
                `Approve withdraw of ${formatMoney(amount)}?`
            );


        if (!confirmed) {
            return;
        }


        const adminUid =
            currentAdmin.uid;


        /* =====================================================
           STEP 1
           ATOMIC LOCK

           pending -> processing

           This prevents two admins or two clicks
           from approving the same request.
        ===================================================== */

        const lockResult =
            await runTransaction(
                requestRef,
                currentRequest => {

                    if (!currentRequest) {
                        return;
                    }


                    if (
                        normalizeStatus(
                            currentRequest.status
                        ) !== "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status:
                            "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            adminUid

                    };

                }
            );


        if (!lockResult.committed) {

            showToast(
                "This withdraw request was already processed.",
                "warning"
            );

            return;
        }


        /* =====================================================
           STEP 2
           USER REFERENCE
        ===================================================== */

        userRef =
            ref(db, `users/${uid}`);


        /* =====================================================
           STEP 3
           ATOMIC BALANCE DEDUCTION
        ===================================================== */

        const userTransaction =
            await runTransaction(
                userRef,
                currentUser => {

                    /* -----------------------------------------
                       USER MUST EXIST
                    ----------------------------------------- */

                    if (!currentUser) {
                        return;
                    }


                    const balance =
                        numberValue(
                            currentUser.balance
                        );


                    /* -----------------------------------------
                       PREVENT NEGATIVE BALANCE
                    ----------------------------------------- */

                    if (balance < amount) {
                        return;
                    }


                    const totalWithdrawals =
                        numberValue(
                            currentUser.totalWithdrawals
                        );


                    const totalTransactions =
                        numberValue(
                            currentUser.totalTransactions
                        );


                    return {

                        ...currentUser,

                        balance:
                            balance - amount,

                        totalWithdrawals:
                            totalWithdrawals + amount,

                        totalTransactions:
                            totalTransactions + 1,

                        updatedAt:
                            Date.now()

                    };

                }
            );


        /* =====================================================
           STEP 4
           CHECK BALANCE TRANSACTION
        ===================================================== */

        if (!userTransaction.committed) {

            /*
             * The balance was NOT deducted.
             * Therefore it is safe to reject the request.
             */

            await runTransaction(
                requestRef,
                currentRequest => {

                    if (!currentRequest) {
                        return;
                    }


                    /*
                     * Only change processing -> rejected.
                     *
                     * If another process changed it,
                     * do not overwrite that result.
                     */

                    if (
                        normalizeStatus(
                            currentRequest.status
                        ) !== "processing"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status:
                            "rejected",

                        rejectionReason:
                            "Insufficient balance or user account was not found.",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            adminUid

                    };

                }
            );


            showToast(
                "Withdraw rejected: insufficient balance.",
                "warning"
            );


            refreshWithdrawAfterAction();

            return;
        }


        /* =====================================================
           STEP 5
           CREATE TRANSACTION RECORD
        ===================================================== */

        let transactionKey = null;

        const transactionCreatedAt =
            Date.now();


        try {

            const transactionRef =
                push(
                    ref(db, "transactions")
                );


            transactionKey =
                transactionRef.key;


            await set(
                transactionRef,
                {

                    uid:
                        uid,

                    type:
                        "withdraw",

                    transactionType:
                        "withdraw",

                    amount:
                        amount,

                    status:
                        "approved",

                    currency:
                        "RWF",

                    paymentMethod:
                        request.paymentMethod ||
                        request.method ||
                        request.provider ||
                        request.paymentProvider ||
                        "",

                    phone:
                        request.phone ||
                        request.phoneNumber ||
                        request.mobile ||
                        "",

                    accountName:
                        request.accountName ||
                        request.accountHolder ||
                        request.receiverName ||
                        "",

                    accountNumber:
                        request.accountNumber ||
                        request.account ||
                        request.phone ||
                        request.phoneNumber ||
                        request.mobile ||
                        "",

                    withdrawRequestId:
                        id,

                    requestId:
                        id,

                    createdAt:
                        transactionCreatedAt,

                    timestamp:
                        transactionCreatedAt,

                    approvedAt:
                        transactionCreatedAt,

                    approvedBy:
                        adminUid

                }
            );

        } catch (transactionError) {

            console.error(
                "Withdraw transaction creation error:",
                transactionError
            );


            /*
             * IMPORTANT:
             *
             * Balance has already been deducted.
             *
             * We MUST NOT put the request back to pending.
             * Otherwise admin could approve it again and
             * deduct the balance twice.
             */

            try {

                await update(
                    requestRef,
                    {

                        status:
                            "processing_error",

                        processingError:
                            "Balance was deducted, but the transaction record could not be created.",

                        processingErrorAt:
                            Date.now(),

                        processingErrorBy:
                            adminUid

                    }
                );

            } catch (statusError) {

                console.error(
                    "Unable to mark withdraw processing error:",
                    statusError
                );

            }


            showToast(
                "Balance was deducted, but transaction recording failed. Do NOT approve this request again.",
                "error"
            );


            refreshWithdrawAfterAction();

            return;
        }


        /* =====================================================
           STEP 6
           FINALIZE REQUEST
        ===================================================== */

        try {

            await update(
                requestRef,
                {

                    status:
                        "approved",

                    approvedAt:
                        transactionCreatedAt,

                    approvedBy:
                        adminUid,

                    transactionKey:
                        transactionKey,

                    transactionId:
                        transactionKey,

                    currency:
                        "RWF"

                }
            );

        } catch (finalizeError) {

            /*
             * Balance + transaction already exist.
             *
             * Do not retry approval.
             * Mark the request so admin knows that
             * processing completed but final request
             * status could not be written.
             */

            console.error(
                "Withdraw finalization error:",
                finalizeError
            );


            try {

                await update(
                    requestRef,
                    {

                        status:
                            "processing_error",

                        processingError:
                            "Withdrawal balance deduction and transaction record were completed, but request finalization failed.",

                        processingErrorAt:
                            Date.now(),

                        processingErrorBy:
                            adminUid,

                        transactionKey:
                            transactionKey,

                        transactionId:
                            transactionKey

                    }
                );

            } catch (statusError) {

                console.error(
                    "Unable to save final processing error:",
                    statusError
                );

            }


            showToast(
                "Withdrawal was processed, but request finalization failed. Do NOT approve it again.",
                "error"
            );


            refreshWithdrawAfterAction();

            return;
        }


        /* =====================================================
           SUCCESS
        ===================================================== */

        showToast(
            `Withdraw of ${formatMoney(amount)} approved successfully.`,
            "success"
        );


        /* =====================================================
           REFRESH ALL ADMIN DATA
        ===================================================== */

        refreshWithdrawAfterAction();


    } catch (error) {

        console.error(
            "approveWithdraw error:",
            error
        );


        /* =====================================================
           ERROR SAFETY
        ===================================================== */

        try {

            if (requestRef) {

                const latestSnapshot =
                    await get(requestRef);


                if (latestSnapshot.exists()) {

                    const latest =
                        latestSnapshot.val() || {};


                    const latestStatus =
                        normalizeStatus(
                            latest.status
                        );


                    /*
                     * Only mark processing_error if it
                     * is still processing.
                     *
                     * Never overwrite approved/rejected.
                     */

                    if (
                        latestStatus === "processing"
                    ) {

                        await update(
                            requestRef,
                            {

                                status:
                                    "processing_error",

                                processingError:
                                    error?.message ||
                                    "Unknown withdrawal processing error.",

                                processingErrorAt:
                                    Date.now(),

                                processingErrorBy:
                                    currentAdmin?.uid ||
                                    null

                            }
                        );

                    }

                }

            }

        } catch (cleanupError) {

            console.error(
                "Withdraw approval cleanup error:",
                cleanupError
            );

        }


        showToast(
            error?.message ||
            "Failed to approve withdraw.",
            "error"
        );


        refreshWithdrawAfterAction();

    }

}


/* =========================================================
   REJECT WITHDRAW
========================================================= */

async function rejectWithdraw(id) {

    try {

        await waitForAdmin();


        /* -----------------------------------------
           ADMIN CHECK
        ----------------------------------------- */

        if (!currentAdmin?.uid) {

            showToast(
                "Admin session is not ready.",
                "error"
            );

            return;
        }


        /* -----------------------------------------
           VALIDATE ID
        ----------------------------------------- */

        if (!id) {

            showToast(
                "Invalid withdraw request.",
                "error"
            );

            return;
        }


        const requestRef =
            ref(db, `withdrawRequests/${id}`);


        /* -----------------------------------------
           READ REQUEST
        ----------------------------------------- */

        const snapshot =
            await get(requestRef);


        if (!snapshot.exists()) {

            showToast(
                "Withdraw request not found.",
                "error"
            );

            return;
        }


        const request =
            snapshot.val() || {};


        const status =
            normalizeStatus(request.status);


        /* -----------------------------------------
           ONLY PENDING CAN BE REJECTED
        ----------------------------------------- */

        if (status !== "pending") {

            showToast(
                `Only pending withdraw requests can be rejected. Current status: ${status}.`,
                "warning"
            );

            return;
        }


        const amount =
            numberValue(
                request.amount ??
                request.withdrawAmount ??
                request.requestedAmount
            );


        /* -----------------------------------------
           CONFIRM
        ----------------------------------------- */

        const confirmed =
            window.confirm(
                `Reject withdraw of ${formatMoney(amount)}?`
            );


        if (!confirmed) {
            return;
        }


        /* -----------------------------------------
           REJECTION REASON
        ----------------------------------------- */

        let reason =
            window.prompt(
                "Reason for rejection (optional):",
                ""
            );


        reason =
            String(reason || "").trim();


        const adminUid =
            currentAdmin.uid;


        /* =====================================================
           ATOMIC PENDING -> REJECTED
        ===================================================== */

        const result =
            await runTransaction(
                requestRef,
                currentRequest => {

                    if (!currentRequest) {
                        return;
                    }


                    /*
                     * Prevent rejecting a request that
                     * another admin already processed.
                     */

                    if (
                        normalizeStatus(
                            currentRequest.status
                        ) !== "pending"
                    ) {

                        return;

                    }


                    return {

                        ...currentRequest,

                        status:
                            "rejected",

                        rejectionReason:
                            reason ||
                            "Rejected by administrator.",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            adminUid,

                        currency:
                            "RWF"

                    };

                }
            );


        /* -----------------------------------------
           TRANSACTION DID NOT COMMIT
        ----------------------------------------- */

        if (!result.committed) {

            showToast(
                "This withdraw request was already processed.",
                "warning"
            );

            return;
        }


        /* =====================================================
           CREATE REJECTION TRANSACTION RECORD
        ===================================================== */

        /*
         * This is only a history record.
         * It does NOT change the user's balance.
         *
         * If the history write fails, the request remains
         * rejected because the rejection itself already
         * succeeded.
         */

        try {

            const transactionRef =
                push(
                    ref(db, "transactions")
                );


            const rejectedAt =
                Date.now();


            await set(
                transactionRef,
                {

                    uid:
                        request.uid ||
                        request.userId ||
                        request.userUID ||
                        "",

                    type:
                        "withdraw",

                    transactionType:
                        "withdraw",

                    amount:
                        amount,

                    status:
                        "rejected",

                    currency:
                        "RWF",

                    paymentMethod:
                        request.paymentMethod ||
                        request.method ||
                        request.provider ||
                        "",

                    phone:
                        request.phone ||
                        request.phoneNumber ||
                        request.mobile ||
                        "",

                    accountName:
                        request.accountName ||
                        request.accountHolder ||
                        request.receiverName ||
                        "",

                    withdrawRequestId:
                        id,

                    requestId:
                        id,

                    rejectionReason:
                        reason ||
                        "Rejected by administrator.",

                    createdAt:
                        rejectedAt,

                    timestamp:
                        rejectedAt,

                    rejectedAt:
                        rejectedAt,

                    rejectedBy:
                        adminUid

                }
            );


            /*
             * Save the history transaction key on the
             * request without changing its rejected status.
             */

            await update(
                requestRef,
                {

                    rejectionTransactionKey:
                        transactionRef.key

                }
            );


        } catch (historyError) {

            console.error(
                "Withdraw rejection history error:",
                historyError
            );

            /*
             * Do NOT turn the request back to pending.
             * It is already safely rejected.
             */

            showToast(
                "Withdraw rejected, but transaction history could not be recorded.",
                "warning"
            );


            refreshWithdrawAfterAction();

            return;
        }


        /* =====================================================
           SUCCESS
        ===================================================== */

        showToast(
            "Withdraw request rejected successfully.",
            "success"
        );


        /* =====================================================
           REFRESH
        ===================================================== */

        refreshWithdrawAfterAction();

    } catch (error) {

        console.error(
            "rejectWithdraw error:",
            error
        );


        showToast(
            error?.message ||
            "Failed to reject withdraw.",
            "error"
        );


        refreshWithdrawAfterAction();

    }

}


/* =========================================================
   REFRESH AFTER WITHDRAW ACTION
========================================================= */

function refreshWithdrawAfterAction() {

    try {

        if (
            typeof renderWithdrawRequests ===
            "function"
        ) {

            renderWithdrawRequests();

        }


        if (
            typeof renderDashboard ===
            "function"
        ) {

            renderDashboard();

        }


        if (
            typeof renderUsers ===
            "function"
        ) {

            renderUsers();

        }


        if (
            typeof renderTransactions ===
            "function"
        ) {

            renderTransactions();

        }

    } catch (error) {

        console.error(
            "Withdraw UI refresh error:",
            error
        );

    }

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;

window.refreshWithdrawAfterAction =
    refreshWithdrawAfterAction;


/* =========================================================
   DEBUG
========================================================= */

console.log(
    "Money Vault: Part 6 — Approve / Reject Withdraw loaded."
);
   /* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 7
   VIP PURCHASE REQUESTS
   CURRENCY: RWF / FRW
========================================================= */

let allVipRequests = [];

let vipRequestUsers = {};

let vipRequestListenersStarted = false;

let vipRequestSearchInitialized = false;


/* =========================================================
   VIP HELPERS
========================================================= */

function vipRequestValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


function vipRequestStatus(status) {

    return String(status ?? "pending")
        .trim()
        .toLowerCase();
}


function vipRequestMoney(value) {

    if (typeof formatMoney === "function") {

        return formatMoney(
            vipRequestValue(value)
        );

    }

    return `${vipRequestValue(value).toLocaleString("en-US")} RWF`;
}


function vipRequestDate(value) {

    const timestamp =
        vipRequestValue(value);

    if (!timestamp) {
        return "N/A";
    }

    if (typeof formatDate === "function") {

        return formatDate(timestamp);

    }

    try {

        return new Date(timestamp)
            .toLocaleString("en-GB");

    } catch {

        return "N/A";

    }
}


function getVipRequestUid(request) {

    return (
        request?.uid ||
        request?.userId ||
        request?.userUID ||
        ""
    );
}


function getVipRequestName(request) {

    return (
        request?.vipName ||
        request?.name ||
        request?.planName ||
        request?.vipPlan ||
        "VIP Plan"
    );
}


function getVipRequestPrice(request) {

    return vipRequestValue(

        request?.price ??
        request?.vipPrice ??
        request?.amount

    );
}


function getVipRequestDaily(request) {

    return vipRequestValue(

        request?.dailyIncome ??
        request?.daily ??
        request?.dailyProfit

    );
}


function getVipRequestTotal(request) {

    return vipRequestValue(

        request?.totalProfit ??
        request?.profit ??
        request?.totalEarning

    );
}


function getVipRequestDuration(request) {

    const direct =
        vipRequestValue(

            request?.duration ??
            request?.days ??
            request?.durationDays

        );


    if (direct > 0) {

        return Math.ceil(direct);

    }


    const daily =
        getVipRequestDaily(request);


    const total =
        getVipRequestTotal(request);


    if (
        daily > 0 &&
        total > 0
    ) {

        return Math.ceil(
            total / daily
        );

    }


    return 0;
}


function getVipRequestUser(request) {

    const uid =
        getVipRequestUid(request);

    return (
        vipRequestUsers[uid] ||
        {}
    );
}


function getVipRequestUserName(
    request,
    user
) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        request?.userName ||
        "Unknown User"
    );
}


function getVipRequestUserEmail(
    request,
    user
) {

    return (
        user?.email ||
        request?.email ||
        "No email"
    );
}


function getVipRequestUserPhone(
    request,
    user
) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        request?.phone ||
        request?.phoneNumber ||
        "N/A"
    );
}


function getVipRequestUserPhoto(
    request,
    user
) {

    return (
        user?.photoURL ||
        user?.photo ||
        user?.profilePhoto ||
        user?.avatar ||
        request?.photoURL ||
        ""
    );
}


function getVipRequestPaymentMethod(request) {

    return (
        request?.paymentMethod ||
        request?.method ||
        "N/A"
    );
}


/* =========================================================
   STATUS HELPERS
========================================================= */

function getVipRequestStatusLabel(status) {

    const normalized =
        vipRequestStatus(status);


    const labels = {

        pending: "Pending",

        processing: "Processing",

        approved: "Approved",

        rejected: "Rejected",

        processing_error:
            "Processing Error"

    };


    return (
        labels[normalized] ||
        normalized.replaceAll("_", " ")
    );
}


function getVipRequestStatusIcon(status) {

    const normalized =
        vipRequestStatus(status);


    if (normalized === "approved") {

        return "fa-circle-check";

    }


    if (normalized === "rejected") {

        return "fa-circle-xmark";

    }


    if (normalized === "processing") {

        return "fa-spinner fa-spin";

    }


    if (normalized === "processing_error") {

        return "fa-triangle-exclamation";

    }


    return "fa-clock";

}


function getVipRequestStatusClass(status) {

    const normalized =
        vipRequestStatus(status);


    return [
        "pending",
        "processing",
        "approved",
        "rejected",
        "processing_error"
    ].includes(normalized)

        ? normalized

        : "pending";
}


/* =========================================================
   LOAD VIP REQUESTS
========================================================= */

async function loadVipRequests() {

    await window.waitForAdmin();


    if (
        !window.currentAdmin &&
        typeof window.getCurrentAdmin === "function"
    ) {

        if (!window.getCurrentAdmin()) {

            throw new Error(
                "Administrator session not ready."
            );

        }

    }


    if (vipRequestListenersStarted) {

        renderVipRequests();

        setupVipRequestSearch();

        return;

    }


    vipRequestListenersStarted = true;


    /* =====================================================
       USERS LISTENER
    ===================================================== */

    if (!listeners.vipRequestUsers) {

        listeners.vipRequestUsers = onValue(

            ref(db, "users"),

            snapshot => {

                vipRequestUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                renderVipRequests();

            },

            error => {

                console.error(
                    "VIP users listener error:",
                    error
                );


                showToast(
                    "Failed to load VIP users.",
                    "error"
                );

            }

        );

    }


    /* =====================================================
       VIP REQUESTS LISTENER
    ===================================================== */

    if (!listeners.vipPurchaseRequests) {

        listeners.vipPurchaseRequests = onValue(

            ref(
                db,
                "vipPurchaseRequests"
            ),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                allVipRequests =
                    Object.entries(data)

                        .map(
                            ([id, request]) => ({

                                id,

                                ...(request || {})

                            })
                        );


                allVipRequests.sort(

                    (a, b) => {

                        const dateA =
                            vipRequestValue(

                                a.createdAt ??
                                a.timestamp ??
                                a.requestedAt ??
                                a.date

                            );


                        const dateB =
                            vipRequestValue(

                                b.createdAt ??
                                b.timestamp ??
                                b.requestedAt ??
                                b.date

                            );


                        return dateB - dateA;

                    }

                );


                renderVipRequests();

            },

            error => {

                console.error(
                    "VIP request listener error:",
                    error
                );


                showToast(
                    "Failed to load VIP requests.",
                    "error"
                );

            }

        );

    }


    setupVipRequestSearch();

    renderVipRequests();

}


/* =========================================================
   RENDER VIP REQUEST LIST
========================================================= */

function renderVipRequests() {

    const list =
        document.getElementById(
            "vipRequestList"
        );


    const empty =
        document.getElementById(
            "emptyVipRequest"
        );


    if (!list) {

        console.warn(
            "vipRequestList element not found."
        );

        return;

    }


    const searchInput =
        document.getElementById(
            "vipSearch"
        );


    const filterInput =
        document.getElementById(
            "vipFilter"
        );


    const search =
        String(
            searchInput?.value || ""
        )
        .trim()
        .toLowerCase();


    const filter =
        String(
            filterInput?.value || "all"
        )
        .trim()
        .toLowerCase();


    /* =====================================================
       COUNTERS
    ===================================================== */

    let total = 0;

    let pending = 0;

    let approved = 0;

    let rejected = 0;


    allVipRequests.forEach(
        request => {

            total++;


            const status =
                vipRequestStatus(
                    request.status
                );


            if (status === "pending") {

                pending++;

            }


            if (status === "approved") {

                approved++;

            }


            if (status === "rejected") {

                rejected++;

            }

        }
    );


    updateText(
        "vipTotalCount",
        total.toLocaleString("en-US")
    );


    updateText(
        "vipPendingCount",
        pending.toLocaleString("en-US")
    );


    updateText(
        "vipApprovedCount",
        approved.toLocaleString("en-US")
    );


    updateText(
        "vipRejectedCount",
        rejected.toLocaleString("en-US")
    );


    /* =====================================================
       FILTER LIST
    ===================================================== */

    const filtered =
        allVipRequests.filter(
            request => {

                const status =
                    vipRequestStatus(
                        request.status
                    );


                if (
                    filter !== "all" &&
                    status !== filter
                ) {

                    return false;

                }


                const uid =
                    getVipRequestUid(
                        request
                    );


                const user =
                    vipRequestUsers[uid] ||
                    {};


                const searchable = [

                    request.id,

                    uid,

                    getVipRequestName(
                        request
                    ),

                    user.name,

                    user.fullName,

                    user.displayName,

                    user.username,

                    user.email,

                    user.phone,

                    user.phoneNumber,

                    request.email,

                    request.phone,

                    request.phoneNumber,

                    request.paymentMethod,

                    request.transactionId,

                    request.reference,

                    getVipRequestPrice(
                        request
                    ),

                    getVipRequestDaily(
                        request
                    ),

                    getVipRequestTotal(
                        request
                    ),

                    status

                ]
                .join(" ")
                .toLowerCase();


                return (
                    !search ||
                    searchable.includes(search)
                );

            }
        );


    /* =====================================================
       EMPTY LIST
    ===================================================== */

    if (!filtered.length) {

        list.innerHTML = "";


        if (empty) {

            empty.style.display =
                "block";


            empty.innerHTML = `

                <div class="empty-state">

                    <i class="
                        fa-solid
                        fa-crown
                    "></i>

                    <h3>
                        No VIP Purchase Requests
                    </h3>

                    <p>
                        No VIP requests match
                        your search or filter.
                    </p>

                </div>

            `;

        }


        return;

    }


    if (empty) {

        empty.style.display =
            "none";

    }


    /* =====================================================
       LIST
    ===================================================== */

    list.innerHTML =
        filtered

            .map(
                request => {

                    const uid =
                        getVipRequestUid(
                            request
                        );


                    const user =
                        vipRequestUsers[
                            uid
                        ] || {};


                    return renderVipRequestCard(
                        request,
                        user
                    );

                }
            )

            .join("");


    activateVipRequestButtons();

}


/* =========================================================
   VIP REQUEST CARD / LIST ITEM
========================================================= */

function renderVipRequestCard(
    request,
    user
) {

    const status =
        vipRequestStatus(
            request.status
        );


    const statusClass =
        getVipRequestStatusClass(
            status
        );


    const vipName =
        getVipRequestName(
            request
        );


    const price =
        getVipRequestPrice(
            request
        );


    const daily =
        getVipRequestDaily(
            request
        );


    const totalProfit =
        getVipRequestTotal(
            request
        );


    const duration =
        getVipRequestDuration(
            request
        );


    const uid =
        getVipRequestUid(
            request
        );


    const userName =
        getVipRequestUserName(
            request,
            user
        );


    const email =
        getVipRequestUserEmail(
            request,
            user
        );


    const phone =
        getVipRequestUserPhone(
            request,
            user
        );


    const photo =
        getVipRequestUserPhoto(
            request,
            user
        );


    const paymentMethod =
        getVipRequestPaymentMethod(
            request
        );


    const requestedAt =
        vipRequestDate(

            request.createdAt ??
            request.timestamp ??
            request.requestedAt ??
            request.date

        );


    /* =====================================================
       AVATAR
    ===================================================== */

    const avatar =
        photo

            ? `
                <img
                    src="${escapeHTML(photo)}"
                    alt="${escapeHTML(userName)}"
                    class="vip-user-photo"
                    onerror="
                        this.style.display='none';
                        this.nextElementSibling.style.display='flex';
                    "
                >

                <div
                    class="vip-user-avatar"
                    style="display:none;"
                >
                    <i class="fa-solid fa-user"></i>
                </div>
              `

            : `
                <div class="vip-user-avatar">

                    <i class="
                        fa-solid
                        fa-user
                    "></i>

                </div>
              `;


    /* =====================================================
       ACTIONS
    ===================================================== */

    let actions = "";


    if (status === "pending") {

        actions = `

            <div class="vip-request-actions">

                <button
                    type="button"
                    class="
                        vip-action-btn
                        vip-approve-btn
                    "
                    data-id="${escapeHTML(request.id)}"
                    title="Approve VIP request"
                >

                    <i class="
                        fa-solid
                        fa-check
                    "></i>

                    Approve

                </button>


                <button
                    type="button"
                    class="
                        vip-action-btn
                        vip-reject-btn
                    "
                    data-id="${escapeHTML(request.id)}"
                    title="Reject VIP request"
                >

                    <i class="
                        fa-solid
                        fa-xmark
                    "></i>

                    Reject

                </button>

            </div>

        `;

    } else {

        actions = `

            <div
                class="
                    vip-request-processed
                    status-${escapeHTML(
                        statusClass
                    )}
                "
            >

                <i class="
                    fa-solid
                    ${getVipRequestStatusIcon(status)}
                "></i>

                ${escapeHTML(
                    getVipRequestStatusLabel(
                        status
                    )
                )}

            </div>

        `;

    }


    /* =====================================================
       COMPLETE LIST ITEM
    ===================================================== */

    return `

        <article
            class="
                vip-request-card
                vip-request-list-item
            "
            data-id="${escapeHTML(request.id)}"
            data-uid="${escapeHTML(uid)}"
        >

            <!-- ================================
                 USER HEADER
            ================================= -->

            <div class="vip-request-header">

                <div class="vip-user">

                    ${avatar}

                    <div class="vip-user-info">

                        <h3>
                            ${escapeHTML(userName)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                        <small>
                            <i class="
                                fa-solid
                                fa-phone
                            "></i>

                            ${escapeHTML(phone)}

                        </small>

                    </div>

                </div>


                <div
                    class="
                        vip-request-status
                        status-${escapeHTML(
                            statusClass
                        )}
                    "
                >

                    <i class="
                        fa-solid
                        ${getVipRequestStatusIcon(status)}
                    "></i>

                    ${escapeHTML(
                        getVipRequestStatusLabel(
                            status
                        )
                    )}

                </div>

            </div>


            <!-- ================================
                 VIP PLAN
            ================================= -->

            <div class="vip-plan-title">

                <i class="
                    fa-solid
                    fa-crown
                "></i>

                <strong>

                    ${escapeHTML(vipName)}

                </strong>

            </div>


            <!-- ================================
                 PRICE
            ================================= -->

            <div class="vip-request-amount">

                <span>
                    VIP Price
                </span>

                <strong>

                    ${escapeHTML(
                        vipRequestMoney(price)
                    )}

                </strong>

            </div>


            <!-- ================================
                 DETAILS LIST
            ================================= -->

            <div class="vip-request-details">


                <div class="vip-detail-item">

                    <span>

                        <i class="
                            fa-solid
                            fa-coins
                        "></i>

                        Daily Income

                    </span>

                    <strong>

                        ${escapeHTML(
                            vipRequestMoney(
                                daily
                            )
                        )}

                    </strong>

                </div>


                <div class="vip-detail-item">

                    <span>

                        <i class="
                            fa-solid
                            fa-chart-line
                        "></i>

                        Total Profit

                    </span>

                    <strong>

                        ${escapeHTML(
                            vipRequestMoney(
                                totalProfit
                            )
                        )}

                    </strong>

                </div>


                <div class="vip-detail-item">

                    <span>

                        <i class="
                            fa-solid
                            fa-calendar-days
                        "></i>

                        Duration

                    </span>

                    <strong>

                        ${
                            duration > 0
                                ? `${duration} Days`
                                : "N/A"
                        }

                    </strong>

                </div>


                <div class="vip-detail-item">

                    <span>

                        <i class="
                            fa-solid
                            fa-wallet
                        "></i>

                        Payment

                    </span>

                    <strong>

                        ${escapeHTML(
                            paymentMethod
                        )}

                    </strong>

                </div>


                <div class="vip-detail-item">

                    <span>

                        <i class="
                            fa-solid
                            fa-phone
                        "></i>

                        Phone

                    </span>

                    <strong>

                        ${escapeHTML(phone)}

                    </strong>

                </div>


            </div>


            <!-- ================================
                 META
            ================================= -->

            <div class="vip-request-meta">

                <span>

                    <i class="
                        fa-solid
                        fa-clock
                    "></i>

                    Requested:
                    ${escapeHTML(requestedAt)}

                </span>


                <span>

                    <i class="
                        fa-solid
                        fa-fingerprint
                    "></i>

                    Request ID:
                    ${escapeHTML(request.id)}

                </span>

            </div>


            ${
                uid
                    ? `
                        <div class="vip-request-user-id">

                            <i class="
                                fa-solid
                                fa-user-shield
                            "></i>

                            UID:
                            ${escapeHTML(uid)}

                        </div>
                      `
                    : ""
            }


            <!-- ================================
                 ACTIONS
            ================================= -->

            ${actions}

        </article>

    `;

}


/* =========================================================
   APPROVE / REJECT BUTTONS
========================================================= */

function activateVipRequestButtons() {


    document
        .querySelectorAll(
            ".vip-approve-btn"
        )
        .forEach(button => {


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


                    const card =
                        button.closest(
                            ".vip-request-card"
                        );


                    if (
                        card?.dataset.processing ===
                        "true"
                    ) {

                        return;

                    }


                    if (card) {

                        card.dataset.processing =
                            "true";

                    }


                    button.disabled =
                        true;


                    const rejectButton =
                        card?.querySelector(
                            ".vip-reject-btn"
                        );


                    if (rejectButton) {

                        rejectButton.disabled =
                            true;

                    }


                    button.innerHTML = `

                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>

                        Processing...

                    `;


                    try {

                        await approveVipRequest(
                            id
                        );


                    } catch (error) {

                        console.error(
                            "Approve VIP error:",
                            error
                        );


                        button.disabled =
                            false;


                        if (rejectButton) {

                            rejectButton.disabled =
                                false;

                        }


                        button.innerHTML = `

                            <i class="
                                fa-solid
                                fa-check
                            "></i>

                            Approve

                        `;


                        if (card) {

                            card.dataset.processing =
                                "false";

                        }

                    }

                }
            );

        });


    document
        .querySelectorAll(
            ".vip-reject-btn"
        )
        .forEach(button => {


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


                    const card =
                        button.closest(
                            ".vip-request-card"
                        );


                    if (
                        card?.dataset.processing ===
                        "true"
                    ) {

                        return;

                    }


                    if (card) {

                        card.dataset.processing =
                            "true";

                    }


                    button.disabled =
                        true;


                    const approveButton =
                        card?.querySelector(
                            ".vip-approve-btn"
                        );


                    if (approveButton) {

                        approveButton.disabled =
                            true;

                    }


                    button.innerHTML = `

                        <i class="
                            fa-solid
                            fa-spinner
                            fa-spin
                        "></i>

                        Processing...

                    `;


                    try {

                        await rejectVipRequest(
                            id
                        );


                    } catch (error) {

                        console.error(
                            "Reject VIP error:",
                            error
                        );


                        button.disabled =
                            false;


                        if (approveButton) {

                            approveButton.disabled =
                                false;

                        }


                        button.innerHTML = `

                            <i class="
                                fa-solid
                                fa-xmark
                            "></i>

                            Reject

                        `;


                        if (card) {

                            card.dataset.processing =
                                "false";

                        }

                    }

                }
            );

        });

}


/* =========================================================
   SEARCH / FILTER
========================================================= */

function setupVipRequestSearch() {

    const search =
        document.getElementById(
            "vipSearch"
        );


    const filter =
        document.getElementById(
            "vipFilter"
        );


    if (
        search &&
        !vipRequestSearchInitialized
    ) {

        search.addEventListener(
            "input",
            () => {

                renderVipRequests();

            }
        );

    }


    if (
        filter &&
        !filter.dataset.vipBound
    ) {

        filter.dataset.vipBound =
            "true";


        filter.addEventListener(
            "change",
            () => {

                renderVipRequests();

            }
        );

    }


    if (search) {

        search.dataset.bound =
            "true";

    }


    vipRequestSearchInitialized =
        true;

}


/* =========================================================
   REFRESH
========================================================= */

function refreshVipRequests() {

    renderVipRequests();

    setupVipRequestSearch();

}


/* =========================================================
   QUICK ACTION
   VIP REQUESTS -> OPEN PAGE + SHOW LIST
========================================================= */

function setupVipRequestQuickAction() {

    const button =
        document.getElementById(
            "openVipRequests"
        );


    if (
        !button ||
        button.dataset.vipQuickBound ===
        "true"
    ) {

        return;

    }


    button.dataset.vipQuickBound =
        "true";


    button.addEventListener(
        "click",
        async () => {

            try {

                if (
                    typeof openPage ===
                    "function"
                ) {

                    openPage(
                        "vipRequests"
                    );

                }


                await loadVipRequests();


                renderVipRequests();


                setupVipRequestSearch();


            } catch (error) {

                console.error(
                    "VIP Quick Action error:",
                    error
                );


                showToast(
                    "Failed to load VIP requests.",
                    "error"
                );

            }

        }
    );

}


/* =========================================================
   GET CACHE
========================================================= */

function getVipRequestCache() {

    return {

        requests: allVipRequests,

        users: vipRequestUsers

    };

}


/* =========================================================
   EXPORT
========================================================= */

window.loadVipRequests =
    loadVipRequests;


window.renderVipRequests =
    renderVipRequests;


window.setupVipRequestSearch =
    setupVipRequestSearch;


window.refreshVipRequests =
    refreshVipRequests;


window.setupVipRequestQuickAction =
    setupVipRequestQuickAction;


window.getVipRequestCache =
    getVipRequestCache;


/* =========================================================
   DOM READY
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            setupVipRequestSearch();

            setupVipRequestQuickAction();

        }
    );

} else {

    setupVipRequestSearch();

    setupVipRequestQuickAction();

}


console.log(
    "Money Vault Admin Part 7 loaded — VIP Request List ready."
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 8
   VIP APPROVE / REJECT
   CURRENCY: RWF / FRW
========================================================= */

const REFERRAL_BONUS_AMOUNT = 1000;


/* =========================================================
   COMMON VIP ADMIN HELPERS
========================================================= */

function getVipAdminUid() {

    return (
        currentAdmin?.uid ||
        window.getCurrentAdmin?.()?.uid ||
        null
    );

}


function normalizeVipAdminStatus(value) {

    return String(
        value ?? "pending"
    )
    .trim()
    .toLowerCase();

}


function vipAdminNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;

}


/* =========================================================
   MARK PROCESSING ERROR
   IMPORTANT:
   Never return request to pending after
   money may already have been deducted.
========================================================= */

async function markVipProcessingError(
    id,
    message,
    extra = {}
) {

    if (!id) {
        return;
    }


    try {

        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        await runTransaction(
            requestRef,
            current => {

                if (!current) {
                    return;
                }


                const status =
                    normalizeVipAdminStatus(
                        current.status
                    );


                /*
                 * Only processing requests may
                 * become processing_error.
                 *
                 * If already approved/rejected,
                 * do nothing.
                 */

                if (
                    status !==
                    "processing"
                ) {

                    return;

                }


                return {

                    ...current,

                    status:
                        "processing_error",

                    processingError:
                        message ||
                        "VIP approval failed.",

                    errorAt:
                        Date.now(),

                    errorBy:
                        getVipAdminUid(),

                    ...extra

                };

            }
        );

    } catch (error) {

        console.error(
            "markVipProcessingError error:",
            error
        );

    }

}


/* =========================================================
   APPROVE VIP REQUEST
========================================================= */

async function approveVipRequest(id) {

    await window.waitForAdmin();


    const adminUid =
        getVipAdminUid();


    if (!adminUid) {

        showToast(
            "Administrator session is not ready.",
            "error"
        );

        return false;

    }


    if (!id) {

        showToast(
            "Invalid VIP request.",
            "error"
        );

        return false;

    }


    try {

        /* =================================================
           REQUEST REFERENCE
        ================================================= */

        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        /* =================================================
           GET REQUEST
        ================================================= */

        const requestSnapshot =
            await get(
                requestRef
            );


        if (!requestSnapshot.exists()) {

            showToast(
                "VIP request not found.",
                "error"
            );

            return false;

        }


        const request =
            requestSnapshot.val() || {};


        const status =
            normalizeVipAdminStatus(
                request.status
            );


        /* =================================================
           ONLY PENDING CAN BE APPROVED
        ================================================= */

        if (status !== "pending") {

            showToast(
                `This request is already ${status}.`,
                "warning"
            );

            return false;

        }


        /* =================================================
           REQUEST DATA
        ================================================= */

        const uid =
            request.uid ||
            request.userId ||
            request.userUID ||
            "";


        const vipName =
            request.vipName ||
            request.name ||
            request.planName ||
            request.vipPlan ||
            "VIP Plan";


        const price =
            vipAdminNumber(
                request.price ??
                request.vipPrice ??
                request.amount
            );


        const dailyIncome =
            vipAdminNumber(
                request.dailyIncome ??
                request.daily ??
                request.dailyProfit
            );


        const totalProfit =
            vipAdminNumber(
                request.totalProfit ??
                request.profit ??
                request.totalEarning
            );


        let duration =
            vipAdminNumber(
                request.duration ??
                request.days ??
                request.durationDays
            );


        /* =================================================
           CALCULATE DURATION
        ================================================= */

        if (
            duration <= 0 &&
            dailyIncome > 0 &&
            totalProfit > 0
        ) {

            duration =
                Math.ceil(
                    totalProfit /
                    dailyIncome
                );

        }


        /* =================================================
           VALIDATION
        ================================================= */

        if (!uid) {

            showToast(
                "VIP request has no UID.",
                "error"
            );

            return false;

        }


        if (price <= 0) {

            showToast(
                "Invalid VIP price.",
                "error"
            );

            return false;

        }


        if (dailyIncome <= 0) {

            showToast(
                "Invalid daily income.",
                "error"
            );

            return false;

        }


        if (totalProfit <= 0) {

            showToast(
                "Invalid total profit.",
                "error"
            );

            return false;

        }


        if (duration <= 0) {

            showToast(
                "Invalid VIP duration.",
                "error"
            );

            return false;

        }


        /* =================================================
           CONFIRM APPROVAL
        ================================================= */

        const confirmed =
            window.confirm(
                `Approve ${vipName} for ${formatMoney(price)}?`
            );


        if (!confirmed) {

            return false;

        }


        /* =================================================
           ATOMIC LOCK
           
           pending -> processing
           
           This is the most important protection.
           Two admins/clicks cannot both approve.
        ================================================= */

        const lockResult =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {

                        return;

                    }


                    const currentStatus =
                        normalizeVipAdminStatus(
                            current.status
                        );


                    if (
                        currentStatus !==
                        "pending"
                    ) {

                        return;

                    }


                    return {

                        ...current,

                        status:
                            "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            adminUid

                    };

                }
            );


        if (!lockResult.committed) {

            showToast(
                "This VIP request was already processed or is being processed.",
                "warning"
            );

            return false;

        }


        /* =================================================
           USER REFERENCE
        ================================================= */

        const userRef =
            ref(
                db,
                `users/${uid}`
            );


        const userSnapshot =
            await get(
                userRef
            );


        if (!userSnapshot.exists()) {

            await markVipProcessingError(
                id,
                "User account not found."
            );


            showToast(
                "User account not found.",
                "error"
            );

            return false;

        }


        const user =
            userSnapshot.val() || {};


        const balance =
            vipAdminNumber(
                user.balance
            );


        /* =================================================
           BALANCE CHECK
        ================================================= */

        if (balance < price) {

            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    const currentStatus =
                        normalizeVipAdminStatus(
                            current.status
                        );


                    if (
                        currentStatus !==
                        "processing"
                    ) {

                        return;

                    }


                    return {

                        ...current,

                        status:
                            "rejected",

                        rejectionReason:
                            "Insufficient balance.",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            adminUid

                    };

                }
            );


            showToast(
                "Insufficient user balance.",
                "error"
            );

            return false;

        }


        /* =================================================
           VIP DATES
        ================================================= */

        const startDate =
            Date.now();


        const endDate =
            startDate +
            (
                duration *
                24 *
                60 *
                60 *
                1000
            );


        /* =================================================
           DEDUCT VIP PRICE
           
           IMPORTANT:
           NO DAILY PROFIT IS ADDED HERE.
        ================================================= */

        const balanceResult =
            await runTransaction(
                userRef,
                currentUser => {

                    if (!currentUser) {

                        return;

                    }


                    const currentBalance =
                        vipAdminNumber(
                            currentUser.balance
                        );


                    if (
                        currentBalance <
                        price
                    ) {

                        return;

                    }


                    return {

                        ...currentUser,

                        balance:
                            currentBalance -
                            price,

                        totalTransactions:
                            (
                                vipAdminNumber(
                                    currentUser
                                        .totalTransactions
                                )
                            ) + 1,

                        updatedAt:
                            Date.now()

                    };

                }
            );


        if (
            !balanceResult.committed
        ) {

            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    if (
                        normalizeVipAdminStatus(
                            current.status
                        ) !== "processing"
                    ) {

                        return;

                    }


                    return {

                        ...current,

                        status:
                            "rejected",

                        rejectionReason:
                            "Insufficient balance.",

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            adminUid

                    };

                }
            );


            showToast(
                "VIP purchase failed: insufficient balance.",
                "error"
            );

            return false;

        }


        /* =================================================
           CREATE VIP BUYER
           
           lastClaim = approval time.
           
           User must wait 24 hours before
           claiming first daily income.
        ================================================= */

        const vipBuyer = {

            uid:
                uid,

            vipName:
                vipName,

            price:
                price,

            dailyIncome:
                dailyIncome,

            totalProfit:
                totalProfit,

            duration:
                duration,

            startDate:
                startDate,

            endDate:
                endDate,

            lastClaim:
                startDate,

            claimedAmount:
                0,

            totalEarned:
                0,

            claimCount:
                0,

            active:
                true,

            status:
                "active",

            currency:
                "RWF",

            purchaseRequestId:
                id,

            approvedAt:
                startDate,

            approvedBy:
                adminUid

        };


        /* =================================================
           CREATE VIP BUYER
        ================================================= */

        try {

            await set(
                ref(
                    db,
                    `vipBuyers/${id}`
                ),
                vipBuyer
            );

        } catch (error) {

            await markVipProcessingError(
                id,
                "VIP buyer could not be created."
            );


            showToast(
                "VIP buyer creation failed. Request marked for review.",
                "error"
            );

            return false;

        }


        /* =================================================
           COPY VIP PLAN TO USER
        ================================================= */

        try {

            await set(
                ref(
                    db,
                    `users/${uid}/vipPlans/${id}`
                ),
                vipBuyer
            );

        } catch (error) {

            await markVipProcessingError(
                id,
                "VIP plan could not be added to user account.",
                {
                    vipBuyerId:
                        id
                }
            );


            showToast(
                "VIP user plan creation failed. Request marked for review.",
                "error"
            );

            return false;

        }


        /* =================================================
           VIP PURCHASE TRANSACTION
        ================================================= */

        let transactionId = null;


        try {

            const transactionRef =
                push(
                    ref(
                        db,
                        "transactions"
                    )
                );


            transactionId =
                transactionRef.key;


            await set(
                transactionRef,
                {

                    uid:
                        uid,

                    type:
                        "VIP Purchase",

                    transactionType:
                        "vip_purchase",

                    amount:
                        price,

                    vipName:
                        vipName,

                    dailyIncome:
                        dailyIncome,

                    totalProfit:
                        totalProfit,

                    duration:
                        duration,

                    status:
                        "approved",

                    currency:
                        "RWF",

                    requestId:
                        id,

                    createdAt:
                        Date.now(),

                    timestamp:
                        Date.now(),

                    adminId:
                        adminUid

                }
            );

        } catch (error) {

            await markVipProcessingError(
                id,
                "VIP purchase transaction could not be created.",
                {
                    vipBuyerId:
                        id,

                    transactionId:
                        transactionId ||
                        null
                }
            );


            showToast(
                "Transaction record failed. Request marked for review.",
                "error"
            );

            return false;

        }


        /* =================================================
           REFERRAL BONUS
           
           1,000 RWF
           
           Only once per VIP request.
        ================================================= */

        const referredBy =
            user.referredBy ||
            user.referredByUid ||
            "";


        if (referredBy) {

            try {

                const bonusRef =
                    ref(
                        db,
                        `vipReferralBonuses/${id}`
                    );


                const bonusSnapshot =
                    await get(
                        bonusRef
                    );


                if (
                    !bonusSnapshot.exists()
                ) {

                    const referrerRef =
                        ref(
                            db,
                            `users/${referredBy}`
                        );


                    const bonusResult =
                        await runTransaction(
                            referrerRef,
                            referrer => {

                                if (!referrer) {

                                    return;

                                }


                                return {

                                    ...referrer,

                                    referralEarnings:
                                        (
                                            vipAdminNumber(
                                                referrer
                                                    .referralEarnings
                                            )
                                        ) +
                                        REFERRAL_BONUS_AMOUNT,

                                    updatedAt:
                                        Date.now()

                                };

                            }
                        );


                    if (
                        bonusResult.committed
                    ) {

                        await set(
                            bonusRef,
                            {

                                referrerUid:
                                    referredBy,

                                referredUserUid:
                                    uid,

                                requestId:
                                    id,

                                amount:
                                    REFERRAL_BONUS_AMOUNT,

                                currency:
                                    "RWF",

                                status:
                                    "approved",

                                createdAt:
                                    Date.now(),

                                adminId:
                                    adminUid

                            }
                        );


                        /* =================================
                           REFERRAL TRANSACTION
                        ================================= */

                        const referralTransactionRef =
                            push(
                                ref(
                                    db,
                                    "transactions"
                                )
                            );


                        await set(
                            referralTransactionRef,
                            {

                                uid:
                                    referredBy,

                                type:
                                    "Referral Bonus",

                                transactionType:
                                    "referral_bonus",

                                amount:
                                    REFERRAL_BONUS_AMOUNT,

                                currency:
                                    "RWF",

                                relatedUser:
                                    uid,

                                requestId:
                                    id,

                                status:
                                    "approved",

                                createdAt:
                                    Date.now(),

                                timestamp:
                                    Date.now(),

                                adminId:
                                    adminUid

                            }
                        );

                    }

                }

            } catch (referralError) {

                /*
                 * Referral bonus failure does NOT
                 * cancel the main VIP purchase.
                 */

                console.error(
                    "Referral bonus error:",
                    referralError
                );

            }

        }


        /* =================================================
           FINALIZE REQUEST
           
           processing -> approved
        ================================================= */

        try {

            const finalResult =
                await runTransaction(
                    requestRef,
                    current => {

                        if (!current) {
                            return;
                        }


                        const currentStatus =
                            normalizeVipAdminStatus(
                                current.status
                            );


                        /*
                         * Only processing can become
                         * approved.
                         */

                        if (
                            currentStatus !==
                            "processing"
                        ) {

                            return;

                        }


                        return {

                            ...current,

                            status:
                                "approved",

                            approvedAt:
                                Date.now(),

                            approvedBy:
                                adminUid,

                            vipBuyerId:
                                id,

                            transactionId:
                                transactionId,

                            currency:
                                "RWF"

                        };

                    }
                );


            if (
                !finalResult.committed
            ) {

                /*
                 * VIP has already been created and
                 * balance deducted. Never make it
                 * pending again.
                 */

                await markVipProcessingError(
                    id,
                    "VIP was created but request could not be finalized.",
                    {
                        vipBuyerId:
                            id,

                        transactionId:
                            transactionId
                    }
                );


                showToast(
                    "VIP was created, but final status needs admin review.",
                    "warning"
                );

                return false;

            }

        } catch (error) {

            await markVipProcessingError(
                id,
                error?.message ||
                "Could not finalize VIP request.",
                {
                    vipBuyerId:
                        id,

                    transactionId:
                        transactionId
                }
            );


            showToast(
                "VIP was created, but final status needs admin review.",
                "warning"
            );

            return false;

        }


        /* =================================================
           REFRESH UI
        ================================================= */

        if (
            typeof renderVipRequests ===
            "function"
        ) {

            renderVipRequests();

        }


        if (
            typeof window.renderDashboard ===
            "function"
        ) {

            window.renderDashboard();

        }


        if (
            typeof window.loadVipBuyers ===
            "function"
        ) {

            window.loadVipBuyers();

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


        showToast(
            `${vipName} approved successfully.`,
            "success"
        );


        return true;


    } catch (error) {

        console.error(
            "approveVipRequest error:",
            error
        );


        /*
         * IMPORTANT:
         * If money has already been deducted,
         * NEVER change request back to pending.
         */

        await markVipProcessingError(
            id,
            error?.message ||
            "Unknown VIP approval error."
        );


        showToast(
            error?.message ||
            "VIP approval failed.",
            "error"
        );


        return false;

    }

}


/* =========================================================
   REJECT VIP REQUEST
========================================================= */

async function rejectVipRequest(id) {

    await window.waitForAdmin();


    const adminUid =
        getVipAdminUid();


    if (!adminUid) {

        showToast(
            "Administrator session is not ready.",
            "error"
        );

        return false;

    }


    if (!id) {

        showToast(
            "Invalid VIP request.",
            "error"
        );

        return false;

    }


    try {

        /* =================================================
           REQUEST
        ================================================= */

        const requestRef =
            ref(
                db,
                `vipPurchaseRequests/${id}`
            );


        const snapshot =
            await get(
                requestRef
            );


        if (!snapshot.exists()) {

            showToast(
                "VIP request not found.",
                "error"
            );

            return false;

        }


        const request =
            snapshot.val() || {};


        const status =
            normalizeVipAdminStatus(
                request.status
            );


        /* =================================================
           ONLY PENDING CAN BE REJECTED
        ================================================= */

        if (
            status !== "pending"
        ) {

            showToast(
                `This request is already ${status}.`,
                "warning"
            );

            return false;

        }


        const vipName =
            request.vipName ||
            request.name ||
            request.planName ||
            request.vipPlan ||
            "VIP Plan";


        const price =
            vipAdminNumber(
                request.price ??
                request.vipPrice ??
                request.amount
            );


        /* =================================================
           CONFIRM
        ================================================= */

        const confirmed =
            window.confirm(
                `Reject ${vipName} VIP purchase of ${formatMoney(price)}?`
            );


        if (!confirmed) {

            return false;

        }


        /* =================================================
           REASON
        ================================================= */

        let reason =
            "Rejected by administrator.";


        try {

            const enteredReason =
                window.prompt(
                    "Enter rejection reason (optional):",
                    ""
                );


            if (
                enteredReason &&
                enteredReason.trim()
            ) {

                reason =
                    enteredReason.trim();

            }

        } catch {

            /*
             * Prompt may not be available
             * in some browser environments.
             */

        }


        /* =================================================
           ATOMIC REJECT
           
           pending -> rejected
           
           Only the first successful transaction
           can reject the request.
        ================================================= */

        const result =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {

                        return;

                    }


                    const currentStatus =
                        normalizeVipAdminStatus(
                            current.status
                        );


                    if (
                        currentStatus !==
                        "pending"
                    ) {

                        return;

                    }


                    return {

                        ...current,

                        status:
                            "rejected",

                        rejectionReason:
                            reason,

                        rejectedAt:
                            Date.now(),

                        rejectedBy:
                            adminUid,

                        currency:
                            "RWF"

                    };

                }
            );


        if (
            !result.committed
        ) {

            showToast(
                "This VIP request was already processed.",
                "warning"
            );

            return false;

        }


        /* =================================================
           REFRESH
        ================================================= */

        if (
            typeof renderVipRequests ===
            "function"
        ) {

            renderVipRequests();

        }


        if (
            typeof window.renderDashboard ===
            "function"
        ) {

            window.renderDashboard();

        }


        showToast(
            `${vipName} request rejected successfully.`,
            "success"
        );


        return true;


    } catch (error) {

        console.error(
            "rejectVipRequest error:",
            error
        );


        showToast(
            error?.message ||
            "VIP rejection failed.",
            "error"
        );


        return false;

    }

}


/* =========================================================
   EXPORT
========================================================= */

window.approveVipRequest =
    approveVipRequest;


window.rejectVipRequest =
    rejectVipRequest;


window.markVipProcessingError =
    markVipProcessingError;


/* =========================================================
   PART 8 READY
========================================================= */

console.log(
    "Money Vault Admin Part 8 loaded."
);


console.log(
    "Currency: RWF / FRW"
);


console.log(
    "VIP daily income is NOT added during approval."
);


console.log(
    "VIP approval/rejection is protected against duplicate processing."
);


/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 9
   VIP BUYERS MANAGEMENT
   CURRENCY: RWF / FRW
========================================================= */

let allVipBuyers = [];
let vipBuyerUsers = {};
let vipBuyerListenersStarted = false;


/* =========================================================
   SAFE HELPERS
========================================================= */

function vipBuyerValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function vipBuyerMoney(value) {
    return formatMoney(vipBuyerValue(value));
}

function vipBuyerDate(value) {
    const timestamp = vipBuyerValue(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}

function vipBuyerStatus(buyer) {

    const storedStatus = String(
        buyer?.status ||
        ""
    ).trim().toLowerCase();

    const activeField = buyer?.active;

    if (
        storedStatus === "expired" ||
        activeField === false
    ) {
        return "expired";
    }

    if (
        storedStatus === "active" ||
        activeField === true
    ) {
        const endDate = vipBuyerValue(
            buyer?.endDate
        );

        if (
            endDate > 0 &&
            Date.now() >= endDate
        ) {
            return "expired";
        }

        return "active";
    }

    const endDate = vipBuyerValue(
        buyer?.endDate
    );

    if (
        endDate > 0 &&
        Date.now() >= endDate
    ) {
        return "expired";
    }

    return "active";
}


/* =========================================================
   VIP FIELD HELPERS
========================================================= */

function getVipBuyerName(buyer) {

    return (
        buyer?.vipName ||
        buyer?.name ||
        buyer?.planName ||
        buyer?.vipPlan ||
        "VIP Plan"
    );
}

function getVipBuyerPrice(buyer) {

    return vipBuyerValue(
        buyer?.price ??
        buyer?.vipPrice ??
        buyer?.amount
    );
}

function getVipBuyerDailyIncome(buyer) {

    return vipBuyerValue(
        buyer?.dailyIncome ??
        buyer?.daily ??
        buyer?.dailyProfit
    );
}

function getVipBuyerTotalProfit(buyer) {

    return vipBuyerValue(
        buyer?.totalProfit ??
        buyer?.profit ??
        buyer?.totalEarning
    );
}

function getVipBuyerDuration(buyer) {

    const directDuration = vipBuyerValue(
        buyer?.duration ??
        buyer?.days ??
        buyer?.durationDays
    );

    if (directDuration > 0) {
        return Math.ceil(directDuration);
    }

    const dailyIncome = getVipBuyerDailyIncome(buyer);
    const totalProfit = getVipBuyerTotalProfit(buyer);

    if (
        dailyIncome > 0 &&
        totalProfit > 0
    ) {
        return Math.ceil(
            totalProfit / dailyIncome
        );
    }

    return 0;
}

function getVipBuyerStartDate(buyer) {

    return vipBuyerValue(
        buyer?.startDate ??
        buyer?.approvedAt ??
        buyer?.createdAt ??
        buyer?.timestamp
    );
}

function getVipBuyerEndDate(buyer) {

    const storedEndDate = vipBuyerValue(
        buyer?.endDate
    );

    if (storedEndDate > 0) {
        return storedEndDate;
    }

    const startDate = getVipBuyerStartDate(buyer);
    const duration = getVipBuyerDuration(buyer);

    if (
        startDate > 0 &&
        duration > 0
    ) {
        return (
            startDate +
            duration * 24 * 60 * 60 * 1000
        );
    }

    return 0;
}


/* =========================================================
   USER HELPERS
========================================================= */

function getVipBuyerUserName(user) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        "Unknown User"
    );
}

function getVipBuyerEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}

function getVipBuyerPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        "N/A"
    );
}

function getVipBuyerPhoto(user) {

    return (
        user?.photoURL ||
        user?.photoUrl ||
        user?.profilePhoto ||
        user?.photo ||
        ""
    );
}


/* =========================================================
   LOAD VIP BUYERS
========================================================= */

async function loadVipBuyers() {

    await window.waitForAdmin();

    if (vipBuyerListenersStarted) {

        renderVipBuyers();

        return;
    }

    vipBuyerListenersStarted = true;


    /* -----------------------------------------
       USERS LISTENER
    ----------------------------------------- */

    if (!listeners.vipBuyerUsers) {

        listeners.vipBuyerUsers = onValue(
            ref(db, "users"),

            snapshot => {

                vipBuyerUsers =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                renderVipBuyers();
            },

            error => {

                console.error(
                    "VIP buyer users listener error:",
                    error
                );

                showToast(
                    "Failed to load VIP users.",
                    "error"
                );
            }
        );
    }


    /* -----------------------------------------
       VIP BUYERS LISTENER
    ----------------------------------------- */

    if (!listeners.vipBuyers) {

        listeners.vipBuyers = onValue(
            ref(db, "vipBuyers"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};

                allVipBuyers =
                    Object.entries(data).map(
                        ([id, buyer]) => ({
                            id,
                            ...(buyer || {})
                        })
                    );


                /* ---------------------------------
                   SORT NEWEST FIRST
                --------------------------------- */

                allVipBuyers.sort(
                    (a, b) => {

                        const dateA =
                            getVipBuyerStartDate(a);

                        const dateB =
                            getVipBuyerStartDate(b);

                        return dateB - dateA;
                    }
                );

                renderVipBuyers();
            },

            error => {

                console.error(
                    "VIP buyers listener error:",
                    error
                );

                showToast(
                    "Failed to load VIP buyers.",
                    "error"
                );
            }
        );
    }


    setupVipBuyerSearch();

    renderVipBuyers();
}


/* =========================================================
   RENDER VIP BUYERS
========================================================= */

function renderVipBuyers() {

    const list =
        document.getElementById(
            "vipBuyerList"
        );

    const empty =
        document.getElementById(
            "emptyVipBuyer"
        );

    if (!list) {
        return;
    }


    /* -----------------------------------------
       COUNTERS
    ----------------------------------------- */

    let total = 0;
    let active = 0;
    let expired = 0;

    allVipBuyers.forEach(
        buyer => {

            total++;

            const status =
                vipBuyerStatus(buyer);

            if (status === "active") {
                active++;
            }

            if (status === "expired") {
                expired++;
            }
        }
    );


    updateText(
        "vipBuyerTotalCount",
        total.toLocaleString("en-US")
    );

    updateText(
        "vipBuyerActiveCount",
        active.toLocaleString("en-US")
    );

    updateText(
        "vipBuyerExpiredCount",
        expired.toLocaleString("en-US")
    );


    /* -----------------------------------------
       SEARCH
    ----------------------------------------- */

    const searchInput =
        document.getElementById(
            "vipBuyerSearch"
        );

    const search =
        String(
            searchInput?.value || ""
        )
            .trim()
            .toLowerCase();


    /* -----------------------------------------
       FILTER
    ----------------------------------------- */

    const filterElement =
        document.getElementById(
            "vipBuyerFilter"
        );

    const filter =
        String(
            filterElement?.value || "all"
        )
            .trim()
            .toLowerCase();


    /* -----------------------------------------
       FILTER DATA
    ----------------------------------------- */

    const filtered =
        allVipBuyers.filter(
            buyer => {

                const status =
                    vipBuyerStatus(buyer);

                if (
                    filter !== "all" &&
                    status !== filter
                ) {
                    return false;
                }


                const user =
                    vipBuyerUsers[
                        buyer.uid
                    ] || {};


                const searchable = [

                    buyer.id,

                    buyer.uid,

                    getVipBuyerName(buyer),

                    user.name,

                    user.fullName,

                    user.displayName,

                    user.username,

                    user.email,

                    user.phone,

                    user.phoneNumber,

                    buyer.price,

                    buyer.dailyIncome,

                    buyer.totalProfit,

                    buyer.status

                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                return (
                    !search ||
                    searchable.includes(search)
                );
            }
        );


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

    if (!filtered.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display =
                "block";

            empty.innerHTML = `
                <div class="empty-state">

                    <i class="fa-solid fa-crown"></i>

                    <h3>
                        No VIP Buyers
                    </h3>

                    <p>
                        No VIP buyers match
                        your search or filter.
                    </p>

                </div>
            `;
        }

        return;
    }


    if (empty) {
        empty.style.display = "none";
    }


    /* -----------------------------------------
       CARDS
    ----------------------------------------- */

    list.innerHTML =
        filtered
            .map(
                buyer =>
                    renderVipBuyerCard(
                        buyer,
                        vipBuyerUsers[
                            buyer.uid
                        ] || {}
                    )
            )
            .join("");
}


/* =========================================================
   VIP BUYER CARD
========================================================= */

function renderVipBuyerCard(
    buyer,
    user
) {

    const status =
        vipBuyerStatus(buyer);


    const statusClass =
        status === "active"
            ? "active"
            : "expired";


    const vipName =
        getVipBuyerName(buyer);

    const price =
        getVipBuyerPrice(buyer);

    const dailyIncome =
        getVipBuyerDailyIncome(buyer);

    const totalProfit =
        getVipBuyerTotalProfit(buyer);

    const duration =
        getVipBuyerDuration(buyer);

    const startDate =
        getVipBuyerStartDate(buyer);

    const endDate =
        getVipBuyerEndDate(buyer);


    const claimedAmount =
        vipBuyerValue(
            buyer?.claimedAmount
        );

    const totalEarned =
        vipBuyerValue(
            buyer?.totalEarned
        );

    const claimCount =
        vipBuyerValue(
            buyer?.claimCount
        );

    const lastClaim =
        vipBuyerValue(
            buyer?.lastClaim
        );


    const userName =
        getVipBuyerUserName(user);

    const email =
        getVipBuyerEmail(user);

    const phone =
        getVipBuyerPhone(user);

    const photo =
        getVipBuyerPhoto(user);


    /* -----------------------------------------
       AVATAR
    ----------------------------------------- */

    let avatarHTML = `
        <div class="vip-buyer-avatar">
            <i class="fa-solid fa-user"></i>
        </div>
    `;


    if (photo) {

        avatarHTML = `
            <div class="vip-buyer-avatar">
                <img
                    src="${escapeHTML(photo)}"
                    alt="User"
                    onerror="
                        this.style.display='none';
                        this.parentElement
                            .classList.add('avatar-error');
                    "
                >
            </div>
        `;
    }


    /* -----------------------------------------
       STATUS ICON
    ----------------------------------------- */

    const statusIcon =
        status === "active"
            ? "fa-circle-check"
            : "fa-circle-xmark";


    return `
        <article
            class="vip-buyer-card"
            data-id="${escapeHTML(buyer.id)}"
        >

            <!-- HEADER -->

            <div class="vip-buyer-header">

                <div class="vip-buyer-user">

                    ${avatarHTML}

                    <div>

                        <h3>
                            ${escapeHTML(userName)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                    </div>

                </div>


                <div
                    class="
                        vip-buyer-status
                        status-${escapeHTML(statusClass)}
                    "
                >

                    <i
                        class="
                            fa-solid
                            ${statusIcon}
                        "
                    ></i>

                    ${escapeHTML(
                        status
                    )}

                </div>

            </div>


            <!-- VIP NAME -->

            <div class="vip-buyer-plan">

                <i class="fa-solid fa-crown"></i>

                <strong>
                    ${escapeHTML(vipName)}
                </strong>

            </div>


            <!-- PRICE -->

            <div class="vip-buyer-price">

                <span>
                    VIP Price
                </span>

                <strong>
                    ${escapeHTML(
                        vipBuyerMoney(price)
                    )}
                </strong>

            </div>


            <!-- MAIN DETAILS -->

            <div class="vip-buyer-details">

                <div>

                    <span>
                        <i class="fa-solid fa-coins"></i>
                        Daily Income
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                dailyIncome
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-chart-line"></i>
                        Total Profit
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                totalProfit
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-calendar-days"></i>
                        Duration
                    </span>

                    <strong>
                        ${
                            duration > 0
                                ? `${duration} Days`
                                : "N/A"
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-phone"></i>
                        Phone
                    </span>

                    <strong>
                        ${escapeHTML(phone)}
                    </strong>

                </div>

            </div>


            <!-- EARNINGS -->

            <div class="vip-buyer-earnings">

                <div>

                    <span>
                        Claimed Amount
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                claimedAmount
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Total Earned
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerMoney(
                                totalEarned
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        Claim Count
                    </span>

                    <strong>
                        ${claimCount.toLocaleString(
                            "en-US"
                        )}
                    </strong>

                </div>

            </div>


            <!-- DATES -->

            <div class="vip-buyer-dates">

                <div>

                    <span>
                        <i class="fa-solid fa-play"></i>
                        Started
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerDate(
                                startDate
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-flag-checkered"></i>
                        Ends
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerDate(
                                endDate
                            )
                        )}
                    </strong>

                </div>


                <div>

                    <span>
                        <i class="fa-solid fa-clock"></i>
                        Last Claim
                    </span>

                    <strong>
                        ${escapeHTML(
                            vipBuyerDate(
                                lastClaim
                            )
                        )}
                    </strong>

                </div>

            </div>


            <!-- META -->

            <div class="vip-buyer-meta">

                <span>
                    UID:
                    ${escapeHTML(
                        buyer.uid || "N/A"
                    )}
                </span>

                <span>
                    Buyer ID:
                    ${escapeHTML(
                        buyer.id
                    )}
                </span>

            </div>

        </article>
    `;
}


/* =========================================================
   SEARCH + FILTER
========================================================= */

function setupVipBuyerSearch() {

    const search =
        document.getElementById(
            "vipBuyerSearch"
        );

    const filter =
        document.getElementById(
            "vipBuyerFilter"
        );


    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound = "true";

        search.addEventListener(
            "input",
            renderVipBuyers
        );
    }


    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound = "true";

        filter.addEventListener(
            "change",
            renderVipBuyers
        );
    }
}


/* =========================================================
   AUTO CHECK EXPIRATION
========================================================= */

function refreshVipBuyerStatuses() {

    if (
        !allVipBuyers ||
        !allVipBuyers.length
    ) {
        return;
    }

    renderVipBuyers();
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadVipBuyers =
    loadVipBuyers;

window.renderVipBuyers =
    renderVipBuyers;

window.setupVipBuyerSearch =
    setupVipBuyerSearch;

window.refreshVipBuyerStatuses =
    refreshVipBuyerStatuses;


console.log(
    "Money Vault Admin Part 9 loaded."
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 10
   USERS MANAGEMENT
   CURRENCY: RWF / FRW
========================================================= */

let allUsers = [];
let usersListenersStarted = false;
let usersSearchInitialized = false;


/* =========================================================
   SAFE USER HELPERS
========================================================= */

function userNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}


function userMoney(value) {
    return formatMoney(userNumber(value));
}


function userDate(value) {

    const timestamp = userNumber(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}


function userStatus(user) {

    const status = String(
        user?.status ?? ""
    ).trim().toLowerCase();

    if (
        status === "blocked" ||
        status === "suspended" ||
        status === "disabled"
    ) {
        return "blocked";
    }

    if (
        user?.active === false ||
        user?.disabled === true
    ) {
        return "blocked";
    }

    return "active";
}


/* =========================================================
   USER NAME
========================================================= */

function getUserDisplayName(user) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        "Unknown User"
    );
}


/* =========================================================
   USER EMAIL
========================================================= */

function getUserDisplayEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}


/* =========================================================
   USER PHONE
========================================================= */

function getUserDisplayPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        "N/A"
    );
}


/* =========================================================
   USER PHOTO
========================================================= */

function getUserDisplayPhoto(user) {

    return (
        user?.photoURL ||
        user?.photoUrl ||
        user?.profilePhoto ||
        user?.photo ||
        ""
    );
}


/* =========================================================
   USER BALANCE
========================================================= */

function getUserBalance(user) {

    return userNumber(
        user?.balance
    );
}


/* =========================================================
   TOTAL DEPOSITS
========================================================= */

function getUserTotalDeposits(user) {

    return userNumber(
        user?.totalDeposits
    );
}


/* =========================================================
   TOTAL WITHDRAWALS
========================================================= */

function getUserTotalWithdrawals(user) {

    return userNumber(
        user?.totalWithdrawals
    );
}


/* =========================================================
   REFERRAL EARNINGS
========================================================= */

function getUserReferralEarnings(user) {

    return userNumber(
        user?.referralEarnings
    );
}


/* =========================================================
   TOTAL PROFITS
========================================================= */

function getUserTotalProfits(user) {

    return userNumber(
        user?.totalProfits ??
        user?.totalProfit ??
        user?.profits
    );
}


/* =========================================================
   TRANSACTION COUNT
========================================================= */

function getUserTransactionCount(user) {

    return userNumber(
        user?.totalTransactions
    );
}


/* =========================================================
   VIP COUNT
========================================================= */

function getUserVipCount(user) {

    if (
        user?.vipPlans &&
        typeof user.vipPlans === "object"
    ) {

        return Object.keys(
            user.vipPlans
        ).length;
    }

    if (
        user?.vipPurchases &&
        typeof user.vipPurchases === "object"
    ) {

        return Object.keys(
            user.vipPurchases
        ).length;
    }

    return userNumber(
        user?.vipCount
    );
}


/* =========================================================
   USER SEARCH VALUE
========================================================= */

function getUserSearchText(user) {

    return [

        user?.uid,

        getUserDisplayName(user),

        getUserDisplayEmail(user),

        getUserDisplayPhone(user),

        user?.username,

        user?.referralCode,

        user?.referredBy,

        user?.status

    ]
        .filter(
            value =>
                value !== undefined &&
                value !== null
        )
        .join(" ")
        .toLowerCase();
}


/* =========================================================
   LOAD USERS
========================================================= */

async function loadUsers() {

    await window.waitForAdmin();

    if (usersListenersStarted) {

        setupUserSearch();

        renderUsers();

        return;
    }

    usersListenersStarted = true;


    /* =====================================================
       USERS LISTENER
    ===================================================== */

    if (!listeners.usersManagement) {

        listeners.usersManagement = onValue(

            ref(db, "users"),

            snapshot => {

                const data =
                    snapshot.exists()
                        ? snapshot.val() || {}
                        : {};


                allUsers =
                    Object.entries(data).map(
                        ([uid, user]) => ({

                            uid,

                            ...(user || {})

                        })
                    );


                /* -----------------------------------------
                   NEWEST USERS FIRST
                ----------------------------------------- */

                allUsers.sort(
                    (a, b) => {

                        const dateA =
                            userNumber(
                                a.createdAt ??
                                a.registeredAt ??
                                a.timestamp
                            );

                        const dateB =
                            userNumber(
                                b.createdAt ??
                                b.registeredAt ??
                                b.timestamp
                            );

                        return dateB - dateA;
                    }
                );


                renderUsers();
            },

            error => {

                console.error(
                    "Users listener error:",
                    error
                );

                showToast(
                    "Failed to load users.",
                    "error"
                );
            }
        );
    }


    setupUserSearch();

    renderUsers();
}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    const list =
        document.getElementById(
            "usersList"
        );

    const empty =
        document.getElementById(
            "emptyUsers"
        );


    if (!list) {
        return;
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchInput =
        document.getElementById(
            "userSearch"
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

    const filteredUsers =
        allUsers.filter(
            user =>
                !search ||
                getUserSearchText(
                    user
                ).includes(search)
        );


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (!filteredUsers.length) {

        list.innerHTML = "";

        if (empty) {

            empty.style.display =
                "block";

            empty.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-users"></i>

                    <h3>
                        ${
                            allUsers.length
                                ? "No Users Found"
                                : "No Users Yet"
                        }
                    </h3>

                    <p>
                        ${
                            allUsers.length
                                ? "No users match your search."
                                : "There are currently no users registered."
                        }
                    </p>

                </div>

            `;
        }

        return;
    }


    if (empty) {

        empty.style.display =
            "none";
    }


    /* =====================================================
       LIST HEADER
    ===================================================== */

    const listCount =
        document.getElementById(
            "usersListCount"
        );

    if (listCount) {

        listCount.textContent =
            `${filteredUsers.length} user${
                filteredUsers.length === 1
                    ? ""
                    : "s"
            }`;
    }


    /* =====================================================
       USER LIST
    ===================================================== */

    list.innerHTML =
        filteredUsers
            .map(
                user =>
                    renderUserCard(
                        user
                    )
            )
            .join("");


    activateUserViewButtons();
}


/* =========================================================
   USER CARD
========================================================= */

function renderUserCard(user) {

    const uid =
        user.uid;


    const name =
        getUserDisplayName(user);

    const email =
        getUserDisplayEmail(user);

    const phone =
        getUserDisplayPhone(user);

    const photo =
        getUserDisplayPhoto(user);


    const balance =
        getUserBalance(user);

    const deposits =
        getUserTotalDeposits(user);

    const withdrawals =
        getUserTotalWithdrawals(user);

    const referral =
        getUserReferralEarnings(user);

    const profits =
        getUserTotalProfits(user);

    const transactions =
        getUserTransactionCount(user);

    const vipCount =
        getUserVipCount(user);


    const status =
        userStatus(user);


    const createdAt =
        userDate(
            user.createdAt ??
            user.registeredAt ??
            user.timestamp
        );


    /* =====================================================
       AVATAR
    ===================================================== */

    let avatar = `

        <div class="user-avatar avatar-default">

            <i class="fa-solid fa-user"></i>

        </div>

    `;


    if (photo) {

        avatar = `

            <div class="user-avatar">

                <img
                    src="${escapeHTML(photo)}"
                    alt="${escapeHTML(name)}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.parentElement.classList.add('avatar-error');
                    "
                >

            </div>

        `;
    }


    /* =====================================================
       STATUS
    ===================================================== */

    const statusIcon =
        status === "active"
            ? "fa-circle-check"
            : "fa-circle-xmark";


    /* =====================================================
       CARD
    ===================================================== */

    return `

        <article
            class="user-card"
            data-uid="${escapeHTML(uid)}"
        >

            <!-- =========================================
                 USER HEADER
            ========================================== -->

            <div class="user-card-header">

                <div class="user-main-info">

                    ${avatar}

                    <div class="user-name-area">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                        <small>
                            <i class="fa-solid fa-phone"></i>
                            ${escapeHTML(phone)}
                        </small>

                    </div>

                </div>


                <div
                    class="
                        user-status
                        status-${escapeHTML(status)}
                    "
                >

                    <i
                        class="
                            fa-solid
                            ${statusIcon}
                        "
                    ></i>

                    ${escapeHTML(status)}

                </div>

            </div>


            <!-- =========================================
                 BALANCE
            ========================================== -->

            <div class="user-balance-box">

                <span>

                    <i class="fa-solid fa-wallet"></i>

                    Current Balance

                </span>


                <strong>

                    ${escapeHTML(
                        userMoney(balance)
                    )}

                </strong>

            </div>


            <!-- =========================================
                 FINANCIAL INFORMATION
            ========================================== -->

            <div class="user-financial-grid">

                <div class="user-stat">

                    <span>

                        <i class="fa-solid fa-arrow-down"></i>

                        Deposits

                    </span>

                    <strong>

                        ${escapeHTML(
                            userMoney(deposits)
                        )}

                    </strong>

                </div>


                <div class="user-stat">

                    <span>

                        <i class="fa-solid fa-arrow-up"></i>

                        Withdrawals

                    </span>

                    <strong>

                        ${escapeHTML(
                            userMoney(withdrawals)
                        )}

                    </strong>

                </div>


                <div class="user-stat">

                    <span>

                        <i class="fa-solid fa-user-group"></i>

                        Referral Earnings

                    </span>

                    <strong>

                        ${escapeHTML(
                            userMoney(referral)
                        )}

                    </strong>

                </div>


                <div class="user-stat">

                    <span>

                        <i class="fa-solid fa-chart-line"></i>

                        Total Profits

                    </span>

                    <strong>

                        ${escapeHTML(
                            userMoney(profits)
                        )}

                    </strong>

                </div>

            </div>


            <!-- =========================================
                 ACCOUNT INFORMATION
            ========================================== -->

            <div class="user-account-grid">

                <div>

                    <span>

                        <i class="fa-solid fa-receipt"></i>

                        Transactions

                    </span>

                    <strong>

                        ${transactions.toLocaleString(
                            "en-US"
                        )}

                    </strong>

                </div>


                <div>

                    <span>

                        <i class="fa-solid fa-crown"></i>

                        VIP Plans

                    </span>

                    <strong>

                        ${vipCount.toLocaleString(
                            "en-US"
                        )}

                    </strong>

                </div>


                <div>

                    <span>

                        <i class="fa-solid fa-ticket"></i>

                        Referral Code

                    </span>

                    <strong
                        title="${escapeHTML(
                            user.referralCode ||
                            "N/A"
                        )}"
                    >

                        ${escapeHTML(
                            user.referralCode ||
                            "N/A"
                        )}

                    </strong>

                </div>


                <div>

                    <span>

                        <i class="fa-solid fa-user-plus"></i>

                        Referred By

                    </span>

                    <strong
                        title="${escapeHTML(
                            user.referredBy ||
                            "None"
                        )}"
                    >

                        ${escapeHTML(
                            user.referredBy ||
                            "None"
                        )}

                    </strong>

                </div>

            </div>


            <!-- =========================================
                 ACCOUNT META
            ========================================== -->

            <div class="user-card-meta">

                <span>

                    <i class="fa-solid fa-calendar"></i>

                    Joined:
                    ${escapeHTML(createdAt)}

                </span>


                <span
                    class="user-uid"
                    title="${escapeHTML(uid)}"
                >

                    <i class="fa-solid fa-fingerprint"></i>

                    UID:
                    ${escapeHTML(uid)}

                </span>

            </div>


            <!-- =========================================
                 ACTION
            ========================================== -->

            <div class="user-card-actions">

                <button
                    type="button"
                    class="user-view-btn"
                    data-uid="${escapeHTML(uid)}"
                >

                    <i class="fa-solid fa-eye"></i>

                    View Details

                </button>

            </div>

        </article>

    `;
}


/* =========================================================
   USER SEARCH
========================================================= */

function setupUserSearch() {

    const search =
        document.getElementById(
            "userSearch"
        );


    if (!search) {
        return;
    }


    if (
        search.dataset.bound === "true"
    ) {
        return;
    }


    search.dataset.bound = "true";


    search.addEventListener(
        "input",
        () => {

            renderUsers();

        }
    );
}


/* =========================================================
   VIEW USER DETAILS BUTTONS
========================================================= */

function activateUserViewButtons() {

    document
        .querySelectorAll(
            ".user-view-btn"
        )
        .forEach(button => {

            if (
                button.dataset.bound === "true"
            ) {
                return;
            }


            button.dataset.bound = "true";


            button.addEventListener(
                "click",
                () => {

                    const uid =
                        button.dataset.uid;


                    if (!uid) {

                        showToast(
                            "User ID is missing.",
                            "error"
                        );

                        return;
                    }


                    openUserDetails(
                        uid
                    );

                }
            );

        });
}


/* =========================================================
   VIEW USER DETAILS
========================================================= */

function openUserDetails(uid) {

    const user =
        allUsers.find(
            item =>
                item.uid === uid
        );


    if (!user) {

        showToast(
            "User information not found.",
            "error"
        );

        return;
    }


    const name =
        getUserDisplayName(user);

    const email =
        getUserDisplayEmail(user);

    const phone =
        getUserDisplayPhone(user);

    const balance =
        getUserBalance(user);

    const deposits =
        getUserTotalDeposits(user);

    const withdrawals =
        getUserTotalWithdrawals(user);

    const referral =
        getUserReferralEarnings(user);

    const profits =
        getUserTotalProfits(user);

    const transactions =
        getUserTransactionCount(user);

    const vipCount =
        getUserVipCount(user);

    const status =
        userStatus(user);

    const photo =
        getUserDisplayPhoto(user);


    /* =====================================================
       REMOVE OLD MODAL
    ===================================================== */

    document
        .getElementById(
            "userDetailsModal"
        )
        ?.remove();


    /* =====================================================
       CREATE MODAL
    ===================================================== */

    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "userDetailsModal";

    modal.className =
        "admin-modal-overlay";


    /* =====================================================
       MODAL AVATAR
    ===================================================== */

    const modalAvatar =
        photo

            ? `

                <img
                    src="${escapeHTML(photo)}"
                    alt="${escapeHTML(name)}"
                    onerror="
                        this.style.display='none';
                        this.parentElement.classList.add('avatar-error');
                    "
                >

            `

            : `

                <i class="fa-solid fa-user"></i>

            `;


    modal.innerHTML = `

        <div class="admin-modal user-details-modal">

            <!-- =========================================
                 HEADER
            ========================================== -->

            <div class="admin-modal-header">

                <div>

                    <h2>

                        <i class="fa-solid fa-user"></i>

                        User Details

                    </h2>

                    <p>
                        Complete account information
                    </p>

                </div>


                <button
                    type="button"
                    class="admin-modal-close"
                    id="closeUserDetailsModal"
                >

                    <i class="fa-solid fa-xmark"></i>

                </button>

            </div>


            <!-- =========================================
                 BODY
            ========================================== -->

            <div class="admin-modal-body">


                <!-- PROFILE -->

                <div class="user-details-profile">

                    <div class="user-details-avatar">

                        ${modalAvatar}

                    </div>


                    <div class="user-details-profile-info">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                        <p>
                            <i class="fa-solid fa-phone"></i>
                            ${escapeHTML(phone)}
                        </p>

                        <span
                            class="
                                user-status
                                status-${escapeHTML(status)}
                            "
                        >

                            <i
                                class="
                                    fa-solid
                                    ${
                                        status === "active"
                                            ? "fa-circle-check"
                                            : "fa-circle-xmark"
                                    }
                                "
                            ></i>

                            ${escapeHTML(status)}

                        </span>

                    </div>

                </div>


                <!-- =====================================
                     PERSONAL INFORMATION
                ====================================== -->

                <div class="user-details-section">

                    <h4>

                        <i class="fa-solid fa-address-card"></i>

                        Personal Information

                    </h4>


                    <div class="user-details-grid">

                        <div>

                            <span>Name</span>

                            <strong>
                                ${escapeHTML(name)}
                            </strong>

                        </div>


                        <div>

                            <span>Email</span>

                            <strong>
                                ${escapeHTML(email)}
                            </strong>

                        </div>


                        <div>

                            <span>Phone</span>

                            <strong>
                                ${escapeHTML(phone)}
                            </strong>

                        </div>


                        <div>

                            <span>UID</span>

                            <strong
                                title="${escapeHTML(uid)}"
                            >
                                ${escapeHTML(uid)}
                            </strong>

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     FINANCIAL SUMMARY
                ====================================== -->

                <div class="user-details-section">

                    <h4>

                        <i class="fa-solid fa-wallet"></i>

                        Financial Summary

                    </h4>


                    <div class="user-details-grid">

                        <div>

                            <span>Balance</span>

                            <strong>
                                ${escapeHTML(
                                    userMoney(balance)
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Total Deposits</span>

                            <strong>
                                ${escapeHTML(
                                    userMoney(deposits)
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Total Withdrawals</span>

                            <strong>
                                ${escapeHTML(
                                    userMoney(withdrawals)
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Referral Earnings</span>

                            <strong>
                                ${escapeHTML(
                                    userMoney(referral)
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Total Profits</span>

                            <strong>
                                ${escapeHTML(
                                    userMoney(profits)
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Transactions</span>

                            <strong>
                                ${transactions.toLocaleString(
                                    "en-US"
                                )}
                            </strong>

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     VIP INFORMATION
                ====================================== -->

                <div class="user-details-section">

                    <h4>

                        <i class="fa-solid fa-crown"></i>

                        VIP Information

                    </h4>


                    <div class="user-details-grid">

                        <div>

                            <span>VIP Plans</span>

                            <strong>
                                ${vipCount.toLocaleString(
                                    "en-US"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Referral Code</span>

                            <strong>
                                ${escapeHTML(
                                    user.referralCode ||
                                    "N/A"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Referred By</span>

                            <strong>
                                ${escapeHTML(
                                    user.referredBy ||
                                    "None"
                                )}
                            </strong>

                        </div>


                        <div>

                            <span>Account Status</span>

                            <strong>
                                ${escapeHTML(status)}
                            </strong>

                        </div>

                    </div>

                </div>


                <!-- =====================================
                     ACCOUNT DATA
                ====================================== -->

                <div class="user-details-section">

                    <h4>

                        <i class="fa-solid fa-database"></i>

                        Account Data

                    </h4>


                    <div class="user-details-json">

                        <pre>${escapeHTML(
                            JSON.stringify(
                                user,
                                null,
                                2
                            )
                        )}</pre>

                    </div>

                </div>

            </div>


            <!-- =========================================
                 FOOTER
            ========================================== -->

            <div class="admin-modal-footer">

                <button
                    type="button"
                    class="admin-modal-secondary"
                    id="closeUserDetailsFooter"
                >

                    <i class="fa-solid fa-xmark"></i>

                    Close

                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* =====================================================
       CLOSE MODAL
    ===================================================== */

    const closeModal = () => {

        modal.remove();

        document.removeEventListener(
            "keydown",
            escapeHandler
        );

    };


    /* =====================================================
       ESCAPE HANDLER
    ===================================================== */

    const escapeHandler =
        event => {

            if (
                event.key === "Escape"
            ) {

                closeModal();

            }

        };


    /* =====================================================
       CLOSE BUTTON
    ===================================================== */

    document
        .getElementById(
            "closeUserDetailsModal"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .getElementById(
            "closeUserDetailsFooter"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    /* =====================================================
       CLICK OUTSIDE
    ===================================================== */

    modal.addEventListener(
        "click",
        event => {

            if (
                event.target === modal
            ) {

                closeModal();

            }

        }
    );


    /* =====================================================
       ESCAPE
    ===================================================== */

    document.addEventListener(
        "keydown",
        escapeHandler
    );

}


/* =========================================================
   REFRESH USERS
========================================================= */

function refreshUsers() {

    renderUsers();

    showToast(
        "Users list refreshed.",
        "success"
    );
}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadUsers =
    loadUsers;

window.renderUsers =
    renderUsers;

window.setupUserSearch =
    setupUserSearch;

window.openUserDetails =
    openUserDetails;

window.refreshUsers =
    refreshUsers;


console.log(
    "Money Vault Admin Part 10 loaded — Users List Ready."
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 11
   TRANSACTIONS MANAGEMENT
   CURRENCY: RWF / FRW
========================================================= */

let allTransactions = [];
let transactionUsers = {};
let transactionListenersStarted = false;


/* =========================================================
   SAFE HELPERS
========================================================= */

function transactionValue(value) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}


function transactionMoney(value) {

    return formatMoney(
        transactionValue(value)
    );
}


function transactionDate(value) {

    const timestamp =
        transactionValue(value);

    if (!timestamp) {
        return "N/A";
    }

    return formatDate(timestamp);
}


function transactionStatus(transaction) {

    return String(
        transaction?.status ||
        "unknown"
    )
        .trim()
        .toLowerCase();
}


function transactionType(transaction) {

    return String(
        transaction?.type ||
        transaction?.transactionType ||
        "Transaction"
    )
        .trim();
}


/* =========================================================
   USER HELPERS
========================================================= */

function getTransactionUserName(user) {

    return (
        user?.name ||
        user?.fullName ||
        user?.displayName ||
        user?.username ||
        "Unknown User"
    );
}


function getTransactionUserEmail(user) {

    return (
        user?.email ||
        "No email"
    );
}


function getTransactionUserPhone(user) {

    return (
        user?.phone ||
        user?.phoneNumber ||
        "N/A"
    );
}


function getTransactionUserPhoto(user) {

    return (
        user?.photoURL ||
        user?.photoUrl ||
        user?.profilePhoto ||
        user?.photo ||
        ""
    );
}


/* =========================================================
   TRANSACTION ICON
========================================================= */

function getTransactionIcon(type) {

    const value =
        String(type || "")
            .toLowerCase();


    if (
        value.includes("deposit")
    ) {
        return "fa-arrow-down";
    }


    if (
        value.includes("withdraw")
    ) {
        return "fa-arrow-up";
    }


    if (
        value.includes("vip")
    ) {
        return "fa-crown";
    }


    if (
        value.includes("profit")
    ) {
        return "fa-chart-line";
    }


    if (
        value.includes("referral")
    ) {
        return "fa-user-group";
    }


    if (
        value.includes("bonus")
    ) {
        return "fa-gift";
    }


    return "fa-money-bill-transfer";
}


/* =========================================================
   TRANSACTION TYPE CLASS
========================================================= */

function getTransactionTypeClass(type) {

    const value =
        String(type || "")
            .toLowerCase();


    if (
        value.includes("deposit")
    ) {
        return "deposit";
    }


    if (
        value.includes("withdraw")
    ) {
        return "withdraw";
    }


    if (
        value.includes("vip")
    ) {
        return "vip";
    }


    if (
        value.includes("profit")
    ) {
        return "profit";
    }


    if (
        value.includes("referral")
    ) {
        return "referral";
    }


    if (
        value.includes("bonus")
    ) {
        return "bonus";
    }


    return "default";
}


/* =========================================================
   STATUS CLASS
========================================================= */

function getTransactionStatusClass(status) {

    const value =
        String(status || "")
            .toLowerCase();


    if (
        value === "approved" ||
        value === "completed" ||
        value === "success" ||
        value === "successful"
    ) {
        return "approved";
    }


    if (
        value === "pending" ||
        value === "processing"
    ) {
        return "pending";
    }


    if (
        value === "rejected" ||
        value === "failed" ||
        value === "cancelled" ||
        value === "canceled"
    ) {
        return "rejected";
    }


    if (
        value === "processing_error"
    ) {
        return "error";
    }


    return "unknown";
}


/* =========================================================
   FRIENDLY STATUS
========================================================= */

function getTransactionStatusLabel(status) {

    const value =
        String(status || "")
            .trim()
            .toLowerCase();


    if (
        value === "approved" ||
        value === "completed" ||
        value === "success" ||
        value === "successful"
    ) {
        return "Approved";
    }


    if (
        value === "pending"
    ) {
        return "Pending";
    }


    if (
        value === "processing"
    ) {
        return "Processing";
    }


    if (
        value === "rejected"
    ) {
        return "Rejected";
    }


    if (
        value === "failed"
    ) {
        return "Failed";
    }


    if (
        value === "processing_error"
    ) {
        return "Processing Error";
    }


    if (
        value === "cancelled" ||
        value === "canceled"
    ) {
        return "Cancelled";
    }


    return "Unknown";
}


/* =========================================================
   TRANSACTION AMOUNT
========================================================= */

function getTransactionAmount(transaction) {

    return transactionValue(

        transaction?.amount ??
        transaction?.value ??
        transaction?.money

    );
}


/* =========================================================
   TRANSACTION TIMESTAMP
========================================================= */

function getTransactionTimestamp(transaction) {

    return transactionValue(

        transaction?.createdAt ??
        transaction?.timestamp ??
        transaction?.date ??
        transaction?.approvedAt ??
        transaction?.requestedAt ??
        transaction?.rejectedAt

    );
}


/* =========================================================
   TRANSACTION SEARCH TEXT
========================================================= */

function getTransactionSearchText(
    transaction,
    user
) {

    return [

        transaction?.id,

        transaction?.uid,

        transaction?.type,

        transaction?.transactionType,

        transaction?.status,

        transaction?.amount,

        transaction?.vipName,

        transaction?.requestId,

        transaction?.transactionId,

        transaction?.paymentMethod,

        transaction?.phone,

        transaction?.account,

        transaction?.accountNumber,

        transaction?.method,

        transaction?.adminId,

        transaction?.approvedBy,

        getTransactionUserName(user),

        getTransactionUserEmail(user),

        getTransactionUserPhone(user)

    ]
        .filter(
            value =>
                value !== undefined &&
                value !== null
        )
        .join(" ")
        .toLowerCase();
}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

async function loadTransactions() {

    await window.waitForAdmin();


    if (
        transactionListenersStarted
    ) {

        setupTransactionSearch();

        renderTransactions();

        return;
    }


    transactionListenersStarted =
        true;


    /* =====================================================
       USERS
    ===================================================== */

    if (
        !listeners.transactionUsers
    ) {

        listeners.transactionUsers =
            onValue(

                ref(
                    db,
                    "users"
                ),

                snapshot => {

                    transactionUsers =
                        snapshot.exists()
                            ? snapshot.val() || {}
                            : {};


                    renderTransactions();

                },

                error => {

                    console.error(
                        "Transaction users listener error:",
                        error
                    );

                    showToast(
                        "Failed to load transaction users.",
                        "error"
                    );

                }

            );

    }


    /* =====================================================
       TRANSACTIONS
    ===================================================== */

    if (
        !listeners.transactionsManagement
    ) {

        listeners.transactionsManagement =
            onValue(

                ref(
                    db,
                    "transactions"
                ),

                snapshot => {

                    const data =
                        snapshot.exists()
                            ? snapshot.val() || {}
                            : {};


                    allTransactions =
                        Object.entries(
                            data
                        ).map(
                            ([id, transaction]) => ({

                                id,

                                ...(transaction || {})

                            })
                        );


                    /* -------------------------------------
                       NEWEST FIRST
                    -------------------------------------- */

                    allTransactions.sort(
                        (a, b) => {

                            return (
                                getTransactionTimestamp(b) -
                                getTransactionTimestamp(a)
                            );

                        }
                    );


                    renderTransactions();

                },

                error => {

                    console.error(
                        "Transactions listener error:",
                        error
                    );

                    showToast(
                        "Failed to load transactions.",
                        "error"
                    );

                }

            );

    }


    setupTransactionSearch();

    renderTransactions();

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions() {

    const list =
        document.getElementById(
            "transactionList"
        );


    const empty =
        document.getElementById(
            "emptyTransaction"
        );


    if (!list) {
        return;
    }


    /* =====================================================
       SEARCH
    ===================================================== */

    const searchInput =
        document.getElementById(
            "transactionSearch"
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

    const filterElement =
        document.getElementById(
            "transactionFilter"
        );


    const filter =
        String(
            filterElement?.value || "all"
        )
            .trim()
            .toLowerCase();


    /* =====================================================
       FILTER DATA
    ===================================================== */

    const filtered =
        allTransactions.filter(
            transaction => {

                const type =
                    transactionType(
                        transaction
                    ).toLowerCase();


                const status =
                    transactionStatus(
                        transaction
                    );


                /* -----------------------------------------
                   FILTER
                ----------------------------------------- */

                if (
                    filter !== "all"
                ) {

                    const matchesType =
                        type === filter ||
                        type.includes(
                            filter
                        );


                    const matchesStatus =
                        status === filter;


                    if (
                        !matchesType &&
                        !matchesStatus
                    ) {

                        return false;

                    }

                }


                /* -----------------------------------------
                   USER
                ----------------------------------------- */

                const user =
                    transactionUsers[
                        transaction.uid
                    ] || {};


                /* -----------------------------------------
                   SEARCH
                ----------------------------------------- */

                const searchable =
                    getTransactionSearchText(
                        transaction,
                        user
                    );


                return (
                    !search ||
                    searchable.includes(
                        search
                    )
                );

            }
        );


    /* =====================================================
       LIST COUNT
    ===================================================== */

    const listCount =
        document.getElementById(
            "transactionListCount"
        );


    if (listCount) {

        listCount.textContent =
            `${filtered.length} transaction${
                filtered.length === 1
                    ? ""
                    : "s"
            }`;

    }


    /* =====================================================
       EMPTY STATE
    ===================================================== */

    if (
        !filtered.length
    ) {

        list.innerHTML =
            "";


        if (empty) {

            empty.style.display =
                "block";


            empty.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-receipt"></i>

                    <h3>

                        ${
                            allTransactions.length
                                ? "No Transactions Found"
                                : "No Transactions Yet"
                        }

                    </h3>

                    <p>

                        ${
                            allTransactions.length
                                ? "No transactions match your search or filter."
                                : "There are currently no transactions."
                        }

                    </p>

                </div>

            `;

        }


        return;
    }


    if (empty) {

        empty.style.display =
            "none";

    }


    /* =====================================================
       RENDER LIST
    ===================================================== */

    list.innerHTML =
        filtered
            .map(
                transaction => {

                    const user =
                        transactionUsers[
                            transaction.uid
                        ] || {};


                    return renderTransactionCard(
                        transaction,
                        user
                    );

                }
            )
            .join("");

}


/* =========================================================
   TRANSACTION CARD
========================================================= */

function renderTransactionCard(
    transaction,
    user
) {

    const type =
        transactionType(
            transaction
        );


    const status =
        transactionStatus(
            transaction
        );


    const amount =
        getTransactionAmount(
            transaction
        );


    const timestamp =
        getTransactionTimestamp(
            transaction
        );


    const userName =
        getTransactionUserName(
            user
        );


    const email =
        getTransactionUserEmail(
            user
        );


    const phone =
        getTransactionUserPhone(
            user
        );


    const photo =
        getTransactionUserPhoto(
            user
        );


    const icon =
        getTransactionIcon(
            type
        );


    const typeClass =
        getTransactionTypeClass(
            type
        );


    const statusClass =
        getTransactionStatusClass(
            status
        );


    const statusLabel =
        getTransactionStatusLabel(
            status
        );


    /* =====================================================
       AMOUNT DIRECTION
    ===================================================== */

    const typeLower =
        type.toLowerCase();


    const isOutgoing =
        typeLower.includes(
            "withdraw"
        );


    const isIncoming =
        typeLower.includes(
            "deposit"
        ) ||
        typeLower.includes(
            "profit"
        ) ||
        typeLower.includes(
            "bonus"
        ) ||
        typeLower.includes(
            "referral"
        );


    const amountPrefix =
        isOutgoing
            ? "-"
            : isIncoming
                ? "+"
                : "";


    /* =====================================================
       USER AVATAR
    ===================================================== */

    let avatar = `

        <div class="transaction-user-avatar">

            <i class="fa-solid fa-user"></i>

        </div>

    `;


    if (photo) {

        avatar = `

            <div class="transaction-user-avatar">

                <img
                    src="${escapeHTML(photo)}"
                    alt="${escapeHTML(userName)}"
                    loading="lazy"
                    onerror="
                        this.style.display='none';
                        this.parentElement.classList.add('avatar-error');
                    "
                >

            </div>

        `;

    }


    /* =====================================================
       EXTRA INFORMATION
    ===================================================== */

    let extraInfo = "";


    if (
        transaction.vipName
    ) {

        extraInfo += `

            <span>

                <i class="fa-solid fa-crown"></i>

                ${escapeHTML(
                    transaction.vipName
                )}

            </span>

        `;

    }


    if (
        transaction.paymentMethod
    ) {

        extraInfo += `

            <span>

                <i class="fa-solid fa-credit-card"></i>

                ${escapeHTML(
                    transaction.paymentMethod
                )}

            </span>

        `;

    }


    if (
        transaction.method &&
        !transaction.paymentMethod
    ) {

        extraInfo += `

            <span>

                <i class="fa-solid fa-credit-card"></i>

                ${escapeHTML(
                    transaction.method
                )}

            </span>

        `;

    }


    if (
        transaction.requestId
    ) {

        extraInfo += `

            <span>

                <i class="fa-solid fa-link"></i>

                Request:
                ${escapeHTML(
                    transaction.requestId
                )}

            </span>

        `;

    }


    if (
        transaction.transactionId
    ) {

        extraInfo += `

            <span>

                <i class="fa-solid fa-hashtag"></i>

                Ref:
                ${escapeHTML(
                    transaction.transactionId
                )}

            </span>

        `;

    }


    /* =====================================================
       REJECTION REASON
    ===================================================== */

    let rejectionInfo = "";


    if (
        transaction.rejectionReason
    ) {

        rejectionInfo = `

            <div class="transaction-reason">

                <i class="fa-solid fa-circle-exclamation"></i>

                <span>

                    ${escapeHTML(
                        transaction.rejectionReason
                    )}

                </span>

            </div>

        `;

    }


    /* =====================================================
       CARD
    ===================================================== */

    return `

        <article
            class="transaction-card"
            data-id="${escapeHTML(
                transaction.id
            )}"
        >

            <!-- =========================================
                 TOP
            ========================================== -->

            <div class="transaction-card-header">


                <div class="transaction-main">


                    <div
                        class="
                            transaction-icon
                            type-${escapeHTML(
                                typeClass
                            )}
                        "
                    >

                        <i
                            class="
                                fa-solid
                                ${escapeHTML(icon)}
                            "
                        ></i>

                    </div>


                    <div class="transaction-title-area">

                        <h3>

                            ${escapeHTML(
                                type
                            )}

                        </h3>


                        <p>

                            <i class="fa-solid fa-user"></i>

                            ${escapeHTML(
                                userName
                            )}

                        </p>

                    </div>

                </div>


                <div
                    class="
                        transaction-status
                        status-${escapeHTML(
                            statusClass
                        )}
                    "
                >

                    <i
                        class="
                            fa-solid
                            ${
                                statusClass === "approved"
                                    ? "fa-circle-check"
                                    : statusClass === "pending"
                                        ? "fa-clock"
                                        : statusClass === "rejected"
                                            ? "fa-circle-xmark"
                                            : "fa-circle-exclamation"
                            }
                        "
                    ></i>

                    ${escapeHTML(
                        statusLabel
                    )}

                </div>

            </div>


            <!-- =========================================
                 AMOUNT
            ========================================== -->

            <div
                class="
                    transaction-amount-box
                    ${
                        isOutgoing
                            ? "outgoing"
                            : isIncoming
                                ? "incoming"
                                : ""
                    }
                "
            >

                <div>

                    <span>

                        <i class="fa-solid fa-wallet"></i>

                        Amount

                    </span>

                </div>


                <strong
                    class="
                        transaction-amount
                        ${
                            isOutgoing
                                ? "amount-out"
                                : isIncoming
                                    ? "amount-in"
                                    : ""
                        }
                    "
                >

                    ${amountPrefix}

                    ${escapeHTML(
                        transactionMoney(
                            amount
                        )
                    )}

                </strong>

            </div>


            <!-- =========================================
                 USER INFORMATION
            ========================================== -->

            <div class="transaction-user-info">


                <div>

                    <span>

                        <i class="fa-solid fa-envelope"></i>

                        Email

                    </span>


                    <strong>

                        ${escapeHTML(
                            email
                        )}

                    </strong>

                </div>


                <div>

                    <span>

                        <i class="fa-solid fa-phone"></i>

                        Phone

                    </span>


                    <strong>

                        ${escapeHTML(
                            phone
                        )}

                    </strong>

                </div>

            </div>


            <!-- =========================================
                 EXTRA
            ========================================== -->

            ${
                extraInfo

                    ? `

                        <div
                            class="
                                transaction-extra
                            "
                        >

                            ${extraInfo}

                        </div>

                    `

                    : ""
            }


            <!-- =========================================
                 REJECTION REASON
            ========================================== -->

            ${rejectionInfo}


            <!-- =========================================
                 DATE
            ========================================== -->

            <div class="transaction-meta">


                <span>

                    <i
                        class="
                            fa-solid
                            fa-calendar
                        "
                    ></i>

                    ${escapeHTML(
                        transactionDate(
                            timestamp
                        )
                    )}

                </span>


                <span
                    title="${escapeHTML(
                        transaction.id
                    )}"
                >

                    <i
                        class="
                            fa-solid
                            fa-receipt
                        "
                    ></i>

                    ID:
                    ${escapeHTML(
                        transaction.id
                    )}

                </span>

            </div>


            <!-- =========================================
                 UID
            ========================================== -->

            <div
                class="transaction-uid"
                title="${escapeHTML(
                    transaction.uid ||
                    "N/A"
                )}"
            >

                <i
                    class="
                        fa-solid
                        fa-fingerprint
                    "
                ></i>

                UID:

                ${escapeHTML(
                    transaction.uid ||
                    "N/A"
                )}

            </div>

        </article>

    `;
}


/* =========================================================
   SEARCH + FILTER
========================================================= */

function setupTransactionSearch() {

    const search =
        document.getElementById(
            "transactionSearch"
        );


    const filter =
        document.getElementById(
            "transactionFilter"
        );


    /* =====================================================
       SEARCH
    ===================================================== */

    if (
        search &&
        search.dataset.bound !== "true"
    ) {

        search.dataset.bound =
            "true";


        search.addEventListener(
            "input",
            () => {

                renderTransactions();

            }
        );

    }


    /* =====================================================
       FILTER
    ===================================================== */

    if (
        filter &&
        filter.dataset.bound !== "true"
    ) {

        filter.dataset.bound =
            "true";


        filter.addEventListener(
            "change",
            () => {

                renderTransactions();

            }
        );

    }

}


/* =========================================================
   REFRESH TRANSACTIONS
========================================================= */

function refreshTransactions() {

    renderTransactions();

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.loadTransactions =
    loadTransactions;


window.renderTransactions =
    renderTransactions;


window.setupTransactionSearch =
    setupTransactionSearch;


window.refreshTransactions =
    refreshTransactions;


console.log(
    "Money Vault Admin Part 11 loaded — Transactions List Ready."
);
