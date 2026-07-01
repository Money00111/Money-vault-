// ===============================
// DASHBOARD.JS - PART 1
// ===============================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

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

// Firebase Config
// Shyiramo config yawe hano niba utarayishyira muri firebase.js
import { app } from "./firebase.js";

const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// HTML Elements
// ===============================

const username = document.getElementById("username");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

// ===============================
// Sidebar Toggle
// ===============================

menuBtn.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});

// ===============================
// Authentication
// ===============================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    try {

        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {

            const data = snap.data();

            username.textContent =
                `Welcome, ${data.name || user.email}`;
          
          await loadDashboard(user);

        } else {

            username.textContent =
                user.email;

        }

    } catch (error) {

        console.error(error);

        username.textContent =
            user.email;

    }

});

// ===============================
// Logout
// ===============================

logoutBtn.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm("Do you want to logout?");

    if (!ok) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ===============================
// DASHBOARD.JS - PART 2
// Balance + User Data
// ===============================

// HTML Elements
const balanceBox = document.getElementById("balanceBox");
const vipLevel = document.getElementById("vipLevel");
const depositTotal = document.getElementById("depositTotal");
const withdrawTotal = document.getElementById("withdrawTotal");
const refBonus = document.getElementById("refBonus");

const earningsBox = document.getElementById("earningsBox");
const referralBox = document.getElementById("referralBox");
const vipStatus = document.getElementById("vipStatus");

// ===============================
// Load Dashboard Data
// ===============================

async function loadDashboard(user){

    try{

        const userRef = doc(db,"users",user.uid);
        const snap = await getDoc(userRef);

        if(!snap.exists()){
            console.log("User document not found");
            return;
        }

        const data = snap.data();

        // Balance
        balanceBox.textContent =
        `${Number(data.balance || 0).toLocaleString()} RWF`;

        // VIP
        vipLevel.textContent =
        data.vip || "VIP 0";

        vipStatus.textContent =
        data.vip || "Inactive";

        // Deposit
        depositTotal.textContent =
        `${Number(data.deposit || 0).toLocaleString()} RWF`;

        // Withdraw
        withdrawTotal.textContent =
        `${Number(data.withdraw || 0).toLocaleString()} RWF`;

        // Referral
        refBonus.textContent =
        `${Number(data.referralBonus || 0).toLocaleString()} RWF`;

        referralBox.textContent =
        `${Number(data.referralBonus || 0).toLocaleString()} RWF`;

        // Earnings
        earningsBox.textContent =
        `${Number(data.earnings || 0).toLocaleString()} RWF`;

    }catch(error){

        console.error("Dashboard Error:",error);

    }

}

// ===============================
// Call Dashboard Loader
// ===============================

onAuthStateChanged(auth, async(user)=>{

    if(!user) return;

    await loadDashboard(user);

});

// ===============================
// DASHBOARD.JS - PART 3
// ===============================

// ---------- Notifications ----------

function showNotification(message){

    const list = document.getElementById("notificationList");

    if(!list) return;

    const card = document.createElement("div");

    card.className = "notification-card";

    card.innerHTML = `
        🔔 ${message}
    `;

    list.prepend(card);

    setTimeout(()=>{
        card.remove();
    },6000);

}

// ---------- VIP Buy Buttons ----------

const vip1Btn = document.getElementById("vip1Btn");
const vip2Btn = document.getElementById("vip2Btn");
const vip3Btn = document.getElementById("vip3Btn");

if(vip1Btn){

vip1Btn.addEventListener("click",()=>{

showNotification("Redirecting to VIP 1 purchase...");

setTimeout(()=>{

window.location.href="vip.html";

},800);

});

}

if(vip2Btn){

vip2Btn.addEventListener("click",()=>{

showNotification("Redirecting to VIP 2 purchase...");

setTimeout(()=>{

window.location.href="vip.html";

},800);

});

}

if(vip3Btn){

vip3Btn.addEventListener("click",()=>{

showNotification("Redirecting to VIP 3 purchase...");

setTimeout(()=>{

window.location.href="vip.html";

},800);

});

}

// ---------- Quick Actions ----------

document.querySelectorAll(".action").forEach(action=>{

action.addEventListener("click",()=>{

showNotification("Loading page...");

});

});

// ---------- Recent Transactions ----------

function loadRecentTransactions(){

const transactionList=document.getElementById("transactionList");

if(!transactionList) return;

const transactions=[

{
title:"Registration Bonus",
amount:"+500 RWF",
status:"Completed",
className:"success"
},

{
title:"Deposit",
amount:"Pending",
status:"Pending",
className:"pending"
},

{
title:"Withdraw",
amount:"No Request",
status:"Waiting",
className:"waiting"
}

];

transactionList.innerHTML="";

transactions.forEach(item=>{

transactionList.innerHTML+=`

<div class="transaction">

<div>

<h4>${item.title}</h4>

<p>${item.amount}</p>

</div>

<span class="${item.className}">
${item.status}
</span>

</div>

`;

});

}

loadRecentTransactions();

// ---------- Welcome Notification ----------

setTimeout(()=>{

showNotification("Welcome to Money Vault Dashboard 🎉");

},1000);
