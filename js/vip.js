// ======================================
// VIP.JS - PART 1
// Money Vault Pro VIP System
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue,
    get,
    push,
    set,
    update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// DOM ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const sidebar = document.getElementById("sidebar");

const menuBtn = document.getElementById("menuBtn");

const logoutBtn = document.getElementById("logoutBtn");

const balance = document.getElementById("balance");

const currentVip = document.getElementById("currentVip");

const dailyIncome = document.getElementById("dailyIncome");

const totalProfit = document.getElementById("totalProfit");

const ownedVipList = document.getElementById("ownedVipList");

const vipGrid = document.querySelector(".vip-grid");


// ======================================
// VARIABLES
// ======================================

let currentUser = null;

let userData = {};

let vipPlans = {};


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

    if (!confirm("Logout?")) return;

    await signOut(auth);

    location.href = "login.html";

});


// ======================================
// AUTH
// ======================================


onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";
        return;

    }

    currentUser = user;

    loadUserData();

    loadVipPackages();

});


// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    const userRef = ref(db, "users/" + currentUser.uid);

    onValue(userRef, (snapshot) => {

        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }

        if (!snapshot.exists()) {

            console.log("User data not found");

            return;

        }

        userData = snapshot.val();

        vipPlans = userData.vipPlans || {};

        balance.textContent =
            Number(userData.balance || 0).toLocaleString() + " RWF";

        console.log("User Loaded");

    });

}

console.log("VIP PART 1 READY");

// ======================================
// VIP.JS - PART 2
// LOAD VIP PLANS FROM FIREBASE
// ======================================

function loadVipPackages() {

    const vipRef = ref(db, "vipPlans");

    onValue(vipRef, (snapshot) => {

        vipGrid.innerHTML = "";

        if (!snapshot.exists()) {

            vipGrid.innerHTML = `
                <div class="emptyVip">
                    No VIP Plans Available
                </div>
            `;

            return;
        }

        snapshot.forEach((child) => {

            const vip = child.val();

            if (vip.status !== true) return;

            vipGrid.innerHTML += `

            <div class="vip-card">

                <div class="vip-badge">
                    ${vip.name}
                </div>

                <h2>${Number(vip.price).toLocaleString()} RWF</h2>

                <ul>

                    <li>
                        <i class="fas fa-check"></i>
                        Daily Income:
                        <b>${Number(vip.dailyIncome).toLocaleString()} RWF</b>
                    </li>

                    <li>
                        <i class="fas fa-check"></i>
                        Duration:
                        <b>${vip.duration} Days</b>
                    </li>

                    <li>
                        <i class="fas fa-check"></i>
                        Total Profit:
                        <b>${Number(vip.totalProfit).toLocaleString()} RWF</b>
                    </li>

                </ul>

                <button
                    class="buyVipBtn"
                    data-vip="${vip.name}"
                    data-price="${vip.price}"
                    data-daily="${vip.dailyIncome}"
                    data-profit="${vip.totalProfit}"
                    data-days="${vip.duration}">

                    Buy Now

                </button>

            </div>

            `;

        });

        registerVipButtons();

    });

}

// ======================================
// VIP.JS - PART 3
// REGISTER BUY VIP BUTTONS
// ======================================

function registerVipButtons() {

    const buttons = document.querySelectorAll(".buyVipBtn");

    buttons.forEach((button) => {

        button.addEventListener("click", () => {

            buyVip(button);

        });

    });

}


    
// ======================================
// VIP.JS - PART 4
// BUY VIP PLAN
// ======================================

async function buyVip(button) {

    if (!currentUser) return;

    const vipName = button.dataset.vip;
    const price = Number(button.dataset.price);
    const daily = Number(button.dataset.daily);
    const profit = Number(button.dataset.profit);
    const days = Number(button.dataset.days);

    const ok = confirm(
        `Buy ${vipName} for ${price.toLocaleString()} RWF?`
    );

    if (!ok) return;

    try {

        const userRef =
            ref(db, "users/" + currentUser.uid);

        const snap =
            await get(userRef);

        if (!snap.exists()) {

            alert("User not found.");

            return;

        }

        const user = snap.val();

        const balanceNow =
            Number(user.balance || 0);

        if (balanceNow < price) {

            alert("Insufficient Balance.");

            return;

        }

        const newBalance =
            balanceNow - price;

        await update(userRef, {
            balance: newBalance
        });

        const vipRef = push(
            ref(db, "users/" + currentUser.uid + "/vipPlans")
        );

        await set(vipRef, {

            vipName: vipName,

            dailyIncome: daily,

            totalProfit: profit,

            totalDays: days,

            remainingDays: days,

            purchasedAt: Date.now(),

            lastClaim: 0,

            status: "active"

        });

        const txRef = push(
            ref(db, "transactions/" + currentUser.uid)
        );

        await set(txRef, {

            type: "VIP Purchase",

            vipName: vipName,

            amount: price,

            status: "Completed",

            createdAt: Date.now()

        });

        alert(vipName + " purchased successfully.");

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}

console.log("VIP PART 4 READY");


