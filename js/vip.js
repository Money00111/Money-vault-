// ======================================
// VIP.JS - PART 1A
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
    update,
    push,
    set,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// ELEMENTS
// ======================================

const loadingScreen =
document.getElementById("loadingScreen");

const menuBtn =
document.getElementById("menuBtn");

const sidebar =
document.getElementById("sidebar");

const logoutBtn =
document.getElementById("logoutBtn");

const balance =
document.getElementById("balance");

const currentVip =
document.getElementById("currentVip");

const dailyIncome =
document.getElementById("dailyIncome");

const totalProfit =
document.getElementById("totalProfit");

const ownedVipList =
document.getElementById("ownedVipList");

const buyButtons =
document.querySelectorAll(".buyVipBtn");


// ======================================
// USER
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

    const ok = confirm("Logout?");

    if (!ok) return;

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

});


// ======================================
// LOAD USER
// ======================================

function loadUserData() {

    const userRef =
    ref(db, "users/" + currentUser.uid);

    onValue(userRef, (snapshot) => {

        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }

        if (!snapshot.exists()) return;

        userData = snapshot.val();

        vipPlans =
        userData.vipPlans || {};

        balance.textContent =
        Number(userData.balance || 0)
        .toLocaleString() + " RWF";

        calculateVipTotals();

        renderOwnedVipPlans();

        updateVipButtons();

    });

}

    // ======================================
// VIP.JS - PART 1B
// CALCULATE + RENDER VIP PLANS
// ======================================

// ======================================
// CALCULATE VIP TOTALS
// ======================================

function calculateVipTotals() {

    let totalDailyIncome = 0;

    let totalProfitAmount = 0;

    let currentPlan = "VIP 0";

    Object.values(vipPlans).forEach(plan => {

        if (plan.status !== "active") return;

        totalDailyIncome +=
            Number(plan.dailyIncome || 0);

        totalProfitAmount +=
            Number(plan.dailyIncome || 0) *
            Number(plan.remainingDays || 0);

        currentPlan = plan.vipName;

    });

    currentVip.textContent = currentPlan;

    dailyIncome.textContent =
        totalDailyIncome.toLocaleString() + " RWF";

    totalProfit.textContent =
        totalProfitAmount.toLocaleString() + " RWF";

}


// ======================================
// SHOW PURCHASED VIP PLANS
// ======================================

function renderOwnedVipPlans() {

    if (!ownedVipList) return;

    ownedVipList.innerHTML = "";

    const plans =
        Object.values(vipPlans);

    if (plans.length === 0) {

        ownedVipList.innerHTML = `

        <div class="emptyVip">

            No VIP Purchased

        </div>

        `;

        return;

    }

    plans.forEach(plan => {

        ownedVipList.innerHTML += `

        <div class="owned-vip-card">

            <h3>${plan.vipName}</h3>

            <p>

                Daily Income :
                ${Number(plan.dailyIncome).toLocaleString()} RWF

            </p>

            <p>

                Remaining Days :
                ${plan.remainingDays}

            </p>

            <span class="vip-status ${plan.status}">

                ${plan.status.toUpperCase()}

            </span>

        </div>

        `;

    });

}


// ======================================
// UPDATE VIP BUTTONS
// ======================================

function updateVipButtons() {

    buyButtons.forEach(button => {

        const vip =
            button.dataset.vip;

        const purchased =
            Object.values(vipPlans).find(plan =>

                plan.vipName === vip &&
                plan.status === "active"

            );

        if (purchased) {

        

            button.innerHTML = `

            <i class="fas fa-check-circle"></i>

            Purchased

            `;

            button.classList.add("activeVip");

        }

        else {

            button.disabled = false;

            button.classList.remove("activeVip");

            button.innerHTML = `

            <i class="fas fa-crown"></i>

            Buy Now

            `;

        }

    });

}

console.log("VIP PART 1 COMPLETE");

// ======================================
// VIP.JS - PART 2A
// BUY VIP PLAN
// ======================================

// BUY BUTTONS

buyButtons.forEach(button => {

    button.addEventListener("click", () => {

        buyVip(button);

    });

});


// ======================================
// BUY VIP
// ======================================

async function buyVip(button) {

    if (!currentUser) return;

    const vipName =
        button.dataset.vip;

    const price =
        Number(button.dataset.price);

    const dailyIncome =
        Number(button.dataset.daily);

    const totalDays =
        Number(button.dataset.days);

    const balanceNow =
        Number(userData.balance || 0);

    // CHECK BALANCE

    if (balanceNow < price) {

        alert("Insufficient Balance");

        return;

    }

    // CONFIRM

    const ok = confirm(

        `Buy ${vipName} for ${price.toLocaleString()} RWF ?`

    );

    if (!ok) return;

    try {

        const purchaseRef = push(

            ref(
                db,
                "users/" +
                currentUser.uid +
                "/vipPlans"
            )

        );

        await set(

            purchaseRef,

            {

                vipName: vipName,

                dailyIncome: dailyIncome,

                totalDays: totalDays,

                remainingDays: totalDays,

                purchasedAt: Date.now(),

                status: "active"

            }

        );

        const newBalance =
            balanceNow - price;
                // UPDATE USER BALANCE

        await update(

            ref(db, "users/" + currentUser.uid),

            {

                balance: newBalance

            }

        );

        // SAVE TRANSACTION

        const transactionRef = push(

            ref(

                db,

                "transactions/" +

                currentUser.uid

            )

        );

        await set(

            transactionRef,

            {

                type: "VIP Purchase",

                vipName: vipName,

                amount: price,

                dailyIncome: dailyIncome,

                totalDays: totalDays,

                status: "completed",

                createdAt: Date.now()

            }

        );

        // UPDATE LOCAL DATA

        userData.balance = newBalance;

        vipPlans[purchaseRef.key] = {

            vipName: vipName,

            dailyIncome: dailyIncome,

            totalDays: totalDays,

            remainingDays: totalDays,

            purchasedAt: Date.now(),

            status: "active"

        };

        calculateVipTotals();

        renderOwnedVipPlans();

        updateVipButtons();

        alert(vipName + " Purchased Successfully.");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

console.log("VIP PART 2 READY");

