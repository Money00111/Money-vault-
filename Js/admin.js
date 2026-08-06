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
// ADMIN.JS - PART 3
// DEPOSIT MANAGEMENT SYSTEM
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




// ================================
// LOAD DEPOSITS
// ================================

function loadDeposits(){

    onValue(
        ref(db,"depositRequests"),
        (snapshot)=>{


            depositsData =
            snapshot.val() || {};


            renderDeposits(
                depositsData
            );


            updateDepositSummary();


        }
    );

}




// ================================
// RENDER DEPOSITS
// ================================

function renderDeposits(data){


    if(!depositList) return;


    depositList.innerHTML="";



    const list =
    Object.entries(data);



    if(list.length===0){


        if(emptyDeposit)
        emptyDeposit.style.display="block";


        return;

    }



    if(emptyDeposit)
    emptyDeposit.style.display="none";




    list.forEach(([id,dep])=>{


        const status =
        dep.status || "pending";



        const card =
        document.createElement("div");


        card.className =
        "request-card";



        card.innerHTML = `


<div class="request-top">

<h3>
${dep.email || "Unknown User"}
</h3>


<span class="status ${status}">
${status.toUpperCase()}
</span>

</div>



<p>
<strong>Amount:</strong>
${formatMoney(dep.amount)}
</p>


<p>
<strong>Method:</strong>
${dep.paymentMethod || "-"}
</p>


<p>
<strong>Phone:</strong>
${dep.senderPhone || "-"}
</p>


<p>
<strong>Transaction ID:</strong>
${dep.transactionId || "-"}
</p>



<div class="action-buttons">


${
status==="pending"

?

`

<button
class="approveDepositBtn"
data-id="${id}">

<i class="fa-solid fa-check"></i>
Approve

</button>



<button
class="rejectDepositBtn"
data-id="${id}">

<i class="fa-solid fa-xmark"></i>
Reject

</button>

`

:

`

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






// ================================
// SUMMARY
// ================================

function updateDepositSummary(){


let total=0;
let pending=0;
let approved=0;
let rejected=0;



Object.values(depositsData)
.forEach(dep=>{


total++;


if(dep.status==="pending")
pending++;


if(dep.status==="approved")
approved++;


if(dep.status==="rejected")
rejected++;


});



depositTotalCount.textContent=total;

depositPendingCount.textContent=pending;

depositApprovedCount.textContent=approved;

depositRejectedCount.textContent=rejected;


}






// ================================
// BUTTON EVENTS
// ================================

depositList.addEventListener(
"click",
async(e)=>{


const approveBtn =
e.target.closest(".approveDepositBtn");


const rejectBtn =
e.target.closest(".rejectDepositBtn");




if(approveBtn){

await approveDeposit(
approveBtn.dataset.id
);

return;

}



if(rejectBtn){

await rejectDeposit(
rejectBtn.dataset.id
);

return;

}



});







// ================================
// APPROVE DEPOSIT
// ================================

async function approveDeposit(id){


const deposit =
depositsData[id];



if(!deposit) return;



if(deposit.status!=="pending"){

alert("Already processed");

return;

}



if(!confirm("Approve this deposit?"))
return;




const userRef =
ref(
db,
"users/"+deposit.uid
);



const userSnap =
await get(userRef);



if(!userSnap.exists()){

alert("User not found");

return;

}



const user =
userSnap.val();



const amount =
Number(deposit.amount || 0);



await update(
userRef,
{

balance:
Number(user.balance||0)
+
amount

});




// UPDATE REQUEST

await update(
ref(db,"depositRequests/"+id),
{

status:"approved",

approvedAt:Date.now(),

approvedBy:
auth.currentUser.uid

});





// TRANSACTION

const transaction =
push(ref(db,"transactions"));



await set(transaction,{

uid:deposit.uid,

email:deposit.email,

type:"deposit",

amount:amount,

status:"approved",

createdAt:Date.now()

});





// NOTIFICATION

const notification =
push(
ref(db,
"notifications/"+deposit.uid)
);



await set(notification,{

title:"Deposit Approved",

message:
"Your deposit of "
+
amount.toLocaleString()
+
" RWF approved.",

type:"deposit",

read:false,

createdAt:Date.now()

});



alert(
"Deposit Approved Successfully"
);


}







// ================================
// REJECT DEPOSIT
// ================================

async function rejectDeposit(id){


const deposit =
depositsData[id];



if(!deposit) return;



if(deposit.status!=="pending"){

alert("Already processed");

return;

}



if(!confirm("Reject this deposit?"))
return;




await update(
ref(db,"depositRequests/"+id),
{

status:"rejected",

rejectedAt:Date.now(),

rejectedBy:
auth.currentUser.uid

});






const notification =
push(
ref(db,
"notifications/"+deposit.uid)
);



await set(notification,{

title:"Deposit Rejected",

message:
"Your deposit request was rejected.",

type:"deposit",

read:false,

createdAt:Date.now()

});



alert(
"Deposit Rejected Successfully"
);


}







// ================================
// SEARCH
// ================================

$("depositSearch")
?.addEventListener(
"input",
applyDepositFilter
);



// ================================
// FILTER
// ================================

$("depositFilter")
?.addEventListener(
"change",
applyDepositFilter
);






function applyDepositFilter(){


const keyword =
($("depositSearch")?.value || "")
.toLowerCase();



const filter =
$("depositFilter")?.value || "all";



const result={};



Object.entries(depositsData)
.forEach(([id,dep])=>{


const searchText =

(
dep.email
+
dep.senderPhone
+
dep.transactionId
)
.toLowerCase();



const searchMatch =
searchText.includes(keyword);



const filterMatch =
filter==="all"
||
dep.status===filter;



if(searchMatch && filterMatch){

result[id]=dep;

}


});



renderDeposits(result);


}





loadDeposits();



console.log(
"ADMIN PART 3 NEW READY"
);

