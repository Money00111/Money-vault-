// ======================================
// dashboard.js
// PART 1
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

const loadingScreen = document.getElementById("loadingScreen");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

const userName = document.getElementById("userName");

const balance = document.getElementById("balance");
const summaryBalance = document.getElementById("summaryBalance");

const bonus = document.getElementById("bonus");
const referralBonus = document.getElementById("referralBonus");

const currentVip = document.getElementById("currentVip");
const currentVipStatus = document.getElementById("currentVipStatus");

// ======================================
// SIDEBAR MENU
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm("Logout from Money Vault?");

    if (!ok) return;

    try {

        await signOut(auth);

        location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth,(user)=>{

    if(!user){

        location.href="login.html";
        return;

    }

    loadUser(user);

    loadTransactions(user);

    createReferral(user);

    loadNotifications();

});

// ======================================
// LOAD USER
// ======================================

function loadUser(user) {

    const userRef = ref(db, "users/" + user.uid);

    onValue(userRef, (snapshot) => {

        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }

        if (!snapshot.exists()) {

            console.log("User data not found");

            return;

        }

        const data = snapshot.val();

        userName.textContent =
            data.fullName || "Money Vault User";

        balance.textContent =
            Number(data.balance || 0).toLocaleString() + " RWF";

        summaryBalance.textContent =
            Number(data.balance || 0).toLocaleString() + " RWF";

        bonus.textContent =
            Number(data.bonus || 0).toLocaleString() + " RWF";

        referralBonus.textContent =
            Number(data.referralBonus || 0).toLocaleString() + " RWF";

        currentVip.textContent =
            data.vip || "VIP 0";

        if (currentVipStatus) {

            currentVipStatus.textContent =
                (data.vip || "VIP 0") + " Member";

        }

    }, (error) => {

        console.error(error);

        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }

    });

}

console.log("Dashboard Part 1 Ready");

// ======================================
// dashboard.js
// PART 2
// ======================================

// ======================================
// ELEMENTS
// ======================================
import {
    ref,
    onValue,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
const recentTransactions = document.getElementById("recentTransactions");

const referralLink = document.getElementById("referralLink");

const copyReferral = document.getElementById("copyReferral");

const notificationList = document.getElementById("notificationList");

// ======================================
// LOAD TRANSACTIONS
// ======================================

function loadTransactions(user){

    const transactionRef = query(

        ref(db,"transactions/" + user.uid),

        limitToLast(10)

    );

    onValue(transactionRef,(snapshot)=>{

        recentTransactions.innerHTML="";

        if(!snapshot.exists()){

            recentTransactions.innerHTML=`

            <div class="transaction-card">

                <div>

                    <h4>No Transactions</h4>

                    <p>Your transactions will appear here.</p>

                </div>

                <span>0 RWF</span>

            </div>

            `;

            return;

        }

        const list=[];

        snapshot.forEach(item=>{

            list.unshift(item.val());

        });

        list.forEach(tx=>{

            recentTransactions.innerHTML+=`

            <div class="transaction-card">

                <div>

                    <h4>${tx.type || "Transaction"}</h4>

                    <p>${tx.date || ""}</p>

                </div>

                <span>

                ${Number(tx.amount || 0).toLocaleString()} RWF

                </span>

            </div>

            `;

        });

    });

}

// ======================================
// REFERRAL LINK
// ======================================

function createReferral(user){

    referralLink.value =

    window.location.origin +

    "/register.html?ref=" +

    user.uid;

}

// ======================================
// COPY REFERRAL
// ======================================

copyReferral?.addEventListener("click",async()=>{

    try{

        await navigator.clipboard.writeText(

            referralLink.value

        );

        alert("Referral link copied successfully.");

    }

    catch(error){

        alert(error.message);

    }

});

// ======================================
// NOTIFICATIONS
// ======================================

function loadNotifications(){

    const notifyRef = ref(db,"announcements");

    onValue(notifyRef,(snapshot)=>{

        notificationList.innerHTML="";

        if(!snapshot.exists()){

            notificationList.innerHTML=`

            <div class="notification-card">

                <div class="notification-icon">

                    <i class="fas fa-bell"></i>

                </div>

                <div class="notification-content">

                    <h3>Welcome</h3>

                    <p>Welcome to Money Vault.</p>

                </div>

            </div>

            `;

            return;

        }

        snapshot.forEach(item=>{

            const data=item.val();

            notificationList.innerHTML+=`

            <div class="notification-card">

                <div class="notification-icon">

                    <i class="fas fa-bullhorn"></i>

                </div>

                <div class="notification-content">

                    <h3>${data.title}</h3>

                    <p>${data.message}</p>

                </div>

            </div>

            `;

        });

    });

}

        

      // ======================================
// dashboard.js
// PART 3 (FINAL)
// ======================================

// ======================================
// TOAST MESSAGE
// ======================================

function showToast(message) {

    let toast = document.querySelector(".toast");

    if (!toast) {

        toast = document.createElement("div");

        toast.className = "toast";

        document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 3000);

}

// ======================================
// SUPPORT BUTTON
// ======================================

const supportBtn = document.querySelector(".support-btn");

supportBtn?.addEventListener("click", (e) => {

    e.preventDefault();

    window.open(
        "https://wa.me/250788846187",
        "_blank"
    );

});

// ======================================
// COPY BUTTON TOAST
// ======================================

copyReferral?.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(
            referralLink.value
        );

        showToast("Referral link copied.");

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// HIDE LOADING IF STILL VISIBLE
// ======================================

window.addEventListener("load", () => {

    setTimeout(() => {

        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }

    }, 1000);

});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

window.addEventListener("error", (event) => {

    console.error(event.error);

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

});


// ======================================
// READY
// ======================================

console.log("==================================");

console.log(" Money Vault Dashboard Ready ");

console.log(" Firebase Connected ");

console.log(" Authentication Ready ");

console.log(" Realtime Database Ready ");

console.log(" Dashboard Loaded Successfully ");

console.log("==================================");                         
