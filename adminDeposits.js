// ======================================
// ADMIN DEPOSITS.JS
// PART 1
// ======================================

import { db } from "./firebase.js";

import {

    ref,

    onValue,

    get,

    update,

    push,

    set

} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const depositList =
document.getElementById("depositList");

const emptyDeposit =
document.getElementById("emptyDeposit");

const totalDeposits =
document.getElementById("totalDeposits");

const pendingDeposits =
document.getElementById("pendingDeposits");

const approvedDeposits =
document.getElementById("approvedDeposits");

const rejectedDeposits =
document.getElementById("rejectedDeposits");

// ======================================
// LOAD DEPOSITS
// ======================================

export function loadDeposits(){

const depositsRef =
ref(db,"depositRequests");

onValue(depositsRef,(snapshot)=>{

depositList.innerHTML="";

let total=0;

let pending=0;

let approved=0;

let rejected=0;

if(!snapshot.exists()){

emptyDeposit.style.display="block";

return;

}

emptyDeposit.style.display="none";

snapshot.forEach((child)=>{

const id=child.key;

const data=child.val();

total++;

if(data.status==="pending") pending++;

if(data.status==="approved") approved++;

if(data.status==="rejected") rejected++;

depositList.innerHTML+=`

<div class="request-card">

<div class="request-top">

<h3>${data.amount} RWF</h3>

<span class="status ${data.status}">

${data.status}

</span>

</div>

<p>

<strong>User:</strong>

${data.email}

</p>

<p>

<strong>Method:</strong>

${data.paymentMethod}

</p>

<p>

<strong>Phone:</strong>

${data.senderPhone}

</p>

<p>

<strong>Transaction ID:</strong>

${data.transactionId}

</p>

<p>

<strong>Date:</strong>

${data.paymentDate}

</p>

<div class="action-buttons">

<button

class="approveBtn"

data-id="${id}">

Approve

</button>

<button

class="rejectBtn"

data-id="${id}">

Reject

</button>

</div>

</div>

`;

});

totalDeposits.textContent=total;

pendingDeposits.textContent=pending;

approvedDeposits.textContent=approved;

rejectedDeposits.textContent=rejected;

});

}

// ======================================
// ADMIN DEPOSITS.JS
// PART 2
// APPROVE DEPOSIT
// ======================================

async function approveDeposit(depositId){

    try{

        const depositRef = ref(db, "depositRequests/" + depositId);

        const snapshot = await get(depositRef);

        if(!snapshot.exists()){

            alert("Deposit not found.");

            return;

        }

        const deposit = snapshot.val();

        // Ntukongere kubara deposit yemejwe

        if(deposit.status === "approved"){

            alert("This deposit has already been approved.");

            return;

        }

        // Soma balance y'umukoresha

        const userRef = ref(db, "users/" + deposit.uid);

        const userSnap = await get(userRef);

        if(!userSnap.exists()){

            alert("User account not found.");

            return;

        }

        const user = userSnap.val();

        const currentBalance = Number(user.balance || 0);

        const currentDeposits = Number(user.totalDeposits || 0);

        const newBalance = currentBalance + Number(deposit.amount);

        const newTotalDeposits = currentDeposits + Number(deposit.amount);

        // Hindura user balance

        await update(userRef,{

            balance: newBalance,

            totalDeposits: newTotalDeposits

        });

        // Hindura deposit status

        await update(depositRef,{

            status: "approved",

            approvedAt: Date.now()

        });

        // Andika muri Transaction History

        const transactionRef = push(ref(db, "transactions"));

        await set(transactionRef,{

            uid: deposit.uid,

            email: deposit.email,

            type: "deposit",

            amount: Number(deposit.amount),

            status: "approved",

            paymentMethod: deposit.paymentMethod,

            transactionId: deposit.transactionId,

            createdAt: Date.now()

        });

        alert("Deposit approved successfully.");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// ADMIN DEPOSITS.JS
// PART 3
// REJECT + BUTTON EVENTS
// ======================================

// ======================================
// REJECT DEPOSIT
// ======================================

async function rejectDeposit(depositId){

    try{

        const depositRef = ref(db, "depositRequests/" + depositId);

        const snapshot = await get(depositRef);

        if(!snapshot.exists()){

            alert("Deposit not found.");

            return;

        }

        const deposit = snapshot.val();

        if(deposit.status === "approved"){

            alert("Approved deposit cannot be rejected.");

            return;

        }

        if(deposit.status === "rejected"){

            alert("Deposit already rejected.");

            return;

        }

        await update(depositRef,{

            status: "rejected",

            rejectedAt: Date.now()

        });

        alert("Deposit rejected successfully.");

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// BUTTON EVENTS
// ======================================

document.addEventListener("click", async (e)=>{

    // APPROVE

    if(e.target.classList.contains("approveBtn")){

        const id = e.target.dataset.id;

        e.target.disabled = true;

        e.target.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Approving...';

        await approveDeposit(id);

        loadDeposits();

    }

    // REJECT

    if(e.target.classList.contains("rejectBtn")){

        const id = e.target.dataset.id;

        e.target.disabled = true;

        e.target.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Rejecting...';

        await rejectDeposit(id);

        loadDeposits();

    }

});

// ======================================
// START
// ======================================

loadDeposits();

// ======================================
// ADMIN DEPOSITS.JS
// PART 4
// SEARCH + FILTER + VIEW DETAILS
// ======================================

// Elements

const searchDeposit =
document.getElementById("searchDeposit");

const filterDeposit =
document.getElementById("filterDeposit");

// ======================================
// FILTER DEPOSITS
// ======================================

function filterDeposits(){

    const keyword =
    searchDeposit.value.toLowerCase().trim();

    const status =
    filterDeposit.value;

    const cards =
    document.querySelectorAll(".request-card");

    cards.forEach(card=>{

        const text =
        card.innerText.toLowerCase();

        const badge =
        card.querySelector(".status");

        const cardStatus =
        badge ?
        badge.innerText.toLowerCase() :
        "";

        const matchSearch =
        text.includes(keyword);

        const matchStatus =

        status === "all"

        ||

        cardStatus === status.toLowerCase();

        card.style.display =

        matchSearch && matchStatus

        ?

        "block"

        :

        "none";

    });

}

// ======================================
// SEARCH
// ======================================

if(searchDeposit){

searchDeposit.addEventListener(

"keyup",

filterDeposits

);

}

// ======================================
// FILTER
// ======================================

if(filterDeposit){

filterDeposit.addEventListener(

"change",

filterDeposits

);

}

// ======================================
// VIEW DETAILS
// ======================================

document.addEventListener("click",(e)=>{

const btn = e.target.closest(".viewBtn");

if(!btn) return;

const card =
btn.closest(".request-card");

if(!card) return;

alert(card.innerText);

});

// ======================================
// REFRESH FILTER
// ======================================

setTimeout(()=>{

filterDeposits();

},500);

     // ======================================
// ADMIN DEPOSITS.JS
// PART 5
// AUTO REFRESH + EXPORT CSV
// ======================================

// ======================================
// LIVE REFRESH
// ======================================

let autoRefresh = true;

function startDepositRefresh(){

    setInterval(()=>{

        if(autoRefresh){

            loadDeposits();

        }

    },10000);

}

startDepositRefresh();

// ======================================
// EXPORT CSV
// ======================================

const exportDepositsBtn =
document.getElementById("exportDeposits");

exportDepositsBtn?.addEventListener("click",async()=>{

    const snapshot =
    await get(ref(db,"depositRequests"));

    if(!snapshot.exists()){

        alert("No deposits found.");

        return;

    }

    let csv =

"User,Amount,Method,Phone,Transaction ID,Status,Date\n";

    snapshot.forEach(child=>{

        const d = child.val();

        csv +=

`${d.email},${d.amount},${d.paymentMethod},${d.senderPhone},${d.transactionId},${d.status},${d.paymentDate}\n`;

    });

    const blob =

    new Blob([csv],{

        type:"text/csv"

    });

    const url =

    URL.createObjectURL(blob);

    const a =

    document.createElement("a");

    a.href = url;

    a.download =

    "MoneyVault_Deposits.csv";

    a.click();

    URL.revokeObjectURL(url);

});

// ======================================
// LIVE STATISTICS
// ======================================

function refreshStatistics(){

    totalDeposits.textContent =

    document.querySelectorAll(".request-card").length;

    pendingDeposits.textContent =

    document.querySelectorAll(".status.pending").length;

    approvedDeposits.textContent =

    document.querySelectorAll(".status.approved").length;

    rejectedDeposits.textContent =

    document.querySelectorAll(".status.rejected").length;

}

setInterval(refreshStatistics,3000);

// ======================================
// STOP AUTO REFRESH
// ======================================

window.addEventListener("beforeunload",()=>{

    autoRefresh = false;

});

// ======================================
// MODULE READY
// ======================================

console.log("✅ adminDeposits.js loaded successfully.");       

