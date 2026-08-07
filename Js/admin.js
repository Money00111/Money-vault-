// ======================================
// ADMIN.JS - PART 1A
// FIREBASE IMPORTS + GLOBAL SETUP
// ======================================

// ================================
// FIREBASE IMPORTS
// ================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    onValue,
    update,
    push,
    set,
    remove
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ================================
// DOM HELPER
// ================================

const $ = (id) => document.getElementById(id);


// ================================
// GLOBAL DOM ELEMENTS
// ================================

const loadingScreen = $("loadingScreen");

const adminName = $("adminName");
const adminEmail = $("adminEmail");

const logoutBtn = $("logoutBtn");

const menuBtn = $("menuBtn");

const pageTitle = $("pageTitle");

const menuLinks =
document.querySelectorAll(".menu-link");

const pageSections =
document.querySelectorAll(".page-section");


// ================================
// GLOBAL DATA
// ================================

let currentAdmin = null;

let adminReady = false;

let usersData = {};

let depositsData = {};

let withdrawsData = {};

let vipRequestsData = {};

let bonusRequestsData = {};

let transactionsData = {};


// ================================
// HELPER FUNCTIONS
// ================================

function showLoading() {

    if (loadingScreen) {

        loadingScreen.style.display = "flex";

    }

}

function hideLoading() {

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

}

function showError(error) {

    console.error(error);

    alert(error?.message || error);

}

function formatMoney(amount) {

    return Number(amount || 0).toLocaleString() + " RWF";

}

function formatDate(timestamp) {

    if (!timestamp) return "-";

    return new Date(timestamp).toLocaleString();

}

console.log("ADMIN PART 1A READY");

// ======================================
// ADMIN.JS - PART 1B
// AUTH CHECK + SIDEBAR + LOGOUT
// ======================================


// ================================
// ADMIN AUTHENTICATION
// ================================

onAuthStateChanged(auth, async (user) => {

    showLoading();

    if (!user) {

        window.location.href = "admin-login.html";

        return;

    }


    try {

        const adminRef =
        ref(db, "admins/" + user.uid);


        const snap =
        await get(adminRef);


        if (!snap.exists()) {

            alert("Access Denied!");

            await signOut(auth);

            window.location.href =
            "admin-login.html";

            return;

        }


        currentAdmin = {

            uid: user.uid,

            email: user.email,

            ...snap.val()

        };


        if (adminName) {

            adminName.textContent =
            currentAdmin.name ||
            "Administrator";

        }


        if (adminEmail) {

            adminEmail.textContent =
            user.email;

        }


        adminReady = true;


        hideLoading();


        console.log(
            "ADMIN LOGIN SUCCESS",
            currentAdmin
        );


    }

    catch(error) {

        showError(error);

    }


});



// ================================
// SIDEBAR NAVIGATION
// ================================

menuLinks.forEach(link => {


    link.addEventListener("click", (e) => {


        e.preventDefault();


        const page =
        link.dataset.page;



        menuLinks.forEach(item => {

            item.classList.remove("active");

        });



        link.classList.add("active");



        pageSections.forEach(section => {

            section.classList.remove("active");

        });



        const target =
        document.getElementById(
            page + "Section"
        );



        if (target) {

            target.classList.add("active");

        }



        if (pageTitle) {

            pageTitle.textContent =
            link.innerText.trim();

        }


    });


});



// ================================
// LOGOUT
// ================================

logoutBtn?.addEventListener(
"click",
async () => {


    const confirmLogout =
    confirm(
        "Logout Admin?"
    );


    if (!confirmLogout) return;



    try {

        await signOut(auth);


        window.location.href =
        "admin-login.html";


    }

    catch(error) {

        showError(error);

    }


});



console.log("ADMIN PART 1B READY");
// ======================================
// ADMIN.JS - PART 2
// DASHBOARD STATISTICS + QUICK ACTIONS
// ======================================


// ================================
// DASHBOARD ELEMENTS
// ================================

const totalUsersEl =
$("totalUsers");

const totalDepositsEl =
$("dashboardTotalDeposits");

const pendingDepositsEl =
$("dashboardPendingDeposits");

const approvedDepositsEl =
$("dashboardApprovedDeposits");

const totalWithdrawsEl =
$("dashboardTotalWithdraws");

const systemBalanceEl =
$("systemBalance");



// ================================
// LOAD DASHBOARD DATA
// ================================

function loadDashboard() {


    if (!adminReady) return;



    // ==========================
    // USERS
    // ==========================

    onValue(
        ref(db,"users"),
        (snapshot)=>{


            usersData =
            snapshot.val() || {};



            const usersCount =
            Object.keys(usersData).length;



            if(totalUsersEl){

                totalUsersEl.textContent =
                usersCount;

            }



            let balance = 0;



            Object.values(usersData)
            .forEach(user=>{


                balance +=
                Number(
                    user.balance || 0
                );


            });



            if(systemBalanceEl){

                systemBalanceEl.textContent =
                formatMoney(balance);

            }


        }
    );



    // ==========================
    // DEPOSITS
    // ==========================

    onValue(
        ref(db,"depositRequests"),
        (snapshot)=>{


            const deposits =
            snapshot.val() || {};



            let total = 0;

            let pending = 0;

            let approved = 0;



            Object.values(deposits)
            .forEach(dep=>{


                total++;



                if(dep.status === "pending"){

                    pending++;

                }


                if(dep.status === "approved"){

                    approved++;

                }


            });



            if(totalDepositsEl){

                totalDepositsEl.textContent =
                total;

            }


            if(pendingDepositsEl){

                pendingDepositsEl.textContent =
                pending;

            }


            if(approvedDepositsEl){

                approvedDepositsEl.textContent =
                approved;

            }


        }
    );



    // ==========================
    // WITHDRAWS
    // ==========================

    onValue(
        ref(db,"withdrawRequests"),
        (snapshot)=>{


            const withdraws =
            snapshot.val() || {};



            if(totalWithdrawsEl){

                totalWithdrawsEl.textContent =
                Object.keys(withdraws).length;

            }


        }
    );


}



// ================================
// QUICK ACTION BUTTONS
// ================================

const refreshDashboard =
$("refreshDashboard");


const openDeposits =
$("openDeposits");


const openWithdraws =
$("openWithdraws");


const openUsers =
$("openUsers");


const openTransactions =
$("openTransactions");


const openSettings =
$("openSettings");


const openVipRequests =
$("openVipRequests");




// REFRESH

refreshDashboard?.addEventListener(
"click",
()=>{


    loadDashboard();


    alert(
    "Dashboard Refreshed Successfully"
    );


});




// OPEN DEPOSITS

openDeposits?.addEventListener(
"click",
()=>{

    document
    .querySelector(
        '[data-page="deposits"]'
    )
    ?.click();

});




// OPEN WITHDRAWS

openWithdraws?.addEventListener(
"click",
()=>{

    document
    .querySelector(
        '[data-page="withdraws"]'
    )
    ?.click();

});




// OPEN USERS

openUsers?.addEventListener(
"click",
()=>{

    document
    .querySelector(
        '[data-page="users"]'
    )
    ?.click();

});




// OPEN TRANSACTIONS

openTransactions?.addEventListener(
"click",
()=>{

    document
    .querySelector(
        '[data-page="transactions"]'
    )
    ?.click();

});




// OPEN SETTINGS

openSettings?.addEventListener(
"click",
()=>{

    document
    .querySelector(
        '[data-page="settings"]'
    )
    ?.click();

});




// OPEN VIP REQUESTS

openVipRequests?.addEventListener(
"click",
()=>{

    document
    .querySelector(
        '[data-page="vipRequests"]'
    )
    ?.click();

});




// ================================
// START DASHBOARD
// ================================

setTimeout(()=>{

    loadDashboard();

},1000);



console.log("ADMIN PART 2 READY");



// ======================================
// ADMIN.JS - PART 3A-1
// DEPOSIT MANAGEMENT SETUP + LOAD
// ======================================

// ================================
// ELEMENTS
// ================================

const depositList = $("depositList");
const emptyDeposit = $("emptyDeposit");

const depositTotalCount = $("depositTotalCount");
const depositPendingCount = $("depositPendingCount");
const depositApprovedCount = $("depositApprovedCount");
const depositRejectedCount = $("depositRejectedCount");

const depositSearch = $("depositSearch");
const depositFilter = $("depositFilter");

// ================================
// GLOBAL DATA
// ================================

let depositsData = {};
let unsubscribeDeposits = null;

// ================================
// LOAD DEPOSITS
// ================================

function loadDeposits() {

    if (!adminReady) return;

    // Irinda gushyiraho listener nyinshi
    if (typeof unsubscribeDeposits === "function") {
        unsubscribeDeposits();
    }

    const depositsRef = ref(db, "depositRequests");

    unsubscribeDeposits = onValue(depositsRef, (snapshot) => {

        depositsData = snapshot.val() || {};

        renderDeposits(depositsData);

        updateDepositSummary();

    }, (error) => {

        console.error(error);

        showError(error);

    });

}

// ================================
// RELOAD CURRENT FILTER
// ================================

function refreshDepositView() {

    if (
        (depositSearch && depositSearch.value.trim() !== "") ||
        (depositFilter && depositFilter.value !== "all")
    ) {

        applyDepositFilter();

    } else {

        renderDeposits(depositsData);

    }

    updateDepositSummary();

}

console.log("ADMIN PART 3A-1 READY");

    // ======================================
// ADMIN.JS - PART 3A-2
// RENDER DEPOSITS (SAFE)
// ======================================

function renderDeposits(data) {

    if (!depositList) return;

    depositList.innerHTML = "";

    const list = Object.entries(data || {});

    if (list.length === 0) {

        if (emptyDeposit) {
            emptyDeposit.style.display = "block";
        }

        return;
    }

    if (emptyDeposit) {
        emptyDeposit.style.display = "none";
    }

    // Latest first
    list.sort((a, b) => {
        return Number(b[1]?.createdAt || 0) - Number(a[1]?.createdAt || 0);
    });

    list.forEach(([id, dep]) => {

        const status = dep.status || "pending";

        const isPending = status === "pending";

        const card = document.createElement("div");
        card.className = "request-card";

        card.innerHTML = `

<div class="request-top">

    <h3>${dep.name || "Unknown User"}</h3>

    <span class="status ${status}">
        ${status.toUpperCase()}
    </span>

</div>

<p>
    <strong>Email:</strong>
    ${dep.email || "-"}
</p>

<p>
    <strong>Amount:</strong>
    ${formatMoney(dep.amount)}
</p>

<p>
    <strong>Phone:</strong>
    ${dep.senderPhone || "-"}
</p>

<p>
    <strong>Payment Method:</strong>
    ${dep.paymentMethod || "-"}
</p>

<p>
    <strong>Transaction ID:</strong>
    ${dep.transactionId || "-"}
</p>

<p>
    <strong>Date:</strong>
    ${formatDate(dep.createdAt)}
</p>

<div class="action-buttons">

    ${
        isPending
            ? `

 <button
class="approveDepositBtn"
data-id="${id}">
<i class="fa-solid fa-circle-check"></i>
Approve
</button>

<button
class="rejectDepositBtn"
data-id="${id}">
<i class="fa-solid fa-circle-xmark"></i>
Reject
</button>
`
            : `
<button disabled>
${status.toUpperCase()}
</button>
`
    }

</div>

`;

        depositList.appendChild(card);

    });

}

console.log("ADMIN PART 3A-2 READY");                     

// ======================================
// ADMIN.JS - PART 3A-3
// DEPOSIT BUTTON EVENTS (SECURE)
// ======================================

// ================================
// BUTTON EVENTS
// ================================

depositList?.addEventListener("click", async (e) => {

    const approveBtn = e.target.closest(".approveDepositBtn");
    const rejectBtn = e.target.closest(".rejectDepositBtn");

    if (!approveBtn && !rejectBtn) return;

    const button = approveBtn || rejectBtn;
    const id = button.dataset.id;

    if (!id) return;

    // Irinda gukanda button inshuro nyinshi
    if (button.dataset.processing === "true") return;

    button.dataset.processing = "true";
    button.disabled = true;

    const oldText = button.innerHTML;

    button.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

    // Disable na button ya kabiri iri kuri card
    const card = button.closest(".request-card");

      if (card) {

        card.querySelectorAll("button").forEach(btn => {

            btn.disabled = true;

        });

    }

    try {

        if (approveBtn) {

            await approveDeposit(id);

        } else {

            await rejectDeposit(id);

        }

    } catch (error) {

        console.error(error);

        showError(error);

        // Subiza button uko yari imeze niba habaye ikosa
        if (card) {

            card.querySelectorAll("button").forEach(btn => {

                btn.disabled = false;
                btn.dataset.processing = "false";

            });

        }

        button.innerHTML = oldText;

    }

});

console.log("ADMIN PART 3A-3 READY");

// ======================================
// ADMIN.JS - PART 3B
// SECURE APPROVE DEPOSIT COMPLETE
// ======================================

async function approveDeposit(id) {

    const depositRef =
        ref(db, "depositRequests/" + id);


    try {

        // ==========================
        // GET LATEST DEPOSIT
        // ==========================

        const depositSnap =
            await get(depositRef);


        if (!depositSnap.exists()) {

            throw new Error(
                "Deposit request not found."
            );

        }


        const deposit =
            depositSnap.val();



        // ==========================
        // CHECK STATUS
        // ==========================

        if (deposit.status !== "pending") {

            alert(
                "This deposit has already been processed."
            );

            return;

        }



        // ==========================
        // LOCK FIRST
        // ==========================

        await update(
            depositRef,
            {

                status:"processing",

                processingAt:Date.now(),

                processingBy:
                auth.currentUser.uid

            }
        );



        // ==========================
        // GET USER
        // ==========================

        const userRef =
            ref(db,"users/"+deposit.uid);



        const userSnap =
            await get(userRef);



        if(!userSnap.exists()){


            await update(
                depositRef,
                {
                    status:"pending"
                }
            );


            throw new Error(
                "User not found."
            );

        }



        const user =
            userSnap.val();



        const amount =
            Number(deposit.amount || 0);



        const oldBalance =
            Number(user.balance || 0);



        const newBalance =
            oldBalance + amount;



        // ==========================
        // UPDATE BALANCE
        // ==========================

        await update(
            userRef,
            {

                balance:newBalance

            }
        );



        // ==========================
        // FINAL APPROVED
        // ==========================

        await update(
            depositRef,
            {

                status:"approved",

                approvedAt:Date.now(),

                approvedBy:
                auth.currentUser.uid

            }
        );



        // ==========================
        // TRANSACTION
        // ==========================

        const transactionRef =
            push(
                ref(db,"transactions")
            );



        await set(
            transactionRef,
            {

                uid:deposit.uid,

                email:
                deposit.email || "",

                name:
                deposit.name || "",

                type:"deposit",

                amount:amount,

                status:"approved",

                createdAt:Date.now(),

                approvedBy:
                auth.currentUser.uid

            }
        );



        // ==========================
        // NOTIFICATION
        // ==========================

        const noteRef =
            push(
                ref(db,
                "notifications/"+deposit.uid)
            );



        await set(
            noteRef,
            {

                title:"Deposit Approved",

                message:
                "Your deposit of "
                +
                formatMoney(amount)
                +
                " has been approved.",


                type:"deposit",

                read:false,

                createdAt:Date.now()

            }
        );



        alert(
            "Deposit Approved Successfully"
        );



    }


    catch(error){


        console.error(
            "Approve Deposit Error:",
            error
        );



        // SUBIZA STATUS NIBA BYANZE

        try{


            await update(
                depositRef,
                {

                    status:"pending",

                    processingAt:null,

                    processingBy:null

                }
            );


        }

        catch(e){

            console.error(
                "Restore error:",
                e
            );

        }



        throw error;


    }

}



console.log(
"ADMIN PART 3B COMPLETE READY"
);

