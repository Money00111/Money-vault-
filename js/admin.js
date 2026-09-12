/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 1 — AUTH + ADMIN SECURITY + NAVIGATION

   CURRENCY: RWF / FRW

   FEATURES:
   - Firebase Admin Authentication
   - Admin verified through admins/{uid}
   - No hard-coded admin email
   - Sidebar navigation
   - Mobile sidebar
   - Dashboard Quick Actions
   - Page navigation
   - Logout
   - Loading screen
   - Compatible with admin.html
========================================================= */


/* =========================================================
   FIREBASE IMPORTS
========================================================= */

import {
    auth,
    db
} from "./firebase.js";


import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


import {
    ref,
    get,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   ADMIN STATE
========================================================= */

let currentAdmin = null;

let adminReady = false;

let adminReadyResolve;
let adminReadyReject;


/* =========================================================
   CENTRAL ADMIN READY PROMISE
========================================================= */

const adminReadyPromise =
    new Promise(
        (resolve, reject) => {

            adminReadyResolve = resolve;
            adminReadyReject = reject;

        }
    );


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loadingScreen =
    document.getElementById("loadingScreen");

const sidebar =
    document.getElementById("sidebar");

const menuBtn =
    document.getElementById("menuBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const adminName =
    document.getElementById("adminName");

const adminEmail =
    document.getElementById("adminEmail");


/* =========================================================
   PAGE MAP
   IMPORTANT:
   THESE IDs MUST MATCH admin.html EXACTLY
========================================================= */

const sectionMap = {

    dashboard:
        "dashboardSection",

    deposits:
        "depositsSection",

    withdraws:
        "withdrawsSection",

    vipRequests:
        "vipRequestsSection",

    vipBuyers:
        "vipBuyersSection",

    bonusRequests:
        "bonusRequestsSection",

    users:
        "usersSection",

    transactions:
        "transactionsSection",

    quickActions:
        "quickActionsSection",

    settings:
        "settingsSection"

};


/* =========================================================
   PAGE SECTIONS
========================================================= */

const pageSections =
    document.querySelectorAll(".page-section");


/* =========================================================
   SIDEBAR MENU LINKS
========================================================= */

const menuLinks =
    document.querySelectorAll(".menu-link");


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

async function waitForAdmin() {

    if (
        adminReady &&
        currentAdmin
    ) {

        return currentAdmin;

    }

    return await adminReadyPromise;

}


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(pageName) {

    /*
     * Normalize page name
     */

    if (
        typeof pageName !== "string"
    ) {

        return;

    }


    pageName =
        pageName.trim();


    /*
     * Find section ID
     */

    const sectionId =
        sectionMap[pageName];


    if (!sectionId) {

        console.warn(
            "Money Vault: Unknown admin page:",
            pageName
        );

        return;

    }


    /*
     * Find target section
     */

    const targetSection =
        document.getElementById(
            sectionId
        );


    if (!targetSection) {

        console.error(
            "Money Vault: Section NOT found:",
            sectionId,
            "for page:",
            pageName
        );

        return;

    }


    /* -----------------------------------------------------
       HIDE ALL PAGE SECTIONS
    ----------------------------------------------------- */

    pageSections.forEach(
        section => {

            section.classList.remove(
                "active"
            );

            section.style.display =
                "none";

        }
    );


    /* -----------------------------------------------------
       SHOW TARGET SECTION
    ----------------------------------------------------- */

    targetSection.classList.add(
        "active"
    );

    targetSection.style.display =
        "block";


    /* -----------------------------------------------------
       UPDATE SIDEBAR ACTIVE ITEM
    ----------------------------------------------------- */

    menuLinks.forEach(
        link => {

            link.classList.remove(
                "active"
            );


            const linkPage =
                link.dataset.page;


            if (
                linkPage === pageName
            ) {

                link.classList.add(
                    "active"
                );

            }

        }
    );


    /* -----------------------------------------------------
       CLOSE MOBILE SIDEBAR
    ----------------------------------------------------- */

    if (sidebar) {

        sidebar.classList.remove(
            "active"
        );

    }


    /* -----------------------------------------------------
       UPDATE PAGE TITLE
    ----------------------------------------------------- */

    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    if (pageTitle) {

        const titles = {

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


        pageTitle.textContent =
            titles[pageName] ||
            "Money Vault Admin";

    }


    /* -----------------------------------------------------
       UPDATE URL HASH
    ----------------------------------------------------- */

    try {

        history.replaceState(
            null,
            "",
            "#" + pageName
        );

    }

    catch (error) {

        console.warn(
            "Could not update URL hash:",
            error
        );

    }


    /* -----------------------------------------------------
       NOTIFY OTHER ADMIN PARTS
    ----------------------------------------------------- */

    document.dispatchEvent(
        new CustomEvent(
            "moneyVaultPageChanged",
            {
                detail: {
                    page: pageName
                }
            }
        )
    );


    console.log(
        "Money Vault page opened:",
        pageName
    );

}


/* =========================================================
   SIDEBAR NAVIGATION
========================================================= */

menuLinks.forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();


                const page =
                    link.dataset.page;


                if (!page) {

                    console.warn(
                        "Menu link has no data-page:",
                        link
                    );

                    return;

                }


                openPage(page);

            }
        );

    }
);


/* =========================================================
   QUICK ACTION HELPER
========================================================= */

function bindQuickAction(
    elementId,
    pageName
) {

    const element =
        document.getElementById(
            elementId
        );


    /*
     * Button does not exist.
     * This is NOT an error because some buttons
     * are optional.
     */

    if (!element) {

        console.log(
            "Quick Action not found:",
            elementId
        );

        return;

    }


    /*
     * Prevent duplicate listener
     */

    if (
        element.dataset.quickActionBound ===
        "true"
    ) {

        return;

    }


    element.dataset.quickActionBound =
        "true";


    element.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();


            console.log(
                "Quick Action clicked:",
                elementId,
                "=>",
                pageName
            );


            openPage(
                pageName
            );

        }
    );

}


/* =========================================================
   DASHBOARD QUICK ACTIONS
========================================================= */

bindQuickAction(
    "openDeposits",
    "deposits"
);


bindQuickAction(
    "openWithdraws",
    "withdraws"
);


bindQuickAction(
    "openUsers",
    "users"
);


bindQuickAction(
    "openTransactions",
    "transactions"
);


bindQuickAction(
    "openSettings",
    "settings"
);


bindQuickAction(
    "openVipRequests",
    "vipRequests"
);


/* =========================================================
   QUICK ACTIONS PAGE BUTTONS
========================================================= */

bindQuickAction(
    "openUsersBtn",
    "users"
);


bindQuickAction(
    "openTransactionsBtn",
    "transactions"
);


bindQuickAction(
    "openSettingsBtn",
    "settings"
);


/*
 * Optional buttons.
 * If they exist in HTML they will work.
 */

bindQuickAction(
    "openDepositsBtn",
    "deposits"
);


bindQuickAction(
    "openWithdrawsBtn",
    "withdraws"
);


bindQuickAction(
    "openVipRequestsBtn",
    "vipRequests"
);


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

if (menuBtn) {

    menuBtn.addEventListener(
        "click",
        event => {

            event.preventDefault();
            event.stopPropagation();


            if (!sidebar) {

                return;

            }


            sidebar.classList.toggle(
                "active"
            );

        }
    );

}


/* =========================================================
   CLOSE MOBILE SIDEBAR
   WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    event => {

        if (!sidebar) {

            return;

        }


        if (
            !sidebar.classList.contains(
                "active"
            )
        ) {

            return;

        }


        const clickedInsideSidebar =
            sidebar.contains(
                event.target
            );


        const clickedMenuButton =
            menuBtn &&
            menuBtn.contains(
                event.target
            );


        if (
            !clickedInsideSidebar &&
            !clickedMenuButton
        ) {

            sidebar.classList.remove(
                "active"
            );

        }

    }
);


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

onAuthStateChanged(
    auth,
    async user => {

        /*
         * USER NOT LOGGED IN
         */

        if (!user) {

            currentAdmin = null;

            adminReady = false;


            if (loadingScreen) {

                loadingScreen.style.display =
                    "flex";

            }


            window.location.href =
                "login.html";


            return;

        }


        try {

            /*
             * CHECK admins/{uid}
             */

            const adminRef =
                ref(
                    db,
                    "admins/" + user.uid
                );


            const adminSnapshot =
                await get(
                    adminRef
                );


            /*
             * NOT ADMIN
             */

            if (
                !adminSnapshot.exists()
            ) {

                console.error(
                    "Admin access denied:",
                    user.uid
                );


                alert(
                    "Access Denied. You are not an administrator."
                );


                await signOut(
                    auth
                );


                window.location.href =
                    "dashboard.html";


                return;

            }


            /*
             * SAVE ADMIN
             */

            currentAdmin =
                user;


            adminReady =
                true;


            /*
             * ADMIN DATA
             */

            const adminData =
                adminSnapshot.val() || {};


            /*
             * ADMIN NAME
             */

            if (adminName) {

                adminName.textContent =
                    adminData.name ||
                    user.displayName ||
                    "Administrator";

            }


            /*
             * ADMIN EMAIL
             *
             * This is only for ADMIN PANEL.
             */

            if (adminEmail) {

                adminEmail.textContent =
                    user.email ||
                    "";

            }


            /*
             * UPDATE GLOBAL ADMIN IMMEDIATELY
             */

            window.currentAdmin =
                currentAdmin;


            /*
             * HIDE LOADING
             */

            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";

            }


            /*
             * RESOLVE ADMIN READY
             */

            adminReadyResolve(
                currentAdmin
            );


            console.log(
                "======================================"
            );

            console.log(
                "MONEY VAULT ADMIN AUTHENTICATED"
            );

            console.log(
                "UID:",
                user.uid
            );

            console.log(
                "======================================"
            );


            /*
             * START PART 2
             */

            if (
                typeof window.startAdminPart2 ===
                "function"
            ) {

                window.startAdminPart2();

            }


            /*
             * Make sure dashboard is visible
             */

            initializeInitialPage();

        }

        catch (error) {

            console.error(
                "Admin authentication error:",
                error
            );


            adminReady =
                false;


            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";

            }


            alert(
                "Admin authentication failed."
            );


            try {

                await signOut(
                    auth
                );

            }

            catch (signOutError) {

                console.error(
                    "Sign out error:",
                    signOutError
                );

            }


            window.location.href =
                "login.html";

        }

    }
);


/* =========================================================
   LOGOUT
========================================================= */

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async event => {

            event.preventDefault();


            const confirmed =
                confirm(
                    "Logout from Money Vault Admin Panel?"
                );


            if (!confirmed) {

                return;

            }


            try {

                await signOut(
                    auth
                );


                window.location.href =
                    "login.html";

            }

            catch (error) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    error.message ||
                    "Logout failed."
                );

            }

        }
    );

}


/* =========================================================
   INITIAL PAGE
========================================================= */

function initializeInitialPage() {

    let page =
        "dashboard";


    const hash =
        window.location.hash
            .replace(
                "#",
                ""
            )
            .trim();


    if (
        hash &&
        sectionMap[hash]
    ) {

        page =
            hash;

    }


    openPage(
        page
    );

}


/* =========================================================
   PAGE ANIMATION
========================================================= */

window.addEventListener(
    "load",
    () => {

        document.body.style.opacity =
            "0";


        setTimeout(
            () => {

                document.body.style.transition =
                    "opacity .4s";


                document.body.style.opacity =
                    "1";

            },
            100
        );

    }
);


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.currentAdmin =
    currentAdmin;


window.waitForAdmin =
    waitForAdmin;


window.openPage =
    openPage;


window.bindQuickAction =
    bindQuickAction;


window.sectionMap =
    sectionMap;


/* =========================================================
   KEEP GLOBAL ADMIN UPDATED
========================================================= */

const adminStateInterval =
    setInterval(
        () => {

            if (
                currentAdmin &&
                window.currentAdmin !==
                currentAdmin
            ) {

                window.currentAdmin =
                    currentAdmin;

            }


            if (adminReady) {

                clearInterval(
                    adminStateInterval
                );

            }

        },
        250
    );


/* =========================================================
   INITIALIZE
========================================================= */

initializeInitialPage();


/* =========================================================
   PART 1 READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 1 Loaded"
);

console.log(
    "Admin Authentication: READY"
);

console.log(
    "Navigation: READY"
);

console.log(
    "Quick Actions: READY"
);

console.log(
    "Mobile Sidebar: READY"
);

console.log(
    "======================================"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 2 — DASHBOARD STATISTICS

   CURRENCY: RWF / FRW

   RESPONSIBILITIES:
   - Total users
   - Deposit statistics
   - Withdraw statistics
   - System balance
   - Live Firebase listeners

   IMPORTANT:
   - NO IMPORTS HERE
   - Part 1 already imports Firebase functions
   - NO user rendering here
   - NO deposit approval here
   - NO withdraw approval here
========================================================= */


/* =========================================================
   PART 2 STATE
========================================================= */

let part2AllUsersData = {};

let part2AllDepositsData = {};

let part2AllWithdrawsData = {};

let part2UsersListenerStarted = false;

let part2DepositsListenerStarted = false;

let part2WithdrawsListenerStarted = false;

let part2Started = false;


/* =========================================================
   DASHBOARD DOM ELEMENTS
========================================================= */

const part2TotalUsersEl =
    document.getElementById(
        "totalUsers"
    );


const part2TotalDepositsEl =
    document.getElementById(
        "dashboardTotalDeposits"
    );


const part2PendingDepositsEl =
    document.getElementById(
        "dashboardPendingDeposits"
    );


const part2ApprovedDepositsEl =
    document.getElementById(
        "dashboardApprovedDeposits"
    );


const part2TotalWithdrawsEl =
    document.getElementById(
        "dashboardTotalWithdraws"
    );


const part2SystemBalanceEl =
    document.getElementById(
        "systemBalance"
    );


/* =========================================================
   RWF MONEY FORMAT
========================================================= */

function moneyRWFPart2(
    value
) {

    const amount =
        Number(
            value || 0
        );


    if (
        !Number.isFinite(
            amount
        )
    ) {

        return "0 RWF";

    }


    return (
        amount.toLocaleString(
            "en-RW",
            {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2
            }
        )
        +
        " RWF"
    );

}


/* =========================================================
   STATUS NORMALIZER
========================================================= */

function normalizeStatusPart2(
    status
) {

    return String(
        status ||
        "pending"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   SAFE OBJECT CONVERTER
========================================================= */

function safeObjectPart2(
    value
) {

    if (
        !value ||
        typeof value !== "object"
    ) {

        return {};

    }


    return value;

}


/* =========================================================
   UPDATE TOTAL USERS
========================================================= */

function updateUserCountPart2() {

    const users =
        Object.values(
            part2AllUsersData
        );


    const total =
        users.length;


    if (
        part2TotalUsersEl
    ) {

        part2TotalUsersEl.textContent =
            total.toLocaleString(
                "en-RW"
            );

    }


    /*
     * Also update system balance.
     */

    updateSystemBalancePart2();

}


/* =========================================================
   UPDATE SYSTEM BALANCE
========================================================= */

function updateSystemBalancePart2() {

    const users =
        Object.values(
            part2AllUsersData
        );


    let balance =
        0;


    users.forEach(
        user => {

            if (
                !user ||
                typeof user !== "object"
            ) {

                return;

            }


            const userBalance =
                Number(
                    user.balance || 0
                );


            if (
                Number.isFinite(
                    userBalance
                )
            ) {

                balance +=
                    userBalance;

            }

        }
    );


    if (
        part2SystemBalanceEl
    ) {

        part2SystemBalanceEl.textContent =
            moneyRWFPart2(
                balance
            );

    }

}


/* =========================================================
   UPDATE DEPOSIT STATISTICS
========================================================= */

function updateDepositStatsPart2() {

    const deposits =
        Object.values(
            part2AllDepositsData
        );


    let pending =
        0;


    let approved =
        0;


    let rejected =
        0;


    let approvedAmount =
        0;


    deposits.forEach(
        deposit => {

            if (
                !deposit ||
                typeof deposit !== "object"
            ) {

                return;

            }


            const status =
                normalizeStatusPart2(
                    deposit.status
                );


            const amount =
                Number(
                    deposit.amount || 0
                );


            switch (
                status
            ) {

                case "pending":

                    pending++;

                    break;


                case "approved":

                    approved++;

                    if (
                        Number.isFinite(
                            amount
                        )
                    ) {

                        approvedAmount +=
                            amount;

                    }

                    break;


                case "rejected":

                    rejected++;

                    break;

            }

        }
    );


    /*
     * Total deposit requests
     */

    if (
        part2TotalDepositsEl
    ) {

        part2TotalDepositsEl.textContent =
            deposits.length.toLocaleString(
                "en-RW"
            );

    }


    /*
     * Pending deposits
     */

    if (
        part2PendingDepositsEl
    ) {

        part2PendingDepositsEl.textContent =
            pending.toLocaleString(
                "en-RW"
            );

    }


    /*
     * Approved deposits
     */

    if (
        part2ApprovedDepositsEl
    ) {

        part2ApprovedDepositsEl.textContent =
            approved.toLocaleString(
                "en-RW"
            );

    }


    console.log(
        "Money Vault Deposit Stats:",
        {
            total: deposits.length,
            pending: pending,
            approved: approved,
            rejected: rejected,
            approvedAmount: approvedAmount
        }
    );

}


/* =========================================================
   UPDATE WITHDRAW STATISTICS
========================================================= */

function updateWithdrawStatsPart2() {

    const withdraws =
        Object.values(
            part2AllWithdrawsData
        );


    if (
        part2TotalWithdrawsEl
    ) {

        part2TotalWithdrawsEl.textContent =
            withdraws.length.toLocaleString(
                "en-RW"
            );

    }


    let pending =
        0;


    let approved =
        0;


    let rejected =
        0;


    withdraws.forEach(
        withdraw => {

            if (
                !withdraw ||
                typeof withdraw !== "object"
            ) {

                return;

            }


            const status =
                normalizeStatusPart2(
                    withdraw.status
                );


            switch (
                status
            ) {

                case "pending":

                    pending++;

                    break;


                case "approved":

                    approved++;

                    break;


                case "rejected":

                    rejected++;

                    break;

            }

        }
    );


    console.log(
        "Money Vault Withdraw Stats:",
        {
            total: withdraws.length,
            pending: pending,
            approved: approved,
            rejected: rejected
        }
    );

}


/* =========================================================
   FIREBASE — USERS LISTENER
========================================================= */

function initializeUsersDashboardListenerPart2() {

    if (
        part2UsersListenerStarted
    ) {

        return;

    }


    part2UsersListenerStarted =
        true;


    try {

        onValue(

            ref(
                db,
                "users"
            ),

            snapshot => {

                if (
                    snapshot.exists()
                ) {

                    part2AllUsersData =
                        safeObjectPart2(
                            snapshot.val()
                        );

                }

                else {

                    part2AllUsersData =
                        {};

                }


                updateUserCountPart2();

                updateSystemBalancePart2();


                console.log(
                    "Money Vault Users Listener Updated:",
                    Object.keys(
                        part2AllUsersData
                    ).length
                );

            },

            error => {

                console.error(
                    "Users listener error:",
                    error
                );

            }

        );

    }

    catch (error) {

        console.error(
            "Failed to start users listener:",
            error
        );

    }

}


/* =========================================================
   FIREBASE — DEPOSITS LISTENER
========================================================= */

function initializeDepositsDashboardListenerPart2() {

    if (
        part2DepositsListenerStarted
    ) {

        return;

    }


    part2DepositsListenerStarted =
        true;


    try {

        onValue(

            ref(
                db,
                "depositRequests"
            ),

            snapshot => {

                if (
                    snapshot.exists()
                ) {

                    part2AllDepositsData =
                        safeObjectPart2(
                            snapshot.val()
                        );

                }

                else {

                    part2AllDepositsData =
                        {};

                }


                updateDepositStatsPart2();


                console.log(
                    "Money Vault Deposits Listener Updated:",
                    Object.keys(
                        part2AllDepositsData
                    ).length
                );

            },

            error => {

                console.error(
                    "Deposits listener error:",
                    error
                );

            }

        );

    }

    catch (error) {

        console.error(
            "Failed to start deposits listener:",
            error
        );

    }

}


/* =========================================================
   FIREBASE — WITHDRAWS LISTENER
========================================================= */

function initializeWithdrawsDashboardListenerPart2() {

    if (
        part2WithdrawsListenerStarted
    ) {

        return;

    }


    part2WithdrawsListenerStarted =
        true;


    try {

        onValue(

            ref(
                db,
                "withdrawRequests"
            ),

            snapshot => {

                if (
                    snapshot.exists()
                ) {

                    part2AllWithdrawsData =
                        safeObjectPart2(
                            snapshot.val()
                        );

                }

                else {

                    part2AllWithdrawsData =
                        {};

                }


                updateWithdrawStatsPart2();


                console.log(
                    "Money Vault Withdraws Listener Updated:",
                    Object.keys(
                        part2AllWithdrawsData
                    ).length
                );

            },

            error => {

                console.error(
                    "Withdraws listener error:",
                    error
                );

            }

        );

    }

    catch (error) {

        console.error(
            "Failed to start withdraws listener:",
            error
        );

    }

}


/* =========================================================
   START PART 2
========================================================= */

function startAdminPart2() {

    if (
        part2Started
    ) {

        console.log(
            "Money Vault Part 2 already started."
        );

        return;

    }


    part2Started =
        true;


    console.log(
        "======================================"
    );


    console.log(
        "Money Vault Admin Part 2 Starting..."
    );


    console.log(
        "Dashboard Statistics: READY"
    );


    console.log(
        "======================================"
    );


    initializeUsersDashboardListenerPart2();

    initializeDepositsDashboardListenerPart2();

    initializeWithdrawsDashboardListenerPart2();

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

function refreshAdminDashboardPart2() {

    console.log(
        "Refreshing Money Vault Dashboard..."
    );


    updateUserCountPart2();

    updateSystemBalancePart2();

    updateDepositStatsPart2();

    updateWithdrawStatsPart2();

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.startAdminPart2 =
    startAdminPart2;


window.initializeAdminPart2 =
    startAdminPart2;


window.refreshAdminDashboardPart2 =
    refreshAdminDashboardPart2;


window.updateUserCountPart2 =
    updateUserCountPart2;


window.updateDepositStatsPart2 =
    updateDepositStatsPart2;


window.updateWithdrawStatsPart2 =
    updateWithdrawStatsPart2;


/* =========================================================
   PART 2 READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 2 Loaded"
);

console.log(
    "Dashboard Statistics: READY"
);

console.log(
    "Users Listener: READY"
);

console.log(
    "Deposits Listener: READY"
);

console.log(
    "Withdraws Listener: READY"
);

console.log(
    "======================================"
);


/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 3 — DEPOSIT REQUESTS

   CURRENCY: RWF / FRW

   FEATURES:
   - Live deposit requests
   - Search
   - Status filter
   - Counters
   - Approve
   - Reject
   - Atomic balance update
   - Atomic status update
   - Transaction record
   - ONE-TIME APPROVAL PROTECTION
   - Canonical status: pending / approved / rejected
   - No Cloud Functions
   - No Storage upload required
========================================================= */




/* =========================================================
   DEPOSIT STATE
========================================================= */

let depositData = {};


/* =========================================================
   DEPOSIT DOM ELEMENTS
========================================================= */

const depositList =
    document.getElementById("depositList") ||
    document.getElementById("depositRequests");

const searchDeposit =
    document.getElementById("searchDeposit");

const filterDeposit =
    document.getElementById("filterDeposit");

const emptyDeposit =
    document.getElementById("emptyDeposit");


/* =========================================================
   DEPOSIT SUMMARY ELEMENTS
========================================================= */

const totalDepositRequestsEl =
    document.getElementById("totalDeposits");

const pendingDepositsEl =
    document.getElementById("pendingDeposits");

const approvedDepositsEl =
    document.getElementById("approvedDeposits");

const rejectedDepositsEl =
    document.getElementById("rejectedDeposits");


/* =========================================================
   HELPER — STATUS
========================================================= */

function normalizeDepositStatus(status) {

    return String(
        status || "pending"
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   HELPER — RWF
========================================================= */

function formatDepositRWF(amount) {

    const value =
        Number(amount || 0);

    return value.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    ) + " RWF";

}


/* =========================================================
   HELPER — SAFE HTML
========================================================= */

function safeDepositHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   HELPER — DATE
========================================================= */

function formatDepositDate(value) {

    if (!value) {
        return "-";
    }

    const numberValue =
        Number(value);

    if (
        Number.isFinite(numberValue) &&
        numberValue > 0
    ) {

        try {

            return new Date(
                numberValue
            ).toLocaleString();

        } catch {

            return String(value);

        }

    }

    return String(value);

}


/* =========================================================
   LOAD DEPOSITS
========================================================= */

function initializeDepositListener() {

    if (!depositList) {

        console.warn(
            "Deposit list element not found."
        );

    }


    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            depositData = {};


            if (snapshot.exists()) {

                snapshot.forEach(child => {

                    depositData[child.key] = {
                        id: child.key,
                        ...(child.val() || {})
                    };

                });

            }


            updateDepositSummary();

            renderDeposits();

        },
        error => {

            console.error(
                "Deposit listener error:",
                error
            );


            if (depositList) {

                depositList.innerHTML = `

                    <div class="empty-state">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <h3>
                            Failed to Load Deposits
                        </h3>

                        <p>
                            ${safeDepositHTML(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            }

        }
    );

}


/* =========================================================
   UPDATE DEPOSIT SUMMARY
========================================================= */

function updateDepositSummary() {

    const deposits =
        Object.values(
            depositData || {}
        );


    let pending = 0;
    let approved = 0;
    let rejected = 0;


    deposits.forEach(deposit => {

        const status =
            normalizeDepositStatus(
                deposit.status
            );


        if (status === "pending") {

            pending++;

        }

        else if (status === "approved") {

            approved++;

        }

        else if (status === "rejected") {

            rejected++;

        }

    });


    if (totalDepositRequestsEl) {

        totalDepositRequestsEl.textContent =
            deposits.length.toLocaleString();

    }


    if (pendingDepositsEl) {

        pendingDepositsEl.textContent =
            pending.toLocaleString();

    }


    if (approvedDepositsEl) {

        approvedDepositsEl.textContent =
            approved.toLocaleString();

    }


    if (rejectedDepositsEl) {

        rejectedDepositsEl.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   GET CURRENT FILTER
========================================================= */

function getDepositFilter() {

    if (!filterDeposit) {

        return "all";

    }

    return String(
        filterDeposit.value || "all"
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   SEARCH VALUE
========================================================= */

function getDepositSearch() {

    if (!searchDeposit) {

        return "";

    }

    return String(
        searchDeposit.value || ""
    )
    .trim()
    .toLowerCase();

}


/* =========================================================
   CHECK SEARCH MATCH
========================================================= */

function depositMatchesSearch(deposit) {

    const keyword =
        getDepositSearch();


    if (!keyword) {

        return true;

    }


    const searchable = [

        deposit.id,

        deposit.uid,

        deposit.email,

        deposit.senderPhone,

        deposit.transactionId,

        deposit.paymentMethod,

        deposit.note,

        deposit.status

    ]
    .map(value =>
        String(value || "")
            .toLowerCase()
    )
    .join(" ");


    return searchable.includes(
        keyword
    );

}


/* =========================================================
   CHECK STATUS FILTER
========================================================= */

function depositMatchesFilter(deposit) {

    const filter =
        getDepositFilter();


    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }


    return (
        normalizeDepositStatus(
            deposit.status
        ) === filter
    );

}


/* =========================================================
   RENDER DEPOSITS
========================================================= */

function renderDeposits() {

    if (!depositList) {

        return;

    }


    depositList.innerHTML = "";


    const deposits =
        Object.values(
            depositData || {}
        );


    const filteredDeposits =
        deposits
            .filter(deposit =>
                depositMatchesSearch(
                    deposit
                )
            )
            .filter(deposit =>
                depositMatchesFilter(
                    deposit
                )
            )
            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (
        emptyDeposit
    ) {

        emptyDeposit.style.display =
            filteredDeposits.length === 0
                ? "block"
                : "none";

    }


    if (
        filteredDeposits.length === 0
    ) {

        depositList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-wallet"></i>

                <h3>
                    No Deposit Requests
                </h3>

                <p>
                    No deposit requests match your search.
                </p>

            </div>

        `;

        return;

    }


    filteredDeposits.forEach(
        deposit => {

            const id =
                deposit.id;


            const status =
                normalizeDepositStatus(
                    deposit.status
                );


            const amount =
                Number(
                    deposit.amount || 0
                );


            const isPending =
                status === "pending";


            const isApproved =
                status === "approved";


            const isRejected =
                status === "rejected";


            let statusLabel =
                "Pending";


            if (isApproved) {

                statusLabel =
                    "Approved";

            }

            else if (isRejected) {

                statusLabel =
                    "Rejected";

            }


            let statusClass =
                "pending";


            if (isApproved) {

                statusClass =
                    "approved";

            }

            else if (isRejected) {

                statusClass =
                    "rejected";

            }


            depositList.innerHTML += `

                <div
                    class="request-card deposit-card"
                    data-id="${safeDepositHTML(id)}"
                >

                    <div class="request-header">

                        <div>

                            <h3>
                                ${formatDepositRWF(amount)}
                            </h3>

                            <span
                                class="status ${statusClass}"
                            >
                                ${statusLabel}
                            </span>

                        </div>

                    </div>


                    <div class="request-details">

                        <p>

                            <strong>
                                User:
                            </strong>

                            ${safeDepositHTML(
                                deposit.email || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Phone:
                            </strong>

                            ${safeDepositHTML(
                                deposit.senderPhone || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Payment Method:
                            </strong>

                            ${safeDepositHTML(
                                deposit.paymentMethod || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Transaction ID:
                            </strong>

                            <span class="transaction-id">

                                ${safeDepositHTML(
                                    deposit.transactionId || "-"
                                )}

                            </span>

                        </p>


                        <p>

                            <strong>
                                Payment Date:
                            </strong>

                            ${safeDepositHTML(
                                deposit.paymentDate || "-"
                            )}

                        </p>


                        <p>

                            <strong>
                                Submitted:
                            </strong>

                            ${safeDepositHTML(
                                formatDepositDate(
                                    deposit.createdAt
                                )
                            )}

                        </p>


                        ${
                            deposit.note
                            ? `
                                <p>
                                    <strong>
                                        Note:
                                    </strong>

                                    ${safeDepositHTML(
                                        deposit.note
                                    )}
                                </p>
                            `
                            : ""
                        }


                        ${
                            deposit.approvedAt
                            ? `
                                <p>
                                    <strong>
                                        Approved:
                                    </strong>

                                    ${safeDepositHTML(
                                        formatDepositDate(
                                            deposit.approvedAt
                                        )
                                    )}
                                </p>
                            `
                            : ""
                        }

                    </div>


                    <div class="action-buttons">


                        ${
                            isPending
                            ? `

                                <button
                                    type="button"
                                    class="approveBtn"
                                    data-id="${safeDepositHTML(id)}"
                                >

                                    <i
                                        class="fa-solid fa-check"
                                    ></i>

                                    Approve

                                </button>


                                <button
                                    type="button"
                                    class="rejectBtn"
                                    data-id="${safeDepositHTML(id)}"
                                >

                                    <i
                                        class="fa-solid fa-xmark"
                                    ></i>

                                    Reject

                                </button>

                            `
                            : ""
                        }


                        ${
                            deposit.transactionId
                            ? `

                                <button
                                    type="button"
                                    class="copyTransaction"
                                    data-transaction="${safeDepositHTML(
                                        deposit.transactionId
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-copy"
                                    ></i>

                                    Copy Transaction ID

                                </button>

                            `
                            : ""
                        }


                        ${
                            deposit.proofImage
                            ? `

                                <button
                                    type="button"
                                    class="viewProof"
                                    data-image="${safeDepositHTML(
                                        deposit.proofImage
                                    )}"
                                >

                                    <i
                                        class="fa-solid fa-image"
                                    ></i>

                                    View Screenshot

                                </button>

                            `
                            : ""
                        }

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   APPROVE DEPOSIT — ATOMIC
========================================================= */

async function approveDeposit(id) {

    if (!id) {

        alert(
            "Deposit request ID is missing."
        );

        return;

    }


    const confirmed =
        confirm(
            "Approve this deposit?"
        );


    if (!confirmed) {

        return;

    }


    try {

        /* ---------------------------------------------
           CHECK ADMIN
        --------------------------------------------- */

        if (!currentAdmin) {

            alert(
                "Admin session is not ready."
            );

            return;

        }


        /* ---------------------------------------------
           GET DEPOSIT
        --------------------------------------------- */

        const depositRef =
            ref(
                db,
                "depositRequests/" + id
            );


        const depositSnap =
            await get(
                depositRef
            );


        if (!depositSnap.exists()) {

            alert(
                "Deposit request not found."
            );

            return;

        }


        const deposit =
            depositSnap.val() || {};


        /* ---------------------------------------------
           ONE-TIME APPROVAL PROTECTION
        --------------------------------------------- */

        const currentStatus =
            normalizeDepositStatus(
                deposit.status
            );


        if (
            currentStatus === "approved"
        ) {

            alert(
                "This deposit has already been approved."
            );

            return;

        }


        if (
            currentStatus !== "pending"
        ) {

            alert(
                "This deposit is no longer pending."
            );

            return;

        }


        /* ---------------------------------------------
           VALIDATE UID
        --------------------------------------------- */

        const uid =
            String(
                deposit.uid || ""
            ).trim();


        if (!uid) {

            alert(
                "Deposit has no user UID."
            );

            return;

        }


        /* ---------------------------------------------
           VALIDATE AMOUNT
        --------------------------------------------- */

        const amount =
            Number(
                deposit.amount
            );


        if (
            !Number.isFinite(amount) ||
            amount < 1000
        ) {

            alert(
                "Invalid deposit amount."
            );

            return;

        }


        /* ---------------------------------------------
           GET USER
        --------------------------------------------- */

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnap =
            await get(
                userRef
            );


        if (!userSnap.exists()) {

            alert(
                "User account not found."
            );

            return;

        }


        const user =
            userSnap.val() || {};


        /* ---------------------------------------------
           CURRENT USER BALANCE
        --------------------------------------------- */

        const currentBalance =
            Number(
                user.balance || 0
            );


        if (
            !Number.isFinite(
                currentBalance
            )
        ) {

            alert(
                "User balance is invalid."
            );

            return;

        }


        /* ---------------------------------------------
           NEW BALANCE
        --------------------------------------------- */

        const newBalance =
            currentBalance +
            amount;


        /* ---------------------------------------------
           NEW TOTAL DEPOSIT
        --------------------------------------------- */

        const oldTotalDeposits =
            Number(
                user.totalDeposits ||
                0
            );


        const oldTotalDeposit =
            Number(
                user.totalDeposit ||
                0
            );


        const newTotalDeposits =
            oldTotalDeposits +
            amount;


        const newTotalDeposit =
            oldTotalDeposit +
            amount;


        /* ---------------------------------------------
           TRANSACTION KEY
        --------------------------------------------- */

        const transactionRef =
            push(
                ref(db, "transactions")
            );


        const transactionId =
            transactionRef.key;


        if (!transactionId) {

            alert(
                "Could not create transaction ID."
            );

            return;

        }


        const now =
            Date.now();


        /* =================================================
           ATOMIC MULTI-LOCATION UPDATE

           EVERYTHING IS WRITTEN TOGETHER:

           USER BALANCE
           USER TOTAL DEPOSIT
           USER TRANSACTIONS
           DEPOSIT STATUS
           TRANSACTION RECORD

           If Firebase rejects the update,
           none of these changes are applied.
        ================================================= */


        const updates = {};


        /* ---------------------------------------------
           USER
        --------------------------------------------- */

        updates[
            "users/" +
            uid +
            "/balance"
        ] =
            newBalance;


        updates[
            "users/" +
            uid +
            "/totalDeposits"
        ] =
            newTotalDeposits;


        updates[
            "users/" +
            uid +
            "/totalDeposit"
        ] =
            newTotalDeposit;


        updates[
            "users/" +
            uid +
            "/totalTransactions"
        ] =
            Number(
                user.totalTransactions ||
                0
            ) + 1;


        /* ---------------------------------------------
           DEPOSIT REQUEST
        --------------------------------------------- */

        updates[
            "depositRequests/" +
            id +
            "/status"
        ] =
            "approved";


        updates[
            "depositRequests/" +
            id +
            "/approvedAt"
        ] =
            now;


        updates[
            "depositRequests/" +
            id +
            "/approvedBy"
        ] =
            currentAdmin.uid;


        /* ---------------------------------------------
           TRANSACTION RECORD
        --------------------------------------------- */

        updates[
            "transactions/" +
            transactionId
        ] = {

            uid: uid,

            type: "deposit",

            transactionType: "deposit",

            amount: amount,

            currency: "RWF",

            status: "approved",

            referenceId: id,

            transactionId:
                deposit.transactionId ||
                id,

            paymentMethod:
                deposit.paymentMethod ||
                "",

            description:
                "Deposit approved",

            createdAt: now,

            timestamp: now

        };


        /* ---------------------------------------------
           WRITE EVERYTHING AT ONCE
        --------------------------------------------- */

        await update(
            ref(db),
            updates
        );


        /* ---------------------------------------------
           SUCCESS
        --------------------------------------------- */

        alert(
            "Deposit approved successfully."
        );


        console.log(
            "✅ Deposit approved:",
            id
        );


    } catch (error) {

        console.error(
            "Deposit approval failed:",
            error
        );


        alert(
            "Deposit approval failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    if (!id) {

        alert(
            "Deposit request ID is missing."
        );

        return;

    }


    const confirmed =
        confirm(
            "Reject this deposit?"
        );


    if (!confirmed) {

        return;

    }


    try {

        if (!currentAdmin) {

            alert(
                "Admin session is not ready."
            );

            return;

        }


        const depositRef =
            ref(
                db,
                "depositRequests/" + id
            );


        const snap =
            await get(
                depositRef
            );


        if (!snap.exists()) {

            alert(
                "Deposit request not found."
            );

            return;

        }


        const deposit =
            snap.val() || {};


        const status =
            normalizeDepositStatus(
                deposit.status
            );


        if (
            status === "approved"
        ) {

            alert(
                "An approved deposit cannot be rejected."
            );

            return;

        }


        if (
            status === "rejected"
        ) {

            alert(
                "This deposit is already rejected."
            );

            return;

        }


        if (
            status !== "pending"
        ) {

            alert(
                "This deposit is not pending."
            );

            return;

        }


        const now =
            Date.now();


        await update(
            depositRef,
            {

                status: "rejected",

                rejectedAt: now,

                rejectedBy:
                    currentAdmin.uid

            }
        );


        alert(
            "Deposit rejected successfully."
        );


        console.log(
            "✅ Deposit rejected:",
            id
        );


    } catch (error) {

        console.error(
            "Deposit rejection failed:",
            error
        );


        alert(
            "Deposit rejection failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   COPY TRANSACTION ID
========================================================= */

async function copyDepositTransaction(
    transactionId
) {

    if (!transactionId) {

        alert(
            "Transaction ID is empty."
        );

        return;

    }


    try {

        await navigator.clipboard.writeText(
            transactionId
        );


        alert(
            "Transaction ID copied."
        );


    } catch (error) {

        console.error(
            "Copy failed:",
            error
        );


        /* ---------------------------------------------
           FALLBACK
        --------------------------------------------- */

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            transactionId;


        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );

            alert(
                "Transaction ID copied."
            );

        } catch {

            alert(
                "Could not copy Transaction ID."
            );

        }


        textarea.remove();

    }

}


/* =========================================================
   VIEW PROOF
========================================================= */

function viewDepositProof(
    imageUrl
) {

    if (!imageUrl) {

        alert(
            "No screenshot is available for this deposit."
        );

        return;

    }


    window.open(
        imageUrl,
        "_blank",
        "noopener,noreferrer"
    );

}


/* =========================================================
   DEPOSIT EVENT DELEGATION
========================================================= */

depositList?.addEventListener(
    "click",
    event => {


        /* ---------------------------------------------
           APPROVE
        --------------------------------------------- */

        const approveButton =
            event.target.closest(
                ".approveBtn"
            );


        if (approveButton) {

            const id =
                approveButton.dataset.id;


            approveButton.disabled =
                true;


            approveDeposit(id)
                .finally(() => {

                    approveButton.disabled =
                        false;

                });


            return;

        }


        /* ---------------------------------------------
           REJECT
        --------------------------------------------- */

        const rejectButton =
            event.target.closest(
                ".rejectBtn"
            );


        if (rejectButton) {

            const id =
                rejectButton.dataset.id;


            rejectButton.disabled =
                true;


            rejectDeposit(id)
                .finally(() => {

                    rejectButton.disabled =
                        false;

                });


            return;

        }


        /* ---------------------------------------------
           COPY
        --------------------------------------------- */

        const copyButton =
            event.target.closest(
                ".copyTransaction"
            );


        if (copyButton) {

            const transactionId =
                copyButton.dataset.transaction;


            copyDepositTransaction(
                transactionId
            );


            return;

        }


        /* ---------------------------------------------
           VIEW PROOF
        --------------------------------------------- */

        const proofButton =
            event.target.closest(
                ".viewProof"
            );


        if (proofButton) {

            const imageUrl =
                proofButton.dataset.image;


            viewDepositProof(
                imageUrl
            );


            return;

        }

    }
);


/* =========================================================
   SEARCH
========================================================= */

searchDeposit?.addEventListener(
    "input",
    () => {

        renderDeposits();

    }
);


/* =========================================================
   FILTER
========================================================= */

filterDeposit?.addEventListener(
    "change",
    () => {

        renderDeposits();

    }
);


/* =========================================================
   START DEPOSIT PART
========================================================= */

let depositPartStarted =
    false;


function startDepositPart() {

    if (
        depositPartStarted
    ) {

        return;

    }


    if (!currentAdmin) {

        console.warn(
            "Deposit Part waiting for admin authentication..."
        );

        return;

    }


    depositPartStarted =
        true;


    initializeDepositListener();


    console.log(
        "✅ Deposit Part started"
    );

}


/* =========================================================
   WAIT FOR ADMIN AUTH
========================================================= */

const depositAuthInterval =
    setInterval(
        () => {

            if (currentAdmin) {

                clearInterval(
                    depositAuthInterval
                );

                startDepositPart();

            }

        },
        100
    );


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.approveDeposit =
    approveDeposit;

window.rejectDeposit =
    rejectDeposit;


/* =========================================================
   READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 3 Loaded"
);

console.log(
    "Deposit Requests ready"
);

console.log(
    "Atomic approval enabled"
);

console.log(
    "======================================"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 4 — WITHDRAW REQUESTS

   CURRENCY: RWF / FRW

   PART 4 RESPONSIBILITIES:
   - Live withdraw requests
   - Search
   - Status filter
   - Counters
   - View details
   - Render requests
   - Send Approve/Reject actions to PART 11

   IMPORTANT:
   - NO approveWithdraw() here
   - NO rejectWithdraw() here
   - Approval/Reject logic is ONLY in PART 11
   - Prevents duplicate function conflicts
========================================================= */


/* =========================================================
   PART 4 STATE
========================================================= */

let part4WithdrawData = {};

let part4WithdrawListenerStarted = false;

let part4WithdrawEventsBound = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const part4WithdrawList =
    document.getElementById("withdrawRequests");

const part4WithdrawSearch =
    document.getElementById("withdrawSearch");

const part4WithdrawFilter =
    document.getElementById("withdrawFilter");

const part4WithdrawCount =
    document.getElementById("withdrawCount");

const part4WithdrawPending =
    document.getElementById("withdrawPending");

const part4WithdrawApproved =
    document.getElementById("withdrawApproved");

const part4WithdrawRejected =
    document.getElementById("withdrawRejected");

const part4EmptyWithdraw =
    document.getElementById("emptyWithdraw");


/* =========================================================
   WITHDRAW MODAL
========================================================= */

const part4WithdrawModal =
    document.getElementById("withdrawModal");

const part4CloseWithdrawModal =
    document.getElementById("closeWithdrawModal");

const part4ModalUser =
    document.getElementById("modalUser");

const part4ModalEmail =
    document.getElementById("modalEmail");

const part4ModalPhone =
    document.getElementById("modalPhone");

const part4ModalAmount =
    document.getElementById("modalAmount");

const part4ModalMethod =
    document.getElementById("modalMethod");

const part4ModalStatus =
    document.getElementById("modalStatus");


/* =========================================================
   HELPER — STATUS NORMALIZER
========================================================= */

function normalizeWithdrawStatusPart4(status) {

    return String(
        status || "pending"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   HELPER — RWF FORMAT
========================================================= */

function formatWithdrawRWFPart4(amount) {

    const value =
        Number(amount || 0);

    if (!Number.isFinite(value)) {

        return "0 RWF";

    }

    return value.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    ) + " RWF";

}


/* =========================================================
   HELPER — SAFE HTML
========================================================= */

function safeWithdrawHTMLPart4(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================================
   HELPER — DATE
========================================================= */

function formatWithdrawDatePart4(value) {

    if (!value) {

        return "-";

    }

    const numberValue =
        Number(value);

    if (
        Number.isFinite(numberValue) &&
        numberValue > 0
    ) {

        try {

            return new Date(
                numberValue
            ).toLocaleString();

        }

        catch {

            return String(value);

        }

    }

    return String(value);

}


/* =========================================================
   SEARCH VALUE
========================================================= */

function getWithdrawSearchPart4() {

    if (!part4WithdrawSearch) {

        return "";

    }

    return String(
        part4WithdrawSearch.value || ""
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   FILTER VALUE
========================================================= */

function getWithdrawFilterPart4() {

    if (!part4WithdrawFilter) {

        return "all";

    }

    return String(
        part4WithdrawFilter.value || "all"
    )
        .trim()
        .toLowerCase();

}


/* =========================================================
   SEARCH MATCH
========================================================= */

function withdrawMatchesSearchPart4(request) {

    const keyword =
        getWithdrawSearchPart4();

    if (!keyword) {

        return true;

    }

    const searchable = [

        request.id,

        request.uid,

        request.email,

        request.phone,

        request.senderPhone,

        request.withdrawPhone,

        request.paymentMethod,

        request.method,

        request.transactionId,

        request.note,

        request.amount,

        request.status

    ]
        .map(
            value =>
                String(
                    value || ""
                ).toLowerCase()
        )
        .join(" ");

    return searchable.includes(
        keyword
    );

}


/* =========================================================
   STATUS FILTER MATCH
========================================================= */

function withdrawMatchesFilterPart4(request) {

    const filter =
        getWithdrawFilterPart4();

    if (
        !filter ||
        filter === "all"
    ) {

        return true;

    }

    return (
        normalizeWithdrawStatusPart4(
            request.status
        ) === filter
    );

}


/* =========================================================
   UPDATE COUNTERS
========================================================= */

function updateWithdrawSummaryPart4() {

    const requests =
        Object.values(
            part4WithdrawData || {}
        );

    let pending = 0;

    let approved = 0;

    let rejected = 0;


    requests.forEach(
        request => {

            const status =
                normalizeWithdrawStatusPart4(
                    request.status
                );

            if (
                status === "pending"
            ) {

                pending++;

            }

            else if (
                status === "approved"
            ) {

                approved++;

            }

            else if (
                status === "rejected"
            ) {

                rejected++;

            }

        }
    );


    if (part4WithdrawCount) {

        part4WithdrawCount.textContent =
            requests.length.toLocaleString();

    }


    if (part4WithdrawPending) {

        part4WithdrawPending.textContent =
            pending.toLocaleString();

    }


    if (part4WithdrawApproved) {

        part4WithdrawApproved.textContent =
            approved.toLocaleString();

    }


    if (part4WithdrawRejected) {

        part4WithdrawRejected.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   RENDER WITHDRAW REQUESTS
========================================================= */

function renderWithdrawRequestsPart4() {

    if (!part4WithdrawList) {

        return;

    }


    part4WithdrawList.innerHTML = "";


    const requests =
        Object.values(
            part4WithdrawData || {}
        );


    const filteredRequests =
        requests

            .filter(
                request =>
                    withdrawMatchesSearchPart4(
                        request
                    )
            )

            .filter(
                request =>
                    withdrawMatchesFilterPart4(
                        request
                    )
            )

            .sort(
                (a, b) =>
                    Number(
                        b.createdAt || 0
                    ) -
                    Number(
                        a.createdAt || 0
                    )
            );


    if (part4EmptyWithdraw) {

        part4EmptyWithdraw.style.display =
            filteredRequests.length === 0
                ? "block"
                : "none";

    }


    if (
        filteredRequests.length === 0
    ) {

        part4WithdrawList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-money-bill-transfer"></i>

                <h3>
                    No Withdraw Requests
                </h3>

                <p>
                    No withdraw requests match your search.
                </p>

            </div>

        `;

        return;

    }


    filteredRequests.forEach(
        request => {

            const id =
                request.id;


            const status =
                normalizeWithdrawStatusPart4(
                    request.status
                );


            const amount =
                Number(
                    request.amount || 0
                );


            const isPending =
                status === "pending";


            const isApproved =
                status === "approved";


            const isRejected =
                status === "rejected";


            let statusLabel =
                "Pending";


            let statusClass =
                "pending";


            if (isApproved) {

                statusLabel =
                    "Approved";

                statusClass =
                    "approved";

            }

            else if (isRejected) {

                statusLabel =
                    "Rejected";

                statusClass =
                    "rejected";

            }


            const phone =
                request.phone ||
                request.senderPhone ||
                request.withdrawPhone ||
                "-";


            const method =
                request.paymentMethod ||
                request.method ||
                "-";


            const email =
                request.email ||
                "-";


            const createdAt =
                request.createdAt
                    ? formatWithdrawDatePart4(
                        request.createdAt
                    )
                    : "-";


            const approvedAt =
                request.approvedAt
                    ? formatWithdrawDatePart4(
                        request.approvedAt
                    )
                    : "";


            const rejectedAt =
                request.rejectedAt
                    ? formatWithdrawDatePart4(
                        request.rejectedAt
                    )
                    : "";


            const transactionId =
                request.transactionId ||
                "";


            const note =
                request.note ||
                "";


            const card = document.createElement(
                "div"
            );


            card.className =
                "request-card withdraw-card";


            card.dataset.id =
                id;


            card.innerHTML = `

                <div class="request-header">

                    <div>

                        <h3>
                            ${formatWithdrawRWFPart4(
                                amount
                            )}
                        </h3>

                        <span
                            class="status ${statusClass}"
                        >
                            ${statusLabel}
                        </span>

                    </div>

                </div>


                <div class="request-details">

                    <p>

                        <strong>
                            User:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            email
                        )}

                    </p>


                    <p>

                        <strong>
                            Phone:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            phone
                        )}

                    </p>


                    <p>

                        <strong>
                            Method:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            method
                        )}

                    </p>


                    <p>

                        <strong>
                            Submitted:
                        </strong>

                        ${safeWithdrawHTMLPart4(
                            createdAt
                        )}

                    </p>


                    ${
                        transactionId
                        ? `

                            <p>

                                <strong>
                                    Transaction ID:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    transactionId
                                )}

                            </p>

                        `
                        : ""
                    }


                    ${
                        note
                        ? `

                            <p>

                                <strong>
                                    Note:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    note
                                )}

                            </p>

                        `
                        : ""
                    }


                    ${
                        approvedAt
                        ? `

                            <p>

                                <strong>
                                    Approved:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    approvedAt
                                )}

                            </p>

                        `
                        : ""
                    }


                    ${
                        rejectedAt
                        ? `

                            <p>

                                <strong>
                                    Rejected:
                                </strong>

                                ${safeWithdrawHTMLPart4(
                                    rejectedAt
                                )}

                            </p>

                        `
                        : ""
                    }

                </div>


                <div class="action-buttons">

                    ${
                        isPending
                        ? `

                            <button
                                type="button"
                                class="approveWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-check"></i>

                                Approve

                            </button>


                            <button
                                type="button"
                                class="viewWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-eye"></i>

                                View

                            </button>


                            <button
                                type="button"
                                class="rejectWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-xmark"></i>

                                Reject

                            </button>

                        `
                        : `

                            <button
                                type="button"
                                class="viewWithdrawBtn"
                                data-id="${safeWithdrawHTMLPart4(
                                    id
                                )}"
                            >

                                <i class="fa-solid fa-eye"></i>

                                View

                            </button>

                        `
                    }

                </div>

            `;


            part4WithdrawList.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   OPEN WITHDRAW DETAILS
========================================================= */

function openWithdrawDetailsPart4(id) {

    const request =
        part4WithdrawData[id];


    if (!request) {

        alert(
            "Withdraw request not found."
        );

        return;

    }


    const amount =
        Number(
            request.amount || 0
        );


    const phone =
        request.phone ||
        request.senderPhone ||
        request.withdrawPhone ||
        "-";


    const method =
        request.paymentMethod ||
        request.method ||
        "-";


    if (part4ModalUser) {

        part4ModalUser.textContent =
            request.uid || "-";

    }


    if (part4ModalEmail) {

        part4ModalEmail.textContent =
            request.email || "-";

    }


    if (part4ModalPhone) {

        part4ModalPhone.textContent =
            phone;

    }


    if (part4ModalAmount) {

        part4ModalAmount.textContent =
            formatWithdrawRWFPart4(
                amount
            );

    }


    if (part4ModalMethod) {

        part4ModalMethod.textContent =
            method;

    }


    if (part4ModalStatus) {

        part4ModalStatus.textContent =
            String(
                request.status ||
                "pending"
            );

    }


    if (part4WithdrawModal) {

        part4WithdrawModal.style.display =
            "flex";

    }

}


/* =========================================================
   CLOSE WITHDRAW DETAILS
========================================================= */

function closeWithdrawDetailsPart4() {

    if (part4WithdrawModal) {

        part4WithdrawModal.style.display =
            "none";

    }

}


/* =========================================================
   MODAL EVENTS
========================================================= */

function bindWithdrawModalEventsPart4() {

    if (
        part4WithdrawModal &&
        !part4WithdrawModal.dataset.part4Bound
    ) {

        part4WithdrawModal.dataset.part4Bound =
            "true";


        part4WithdrawModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    part4WithdrawModal
                ) {

                    closeWithdrawDetailsPart4();

                }

            }
        );

    }


    if (
        part4CloseWithdrawModal &&
        !part4CloseWithdrawModal.dataset.part4Bound
    ) {

        part4CloseWithdrawModal.dataset.part4Bound =
            "true";


        part4CloseWithdrawModal.addEventListener(
            "click",
            closeWithdrawDetailsPart4
        );

    }

}


/* =========================================================
   EVENT DELEGATION
   IMPORTANT:
   APPROVE / REJECT ARE OWNED BY PART 11
========================================================= */

function bindWithdrawEventsPart4() {

    if (
        part4WithdrawEventsBound ||
        !part4WithdrawList
    ) {

        return;

    }


    part4WithdrawEventsBound =
        true;


    part4WithdrawList.addEventListener(
        "click",
        event => {

            /* -----------------------------------------
               VIEW DETAILS
            ----------------------------------------- */

            const viewButton =
                event.target.closest(
                    ".viewWithdrawBtn"
                );


            if (viewButton) {

                const id =
                    viewButton.dataset.id;


                openWithdrawDetailsPart4(
                    id
                );


                return;

            }


            /* -----------------------------------------
               APPROVE
               
               PART 11 OWNS THE ACTUAL FUNCTION.
            ----------------------------------------- */

            const approveButton =
                event.target.closest(
                    ".approveWithdrawBtn"
                );


            if (approveButton) {

                const id =
                    approveButton.dataset.id;


                if (
                    typeof window.approveWithdraw ===
                    "function"
                ) {

                    approveButton.disabled =
                        true;


                    Promise.resolve(
                        window.approveWithdraw(
                            id
                        )
                    )
                        .finally(
                            () => {

                                /*
                                 * Firebase listener will
                                 * normally re-render the card.
                                 */

                                approveButton.disabled =
                                    false;

                            }
                        );

                }

                else {

                    console.error(
                        "Part 11 approveWithdraw() is not loaded."
                    );


                    alert(
                        "Withdraw approval system is not ready. Please reload the admin page."
                    );

                }


                return;

            }


            /* -----------------------------------------
               REJECT
               
               PART 11 OWNS THE ACTUAL FUNCTION.
            ----------------------------------------- */

            const rejectButton =
                event.target.closest(
                    ".rejectWithdrawBtn"
                );


            if (rejectButton) {

                const id =
                    rejectButton.dataset.id;


                if (
                    typeof window.rejectWithdraw ===
                    "function"
                ) {

                    rejectButton.disabled =
                        true;


                    Promise.resolve(
                        window.rejectWithdraw(
                            id
                        )
                    )
                        .finally(
                            () => {

                                rejectButton.disabled =
                                    false;

                            }
                        );

                }

                else {

                    console.error(
                        "Part 11 rejectWithdraw() is not loaded."
                    );


                    alert(
                        "Withdraw rejection system is not ready. Please reload the admin page."
                    );

                }


                return;

            }

        }
    );

}


/* =========================================================
   SEARCH EVENTS
========================================================= */

function bindWithdrawSearchPart4() {

    if (
        part4WithdrawSearch &&
        !part4WithdrawSearch.dataset.part4Bound
    ) {

        part4WithdrawSearch.dataset.part4Bound =
            "true";


        part4WithdrawSearch.addEventListener(
            "input",
            () => {

                renderWithdrawRequestsPart4();

            }
        );

    }


    if (
        part4WithdrawFilter &&
        !part4WithdrawFilter.dataset.part4Bound
    ) {

        part4WithdrawFilter.dataset.part4Bound =
            "true";


        part4WithdrawFilter.addEventListener(
            "change",
            () => {

                renderWithdrawRequestsPart4();

            }
        );

    }

}


/* =========================================================
   FIREBASE LISTENER
========================================================= */

function initializeWithdrawListenerPart4() {

    if (
        part4WithdrawListenerStarted
    ) {

        return;

    }


    if (!part4WithdrawList) {

        console.warn(
            "Part 4: #withdrawRequests not found."
        );

        return;

    }


    part4WithdrawListenerStarted =
        true;


    onValue(

        ref(
            db,
            "withdrawRequests"
        ),

        snapshot => {

            const newData = {};


            if (
                snapshot.exists()
            ) {

                snapshot.forEach(
                    child => {

                        newData[
                            child.key
                        ] = {

                            id:
                                child.key,

                            ...(child.val() || {})

                        };

                    }
                );

            }


            part4WithdrawData =
                newData;


            updateWithdrawSummaryPart4();

            renderWithdrawRequestsPart4();

        },

        error => {

            console.error(
                "Part 4 withdraw listener error:",
                error
            );


            part4WithdrawList.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Failed to Load Withdraw Requests
                    </h3>

                    <p>
                        ${safeWithdrawHTMLPart4(
                            error.message
                        )}
                    </p>

                </div>

            `;

        }

    );


    console.log(
        "✅ Part 4 withdraw listener started"
    );

}


/* =========================================================
   REFRESH
========================================================= */

function refreshWithdrawPart4() {

    updateWithdrawSummaryPart4();

    renderWithdrawRequestsPart4();

}


/* =========================================================
   START PART 4
========================================================= */

let part4WithdrawStarted =
    false;


async function startWithdrawPart4() {

    if (
        part4WithdrawStarted
    ) {

        return;

    }


    try {

        /*
         * Prefer the central admin
         * authentication system.
         */

        if (
            typeof window.waitForAdmin ===
            "function"
        ) {

            await window.waitForAdmin();

        }


        /*
         * Check admin safely.
         */

        let adminReady = false;


        if (
            typeof currentAdmin !==
            "undefined" &&
            currentAdmin
        ) {

            adminReady = true;

        }


        if (
            window.currentAdmin
        ) {

            adminReady = true;

        }


        if (!adminReady) {

            console.warn(
                "Part 4: waiting for admin authentication..."
            );

            return;

        }


        part4WithdrawStarted =
            true;


        bindWithdrawModalEventsPart4();

        bindWithdrawEventsPart4();

        bindWithdrawSearchPart4();

        initializeWithdrawListenerPart4();


        console.log(
            "✅ Money Vault Admin Part 4 started"
        );

    }

    catch (error) {

        console.error(
            "Part 4 start error:",
            error
        );

    }

}


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

const part4WithdrawAuthInterval =
    setInterval(
        () => {

            let adminReady = false;


            if (
                typeof currentAdmin !==
                "undefined" &&
                currentAdmin
            ) {

                adminReady = true;

            }


            if (
                window.currentAdmin
            ) {

                adminReady = true;

            }


            if (adminReady) {

                clearInterval(
                    part4WithdrawAuthInterval
                );


                startWithdrawPart4();

            }

        },
        250
    );


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

/*
 * IMPORTANT:
 * These are Part 4 UI functions only.
 *
 * approveWithdraw() and rejectWithdraw()
 * are NOT defined here.
 *
 * Part 11 owns them.
 */

window.renderWithdrawRequests =
    renderWithdrawRequestsPart4;

window.openWithdrawDetails =
    openWithdrawDetailsPart4;

window.refreshWithdrawPart4 =
    refreshWithdrawPart4;


/* =========================================================
   READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 4 Loaded"
);

console.log(
    "Withdraw Requests UI ready"
);

console.log(
    "Part 4 = Display / Search / Filter / View"
);

console.log(
    "Part 11 = Approve / Reject"
);

console.log(
    "======================================"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 5
   TRANSACTIONS MANAGEMENT
   CURRENCY: RWF / FRW

   FEATURES:
   - Live transactions
   - Deposit + Withdraw transactions
   - Search
   - Type filter
   - Status filter
   - Counters
   - Sort newest first
   - User information
   - Transaction ID
   - Reference ID
   - Amount
   - Date
   - Safe HTML rendering
   - No duplicate listeners
========================================================= */


/* =========================================================
   PART 5 STATE
========================================================= */

let allTransactionData = [];
let transactionsListenerStarted = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const transactionsContainer =
    document.getElementById("transactionsContainer");

const transactionSearch =
    document.getElementById("transactionSearch");

const transactionFilter =
    document.getElementById("transactionFilter");

const transactionTotal =
    document.getElementById("transactionTotal");

const transactionApproved =
    document.getElementById("transactionApproved");

const transactionPending =
    document.getElementById("transactionPending");

const transactionRejected =
    document.getElementById("transactionRejected");


/* =========================================================
   STATUS NORMALIZER
========================================================= */

function normalizeTransactionStatus(status) {

    return String(status || "")
        .trim()
        .toLowerCase();

}


/* =========================================================
   TRANSACTION TYPE NORMALIZER
========================================================= */

function normalizeTransactionType(transaction) {

    const type =
        transaction.type ||
        transaction.transactionType ||
        transaction.kind ||
        "";

    const value =
        String(type)
            .trim()
            .toLowerCase();

    if (
        value === "deposit" ||
        value === "deposits"
    ) {
        return "Deposit";
    }

    if (
        value === "withdraw" ||
        value === "withdrawal" ||
        value === "withdraws"
    ) {
        return "Withdraw";
    }

    return "Transaction";
}


/* =========================================================
   FORMAT RWF
========================================================= */

function formatTransactionMoney(amount) {

    const value = Number(amount || 0);

    return value.toLocaleString("en-RW") + " RWF";

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatTransactionDate(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(Number(value));

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString();

}


/* =========================================================
   STATUS LABEL
========================================================= */

function transactionStatusLabel(status) {

    const normalized =
        normalizeTransactionStatus(status);

    if (normalized === "approved") {
        return "Approved";
    }

    if (normalized === "pending") {
        return "Pending";
    }

    if (normalized === "rejected") {
        return "Rejected";
    }

    if (!normalized) {
        return "Unknown";
    }

    return String(status);

}


/* =========================================================
   STATUS CLASS
========================================================= */

function transactionStatusClass(status) {

    const normalized =
        normalizeTransactionStatus(status);

    if (normalized === "approved") {
        return "approved";
    }

    if (normalized === "pending") {
        return "pending";
    }

    if (normalized === "rejected") {
        return "rejected";
    }

    return "pending";

}


/* =========================================================
   TRANSACTION ICON
========================================================= */

function transactionIcon(type) {

    if (type === "Deposit") {

        return `
            <i class="fa-solid fa-arrow-down"></i>
        `;

    }

    if (type === "Withdraw") {

        return `
            <i class="fa-solid fa-arrow-up"></i>
        `;

    }

    return `
        <i class="fa-solid fa-clock-rotate-left"></i>
    `;

}


/* =========================================================
   LOAD TRANSACTIONS
========================================================= */

function initializeTransactionsListener() {

    if (transactionsListenerStarted) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    if (!transactionsContainer) {
        console.warn(
            "Transactions container not found."
        );
        return;
    }

    transactionsListenerStarted = true;

    onValue(
        ref(db, "transactions"),
        (snapshot) => {

            allTransactionData = [];

            if (snapshot.exists()) {

                snapshot.forEach((child) => {

                    const data =
                        child.val() || {};

                    allTransactionData.push({

                        id: child.key,

                        ...data

                    });

                });

            }

            /*
             * Newest transaction first
             */
            allTransactionData.sort(
                (a, b) => {

                    const dateA =
                        Number(
                            a.createdAt ||
                            a.timestamp ||
                            a.approvedAt ||
                            0
                        );

                    const dateB =
                        Number(
                            b.createdAt ||
                            b.timestamp ||
                            b.approvedAt ||
                            0
                        );

                    return dateB - dateA;

                }
            );

            renderFilteredTransactions();

        },
        (error) => {

            console.error(
                "Transactions listener error:",
                error
            );

            if (transactionsContainer) {

                transactionsContainer.innerHTML = `

                    <div class="request-card">

                        <h3>
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            Unable to load transactions
                        </h3>

                        <p>
                            ${escapeHTML(
                                error.message ||
                                "Permission denied."
                            )}
                        </p>

                    </div>

                `;

            }

        }
    );

}


/* =========================================================
   FILTER TRANSACTIONS
========================================================= */

function getFilteredTransactions() {

    const search =
        String(
            transactionSearch?.value || ""
        )
        .trim()
        .toLowerCase();

    const filter =
        String(
            transactionFilter?.value || "All"
        )
        .trim()
        .toLowerCase();


    return allTransactionData.filter(
        (transaction) => {

            const type =
                normalizeTransactionType(
                    transaction
                );

            const status =
                normalizeTransactionStatus(
                    transaction.status
                );

            /*
             * TYPE / STATUS FILTER
             */

            let filterMatches = true;

            if (filter !== "all") {

                const typeMatches =
                    filter === type.toLowerCase();

                const statusMatches =
                    filter === status;

                filterMatches =
                    typeMatches ||
                    statusMatches;

            }

            if (!filterMatches) {
                return false;
            }


            /*
             * SEARCH
             */

            if (!search) {
                return true;
            }

            const searchableText = [

                transaction.uid,

                transaction.email,

                transaction.phone,

                transaction.senderPhone,

                transaction.transactionId,

                transaction.referenceId,

                transaction.paymentMethod,

                transaction.description,

                transaction.type,

                transaction.transactionType,

                transaction.status,

                transaction.id

            ]
            .map(value =>
                String(value || "")
                    .toLowerCase()
            )
            .join(" ");


            return searchableText.includes(search);

        }
    );

}


/* =========================================================
   RENDER FILTERED TRANSACTIONS
========================================================= */

function renderFilteredTransactions() {

    const filtered =
        getFilteredTransactions();

    renderTransactions(
        filtered
    );

}


/* =========================================================
   RENDER TRANSACTIONS
========================================================= */

function renderTransactions(list) {

    if (!transactionsContainer) {
        return;
    }


    /*
     * CLEAR
     */

    transactionsContainer.innerHTML = "";


    /*
     * COUNTERS
     */

    let approved = 0;
    let pending = 0;
    let rejected = 0;


    allTransactionData.forEach(
        (transaction) => {

            const status =
                normalizeTransactionStatus(
                    transaction.status
                );

            if (status === "approved") {
                approved++;
            }

            if (status === "pending") {
                pending++;
            }

            if (status === "rejected") {
                rejected++;
            }

        }
    );


    /*
     * UPDATE SUMMARY
     */

    if (transactionTotal) {

        transactionTotal.textContent =
            allTransactionData.length;

    }

    if (transactionApproved) {

        transactionApproved.textContent =
            approved;

    }

    if (transactionPending) {

        transactionPending.textContent =
            pending;

    }

    if (transactionRejected) {

        transactionRejected.textContent =
            rejected;

    }


    /*
     * EMPTY RESULT
     */

    if (!list.length) {

        transactionsContainer.innerHTML = `

            <div class="request-card">

                <h3>
                    <i class="fa-solid fa-receipt"></i>
                    No Transactions Found
                </h3>

                <p>
                    There are no transactions matching your search or filter.
                </p>

            </div>

        `;

        return;
    }


    /*
     * TRANSACTION CARDS
     */

    list.forEach(
        (transaction) => {

            const type =
                normalizeTransactionType(
                    transaction
                );

            const status =
                transactionStatusLabel(
                    transaction.status
                );

            const statusClass =
                transactionStatusClass(
                    transaction.status
                );

            const amount =
                Number(
                    transaction.amount || 0
                );

            const email =
                transaction.email ||
                "-";

            const uid =
                transaction.uid ||
                "-";

            const transactionId =
                transaction.transactionId ||
                transaction.id ||
                "-";

            const referenceId =
                transaction.referenceId ||
                "-";

            const paymentMethod =
                transaction.paymentMethod ||
                "-";

            const description =
                transaction.description ||
                `${type} transaction`;

            const createdAt =
                transaction.createdAt ||
                transaction.timestamp ||
                transaction.approvedAt ||
                transaction.rejectedAt ||
                0;


            /*
             * SAFE VALUES
             */

            const safeType =
                escapeHTML(type);

            const safeEmail =
                escapeHTML(email);

            const safeUid =
                escapeHTML(uid);

            const safeTransactionId =
                escapeHTML(transactionId);

            const safeReferenceId =
                escapeHTML(referenceId);

            const safePaymentMethod =
                escapeHTML(paymentMethod);

            const safeDescription =
                escapeHTML(description);

            const safeStatus =
                escapeHTML(status);


            /*
             * CARD
             */

            transactionsContainer.innerHTML += `

                <div
                    class="request-card transaction-card"
                    data-transaction-id="${escapeHTML(transaction.id || "")}"
                >

                    <div class="request-card-header">

                        <div class="request-title">

                            <span class="transaction-icon">

                                ${transactionIcon(type)}

                            </span>

                            <h3>
                                ${safeType}
                            </h3>

                        </div>

                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${safeStatus}
                        </span>

                    </div>


                    <div class="request-card-body">

                        <div class="request-info">

                            <p>
                                <strong>
                                    Amount:
                                </strong>

                                ${formatTransactionMoney(amount)}

                            </p>


                            <p>
                                <strong>
                                    Email:
                                </strong>

                                ${safeEmail}

                            </p>


                            <p>
                                <strong>
                                    User UID:
                                </strong>

                                <span
                                    class="transaction-uid"
                                >
                                    ${safeUid}
                                </span>

                            </p>


                            <p>
                                <strong>
                                    Transaction ID:
                                </strong>

                                <span
                                    class="transaction-id"
                                >
                                    ${safeTransactionId}
                                </span>

                            </p>


                            <p>
                                <strong>
                                    Reference:
                                </strong>

                                ${safeReferenceId}

                            </p>


                            <p>
                                <strong>
                                    Payment Method:
                                </strong>

                                ${safePaymentMethod}

                            </p>


                            <p>
                                <strong>
                                    Description:
                                </strong>

                                ${safeDescription}

                            </p>


                            <p>
                                <strong>
                                    Date:
                                </strong>

                                ${formatTransactionDate(
                                    createdAt
                                )}

                            </p>

                        </div>

                    </div>

                </div>

            `;

        }
    );

}


/* =========================================================
   SEARCH EVENT
========================================================= */

if (transactionSearch) {

    transactionSearch.addEventListener(
        "input",
        () => {

            renderFilteredTransactions();

        }
    );

}


/* =========================================================
   FILTER EVENT
========================================================= */

if (transactionFilter) {

    transactionFilter.addEventListener(
        "change",
        () => {

            renderFilteredTransactions();

        }
    );

}


/* =========================================================
   REFRESH TRANSACTIONS
========================================================= */

function refreshTransactions() {

    renderFilteredTransactions();

}


/* =========================================================
   START PART 5
========================================================= */

let part5Started = false;

function startAdminPart5() {

    if (part5Started) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    part5Started = true;

    initializeTransactionsListener();

    console.log(
        "✅ Money Vault Admin Part 5 Loaded"
    );

}


/* =========================================================
   WAIT FOR ADMIN AUTH
========================================================= */

if (currentAdmin) {

    startAdminPart5();

} else {

    const part5Interval =
        setInterval(
            () => {

                if (currentAdmin) {

                    clearInterval(
                        part5Interval
                    );

                    startAdminPart5();

                }

            },
            300
        );

}


/* =========================================================
   GLOBAL ACCESS
========================================================= */

window.refreshTransactions =
    refreshTransactions;

window.renderFilteredTransactions =
    renderFilteredTransactions;

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 6
   SETTINGS MANAGEMENT
   CURRENCY: RWF / FRW

   FEATURES:
   - Admin information
   - System controls
   - Registration ON/OFF
   - Deposit ON/OFF
   - Withdraw ON/OFF
   - Change admin password
   - Database backup
   - Refresh data
   - Safe local settings
   - Does NOT change admins/{uid} = true
========================================================= */


/* =========================================================
   PART 6 STATE
========================================================= */

let part6Started = false;


/* =========================================================
   SETTINGS ELEMENTS
========================================================= */

const adminFullName =
    document.getElementById("adminFullName");

const adminEmail =
    document.getElementById("adminEmail");

const saveAdminBtn =
    document.getElementById("saveAdminBtn");

const allowRegistration =
    document.getElementById("allowRegistration");

const allowDeposit =
    document.getElementById("allowDeposit");

const allowWithdraw =
    document.getElementById("allowWithdraw");

const saveSystemBtn =
    document.getElementById("saveSystemBtn");

const newAdminPassword =
    document.getElementById("newAdminPassword");

const confirmAdminPassword =
    document.getElementById("confirmAdminPassword");

const changePasswordBtn =
    document.getElementById("changePasswordBtn");

const backupDatabaseBtn =
    document.getElementById("backupDatabaseBtn");

const refreshDatabaseBtn =
    document.getElementById("refreshDatabaseBtn");

const appVersion =
    document.getElementById("appVersion");

const firebaseStatus =
    document.getElementById("firebaseStatus");

const databaseStatus =
    document.getElementById("databaseStatus");

const storageStatus =
    document.getElementById("storageStatus");


/* =========================================================
   DEFAULT SETTINGS
========================================================= */

const DEFAULT_SYSTEM_SETTINGS = {

    allowRegistration: true,

    allowDeposit: true,

    allowWithdraw: true

};


/* =========================================================
   SETTINGS STORAGE KEY
========================================================= */

const SYSTEM_SETTINGS_KEY =
    "moneyVaultSystemSettings";


const ADMIN_SETTINGS_KEY =
    "moneyVaultAdminSettings";


/* =========================================================
   SAFE JSON PARSER
========================================================= */

function safeParseJSON(value, fallback) {

    try {

        if (!value) {
            return fallback;
        }

        const parsed =
            JSON.parse(value);

        return parsed || fallback;

    } catch (error) {

        console.warn(
            "Settings JSON parse error:",
            error
        );

        return fallback;

    }

}


/* =========================================================
   LOAD SYSTEM SETTINGS
========================================================= */

function loadSystemSettings() {

    const saved =
        safeParseJSON(
            localStorage.getItem(
                SYSTEM_SETTINGS_KEY
            ),
            DEFAULT_SYSTEM_SETTINGS
        );


    if (allowRegistration) {

        allowRegistration.checked =
            saved.allowRegistration !== false;

    }


    if (allowDeposit) {

        allowDeposit.checked =
            saved.allowDeposit !== false;

    }


    if (allowWithdraw) {

        allowWithdraw.checked =
            saved.allowWithdraw !== false;

    }

}


/* =========================================================
   LOAD ADMIN SETTINGS
========================================================= */

function loadAdminSettings() {

    const saved =
        safeParseJSON(
            localStorage.getItem(
                ADMIN_SETTINGS_KEY
            ),
            {}
        );


    /*
     * Admin name
     */

    if (adminFullName) {

        adminFullName.value =
            saved.name ||
            currentAdmin?.displayName ||
            "Administrator";

    }


    /*
     * Admin email
     */

    if (adminEmail) {

        adminEmail.value =
            saved.email ||
            currentAdmin?.email ||
            "";

    }

}


/* =========================================================
   SAVE ADMIN INFORMATION
========================================================= */

function saveAdminInformation() {

    if (!currentAdmin) {

        alert(
            "Administrator authentication is not ready."
        );

        return;

    }


    const name =
        String(
            adminFullName?.value || ""
        ).trim();

    const email =
        String(
            adminEmail?.value || ""
        ).trim();


    if (!name) {

        alert(
            "Please enter administrator name."
        );

        return;

    }


    if (
        email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        alert(
            "Please enter a valid email."
        );

        return;

    }


    /*
     * IMPORTANT:
     * We do NOT change admins/{uid}.
     *
     * admins/{uid} must remain:
     *
     * admins
     *   UID
     *     true
     *
     * because Part 1 uses it for admin verification.
     */

    localStorage.setItem(
        ADMIN_SETTINGS_KEY,
        JSON.stringify({

            name: name,

            email: email,

            updatedAt: Date.now()

        })
    );


    /*
     * Update visible admin name immediately
     */

    if (adminName) {

        adminName.textContent =
            name;

    }


    alert(
        "Admin information saved successfully."
    );

}


/* =========================================================
   SAVE SYSTEM SETTINGS
========================================================= */

function saveSystemSettings() {

    const settings = {

        allowRegistration:
            allowRegistration
                ? allowRegistration.checked
                : true,

        allowDeposit:
            allowDeposit
                ? allowDeposit.checked
                : true,

        allowWithdraw:
            allowWithdraw
                ? allowWithdraw.checked
                : true,

        updatedAt:
            Date.now()

    };


    localStorage.setItem(
        SYSTEM_SETTINGS_KEY,
        JSON.stringify(settings)
    );


    alert(
        "System settings saved successfully."
    );


    console.log(
        "System settings:",
        settings
    );

}


/* =========================================================
   CHANGE ADMIN PASSWORD
========================================================= */

async function changeAdminPassword() {

    if (!currentAdmin) {

        alert(
            "Administrator authentication is not ready."
        );

        return;

    }


    const password =
        String(
            newAdminPassword?.value || ""
        );

    const confirmPassword =
        String(
            confirmAdminPassword?.value || ""
        );


    if (!password) {

        alert(
            "Please enter a new password."
        );

        return;

    }


    if (password.length < 6) {

        alert(
            "Password must contain at least 6 characters."
        );

        return;

    }


    if (password !== confirmPassword) {

        alert(
            "Passwords do not match."
        );

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to change the administrator password?"
        );


    if (!confirmed) {
        return;
    }


    try {

        if (changePasswordBtn) {

            changePasswordBtn.disabled = true;

            changePasswordBtn.textContent =
                "Changing...";

        }


        /*
         * updatePassword must be imported in Part 1.
         *
         * If your Part 1 currently has:
         *
         * import {
         *   onAuthStateChanged,
         *   signOut
         * } ...
         *
         * change it to:
         *
         * import {
         *   onAuthStateChanged,
         *   signOut,
         *   updatePassword
         * } ...
         */


        if (
            typeof updatePassword !== "function"
        ) {

            throw new Error(
                "updatePassword is not imported in Part 1."
            );

        }


        await updatePassword(
            currentAdmin,
            password
        );


        if (newAdminPassword) {
            newAdminPassword.value = "";
        }

        if (confirmAdminPassword) {
            confirmAdminPassword.value = "";
        }


        alert(
            "Administrator password changed successfully."
        );


    } catch (error) {

        console.error(
            "Password change error:",
            error
        );


        if (
            error.code ===
            "auth/requires-recent-login"
        ) {

            alert(
                "For security, please logout and login again, then change the password."
            );

        } else {

            alert(
                error.message ||
                "Unable to change password."
            );

        }

    } finally {

        if (changePasswordBtn) {

            changePasswordBtn.disabled =
                false;

            changePasswordBtn.textContent =
                "Change Password";

        }

    }

}


/* =========================================================
   GET DATABASE BACKUP
========================================================= */

async function createDatabaseBackup() {

    if (!currentAdmin) {

        alert(
            "Administrator authentication is not ready."
        );

        return;

    }


    const confirmed =
        confirm(
            "Create a backup of the Money Vault database data?"
        );


    if (!confirmed) {
        return;
    }


    try {

        if (backupDatabaseBtn) {

            backupDatabaseBtn.disabled = true;

            backupDatabaseBtn.innerHTML =
                `<i class="fa-solid fa-spinner fa-spin"></i> Creating Backup...`;

        }


        /*
         * We read the main database sections separately.
         *
         * This is intentional because root-level ".read"
         * is disabled in the Firebase Rules.
         */

        const backupPaths = [

            "users",

            "depositRequests",

            "withdrawRequests",

            "vipPlans",

            "vipPurchaseRequests",

            "vipBuyers",

            "transactions",

            "referralCodes",

            "notifications",

            "announcements",

            "transactionIds",

            "bonusRequests",

            "vipReferralBonuses",

            "adminLogs"

        ];


        const backup = {

            application:
                "Money Vault",

            currency:
                "RWF / FRW",

            exportedAt:
                new Date().toISOString(),

            exportedBy:
                currentAdmin.uid,

            data: {}

        };


        for (
            const path of backupPaths
        ) {

            try {

                const snapshot =
                    await get(
                        ref(db, path)
                    );


                backup.data[path] =
                    snapshot.exists()
                        ? snapshot.val()
                        : {};

            } catch (pathError) {

                console.warn(
                    "Backup skipped:",
                    path,
                    pathError
                );


                backup.data[path] = {

                    _backupError:
                        pathError.message ||
                        "Unable to read this path."

                };

            }

        }


        /*
         * Convert backup to JSON
         */

        const json =
            JSON.stringify(
                backup,
                null,
                2
            );


        const blob =
            new Blob(
                [json],
                {
                    type:
                        "application/json"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement("a");


        const date =
            new Date()
                .toISOString()
                .replace(
                    /[:.]/g,
                    "-"
                );


        link.href = url;

        link.download =
            `money-vault-backup-${date}.json`;


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();


        URL.revokeObjectURL(
            url
        );


        alert(
            "Database backup created successfully."
        );


    } catch (error) {

        console.error(
            "Backup error:",
            error
        );


        alert(
            error.message ||
            "Unable to create database backup."
        );

    } finally {

        if (backupDatabaseBtn) {

            backupDatabaseBtn.disabled =
                false;

            backupDatabaseBtn.innerHTML =
                `<i class="fa-solid fa-download"></i> Backup Database`;

        }

    }

}


/* =========================================================
   REFRESH ADMIN DATA
========================================================= */

function refreshAdminData() {

    try {

        /*
         * Refresh current page renderers
         */

        if (
            typeof renderFilteredTransactions ===
            "function"
        ) {

            renderFilteredTransactions();

        }


        if (
            typeof renderUsers ===
            "function" &&
            typeof allUsersData !==
            "undefined"
        ) {

            renderUsers(
                allUsersData
            );

        }


        if (
            typeof renderDeposits ===
            "function"
        ) {

            try {
                renderDeposits();
            } catch (error) {
                console.warn(
                    "Deposit refresh skipped:",
                    error
                );
            }

        }


        if (
            typeof renderWithdraws ===
            "function"
        ) {

            try {
                renderWithdraws();
            } catch (error) {
                console.warn(
                    "Withdraw refresh skipped:",
                    error
                );
            }

        }


        /*
         * Reload settings from local storage
         */

        loadSystemSettings();

        loadAdminSettings();


        alert(
            "Admin data refreshed."
        );


    } catch (error) {

        console.error(
            "Refresh error:",
            error
        );

        alert(
            "Refresh completed with some warnings."
        );

    }

}


/* =========================================================
   SYSTEM STATUS
========================================================= */

function updateSystemStatus() {

    /*
     * APP VERSION
     */

    if (appVersion) {

        appVersion.textContent =
            "v1.0.0";

    }


    /*
     * FIREBASE
     */

    if (firebaseStatus) {

        firebaseStatus.textContent =
            auth && db
                ? "Connected"
                : "Unavailable";

    }


    /*
     * DATABASE
     */

    if (databaseStatus) {

        databaseStatus.textContent =
            db
                ? "Realtime Database"
                : "Unavailable";

    }


    /*
     * STORAGE
     *
     * We do not use Storage for deposits in the
     * current Money Vault architecture.
     */

    if (storageStatus) {

        storageStatus.textContent =
            "Available";

    }

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (saveAdminBtn) {

    saveAdminBtn.addEventListener(
        "click",
        saveAdminInformation
    );

}


if (saveSystemBtn) {

    saveSystemBtn.addEventListener(
        "click",
        saveSystemSettings
    );

}


if (changePasswordBtn) {

    changePasswordBtn.addEventListener(
        "click",
        changeAdminPassword
    );

}


if (backupDatabaseBtn) {

    backupDatabaseBtn.addEventListener(
        "click",
        createDatabaseBackup
    );

}


if (refreshDatabaseBtn) {

    refreshDatabaseBtn.addEventListener(
        "click",
        refreshAdminData
    );

}


/* =========================================================
   START PART 6
========================================================= */

function startAdminPart6() {

    if (part6Started) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    part6Started = true;


    loadSystemSettings();

    loadAdminSettings();

    updateSystemStatus();


    /*
     * Update visible admin name
     */

    const savedAdmin =
        safeParseJSON(
            localStorage.getItem(
                ADMIN_SETTINGS_KEY
            ),
            {}
        );


    if (
        adminName &&
        savedAdmin.name
    ) {

        adminName.textContent =
            savedAdmin.name;

    }


    console.log(
        "✅ Money Vault Admin Part 6 Loaded"
    );

}


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

if (currentAdmin) {

    startAdminPart6();

} else {

    const part6Interval =
        setInterval(
            () => {

                if (currentAdmin) {

                    clearInterval(
                        part6Interval
                    );

                    startAdminPart6();

                }

            },
            300
        );

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.saveAdminInformation =
    saveAdminInformation;

window.saveSystemSettings =
    saveSystemSettings;

window.changeAdminPassword =
    changeAdminPassword;

window.createDatabaseBackup =
    createDatabaseBackup;

window.refreshAdminData =
    refreshAdminData;
/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 7
   VIP PURCHASE REQUESTS
   CURRENCY: RWF / FRW

   FEATURES:
   - Load VIP purchase requests
   - Live Firebase listener
   - Search requests
   - Filter by status
   - Counters
   - User information
   - VIP plan information
   - Approve button
   - Reject button
   - Safe status normalization

   IMPORTANT:
   - VIP approval logic will be handled in the next VIP Part.
   - DO NOT add another VIP request listener elsewhere.
========================================================= */


/* =========================================================
   PART 7 STATE
========================================================= */

let allVipRequestsData = [];

let vipRequestsListenerStarted = false;


/* =========================================================
   PART 7 ELEMENTS
========================================================= */

const vipRequestsContainer =
    document.getElementById("vipRequests") ||
    document.getElementById("vipPurchaseRequests") ||
    document.getElementById("vipRequestsContainer");

const vipRequestSearch =
    document.getElementById("vipRequestSearch") ||
    document.getElementById("vipSearch");

const vipRequestFilter =
    document.getElementById("vipRequestFilter") ||
    document.getElementById("vipFilter");

const vipRequestTotal =
    document.getElementById("vipRequestTotal") ||
    document.getElementById("vipTotal");

const vipRequestPending =
    document.getElementById("vipRequestPending") ||
    document.getElementById("vipPending");

const vipRequestApproved =
    document.getElementById("vipRequestApproved") ||
    document.getElementById("vipApproved");

const vipRequestRejected =
    document.getElementById("vipRequestRejected") ||
    document.getElementById("vipRejected");

const emptyVipRequests =
    document.getElementById("emptyVipRequests") ||
    document.getElementById("emptyVipRequest");


/* =========================================================
   STATUS NORMALIZER
========================================================= */

function normalizeVipRequestStatus(status) {

    const value =
        String(status || "pending")
            .trim()
            .toLowerCase();

    if (value === "approved") {
        return "approved";
    }

    if (value === "rejected") {
        return "rejected";
    }

    return "pending";
}


/* =========================================================
   SAFE HTML
========================================================= */

function escapeVipHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   VIP MONEY FORMAT
========================================================= */

function formatVipMoney(amount) {

    const number = Number(amount || 0);

    return number.toLocaleString("en-US") + " RWF";
}


/* =========================================================
   VIP DATE FORMAT
========================================================= */

function formatVipDate(timestamp) {

    if (!timestamp) {
        return "-";
    }

    const date =
        new Date(Number(timestamp));

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString();
}


/* =========================================================
   STATUS CLASS
========================================================= */

function vipRequestStatusClass(status) {

    const normalized =
        normalizeVipRequestStatus(status);

    if (normalized === "approved") {
        return "approved";
    }

    if (normalized === "rejected") {
        return "rejected";
    }

    return "pending";
}


/* =========================================================
   LOAD VIP REQUESTS
========================================================= */

function initializeVipRequestsListener() {

    if (vipRequestsListenerStarted) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    if (!vipRequestsContainer) {

        console.warn(
            "⚠️ VIP Requests container not found."
        );

        return;
    }

    vipRequestsListenerStarted = true;

    onValue(
        ref(db, "vipPurchaseRequests"),
        (snapshot) => {

            allVipRequestsData = [];

            if (!snapshot.exists()) {

                renderVipRequests();

                return;
            }


            snapshot.forEach((child) => {

                const data =
                    child.val() || {};

                allVipRequestsData.push({

                    id: child.key,

                    ...data

                });

            });


            /* -----------------------------------------
               NEWEST REQUEST FIRST
            ----------------------------------------- */

            allVipRequestsData.sort(
                (a, b) =>
                    Number(b.createdAt || 0) -
                    Number(a.createdAt || 0)
            );


            renderVipRequests();

        },
        (error) => {

            console.error(
                "VIP Requests listener error:",
                error
            );

            if (vipRequestsContainer) {

                vipRequestsContainer.innerHTML = `
                    <div class="empty-state">
                        <h3>Unable to load VIP requests</h3>
                        <p>
                            ${escapeVipHTML(error.message)}
                        </p>
                    </div>
                `;
            }

        }
    );

}


/* =========================================================
   FILTER VIP REQUESTS
========================================================= */

function getFilteredVipRequests() {

    const search =
        String(
            vipRequestSearch?.value || ""
        )
        .trim()
        .toLowerCase();


    const filter =
        String(
            vipRequestFilter?.value || "All"
        )
        .trim()
        .toLowerCase();


    return allVipRequestsData.filter(
        (request) => {

            const status =
                normalizeVipRequestStatus(
                    request.status
                );


            /* -----------------------------------------
               STATUS FILTER
            ----------------------------------------- */

            if (
                filter !== "all" &&
                status !== filter
            ) {
                return false;
            }


            /* -----------------------------------------
               SEARCH
            ----------------------------------------- */

            if (!search) {
                return true;
            }


            const searchableText = [

                request.uid,

                request.email,

                request.fullName,

                request.phone,

                request.planId,

                request.planName,

                request.vip,

                request.paymentMethod,

                request.transactionId,

                request.reference,

                request.id

            ]
            .join(" ")
            .toLowerCase();


            return searchableText.includes(search);

        }
    );

}


/* =========================================================
   RENDER VIP REQUESTS
========================================================= */

function renderVipRequests() {

    if (!vipRequestsContainer) {
        return;
    }


    const total =
        allVipRequestsData.length;


    let pending = 0;
    let approved = 0;
    let rejected = 0;


    allVipRequestsData.forEach(
        (request) => {

            const status =
                normalizeVipRequestStatus(
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


    /* -----------------------------------------
       UPDATE COUNTERS
    ----------------------------------------- */

    if (vipRequestTotal) {
        vipRequestTotal.textContent =
            total;
    }

    if (vipRequestPending) {
        vipRequestPending.textContent =
            pending;
    }

    if (vipRequestApproved) {
        vipRequestApproved.textContent =
            approved;
    }

    if (vipRequestRejected) {
        vipRequestRejected.textContent =
            rejected;
    }


    const filteredRequests =
        getFilteredVipRequests();


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

    if (
        allVipRequestsData.length === 0 ||
        filteredRequests.length === 0
    ) {

        vipRequestsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-crown"></i>
                <h3>
                    ${
                        allVipRequestsData.length === 0
                            ? "No VIP Requests"
                            : "No Matching VIP Requests"
                    }
                </h3>
                <p>
                    VIP purchase requests will appear here.
                </p>
            </div>
        `;

        if (emptyVipRequests) {
            emptyVipRequests.style.display = "none";
        }

        return;
    }


    if (emptyVipRequests) {
        emptyVipRequests.style.display = "none";
    }


    /* -----------------------------------------
       BUILD HTML
    ----------------------------------------- */

    vipRequestsContainer.innerHTML =
        filteredRequests
            .map((request) => {

                const status =
                    normalizeVipRequestStatus(
                        request.status
                    );


                const statusClass =
                    vipRequestStatusClass(
                        request.status
                    );


                const planName =
                    request.planName ||
                    request.vipPlanName ||
                    request.vip ||
                    request.planId ||
                    "VIP Plan";


                const amount =
                    request.amount ??
                    request.price ??
                    request.planPrice ??
                    0;


                const email =
                    request.email ||
                    "-";


                const uid =
                    request.uid ||
                    "-";


                const fullName =
                    request.fullName ||
                    request.name ||
                    "-";


                const phone =
                    request.phone ||
                    request.senderPhone ||
                    "-";


                const paymentMethod =
                    request.paymentMethod ||
                    request.method ||
                    "-";


                const transactionId =
                    request.transactionId ||
                    request.reference ||
                    "-";


                const createdAt =
                    formatVipDate(
                        request.createdAt
                    );


                return `

                    <div
                        class="request-card vip-request-card"
                        data-id="${escapeVipHTML(request.id)}"
                    >

                        <div class="request-card-header">

                            <div>

                                <h3>
                                    <i
                                        class="fa-solid fa-crown"
                                    ></i>

                                    ${escapeVipHTML(planName)}
                                </h3>

                                <p>
                                    Request ID:
                                    <strong>
                                        ${escapeVipHTML(request.id)}
                                    </strong>
                                </p>

                            </div>


                            <span
                                class="status ${statusClass}"
                            >
                                ${escapeVipHTML(
                                    status.charAt(0).toUpperCase() +
                                    status.slice(1)
                                )}
                            </span>

                        </div>


                        <div class="request-details">

                            <p>
                                <strong>
                                    Name:
                                </strong>

                                ${escapeVipHTML(fullName)}
                            </p>


                            <p>
                                <strong>
                                    Email:
                                </strong>

                                ${escapeVipHTML(email)}
                            </p>


                            <p>
                                <strong>
                                    Phone:
                                </strong>

                                ${escapeVipHTML(phone)}
                            </p>


                            <p>
                                <strong>
                                    User UID:
                                </strong>

                                ${escapeVipHTML(uid)}
                            </p>


                            <p>
                                <strong>
                                    VIP Price:
                                </strong>

                                ${formatVipMoney(amount)}
                            </p>


                            <p>
                                <strong>
                                    Payment Method:
                                </strong>

                                ${escapeVipHTML(
                                    paymentMethod
                                )}
                            </p>


                            <p>
                                <strong>
                                    Transaction ID:
                                </strong>

                                ${escapeVipHTML(
                                    transactionId
                                )}
                            </p>


                            <p>
                                <strong>
                                    Created:
                                </strong>

                                ${escapeVipHTML(createdAt)}
                            </p>

                        </div>


                        <div class="action-buttons">

                            ${
                                status === "pending"
                                    ? `

                                        <button
                                            type="button"
                                            class="approveVipRequestBtn approveBtn"
                                            data-id="${escapeVipHTML(request.id)}"
                                        >
                                            <i
                                                class="fa-solid fa-check"
                                            ></i>

                                            Approve
                                        </button>


                                        <button
                                            type="button"
                                            class="rejectVipRequestBtn rejectBtn"
                                            data-id="${escapeVipHTML(request.id)}"
                                        >
                                            <i
                                                class="fa-solid fa-xmark"
                                            ></i>

                                            Reject
                                        </button>

                                    `
                                    : `
                                        <span
                                            class="request-completed"
                                        >
                                            <i
                                                class="fa-solid fa-circle-check"
                                            ></i>

                                            ${
                                                status === "approved"
                                                    ? "Approved"
                                                    : "Rejected"
                                            }
                                        </span>
                                    `
                            }

                        </div>

                    </div>

                `;

            })
            .join("");

}


/* =========================================================
   SEARCH EVENT
========================================================= */

vipRequestSearch?.addEventListener(
    "input",
    () => {

        renderVipRequests();

    }
);


/* =========================================================
   FILTER EVENT
========================================================= */

vipRequestFilter?.addEventListener(
    "change",
    () => {

        renderVipRequests();

    }
);


/* =========================================================
   BUTTON EVENTS
========================================================= */

if (!document.__moneyVaultVipRequestEvents) {

    document.__moneyVaultVipRequestEvents = true;


    document.addEventListener(
        "click",
        (event) => {


            /* -----------------------------------------
               APPROVE
            ----------------------------------------- */

            const approveButton =
                event.target.closest(
                    ".approveVipRequestBtn"
                );


            if (approveButton) {

                const id =
                    approveButton.dataset.id;


                if (
                    id &&
                    typeof window.approveVipRequest ===
                    "function"
                ) {

                    window.approveVipRequest(id);

                }

                return;
            }


            /* -----------------------------------------
               REJECT
            ----------------------------------------- */

            const rejectButton =
                event.target.closest(
                    ".rejectVipRequestBtn"
                );


            if (rejectButton) {

                const id =
                    rejectButton.dataset.id;


                if (
                    id &&
                    typeof window.rejectVipRequest ===
                    "function"
                ) {

                    window.rejectVipRequest(id);

                }

                return;
            }

        }
    );

}


/* =========================================================
   START PART 7
========================================================= */

function startAdminPart7() {

    if (!currentAdmin) {
        return;
    }

    initializeVipRequestsListener();

}


/* =========================================================
   WAIT FOR ADMIN
========================================================= */

if (
    typeof adminState !== "undefined" &&
    adminState.readyPromise
) {

    adminState.readyPromise.then(
        () => {

            startAdminPart7();

        }
    );

} else {

    const waitForPart7Admin =
        setInterval(
            () => {

                if (currentAdmin) {

                    clearInterval(
                        waitForPart7Admin
                    );

                    startAdminPart7();

                }

            },
            300
        );

}


/* =========================================================
   GLOBAL HELPERS
========================================================= */

window.renderVipRequests =
    renderVipRequests;

window.refreshVipRequests =
    renderVipRequests;


/* =========================================================
   PART 7 COMPLETE
========================================================= */

console.log(
    "✅ Money Vault Admin Part 7 Loaded — VIP Requests"
);
/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 8
   VIP APPROVE / REJECT
   CURRENCY: RWF / FRW

   RULES:
   - VIP purchase starts as PENDING
   - Admin approves manually
   - Approval activates the VIP
   - NO daily income is given on approval
   - First claim is 24 hours after approval
   - Each VIP has its own timer
   - Referral bonus = 1,000 RWF
   - Referral bonus is given ONCE only
   - Referral bonus is given only after VIP approval
   - All approval changes use ONE atomic update
========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const VIP_REFERRAL_BONUS = 1000;

const VIP_DAY_MS =
    24 * 60 * 60 * 1000;


/* =========================================================
   APPROVAL LOCK
========================================================= */

const vipApprovalLocks = new Set();


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeVipApprovalStatus(status) {

    const value =
        String(status || "pending")
            .trim()
            .toLowerCase();

    if (value === "approved") {
        return "approved";
    }

    if (value === "rejected") {
        return "rejected";
    }

    return "pending";
}


/* =========================================================
   GET VIP PLAN FROM MASTER LIST
========================================================= */

async function getMasterVipPlan(request) {

    try {

        const vipPlansSnap =
            await get(ref(db, "vipPlans"));


        if (!vipPlansSnap.exists()) {
            return null;
        }


        let selectedPlan = null;


        vipPlansSnap.forEach((child) => {

            const plan =
                child.val() || {};


            /* -----------------------------------------
               FIRST: MATCH PLAN ID
            ----------------------------------------- */

            if (
                request.planId &&
                child.key === request.planId
            ) {

                selectedPlan = {
                    id: child.key,
                    ...plan
                };

                return;
            }


            /* -----------------------------------------
               SECOND: MATCH NAME
            ----------------------------------------- */

            const requestName =
                String(
                    request.planName ||
                    request.vipName ||
                    ""
                )
                .trim()
                .toLowerCase();


            const planName =
                String(
                    plan.name ||
                    plan.vipName ||
                    ""
                )
                .trim()
                .toLowerCase();


            if (
                !selectedPlan &&
                requestName &&
                planName &&
                requestName === planName
            ) {

                selectedPlan = {
                    id: child.key,
                    ...plan
                };

            }

        });


        return selectedPlan;

    } catch (error) {

        console.error(
            "GET MASTER VIP PLAN ERROR:",
            error
        );

        return null;
    }

}


/* =========================================================
   FIND REFERRER
========================================================= */

async function findVipReferrer(request, user) {

    try {

        let refUid =
            request.referredBy ||
            user.referredBy ||
            "";


        refUid =
            String(refUid || "").trim();


        /* -----------------------------------------
           NO REFERRER
        ----------------------------------------- */

        if (!refUid) {
            return null;
        }


        /* -----------------------------------------
           NEVER REFER TO SELF
        ----------------------------------------- */

        if (refUid === request.uid) {
            return null;
        }


        /* -----------------------------------------
           IF referredBy IS A UID
        ----------------------------------------- */

        const directUserSnap =
            await get(
                ref(
                    db,
                    "users/" + refUid
                )
            );


        if (directUserSnap.exists()) {

            return {
                uid: refUid,
                data: directUserSnap.val() || {}
            };

        }


        /* -----------------------------------------
           IF referredBy IS A REFERRAL CODE
        ----------------------------------------- */

        const referralSnap =
            await get(
                ref(
                    db,
                    "referralCodes/" + refUid
                )
            );


        if (
            referralSnap.exists() &&
            referralSnap.val()?.uid
        ) {

            const actualRefUid =
                String(
                    referralSnap.val().uid
                );


            if (
                actualRefUid === request.uid
            ) {
                return null;
            }


            const referrerSnap =
                await get(
                    ref(
                        db,
                        "users/" + actualRefUid
                    )
                );


            if (referrerSnap.exists()) {

                return {
                    uid: actualRefUid,
                    data: referrerSnap.val() || {}
                };

            }

        }


        return null;

    } catch (error) {

        console.error(
            "FIND VIP REFERRER ERROR:",
            error
        );

        return null;
    }

}


/* =========================================================
   APPROVE VIP REQUEST
========================================================= */

async function approveVipRequest(id) {

    if (!id) {
        alert("Invalid VIP request ID.");
        return;
    }


    /* -----------------------------------------
       ADMIN CHECK
    ----------------------------------------- */

    if (!currentAdmin) {

        alert(
            "Admin session is not ready."
        );

        return;
    }


    /* -----------------------------------------
       DOUBLE CLICK PROTECTION
    ----------------------------------------- */

    if (vipApprovalLocks.has(id)) {

        alert(
            "This VIP request is already being processed."
        );

        return;
    }


    if (
        !confirm(
            "Approve this VIP purchase request?"
        )
    ) {
        return;
    }


    vipApprovalLocks.add(id);


    try {

        /* =========================================
           1. READ REQUEST
        ========================================= */

        const requestRef =
            ref(
                db,
                "vipPurchaseRequests/" + id
            );


        const requestSnap =
            await get(requestRef);


        if (!requestSnap.exists()) {

            alert(
                "VIP request not found."
            );

            return;
        }


        const request =
            requestSnap.val() || {};


        /* =========================================
           2. CHECK STATUS
        ========================================= */

        const currentStatus =
            normalizeVipApprovalStatus(
                request.status
            );


        if (currentStatus === "approved") {

            alert(
                "This VIP request is already approved."
            );

            return;
        }


        if (currentStatus === "rejected") {

            alert(
                "This VIP request has already been rejected."
            );

            return;
        }


        if (currentStatus !== "pending") {

            alert(
                "This VIP request is not pending."
            );

            return;
        }


        /* =========================================
           3. VALIDATE UID
        ========================================= */

        const uid =
            String(request.uid || "").trim();


        if (!uid) {

            alert(
                "VIP request has no user UID."
            );

            return;
        }


        /* =========================================
           4. READ USER
        ========================================= */

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const userSnap =
            await get(userRef);


        if (!userSnap.exists()) {

            alert(
                "User account not found."
            );

            return;
        }


        const user =
            userSnap.val() || {};


        /* =========================================
           5. GET MASTER VIP PLAN
        ========================================= */

        const masterPlan =
            await getMasterVipPlan(request);


        if (!masterPlan) {

            alert(
                "VIP plan was not found in vipPlans."
            );

            return;
        }


        /* =========================================
           6. VALIDATE MASTER PLAN
        ========================================= */

        const vipName =
            String(
                masterPlan.name ||
                masterPlan.vipName ||
                request.planName ||
                request.vipName ||
                ""
            ).trim();


        const price =
            Number(
                masterPlan.price ??
                request.price ??
                request.amount ??
                0
            );


        const dailyIncome =
            Number(
                masterPlan.dailyIncome ??
                request.dailyIncome ??
                0
            );


        const duration =
            Number(
                masterPlan.duration ??
                request.duration ??
                request.days ??
                request.durationDays ??
                0
            );


        const totalProfit =
            Number(
                masterPlan.totalProfit ??
                request.totalProfit ??
                0
            );


        if (!vipName) {

            alert(
                "VIP plan name is missing."
            );

            return;
        }


        if (
            !Number.isFinite(price) ||
            price < 0
        ) {

            alert(
                "Invalid VIP price."
            );

            return;
        }


        if (
            !Number.isFinite(dailyIncome) ||
            dailyIncome < 0
        ) {

            alert(
                "Invalid VIP daily income."
            );

            return;
        }


        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {

            alert(
                "Invalid VIP duration."
            );

            return;
        }


        if (
            !Number.isFinite(totalProfit) ||
            totalProfit < 0
        ) {

            alert(
                "Invalid VIP total profit."
            );

            return;
        }


        /* =========================================
           7. APPROVAL TIME
        ========================================= */

        const approvedAt =
            Date.now();


        const startDate =
            approvedAt;


        const endDate =
            approvedAt +
            (duration * VIP_DAY_MS);


        /* =========================================
           8. CREATE UNIQUE VIP OWNER ID
        ========================================= */

        const vipOwnerRef =
            push(
                ref(
                    db,
                    "users/" +
                    uid +
                    "/vipPlans"
                )
            );


        const vipBuyerRef =
            push(
                ref(db, "vipBuyers")
            );


        /* =========================================
           9. PREPARE VIP DATA
        ========================================= */

        const vipData = {

            planId:
                masterPlan.id,

            vipName:
                vipName,

            name:
                vipName,

            price:
                price,

            dailyIncome:
                dailyIncome,

            totalProfit:
                totalProfit,

            duration:
                duration,

            totalDays:
                duration,

            remainingDays:
                duration,

            status:
                "active",

            purchasedAt:
                Number(
                    request.createdAt ||
                    approvedAt
                ),

            approvedAt:
                approvedAt,

            startDate:
                startDate,

            endDate:
                endDate,

            /*
             * IMPORTANT:
             * No income at approval.
             *
             * lastClaim = approval time
             * therefore first claim becomes available
             * after 24 hours.
             */

            lastClaim:
                approvedAt,

            lastClaimTime:
                approvedAt,

            lastProfitTime:
                approvedAt,

            totalEarned:
                0,

            earned:
                0,

            claimedAmount:
                0

        };


        /* =========================================
           10. PREPARE VIP BUYER DATA
        ========================================= */

        const vipBuyerData = {

            uid:
                uid,

            email:
                request.email ||
                user.email ||
                "",

            fullName:
                request.fullName ||
                user.fullName ||
                "",

            phone:
                request.phone ||
                user.phone ||
                "",

            planId:
                masterPlan.id,

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

            totalDays:
                duration,

            status:
                "active",

            requestId:
                id,

            vipPlanId:
                vipOwnerRef.key,

            purchasedAt:
                Number(
                    request.createdAt ||
                    approvedAt
                ),

            approvedAt:
                approvedAt,

            startDate:
                startDate,

            endDate:
                endDate,

            lastClaim:
                approvedAt,

            totalEarned:
                0,

            claimedAmount:
                0

        };


        /* =========================================
           11. BUILD ATOMIC UPDATE
        ========================================= */

        const updates = {};


        /* -----------------------------------------
           SAVE VIP UNDER USER
        ----------------------------------------- */

        updates[
            "users/" +
            uid +
            "/vipPlans/" +
            vipOwnerRef.key
        ] = vipData;


        /* -----------------------------------------
           SAVE VIP BUYER
        ----------------------------------------- */

        updates[
            "vipBuyers/" +
            vipBuyerRef.key
        ] = vipBuyerData;


        /* =========================================
           12. APPROVE REQUEST
        ========================================= */

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
        ] = currentAdmin.uid;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/vipBuyerId"
        ] = vipBuyerRef.key;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/vipPlanId"
        ] = vipOwnerRef.key;


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
            "/dailyIncome"
        ] = dailyIncome;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/totalProfit"
        ] = totalProfit;


        /* =========================================
           13. REFERRAL BONUS
        ========================================= */

        const referrer =
            await findVipReferrer(
                request,
                user
            );


        let referralBonusGiven =
            false;


        if (
            referrer &&
            !request.referralBonusGiven
        ) {

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


            const currentReferralCount =
                Number(
                    refData.referralCount || 0
                );


            /* -----------------------------------------
               REFERRER BALANCE
            ----------------------------------------- */

            updates[
                "users/" +
                refUid +
                "/balance"
            ] =
                currentBalance +
                VIP_REFERRAL_BONUS;


            /* -----------------------------------------
               REFERRAL BONUS TOTAL
            ----------------------------------------- */

            updates[
                "users/" +
                refUid +
                "/referralBonus"
            ] =
                currentBonus +
                VIP_REFERRAL_BONUS;


            /* -----------------------------------------
               REFERRAL EARNINGS
            ----------------------------------------- */

            updates[
                "users/" +
                refUid +
                "/referralEarnings"
            ] =
                currentEarnings +
                VIP_REFERRAL_BONUS;


            /* -----------------------------------------
               REFERRAL COUNT
            ----------------------------------------- */

            updates[
                "users/" +
                refUid +
                "/referralCount"
            ] =
                currentReferralCount + 1;


            /* -----------------------------------------
               REFERRAL TRANSACTION
            ----------------------------------------- */

            const referralTxRef =
                push(
                    ref(
                        db,
                        "transactions"
                    )
                );


            updates[
                "transactions/" +
                referralTxRef.key
            ] = {

                uid:
                    refUid,

                type:
                    "referralBonus",

                transactionType:
                    "referralBonus",

                amount:
                    VIP_REFERRAL_BONUS,

                currency:
                    "RWF",

                sourceUid:
                    uid,

                sourceRequestId:
                    id,

                vipName:
                    vipName,

                status:
                    "completed",

                description:
                    "VIP referral bonus",

                createdAt:
                    approvedAt,

                timestamp:
                    approvedAt

            };


            /* -----------------------------------------
               REFERRAL BONUS RECORD
            ----------------------------------------- */

            const referralRecordRef =
                push(
                    ref(
                        db,
                        "vipReferralBonuses"
                    )
                );


            updates[
                "vipReferralBonuses/" +
                referralRecordRef.key
            ] = {

                referrerUid:
                    refUid,

                referredUserUid:
                    uid,

                requestId:
                    id,

                vipName:
                    vipName,

                amount:
                    VIP_REFERRAL_BONUS,

                currency:
                    "RWF",

                status:
                    "completed",

                createdAt:
                    approvedAt

            };


            /* -----------------------------------------
               SAVE BONUS INFO ON REQUEST
            ----------------------------------------- */

            updates[
                "vipPurchaseRequests/" +
                id +
                "/referralBonus"
            ] =
                VIP_REFERRAL_BONUS;


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
            ] =
                true;


            referralBonusGiven =
                true;

        } else {

            /* -----------------------------------------
               NO BONUS
            ----------------------------------------- */

            updates[
                "vipPurchaseRequests/" +
                id +
                "/referralBonus"
            ] = 0;


            updates[
                "vipPurchaseRequests/" +
                id +
                "/referralBonusGiven"
            ] =
                Boolean(
                    request.referralBonusGiven
                );

        }


        /* =========================================
           14. SAVE EVERYTHING AT ONCE
        ========================================= */

        await update(
            ref(db),
            updates
        );


        /* =========================================
           15. SUCCESS
        ========================================= */

        let message =
            "VIP approved successfully.";


        message +=
            "\n\nVIP: " +
            vipName;


        message +=
            "\nDuration: " +
            duration +
            " days";


        message +=
            "\nDaily Income: " +
            dailyIncome.toLocaleString() +
            " RWF";


        message +=
            "\n\nFirst daily claim: after 24 hours.";


        message +=
            "\nNo income was credited at approval.";


        if (referralBonusGiven) {

            message +=
                "\n\nReferral bonus: 1,000 RWF.";

        } else {

            message +=
                "\n\nNo referral bonus was given.";

        }


        alert(message);


        /* -----------------------------------------
           REFRESH DISPLAY
        ----------------------------------------- */

        if (
            typeof renderVipRequests ===
            "function"
        ) {

            renderVipRequests();

        }

    } catch (error) {

        console.error(
            "APPROVE VIP ERROR:",
            error
        );


        /*
         * IMPORTANT:
         *
         * We DO NOT restore the request to pending.
         *
         * Because approval uses ONE atomic
         * Firebase update, either EVERYTHING
         * is saved or NOTHING is saved.
         *
         * This prevents the old problem where
         * the request remained pending after
         * part of the operation had succeeded.
         */


        alert(
            "VIP approval failed:\n\n" +
            (
                error?.message ||
                "Unknown error"
            )
        );

    } finally {

        vipApprovalLocks.delete(id);

    }

}


/* =========================================================
   REJECT VIP REQUEST
========================================================= */

async function rejectVipRequest(id) {

    if (!id) {

        alert(
            "Invalid VIP request ID."
        );

        return;
    }


    if (!currentAdmin) {

        alert(
            "Admin session is not ready."
        );

        return;
    }


    if (
        !confirm(
            "Reject this VIP purchase request?"
        )
    ) {

        return;
    }


    try {

        const requestRef =
            ref(
                db,
                "vipPurchaseRequests/" +
                id
            );


        const requestSnap =
            await get(requestRef);


        if (!requestSnap.exists()) {

            alert(
                "VIP request not found."
            );

            return;
        }


        const request =
            requestSnap.val() || {};


        const status =
            normalizeVipApprovalStatus(
                request.status
            );


        if (status === "approved") {

            alert(
                "This VIP request is already approved."
            );

            return;
        }


        if (status === "rejected") {

            alert(
                "This VIP request is already rejected."
            );

            return;
        }


        if (status !== "pending") {

            alert(
                "This VIP request is not pending."
            );

            return;
        }


        const now =
            Date.now();


        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    now,

                rejectedBy:
                    currentAdmin.uid

            }
        );


        alert(
            "VIP request rejected successfully."
        );


        if (
            typeof renderVipRequests ===
            "function"
        ) {

            renderVipRequests();

        }

    } catch (error) {

        console.error(
            "REJECT VIP ERROR:",
            error
        );


        alert(
            "VIP rejection failed:\n\n" +
            (
                error?.message ||
                "Unknown error"
            )
        );

    }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;


/* =========================================================
   PART 8 READY
========================================================= */

console.log(
    "✅ Money Vault Admin Part 8 Loaded — VIP Approve / Reject"
);
/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 9 — VIP BUYERS / ACTIVE VIP MANAGEMENT
   CURRENCY: RWF / FRW

   FEATURES:
   - Load approved VIP buyers
   - Show user information
   - Show VIP plan information
   - Show price / daily income / total profit
   - Show active / expired status
   - Show start / end dates
   - Search
   - Filter
   - Counters
   - Real-time Firebase listener
   - Safe HTML escaping
========================================================= */


/* =========================================================
   PART 9 STATE
========================================================= */

let allVipBuyersData = {};
let vipBuyersListenerStarted = false;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const vipBuyersContainer =
    document.getElementById("vipBuyersContainer") ||
    document.getElementById("vipBuyers") ||
    document.getElementById("vipBuyerList");

const vipBuyerSearch =
    document.getElementById("vipBuyerSearch") ||
    document.getElementById("vipSearch");

const vipBuyerFilter =
    document.getElementById("vipBuyerFilter") ||
    document.getElementById("vipFilter");

const vipBuyerTotal =
    document.getElementById("vipBuyerTotal") ||
    document.getElementById("vipBuyersTotal") ||
    document.getElementById("vipTotal");

const vipBuyerActive =
    document.getElementById("vipBuyerActive") ||
    document.getElementById("vipBuyersActive") ||
    document.getElementById("vipActive");

const vipBuyerExpired =
    document.getElementById("vipBuyerExpired") ||
    document.getElementById("vipBuyersExpired") ||
    document.getElementById("vipExpired");

const emptyVipBuyers =
    document.getElementById("emptyVipBuyers") ||
    document.getElementById("emptyVipBuyer");


/* =========================================================
   SAFE HTML
========================================================= */

function escapeVipBuyerHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   MONEY FORMAT
========================================================= */

function formatVipBuyerMoney(value) {

    const amount = Number(value || 0);

    return amount.toLocaleString("en-US") + " RWF";
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatVipBuyerDate(value) {

    const timestamp = Number(value || 0);

    if (!timestamp) {
        return "-";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeVipBuyerStatus(status) {

    const value =
        String(status || "")
            .trim()
            .toLowerCase();

    if (value === "active") {
        return "active";
    }

    if (value === "expired") {
        return "expired";
    }

    if (value === "pending") {
        return "pending";
    }

    if (value === "rejected") {
        return "rejected";
    }

    return value || "unknown";
}


/* =========================================================
   CALCULATE VIP STATUS
========================================================= */

function getVipBuyerStatus(vip) {

    const savedStatus =
        normalizeVipBuyerStatus(vip?.status);

    /*
       If Firebase already says expired,
       keep it expired.
    */

    if (savedStatus === "expired") {
        return "expired";
    }

    /*
       Only active VIPs can automatically
       become expired.
    */

    if (savedStatus === "active") {

        const endDate =
            Number(
                vip?.endDate ||
                vip?.expiryDate ||
                0
            );

        if (endDate > 0 && Date.now() >= endDate) {
            return "expired";
        }

        return "active";
    }

    return savedStatus;
}


/* =========================================================
   STATUS CLASS
========================================================= */

function vipBuyerStatusClass(status) {

    switch (status) {

        case "active":
            return "status-approved";

        case "expired":
            return "status-rejected";

        case "pending":
            return "status-pending";

        default:
            return "status-pending";
    }
}


/* =========================================================
   LOAD VIP BUYERS
========================================================= */

function initializeVipBuyersListener() {

    if (vipBuyersListenerStarted) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    vipBuyersListenerStarted = true;

    const vipBuyersRef =
        ref(db, "vipBuyers");

    onValue(
        vipBuyersRef,
        (snapshot) => {

            allVipBuyersData = {};

            if (!snapshot.exists()) {

                renderVipBuyers();

                return;
            }

            snapshot.forEach((child) => {

                allVipBuyersData[child.key] =
                    {
                        id: child.key,
                        ...child.val()
                    };
            });

            renderVipBuyers();

        },
        (error) => {

            console.error(
                "VIP Buyers listener error:",
                error
            );

            if (vipBuyersContainer) {

                vipBuyersContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <h3>Failed to load VIP buyers</h3>
                        <p>${escapeVipBuyerHTML(error.message)}</p>
                    </div>
                `;
            }
        }
    );
}


/* =========================================================
   FILTER + SEARCH
========================================================= */

function getFilteredVipBuyers() {

    const search =
        String(
            vipBuyerSearch?.value || ""
        )
        .trim()
        .toLowerCase();

    const filter =
        String(
            vipBuyerFilter?.value || "All"
        )
        .trim()
        .toLowerCase();

    return Object.values(allVipBuyersData)
        .filter((vip) => {

            const status =
                getVipBuyerStatus(vip);

            /*
               STATUS FILTER
            */

            if (
                filter !== "" &&
                filter !== "all" &&
                filter !== "all vip buyers" &&
                filter !== status
            ) {

                return false;
            }


            /*
               SEARCH
            */

            if (!search) {
                return true;
            }

            const searchableText = [

                vip.uid,

                vip.userId,

                vip.email,

                vip.fullName,

                vip.phone,

                vip.name,

                vip.vipName,

                vip.planName,

                vip.planId,

                vip.vipPlanId,

                vip.requestId,

                vip.paymentMethod,

                vip.transactionId,

                vip.status

            ]
            .map(value =>
                String(value || "")
                    .toLowerCase()
            )
            .join(" ");

            return searchableText.includes(search);

        })
        .sort((a, b) => {

            const aTime =
                Number(
                    a.approvedAt ||
                    a.purchasedAt ||
                    a.createdAt ||
                    0
                );

            const bTime =
                Number(
                    b.approvedAt ||
                    b.purchasedAt ||
                    b.createdAt ||
                    0
                );

            return bTime - aTime;
        });
}


/* =========================================================
   UPDATE VIP BUYER COUNTERS
========================================================= */

function updateVipBuyerCounters() {

    const all =
        Object.values(allVipBuyersData);

    let active = 0;
    let expired = 0;

    all.forEach((vip) => {

        const status =
            getVipBuyerStatus(vip);

        if (status === "active") {
            active++;
        }

        if (status === "expired") {
            expired++;
        }
    });


    if (vipBuyerTotal) {
        vipBuyerTotal.textContent =
            all.length;
    }

    if (vipBuyerActive) {
        vipBuyerActive.textContent =
            active;
    }

    if (vipBuyerExpired) {
        vipBuyerExpired.textContent =
            expired;
    }
}


/* =========================================================
   RENDER VIP BUYERS
========================================================= */

function renderVipBuyers() {

    updateVipBuyerCounters();

    if (!vipBuyersContainer) {
        return;
    }

    const buyers =
        getFilteredVipBuyers();

    vipBuyersContainer.innerHTML = "";


    /*
       NO DATA AT ALL
    */

    if (
        Object.keys(allVipBuyersData).length === 0
    ) {

        if (emptyVipBuyers) {
            emptyVipBuyers.style.display = "block";
        }

        vipBuyersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-crown"></i>
                <h3>No VIP Buyers Found</h3>
                <p>Approved VIP purchases will appear here.</p>
            </div>
        `;

        return;
    }


    /*
       FILTER RETURNED NOTHING
    */

    if (buyers.length === 0) {

        if (emptyVipBuyers) {
            emptyVipBuyers.style.display = "block";
        }

        vipBuyersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-magnifying-glass"></i>
                <h3>No Matching VIP Buyer</h3>
                <p>Try another search or filter.</p>
            </div>
        `;

        return;
    }


    if (emptyVipBuyers) {
        emptyVipBuyers.style.display = "none";
    }


    /*
       RENDER CARDS
    */

    buyers.forEach((vip) => {

        const status =
            getVipBuyerStatus(vip);

        const statusClass =
            vipBuyerStatusClass(status);

        const statusLabel =
            status.charAt(0).toUpperCase() +
            status.slice(1);


        const userName =
            vip.fullName ||
            vip.userName ||
            vip.name ||
            "Unknown User";

        const email =
            vip.email ||
            "-";

        const phone =
            vip.phone ||
            vip.senderPhone ||
            "-";

        const uid =
            vip.uid ||
            vip.userId ||
            "-";

        const vipName =
            vip.vipName ||
            vip.planName ||
            vip.name ||
            "VIP Plan";

        const planId =
            vip.planId ||
            vip.vipPlanId ||
            "-";

        const price =
            vip.price ||
            vip.amount ||
            0;

        const dailyIncome =
            vip.dailyIncome ||
            0;

        const totalProfit =
            vip.totalProfit ||
            0;

        const duration =
            vip.duration ||
            vip.durationDays ||
            vip.totalDays ||
            0;

        const startDate =
            vip.startDate ||
            vip.approvedAt ||
            vip.purchasedAt ||
            0;

        const endDate =
            vip.endDate ||
            vip.expiryDate ||
            0;

        const approvedAt =
            vip.approvedAt ||
            vip.purchasedAt ||
            vip.createdAt ||
            0;

        const requestId =
            vip.requestId ||
            "-";

        const transactionId =
            vip.transactionId ||
            vip.paymentTransactionId ||
            "-";


        const card =
            document.createElement("div");

        card.className =
            "request-card vip-buyer-card";


        card.innerHTML = `

            <div class="request-card-header">

                <div>
                    <h3>
                        <i class="fa-solid fa-crown"></i>
                        ${escapeVipBuyerHTML(vipName)}
                    </h3>

                    <small>
                        Buyer ID:
                        ${escapeVipBuyerHTML(vip.id)}
                    </small>
                </div>

                <span
                    class="status-badge ${statusClass}">
                    ${escapeVipBuyerHTML(statusLabel)}
                </span>

            </div>


            <div class="request-card-body">

                <div class="request-info">

                    <p>
                        <strong>
                            <i class="fa-solid fa-user"></i>
                            User
                        </strong>

                        ${escapeVipBuyerHTML(userName)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-envelope"></i>
                            Email
                        </strong>

                        ${escapeVipBuyerHTML(email)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-phone"></i>
                            Phone
                        </strong>

                        ${escapeVipBuyerHTML(phone)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-fingerprint"></i>
                            UID
                        </strong>

                        ${escapeVipBuyerHTML(uid)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-layer-group"></i>
                            Plan ID
                        </strong>

                        ${escapeVipBuyerHTML(planId)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-money-bill-wave"></i>
                            Price
                        </strong>

                        ${formatVipBuyerMoney(price)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-coins"></i>
                            Daily Income
                        </strong>

                        ${formatVipBuyerMoney(dailyIncome)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-chart-line"></i>
                            Total Profit
                        </strong>

                        ${formatVipBuyerMoney(totalProfit)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-calendar-days"></i>
                            Duration
                        </strong>

                        ${escapeVipBuyerHTML(duration)}
                        Days
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-play"></i>
                            Start Date
                        </strong>

                        ${formatVipBuyerDate(startDate)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-stop"></i>
                            End Date
                        </strong>

                        ${formatVipBuyerDate(endDate)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-check"></i>
                            Approved
                        </strong>

                        ${formatVipBuyerDate(approvedAt)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-receipt"></i>
                            Request ID
                        </strong>

                        ${escapeVipBuyerHTML(requestId)}
                    </p>


                    <p>
                        <strong>
                            <i class="fa-solid fa-hashtag"></i>
                            Transaction ID
                        </strong>

                        ${escapeVipBuyerHTML(transactionId)}
                    </p>

                </div>

            </div>

        `;


        vipBuyersContainer.appendChild(card);

    });
}


/* =========================================================
   SEARCH EVENT
========================================================= */

vipBuyerSearch?.addEventListener(
    "input",
    () => {

        renderVipBuyers();

    }
);


/* =========================================================
   FILTER EVENT
========================================================= */

vipBuyerFilter?.addEventListener(
    "change",
    () => {

        renderVipBuyers();

    }
);


/* =========================================================
   MANUAL REFRESH
========================================================= */

function refreshVipBuyers() {

    renderVipBuyers();

}


/* =========================================================
   AUTO START
========================================================= */

function startAdminPart9() {

    if (vipBuyersListenerStarted) {
        return;
    }

    if (
        typeof currentAdmin !== "undefined" &&
        currentAdmin
    ) {

        initializeVipBuyersListener();

        return;
    }


    /*
       Wait for Part 1 authentication.
    */

    if (
        typeof adminState !== "undefined" &&
        adminState.readyPromise
    ) {

        adminState.readyPromise
            .then(() => {

                initializeVipBuyersListener();

            })
            .catch((error) => {

                console.error(
                    "Part 9 admin ready error:",
                    error
                );

            });

        return;
    }


    /*
       Fallback polling.
    */

    let attempts = 0;

    const waitForAdmin =
        setInterval(() => {

            attempts++;

            if (
                typeof currentAdmin !== "undefined" &&
                currentAdmin
            ) {

                clearInterval(waitForAdmin);

                initializeVipBuyersListener();

            }

            if (attempts >= 60) {

                clearInterval(waitForAdmin);

                console.warn(
                    "PART 9: Admin not ready."
                );

            }

        }, 500);

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.renderVipBuyers =
    renderVipBuyers;

window.refreshVipBuyers =
    refreshVipBuyers;


/* =========================================================
   START
========================================================= */

startAdminPart9();


console.log(
    "✅ MONEY VAULT ADMIN PART 9 — VIP BUYERS LOADED"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 10 — USERS MANAGEMENT

   FEATURES:
   - Real-time users list
   - Search users
   - Active users counter
   - Blocked users counter
   - View user details
   - Block user
   - Activate user
   - Safe HTML escaping
   - RWF / FRW
   - Admin only
========================================================= */


/* =========================================================
   PART 10 STATE
========================================================= */

let allUsersManagementData = {};
let usersManagementListenerStarted = false;
let selectedUserIdForModal = null;


/* =========================================================
   DOM ELEMENTS
========================================================= */

const usersContainer =
    document.getElementById("usersContainer");

const allUsers =
    document.getElementById("allUsers");

const activeUsers =
    document.getElementById("activeUsers");

const blockedUsers =
    document.getElementById("blockedUsers");

const userSearch =
    document.getElementById("userSearch");

const emptyUsers =
    document.getElementById("emptyUsers");


/* =========================================================
   USER MODAL
========================================================= */

const userModal =
    document.getElementById("userModal");

const closeUserModal =
    document.getElementById("closeUserModal");

const userFullName =
    document.getElementById("userFullName");

const userEmail =
    document.getElementById("userEmail");

const userPhone =
    document.getElementById("userPhone");

const userBalance =
    document.getElementById("userBalance");

const userDeposits =
    document.getElementById("userDeposits");

const userWithdraws =
    document.getElementById("userWithdraws");

const userVip =
    document.getElementById("userVip");

const userJoined =
    document.getElementById("userJoined");

const blockUserBtn =
    document.getElementById("blockUserBtn");

const activateUserBtn =
    document.getElementById("activateUserBtn");


/* =========================================================
   SAFE HTML
========================================================= */

function escapeUserHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   MONEY FORMAT
========================================================= */

function formatUserMoney(value) {

    const amount = Number(value || 0);

    return amount.toLocaleString("en-US") + " RWF";
}


/* =========================================================
   DATE FORMAT
========================================================= */

function formatUserDate(value) {

    const timestamp = Number(value || 0);

    if (!timestamp) {
        return "-";
    }

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}


/* =========================================================
   NORMALIZE USER STATUS
========================================================= */

function normalizeUserStatus(status) {

    const value =
        String(status || "")
            .trim()
            .toLowerCase();

    if (
        value === "blocked" ||
        value === "block" ||
        value === "disabled"
    ) {
        return "blocked";
    }

    return "active";
}


/* =========================================================
   GET USER VIP NAME
========================================================= */

function getUserVipName(user) {

    if (user.vipPlan) {
        return user.vipPlan;
    }

    if (user.vip) {
        return user.vip;
    }

    if (user.vipName) {
        return user.vipName;
    }

    if (
        user.vipPlans &&
        typeof user.vipPlans === "object"
    ) {

        const activePlans =
            Object.values(user.vipPlans)
                .filter(plan => {

                    return (
                        String(plan?.status || "")
                            .toLowerCase() === "active"
                    );

                });

        if (activePlans.length > 0) {

            return activePlans
                .map(plan =>
                    plan.vipName ||
                    plan.name ||
                    "VIP"
                )
                .join(", ");
        }
    }

    return "None";
}


/* =========================================================
   UPDATE USER COUNTERS
========================================================= */

function updateUserManagementCounters() {

    const users =
        Object.values(allUsersManagementData);

    let active = 0;
    let blocked = 0;

    users.forEach(user => {

        const status =
            normalizeUserStatus(user.status);

        if (status === "blocked") {
            blocked++;
        } else {
            active++;
        }
    });


    if (allUsers) {
        allUsers.textContent =
            users.length;
    }

    if (activeUsers) {
        activeUsers.textContent =
            active;
    }

    if (blockedUsers) {
        blockedUsers.textContent =
            blocked;
    }
}


/* =========================================================
   LOAD USERS
========================================================= */

function initializeUsersManagementListener() {

    if (usersManagementListenerStarted) {
        return;
    }

    if (!currentAdmin) {
        return;
    }

    usersManagementListenerStarted = true;

    const usersRef =
        ref(db, "users");

    onValue(
        usersRef,
        (snapshot) => {

            allUsersManagementData = {};

            if (snapshot.exists()) {

                snapshot.forEach(child => {

                    allUsersManagementData[child.key] = {

                        uid: child.key,

                        ...child.val()

                    };

                });

            }

            renderUsersManagement();

        },
        (error) => {

            console.error(
                "Users listener error:",
                error
            );

            if (usersContainer) {

                usersContainer.innerHTML = `
                    <div class="empty-state">

                        <i class="fa-solid fa-triangle-exclamation"></i>

                        <h3>
                            Failed to Load Users
                        </h3>

                        <p>
                            ${escapeUserHTML(error.message)}
                        </p>

                    </div>
                `;
            }
        }
    );
}


/* =========================================================
   FILTER USERS BY SEARCH
========================================================= */

function getFilteredUsersManagement() {

    const keyword =
        String(
            userSearch?.value || ""
        )
        .trim()
        .toLowerCase();


    const users =
        Object.values(allUsersManagementData);


    if (!keyword) {
        return users;
    }


    return users.filter(user => {

        const searchableText = [

            user.uid,

            user.email,

            user.fullName,

            user.name,

            user.phone,

            user.country,

            user.referralCode,

            user.referredBy,

            user.status,

            user.vip,

            user.vipPlan

        ]
        .map(value =>
            String(value || "")
                .toLowerCase()
        )
        .join(" ");


        return searchableText.includes(keyword);

    });
}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsersManagement() {

    updateUserManagementCounters();


    if (!usersContainer) {
        return;
    }


    const users =
        getFilteredUsersManagement();


    usersContainer.innerHTML = "";


    /*
       NO USERS
    */

    if (
        Object.keys(allUsersManagementData).length === 0
    ) {

        if (emptyUsers) {
            emptyUsers.style.display = "block";
        }

        usersContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-users"></i>

                <h3>
                    No Users Found
                </h3>

                <p>
                    Registered users will appear here.
                </p>

            </div>

        `;

        return;
    }


    /*
       SEARCH RETURNED NOTHING
    */

    if (users.length === 0) {

        if (emptyUsers) {
            emptyUsers.style.display = "block";
        }

        usersContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-magnifying-glass"></i>

                <h3>
                    No Matching User
                </h3>

                <p>
                    Try another name, email, phone or UID.
                </p>

            </div>

        `;

        return;
    }


    if (emptyUsers) {
        emptyUsers.style.display = "none";
    }


    /*
       SORT NEWEST USERS FIRST
    */

    users.sort((a, b) => {

        return Number(
            b.createdAt || 0
        ) - Number(
            a.createdAt || 0
        );

    });


    /*
       RENDER USER CARDS
    */

    users.forEach(user => {

        const uid =
            user.uid;

        const status =
            normalizeUserStatus(user.status);

        const isBlocked =
            status === "blocked";

        const userName =
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

        const vipName =
            getUserVipName(user);


        const card =
            document.createElement("div");

        card.className =
            "user-card";


        card.innerHTML = `

            <div class="user-card-header">

                <div>

                    <h3>
                        <i class="fa-solid fa-user"></i>

                        ${escapeUserHTML(userName)}
                    </h3>

                    <small>
                        UID:
                        ${escapeUserHTML(uid)}
                    </small>

                </div>


                <span
                    class="status-badge ${
                        isBlocked
                            ? "status-rejected"
                            : "status-approved"
                    }">

                    ${
                        isBlocked
                            ? "Blocked"
                            : "Active"
                    }

                </span>

            </div>


            <div class="user-card-body">

                <p>

                    <strong>
                        <i class="fa-solid fa-envelope"></i>
                        Email:
                    </strong>

                    ${escapeUserHTML(email)}

                </p>


                <p>

                    <strong>
                        <i class="fa-solid fa-phone"></i>
                        Phone:
                    </strong>

                    ${escapeUserHTML(phone)}

                </p>


                <p>

                    <strong>
                        <i class="fa-solid fa-wallet"></i>
                        Balance:
                    </strong>

                    ${formatUserMoney(balance)}

                </p>


                <p>

                    <strong>
                        <i class="fa-solid fa-crown"></i>
                        VIP:
                    </strong>

                    ${escapeUserHTML(vipName)}

                </p>


                <p>

                    <strong>
                        <i class="fa-solid fa-calendar"></i>
                        Joined:
                    </strong>

                    ${formatUserDate(user.createdAt)}

                </p>

            </div>


            <div class="action-buttons">

                <button
                    type="button"
                    class="viewUserBtn"
                    data-id="${escapeUserHTML(uid)}">

                    <i class="fa-solid fa-eye"></i>

                    View

                </button>

            </div>

        `;


        usersContainer.appendChild(card);

    });
}


/* =========================================================
   SEARCH USERS
========================================================= */

userSearch?.addEventListener(
    "input",
    () => {

        renderUsersManagement();

    }
);


/* =========================================================
   OPEN USER DETAILS
========================================================= */

async function openUserDetails(uid) {

    try {

        if (!currentAdmin) {

            alert("Admin authentication required.");

            return;
        }


        if (!uid) {
            return;
        }


        const user =
            allUsersManagementData[uid];


        if (!user) {

            const userSnap =
                await get(
                    ref(db, "users/" + uid)
                );

            if (!userSnap.exists()) {

                alert("User not found.");

                return;
            }

            allUsersManagementData[uid] = {

                uid,

                ...userSnap.val()

            };

        }


        const selectedUser =
            allUsersManagementData[uid];


        selectedUserIdForModal =
            uid;


        /*
           FILL MODAL
        */

        if (userFullName) {

            userFullName.textContent =
                selectedUser.fullName ||
                selectedUser.name ||
                "Unknown User";

        }


        if (userEmail) {

            userEmail.textContent =
                selectedUser.email ||
                "-";

        }


        if (userPhone) {

            userPhone.textContent =
                selectedUser.phone ||
                "-";

        }


        if (userBalance) {

            userBalance.textContent =
                formatUserMoney(
                    selectedUser.balance
                );

        }


        if (userDeposits) {

            userDeposits.textContent =
                formatUserMoney(
                    selectedUser.totalDeposits ??
                    selectedUser.totalDeposit ??
                    0
                );

        }


        if (userWithdraws) {

            userWithdraws.textContent =
                formatUserMoney(
                    selectedUser.totalWithdraws ??
                    selectedUser.totalWithdraw ??
                    0
                );

        }


        if (userVip) {

            userVip.textContent =
                getUserVipName(
                    selectedUser
                );

        }


        if (userJoined) {

            userJoined.textContent =
                formatUserDate(
                    selectedUser.createdAt
                );

        }


        /*
           BUTTON VISIBILITY
        */

        const blocked =
            normalizeUserStatus(
                selectedUser.status
            ) === "blocked";


        if (blockUserBtn) {

            blockUserBtn.style.display =
                blocked
                    ? "none"
                    : "inline-flex";

        }


        if (activateUserBtn) {

            activateUserBtn.style.display =
                blocked
                    ? "inline-flex"
                    : "none";

        }


        /*
           SHOW MODAL
        */

        if (userModal) {

            userModal.style.display =
                "flex";

        }

    } catch (error) {

        console.error(
            "Open user details error:",
            error
        );

        alert(
            "Failed to load user details: " +
            error.message
        );

    }
}


/* =========================================================
   VIEW USER BUTTON EVENT DELEGATION
========================================================= */

usersContainer?.addEventListener(
    "click",
    (event) => {

        const button =
            event.target.closest(
                ".viewUserBtn"
            );

        if (!button) {
            return;
        }


        const uid =
            button.dataset.id;


        openUserDetails(uid);

    }
);


/* =========================================================
   CLOSE USER MODAL
========================================================= */

function closeUserDetailsModal() {

    selectedUserIdForModal =
        null;

    if (userModal) {

        userModal.style.display =
            "none";

    }
}


closeUserModal?.addEventListener(
    "click",
    closeUserDetailsModal
);


/*
   Close when clicking outside modal
*/

userModal?.addEventListener(
    "click",
    (event) => {

        if (
            event.target === userModal
        ) {

            closeUserDetailsModal();

        }

    }
);


/* =========================================================
   BLOCK USER
========================================================= */

async function blockSelectedUser() {

    try {

        if (!currentAdmin) {

            alert(
                "Admin authentication required."
            );

            return;
        }


        const uid =
            selectedUserIdForModal;


        if (!uid) {

            alert(
                "No user selected."
            );

            return;
        }


        const user =
            allUsersManagementData[uid];


        if (!user) {

            alert(
                "User data not found."
            );

            return;
        }


        if (
            normalizeUserStatus(
                user.status
            ) === "blocked"
        ) {

            alert(
                "This user is already blocked."
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to BLOCK this user?"
            );


        if (!confirmed) {
            return;
        }


        /*
           Only change status.
           Never touch balance or money fields.
        */

        await update(
            ref(db, "users/" + uid),
            {
                status: "blocked",
                blockedAt: Date.now(),
                blockedBy: currentAdmin.uid
            }
        );


        /*
           Listener will refresh UI.
        */

        alert(
            "User blocked successfully."
        );


        closeUserDetailsModal();


    } catch (error) {

        console.error(
            "Block user error:",
            error
        );

        alert(
            "Failed to block user: " +
            error.message
        );

    }

}


/* =========================================================
   ACTIVATE USER
========================================================= */

async function activateSelectedUser() {

    try {

        if (!currentAdmin) {

            alert(
                "Admin authentication required."
            );

            return;
        }


        const uid =
            selectedUserIdForModal;


        if (!uid) {

            alert(
                "No user selected."
            );

            return;
        }


        const user =
            allUsersManagementData[uid];


        if (!user) {

            alert(
                "User data not found."
            );

            return;
        }


        if (
            normalizeUserStatus(
                user.status
            ) !== "blocked"
        ) {

            alert(
                "This user is already active."
            );

            return;
        }


        const confirmed =
            confirm(
                "Are you sure you want to ACTIVATE this user?"
            );


        if (!confirmed) {
            return;
        }


        /*
           Only change status.
        */

        await update(
            ref(db, "users/" + uid),
            {
                status: "active",
                activatedAt: Date.now(),
                activatedBy: currentAdmin.uid
            }
        );


        alert(
            "User activated successfully."
        );


        closeUserDetailsModal();


    } catch (error) {

        console.error(
            "Activate user error:",
            error
        );

        alert(
            "Failed to activate user: " +
            error.message
        );

    }

}


/* =========================================================
   BUTTON EVENTS
========================================================= */

blockUserBtn?.addEventListener(
    "click",
    blockSelectedUser
);


activateUserBtn?.addEventListener(
    "click",
    activateSelectedUser
);


/* =========================================================
   MANUAL REFRESH
========================================================= */

function refreshUsersManagement() {

    renderUsersManagement();

}


/* =========================================================
   START PART 10
========================================================= */

function startAdminPart10() {

    if (usersManagementListenerStarted) {
        return;
    }


    if (
        typeof currentAdmin !== "undefined" &&
        currentAdmin
    ) {

        initializeUsersManagementListener();

        return;
    }


    /*
       Use Part 1 ready promise if available.
    */

    if (
        typeof adminState !== "undefined" &&
        adminState.readyPromise
    ) {

        adminState.readyPromise
            .then(() => {

                initializeUsersManagementListener();

            })
            .catch(error => {

                console.error(
                    "Part 10 admin ready error:",
                    error
                );

            });

        return;
    }


    /*
       Fallback
    */

    let attempts = 0;

    const waitForAdmin =
        setInterval(() => {

            attempts++;


            if (
                typeof currentAdmin !== "undefined" &&
                currentAdmin
            ) {

                clearInterval(
                    waitForAdmin
                );

                initializeUsersManagementListener();

            }


            if (attempts >= 60) {

                clearInterval(
                    waitForAdmin
                );

                console.warn(
                    "PART 10: Admin not ready."
                );

            }

        }, 500);

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.openUserDetails =
    openUserDetails;

window.refreshUsersManagement =
    refreshUsersManagement;

window.blockSelectedUser =
    blockSelectedUser;

window.activateSelectedUser =
    activateSelectedUser;


/* =========================================================
   START
========================================================= */

startAdminPart10();


console.log(
    "✅ MONEY VAULT ADMIN PART 10 — USERS MANAGEMENT LOADED"
);

/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 11 — WITHDRAW APPROVE / REJECT
   CURRENCY: RWF / FRW

   FEATURES:
   - Approve withdraw
   - Reject withdraw
   - One-time approval protection
   - Balance deduction
   - totalWithdraws update
   - totalWithdraw update
   - totalTransactions update
   - Transaction history creation
   - Atomic Firebase update
   - Prevent double click
   - Admin audit information
========================================================= */


/* =========================================================
   PART 11 STATE
========================================================= */

const withdrawApprovalLocks = new Set();

const WITHDRAW_MIN_AMOUNT = 4000;
const WITHDRAW_MAX_AMOUNT = 500000;


/* =========================================================
   STATUS NORMALIZER
========================================================= */

function normalizeWithdrawStatusPart11(status) {

    return String(status || "pending")
        .trim()
        .toLowerCase();

}


/* =========================================================
   FORMAT RWF
========================================================= */

function formatWithdrawMoneyPart11(amount) {

    const value = Number(amount || 0);

    return value.toLocaleString("en-US") + " RWF";

}


/* =========================================================
   APPROVE WITHDRAW
========================================================= */

async function approveWithdraw(id) {

    if (!currentAdmin) {

        alert("Admin session not ready.");

        return;
    }


    if (!id) {

        alert("Withdraw request ID is missing.");

        return;
    }


    /* -----------------------------------------
       DOUBLE CLICK PROTECTION
    ----------------------------------------- */

    if (withdrawApprovalLocks.has(id)) {

        return;
    }

    withdrawApprovalLocks.add(id);


    try {

        /* -----------------------------------------
           CONFIRM
        ----------------------------------------- */

        const confirmed = confirm(
            "Approve this withdraw request?"
        );

        if (!confirmed) {

            return;
        }


        /* -----------------------------------------
           GET REQUEST
        ----------------------------------------- */

        const withdrawRef = ref(
            db,
            "withdrawRequests/" + id
        );

        const withdrawSnap = await get(withdrawRef);


        if (!withdrawSnap.exists()) {

            alert("Withdraw request not found.");

            return;
        }


        const withdraw = withdrawSnap.val();


        /* -----------------------------------------
           STATUS CHECK
        ----------------------------------------- */

        const currentStatus =
            normalizeWithdrawStatusPart11(
                withdraw.status
            );


        if (currentStatus === "approved") {

            alert("This withdraw is already approved.");

            return;
        }


        if (currentStatus === "rejected") {

            alert(
                "This withdraw has already been rejected."
            );

            return;
        }


        if (currentStatus !== "pending") {

            alert(
                "This withdraw cannot be approved because its current status is: " +
                currentStatus
            );

            return;
        }


        /* -----------------------------------------
           VALIDATE USER UID
        ----------------------------------------- */

        const uid = String(withdraw.uid || "").trim();


        if (!uid) {

            alert("Withdraw request has no user UID.");

            return;
        }


        /* -----------------------------------------
           VALIDATE AMOUNT
        ----------------------------------------- */

        const amount = Number(withdraw.amount || 0);


        if (!Number.isFinite(amount)) {

            alert("Invalid withdraw amount.");

            return;
        }


        if (amount < WITHDRAW_MIN_AMOUNT) {

            alert(
                "Minimum withdraw is " +
                formatWithdrawMoneyPart11(
                    WITHDRAW_MIN_AMOUNT
                )
            );

            return;
        }


        if (amount > WITHDRAW_MAX_AMOUNT) {

            alert(
                "Maximum withdraw is " +
                formatWithdrawMoneyPart11(
                    WITHDRAW_MAX_AMOUNT
                )
            );

            return;
        }


        /* -----------------------------------------
           GET USER
        ----------------------------------------- */

        const userRef = ref(
            db,
            "users/" + uid
        );

        const userSnap = await get(userRef);


        if (!userSnap.exists()) {

            alert("User account was not found.");

            return;
        }


        const user = userSnap.val();


        /* -----------------------------------------
           CURRENT BALANCE
        ----------------------------------------- */

        const currentBalance =
            Number(user.balance || 0);


        if (!Number.isFinite(currentBalance)) {

            alert("User balance is invalid.");

            return;
        }


        /* -----------------------------------------
           SUFFICIENT BALANCE
        ----------------------------------------- */

        if (currentBalance < amount) {

            alert(
                "Insufficient user balance.\n\n" +
                "Available: " +
                formatWithdrawMoneyPart11(
                    currentBalance
                ) +
                "\nRequested: " +
                formatWithdrawMoneyPart11(
                    amount
                )
            );

            return;
        }


        /* -----------------------------------------
           CALCULATE NEW VALUES
        ----------------------------------------- */

        const newBalance =
            currentBalance - amount;


        const newTotalWithdraws =
            Number(user.totalWithdraws || 0) +
            amount;


        const newTotalWithdraw =
            Number(user.totalWithdraw || 0) +
            amount;


        const newTotalTransactions =
            Number(user.totalTransactions || 0) +
            1;


        const now = Date.now();


        /* -----------------------------------------
           CREATE TRANSACTION ID
        ----------------------------------------- */

        const transactionKey =
            push(ref(db, "transactions")).key;


        if (!transactionKey) {

            alert(
                "Could not create transaction reference."
            );

            return;
        }


        /* -----------------------------------------
           TRANSACTION DATA
        ----------------------------------------- */

        const transactionData = {

            uid: uid,

            email:
                withdraw.email ||
                user.email ||
                "",

            phone:
                withdraw.phone ||
                user.phone ||
                "",

            type: "withdraw",

            transactionType: "withdraw",

            amount: amount,

            currency: "RWF",

            status: "approved",

            referenceId: id,

            withdrawRequestId: id,

            transactionId:
                withdraw.transactionId ||
                id,

            paymentMethod:
                withdraw.paymentMethod ||
                withdraw.method ||
                "",

            description:
                "Withdraw approved by admin",

            createdAt: now,

            timestamp: now

        };


        /* -----------------------------------------
           ATOMIC UPDATE
        ----------------------------------------- */

        const updates = {};


        /* USER */

        updates[
            "users/" +
            uid +
            "/balance"
        ] = newBalance;


        updates[
            "users/" +
            uid +
            "/totalWithdraws"
        ] = newTotalWithdraws;


        updates[
            "users/" +
            uid +
            "/totalWithdraw"
        ] = newTotalWithdraw;


        updates[
            "users/" +
            uid +
            "/totalTransactions"
        ] = newTotalTransactions;


        /* WITHDRAW REQUEST */

        updates[
            "withdrawRequests/" +
            id +
            "/status"
        ] = "approved";


        updates[
            "withdrawRequests/" +
            id +
            "/approvedAt"
        ] = now;


        updates[
            "withdrawRequests/" +
            id +
            "/approvedBy"
        ] =
            currentAdmin.uid ||
            currentAdmin.email ||
            "admin";


        /* TRANSACTION */

        updates[
            "transactions/" +
            transactionKey
        ] = transactionData;


        /* -----------------------------------------
           ONE FIREBASE WRITE
        ----------------------------------------- */

        await update(
            ref(db),
            updates
        );


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        alert(
            "Withdraw approved successfully.\n\n" +
            "Amount: " +
            formatWithdrawMoneyPart11(amount) +
            "\n" +
            "New Balance: " +
            formatWithdrawMoneyPart11(newBalance)
        );


        /* -----------------------------------------
           REFRESH UI
        ----------------------------------------- */

        if (typeof window.renderWithdrawRequests === "function") {

            window.renderWithdrawRequests();

        }

    }
    catch (error) {

        console.error(
            "Withdraw approval error:",
            error
        );

        alert(
            "Withdraw approval failed:\n\n" +
            error.message
        );

    }
    finally {

        withdrawApprovalLocks.delete(id);

    }

}


/* =========================================================
   REJECT WITHDRAW
========================================================= */

async function rejectWithdraw(id) {

    if (!currentAdmin) {

        alert("Admin session not ready.");

        return;
    }


    if (!id) {

        alert("Withdraw request ID is missing.");

        return;
    }


    try {

        /* -----------------------------------------
           CONFIRM
        ----------------------------------------- */

        const confirmed = confirm(
            "Reject this withdraw request?"
        );


        if (!confirmed) {

            return;
        }


        /* -----------------------------------------
           GET REQUEST
        ----------------------------------------- */

        const withdrawRef = ref(
            db,
            "withdrawRequests/" + id
        );


        const withdrawSnap =
            await get(withdrawRef);


        if (!withdrawSnap.exists()) {

            alert("Withdraw request not found.");

            return;
        }


        const withdraw =
            withdrawSnap.val();


        /* -----------------------------------------
           STATUS
        ----------------------------------------- */

        const currentStatus =
            normalizeWithdrawStatusPart11(
                withdraw.status
            );


        if (currentStatus === "approved") {

            alert(
                "An approved withdraw cannot be rejected."
            );

            return;
        }


        if (currentStatus === "rejected") {

            alert(
                "This withdraw is already rejected."
            );

            return;
        }


        if (currentStatus !== "pending") {

            alert(
                "This withdraw cannot be rejected."
            );

            return;
        }


        /* -----------------------------------------
           UPDATE
        ----------------------------------------- */

        const now = Date.now();


        await update(
            withdrawRef,
            {

                status: "rejected",

                rejectedAt: now,

                rejectedBy:
                    currentAdmin.uid ||
                    currentAdmin.email ||
                    "admin"

            }
        );


        alert(
            "Withdraw rejected successfully."
        );


        /* -----------------------------------------
           REFRESH
        ----------------------------------------- */

        if (
            typeof window.renderWithdrawRequests ===
            "function"
        ) {

            window.renderWithdrawRequests();

        }

    }
    catch (error) {

        console.error(
            "Withdraw rejection error:",
            error
        );

        alert(
            "Withdraw rejection failed:\n\n" +
            error.message
        );

    }

}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;


/* =========================================================
   READY
========================================================= */

console.log(
    "✅ Money Vault Admin Part 11 Loaded — Withdraw Approve / Reject"
);


