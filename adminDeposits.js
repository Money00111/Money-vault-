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


