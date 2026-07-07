// ======================================
// dashboard.js
// CLEAN VERSION - PART 1
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue,
    query,
    limitToLast
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const sidebar = document.getElementById("sidebar");

const menuBtn = document.getElementById("menuBtn");

const logoutBtn = document.getElementById("logoutBtn");

const userName = document.getElementById("userName");

const balance = document.getElementById("balance");

const summaryBalance = document.getElementById("summaryBalance");

const bonus = document.getElementById("bonus");

const referralBonus = document.getElementById("referralBonus");

const currentVip = document.getElementById("currentVip");

const recentTransactions = document.getElementById("recentTransactions");

const referralLink = document.getElementById("referralLink");

const copyReferral = document.getElementById("copyReferral");

const notificationList = document.getElementById("notificationList");

// ======================================
// MENU
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async () => {

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

onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";

        return;

    }

    loadUser(user);

    loadTransactions(user);

    createReferral(user);

    loadAnnouncements();

});

// ======================================
// USER DATA
// ======================================

function loadUser(user) {

    const userRef = ref(db, "users/" + user.uid);

    onValue(userRef, (snapshot) => {

        loadingScreen.style.display = "none";

        if (!snapshot.exists()) {

            console.log("User data not found.");

            return;

        }

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

        currentVip.textContent =
            data.vip || "VIP 0";

    });

}

console.log("Dashboard Part 1 Loaded");

// ======================================
// dashboard.js
// CLEAN VERSION - PART 2
// ======================================

// ======================================
// LOAD TRANSACTIONS
// ======================================

function loadTransactions(user) {

    const txRef = query(

        ref(db, "transactions/" + user.uid),

        limitToLast(10)

    );

    onValue(txRef, (snapshot) => {

        if (!recentTransactions) return;

        recentTransactions.innerHTML = "";

        if (!snapshot.exists()) {

            recentTransactions.innerHTML = `

            <div class="transaction-card">

                <h4>No Transactions</h4>

                <p>Your transaction history is empty.</p>

            </div>

            `;

            return;

        }

        const list = [];

        snapshot.forEach((item) => {

            list.unshift(item.val());

        });

        list.forEach((tx) => {

            recentTransactions.innerHTML += `

            <div class="transaction-card">

                <div>

                    <h4>${tx.type || "Transaction"}</h4>

                    <p>${tx.date || ""}</p>

                </div>

                <h3>

                    ${Number(tx.amount || 0).toLocaleString()} RWF

                </h3>

            </div>

            `;

        });

    });

}

// ======================================
// REFERRAL LINK
// ======================================

function createReferral(user) {

    if (!referralLink) return;

    referralLink.value =

        window.location.origin +

        "/register.html?ref=" +

        user.uid;

}

// ======================================
// COPY REFERRAL
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
// ANNOUNCEMENTS
// ======================================

function loadAnnouncements() {

    if (!notificationList) return;

    const announceRef = ref(db, "announcements");

    onValue(announceRef, (snapshot) => {

        notificationList.innerHTML = "";

        if (!snapshot.exists()) {

            notificationList.innerHTML = `

            <div class="notification-card">

                <i class="fas fa-bell"></i>

                <div>

                    <h4>Welcome</h4>

                    <p>Welcome to Money Vault.</p>

                </div>

            </div>

            `;

            return;

        }

        snapshot.forEach((item) => {

            const data = item.val();

            notificationList.innerHTML += `

            <div class="notification-card">

                <i class="fas fa-bullhorn"></i>

                <div>

                    <h4>${data.title || "Announcement"}</h4>

                    <p>${data.message || ""}</p>

                </div>

            </div>

            `;

        });

    });

}

console.log("Dashboard Part 2 Loaded");

// ======================================
// dashboard.js
// CLEAN VERSION - PART 3
// ======================================

// ======================================
// TOAST MESSAGE
// ======================================

function showToast(message) {

    let toast = document.querySelector(".toast");

    if (!toast) {

        toast = document.createElement("div");
        toast.className = "toast";

        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.padding = "15px 20px";
        toast.style.background = "#2563eb";
        toast.style.color = "#fff";
        toast.style.borderRadius = "10px";
        toast.style.zIndex = "99999";
        toast.style.fontWeight = "600";

        document.body.appendChild(toast);

    }

    toast.textContent = message;
    toast.style.display = "block";

    setTimeout(() => {

        toast.style.display = "none";

    }, 3000);

}

// ======================================
// SUPPORT BUTTON
// ======================================

const supportBtn = document.querySelector(".support-btn");

supportBtn?.addEventListener("click", (e) => {

    e.preventDefault();

    window.open("https://wa.me/250788846187", "_blank");

});

// ======================================
// HIDE LOADING IF STILL VISIBLE
// ======================================

window.addEventListener("load", () => {

    if (loadingScreen) {

        setTimeout(() => {

            loadingScreen.style.display = "none";

        }, 800);

    }

});

// ======================================
// GLOBAL ERROR HANDLER
// ======================================

window.addEventListener("error", (event) => {

    console.error("Dashboard Error:", event.error);

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

});

// ======================================
// FINISH
// ======================================

console.log("Money Vault Dashboard Ready");
