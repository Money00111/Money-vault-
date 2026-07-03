// ===============================
// TRANSACTIONS.JS - PART 1
// ===============================

import { app } from "./firebase.js";

import {
getAuth,
onAuthStateChanged,
signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
getFirestore,
doc,
getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// HTML ELEMENTS
// ===============================

const sidebar = document.getElementById("sidebar");

const menuBtn = document.getElementById("menuBtn");

const logoutBtn = document.getElementById("logoutBtn");

const loadingScreen =
document.getElementById("loadingScreen");

const balance =
document.getElementById("balance");

const totalDeposit =
document.getElementById("totalDeposit");

const totalWithdraw =
document.getElementById("totalWithdraw");

const bonus =
document.getElementById("bonus");

const summaryBalance =
document.getElementById("summaryBalance");

const summaryDeposit =
document.getElementById("summaryDeposit");

const summaryWithdraw =
document.getElementById("summaryWithdraw");

const summaryBonus =
document.getElementById("summaryBonus");

const transactionsList =
document.getElementById("transactionsList");

// ===============================
// SIDEBAR
// ===============================

menuBtn?.addEventListener("click",()=>{

sidebar.classList.toggle("active");

});

// ===============================
// LOGOUT
// ===============================

logoutBtn?.addEventListener("click",async()=>{

const ok = confirm(
"Are you sure you want to logout?"
);

if(!ok) return;

await signOut(auth);

window.location.href="login.html";

});

// ===============================
// AUTH CHECK
// ===============================

onAuthStateChanged(auth,async(user)=>{

if(!user){

window.location.href="login.html";

return;

}

await loadUser(user);

hideLoading();

});

// ===============================
// LOAD USER
// ===============================

async function loadUser(user){

try{

const userRef =
doc(db,"users",user.uid);

const snap =
await getDoc(userRef);

if(!snap.exists()) return;

const data = snap.data();

const wallet =
Number(data.balance || 0);

const bonusMoney =
Number(data.bonus || 0);

balance.textContent =
wallet.toLocaleString()+" RWF";

summaryBalance.textContent =
wallet.toLocaleString()+" RWF";

bonus.textContent =
bonusMoney.toLocaleString()+" RWF";

summaryBonus.textContent =
bonusMoney.toLocaleString()+" RWF";

}catch(error){

console.error(error);

}

}

// ===============================
// LOADING
// ===============================

function hideLoading(){

setTimeout(()=>{

loadingScreen.style.display="none";

},1000);

}

// ===============================
// FORMAT MONEY
// ===============================

function formatMoney(amount){

return Number(amount)
.toLocaleString()+" RWF";

}

console.log("Transactions Part 1 Loaded");

// ===============================
// TRANSACTIONS.JS - PART 2
// Load Transactions
// ===============================

import {
collection,
query,
where,
orderBy,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ===============================
// Transactions Array
// ===============================

let allTransactions=[];

// ===============================
// Load Transactions
// ===============================

function loadTransactions(user){

const depositsQuery=query(

collection(db,"deposits"),

where("userId","==",user.uid),

orderBy("createdAt","desc")

);

const withdrawsQuery=query(

collection(db,"withdraws"),

where("userId","==",user.uid),

orderBy("createdAt","desc")

);

// -------------------------------
// Deposits
// -------------------------------

onSnapshot(depositsQuery,(snapshot)=>{

allTransactions=
allTransactions.filter(item=>item.type!=="Deposit");

snapshot.forEach((doc)=>{

const data=doc.data();

allTransactions.push({

id:doc.id,

type:"Deposit",

amount:data.amount,

method:data.paymentMethod,

transactionId:data.transactionId,

status:data.status,

date:data.createdAt,

icon:"📥"

});

});

renderTransactions();

});

// -------------------------------
// Withdraws
// -------------------------------

onSnapshot(withdrawsQuery,(snapshot)=>{

allTransactions=
allTransactions.filter(item=>item.type!=="Withdraw");

snapshot.forEach((doc)=>{

const data=doc.data();

allTransactions.push({

id:doc.id,

type:"Withdraw",

amount:data.amount,

fee:data.fee,

receive:data.receive,

method:data.paymentMethod,

phone:data.phone,

status:data.status,

date:data.createdAt,

icon:"📤"

});

});

renderTransactions();

});

}

// ===============================
// Render Transactions
// ===============================

function renderTransactions(){

transactionsList.innerHTML="";

if(allTransactions.length===0){

transactionsList.innerHTML=`

<div class="transaction-card loading">

<div>

<h3>No Transactions</h3>

<p>Your transaction history will appear here.</p>

</div>

<span class="pending">

Empty

</span>

</div>

`;

return;

}

// Sort

allTransactions.sort((a,b)=>{

const first=a.date?.seconds||0;

const second=b.date?.seconds||0;

return second-first;

});

// Display

allTransactions.forEach(item=>{

const date=item.date?.toDate()

? item.date.toDate().toLocaleString()

:"Waiting...";

let badge="pending";

if(item.status==="Approved") badge="approved";

if(item.status==="Rejected") badge="rejected";

transactionsList.innerHTML+=`

<div class="transaction-card ${item.type.toLowerCase()}">

<div>

<h3>

${item.icon} ${item.type}

</h3>

<p>

<strong>Amount:</strong>

${formatMoney(item.amount)}

</p>

${item.type==="Withdraw"

?`

<p>

<strong>Fee:</strong>

${formatMoney(item.fee)}

</p>

<p>

<strong>Receive:</strong>

${formatMoney(item.receive)}

</p>

<p>

<strong>Phone:</strong>

${item.phone}

</p>

`

:`

<p>

<strong>Method:</strong>

${item.method}

</p>

<p>

<strong>Transaction ID:</strong>

${item.transactionId}

</p>

`

}

<p>

<strong>Date:</strong>

${date}

</p>

</div>

<span class="${badge}">

${item.status}

</span>

</div>

`;

});

}

// ===============================
// Start Loading
// ===============================

onAuthStateChanged(auth,(user)=>{

if(!user) return;

loadTransactions(user);

});

// ===============================
// TRANSACTIONS.JS - PART 3
// Search + Filter + Statistics
// ===============================

// Current Filter

let currentFilter = "All";

// HTML Elements

const searchInput =
document.getElementById("searchInput");

const filterButtons =
document.querySelectorAll(".filter-btn");

// ===============================
// Search
// ===============================

searchInput?.addEventListener("input",()=>{

renderTransactions();

});

// ===============================
// Filter Buttons
// ===============================

filterButtons.forEach(btn=>{

btn.addEventListener("click",()=>{

filterButtons.forEach(b=>{

b.classList.remove("active");

});

btn.classList.add("active");

currentFilter = btn.innerText.trim();

renderTransactions();

});

});

// ===============================
// Statistics
// ===============================

function updateStatistics(list){

let depositTotal = 0;

let withdrawTotal = 0;

let bonusTotal = 0;

list.forEach(item=>{

if(item.type==="Deposit"){

depositTotal += Number(item.amount||0);

}

if(item.type==="Withdraw"){

withdrawTotal += Number(item.amount||0);

}

if(item.type==="Bonus"){

bonusTotal += Number(item.amount||0);

}

});

totalDeposit.textContent =
formatMoney(depositTotal);

totalWithdraw.textContent =
formatMoney(withdrawTotal);

bonus.textContent =
formatMoney(bonusTotal);

summaryDeposit.textContent =
formatMoney(depositTotal);

summaryWithdraw.textContent =
formatMoney(withdrawTotal);

summaryBonus.textContent =
formatMoney(bonusTotal);

}

// ===============================
// Render Transactions (Updated)
// ===============================

function renderTransactions(){

transactionsList.innerHTML="";

let filtered=[...allTransactions];

// Filter

if(currentFilter!=="All"){

filtered = filtered.filter(item=>

item.type===currentFilter

);

}

// Search

const keyword =

searchInput.value

.toLowerCase()

.trim();

if(keyword){

filtered = filtered.filter(item=>{

return (

(item.type||"")

.toLowerCase()

.includes(keyword)

||

(item.method||"")

.toLowerCase()

.includes(keyword)

||

(item.transactionId||"")

.toLowerCase()

.includes(keyword)

||

(item.phone||"")

.toLowerCase()

.includes(keyword)

||

(item.status||"")

.toLowerCase()

.includes(keyword)

);

});

}

// Statistics

updateStatistics(filtered);

// Empty

if(filtered.length===0){

transactionsList.innerHTML=`

<div class="transaction-card loading">

<div>

<h3>No Matching Transactions</h3>

<p>No result found.</p>

</div>

<span class="pending">

Empty

</span>

</div>

`;

return;

}

// Sort

filtered.sort((a,b)=>{

const first=a.date?.seconds||0;

const second=b.date?.seconds||0;

return second-first;

});

// Render

filtered.forEach(item=>{

const date=item.date?.toDate()

? item.date.toDate().toLocaleString()

: "Waiting...";

let badge="pending";

if(item.status==="Approved"){

badge="approved";

}

if(item.status==="Rejected"){

badge="rejected";

}

transactionsList.innerHTML += `

<div class="transaction-card ${item.type.toLowerCase()}">

<div>

<h3>${item.icon} ${item.type}</h3>

<p><strong>Amount:</strong> ${formatMoney(item.amount)}</p>

${item.type==="Withdraw"

?`

<p><strong>Fee:</strong> ${formatMoney(item.fee)}</p>

<p><strong>Receive:</strong> ${formatMoney(item.receive)}</p>

<p><strong>Phone:</strong> ${item.phone}</p>

`

:`

<p><strong>Method:</strong> ${item.method}</p>

<p><strong>Transaction ID:</strong> ${item.transactionId}</p>

`

}

<p><strong>Date:</strong> ${date}</p>

</div>

<span class="${badge}">

${item.status}

</span>

</div>

`;

});

}


// ===============================
// TRANSACTIONS.JS - PART 4
// Final Functions
// ===============================

// Scroll To Top

const scrollTopBtn =
document.getElementById("scrollTopBtn");

window.addEventListener("scroll",()=>{

if(window.scrollY>300){

scrollTopBtn.style.display="block";

}else{

scrollTopBtn.style.display="none";

}

});

scrollTopBtn?.addEventListener("click",()=>{

window.scrollTo({

top:0,

behavior:"smooth"

});

});

// ===============================
// Toast Notification
// ===============================

function showToast(message,color="#2563eb"){

const toast=document.createElement("div");

toast.innerHTML=message;

toast.style.position="fixed";

toast.style.top="20px";

toast.style.right="20px";

toast.style.padding="15px 22px";

toast.style.background=color;

toast.style.color="#fff";

toast.style.borderRadius="12px";

toast.style.fontWeight="600";

toast.style.boxShadow="0 10px 25px rgba(0,0,0,.25)";

toast.style.zIndex="99999";

document.body.appendChild(toast);

setTimeout(()=>{

toast.remove();

},3000);

}

// ===============================
// Internet Status
// ===============================

window.addEventListener("online",()=>{

showToast(

"✅ Internet Connected",

"#10b981"

);

});

window.addEventListener("offline",()=>{

showToast(

"❌ Internet Disconnected",

"#ef4444"

);

});

// ===============================
// Loading Screen
// ===============================

window.addEventListener("load",()=>{

setTimeout(()=>{

loadingScreen.style.opacity="0";

setTimeout(()=>{

loadingScreen.style.display="none";

},500);

},1000);

});

// ===============================
// Page Animation
// ===============================

document.body.style.opacity="0";

window.addEventListener("load",()=>{

setTimeout(()=>{

document.body.style.transition="opacity .5s";

document.body.style.opacity="1";

},200);

});

// ===============================
// Auto Refresh
// ===============================

setInterval(()=>{

const user=auth.currentUser;

if(user){

loadTransactions(user);

}

},60000);

// ===============================
// Welcome Notification
// ===============================

setTimeout(()=>{

showToast(

"📜 Transactions Loaded Successfully",

"#2563eb"

);

},800);

// ===============================
// Logout Confirmation
// ===============================

logoutBtn?.addEventListener("click",async(e)=>{

e.preventDefault();

const ok=confirm(

"Do you really want to logout?"

);

if(!ok) return;

try{

await signOut(auth);

window.location.href="login.html";

}catch(error){

showToast(

error.message,

"#ef4444"

);

}

});

// ===============================
// Console
// ===============================

console.log(`

=====================================

        MONEY VAULT PRO

=====================================

Transactions Module Loaded

Firebase Connected

Realtime Database Ready

Search Enabled

Filter Enabled

Statistics Enabled

Security Enabled

=====================================

`);
