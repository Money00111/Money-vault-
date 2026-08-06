// ======================================
// ADMIN.JS - PART 1
// FIREBASE + AUTH + GLOBAL SETUP
// ======================================


// ================================
// FIREBASE IMPORTS
// ================================

import { auth, db } from "./firebase.js";


import {
    onAuthStateChanged,
    signOut
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";


import {
    ref,
    get,
    update,
    push,
    set,
    increment
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";




// ================================
// GLOBAL VARIABLES
// ================================

let currentAdmin = null;

let adminReady = false;


let usersData = {};

let depositsData = {};

let withdrawsData = {};

let vipRequestsData = {};

let transactionsData = {};

let vipBuyersData = [];



// ================================
// DOM SHORTCUT
// ================================

function $(id){

    return document.getElementById(id);

}



// ================================
// ERROR HANDLER
// ================================

function showError(error){

    console.error(
        "ADMIN ERROR:",
        error
    );

}



window.$ = $;

window.showError = showError;
// ======================================
// ADMIN.JS - PART 2
// ADMIN AUTHENTICATION SYSTEM
// ======================================



// ================================
// CHECK ADMIN ACCESS
// ================================

async function checkAdminAccess(user){


    if(!user){

        window.location.href =
        "login.html";

        return false;

    }



    const adminRef =
    ref(
        db,
        "admins/" + user.uid
    );



    const snapshot =
    await get(adminRef);



    if(!snapshot.exists()){


        alert(
        "Access Denied"
        );


        await signOut(auth);


        window.location.href =
        "login.html";


        return false;


    }



    currentAdmin = user;

    adminReady = true;



    return true;


}



// ================================
// AUTH LISTENER
// ================================

onAuthStateChanged(
auth,
async(user)=>{


    const allowed =
    await checkAdminAccess(user);



    if(allowed){


        console.log(
        "Admin authenticated"
        );


    }



});



// ================================
// EXPORT
// ================================

window.checkAdminAccess =
checkAdminAccess;

// ======================================
// ADMIN.JS - PART 3
// DASHBOARD BASIC SYSTEM
// ======================================



// ================================
// DASHBOARD ELEMENT UPDATE
// ================================

function updateDashboardCards(){



    const totalUsers =
    Object.keys(usersData || {})
    .length;



    let totalDeposits = 0;


    Object.values(depositsData || {})
    .forEach(item=>{


        if(item.status === "approved"){


            totalDeposits +=
            Number(item.amount || 0);


        }


    });



    let totalWithdraws = 0;


    Object.values(withdrawsData || {})
    .forEach(item=>{


        if(item.status === "approved"){


            totalWithdraws +=
            Number(item.amount || 0);


        }


    });





    if($("totalUsers")){

        $("totalUsers").innerText =
        totalUsers;

    }



    if($("totalDeposits")){

        $("totalDeposits").innerText =
        totalDeposits + " RWF";

    }



    if($("totalWithdraws")){

        $("totalWithdraws").innerText =
        totalWithdraws + " RWF";

    }



}



// ================================
// GLOBAL EXPORT
// ================================

window.updateDashboardCards =
updateDashboardCards;

    // ======================================
// ADMIN.JS - PART 4
// DEPOSIT REQUEST SYSTEM
// ======================================


// ================================
// LOAD DEPOSIT REQUESTS
// ================================

async function loadDeposits() {

    const snapshot =
    await get(ref(db, "depositRequests"));


    depositsData = snapshot.exists()
        ? snapshot.val()
        : {};


    renderDeposits();

}



// ================================
// RENDER DEPOSIT REQUESTS
// ================================

function renderDeposits() {

    const container =
    $("depositList");


    if (!container) return;


    container.innerHTML = "";


    const deposits =
    Object.entries(depositsData || {});


    if (deposits.length === 0) {

        container.innerHTML =
        `
        <div class="empty-box">
            No Deposit Requests Found
        </div>
        `;

        return;
    }



    const keyword =
(depositSearch?.value || "").toLowerCase();


const filter =
depositFilter?.value || "all";


const filteredDeposits =
deposits.filter(([id, deposit]) => {


    const text = `
        ${deposit.fullName || ""}
        ${deposit.email || ""}
        ${deposit.phone || ""}
        ${deposit.transactionId || ""}
    `.toLowerCase();


    const matchSearch =
    text.includes(keyword);


    const matchFilter =
    filter === "all" ||
    deposit.status === filter;


    return matchSearch && matchFilter;

});


updateDepositSummary();



filteredDeposits.forEach(([id, deposit]) => {


        const status =
        deposit.status || "pending";
// ======================================
// ADMIN.JS - PART 4b
// DEPOSIT ACTION REFRESH + SAFETY
// ======================================


// ================================
// REFRESH DEPOSIT SECTION
// ================================

async function refreshDepositSection() {

    await loadDeposits();

    updateDepositSummary();

}



// ================================
// SAFE APPROVE CHECK
// ================================

async function safeApproveDeposit(id) {


    const deposit =
    depositsData[id];


    if (!deposit) {

        alert("Deposit not found");

        return;

    }



    if (deposit.status !== "pending") {

        alert(
        "This deposit was already processed"
        );

        return;

    }



    await approveDeposit(id);


    await refreshDepositSection();


}



// ================================
// SAFE REJECT CHECK
// ================================

async function safeRejectDeposit(id) {


    const deposit =
    depositsData[id];


    if (!deposit) {

        alert("Deposit not found");

        return;

    }



    if (deposit.status !== "pending") {

        alert(
        "This deposit was already processed"
        );

        return;

    }



    await rejectDeposit(id);


    await refreshDepositSection();


}



// ================================
// REPLACE BUTTON FUNCTIONS
// ================================

window.approveDeposit =
safeApproveDeposit;


window.rejectDeposit =
safeRejectDeposit;

        

        container.innerHTML +=
        `

        <div class="request-card">

            <h3>
                ${deposit.fullName || "Unknown User"}
            </h3>


            <p>
                Email:
                ${deposit.email || "-"}
            </p>


            <p>
                Phone:
                ${deposit.phone || "-"}
            </p>


            <p>
                Amount:
                ${deposit.amount || 0} RWF
            </p>


            <p>
                Transaction ID:
                ${deposit.transactionId || "-"}
            </p>


            <p>
                Status:
                <b>
                ${status}
                </b>
            </p>



            ${
            status === "pending"

            ?

            `

            <button
            onclick="approveDeposit('${id}')">
                Approve
            </button>


            <button
            onclick="rejectDeposit('${id}')">
                Reject
            </button>

            `

            :

            ""

            }


        </div>

        `;


    });


}



// ================================
// APPROVE DEPOSIT
// ================================

async function approveDeposit(id) {


    const deposit =
    depositsData[id];


    if (!deposit) return;



    if (deposit.status !== "pending") {

        alert("Already processed");

        return;
    }



    await update(
        ref(db,
        "depositRequests/" + id),

        {

        status:"approved",

        approvedAt:
        Date.now()

        }

    );



    await update(

        ref(db,
        "users/" + deposit.uid),

        {

        balance:
        increment(Number(deposit.amount || 0))

        }

    );



    await loadDeposits();


}



// ================================
// REJECT DEPOSIT
// ================================

async function rejectDeposit(id) {


    const deposit =
    depositsData[id];


    if (!deposit) return;



    if (deposit.status !== "pending") {

        alert("Already processed");

        return;
    }



    await update(

        ref(db,
        "depositRequests/" + id),

        {

        status:"rejected",

        rejectedAt:
        Date.now()

        }

    );



    await loadDeposits();


}



// ================================
// GLOBAL EXPORT
// ================================

window.loadDeposits =
loadDeposits;


window.approveDeposit =
approveDeposit;


window.rejectDeposit =
rejectDeposit;

      // ================================
// DEPOSIT SUMMARY + SEARCH + FILTER
// ================================

function updateDepositSummary() {

    let total = 0;
    let pending = 0;
    let approved = 0;
    let rejected = 0;

    Object.values(depositsData || {}).forEach(deposit => {

        total++;

        switch (deposit.status) {

            case "approved":
                approved++;
                break;

            case "rejected":
                rejected++;
                break;

            default:
                pending++;
                break;
        }

    });


    if ($("depositTotalCount"))
        $("depositTotalCount").innerText = total;

    if ($("depositPendingCount"))
        $("depositPendingCount").innerText = pending;

    if ($("depositApprovedCount"))
        $("depositApprovedCount").innerText = approved;

    if ($("depositRejectedCount"))
        $("depositRejectedCount").innerText = rejected;

}



// ================================
// SEARCH + FILTER EVENTS
// ================================

const depositSearch =
document.getElementById("depositSearch");


const depositFilter =
document.getElementById("depositFilter");


if (depositSearch) {

    depositSearch.addEventListener(
        "input",
        renderDeposits
    );

}


if (depositFilter) {

    depositFilter.addEventListener(
        "change",
        renderDeposits
    );

}      

// ======================================
// ADMIN.JS - PART 5
// WITHDRAW REQUEST SYSTEM
// ======================================


// ================================
// LOAD WITHDRAW REQUESTS
// ================================

async function loadWithdraws() {

    const snapshot =
    await get(ref(db, "withdrawRequests"));


    withdrawsData =
    snapshot.exists()
    ? snapshot.val()
    : {};


    renderWithdraws();

}



// ================================
// RENDER WITHDRAW REQUESTS
// ================================

function renderWithdraws() {


    const container =
    $("withdrawList");


    if (!container) return;


    container.innerHTML = "";



    const withdraws =
    Object.entries(withdrawsData || {});



    if (withdraws.length === 0) {


        container.innerHTML =
        `
        <div class="empty-box">
            No Withdraw Requests Found
        </div>
        `;


        return;

    }




    withdraws.forEach(([id, withdraw]) => {


        const status =
        withdraw.status || "pending";



        container.innerHTML +=
        `

        <div class="request-card">


            <h3>
                ${withdraw.fullName || "Unknown User"}
            </h3>



            <p>
                Email:
                ${withdraw.email || "-"}
            </p>



            <p>
                Phone:
                ${withdraw.phone || "-"}
            </p>



            <p>
                Amount:
                ${withdraw.amount || 0} RWF
            </p>



            <p>
                Method:
                ${withdraw.method || "-"}
            </p>



            <p>
                Account:
                ${withdraw.account || "-"}
            </p>



            <p>
                Status:
                <b>
                ${status}
                </b>
            </p>




            ${
            status === "pending"

            ?

            `

            <button
            onclick="approveWithdraw('${id}')">
                Approve
            </button>



            <button
            onclick="rejectWithdraw('${id}')">
                Reject
            </button>


            `

            :

            ""

            }



        </div>

        `;


    });


}



// ================================
// APPROVE WITHDRAW
// ================================

async function approveWithdraw(id) {


    const withdraw =
    withdrawsData[id];


    if (!withdraw) return;



    if (withdraw.status !== "pending") {

        alert("Already processed");

        return;

    }



    await update(

        ref(db,
        "withdrawRequests/" + id),

        {

        status:"approved",

        approvedAt:
        Date.now()

        }

    );



    await push(

        ref(db,
        "transactions"),

        {

        uid:
        withdraw.uid,


        type:
        "withdraw",


        amount:
        Number(withdraw.amount || 0),


        status:
        "approved",


        createdAt:
        Date.now()

        }

    );



    await loadWithdraws();


}



// ================================
// REJECT WITHDRAW
// ================================

async function rejectWithdraw(id) {


    const withdraw =
    withdrawsData[id];


    if (!withdraw) return;



    if (withdraw.status !== "pending") {

        alert("Already processed");

        return;

    }



    await update(

        ref(db,
        "withdrawRequests/" + id),

        {

        status:"rejected",

        rejectedAt:
        Date.now()

        }

    );



    await loadWithdraws();


}



// ================================
// GLOBAL EXPORT
// ================================

window.loadWithdraws =
loadWithdraws;


window.approveWithdraw =
approveWithdraw;


window.rejectWithdraw =
rejectWithdraw;
