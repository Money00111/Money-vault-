// ======================================
// DASHBOARD.JS - PART 1
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const loadingScreen = document.getElementById("loadingScreen");
const logoutBtn = document.getElementById("logoutBtn");

const userName = document.getElementById("userName");
const balance = document.getElementById("balance");
const summaryBalance = document.getElementById("summaryBalance");
const bonus = document.getElementById("bonus");
const referralBonus = document.getElementById("referralBonus");
const currentVip = document.getElementById("currentVip");

// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async () => {

    if (!confirm("Are you sure you want to logout?")) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    loadDashboard(user);

});

// ======================================
// LOAD USER DATA
// ======================================

function loadDashboard(user) {

    const userRef = ref(db, "users/" + user.uid);

    onValue(userRef, (snapshot) => {

        if (!snapshot.exists()) return;

        const data = snapshot.val();

        userName.textContent = data.fullName || "Money Vault User";

        balance.textContent =
            Number(data.balance || 0).toLocaleString() + " RWF";

        summaryBalance.textContent =
            Number(data.balance || 0).toLocaleString() + " RWF";

        bonus.textContent =
            Number(data.bonus || 0).toLocaleString() + " RWF";

        referralBonus.textContent =
            Number(data.referralBonus || 0).toLocaleString() + " RWF";

        currentVip.textContent = data.vip || "VIP 0";

        loadingScreen.style.display = "none";

    });

}

console.log("Dashboard Part 1 Loaded Successfully");

// ======================================
// DASHBOARD.JS - PART 2
// TRANSACTIONS + REFERRAL
// ======================================

import {
    ref,
    query,
    limitToLast,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const recentTransactions =
document.getElementById("recentTransactions");

const referralLink =
document.getElementById("referralLink");

const copyReferral =
document.getElementById("copyReferral");

const notificationList =
document.getElementById("notificationList");

// ======================================
// LOAD TRANSACTIONS
// ======================================

function loadTransactions(user){

const txRef=query(

ref(db,"transactions/"+user.uid),

limitToLast(5)

);

onValue(txRef,(snapshot)=>{

recentTransactions.innerHTML="";

if(!snapshot.exists()){

recentTransactions.innerHTML=

`<p class="empty-text">
No recent transactions.
</p>`;

return;

}

const transactions=[];

snapshot.forEach(item=>{

transactions.unshift(item.val());

});

transactions.forEach(tx=>{

recentTransactions.innerHTML+=`

<div class="transaction-card">

<div>

<h4>${tx.type}</h4>

<p>${tx.date}</p>

</div>

<h3>

${Number(tx.amount).toLocaleString()} RWF

</h3>

</div>

`;

});

});

}

// ======================================
// REFERRAL LINK
// ======================================

function createReferral(user){

const link=

window.location.origin+

"/register.html?ref="+

user.uid;

referralLink.value=link;

}

// ======================================
// COPY LINK
// ======================================

copyReferral?.addEventListener("click",()=>{

navigator.clipboard.writeText(

referralLink.value

);

alert("Referral Link Copied");

});

// ======================================
// NOTIFICATION
// ======================================

function addNotification(title,message){

notificationList.innerHTML=`

<div class="notification-card">

<i class="fas fa-bell"></i>

<div>

<h4>${title}</h4>

<p>${message}</p>

</div>

</div>

`;

}

// ======================================
// UPDATE DASHBOARD
// ======================================

onAuthStateChanged(auth,(user)=>{

if(!user) return;

loadTransactions(user);

createReferral(user);

addNotification(

"Welcome",

"Manage your Money Vault account securely."

);

});

console.log("Dashboard Part 2 Loaded");
// ======================================
// DASHBOARD.JS - PART 3
// VIP + ANNOUNCEMENTS + SUPPORT
// ======================================

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// VIP STATUS
// ======================================

function updateVipStatus(user){

    const vipRef = ref(db,"users/"+user.uid+"/vip");

    onValue(vipRef,(snapshot)=>{

        if(snapshot.exists()){

            currentVip.textContent = snapshot.val();

        }else{

            currentVip.textContent = "VIP 0";

        }

    });

}

// ======================================
// ADMIN ANNOUNCEMENTS
// ======================================

function loadAnnouncements(){

    const announceRef = ref(db,"announcements");

    onValue(announceRef,(snapshot)=>{

        if(!snapshot.exists()) return;

        notificationList.innerHTML="";

        snapshot.forEach(item=>{

            const data=item.val();

            notificationList.innerHTML += `

            <div class="notification-card">

                <i class="fas fa-bullhorn"></i>

                <div>

                    <h4>${data.title || "Announcement"}</h4>

                    <p>${data.message}</p>

                </div>

            </div>

            `;

        });

    });

}

// ======================================
// SUPPORT BUTTON
// ======================================

const supportBtn = document.querySelector(".support-btn");

supportBtn?.addEventListener("click",(e)=>{

    e.preventDefault();

    window.location.href="tel:+250788846187";

});

// ======================================
// LOGOUT SUCCESS
// ======================================

function showToast(message){

    const toast=document.createElement("div");

    toast.className="toast";

    toast.innerText=message;

    document.body.appendChild(toast);

    setTimeout(()=>{

        toast.classList.add("show");

    },100);

    setTimeout(()=>{

        toast.remove();

    },3000);

}

// ======================================
// START DASHBOARD
// ======================================

onAuthStateChanged(auth,(user)=>{

    if(!user) return;

    updateVipStatus(user);

    loadAnnouncements();

});

// ======================================
// COPY REFERRAL SUCCESS
// ======================================

copyReferral?.addEventListener("click",()=>{

    navigator.clipboard.writeText(referralLink.value);

    showToast("Referral link copied successfully.");

});

console.log("Dashboard Ready Successfully");
