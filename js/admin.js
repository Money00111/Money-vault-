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
// VIP APPROVE + REFERRAL BONUS
// ======================================

// ======================================
// REFERRAL BONUS
// ======================================

const REFERRAL_BONUS_AMOUNT = 1000;


// ======================================
// GET VIP DURATION
// ======================================

function getVipDuration(request) {

    const possibleDuration = [
        request?.duration,
        request?.days,
        request?.durationDays,
        request?.vipDuration,
        request?.planDuration,
        request?.totalDays
    ];

    for (const value of possibleDuration) {

        const number = Number(value);

        if (
            Number.isFinite(number) &&
            number > 0
        ) {
            return Math.round(number);
        }
    }


    // ==================================
    // CALCULATE FROM PROFIT
    // ==================================

    const dailyIncome = Number(
        request?.dailyIncome ??
        request?.daily ??
        request?.dailyProfit ??
        0
    );

    const totalProfit = Number(
        request?.totalProfit ??
        request?.profit ??
        request?.total ??
        0
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
// FIND REFERRER
// ======================================

async function findReferrer(user, request = {}) {

    console.log(
        "========== FIND REFERRER =========="
    );

    console.log(
        "USER referredBy:",
        user?.referredBy
    );

    console.log(
        "USER referralCodeUsed:",
        user?.referralCodeUsed
    );

    console.log(
        "REQUEST referredBy:",
        request?.referredBy
    );

    console.log(
        "REQUEST referralCodeUsed:",
        request?.referralCodeUsed
    );


    // ==================================
    // 1. TRY REFERRED BY UID
    // ==================================

    const possibleUid = String(
        user?.referredBy ||
        request?.referredBy ||
        ""
    ).trim();

    if (
        possibleUid !== "" &&
        possibleUid !== "0" &&
        possibleUid !== "null" &&
        possibleUid !== "undefined"
    ) {

        console.log(
            "TRYING REFERRED BY UID:",
            possibleUid
        );

        const referrerSnapshot = await get(
            ref(
                db,
                "users/" + possibleUid
            )
        );

        if (
            referrerSnapshot.exists()
        ) {

            console.log(
                "REFERRER FOUND BY UID:",
                possibleUid
            );

            return {
                uid: possibleUid,
                data:
                    referrerSnapshot.val() || {}
            };
        }
    }


    // ==================================
    // 2. GET REFERRAL CODE
    // ==================================

    const usedCode = String(
        user?.referralCodeUsed ||
        request?.referralCodeUsed ||
        ""
    )
        .trim()
        .toUpperCase();


    console.log(
        "REFERRAL CODE TO SEARCH:",
        usedCode
    );


    if (!usedCode) {

        console.warn(
            "NO REFERRAL CODE FOUND"
        );

        return null;
    }


    // ==================================
    // 3. READ USERS
    // ==================================

    const usersSnapshot = await get(
        ref(db, "users")
    );

    if (!usersSnapshot.exists()) {

        console.warn(
            "USERS NODE EMPTY"
        );

        return null;
    }


    // ==================================
    // 4. SEARCH REFERRAL CODE
    // ==================================

    let foundReferrer = null;

    usersSnapshot.forEach(child => {

        const data =
            child.val() || {};

        const savedCode = String(
            data.referralCode || ""
        )
            .trim()
            .toUpperCase();


        console.log(
            "CHECK:",
            child.key,
            savedCode,
            "VS",
            usedCode
        );


        if (
            savedCode === usedCode
        ) {

            foundReferrer = {
                uid: child.key,
                data
            };
        }
    });


    // ==================================
    // 5. RESULT
    // ==================================

    if (foundReferrer) {

        console.log(
            "================================"
        );

        console.log(
            "REFERRER FOUND:",
            foundReferrer.uid
        );

        console.log(
            "REFERRAL CODE:",
            usedCode
        );

        console.log(
            "================================"
        );

    } else {

        console.warn(
            "================================"
        );

        console.warn(
            "REFERRER NOT FOUND"
        );

        console.warn(
            "CODE:",
            usedCode
        );

        console.warn(
            "================================"
        );
    }


    return foundReferrer;
}


// ======================================
// APPROVE VIP REQUEST
// ======================================

async function approveVipRequest(id) {

    if (!currentAdmin) {

        alert(
            "Admin not logged in."
        );

        return;
    }


    if (!id) {

        alert(
            "Invalid VIP request."
        );

        return;
    }


    try {

        // ==================================
        // REQUEST REFERENCE
        // ==================================

        const requestRef = ref(
            db,
            "vipPurchaseRequests/" + id
        );


        // ==================================
        // STEP 1
        // CLAIM REQUEST
        // ==================================

        const claimResult =
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


                    // ONLY PENDING
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


        if (
            !claimResult.committed
        ) {

            alert(
                "This VIP request has already been processed."
            );

            return;
        }


        // ==================================
        // REQUEST DATA
        // ==================================

        const request =
            claimResult.snapshot.val() || {};


        // ==================================
        // USER UID
        // ==================================

        const uid =
            request.uid ||
            request.userId ||
            request.userUID ||
            "";


        if (!uid) {

            throw new Error(
                "Invalid user ID."
            );
        }


        // ==================================
        // USER REFERENCE
        // ==================================

        const userRef = ref(
            db,
            "users/" + uid
        );


        // ==================================
        // GET USER
        // ==================================

        const userSnapshot =
            await get(userRef);


        if (
            !userSnapshot.exists()
        ) {

            throw new Error(
                "User account not found."
            );
        }


        const user =
            userSnapshot.val() || {};


        console.log(
            "BUYER USER:",
            uid
        );


        // ==================================
        // FIND REFERRER
        // ==================================

        const referrer =
            await findReferrer(
                user,
                request
            );


        console.log(
            "FINAL REFERRER:",
            referrer
        );


        // ==================================
        // VIP INFORMATION
        // ==================================

        const vipName =
            request.vipName ||
            request.planName ||
            request.name ||
            "VIP Plan";


        const price = Number(
            request.price ??
            request.vipPrice ??
            request.amount ??
            0
        );


        const dailyIncome = Number(
            request.dailyIncome ??
            request.daily ??
            request.dailyProfit ??
            0
        );


        const duration =
            getVipDuration(request);


        let totalProfit = Number(
            request.totalProfit ??
            request.profit ??
            request.total ??
            0
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
                dailyIncome * duration;
        }


        // ==================================
        // VALIDATION
        // ==================================

        if (
            !Number.isFinite(price) ||
            price <= 0
        ) {

            throw new Error(
                "Invalid VIP price."
            );
        }


        if (
            !Number.isFinite(dailyIncome) ||
            dailyIncome <= 0
        ) {

            throw new Error(
                "Invalid daily income."
            );
        }


        if (
            !Number.isFinite(duration) ||
            duration <= 0
        ) {

            throw new Error(
                "VIP duration is invalid."
            );
        }


        // ==================================
        // USER BALANCE
        // ==================================

        const userBalance = Number(
            user.balance || 0
        );


        if (
            !Number.isFinite(userBalance) ||
            userBalance < price
        ) {

            throw new Error(
                "User does not have enough balance."
            );
        }


        // ==================================
        // APPROVAL TIME
        // ==================================

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


        // ==================================
        // CREATE VIP BUYER
        // ==================================

        const vipBuyerRef =
            push(
                ref(
                    db,
                    "vipBuyers"
                )
            );


        const vipBuyerId =
            vipBuyerRef.key;


        // ==================================
        // CREATE USER VIP PLAN
        // ==================================

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


        // ==================================
        // VIP DATA
        // ==================================

        const vipData = {

            uid,

            requestId:
                id,

            vipBuyerId,

            vipName,

            price,

            dailyIncome,

            totalProfit,

            duration,

            totalDays:
                duration,

            remainingDays:
                duration,

            status:
                "active",

            purchasedAt:
                approvedAt,

            approvedAt,

            approvedBy:
                currentAdmin.uid,

            endDate,


            // ==================================
            // IMPORTANT
            // FIRST CLAIM AFTER 24 HOURS
            // ==================================

            lastClaim:
                approvedAt,

            lastClaimTime:
                approvedAt,

            lastProfitTime:
                approvedAt,

            totalEarned:
                0,

            earned:
                0
        };


        // ==================================
        // VIP BUYER DATA
        // ==================================

        const vipBuyerData = {

            ...vipData,

            id:
                vipBuyerId
        };


        // ==================================
        // NEW BUYER BALANCE
        // ==================================

        const newUserBalance =
            userBalance - price;


        // ==================================
        // PREPARE MULTI LOCATION UPDATE
        // ==================================

        const updates = {};


        // ==================================
        // BUYER BALANCE
        // ==================================

        updates[
            "users/" +
            uid +
            "/balance"
        ] =
            newUserBalance;


        // ==================================
        // SAVE USER VIP
        // ==================================

        updates[
            "users/" +
            uid +
            "/vipPlans/" +
            vipPlanId
        ] =
            vipData;


        // ==================================
        // SAVE VIP BUYER
        // ==================================

        updates[
            "vipBuyers/" +
            vipBuyerId
        ] =
            vipBuyerData;


        // ==================================
        // VIP PURCHASE TRANSACTION
        // ==================================

        const purchaseTxRef =
            push(
                ref(
                    db,
                    "transactions"
                )
            );


        updates[
            "transactions/" +
            purchaseTxRef.key
        ] = {

            uid,

            email:
                user.email ||
                request.email ||
                "",

            type:
                "vip_purchase",

            amount:
                price,

            vipName,

            status:
                "approved",

            requestId:
                id,

            vipBuyerId,

            approvedBy:
                currentAdmin.uid,

            createdAt:
                approvedAt
        };



            


          // ======================================
// REFERRAL BONUS - ONCE PER REFERRED USER
// ======================================

let referralBonusGiven = false;

let referralBonusUid = "";


// ======================================
// CHECK REFERRER
// ======================================

if (referrer) {

    const referrerUid =
        referrer.uid;

    const referrerData =
        referrer.data || {};

    referralBonusUid =
        referrerUid;


    // ==================================
    // IMPORTANT:
    // CHECK BUYER USER
    // NOT VIP REQUEST
    // ==================================

    const buyerReferralBonusGiven =
        user.referralBonusGiven === true;


    console.log(
        "BUYER referralBonusGiven:",
        buyerReferralBonusGiven
    );


    // ==================================
    // BONUS ONLY ONCE
    // ==================================

    if (!buyerReferralBonusGiven) {

        const currentBalance =
            Number(
                referrerData.balance || 0
            );


        const currentReferralBonus =
            Number(
                referrerData.referralBonus || 0
            );


        const currentReferralEarnings =
            Number(
                referrerData.referralEarnings || 0
            );


        // ==================================
        // ADD 1,000 TO REFERRER BALANCE
        // ==================================

        updates[
            "users/" +
            referrerUid +
            "/balance"
        ] =
            currentBalance +
            REFERRAL_BONUS_AMOUNT;


        // ==================================
        // REFERRAL BONUS
        // ==================================

        updates[
            "users/" +
            referrerUid +
            "/referralBonus"
        ] =
            currentReferralBonus +
            REFERRAL_BONUS_AMOUNT;


        // ==================================
        // REFERRAL EARNINGS
        // ==================================

        updates[
            "users/" +
            referrerUid +
            "/referralEarnings"
        ] =
            currentReferralEarnings +
            REFERRAL_BONUS_AMOUNT;


        // ==================================
        // MARK THIS REFERRED USER
        // AS BONUS ALREADY GIVEN
        // ==================================

        updates[
            "users/" +
            uid +
            "/referralBonusGiven"
        ] =
            true;


        // ==================================
        // SAVE REFERRER UID
        // ==================================

        updates[
            "users/" +
            uid +
            "/referredBy"
        ] =
            referrerUid;


        // ==================================
        // REFERRAL TRANSACTION
        // ==================================

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
                referrerUid,

            type:
                "referralBonus",

            amount:
                REFERRAL_BONUS_AMOUNT,

            sourceUid:
                uid,

            sourceRequestId:
                id,

            vipName,

            status:
                "completed",

            createdAt:
                approvedAt
        };


        // ==================================
        // SAVE INFO ON VIP REQUEST
        // ==================================

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
            referrerUid;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/referralBonusGiven"
        ] =
            true;


        referralBonusGiven =
            true;


        console.log(
            "================================"
        );

        console.log(
            "REFERRAL BONUS GIVEN ONCE"
        );

        console.log(
            "Buyer:",
            uid
        );

        console.log(
            "Referrer:",
            referrerUid
        );

        console.log(
            "Bonus:",
            REFERRAL_BONUS_AMOUNT
        );

        console.log(
            "================================"
        );

    }

    else {

        console.log(
            "REFERRAL BONUS ALREADY GIVEN"
        );

        console.log(
            "Buyer:",
            uid
        );

        console.log(
            "Referrer:",
            referrerUid
        );

    }

}

else {

    console.log(
        "NO VALID REFERRER FOUND"
    );

}      

                

        // ==================================
        // APPROVE REQUEST
        // ==================================

        updates[
            "vipPurchaseRequests/" +
            id +
            "/status"
        ] =
            "approved";


        updates[
            "vipPurchaseRequests/" +
            id +
            "/approvedAt"
        ] =
            approvedAt;


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
        ] =
            duration;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/days"
        ] =
            duration;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/durationDays"
        ] =
            duration;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/totalProfit"
        ] =
            totalProfit;


        updates[
            "vipPurchaseRequests/" +
            id +
            "/vipBuyerId"
        ] =
            vipBuyerId;


        // ==================================
        // SAVE EVERYTHING AT ONCE
        // ==================================

        await update(
            ref(db),
            updates
        );


        // ==================================
        // SUCCESS MESSAGE
        // ==================================

        if (
            referralBonusGiven
        ) {

            alert(
                "VIP approved successfully.\n\n" +
                "Referral bonus: 1,000 RWF"
            );

        }

        else if (
    referrer &&
    user.referralBonusGiven === true
) {

    alert(
        "VIP approved successfully.\n\n" +
        "Referral bonus was already given for this user."
    );

}

        else {

            alert(
                "VIP approved successfully.\n\n" +
                "No referral bonus: valid referrer not found."
            );
        }


        console.log(
            "VIP APPROVED SUCCESSFULLY:",
            id
        );

    }

    catch (error) {

        console.error(
            "================================"
        );

        console.error(
            "APPROVE VIP ERROR:",
            error
        );

        console.error(
            "================================"
        );


        // ==================================
        // RESTORE REQUEST
        // ==================================

        try {

            await update(
                ref(
                    db,
                    "vipPurchaseRequests/" +
                    id
                ),
                {

                    status:
                        "pending",

                    processingAt:
                        null,

                    processingBy:
                        null
                }
            );

        }

        catch (restoreError) {

            console.error(
                "RESTORE ERROR:",
                restoreError
            );
        }


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


// ======================================
// PART 7 READY
// ======================================

console.log(
    "ADMIN PART 7 READY - VIP APPROVE + REFERRAL BONUS"
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

// ======================================
// ADMIN.JS - PART 10
// ADMIN SETTINGS
// ======================================


// ======================================
// SETTINGS DOM
// ======================================

const adminNameInput =
    document.getElementById(
        "adminNameInput"
    );


const adminEmailInput =
    document.getElementById(
        "adminEmailInput"
    );


const saveSettingsBtn =
    document.getElementById(
        "saveSettings"
    );


// ======================================
// LOAD ADMIN SETTINGS
// ======================================

async function loadAdminSettings() {

    try {

        // ==================================
        // WAIT FOR ADMIN AUTH
        // ==================================

        if (
            !window.adminState?.ready
        ) {

            await window.adminState
                ?.readyPromise;

        }


        if (!currentAdmin) {

            console.warn(
                "No current admin found."
            );

            return;

        }


        const uid =
            currentAdmin.uid;


        // ==================================
        // GET ADMIN DATA
        // ==================================

        const snapshot =
            await get(
                ref(
                    db,
                    "admins/" + uid
                )
            );


        const adminData =
            snapshot.exists()
                ? snapshot.val() || {}
                : {};


        // ==================================
        // ADMIN NAME
        // ==================================

        const name =
            adminData.name ||
            currentAdmin.displayName ||
            "Administrator";


        if (adminNameInput) {

            adminNameInput.value =
                name;

        }


        // ==================================
        // ADMIN EMAIL
        // ==================================

        if (adminEmailInput) {

            adminEmailInput.value =
                currentAdmin.email ||
                adminData.email ||
                "";

        }


        console.log(
            "Admin settings loaded."
        );

    }
    catch (error) {

        console.error(
            "Load admin settings error:",
            error
        );

    }

}


// ======================================
// SAVE ADMIN SETTINGS
// ======================================

async function saveAdminSettings() {

    try {

        // ==================================
        // AUTH CHECK
        // ==================================

        if (
            !currentAdmin
        ) {

            alert(
                "Admin authentication is not ready."
            );

            return;

        }


        const uid =
            currentAdmin.uid;


        // ==================================
        // GET NAME
        // ==================================

        const name =
            String(
                adminNameInput?.value ||
                ""
            )
            .trim();


        // ==================================
        // VALIDATION
        // ==================================

        if (!name) {

            alert(
                "Please enter admin name."
            );

            adminNameInput?.focus();

            return;

        }


        if (
            name.length < 2
        ) {

            alert(
                "Admin name must contain at least 2 characters."
            );

            adminNameInput?.focus();

            return;

        }


        // ==================================
        // DISABLE BUTTON
        // ==================================

        if (saveSettingsBtn) {

            saveSettingsBtn.disabled =
                true;

            saveSettingsBtn.textContent =
                "Saving...";

        }


        // ==================================
        // SAVE ONLY ALLOWED SETTINGS
        // ==================================

        await update(
            ref(
                db,
                "admins/" + uid
            ),
            {

                name: name,

                updatedAt:
                    Date.now()

            }
        );


        // ==================================
        // UPDATE ADMIN HEADER
        // ==================================

        if (adminName) {

            adminName.textContent =
                name;

        }


        // ==================================
        // SUCCESS
        // ==================================

        alert(
            "Admin settings saved successfully."
        );


        console.log(
            "Admin settings updated:",
            uid
        );

    }
    catch (error) {

        console.error(
            "Save admin settings error:",
            error
        );


        alert(
            "Failed to save settings: " +
            (
                error.message ||
                "Unknown error."
            )
        );

    }
    finally {

        if (saveSettingsBtn) {

            saveSettingsBtn.disabled =
                false;

            saveSettingsBtn.textContent =
                "Save Settings";

        }

    }

}


// ======================================
// SAVE BUTTON
// ======================================

saveSettingsBtn?.addEventListener(
    "click",
    saveAdminSettings
);


// ======================================
// LOAD WHEN SETTINGS PAGE OPENS
// ======================================

document
    .querySelectorAll(
        '[data-page="settings"]'
    )
    .forEach(
        element => {

            element.addEventListener(
                "click",
                () => {

                    setTimeout(
                        () => {

                            loadAdminSettings();

                        },
                        50
                    );

                }
            );

        }
    );


// ======================================
// QUICK ACTION SETTINGS
// ======================================

document
    .getElementById(
        "openSettingsBtn"
    )
    ?.addEventListener(
        "click",
        () => {

            setTimeout(
                () => {

                    loadAdminSettings();

                },
                50
            );

        }
    );


// ======================================
// SIDEBAR SETTINGS
// ======================================

document
    .getElementById(
        "openSettings"
    )
    ?.addEventListener(
        "click",
        () => {

            setTimeout(
                () => {

                    loadAdminSettings();

                },
                50
            );

        }
    );


// ======================================
// GLOBAL EXPORT
// ======================================

window.loadAdminSettings =
    loadAdminSettings;


window.saveAdminSettings =
    saveAdminSettings;


// ======================================
// PART 10 READY
// ======================================

console.log(
    "ADMIN PART 10 READY - SETTINGS"
);

// ======================================
// ADMIN.JS - PART 11
// USERS - FULL INFORMATION
// CALCULATED FROM REAL DATABASE DATA
// ======================================


// ======================================
// USERS VARIABLES
// ======================================

let usersData = {};

let allTransactionsData = {};

let allVipBuyersData = {};

let allDepositRequestsData = {};

let allWithdrawRequestsData = {};


// ======================================
// DOM
// ======================================

const usersList =
    document.getElementById("usersList");

const emptyUsers =
    document.getElementById("emptyUsers");

const userSearch =
    document.getElementById("userSearch");

const userFilter =
    document.getElementById("userFilter");


// ======================================
// SAFE NUMBER
// ======================================

function usersNumber(...values) {

    for (const value of values) {

        const n = Number(value);

        if (Number.isFinite(n)) {
            return n;
        }

    }

    return 0;
}


// ======================================
// SAFE TEXT
// ======================================

function usersText(...values) {

    for (const value of values) {

        if (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        ) {

            return String(value);

        }

    }

    return "";

}


// ======================================
// FORMAT MONEY
// ======================================

function usersMoney(value) {

    return usersNumber(value)
        .toLocaleString() + " RWF";

}


// ======================================
// FORMAT DATE
// ======================================

function usersDate(value) {

    const n =
        Number(value || 0);

    if (!n) {
        return "N/A";
    }

    const date =
        new Date(n);

    if (
        !Number.isFinite(
            date.getTime()
        )
    ) {

        return "N/A";

    }

    return date.toLocaleString();

}


// ======================================
// USER NAME
// ======================================

function usersName(user) {

    return usersText(

        user.fullName,

        user.name,

        user.displayName,

        user.username,

        user.userName,

        (
            user.firstName &&
            user.lastName
        )
        ?
        user.firstName +
        " " +
        user.lastName
        :
        "",

        user.firstName,

        "Unknown User"

    );

}


// ======================================
// EMAIL
// ======================================

function usersEmail(user) {

    return usersText(

        user.email,

        user.userEmail,

        "No email"

    );

}


// ======================================
// PHONE
// ======================================

function usersPhone(user) {

    return usersText(

        user.phone,

        user.phoneNumber,

        user.mobile,

        user.mobileNumber,

        "No phone"

    );

}


// ======================================
// COUNTRY
// ======================================

function usersCountry(user) {

    return usersText(

        user.country,

        user.countryName,

        "Rwanda"

    );

}


// ======================================
// BALANCE
// ======================================

function usersBalance(user) {

    return usersNumber(

        user.balance,

        user.Balance,

        user.walletBalance,

        user.availableBalance

    );

}


// ======================================
// TRANSACTION USER ID
// ======================================

function transactionUid(tx) {

    return usersText(

        tx.uid,

        tx.userId,

        tx.userUID

    );

}


// ======================================
// TRANSACTION TYPE
// ======================================

function transactionType(tx) {

    return usersText(

        tx.type,

        tx.transactionType,

        tx.category

    ).toLowerCase();

}


// ======================================
// TRANSACTION STATUS
// ======================================

function transactionStatus(tx) {

    return usersText(

        tx.status

    ).toLowerCase();

}


// ======================================
// TRANSACTION AMOUNT
// ======================================

function transactionAmount(tx) {

    return usersNumber(

        tx.amount,

        tx.price,

        tx.value

    );

}


// ======================================
// TRANSACTION DATE
// ======================================

function transactionDate(tx) {

    return usersNumber(

        tx.createdAt,

        tx.date,

        tx.timestamp,

        tx.approvedAt,

        tx.completedAt

    );

}


// ======================================
// CHECK SUCCESSFUL TRANSACTION
// ======================================

function transactionApproved(tx) {

    const status =
        transactionStatus(tx);

    return (

        status === "approved" ||

        status === "completed" ||

        status === "success" ||

        status === "successful"

    );

}


// ======================================
// CALCULATE USER DEPOSITS
// ======================================

function calculateUserDeposits(uid) {

    let total = 0;


    Object.values(
        allTransactionsData || {}
    )
    .forEach(tx => {

        if (
            transactionUid(tx) !== uid
        ) {
            return;
        }


        const type =
            transactionType(tx);


        if (
            (
                type === "deposit" ||
                type === "deposit_request"
            ) &&
            transactionApproved(tx)
        ) {

            total +=
                transactionAmount(tx);

        }

    });


    // ----------------------------------
    // FALLBACK TO USER DATA
    // ----------------------------------

    if (total <= 0) {

        const user =
            usersData[uid] || {};

        total =
            usersNumber(
                user.totalDeposits,
                user.totalDeposit
            );

    }


    return total;

}


// ======================================
// CALCULATE USER WITHDRAWALS
// ======================================

function calculateUserWithdrawals(uid) {

    let total = 0;


    Object.values(
        allTransactionsData || {}
    )
    .forEach(tx => {

        if (
            transactionUid(tx) !== uid
        ) {
            return;
        }


        const type =
            transactionType(tx);


        if (
            (
                type === "withdrawal" ||
                type === "withdraw" ||
                type === "withdraw_request"
            ) &&
            transactionApproved(tx)
        ) {

            total +=
                transactionAmount(tx);

        }

    });


    // ----------------------------------
    // FALLBACK
    // ----------------------------------

    if (total <= 0) {

        const user =
            usersData[uid] || {};

        total =
            usersNumber(
                user.totalWithdrawals,
                user.totalWithdrawal
            );

    }


    return total;

}


// ======================================
// CALCULATE DAILY INCOME
// ======================================

function calculateUserDailyIncome(uid) {

    let total = 0;


    Object.values(
        allTransactionsData || {}
    )
    .forEach(tx => {

        if (
            transactionUid(tx) !== uid
        ) {
            return;
        }


        const type =
            transactionType(tx);


        if (
            type === "dailyincome" ||
            type === "daily_income" ||
            type === "vip_profit" ||
            type === "profit"
        ) {

            if (
                transactionApproved(tx)
            ) {

                total +=
                    transactionAmount(tx);

            }

        }

    });


    return total;

}


// ======================================
// CALCULATE REFERRAL EARNINGS
// ======================================

function calculateReferralEarnings(uid) {

    const user =
        usersData[uid] || {};


    let total =
        usersNumber(

            user.referralEarnings,

            user.referralIncome,

            user.referralProfit,

            user.totalReferralEarnings

        );


    Object.values(
        allTransactionsData || {}
    )
    .forEach(tx => {

        if (
            transactionUid(tx) !== uid
        ) {
            return;
        }


        const type =
            transactionType(tx);


        if (
            type === "referral" ||
            type === "referralearning" ||
            type === "referral_income"
        ) {

            if (
                transactionApproved(tx)
            ) {

                total +=
                    transactionAmount(tx);

            }

        }

    });


    return total;

}


// ======================================
// CALCULATE TOTAL PROFITS
// ======================================

function calculateUserProfits(uid) {

    let total = 0;


    Object.values(
        allTransactionsData || {}
    )
    .forEach(tx => {

        if (
            transactionUid(tx) !== uid
        ) {
            return;
        }


        const type =
            transactionType(tx);


        if (
            type === "dailyincome" ||
            type === "daily_income" ||
            type === "vip_profit" ||
            type === "profit" ||
            type === "referral" ||
            type === "referralearning" ||
            type === "referral_income"
        ) {

            if (
                transactionApproved(tx)
            ) {

                total +=
                    transactionAmount(tx);

            }

        }

    });


    // ----------------------------------
    // FALLBACK
    // ----------------------------------

    if (total <= 0) {

        const user =
            usersData[uid] || {};

        total =
            usersNumber(

                user.totalProfits,

                user.totalProfit,

                user.profits,

                user.profit

            );

    }


    return total;

}


// ======================================
// GET VIP BUYERS
// ======================================

function getUserVipBuyers(uid) {

    return Object.entries(
        allVipBuyersData || {}
    )
    .filter(
        ([id, vip]) => {

            return (
                usersText(
                    vip.uid,
                    vip.userId,
                    vip.userUID
                )
                === uid
            );

        }
    );

}


// ======================================
// VIP COUNT
// ======================================

function getUserVipCount(uid) {

    return getUserVipBuyers(uid).length;

}


// ======================================
// ACTIVE VIP COUNT
// ======================================

function getUserActiveVipCount(uid) {

    return getUserVipBuyers(uid)
        .filter(
            ([id, vip]) => {

                return (
                    String(
                        vip.status || ""
                    ).toLowerCase()
                    === "active"
                );

            }
        )
        .length;

}


// ======================================
// VIP DAILY INCOME
// ======================================

function getUserVipDailyIncome(uid) {

    let total = 0;


    getUserVipBuyers(uid)
        .forEach(
            ([id, vip]) => {

                if (
                    String(
                        vip.status || ""
                    ).toLowerCase()
                    !== "active"
                ) {

                    return;

                }


                total +=
                    usersNumber(
                        vip.dailyIncome
                    );

            }
        );


    return total;

}


// ======================================
// VIP TOTAL PROFIT
// ======================================

function getUserVipTotalProfit(uid) {

    let total = 0;


    getUserVipBuyers(uid)
        .forEach(
            ([id, vip]) => {

                total +=
                    usersNumber(
                        vip.totalProfit
                    );

            }
        );


    return total;

}


// ======================================
// VIP EARNED
// ======================================

function getUserVipEarned(uid) {

    let total = 0;


    // ----------------------------------
    // FROM USER VIP PLANS
    // ----------------------------------

    const user =
        usersData[uid] || {};


    const plans =
        user.vipPlans || {};


    Object.values(plans)
        .forEach(
            vip => {

                total +=
                    usersNumber(

                        vip.totalEarned,

                        vip.earned

                    );

            }
        );


    // ----------------------------------
    // FROM TRANSACTIONS
    // ----------------------------------

    total +=
        calculateUserDailyIncome(uid);


    return total;

}


// ======================================
// REFERRAL CODE
// ======================================

function getUserReferralCode(user) {

    return usersText(

        user.referralCode,

        user.refCode,

        user.referral,

        "N/A"

    );

}


// ======================================
// ACCOUNT STATUS
// ======================================

function getUserAccountStatus(user) {

    const status =
        usersText(

            user.status,

            user.accountStatus

        ).toLowerCase();


    if (

        status === "blocked" ||

        status === "disabled" ||

        status === "inactive"

    ) {

        return "Inactive";

    }


    return "Active";

}


// ======================================
// CREATED DATE
// ======================================

function getUserCreatedAt(user) {

    return usersNumber(

        user.createdAt,

        user.createdDate,

        user.registeredAt,

        user.timestamp,

        user.dateCreated

    );

}


// ======================================
// LAST LOGIN
// ======================================

function getUserLastLogin(user) {

    return usersNumber(

        user.lastLogin,

        user.lastLoginAt,

        user.lastActive,

        user.lastActivity

    );

}


// ======================================
// VIP STATUS
// ======================================

function getUserVipStatus(uid) {

    const active =
        getUserActiveVipCount(uid);


    if (active > 0) {

        return "VIP";

    }


    return "Normal";

}


// ======================================
// RENDER USERS
// ======================================

function renderUsers() {

    if (!usersList) {
        return;
    }


    const search =
        usersText(
            userSearch?.value
        ).toLowerCase();


    const filter =
        usersText(
            userFilter?.value
        ).toLowerCase();


    let users =
        Object.entries(
            usersData || {}
        );


    // ==================================
    // SEARCH
    // ==================================

    if (search) {

        users =
            users.filter(
                ([uid, user]) => {

                    const name =
                        usersName(user)
                            .toLowerCase();

                    const email =
                        usersEmail(user)
                            .toLowerCase();

                    const phone =
                        usersPhone(user)
                            .toLowerCase();

                    const uidText =
                        uid.toLowerCase();

                    const referral =
                        getUserReferralCode(user)
                            .toLowerCase();


                    return (

                        name.includes(search) ||

                        email.includes(search) ||

                        phone.includes(search) ||

                        uidText.includes(search) ||

                        referral.includes(search)

                    );

                }
            );

    }


    // ==================================
    // FILTER
    // ==================================

    if (
        filter &&
        filter !== "all"
    ) {

        users =
            users.filter(
                ([uid, user]) => {

                    const vipStatus =
                        getUserVipStatus(uid)
                            .toLowerCase();


                    if (
                        filter === "vip"
                    ) {

                        return (
                            vipStatus === "vip"
                        );

                    }


                    if (
                        filter === "normal"
                    ) {

                        return (
                            vipStatus === "normal"
                        );

                    }


                    return true;

                }
            );

    }


    // ==================================
    // EMPTY
    // ==================================

    if (!users.length) {

        usersList.innerHTML =
            "";

        if (emptyUsers) {

            emptyUsers.style.display =
                "block";

        }

        return;

    }


    if (emptyUsers) {

        emptyUsers.style.display =
            "none";

    }


    // ==================================
    // SORT NEWEST
    // ==================================

    users.sort(
        ([uidA, userA], [uidB, userB]) => {

            return (

                getUserCreatedAt(userB) -

                getUserCreatedAt(userA)

            );

        }
    );


    // ==================================
    // RENDER
    // ==================================

    usersList.innerHTML =
        users.map(
            ([uid, user]) => {

                const name =
                    usersName(user);

                const email =
                    usersEmail(user);

                const phone =
                    usersPhone(user);

                const country =
                    usersCountry(user);

                const balance =
                    usersBalance(user);

                const deposits =
                    calculateUserDeposits(uid);

                const withdrawals =
                    calculateUserWithdrawals(uid);

                const referralEarnings =
                    calculateReferralEarnings(uid);

                const profits =
                    calculateUserProfits(uid);

                const dailyIncomeEarned =
                    calculateUserDailyIncome(uid);

                const referralCode =
                    getUserReferralCode(user);

                const vipCount =
                    getUserVipCount(uid);

                const activeVipCount =
                    getUserActiveVipCount(uid);

                const vipDaily =
                    getUserVipDailyIncome(uid);

                const vipTotalProfit =
                    getUserVipTotalProfit(uid);

                const vipEarned =
                    getUserVipEarned(uid);

                const status =
                    getUserAccountStatus(user);

                const vipStatus =
                    getUserVipStatus(uid);

                const createdAt =
                    getUserCreatedAt(user);

                const lastLogin =
                    getUserLastLogin(user);


                return `

                    <div class="user-card">


                        <div class="user-card-header">

                            <div>

                                <h3>
                                    ${name}
                                </h3>

                                <small>
                                    UID:
                                    ${uid}
                                </small>

                            </div>


                            <div>

                                <span class="user-status">
                                    ${status}
                                </span>

                                <span class="user-vip">
                                    ${vipStatus}
                                </span>

                            </div>

                        </div>


                        <div class="user-info-grid">


                            <div class="user-info-item">

                                <strong>
                                    Full Name
                                </strong>

                                <span>
                                    ${name}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Email
                                </strong>

                                <span>
                                    ${email}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Phone
                                </strong>

                                <span>
                                    ${phone}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Country
                                </strong>

                                <span>
                                    ${country}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    User ID
                                </strong>

                                <span>
                                    ${uid}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Referral Code
                                </strong>

                                <span>
                                    ${referralCode}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Balance
                                </strong>

                                <span>
                                    ${usersMoney(balance)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Total Deposits
                                </strong>

                                <span>
                                    ${usersMoney(deposits)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Total Withdrawals
                                </strong>

                                <span>
                                    ${usersMoney(withdrawals)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Referral Earnings
                                </strong>

                                <span>
                                    ${usersMoney(referralEarnings)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Total Profits
                                </strong>

                                <span>
                                    ${usersMoney(profits)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Daily Income Claimed
                                </strong>

                                <span>
                                    ${usersMoney(
                                        dailyIncomeEarned
                                    )}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    VIP Count
                                </strong>

                                <span>
                                    ${vipCount}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Active VIP
                                </strong>

                                <span>
                                    ${activeVipCount}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    VIP Daily Income
                                </strong>

                                <span>
                                    ${usersMoney(vipDaily)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    VIP Total Profit
                                </strong>

                                <span>
                                    ${usersMoney(vipTotalProfit)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    VIP Earned
                                </strong>

                                <span>
                                    ${usersMoney(vipEarned)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Account Status
                                </strong>

                                <span>
                                    ${status}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Created
                                </strong>

                                <span>
                                    ${usersDate(createdAt)}
                                </span>

                            </div>


                            <div class="user-info-item">

                                <strong>
                                    Last Login
                                </strong>

                                <span>
                                    ${usersDate(lastLogin)}
                                </span>

                            </div>


                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


// ======================================
// LOAD ALL USER DATA
// ======================================

function loadUsers() {

    // ==================================
    // USERS
    // ==================================

    onValue(
        ref(db, "users"),
        snapshot => {

            usersData =
                snapshot.exists()
                ? snapshot.val() || {}
                : {};

            renderUsers();

            updateUserSummary();

        }
    );


    // ==================================
    // TRANSACTIONS
    // ==================================

    onValue(
        ref(db, "transactions"),
        snapshot => {

            allTransactionsData =
                snapshot.exists()
                ? snapshot.val() || {}
                : {};

            renderUsers();

            updateUserSummary();

        }
    );


    // ==================================
    // VIP BUYERS
    // ==================================

    onValue(
        ref(db, "vipBuyers"),
        snapshot => {

            allVipBuyersData =
                snapshot.exists()
                ? snapshot.val() || {}
                : {};

            renderUsers();

            updateUserSummary();

        }
    );


    // ==================================
    // DEPOSIT REQUESTS
    // ==================================

    onValue(
        ref(db, "depositRequests"),
        snapshot => {

            allDepositRequestsData =
                snapshot.exists()
                ? snapshot.val() || {}
                : {};

            renderUsers();

        }
    );


    // ==================================
    // WITHDRAW REQUESTS
    // ==================================

    onValue(
        ref(db, "withdrawRequests"),
        snapshot => {

            allWithdrawRequestsData =
                snapshot.exists()
                ? snapshot.val() || {}
                : {};

            renderUsers();

        }
    );

}


// ======================================
// USER SUMMARY
// ======================================

function updateUserSummary() {

    const users =
        Object.keys(
            usersData || {}
        );


    const totalUsers =
        users.length;


    const vipUsers =
        users.filter(
            uid =>
                getUserActiveVipCount(uid) > 0
        ).length;


    const normalUsers =
        totalUsers -
        vipUsers;


    const totalBalance =
        users.reduce(
            (sum, uid) => {

                return (
                    sum +
                    usersBalance(
                        usersData[uid] || {}
                    )
                );

            },
            0
        );


    const totalDeposits =
        users.reduce(
            (sum, uid) => {

                return (
                    sum +
                    calculateUserDeposits(uid)
                );

            },
            0
        );


    const totalWithdrawals =
        users.reduce(
            (sum, uid) => {

                return (
                    sum +
                    calculateUserWithdrawals(uid)
                );

            },
            0
        );


    const totalProfits =
        users.reduce(
            (sum, uid) => {

                return (
                    sum +
                    calculateUserProfits(uid)
                );

            },
            0
        );


    const totalUsersEl =
        document.getElementById(
            "totalUsers"
        );


    const vipUsersEl =
        document.getElementById(
            "vipUsers"
        );


    const normalUsersEl =
        document.getElementById(
            "normalUsers"
        );


    const totalBalanceEl =
        document.getElementById(
            "usersTotalBalance"
        );


    if (totalUsersEl) {

        totalUsersEl.textContent =
            totalUsers;

    }


    if (vipUsersEl) {

        vipUsersEl.textContent =
            vipUsers;

    }


    if (normalUsersEl) {

        normalUsersEl.textContent =
            normalUsers;

    }


    if (totalBalanceEl) {

        totalBalanceEl.textContent =
            usersMoney(
                totalBalance
            );

    }


    // ==================================
    // OPTIONAL SUMMARY ELEMENTS
    // ==================================

    const totalDepositsEl =
        document.getElementById(
            "usersTotalDeposits"
        );


    const totalWithdrawalsEl =
        document.getElementById(
            "usersTotalWithdrawals"
        );


    const totalProfitsEl =
        document.getElementById(
            "usersTotalProfits"
        );


    if (totalDepositsEl) {

        totalDepositsEl.textContent =
            usersMoney(
                totalDeposits
            );

    }


    if (totalWithdrawalsEl) {

        totalWithdrawalsEl.textContent =
            usersMoney(
                totalWithdrawals
            );

    }


    if (totalProfitsEl) {

        totalProfitsEl.textContent =
            usersMoney(
                totalProfits
            );

    }

}


// ======================================
// SEARCH
// ======================================

if (userSearch) {

    userSearch.addEventListener(
        "input",
        renderUsers
    );

}


// ======================================
// FILTER
// ======================================

if (userFilter) {

    userFilter.addEventListener(
        "change",
        renderUsers
    );

}


// ======================================
// START
// ======================================

loadUsers();


// ======================================
// GLOBAL
// ======================================

window.loadUsers =
    loadUsers;

window.renderUsers =
    renderUsers;

window.updateUserSummary =
    updateUserSummary;


// ======================================
// READY
// ======================================

console.log(
    "ADMIN PART 11 READY - FULL USERS DATA"
);
