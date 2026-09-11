/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 1 — AUTH + ADMIN SECURITY + NAVIGATION

   CURRENCY: RWF / FRW

   RULES:
   - Admin is verified by Firebase RTDB admins/{uid}
   - No hard-coded admin email required
   - Users cannot access admin panel
   - Mobile sidebar supported
   - Quick Actions supported
   - No duplicate declarations
========================================================= */

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
    ref,
    get,
    set,
    update,
    push,
    onValue,
    query,
    orderByChild,
    equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
/* =========================================================
   GLOBAL ADMIN STATE
========================================================= */

let currentAdmin = null;
let adminData = null;


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


/* =========================================================
   NAVIGATION ELEMENTS
========================================================= */

const menuLinks =
    document.querySelectorAll(".menu-link");

const pageSections =
    document.querySelectorAll(".page-section");


/* =========================================================
   HELPER — HIDE LOADING
========================================================= */

function hideLoading() {

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

}


/* =========================================================
   HELPER — SHOW LOADING
========================================================= */

function showLoading() {

    if (loadingScreen) {
        loadingScreen.style.display = "flex";
    }

}


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

onAuthStateChanged(auth, async (user) => {

    try {

        showLoading();


        /* ---------------------------------------------
           USER NOT LOGGED IN
        --------------------------------------------- */

        if (!user) {

            window.location.href = "login.html";
            return;

        }


        /* ---------------------------------------------
           CHECK ADMIN IN REALTIME DATABASE
           
           Required:
           admins/{REAL_UID}: true
        --------------------------------------------- */

        const adminRef =
            ref(db, "admins/" + user.uid);

        const adminSnap =
            await get(adminRef);


        /* ---------------------------------------------
           NOT ADMIN
        --------------------------------------------- */

        if (
            !adminSnap.exists() ||
            adminSnap.val() !== true
        ) {

            console.warn(
                "Access denied. User is not an admin."
            );

            alert("Access Denied");

            await signOut(auth);

            window.location.href =
                "dashboard.html";

            return;
        }


        /* ---------------------------------------------
           ADMIN VERIFIED
        --------------------------------------------- */

        currentAdmin = user;
        adminData = adminSnap.val();


        /* ---------------------------------------------
           ADMIN NAME
        --------------------------------------------- */

        if (adminName) {

            adminName.textContent =
                user.displayName ||
                "Administrator";

        }


        /* ---------------------------------------------
           HIDE LOADING
        --------------------------------------------- */

        hideLoading();


        /* ---------------------------------------------
           OPEN DEFAULT PAGE
        --------------------------------------------- */

        openPage("dashboard");


        console.log(
            "✅ Admin authenticated successfully"
        );

        console.log(
            "Admin UID:",
            user.uid
        );


    } catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "Admin authentication failed: " +
            error.message
        );

        await signOut(auth);

        window.location.href =
            "login.html";

    }

});


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

menuBtn?.addEventListener(
    "click",
    () => {

        if (!sidebar) return;

        sidebar.classList.toggle("active");
        sidebar.classList.toggle("show");

    }
);


/* =========================================================
   CLOSE SIDEBAR WHEN CLICKING OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    (event) => {

        if (!sidebar || !menuBtn) return;

        const clickedInsideSidebar =
            sidebar.contains(event.target);

        const clickedMenuButton =
            menuBtn.contains(event.target);

        if (
            !clickedInsideSidebar &&
            !clickedMenuButton &&
            window.innerWidth < 900
        ) {

            sidebar.classList.remove("active");
            sidebar.classList.remove("show");

        }

    }
);


/* =========================================================
   OPEN PAGE
========================================================= */

function openPage(pageName) {

    if (!pageName) return;


    /* ---------------------------------------------
       HIDE ALL SECTIONS
    --------------------------------------------- */

    pageSections.forEach(section => {

        section.style.display = "none";

    });


    /* ---------------------------------------------
       REMOVE ACTIVE FROM ALL MENU LINKS
    --------------------------------------------- */

    menuLinks.forEach(link => {

        link.classList.remove("active");

    });


    /* ---------------------------------------------
       MAP PAGE NAMES TO HTML SECTION IDs
    --------------------------------------------- */

    const sectionMap = {

        dashboard:
            "dashboardSection",

        deposits:
            "depositSection",

        deposit:
            "depositSection",

        withdraws:
            "withdrawSection",

        withdraw:
            "withdrawSection",

        users:
            "usersSection",

        transactions:
            "transactionsSection",

        settings:
            "settingsSection",

        vip:
            "vipSection",

        vipRequests:
            "vipRequestsSection",

        vipBuyers:
            "vipBuyersSection"

    };


    const sectionId =
        sectionMap[pageName];


    /* ---------------------------------------------
       SHOW SECTION
    --------------------------------------------- */

    if (sectionId) {

        const section =
            document.getElementById(sectionId);

        if (section) {

            section.style.display = "block";

        } else {

            console.warn(
                "Section not found:",
                sectionId
            );

        }

    }


    /* ---------------------------------------------
       ACTIVE MENU
    --------------------------------------------- */

    const activeLink =
        document.querySelector(
            `.menu-link[data-page="${pageName}"]`
        );

    if (activeLink) {

        activeLink.classList.add("active");

    }


    /* ---------------------------------------------
       CLOSE MOBILE SIDEBAR
    --------------------------------------------- */

    if (window.innerWidth < 900) {

        sidebar?.classList.remove("active");
        sidebar?.classList.remove("show");

    }

}


/* =========================================================
   MENU LINKS
========================================================= */

menuLinks.forEach(link => {

    link.addEventListener(
        "click",
        (event) => {

            event.preventDefault();

            const page =
                link.dataset.page;

            if (!page) return;

            openPage(page);

        }
    );

});


/* =========================================================
   QUICK ACTION — DEPOSITS
========================================================= */

document
    .getElementById("openDeposits")
    ?.addEventListener(
        "click",
        () => {

            openPage("deposits");

        }
    );


/* =========================================================
   QUICK ACTION — WITHDRAWS
========================================================= */

document
    .getElementById("openWithdraws")
    ?.addEventListener(
        "click",
        () => {

            openPage("withdraws");

        }
    );


/* =========================================================
   QUICK ACTION — USERS
========================================================= */

document
    .getElementById("openUsers")
    ?.addEventListener(
        "click",
        () => {

            openPage("users");

        }
    );


/* =========================================================
   QUICK ACTION — TRANSACTIONS
========================================================= */

document
    .getElementById("openTransactions")
    ?.addEventListener(
        "click",
        () => {

            openPage("transactions");

        }
    );


/* =========================================================
   QUICK ACTION — SETTINGS
========================================================= */

document
    .getElementById("openSettings")
    ?.addEventListener(
        "click",
        () => {

            openPage("settings");

        }
    );


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn?.addEventListener(
    "click",
    async () => {

        const confirmed =
            confirm(
                "Logout from Admin Panel?"
            );

        if (!confirmed) return;

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            alert(
                "Logout failed: " +
                error.message
            );

        }

    }
);


/* =========================================================
   EXPORT FOR OTHER PARTS
========================================================= */

window.openPage = openPage;


/* =========================================================
   READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 1 Loaded"
);

console.log(
    "Admin authentication + navigation ready"
);

console.log(
    "======================================"
);
/* =========================================================
   MONEY VAULT - ADMIN.JS
   PART 2 — DASHBOARD + USERS MANAGEMENT

   CURRENCY: RWF / FRW

   FEATURES:
   - Dashboard statistics
   - Total users
   - Deposit statistics
   - Withdraw statistics
   - User list
   - User search
   - User status counters
   - Safe HTML escaping
   - Live Realtime Database listeners
   - No duplicate functions
========================================================= */


/* =========================================================
   GLOBAL DATA
========================================================= */

let allUsersData = {};
let allDepositsData = {};
let allWithdrawsData = {};
let allTransactionsData = {};


/* =========================================================
   DASHBOARD ELEMENTS
========================================================= */

const totalUsersEl =
    document.getElementById("totalUsers");

const totalDepositsEl =
    document.getElementById("totalDeposits");

const totalPendingEl =
    document.getElementById("totalPending");

const totalApprovedEl =
    document.getElementById("totalApproved");

const totalRejectedEl =
    document.getElementById("totalRejected");

const totalAmountEl =
    document.getElementById("totalAmount");


/* =========================================================
   USERS ELEMENTS
========================================================= */

const usersContainer =
    document.getElementById("usersContainer");

const allUsersEl =
    document.getElementById("allUsers");

const activeUsersEl =
    document.getElementById("activeUsers");

const blockedUsersEl =
    document.getElementById("blockedUsers");

const userSearchEl =
    document.getElementById("userSearch");


/* =========================================================
   HELPER — SAFE HTML
========================================================= */

function escapeHTML(value) {

    if (value === null || value === undefined) {
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
   HELPER — NUMBER
========================================================= */

function moneyRWF(value) {

    const amount = Number(value || 0);

    return amount.toLocaleString(
        "en-US",
        {
            maximumFractionDigits: 2
        }
    ) + " RWF";

}


/* =========================================================
   HELPER — NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {

    return String(
        status || "pending"
    ).trim().toLowerCase();

}


/* =========================================================
   HELPER — USER STATUS
========================================================= */

function isBlockedUser(user) {

    const status =
        String(user?.status || "")
            .trim()
            .toLowerCase();

    return (
        status === "blocked" ||
        status === "suspended" ||
        user?.blocked === true
    );

}


/* =========================================================
   DASHBOARD — UPDATE USER COUNT
========================================================= */

function updateUserDashboardStats() {

    const users =
        Object.values(allUsersData || {});

    const total =
        users.length;

    let active = 0;
    let blocked = 0;

    users.forEach(user => {

        if (isBlockedUser(user)) {

            blocked++;

        } else {

            active++;

        }

    });


    if (totalUsersEl) {

        totalUsersEl.textContent =
            total.toLocaleString();

    }


    if (allUsersEl) {

        allUsersEl.textContent =
            total.toLocaleString();

    }


    if (activeUsersEl) {

        activeUsersEl.textContent =
            active.toLocaleString();

    }


    if (blockedUsersEl) {

        blockedUsersEl.textContent =
            blocked.toLocaleString();

    }

}


/* =========================================================
   DASHBOARD — DEPOSIT STATISTICS
========================================================= */

function updateDepositDashboardStats() {

    const deposits =
        Object.values(allDepositsData || {});

    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let totalAmount = 0;

    deposits.forEach(deposit => {

        const status =
            normalizeStatus(
                deposit?.status
            );

        const amount =
            Number(
                deposit?.amount || 0
            );

        if (
            Number.isFinite(amount) &&
            amount > 0
        ) {

            totalAmount += amount;

        }


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


    if (totalDepositsEl) {

        totalDepositsEl.textContent =
            deposits.length.toLocaleString();

    }


    if (totalPendingEl) {

        totalPendingEl.textContent =
            pending.toLocaleString();

    }


    if (totalApprovedEl) {

        totalApprovedEl.textContent =
            approved.toLocaleString();

    }


    if (totalRejectedEl) {

        totalRejectedEl.textContent =
            rejected.toLocaleString();

    }


    if (totalAmountEl) {

        totalAmountEl.textContent =
            moneyRWF(totalAmount);

    }

}


/* =========================================================
   DASHBOARD — LOAD USERS
========================================================= */

function initializeUsersListener() {

    onValue(
        ref(db, "users"),
        snapshot => {

            if (!snapshot.exists()) {

                allUsersData = {};

                updateUserDashboardStats();

                renderUsers();

                return;

            }


            allUsersData =
                snapshot.val() || {};


            updateUserDashboardStats();

            renderUsers();

        },
        error => {

            console.error(
                "Users listener error:",
                error
            );

        }
    );

}


/* =========================================================
   DASHBOARD — LOAD DEPOSITS
========================================================= */

function initializeDepositsDashboardListener() {

    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            if (!snapshot.exists()) {

                allDepositsData = {};

            } else {

                allDepositsData =
                    snapshot.val() || {};

            }


            updateDepositDashboardStats();

        },
        error => {

            console.error(
                "Deposit dashboard listener error:",
                error
            );

        }
    );

}


/* =========================================================
   DASHBOARD — LOAD WITHDRAWS
========================================================= */

function initializeWithdrawDashboardListener() {

    onValue(
        ref(db, "withdrawRequests"),
        snapshot => {

            if (!snapshot.exists()) {

                allWithdrawsData = {};

            } else {

                allWithdrawsData =
                    snapshot.val() || {};

            }

            updateWithdrawDashboardStats();

        },
        error => {

            console.error(
                "Withdraw dashboard listener error:",
                error
            );

        }
    );

}


/* =========================================================
   WITHDRAW DASHBOARD STATISTICS
========================================================= */

function updateWithdrawDashboardStats() {

    const withdraws =
        Object.values(
            allWithdrawsData || {}
        );

    let pending = 0;
    let approved = 0;
    let rejected = 0;

    withdraws.forEach(withdraw => {

        const status =
            normalizeStatus(
                withdraw?.status
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


    const withdrawCount =
        document.getElementById(
            "withdrawCount"
        );

    const withdrawPending =
        document.getElementById(
            "withdrawPending"
        );

    const withdrawApproved =
        document.getElementById(
            "withdrawApproved"
        );

    const withdrawRejected =
        document.getElementById(
            "withdrawRejected"
        );


    if (withdrawCount) {

        withdrawCount.textContent =
            withdraws.length.toLocaleString();

    }

    if (withdrawPending) {

        withdrawPending.textContent =
            pending.toLocaleString();

    }

    if (withdrawApproved) {

        withdrawApproved.textContent =
            approved.toLocaleString();

    }

    if (withdrawRejected) {

        withdrawRejected.textContent =
            rejected.toLocaleString();

    }

}


/* =========================================================
   RENDER USERS
========================================================= */

function renderUsers() {

    if (!usersContainer) {
        return;
    }


    const keyword =
        String(
            userSearchEl?.value || ""
        )
        .trim()
        .toLowerCase();


    usersContainer.innerHTML = "";


    const entries =
        Object.entries(
            allUsersData || {}
        );


    if (entries.length === 0) {

        usersContainer.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-users"></i>
                <h3>No Users Found</h3>
                <p>Registered users will appear here.</p>
            </div>
        `;

        return;

    }


    let visibleCount = 0;


    entries.forEach(
        ([uid, user]) => {

            user = user || {};


            const name =
                String(
                    user.fullName ||
                    user.name ||
                    "Unknown User"
                );

            const email =
                String(
                    user.email || "-"
                );

            const phone =
                String(
                    user.phone || "-"
                );

            const vip =
                String(
                    user.vip ||
                    user.vipPlan ||
                    "VIP 0"
                );

            const balance =
                Number(
                    user.balance || 0
                );


            const searchableText =
                (
                    name +
                    " " +
                    email +
                    " " +
                    phone +
                    " " +
                    uid +
                    " " +
                    vip
                )
                .toLowerCase();


            if (
                keyword &&
                !searchableText.includes(keyword)
            ) {

                return;

            }


            visibleCount++;


            const blocked =
                isBlockedUser(user);


            const statusText =
                blocked
                    ? "Blocked"
                    : "Active";


            const statusClass =
                blocked
                    ? "blocked"
                    : "active";


            usersContainer.innerHTML += `

                <div
                    class="user-card"
                    data-user-id="${escapeHTML(uid)}"
                >

                    <div class="user-card-header">

                        <div class="user-avatar">

                            <i class="fa-solid fa-user"></i>

                        </div>

                        <div class="user-main-info">

                            <h3>
                                ${escapeHTML(name)}
                            </h3>

                            <span
                                class="user-status ${statusClass}"
                            >
                                ${statusText}
                            </span>

                        </div>

                    </div>


                    <div class="user-card-body">

                        <p>
                            <strong>Email:</strong>
                            ${escapeHTML(email)}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHTML(phone)}
                        </p>

                        <p>
                            <strong>Balance:</strong>
                            ${moneyRWF(balance)}
                        </p>

                        <p>
                            <strong>VIP:</strong>
                            ${escapeHTML(vip)}
                        </p>

                        <p>
                            <strong>UID:</strong>
                            <small>
                                ${escapeHTML(uid)}
                            </small>
                        </p>

                    </div>


                    <div class="action-buttons">

                        <button
                            type="button"
                            class="viewUserBtn"
                            data-id="${escapeHTML(uid)}"
                        >
                            <i class="fa-solid fa-eye"></i>
                            View
                        </button>

                    </div>

                </div>

            `;

        }
    );


    if (visibleCount === 0) {

        usersContainer.innerHTML = `
            <div class="empty-state">

                <i class="fa-solid fa-magnifying-glass"></i>

                <h3>No Matching Users</h3>

                <p>
                    Try another name, email, phone or UID.
                </p>

            </div>
        `;

    }

}


/* =========================================================
   USER SEARCH
========================================================= */

userSearchEl?.addEventListener(
    "input",
    () => {

        renderUsers();

    }
);


/* =========================================================
   VIEW USER
========================================================= */

function viewUser(uid) {

    if (!uid) return;


    const user =
        allUsersData?.[uid];


    if (!user) {

        alert(
            "User information not found."
        );

        return;

    }


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
        Number(
            user.balance || 0
        );

    const vip =
        user.vip ||
        user.vipPlan ||
        "VIP 0";


    const message =

        "USER DETAILS\n\n" +

        "Name: " +
        name +

        "\nEmail: " +
        email +

        "\nPhone: " +
        phone +

        "\nBalance: " +
        moneyRWF(balance) +

        "\nVIP: " +
        vip +

        "\nUID: " +
        uid;


    alert(message);

}


/* =========================================================
   USER BUTTON EVENT DELEGATION
========================================================= */

usersContainer?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                ".viewUserBtn"
            );

        if (!button) return;


        const uid =
            button.dataset.id;


        viewUser(uid);

    }
);


/* =========================================================
   GLOBAL INITIALIZATION
========================================================= */

function initializeAdminPart2() {

    console.log(
        "Starting Admin Part 2 listeners..."
    );


    initializeUsersListener();

    initializeDepositsDashboardListener();

    initializeWithdrawDashboardListener();


    console.log(
        "✅ Admin Part 2 listeners started"
    );

}


/* =========================================================
   START PART 2 ONLY AFTER ADMIN AUTH
========================================================= */

let part2Started = false;


function startAdminPart2() {

    if (part2Started) {
        return;
    }


    if (!currentAdmin) {

        console.warn(
            "Part 2 waiting for admin authentication..."
        );

        return;

    }


    part2Started = true;

    initializeAdminPart2();

}


/* =========================================================
   WAIT FOR PART 1 AUTH
========================================================= */

const part2AuthInterval =
    setInterval(
        () => {

            if (currentAdmin) {

                clearInterval(
                    part2AuthInterval
                );

                startAdminPart2();

            }

        },
        100
    );


/* =========================================================
   ADMIN PART 2 READY
========================================================= */

console.log(
    "======================================"
);

console.log(
    "Money Vault Admin.js Part 2 Loaded"
);

console.log(
    "Dashboard + Users ready"
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
   IMPORTANT FIREBASE IMPORTS
========================================================= */

import {
    onValue,
    update,
    push
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


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


