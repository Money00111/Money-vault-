// ======================================
// ADMIN.JS - PART 1
// FIREBASE + ADMIN AUTH + STARTUP
// ======================================

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


// ======================================
// GLOBAL STATE
// ======================================

let currentAdmin = null;
let adminReady = false;

let resolveAdminReady;

const adminReadyPromise =
    new Promise(resolve => {
        resolveAdminReady = resolve;
    });


// ======================================
// GLOBAL HELPERS
// ======================================

window.adminState = {

    get currentAdmin() {
        return currentAdmin;
    },

    get ready() {
        return adminReady;
    },

    readyPromise: adminReadyPromise

};


// ======================================
// DOM
// ======================================

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


// ======================================
// WAIT FOR ADMIN
// ======================================

window.waitForAdmin = function () {

    return adminReadyPromise;

};


// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, async user => {

    try {

        if (!user) {

            window.location.href = "login.html";

            return;
        }


        const adminSnap =
            await get(
                ref(db, "admins/" + user.uid)
            );


        if (!adminSnap.exists()) {

            alert("Access denied. Admin only.");

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }


        currentAdmin = user;

        adminReady = true;


        const adminData =
            adminSnap.val() || {};


        if (adminName) {

            adminName.textContent =
                adminData.name ||
                user.displayName ||
                "Administrator";

        }


        if (adminEmail) {

            adminEmail.textContent =
                user.email || "";

        }


        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }


        console.log(
            "ADMIN AUTH READY:",
            user.email
        );


        resolveAdminReady();


        // ==================================
        // START ALL SYSTEMS ONLY NOW
        // ==================================

        if (window.loadDashboard) {
            window.loadDashboard();
        }

        if (window.loadDeposits) {
            window.loadDeposits();
        }

        if (window.loadWithdraws) {
            window.loadWithdraws();
        }

        if (window.loadVipRequests) {
            window.loadVipRequests();
        }

        if (window.loadVipBuyers) {
            window.loadVipBuyers();
        }

        if (window.loadUsers) {
            window.loadUsers();
        }

        if (window.loadTransactions) {
            window.loadTransactions();
        }


    }
    catch (error) {

        console.error(
            "Admin authentication error:",
            error
        );

        alert(
            "Admin authentication failed: " +
            error.message
        );

    }

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        }
        catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

    }
);


// ======================================
// MOBILE SIDEBAR
// ======================================

menuBtn?.addEventListener(
    "click",
    () => {

        sidebar?.classList.toggle("active");

    }
);


// ======================================
// NAVIGATION
// ======================================

menuLinks.forEach(link => {

    link.addEventListener(
        "click",
        event => {

            event.preventDefault();

            const page =
                link.dataset.page;

            openPage(page);

        }
    );

});


function openPage(page) {

    sections.forEach(section => {

        section.classList.remove("active");

    });


    menuLinks.forEach(link => {

        link.classList.remove("active");

    });


    const target =
        document.getElementById(
            page + "Section"
        );


    if (target) {

        target.classList.add("active");

    }


    const activeLink =
        document.querySelector(
            `[data-page="${page}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");

    }


    if (pageTitle) {

        pageTitle.textContent =
            page.charAt(0).toUpperCase() +
            page.slice(1);

    }

}


// ======================================
// GLOBAL PAGE FUNCTION
// ======================================

window.openPage = openPage;


// ======================================
// PART 1 READY
// ======================================

console.log(
    "ADMIN PART 1 READY"
);

// ======================================
// ADMIN.JS - PART 2
// HELPERS + DASHBOARD
// ======================================


// ======================================
// MONEY
// ======================================

function formatMoney(amount) {

    return Number(amount || 0)
        .toLocaleString() + " RWF";

}


// ======================================
// TEXT UPDATE
// ======================================

function updateText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent = value;

    }

}


// ======================================
// ESCAPE HTML
// ======================================

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ======================================
// NUMBER
// ======================================

function numberValue(...values) {

    for (const value of values) {

        const n = Number(value);

        if (
            Number.isFinite(n) &&
            n > 0
        ) {

            return n;

        }

    }

    return 0;

}


// ======================================
// DASHBOARD
// ======================================

function loadDashboard() {

    if (!window.adminState?.ready) {

        console.log(
            "Dashboard waiting for Admin Auth..."
        );

        return;

    }


    // ==================================
    // USERS
    // ==================================

    onValue(
        ref(db, "users"),
        snapshot => {

            let total = 0;
            let balance = 0;

            if (snapshot.exists()) {

                const users =
                    snapshot.val();

                total =
                    Object.keys(users).length;

                Object.values(users)
                    .forEach(user => {

                        balance +=
                            Number(
                                user?.balance || 0
                            );

                    });

            }


            updateText(
                "totalUsers",
                total
            );

            updateText(
                "systemBalance",
                formatMoney(balance)
            );

        }
    );


    // ==================================
    // DEPOSITS
    // ==================================

    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            if (snapshot.exists()) {

                Object.values(snapshot.val())
                    .forEach(item => {

                        total++;

                        const status =
                            String(
                                item?.status ||
                                "pending"
                            ).toLowerCase();


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

            }


            updateText(
                "dashboardTotalDeposits",
                total
            );

            updateText(
                "dashboardPendingDeposits",
                pending
            );

            updateText(
                "dashboardApprovedDeposits",
                approved
            );

            updateText(
                "depositTotalCount",
                total
            );

            updateText(
                "depositPendingCount",
                pending
            );

            updateText(
                "depositApprovedCount",
                approved
            );

            updateText(
                "depositRejectedCount",
                rejected
            );

        }
    );


    // ==================================
    // WITHDRAWS
    // ==================================

    onValue(
        ref(db, "withdrawRequests"),
        snapshot => {

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            if (snapshot.exists()) {

                Object.values(snapshot.val())
                    .forEach(item => {

                        total++;

                        const status =
                            String(
                                item?.status ||
                                "pending"
                            ).toLowerCase();


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

            }


            updateText(
                "dashboardTotalWithdraws",
                total
            );

            updateText(
                "withdrawTotalCount",
                total
            );

            updateText(
                "withdrawPendingCount",
                pending
            );

            updateText(
                "withdrawApprovedCount",
                approved
            );

            updateText(
                "withdrawRejectedCount",
                rejected
            );

        }
    );


    // ==================================
    // RECENT TRANSACTIONS
    // ==================================

    const activity =
        document.getElementById(
            "recentActivity"
        );


    if (activity) {

        onValue(
            ref(db, "transactions"),
            snapshot => {

                activity.innerHTML = "";


                if (!snapshot.exists()) {

                    activity.innerHTML = `
                        <div class="empty-state">
                            <h3>No Recent Activity</h3>
                        </div>
                    `;

                    return;
                }


                Object.entries(snapshot.val())
                    .reverse()
                    .slice(0, 10)
                    .forEach(
                        ([id, item]) => {

                            const div =
                                document.createElement(
                                    "div"
                                );

                            div.className =
                                "activity-item";


                            div.innerHTML = `
                                <p>
                                    <strong>
                                        ${escapeHTML(
                                            String(
                                                item?.type ||
                                                "transaction"
                                            ).toUpperCase()
                                        )}
                                    </strong>
                                    -
                                    ${formatMoney(
                                        item?.amount || 0
                                    )}
                                </p>

                                <span>
                                    ${escapeHTML(
                                        item?.status || "-"
                                    )}
                                </span>
                            `;


                            activity.appendChild(div);

                        }
                    );

            }
        );

    }

}


window.loadDashboard =
    loadDashboard;


console.log(
    "ADMIN PART 2 READY"
);

// ======================================
// ADMIN.JS - PART 3
// DEPOSIT MANAGEMENT - SAFE VERSION
// APPROVE + REJECT ONCE ONLY
// ======================================


// ======================================
// LOAD DEPOSITS
// ======================================

function loadDeposits() {

    if (!window.adminState?.ready) {
        return;
    }


    const list =
        document.getElementById("depositList");

    const empty =
        document.getElementById("emptyDeposit");


    if (!list) {
        console.warn("depositList not found.");
        return;
    }


    onValue(
        ref(db, "depositRequests"),
        async snapshot => {

            list.innerHTML = "";


            // ==================================
            // NO DEPOSITS
            // ==================================

            if (!snapshot.exists()) {

                if (empty) {
                    empty.style.display = "block";
                }

                return;
            }


            if (empty) {
                empty.style.display = "none";
            }


            const entries =
                Object.entries(snapshot.val())
                    .reverse();


            // ==================================
            // RENDER EACH DEPOSIT
            // ==================================

            for (const [id, deposit] of entries) {

                const item =
                    deposit || {};


                let user = {};


                // ==================================
                // GET USER
                // ==================================

                if (item.uid) {

                    try {

                        const userSnap =
                            await get(
                                ref(
                                    db,
                                    "users/" + item.uid
                                )
                            );


                        if (userSnap.exists()) {

                            user =
                                userSnap.val() || {};

                        }

                    }
                    catch (error) {

                        console.error(
                            "Error loading deposit user:",
                            error
                        );

                    }

                }


                // ==================================
                // STATUS
                // ==================================

                const status =
                    String(
                        item.status || "pending"
                    ).toLowerCase();


                // ==================================
                // USER INFORMATION
                // ==================================

                const name =
                    item.fullName ||
                    item.name ||
                    user.fullName ||
                    user.name ||
                    user.username ||
                    "-";


                const email =
                    item.email ||
                    user.email ||
                    "-";


                const phone =
                    item.senderPhone ||
                    item.phone ||
                    item.phoneNumber ||
                    user.phone ||
                    user.phoneNumber ||
                    "-";


                const amount =
                    Number(item.amount || 0);


                const paymentMethod =
                    item.paymentMethod ||
                    item.method ||
                    "-";


                const transactionId =
                    item.transactionId ||
                    item.transactionID ||
                    item.reference ||
                    "-";


                const date =
                    item.createdAt ||
                    item.requestDate ||
                    item.date ||
                    item.timestamp ||
                    "-";


                // ==================================
                // CARD
                // ==================================

                const card =
                    document.createElement("div");


                card.className =
                    "request-card";


                card.dataset.requestId =
                    id;


                card.innerHTML = `

                    <div class="request-top">

                        <h3>
                            <i class="fa-solid fa-money-bill-transfer"></i>
                            Deposit Request
                        </h3>

                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>


                    <div class="user-profile-box">

                        <h4>
                            <i class="fa-solid fa-user"></i>
                            User Information
                        </h4>

                        <p>
                            <strong>Name:</strong>
                            ${escapeHTML(name)}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${escapeHTML(email)}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHTML(phone)}
                        </p>

                        <p>
                            <strong>User ID:</strong>
                            ${escapeHTML(
                                item.uid || "-"
                            )}
                        </p>

                    </div>


                    <div class="withdraw-info">

                        <p>
                            <strong>Amount:</strong>
                            ${amount.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Payment Method:</strong>
                            ${escapeHTML(
                                paymentMethod
                            )}
                        </p>

                        <p>
                            <strong>Transaction ID:</strong>
                            ${escapeHTML(
                                transactionId
                            )}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${escapeHTML(
                                String(date)
                            )}
                        </p>

                    </div>


                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            data-action="approveDeposit"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >

                            <i class="fa-solid fa-circle-check"></i>

                            ${
                                status === "approved"
                                ? "Approved"
                                : status === "processing"
                                ? "Processing..."
                                : "Approve"
                            }

                        </button>


                        <button
                            class="rejectBtn"
                            data-action="rejectDeposit"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >

                            <i class="fa-solid fa-circle-xmark"></i>

                            ${
                                status === "rejected"
                                ? "Rejected"
                                : status === "processing"
                                ? "Processing..."
                                : "Reject"
                            }

                        </button>

                    </div>
                `;


                list.appendChild(card);

            }


            // ==================================
            // BUTTON EVENTS
            // ==================================

            list.querySelectorAll(
                "[data-action]"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        // ==========================
                        // PREVENT DOUBLE CLICK
                        // ==========================

                        if (
                            button.disabled ||
                            button.dataset.busy === "true"
                        ) {

                            return;

                        }


                        button.dataset.busy =
                            "true";


                        button.disabled =
                            true;


                        const id =
                            button.dataset.id;


                        const action =
                            button.dataset.action;


                        try {

                            if (
                                action ===
                                "approveDeposit"
                            ) {

                                await approveDeposit(id);

                            }

                            else if (
                                action ===
                                "rejectDeposit"
                            ) {

                                await rejectDeposit(id);

                            }

                        }
                        catch (error) {

                            console.error(
                                "Deposit button error:",
                                error
                            );

                        }

                    }
                );

            });

        }
    );

}


// ======================================
// APPROVE DEPOSIT
// SAFE - ONCE ONLY
// ======================================

async function approveDeposit(id) {

    if (!currentAdmin) {

        alert("Admin session not ready.");

        return;

    }


    if (!id) {

        alert("Invalid deposit request.");

        return;

    }


    const requestRef =
        ref(
            db,
            "depositRequests/" + id
        );


    // ==================================
    // STEP 1
    // CLAIM REQUEST
    // ==================================

    let claim;


    try {

        claim =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    const status =
                        String(
                            current.status ||
                            "pending"
                        ).toLowerCase();


                    // IMPORTANT:
                    // ONLY PENDING CAN BE APPROVED

                    if (status !== "pending") {
                        return;
                    }


                    return {

                        ...current,

                        status: "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin.uid

                    };

                }
            );

    }
    catch (error) {

        console.error(
            "Deposit claim error:",
            error
        );

        alert(
            "Could not process deposit."
        );

        return;

    }


    // ==================================
    // CLAIM FAILED
    // ==================================

    if (!claim.committed) {

        alert(
            "This deposit has already been processed."
        );

        return;

    }


    const deposit =
        claim.snapshot.val() || {};


    try {

        // ==================================
        // USER ID
        // ==================================

        const uid =
            deposit.uid ||
            deposit.userId ||
            deposit.userUID ||
            "";


        if (!uid) {

            throw new Error(
                "Deposit has no user ID."
            );

        }


        // ==================================
        // AMOUNT
        // ==================================

        const amount =
            Number(
                deposit.amount || 0
            );


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new Error(
                "Invalid deposit amount."
            );

        }


        // ==================================
        // USER REF
        // ==================================

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        // ==================================
        // STEP 2
        // UPDATE USER BALANCE SAFELY
        // ==================================

        const balanceTransaction =
            await runTransaction(
                userRef,
                user => {

                    if (!user) {
                        return;
                    }


                    const currentBalance =
                        Number(
                            user.balance || 0
                        );


                    const currentTotalDeposit =
                        Number(
                            user.totalDeposit || 0
                        );


                    return {

                        ...user,

                        balance:
                            currentBalance +
                            amount,

                        totalDeposit:
                            currentTotalDeposit +
                            amount

                    };

                }
            );


        if (
            !balanceTransaction.committed
        ) {

            throw new Error(
                "Could not update user balance."
            );

        }


        // ==================================
        // STEP 3
        // MARK REQUEST APPROVED
        // ==================================

        await update(
            requestRef,
            {

                status:
                    "approved",

                approvedAt:
                    Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );


        // ==================================
        // STEP 4
        // TRANSACTION RECORD
        // ==================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid,

                type:
                    "deposit",

                amount,

                status:
                    "approved",

                reference:
                    id,

                requestId:
                    id,

                approvedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Deposit Approved Successfully"
        );


        console.log(
            "Deposit approved:",
            id,
            amount,
            uid
        );

    }
    catch (error) {

        console.error(
            "Deposit approval error:",
            error
        );


        // ==================================
        // RETURN TO PENDING
        // ONLY IF PROCESSING FAILED
        // ==================================

        try {

            await update(
                requestRef,
                {

                    status:
                        "pending"

                }
            );

        }
        catch (rollbackError) {

            console.error(
                "Deposit rollback error:",
                rollbackError
            );

        }


        alert(
            "Deposit approval failed: " +
            error.message
        );

    }

}


// ======================================
// REJECT DEPOSIT
// SAFE - ONCE ONLY
// ======================================

async function rejectDeposit(id) {

    if (!currentAdmin) {

        alert("Admin session not ready.");

        return;

    }


    if (!id) {

        alert("Invalid deposit request.");

        return;

    }


    const requestRef =
        ref(
            db,
            "depositRequests/" + id
        );


    // ==================================
    // STEP 1
    // CLAIM REQUEST
    // ==================================

    let claim;


    try {

        claim =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    const status =
                        String(
                            current.status ||
                            "pending"
                        ).toLowerCase();


                    // ONLY PENDING CAN BE REJECTED

                    if (status !== "pending") {
                        return;
                    }


                    return {

                        ...current,

                        status:
                            "processing",

                        processingAt:
                            Date.now(),

                        processingBy:
                            currentAdmin.uid

                    };

                }
            );

    }
    catch (error) {

        console.error(
            "Reject claim error:",
            error
        );


        alert(
            "Could not process rejection."
        );

        return;

    }


    // ==================================
    // CLAIM FAILED
    // ==================================

    if (!claim.committed) {

        alert(
            "This deposit has already been processed."
        );

        return;

    }


    const deposit =
        claim.snapshot.val() || {};


    try {

        // ==================================
        // MARK REJECTED
        // ==================================

        await update(
            requestRef,
            {

                status:
                    "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );


        // ==================================
        // TRANSACTION RECORD
        // ==================================

        const transactionRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        await set(
            transactionRef,
            {

                uid:
                    deposit.uid ||
                    deposit.userId ||
                    deposit.userUID ||
                    "",

                type:
                    "deposit",

                amount:
                    Number(
                        deposit.amount || 0
                    ),

                status:
                    "rejected",

                reference:
                    id,

                requestId:
                    id,

                rejectedBy:
                    currentAdmin.uid,

                date:
                    Date.now()

            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Deposit Rejected Successfully"
        );


        console.log(
            "Deposit rejected:",
            id
        );

    }
    catch (error) {

        console.error(
            "Reject deposit error:",
            error
        );


        // ==================================
        // RETURN TO PENDING
        // ==================================

        try {

            await update(
                requestRef,
                {

                    status:
                        "pending"

                }
            );

        }
        catch (rollbackError) {

            console.error(
                "Reject rollback error:",
                rollbackError
            );

        }


        alert(
            "Deposit rejection failed: " +
            error.message
        );

    }

}


// ======================================
// GLOBAL FUNCTIONS
// ======================================

window.loadDeposits =
    loadDeposits;


window.approveDeposit =
    approveDeposit;


window.rejectDeposit =
    rejectDeposit;


// ======================================
// PART 3 READY
// ======================================

console.log(
    "ADMIN PART 3 READY"
);

// ======================================
// ADMIN.JS - PART 4
// QUICK ACTIONS
// ======================================

function goToPage(page) {

    if (window.openPage) {
        window.openPage(page);
    }

}


document
    .getElementById("refreshDashboard")
    ?.addEventListener(
        "click",
        () => {

            window.loadDashboard?.();

        }
    );


document
    .getElementById("refreshDashboardQuick")
    ?.addEventListener(
        "click",
        () => {

            window.loadDashboard?.();

        }
    );


const pageButtons = {

    openDeposits: "deposits",

    openDepositsBtn: "deposits",

    openWithdraws: "withdraws",

    openWithdrawsBtn: "withdraws",

    openUsers: "users",

    openUsersBtn: "users",

    openTransactions: "transactions",

    openTransactionsBtn: "transactions",

    openSettings: "settings",

    openSettingsBtn: "settings",

    openVipRequests: "vipRequests",

    openVipRequestsBtn: "vipRequests"

};


Object.entries(pageButtons)
    .forEach(([id, page]) => {

        document
            .getElementById(id)
            ?.addEventListener(
                "click",
                () => goToPage(page)
            );

    });


console.log(
    "ADMIN PART 4 READY"
);

// ======================================
// ADMIN.JS - PART 5
// WITHDRAW MANAGEMENT
// ======================================


// ======================================
// LOAD WITHDRAWS
// ======================================

function loadWithdraws() {

    if (!window.adminState?.ready) {
        return;
    }


    const list =
        document.getElementById(
            "withdrawList"
        );


    const empty =
        document.getElementById(
            "emptyWithdraw"
        );


    if (!list) return;


    onValue(
        ref(db, "withdrawRequests"),
        async snapshot => {

            list.innerHTML = "";


            if (!snapshot.exists()) {

                empty &&
                    (empty.style.display = "block");

                return;

            }


            empty &&
                (empty.style.display = "none");


            const requests =
                Object.entries(
                    snapshot.val()
                ).reverse();


            for (
                const [id, request]
                of requests
            ) {

                const item =
                    request || {};


                const uid =
                    item.uid ||
                    item.userId ||
                    item.userUID ||
                    "";


                let user = {};


                if (uid) {

                    const userSnap =
                        await get(
                            ref(
                                db,
                                "users/" + uid
                            )
                        );


                    if (userSnap.exists()) {
                        user =
                            userSnap.val() || {};
                    }

                }


                const status =
                    String(
                        item.status ||
                        "pending"
                    ).toLowerCase();


                const name =
                    item.fullName ||
                    item.name ||
                    user.fullName ||
                    user.name ||
                    user.username ||
                    "Unknown User";


                const email =
                    item.email ||
                    user.email ||
                    "-";


                const phone =
                    item.phone ||
                    item.phoneNumber ||
                    user.phone ||
                    "-";


                const amount =
                    Number(
                        item.amount || 0
                    );


                const method =
                    item.paymentMethod ||
                    item.method ||
                    "-";


                const account =
                    item.accountNumber ||
                    item.account ||
                    item.destination ||
                    item.phoneNumber ||
                    item.phone ||
                    "-";


                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card";


                card.innerHTML = `

                    <div class="request-top">

                        <h3>
                            <i class="fa-solid fa-money-bill-transfer"></i>
                            Withdraw Request
                        </h3>

                        <span class="status ${escapeHTML(status)}">
                            ${escapeHTML(status)}
                        </span>

                    </div>

                    <div class="user-profile-box">

                        <h4>
                            <i class="fa-solid fa-user"></i>
                            User Information
                        </h4>

                        <p>
                            <strong>Name:</strong>
                            ${escapeHTML(name)}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${escapeHTML(email)}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHTML(phone)}
                        </p>

                        <p>
                            <strong>User ID:</strong>
                            ${escapeHTML(uid || "-")}
                        </p>

                    </div>

                    <div class="withdraw-info">

                        <p>
                            <strong>Amount:</strong>
                            ${amount.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Payment Method:</strong>
                            ${escapeHTML(method)}
                        </p>

                        <p>
                            <strong>Account:</strong>
                            ${escapeHTML(account)}
                        </p>

                        <p>
                            <strong>Date:</strong>
                            ${escapeHTML(
                                item.createdAt ||
                                item.requestDate ||
                                item.date ||
                                "-"
                            )}
                        </p>

                    </div>

                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            data-withdraw-action="approve"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-check"></i>
                            ${status === "approved"
                                ? "Approved"
                                : "Approve"}
                        </button>

                        <button
                            class="rejectBtn"
                            data-withdraw-action="reject"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >
                            <i class="fa-solid fa-circle-xmark"></i>
                            ${status === "rejected"
                                ? "Rejected"
                                : "Reject"}
                        </button>

                    </div>
                `;


                list.appendChild(card);

            }


            list.querySelectorAll(
                "[data-withdraw-action]"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        if (button.disabled) {
                            return;
                        }


                        button.disabled = true;


                        const id =
                            button.dataset.id;


                        if (
                            button.dataset.withdrawAction ===
                            "approve"
                        ) {

                            approveWithdraw(id);

                        }
                        else {

                            rejectWithdraw(id);

                        }

                    }
                );

            });

        }
    );

}


// ======================================
// APPROVE WITHDRAW
// ======================================

async function approveWithdraw(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "withdrawRequests/" + id
        );


    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) return;

                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


                if (status !== "pending") {
                    return;
                }


                return {
                    ...current,
                    status: "processing",
                    processingAt: Date.now(),
                    processingBy: currentAdmin.uid
                };

            }
        );


    if (!claim.committed) {

        alert(
            "Withdraw already processed."
        );

        return;

    }


    const request =
        claim.snapshot.val();


    const uid =
        request.uid ||
        request.userId ||
        request.userUID ||
        "";


    try {

        if (!uid) {
            throw new Error(
                "Withdraw has no user ID."
            );
        }


        const amount =
            Number(request.amount || 0);


        if (
            !Number.isFinite(amount) ||
            amount <= 0
        ) {

            throw new Error(
                "Invalid withdraw amount."
            );

        }


        const userRef =
            ref(
                db,
                "users/" + uid
            );


        const balanceResult =
            await runTransaction(
                userRef,
                user => {

                    if (!user) return;

                    const balance =
                        Number(
                            user.balance || 0
                        );


                    if (balance < amount) {
                        return;
                    }


                    return {

                        ...user,

                        balance:
                            balance - amount,

                        totalWithdraw:
                            Number(
                                user.totalWithdraw || 0
                            ) + amount

                    };

                }
            );


        if (!balanceResult.committed) {

            throw new Error(
                "Insufficient user balance."
            );

        }


        await update(
            requestRef,
            {

                status: "approved",

                approvedAt: Date.now(),

                approvedBy:
                    currentAdmin.uid

            }
        );


        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid,

                type: "withdraw",

                amount,

                status: "approved",

                reference: id,

                approvedBy:
                    currentAdmin.uid,

                date: Date.now()

            }
        );


        alert(
            "Withdraw Approved Successfully"
        );

    }
    catch (error) {

        console.error(
            "Withdraw approval error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "Withdraw approval failed: " +
            error.message
        );

    }

}


// ======================================
// REJECT WITHDRAW
// ======================================

async function rejectWithdraw(id) {

    if (!currentAdmin) return;


    const requestRef =
        ref(
            db,
            "withdrawRequests/" + id
        );


    const claim =
        await runTransaction(
            requestRef,
            current => {

                if (!current) return;

                const status =
                    String(
                        current.status ||
                        "pending"
                    ).toLowerCase();


                if (status !== "pending") {
                    return;
                }


                return {
                    ...current,
                    status: "processing",
                    processingAt: Date.now(),
                    processingBy: currentAdmin.uid
                };

            }
        );


    if (!claim.committed) {

        alert(
            "Withdraw already processed."
        );

        return;

    }


    try {

        const request =
            claim.snapshot.val();


        await update(
            requestRef,
            {

                status: "rejected",

                rejectedAt: Date.now(),

                rejectedBy:
                    currentAdmin.uid

            }
        );


        await set(
            push(
                ref(db, "transactions")
            ),
            {

                uid:
                    request.uid ||
                    request.userId ||
                    request.userUID ||
                    "",

                type: "withdraw",

                amount:
                    Number(
                        request.amount || 0
                    ),

                status: "rejected",

                reference: id,

                rejectedBy:
                    currentAdmin.uid,

                date: Date.now()

            }
        );


        alert(
            "Withdraw Rejected Successfully"
        );

    }
    catch (error) {

        console.error(
            "Reject withdraw error:",
            error
        );


        await update(
            requestRef,
            {
                status: "pending"
            }
        );


        alert(
            "Reject withdraw failed: " +
            error.message
        );

    }

}


window.loadWithdraws =
    loadWithdraws;

window.approveWithdraw =
    approveWithdraw;

window.rejectWithdraw =
    rejectWithdraw;


console.log(
    "ADMIN PART 5 READY"
);
// ======================================
// ADMIN.JS - PART 6
// VIP REQUESTS
// FIXED BUTTON PROCESSING UI
// ======================================


// ======================================
// VIP DATE
// ======================================

function formatVipDate(value) {

    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleString();

}


// ======================================
// VIP PHOTO
// ======================================

function getVipPhoto(request, user) {

    return (
        request?.photoURL ||
        request?.photoUrl ||
        request?.photo ||
        request?.profilePhoto ||
        user?.photoURL ||
        user?.photoUrl ||
        user?.photo ||
        user?.profilePhoto ||
        ""
    );

}


// ======================================
// GET VIP NUMBER SAFELY
// ======================================

function getVipNumber(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            value !== ""
        ) {

            const number = Number(value);

            if (
                Number.isFinite(number) &&
                number > 0
            ) {

                return number;

            }

        }

    }

    return 0;

}


// ======================================
// FIND VIP PLAN
// ======================================

async function findVipPlan(request) {

    const item = request || {};


    // ----------------------------------
    // POSSIBLE PLAN ID FIELDS
    // ----------------------------------

    const planId =
        item.vipPlanId ||
        item.planId ||
        item.vipId ||
        item.packageId ||
        item.planKey ||
        item.vipKey ||
        item.packageKey ||
        item.vipPlanKey ||
        "";


    // ----------------------------------
    // REQUEST ALREADY HAS DURATION
    // ----------------------------------

    if (
        getVipNumber(
            item.duration,
            item.days,
            item.durationDays,
            item.vipDuration,
            item.planDuration,
            item.totalDays
        ) > 0
    ) {

        return item;

    }


    // ----------------------------------
    // NO PLAN ID
    // ----------------------------------

    if (!planId) {

        return {};

    }


    // ----------------------------------
    // GET VIP PLANS
    // ----------------------------------

    try {

        const plansSnap =
            await get(
                ref(
                    db,
                    "vipPlans"
                )
            );


        if (!plansSnap.exists()) {

            return {};

        }


        const plans =
            plansSnap.val() || {};


        // ----------------------------------
        // DIRECT KEY MATCH
        // ----------------------------------

        if (plans[planId]) {

            return plans[planId] || {};

        }


        // ----------------------------------
        // SEARCH INSIDE PLANS
        // ----------------------------------

        for (
            const [key, plan]
            of Object.entries(plans)
        ) {

            const p = plan || {};


            const possibleId =
                p.id ||
                p.planId ||
                p.vipPlanId ||
                p.key ||
                key;


            if (
                String(possibleId) ===
                String(planId)
            ) {

                return p;

            }

        }

    }
    catch (error) {

        console.error(
            "Error finding VIP plan:",
            error
        );

    }


    return {};

}


// ======================================
// LOAD VIP REQUESTS
// ======================================

function loadVipRequests() {

    if (!window.adminState?.ready) {

        return;

    }


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
            "vipRequestList not found."
        );

        return;

    }


    onValue(
        ref(
            db,
            "vipPurchaseRequests"
        ),
        async snapshot => {

            list.innerHTML = "";


            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;


            // ==================================
            // NO REQUESTS
            // ==================================

            if (!snapshot.exists()) {

                if (empty) {

                    empty.style.display =
                        "block";

                }


                updateText(
                    "vipTotalCount",
                    0
                );

                updateText(
                    "vipPendingCount",
                    0
                );

                updateText(
                    "vipApprovedCount",
                    0
                );

                updateText(
                    "vipRejectedCount",
                    0
                );


                return;

            }


            if (empty) {

                empty.style.display =
                    "none";

            }


            const requests =
                Object.entries(
                    snapshot.val()
                ).reverse();


            // ==================================
            // RENDER REQUESTS
            // ==================================

            for (
                const [id, request]
                of requests
            ) {

                const item =
                    request || {};


                total++;


                const status =
                    String(
                        item.status ||
                        "pending"
                    ).toLowerCase();


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


                // ==================================
                // USER ID
                // ==================================

                const uid =
                    item.uid ||
                    item.userId ||
                    item.userUID ||
                    "";


                let user = {};


                // ==================================
                // LOAD USER
                // ==================================

                if (uid) {

                    try {

                        const userSnap =
                            await get(
                                ref(
                                    db,
                                    "users/" + uid
                                )
                            );


                        if (
                            userSnap.exists()
                        ) {

                            user =
                                userSnap.val() ||
                                {};

                        }

                    }
                    catch (error) {

                        console.error(
                            "VIP user loading error:",
                            error
                        );

                    }

                }


                // ==================================
                // FIND PLAN
                // ==================================

                const plan =
                    await findVipPlan(
                        item
                    );


                // ==================================
                // USER INFO
                // ==================================

                const name =
                    item.fullName ||
                    item.name ||
                    item.username ||
                    user.fullName ||
                    user.name ||
                    user.username ||
                    "Unknown User";


                const email =
                    item.email ||
                    user.email ||
                    "-";


                const phone =
                    item.phone ||
                    item.phoneNumber ||
                    user.phone ||
                    user.phoneNumber ||
                    "-";


                // ==================================
                // VIP NAME
                // ==================================

                const vipName =
                    item.vipName ||
                    item.planName ||
                    item.namePlan ||
                    item.plan ||
                    item.vip ||
                    plan.name ||
                    plan.vipName ||
                    plan.planName ||
                    "VIP Plan";


                // ==================================
                // PRICE
                // ==================================

                const price =
                    getVipNumber(
                        item.price,
                        item.vipPrice,
                        item.amount,
                        plan.price,
                        plan.vipPrice
                    );


                // ==================================
                // DAILY INCOME
                // ==================================

                const daily =
                    getVipNumber(
                        item.dailyIncome,
                        item.daily,
                        item.dailyProfit,
                        plan.dailyIncome,
                        plan.daily,
                        plan.dailyProfit
                    );


                // ==================================
                // DURATION
                // ==================================

                let duration =
                    getVipNumber(
                        item.duration,
                        item.days,
                        item.durationDays,
                        item.vipDuration,
                        item.planDuration,
                        item.totalDays,

                        plan.duration,
                        plan.days,
                        plan.durationDays,
                        plan.vipDuration,
                        plan.planDuration,
                        plan.totalDays
                    );


                // ==================================
                // CALCULATE DURATION
                // ==================================

                if (
                    duration <= 0 &&
                    daily > 0
                ) {

                    const totalProfitForCalc =
                        getVipNumber(
                            item.totalProfit,
                            item.profit,
                            item.total,

                            plan.totalProfit,
                            plan.profit,
                            plan.total
                        );


                    if (
                        totalProfitForCalc > 0
                    ) {

                        const calculated =
                            totalProfitForCalc /
                            daily;


                        if (
                            Number.isFinite(
                                calculated
                            ) &&
                            calculated > 0
                        ) {

                            duration =
                                Math.round(
                                    calculated
                                );

                        }

                    }

                }


                // ==================================
                // TOTAL PROFIT
                // ==================================

                let profit =
                    getVipNumber(
                        item.totalProfit,
                        item.profit,
                        item.total,

                        plan.totalProfit,
                        plan.profit,
                        plan.total
                    );


                if (
                    profit <= 0 &&
                    daily > 0 &&
                    duration > 0
                ) {

                    profit =
                        daily *
                        duration;

                }


                // ==================================
                // PHOTO
                // ==================================

                const photo =
                    getVipPhoto(
                        item,
                        user
                    );


                const photoHTML =
                    photo

                    ?

                    `
                    <img
                        src="${escapeHTML(photo)}"
                        class="vip-user-photo"
                        alt="User"
                        onerror="
                            this.style.display='none';
                            if(this.nextElementSibling){
                                this.nextElementSibling.style.display='flex';
                            }
                        "
                    >

                    <div
                        class="vip-user-avatar"
                        style="display:none;"
                    >
                        <i class="fa-solid fa-user"></i>
                    </div>
                    `

                    :

                    `
                    <div class="vip-user-avatar">
                        <i class="fa-solid fa-user"></i>
                    </div>
                    `;


                // ==================================
                // CARD
                // ==================================

                const card =
                    document.createElement(
                        "div"
                    );


                card.className =
                    "request-card vip-request-card";


                card.dataset.requestId =
                    id;


                card.innerHTML = `

                    <div class="request-top">

                        <h3>
                            <i class="fa-solid fa-crown"></i>
                            VIP Purchase
                        </h3>

                        <span
                            class="status ${escapeHTML(status)}"
                        >
                            ${escapeHTML(status)}
                        </span>

                    </div>


                    <div class="user-profile-box">

                        <div class="vip-profile-header">

                            <div class="vip-photo-wrapper">

                                ${photoHTML}

                            </div>


                            <div class="vip-profile-name">

                                <h4>
                                    ${escapeHTML(name)}
                                </h4>

                                <span>
                                    VIP Buyer
                                </span>

                            </div>

                        </div>


                        <p>
                            <strong>Name:</strong>
                            ${escapeHTML(name)}
                        </p>

                        <p>
                            <strong>Email:</strong>
                            ${escapeHTML(email)}
                        </p>

                        <p>
                            <strong>Phone:</strong>
                            ${escapeHTML(phone)}
                        </p>

                        <p>
                            <strong>User ID:</strong>
                            ${escapeHTML(uid || "-")}
                        </p>

                    </div>


                    <div class="withdraw-info">

                        <p>
                            <strong>VIP Plan:</strong>
                            ${escapeHTML(vipName)}
                        </p>

                        <p>
                            <strong>Price:</strong>
                            ${price.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Daily Income:</strong>
                            ${daily.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Duration:</strong>
                            ${duration} Days
                        </p>

                        <p>
                            <strong>Total Profit:</strong>
                            ${profit.toLocaleString()} RWF
                        </p>

                        <p>
                            <strong>Request Date:</strong>
                            ${escapeHTML(
                                formatVipDate(
                                    item.createdAt ||
                                    item.requestDate ||
                                    item.date ||
                                    item.timestamp
                                )
                            )}
                        </p>

                    </div>


                    <div class="action-buttons">

                        <button
                            class="approveBtn"
                            data-vip-action="approve"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >

                            <i class="fa-solid fa-circle-check"></i>

                            ${
                                status === "approved"
                                    ? "Approved"
                                    : status === "pending"
                                        ? "Approve VIP"
                                        : status === "processing"
                                            ? "Approve Processing..."
                                            : "Approve VIP"
                            }

                        </button>


                        <button
                            class="rejectBtn"
                            data-vip-action="reject"
                            data-id="${escapeHTML(id)}"
                            ${status !== "pending" ? "disabled" : ""}
                        >

                            <i class="fa-solid fa-circle-xmark"></i>

                            ${
                                status === "rejected"
                                    ? "Rejected"
                                    : status === "pending"
                                        ? "Reject VIP"
                                        : status === "processing"
                                            ? "Reject VIP"
                                            : "Reject VIP"
                            }

                        </button>

                    </div>

                `;


                list.appendChild(card);


                // ==================================
                // SAVE RESOLVED VALUES
                // ==================================

                card.dataset.duration =
                    String(duration);


                card.dataset.price =
                    String(price);


                card.dataset.dailyIncome =
                    String(daily);


                card.dataset.totalProfit =
                    String(profit);

            }


            // ==================================
            // COUNTERS
            // ==================================

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


            // ==================================
            // BUTTON EVENTS
            // ==================================

            list.querySelectorAll(
                "[data-vip-action]"
            ).forEach(button => {

                button.addEventListener(
                    "click",
                    async () => {

                        // --------------------------------
                        // PREVENT DOUBLE CLICK
                        // --------------------------------

                        if (
                            button.disabled ||
                            button.dataset.busy === "true"
                        ) {

                            return;

                        }


                        const id =
                            button.dataset.id;


                        const action =
                            button.dataset.vipAction;


                        // --------------------------------
                        // FIND BOTH BUTTONS
                        // --------------------------------

                        const card =
                            button.closest(
                                ".vip-request-card"
                            );


                        const approveButton =
                            card?.querySelector(
                                '[data-vip-action="approve"]'
                            );


                        const rejectButton =
                            card?.querySelector(
                                '[data-vip-action="reject"]'
                            );


                        // --------------------------------
                        // LOCK BOTH BUTTONS
                        // BUT ONLY SHOW PROCESSING
                        // ON THE CLICKED BUTTON
                        // --------------------------------

                        button.dataset.busy =
                            "true";

                        button.disabled =
                            true;


                        if (
                            approveButton &&
                            approveButton !== button
                        ) {

                            approveButton.disabled =
                                true;

                        }


                        if (
                            rejectButton &&
                            rejectButton !== button
                        ) {

                            rejectButton.disabled =
                                true;

                        }


                        // --------------------------------
                        // CHANGE ONLY CLICKED BUTTON
                        // --------------------------------

                        if (
                            action === "approve"
                        ) {

                            button.innerHTML = `
                                <i class="fa-solid fa-spinner fa-spin"></i>
                                Approve Processing...
                            `;

                        }
                        else {

                            button.innerHTML = `
                                <i class="fa-solid fa-spinner fa-spin"></i>
                                Reject Processing...
                            `;

                        }


                        try {

                            // --------------------------------
                            // APPROVE
                            // --------------------------------

                            if (
                                action === "approve"
                            ) {

                                await approveVipRequest(
                                    id
                                );

                            }

                            // --------------------------------
                            // REJECT
                            // --------------------------------

                            else if (
                                action === "reject"
                            ) {

                                await rejectVipRequest(
                                    id
                                );

                            }

                        }
                        catch (error) {

                            console.error(
                                "VIP button error:",
                                error
                            );

                        }

                    }
                );

            });

        }
    );

}


// ======================================
// GLOBAL EXPORT
// ======================================

window.loadVipRequests =
    loadVipRequests;


// ======================================
// PART 6 READY
// ======================================

console.log(
    "ADMIN PART 6 READY - VIP BUTTON PROCESSING FIXED"
);

// ======================================
// ADMIN.JS - PART 7
// VIP APPROVE + REJECT
// SAFE ONE-TIME PROCESSING
// ATOMIC BALANCE + VIP + TRANSACTION
// ======================================


// ======================================
// NUMBER HELPER
// ======================================

function vipNumber(...values) {

    for (const value of values) {

        const n = Number(value);

        if (Number.isFinite(n)) {
            return n;
        }

    }

    return 0;
}


// ======================================
// GET VIP DURATION
// ======================================

async function getVipDuration(request) {

    const item = request || {};

    // ----------------------------------
    // 1. REQUEST DURATION
    // ----------------------------------

    let duration =
        vipNumber(
            item.duration,
            item.days,
            item.durationDays,
            item.vipDuration,
            item.planDuration,
            item.totalDays
        );

    if (
        Number.isFinite(duration) &&
        duration > 0
    ) {

        return Math.round(duration);

    }


    // ----------------------------------
    // 2. FIND VIP PLAN
    // ----------------------------------

    const plan =
        await findVipPlan(item);


    duration =
        vipNumber(
            plan.duration,
            plan.days,
            plan.durationDays,
            plan.vipDuration,
            plan.planDuration,
            plan.totalDays
        );


    if (
        Number.isFinite(duration) &&
        duration > 0
    ) {

        return Math.round(duration);

    }


    // ----------------------------------
    // 3. CALCULATE FROM PROFIT
    // ----------------------------------

    const dailyIncome =
        vipNumber(
            item.dailyIncome,
            item.daily,
            item.dailyProfit,
            plan.dailyIncome,
            plan.daily,
            plan.dailyProfit
        );


    const totalProfit =
        vipNumber(
            item.totalProfit,
            item.profit,
            item.total,
            plan.totalProfit,
            plan.profit,
            plan.total
        );


    if (
        dailyIncome > 0 &&
        totalProfit > 0
    ) {

        const calculated =
            totalProfit / dailyIncome;


        if (
            Number.isFinite(calculated) &&
            calculated > 0
        ) {

            return Math.round(calculated);

        }

    }


    return 0;

}


// ======================================
// APPROVE VIP REQUEST
// ======================================

async function approveVipRequest(id) {

    // ==================================
    // ADMIN CHECK
    // ==================================

    if (!currentAdmin) {

        alert(
            "Admin session not ready."
        );

        return;

    }


    if (!id) {

        alert(
            "Invalid VIP request."
        );

        return;

    }


    const requestRef =
        ref(
            db,
            "vipPurchaseRequests/" + id
        );


    // ==================================
    // STEP 1
    // CLAIM REQUEST
    // ONLY PENDING -> PROCESSING
    // ==================================

    let claim;

    try {

        claim =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    const status =
                        String(
                            current.status ||
                            "pending"
                        ).toLowerCase();


                    // ----------------------------------
                    // IMPORTANT
                    // ONLY PENDING CAN BE CLAIMED
                    // ----------------------------------

                    if (
                        status !== "pending"
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
                            currentAdmin.uid

                    };

                }
            );

    }
    catch (error) {

        console.error(
            "VIP claim error:",
            error
        );


        alert(
            "VIP approval failed: " +
            error.message
        );

        return;

    }


    // ==================================
    // CLAIM FAILED
    // ==================================

    if (
        !claim ||
        !claim.committed
    ) {

        alert(
            "This VIP request has already been processed."
        );

        return;

    }


    const request =
        claim.snapshot.val() || {};


    // ==================================
    // APPROVAL PROCESS
    // ==================================

    try {

        // ==================================
        // USER ID
        // ==================================

        const uid =
            String(
                request.uid ||
                request.userId ||
                request.userUID ||
                ""
            );


        if (!uid) {

            throw new Error(
                "VIP request has no user ID."
            );

        }


        // ==================================
        // FIND VIP PLAN
        // ==================================

        const plan =
            await findVipPlan(
                request
            );


        // ==================================
        // VIP NAME
        // ==================================

        const vipName =
            String(
                request.vipName ||
                request.planName ||
                request.namePlan ||
                request.plan ||
                request.vip ||
                plan.name ||
                plan.vipName ||
                plan.planName ||
                "VIP Plan"
            );


        // ==================================
        // VIP PRICE
        // ==================================

        const price =
            vipNumber(
                request.price,
                request.vipPrice,
                request.amount,
                plan.price,
                plan.vipPrice
            );


        // ==================================
        // DAILY INCOME
        // ==================================

        const dailyIncome =
            vipNumber(
                request.dailyIncome,
                request.daily,
                request.dailyProfit,
                plan.dailyIncome,
                plan.daily,
                plan.dailyProfit
            );


        // ==================================
        // DURATION
        // ==================================

        const duration =
            await getVipDuration(
                request
            );


        // ==================================
        // TOTAL PROFIT
        // ==================================

        let totalProfit =
            vipNumber(
                request.totalProfit,
                request.profit,
                request.total,
                plan.totalProfit,
                plan.profit,
                plan.total
            );


        // ==================================
        // CALCULATE TOTAL PROFIT
        // ==================================

        if (
            totalProfit <= 0 &&
            dailyIncome > 0 &&
            duration > 0
        ) {

            totalProfit =
                dailyIncome *
                duration;

        }


        // ==================================
        // FORCE NUMBERS
        // ==================================

        const safePrice =
            Number(price);

        const safeDailyIncome =
            Number(dailyIncome);

        const safeDuration =
            Math.round(
                Number(duration)
            );

        const safeTotalProfit =
            Number(totalProfit);


        // ==================================
        // VALIDATE PRICE
        // ==================================

        if (
            !Number.isFinite(safePrice) ||
            safePrice <= 0
        ) {

            throw new Error(
                "Invalid VIP price."
            );

        }


        // ==================================
        // VALIDATE DAILY INCOME
        // ==================================

        if (
            !Number.isFinite(safeDailyIncome) ||
            safeDailyIncome < 0
        ) {

            throw new Error(
                "Invalid VIP daily income."
            );

        }


        // ==================================
        // VALIDATE DURATION
        // ==================================

        if (
            !Number.isFinite(safeDuration) ||
            safeDuration <= 0
        ) {

            throw new Error(
                "VIP duration could not be found. Check vipPlans."
            );

        }


        // ==================================
        // VALIDATE TOTAL PROFIT
        // ==================================

        if (
            !Number.isFinite(safeTotalProfit) ||
            safeTotalProfit < 0
        ) {

            throw new Error(
                "Invalid VIP total profit."
            );

        }


        // ==================================
        // USER REF
        // ==================================

        const userRef =
            ref(
                db,
                "users/" + uid
            );


        // ==================================
        // GET USER
        // ==================================

        const userSnap =
            await get(
                userRef
            );


        if (!userSnap.exists()) {

            throw new Error(
                "User not found."
            );

        }


        const user =
            userSnap.val() || {};


        // ==================================
        // CURRENT BALANCE
        // ==================================

        const currentBalance =
            vipNumber(
                user.balance
            );


        if (
            !Number.isFinite(currentBalance) ||
            currentBalance < 0
        ) {

            throw new Error(
                "User balance is invalid."
            );

        }


        // ==================================
        // CHECK BALANCE
        // ==================================

        if (
            currentBalance < safePrice
        ) {

            throw new Error(
                "Insufficient balance. User has " +
                currentBalance.toLocaleString() +
                " RWF but VIP requires " +
                safePrice.toLocaleString() +
                " RWF."
            );

        }


        // ==================================
        // USER INFORMATION
        // ==================================

        const buyerName =
            request.fullName ||
            request.name ||
            request.username ||
            user.fullName ||
            user.name ||
            user.username ||
            "";


        const buyerEmail =
            request.email ||
            user.email ||
            "";


        const buyerPhone =
            request.phone ||
            request.phoneNumber ||
            user.phone ||
            user.phoneNumber ||
            "";


        const buyerPhoto =
            request.photoURL ||
            request.photoUrl ||
            request.photo ||
            request.profilePhoto ||
            user.photoURL ||
            user.photoUrl ||
            user.photo ||
            user.profilePhoto ||
            "";


        // ==================================
        // CREATE KEYS
        // ==================================

        const buyerKey =
            push(
                ref(
                    db,
                    "vipBuyers"
                )
            ).key;


        if (!buyerKey) {

            throw new Error(
                "Could not create VIP buyer ID."
            );

        }


        const userVipKey =
            push(
                ref(
                    db,
                    "users/" +
                    uid +
                    "/vipPlans"
                )
            ).key;


        if (!userVipKey) {

            throw new Error(
                "Could not create user VIP plan ID."
            );

        }


        const transactionKey =
            push(
                ref(
                    db,
                    "transactions"
                )
            ).key;


        if (!transactionKey) {

            throw new Error(
                "Could not create transaction ID."
            );

        }


        // ==================================
        // TIME
        // ==================================

        const now =
            Date.now();


        const startDate =
            now;


        const endDate =
            now +
            (
                safeDuration *
                24 *
                60 *
                60 *
                1000
            );


        // ==================================
        // NEW BALANCE
        // ==================================

        const newBalance =
            Number(
                (
                    currentBalance -
                    safePrice
                ).toFixed(2)
            );


        if (
            newBalance < 0
        ) {

            throw new Error(
                "Balance cannot become negative."
            );

        }


        // ==================================
        // USER VIP PLAN
        // ==================================

        const userVipPlan = {

            id:
                userVipKey,

            vipId:
                String(
                    request.vipPlanId ||
                    request.planId ||
                    request.vipId ||
                    request.packageId ||
                    ""
                ),

            vipPlanId:
                String(
                    request.vipPlanId ||
                    request.planId ||
                    request.vipId ||
                    request.packageId ||
                    ""
                ),

            name:
                vipName,

            vipName:
                vipName,

            planName:
                vipName,

            price:
                Number(safePrice),

            dailyIncome:
                Number(safeDailyIncome),

            totalProfit:
                Number(safeTotalProfit),

            duration:
                Number(safeDuration),

            days:
                Number(safeDuration),

            durationDays:
                Number(safeDuration),

            totalDays:
                Number(safeDuration),

            status:
                "active",

            purchasedAt:
                Number(now),

            approvedAt:
                Number(now),

            startDate:
                Number(startDate),

            endDate:
                Number(endDate),

            // IMPORTANT:
            // Rules require this to be a NUMBER
            lastClaim:
    now,

lastClaimTime:
    now,

lastProfitTime:
    now,

            totalEarned:
                Number(0),

            earned:
                Number(0),

            requestId:
                id,

            vipBuyerId:
                buyerKey,

            approvedBy:
                currentAdmin.uid

        };


        // ==================================
        // VIP BUYER
        // ==================================
        //
        // IMPORTANT:
        // lastClaim was missing before.
        // Firebase Rules require:
        // lastClaim = number
        //
        // ==================================

        const vipBuyer = {

            uid:
                uid,

            name:
                buyerName,

            email:
                buyerEmail,

            phone:
                buyerPhone,

            photoURL:
                buyerPhoto,

            vipName:
                vipName,

            price:
                Number(safePrice),

            dailyIncome:
                Number(safeDailyIncome),

            duration:
                Number(safeDuration),

            days:
                Number(safeDuration),

            durationDays:
                Number(safeDuration),

            totalDays:
                Number(safeDuration),

            totalProfit:
                Number(safeTotalProfit),

            // ==================================
            // REQUIRED BY FIREBASE RULES
            // ==================================

            lastClaim:
                Number(0),

            lastClaimTime:
                Number(0),

            lastProfitTime:
                Number(0),

            totalEarned:
                Number(0),

            earned:
                Number(0),

            requestId:
                id,

            userVipPlanId:
                userVipKey,

            status:
                "active",

            purchasedAt:
                Number(now),

            startDate:
                Number(startDate),

            endDate:
                Number(endDate),

            approvedAt:
                Number(now),

            approvedBy:
                currentAdmin.uid

        };


        // ==================================
        // APPROVED REQUEST
        // ==================================

        const approvedRequest = {

            ...request,

            status:
                "approved",

            vipName:
                vipName,

            price:
                Number(safePrice),

            dailyIncome:
                Number(safeDailyIncome),

            duration:
                Number(safeDuration),

            days:
                Number(safeDuration),

            durationDays:
                Number(safeDuration),

            totalDays:
                Number(safeDuration),

            totalProfit:
                Number(safeTotalProfit),

            approvedAt:
                Number(now),

            approvedBy:
                currentAdmin.uid,

            vipBuyerId:
                buyerKey,

            userVipPlanId:
                userVipKey,

            amountPaid:
                Number(safePrice),

            balanceBefore:
                Number(currentBalance),

            balanceAfter:
                Number(newBalance)

        };


        // ==================================
        // TRANSACTION
        // ==================================

        const transaction = {

            uid:
                uid,

            type:
                "vip_purchase",

            amount:
                Number(safePrice),

            status:
                "approved",

            reference:
                id,

            requestId:
                id,

            vipBuyerId:
                buyerKey,

            userVipPlanId:
                userVipKey,

            vipName:
                vipName,

            duration:
                Number(safeDuration),

            approvedBy:
                currentAdmin.uid,

            date:
                Number(now)

        };


        // ==================================
        // ATOMIC UPDATE
        // ==================================
        //
        // EVERYTHING IS WRITTEN TOGETHER.
        //
        // Balance:
        // currentBalance - price
        //
        // VIP Buyer:
        // created once
        //
        // User VIP:
        // created once
        //
        // Transaction:
        // created once
        //
        // Request:
        // approved
        //
        // ==================================

        const updates = {};


        // ----------------------------------
        // BALANCE
        // ----------------------------------

        updates[
            "users/" +
            uid +
            "/balance"
        ] =
            Number(newBalance);


        // ----------------------------------
        // VIP BUYER
        // ----------------------------------

        updates[
            "vipBuyers/" +
            buyerKey
        ] =
            vipBuyer;


        // ----------------------------------
        // USER VIP PLAN
        // ----------------------------------

        updates[
            "users/" +
            uid +
            "/vipPlans/" +
            userVipKey
        ] =
            userVipPlan;


        // ----------------------------------
        // REQUEST
        // ----------------------------------

        updates[
            "vipPurchaseRequests/" +
            id
        ] =
            approvedRequest;


        // ----------------------------------
        // TRANSACTION
        // ----------------------------------

        updates[
            "transactions/" +
            transactionKey
        ] =
            transaction;


        // ==================================
        // ONE ATOMIC WRITE
        // ==================================

        await update(
            ref(db),
            updates
        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "VIP Approved Successfully\n\n" +
            "VIP: " +
            vipName +
            "\nPrice: " +
            safePrice.toLocaleString() +
            " RWF\n" +
            "Duration: " +
            safeDuration +
            " Days\n\n" +
            "Balance remaining: " +
            newBalance.toLocaleString() +
            " RWF"
        );


        console.log(
            "VIP APPROVED:",
            {

                requestId:
                    id,

                uid:
                    uid,

                vipBuyerId:
                    buyerKey,

                userVipPlanId:
                    userVipKey,

                transactionId:
                    transactionKey,

                price:
                    safePrice,

                balanceBefore:
                    currentBalance,

                balanceAfter:
                    newBalance,

                dailyIncome:
                    safeDailyIncome,

                duration:
                    safeDuration,

                totalProfit:
                    safeTotalProfit,

                lastClaim:
                    0

            }
        );


        // ==================================
        // REFRESH REQUESTS
        // ==================================

        if (
            window.loadVipRequests
        ) {

            window.loadVipRequests();

        }


        // ==================================
        // REFRESH BUYERS
        // ==================================

        if (
            window.loadVipBuyers
        ) {

            window.loadVipBuyers();

        }


        // ==================================
        // REFRESH DASHBOARD
        // ==================================

        if (
            window.loadDashboard
        ) {

            window.loadDashboard();

        }

    }
    catch (error) {

        console.error(
            "VIP approval error:",
            error
        );


        // ==================================
        // ROLLBACK PROCESSING -> PENDING
        // ==================================

        try {

            await update(
                requestRef,
                {

                    status:
                        "pending",

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );

            console.log(
                "VIP request returned to pending:",
                id
            );

        }
        catch (rollbackError) {

            console.error(
                "VIP rollback error:",
                rollbackError
            );

        }


        alert(
            "VIP approval failed: " +
            error.message
        );

    }

}


// ======================================
// REJECT VIP REQUEST
// ======================================

async function rejectVipRequest(id) {

    // ==================================
    // ADMIN CHECK
    // ==================================

    if (!currentAdmin) {

        alert(
            "Admin session not ready."
        );

        return;

    }


    if (!id) {

        alert(
            "Invalid VIP request."
        );

        return;

    }


    const requestRef =
        ref(
            db,
            "vipPurchaseRequests/" + id
        );


    // ==================================
    // CLAIM
    // ONLY PENDING -> PROCESSING
    // ==================================

    let claim;

    try {

        claim =
            await runTransaction(
                requestRef,
                current => {

                    if (!current) {
                        return;
                    }


                    const status =
                        String(
                            current.status ||
                            "pending"
                        ).toLowerCase();


                    // ----------------------------------
                    // ONE-TIME REJECT
                    // ----------------------------------

                    if (
                        status !== "pending"
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
                            currentAdmin.uid

                    };

                }
            );

    }
    catch (error) {

        console.error(
            "VIP reject claim error:",
            error
        );


        alert(
            "VIP rejection failed: " +
            error.message
        );

        return;

    }


    // ==================================
    // CLAIM FAILED
    // ==================================

    if (
        !claim ||
        !claim.committed
    ) {

        alert(
            "This VIP request has already been processed."
        );

        return;

    }


    const request =
        claim.snapshot.val() || {};


    try {

        // ==================================
        // USER ID
        // ==================================

        const uid =
            String(
                request.uid ||
                request.userId ||
                request.userUID ||
                ""
            );


        // ==================================
        // AMOUNT
        // ==================================

        const amount =
            vipNumber(
                request.price,
                request.vipPrice,
                request.amount
            );


        // ==================================
        // TIME
        // ==================================

        const now =
            Date.now();


        // ==================================
        // TRANSACTION KEY
        // ==================================

        const transactionKey =
            push(
                ref(
                    db,
                    "transactions"
                )
            ).key;


        if (!transactionKey) {

            throw new Error(
                "Could not create transaction ID."
            );

        }


        // ==================================
        // REJECTED REQUEST
        // ==================================

        const rejectedRequest = {

            ...request,

            status:
                "rejected",

            rejectedAt:
                Number(now),

            rejectedBy:
                currentAdmin.uid

        };


        // ==================================
        // REJECT TRANSACTION
        // ==================================

        const transaction = {

            uid:
                uid,

            type:
                "vip_purchase",

            amount:
                Number(amount),

            status:
                "rejected",

            reference:
                id,

            requestId:
                id,

            rejectedBy:
                currentAdmin.uid,

            date:
                Number(now)

        };


        // ==================================
        // ATOMIC UPDATE
        // ==================================

        const updates = {};


        updates[
            "vipPurchaseRequests/" +
            id
        ] =
            rejectedRequest;


        updates[
            "transactions/" +
            transactionKey
        ] =
            transaction;


        // ==================================
        // ONE WRITE
        // ==================================

        await update(
            ref(db),
            updates
        );


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "VIP Rejected Successfully"
        );


        console.log(
            "VIP REJECTED:",
            {

                requestId:
                    id,

                uid:
                    uid,

                transactionId:
                    transactionKey

            }
        );


        // ==================================
        // REFRESH
        // ==================================

        if (
            window.loadVipRequests
        ) {

            window.loadVipRequests();

        }

    }
    catch (error) {

        console.error(
            "VIP rejection error:",
            error
        );


        // ==================================
        // ROLLBACK
        // ==================================

        try {

            await update(
                requestRef,
                {

                    status:
                        "pending",

                    processingAt:
                        null,

                    processingBy:
                        null

                }
            );

            console.log(
                "VIP rejection returned to pending:",
                id
            );

        }
        catch (rollbackError) {

            console.error(
                "VIP rejection rollback error:",
                rollbackError
            );

        }


        alert(
            "VIP rejection failed: " +
            error.message
        );

    }

}


// ======================================
// GLOBAL EXPORTS
// ======================================

window.approveVipRequest =
    approveVipRequest;

window.rejectVipRequest =
    rejectVipRequest;

window.getVipDuration =
    getVipDuration;


// ======================================
// PART 7 READY
// ======================================

console.log(
    "ADMIN PART 7 READY - VIP APPROVE/REJECT SAFE"
);


                
// ======================================
// ADMIN.JS - PART 8
// VIP BUYERS
// APPROVED VIP USERS ONLY
// ======================================


function loadVipBuyers() {

    if (!window.adminState?.ready) {
        return;
    }


    const list =
        document.getElementById(
            "vipBuyerList"
        );


    const empty =
        document.getElementById(
            "emptyVipBuyer"
        );


    if (!list) return;


    onValue(
        ref(db, "vipBuyers"),
        snapshot => {

            list.innerHTML = "";


            if (!snapshot.exists()) {

                empty &&
                    (empty.style.display = "block");


                updateText(
                    "vipBuyerTotalCount",
                    0
                );

                updateText(
                    "vipBuyerActiveCount",
                    0
                );

                updateText(
                    "vipBuyerExpiredCount",
                    0
                );


                if (!empty) {

                    list.innerHTML = `
                        <div class="empty-state">
                            <i class="fa-solid fa-crown"></i>
                            <h3>No VIP Buyers</h3>
                            <p>
                                Approved VIP buyers
                                will appear here.
                            </p>
                        </div>
                    `;

                }


                return;

            }


            empty &&
                (empty.style.display = "none");


            const buyers =
                Object.entries(
                    snapshot.val()
                ).reverse();


            let active = 0;
            let expired = 0;


            buyers.forEach(
                ([id, buyer]) => {

                    const item =
                        buyer || {};


                    const duration =
                        Number(
                            item.duration || 0
                        );


                    const start =
                        Number(
                            item.approvedAt ||
                            item.startDate ||
                            item.createdAt ||
                            0
                        );


                    let isExpired =
                        String(
                            item.status ||
                            "active"
                        ).toLowerCase()
                        === "expired";


                    if (
                        !isExpired &&
                        duration > 0 &&
                        start > 0
                    ) {

                        isExpired =
                            Date.now() >
                            start +
                            (
                                duration *
                                24 *
                                60 *
                                60 *
                                1000
                            );

                    }


                    if (isExpired) {
                        expired++;
                    }
                    else {
                        active++;
                    }


                    const photo =
                        item.photoURL ||
                        item.photoUrl ||
                        item.photo ||
                        "";


                    const photoHTML =
                        photo
                        ?

                        `
                        <img
                            src="${escapeHTML(photo)}"
                            class="vip-user-photo"
                            alt="VIP Buyer"
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

                        :

                        `
                        <div class="vip-user-avatar">
                            <i class="fa-solid fa-user"></i>
                        </div>
                        `;


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "request-card vip-buyer-card";


                    card.innerHTML = `

                        <div class="request-top">

                            <h3>
                                <i class="fa-solid fa-crown"></i>
                                VIP Buyer
                            </h3>

                            <span
                                class="status ${
                                    isExpired
                                    ? "expired"
                                    : "approved"
                                }"
                            >
                                ${
                                    isExpired
                                    ? "Expired"
                                    : "Active"
                                }
                            </span>

                        </div>


                        <div class="vip-profile-header">

                            <div class="vip-photo-wrapper">

                                ${photoHTML}

                            </div>


                            <div class="vip-profile-name">

                                <h4>
                                    ${escapeHTML(
                                        item.name ||
                                        "Unknown User"
                                    )}
                                </h4>

                                <span>
                                    VIP Buyer
                                </span>

                            </div>

                        </div>


                        <div class="user-profile-box">

                            <p>
                                <strong>Name:</strong>
                                ${escapeHTML(
                                    item.name || "-"
                                )}
                            </p>

                            <p>
                                <strong>Email:</strong>
                                ${escapeHTML(
                                    item.email || "-"
                                )}
                            </p>

                            <p>
                                <strong>Phone:</strong>
                                ${escapeHTML(
                                    item.phone || "-"
                                )}
                            </p>

                            <p>
                                <strong>User ID:</strong>
                                ${escapeHTML(
                                    item.uid || "-"
                                )}
                            </p>

                        </div>


                        <div class="withdraw-info">

                            <p>
                                <strong>VIP Plan:</strong>
                                ${escapeHTML(
                                    item.vipName ||
                                    "VIP Plan"
                                )}
                            </p>

                            <p>
                                <strong>Price:</strong>
                                ${Number(
                                    item.price || 0
                                ).toLocaleString()} RWF
                            </p>

                            <p>
                                <strong>Daily Income:</strong>
                                ${Number(
                                    item.dailyIncome || 0
                                ).toLocaleString()} RWF
                            </p>

                            <p>
                                <strong>Duration:</strong>
                                ${duration} Days
                            </p>

                            <p>
                                <strong>Total Profit:</strong>
                                ${Number(
                                    item.totalProfit || 0
                                ).toLocaleString()} RWF
                            </p>

                            <p>
                                <strong>Approved Date:</strong>
                                ${escapeHTML(
                                    formatVipDate(
                                        item.approvedAt
                                    )
                                )}
                            </p>

                        </div>

                    `;


                    list.appendChild(card);

                }
            );


            updateText(
                "vipBuyerTotalCount",
                buyers.length
            );


            updateText(
                "vipBuyerActiveCount",
                active
            );


            updateText(
                "vipBuyerExpiredCount",
                expired
            );


            console.log(
                "VIP Buyers loaded:",
                buyers.length
            );

        }
    );

}


window.loadVipBuyers =
    loadVipBuyers;


console.log(
    "ADMIN PART 8 READY"
);


// ======================================
// ADMIN.JS - PART 9
// TRANSACTIONS
// DEPOSITS + WITHDRAWS + VIP PURCHASES
// ======================================


// ======================================
// TRANSACTION DATE
// ======================================

function formatTransactionDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(
            Number(value)
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(value);

    }


    return date.toLocaleString();

}


// ======================================
// TRANSACTION TYPE
// ======================================

function getTransactionType(transaction) {

    const type =
        String(
            transaction?.type ||
            ""
        ).toLowerCase()
        .trim();


    if (
        type === "deposit"
    ) {

        return "deposit";

    }


    if (
        type === "withdraw" ||
        type === "withdrawal"
    ) {

        return "withdraw";

    }


    if (
        type === "vip_purchase" ||
        type === "vippurchase" ||
        type === "vip"
    ) {

        return "vip_purchase";

    }


    return type || "unknown";

}


// ======================================
// TRANSACTION TYPE LABEL
// ======================================

function getTransactionTypeLabel(type) {

    switch (type) {

        case "deposit":
            return "Deposit";


        case "withdraw":
            return "Withdraw";


        case "vip_purchase":
            return "VIP Purchase";


        default:
            return "Transaction";

    }

}


// ======================================
// TRANSACTION STATUS LABEL
// ======================================

function getTransactionStatusLabel(status) {

    const value =
        String(
            status ||
            "unknown"
        ).toLowerCase();


    switch (value) {

        case "approved":
            return "Approved";


        case "rejected":
            return "Rejected";


        case "pending":
            return "Pending";


        case "processing":
            return "Processing";


        default:
            return (
                value.charAt(0).toUpperCase() +
                value.slice(1)
            );

    }

}


// ======================================
// TRANSACTION SEARCH TEXT
// ======================================

function getTransactionSearchText(
    id,
    transaction
) {

    const item =
        transaction || {};


    return [

        id,

        item.uid,
        item.userId,
        item.userUID,

        item.reference,
        item.requestId,

        item.type,
        item.status,

        item.vipName,
        item.planName,

        item.approvedBy,
        item.rejectedBy

    ]
    .filter(
        value =>
            value !== undefined &&
            value !== null
    )
    .join(" ")
    .toLowerCase();

}


// ======================================
// LOAD TRANSACTIONS
// ======================================

function loadTransactions() {

    if (
        !window.adminState?.ready
    ) {

        console.log(
            "Transactions waiting for Admin Auth..."
        );

        return;

    }


    const list =
        document.getElementById(
            "transactionList"
        );


    const empty =
        document.getElementById(
            "emptyTransaction"
        );


    const searchInput =
        document.getElementById(
            "transactionSearch"
        );


    const filterSelect =
        document.getElementById(
            "transactionFilter"
        );


    if (!list) {

        console.warn(
            "transactionList not found."
        );

        return;

    }


    // ==================================
    // ADD VIP FILTER OPTION
    // ==================================

    if (filterSelect) {

        const vipOption =
            filterSelect.querySelector(
                'option[value="vip_purchase"]'
            );


        if (!vipOption) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                "vip_purchase";


            option.textContent =
                "VIP Purchases";


            filterSelect.appendChild(
                option
            );

        }

    }


    // ==================================
    // FIREBASE TRANSACTIONS
    // ==================================

    onValue(
        ref(
            db,
            "transactions"
        ),

        snapshot => {

            list.innerHTML = "";


            // ==================================
            // NO TRANSACTIONS
            // ==================================

            if (
                !snapshot.exists()
            ) {

                if (empty) {

                    empty.style.display =
                        "block";

                }


                console.log(
                    "No transactions found."
                );


                return;

            }


            if (empty) {

                empty.style.display =
                    "none";

            }


            // ==================================
            // CONVERT TO ARRAY
            // ==================================

            const transactions =
                Object.entries(
                    snapshot.val() || {}
                )
                .map(
                    ([id, transaction]) => ({

                        id,

                        data:
                            transaction || {}

                    })
                )
                .sort(
                    (a, b) => {

                        const dateA =
                            Number(
                                a.data.date ||
                                a.data.createdAt ||
                                a.data.timestamp ||
                                a.data.approvedAt ||
                                a.data.rejectedAt ||
                                0
                            );


                        const dateB =
                            Number(
                                b.data.date ||
                                b.data.createdAt ||
                                b.data.timestamp ||
                                b.data.approvedAt ||
                                b.data.rejectedAt ||
                                0
                            );


                        return dateB - dateA;

                    }
                );


            // ==================================
            // FILTER VALUES
            // ==================================

            const search =
                String(
                    searchInput?.value ||
                    ""
                )
                .toLowerCase()
                .trim();


            const selectedType =
                String(
                    filterSelect?.value ||
                    "all"
                )
                .toLowerCase();


            // ==================================
            // APPLY FILTER
            // ==================================

            const filtered =
                transactions.filter(
                    item => {

                        const transaction =
                            item.data || {};


                        const type =
                            getTransactionType(
                                transaction
                            );


                        const searchText =
                            getTransactionSearchText(
                                item.id,
                                transaction
                            );


                        // --------------------------
                        // TYPE FILTER
                        // --------------------------

                        if (
                            selectedType !== "all" &&
                            type !== selectedType
                        ) {

                            return false;

                        }


                        // --------------------------
                        // SEARCH FILTER
                        // --------------------------

                        if (
                            search &&
                            !searchText.includes(
                                search
                            )
                        ) {

                            return false;

                        }


                        return true;

                    }
                );


            // ==================================
            // NOTHING AFTER FILTER
            // ==================================

            if (
                filtered.length === 0
            ) {

                if (empty) {

                    empty.style.display =
                        "block";


                    empty.innerHTML = `

                        <i class="fa-solid fa-clock-rotate-left"></i>

                        <h3>
                            No Transactions Found
                        </h3>

                        <p>
                            No transaction matches your search or filter.
                        </p>

                    `;

                }


                return;

            }


            if (empty) {

                empty.style.display =
                    "none";

            }


            // ==================================
            // RENDER TRANSACTIONS
            // ==================================

            filtered.forEach(
                item => {

                    const id =
                        item.id;


                    const transaction =
                        item.data || {};


                    const type =
                        getTransactionType(
                            transaction
                        );


                    const typeLabel =
                        getTransactionTypeLabel(
                            type
                        );


                    const status =
                        String(
                            transaction.status ||
                            "unknown"
                        ).toLowerCase();


                    const statusLabel =
                        getTransactionStatusLabel(
                            status
                        );


                    const uid =
                        transaction.uid ||
                        transaction.userId ||
                        transaction.userUID ||
                        "-";


                    const amount =
                        Number(
                            transaction.amount ||
                            transaction.price ||
                            0
                        );


                    const reference =
                        transaction.reference ||
                        transaction.requestId ||
                        "-";


                    const date =
                        transaction.date ||
                        transaction.createdAt ||
                        transaction.timestamp ||
                        transaction.approvedAt ||
                        transaction.rejectedAt ||
                        0;


                    const vipName =
                        transaction.vipName ||
                        transaction.planName ||
                        "";


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "transaction-card";


                    // ==================================
                    // STATUS CLASS
                    // ==================================

                    let statusClass =
                        "pending";


                    if (
                        status === "approved"
                    ) {

                        statusClass =
                            "approved";

                    }
                    else if (
                        status === "rejected"
                    ) {

                        statusClass =
                            "rejected";

                    }
                    else if (
                        status === "processing"
                    ) {

                        statusClass =
                            "processing";

                    }


                    // ==================================
                    // TYPE ICON
                    // ==================================

                    let typeIcon =
                        "fa-clock-rotate-left";


                    if (
                        type === "deposit"
                    ) {

                        typeIcon =
                            "fa-money-bill-trend-up";

                    }
                    else if (
                        type === "withdraw"
                    ) {

                        typeIcon =
                            "fa-money-bill-transfer";

                    }
                    else if (
                        type === "vip_purchase"
                    ) {

                        typeIcon =
                            "fa-crown";

                    }


                    // ==================================
                    // VIP INFORMATION
                    // ==================================

                    const vipHTML =
                        type === "vip_purchase"

                        ?

                        `

                        <p>
                            <strong>
                                VIP Plan:
                            </strong>

                            ${escapeHTML(
                                vipName ||
                                "VIP Plan"
                            )}
                        </p>

                        ${
                            transaction.duration
                            ?

                            `
                            <p>
                                <strong>
                                    Duration:
                                </strong>

                                ${Number(
                                    transaction.duration
                                )} Days
                            </p>
                            `

                            :

                            ""
                        }

                        `

                        :

                        "";


                    // ==================================
                    // ADMIN INFORMATION
                    // ==================================

                    let adminHTML =
                        "";


                    if (
                        transaction.approvedBy
                    ) {

                        adminHTML += `

                            <p>
                                <strong>
                                    Approved By:
                                </strong>

                                ${escapeHTML(
                                    transaction.approvedBy
                                )}
                            </p>

                        `;

                    }


                    if (
                        transaction.rejectedBy
                    ) {

                        adminHTML += `

                            <p>
                                <strong>
                                    Rejected By:
                                </strong>

                                ${escapeHTML(
                                    transaction.rejectedBy
                                )}
                            </p>

                        `;

                    }


                    // ==================================
                    // CARD
                    // ==================================

                    card.innerHTML = `

                        <div class="request-top">

                            <h3>

                                <i class="fa-solid ${typeIcon}"></i>

                                ${escapeHTML(
                                    typeLabel
                                )}

                            </h3>


                            <span
                                class="status ${statusClass}"
                            >
                                ${escapeHTML(
                                    statusLabel
                                )}
                            </span>

                        </div>


                        <div class="withdraw-details">

                            <p>

                                <strong>
                                    Amount:
                                </strong>

                                ${amount.toLocaleString()}
                                RWF

                            </p>


                            <p>

                                <strong>
                                    User ID:
                                </strong>

                                ${escapeHTML(
                                    uid
                                )}

                            </p>


                            <p>

                                <strong>
                                    Reference:
                                </strong>

                                ${escapeHTML(
                                    reference
                                )}

                            </p>


                            <p>

                                <strong>
                                    Transaction ID:
                                </strong>

                                ${escapeHTML(
                                    id
                                )}

                            </p>


                            ${vipHTML}


                            <p>

                                <strong>
                                    Date:
                                </strong>

                                ${escapeHTML(
                                    formatTransactionDate(
                                        date
                                    )
                                )}

                            </p>


                            ${adminHTML}

                        </div>

                    `;


                    list.appendChild(
                        card
                    );

                }
            );


            console.log(
                "Transactions loaded:",
                filtered.length,
                "/",
                transactions.length
            );

        },

        error => {

            console.error(
                "Transaction loading error:",
                error
            );


            list.innerHTML = `

                <div class="empty-state">

                    <i class="fa-solid fa-triangle-exclamation"></i>

                    <h3>
                        Failed to Load Transactions
                    </h3>

                    <p>
                        ${escapeHTML(
                            error.message ||
                            "Unknown Firebase error."
                        )}
                    </p>

                </div>

            `;

        }

    );


    // ==================================
    // SEARCH
    // ==================================

    if (
        searchInput &&
        !searchInput.dataset.bound
    ) {

        searchInput.dataset.bound =
            "true";


        searchInput.addEventListener(
            "input",
            () => {

                loadTransactions();

            }
        );

    }


    // ==================================
    // FILTER
    // ==================================

    if (
        filterSelect &&
        !filterSelect.dataset.bound
    ) {

        filterSelect.dataset.bound =
            "true";


        filterSelect.addEventListener(
            "change",
            () => {

                loadTransactions();

            }
        );

    }

}


// ======================================
// GLOBAL EXPORT
// ======================================

window.loadTransactions =
    loadTransactions;


// ======================================
// PART 9 READY
// ======================================

console.log(
    "ADMIN PART 9 READY - TRANSACTIONS"
);
