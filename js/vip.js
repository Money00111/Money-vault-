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

const vipGrid =
document.querySelector(".vip-grid");

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

    loadVipPlans();

    loadVipPackages();

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


        calculateVipTotals();

        renderOwnedVipPlans();

        updateVipButtons();

        checkVipExpiration();

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

function registerVipButtons(){

    document
    .querySelectorAll(".buyVipBtn")

    .forEach(button=>{

        button.onclick=()=>{

            buyVip(button);

        };

    });

}

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
            

        // UPDATE BALANCE ONLY

await update(
    ref(db, "users/" + currentUser.uid),
    {
        balance: newBalance
    }
);

// SAVE VIP PLAN

const vipRef = push(
    ref(db, "users/" + currentUser.uid + "/vipPlans")
);

await set(vipRef, {

    vipName: vipName,

    dailyIncome: daily,

    totalProfit: profit,

    totalDays: 30,

    remainingDays: 30,

    purchasedAt: Date.now(),

    lastClaim: 0,

    status: "active"

});

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

// ======================================
// AUTO REFRESH USER
// ======================================

setInterval(()=>{

    if(currentUser){

        loadUserData();

    }

},5000);


// ======================================
// READY
// ======================================

console.log("VIP PART 3 READY");

console.log("Daily Reward Active");

console.log("VIP Expiration Active");

// ======================================
// VIP.JS - PART 4A
// CHECK VIP EXPIRATION
// ======================================

async function checkVipExpiration(){

    if(!currentUser) return;

    const updates = {};

    let changed = false;

    Object.entries(vipPlans).forEach(([id,plan])=>{

        if(plan.status !== "active") return;

        const daysPassed = Math.floor(

            (Date.now() - Number(plan.purchasedAt))

            /(1000*60*60*24)

        );

        const remaining =

            Number(plan.totalDays) - daysPassed;

        updates[
            "vipPlans/" + id + "/remainingDays"
        ] = remaining;

        if(remaining <= 0){

            updates[
                "vipPlans/" + id + "/status"
            ] = "expired";

        }

        changed = true;

    });

    if(changed){

        await update(

            ref(db,"users/"+currentUser.uid),

            updates

        );

    }

}

   // ======================================
// VIP.JS - PART 4B
// CALCULATE ACTIVE VIP TOTALS
// ======================================

function calculateVipTotals() {

    let totalDailyIncome = 0;

    let totalProfitAmount = 0;

    let vipCount = 0;

    Object.values(vipPlans).forEach(plan => {

        if (plan.status !== "active") return;

        const daysPassed = Math.floor(

            (Date.now() - Number(plan.purchasedAt))

            / (1000 * 60 * 60 * 24)

        );

        const remainingDays =

            Number(plan.totalDays) - daysPassed;

        if (remainingDays <= 0) return;

        vipCount++;

        totalDailyIncome +=
            Number(plan.dailyIncome);

        totalProfitAmount +=

            Number(plan.dailyIncome) *

            remainingDays;

    });

    currentVip.textContent =
        vipCount + " Active VIP";

    dailyIncome.textContent =
        totalDailyIncome.toLocaleString() +
        " RWF";

    totalProfit.textContent =
        totalProfitAmount.toLocaleString() +
        " RWF";

} 

   // ======================================
// VIP.JS - PART 5
// SHOW ALL PURCHASED VIP PLANS
// ======================================

function renderOwnedVipPlans() {

    if (!ownedVipList) return;

    ownedVipList.innerHTML = "";

    const plans = Object.values(vipPlans);

    if (plans.length === 0) {

        ownedVipList.innerHTML = `

        <div class="emptyVip">

            No VIP Purchased

        </div>

        `;

        return;

    }

    plans.forEach(plan => {

        const daysPassed = Math.floor(

            (Date.now() - Number(plan.purchasedAt))

            / (1000 * 60 * 60 * 24)

        );

        const remainingDays =

            Math.max(
                0,
                Number(plan.totalDays) - daysPassed
            );

        const percent =

            Math.min(
                100,
                (daysPassed / Number(plan.totalDays)) * 100
            );

        const status =

            remainingDays <= 0

            ? "expired"

            : "active";

        ownedVipList.innerHTML += `

        <div class="owned-vip-card">

            <h3>${plan.vipName}</h3>

            <p>

                Daily Income :
                ${Number(plan.dailyIncome).toLocaleString()} RWF

            </p>

            <p>

                Remaining Days :
                ${remainingDays}

            </p>

            <div class="vip-progress">

                <div
                    class="vip-progress-bar"
                    style="width:${percent}%">

                </div>

            </div>

            <span class="vip-status ${status}">

                ${status.toUpperCase()}

            </span>

        </div>

        `;

    });

}

           // ======================================
// VIP.JS - PART 6
// DAILY INCOME + TRANSACTION
// ======================================

async function claimDailyIncome() {

    if (!currentUser) return;

    const userRef =
        ref(db, "users/" + currentUser.uid);

    const snap =
        await get(userRef);

    if (!snap.exists()) return;

    const user = snap.val();

    const plans =
        user.vipPlans || {};

    let totalIncome = 0;

    const updates = {};

    Object.entries(plans).forEach(([id, plan]) => {

        if (plan.status !== "active") return;

        const daysPassed = Math.floor(

            (Date.now() - Number(plan.purchasedAt))

            / (1000 * 60 * 60 * 24)

        );

        const remaining =

            Number(plan.totalDays) - daysPassed;

        if (remaining <= 0) {

            updates       
            
// ======================================
// VIP.JS - PART 7
// CLAIM DAILY INCOME (24 HOURS)
// ======================================

async function claimDailyReward() {

    if (!currentUser) return;

    const userRef =
        ref(db, "users/" + currentUser.uid);

    const snap =
        await get(userRef);

    if (!snap.exists()) return;

    const user = snap.val();

    const lastClaim =
        Number(user.lastClaim || 0);

    const now =
        Date.now();

    const oneDay =
        24 * 60 * 60 * 1000;

    // CHECK 24 HOURS

    if (lastClaim !== 0 && (now - lastClaim) < oneDay) {

        const hours = Math.floor(
            (oneDay - (now - lastClaim)) / 3600000
        );

        const minutes = Math.floor(
            ((oneDay - (now - lastClaim)) % 3600000) / 60000
        );

        alert(
            "Daily income already claimed.\n\nTry again after "
            + hours + "h "
            + minutes + "m."
        );

        return;

    }

    // GIVE REWARD

    await claimDailyIncome();

}
            
// ======================================
// VIP.JS - PART 8
// CLAIM COUNTDOWN TIMER
// ======================================

const claimTimer =
document.getElementById("claimTimer");

function startClaimTimer(){

    if(!currentUser) return;

    const userRef =
    ref(db,"users/" + currentUser.uid);

    onValue(userRef,(snapshot)=>{

        if(!snapshot.exists()) return;

        const user =
        snapshot.val();

        const lastClaim =
        Number(user.lastClaim || 0);

        const oneDay =
        24 * 60 * 60 * 1000;

        function updateTimer(){

            const now = Date.now();

            const diff =
            oneDay - (now - lastClaim);

            if(diff <= 0){

                claimTimer.textContent =
                "Ready Now";

                claimBtn.disabled = false;

                return;

            }

            const hours = Math.floor(diff/3600000);

            const minutes = Math.floor((diff%3600000)/60000);

            const seconds = Math.floor((diff%60000)/1000);

            claimTimer.textContent =

                String(hours).padStart(2,"0") + ":" +

                String(minutes).padStart(2,"0") + ":" +

                String(seconds).padStart(2,"0");

            claimBtn.disabled = true;

        }

        updateTimer();

        setInterval(updateTimer,1000);

    });

}

startClaimTimer();

        // ======================================
// VIP.JS - PART 8A
// LOAD USER VIP PLANS
// ======================================

const ownedVipList =
document.getElementById("ownedVipList");

function loadVipPlans() {

    if (!currentUser) return;

    const vipRef =
    ref(db, "users/" + currentUser.uid + "/vipPlans");

    onValue(vipRef, (snapshot) => {

        ownedVipList.innerHTML = "";
           let totalDaily = 0;
           let totalProfitAmount = 0;
           let activeVipCount = 0;

        if (!snapshot.exists()) {

            ownedVipList.innerHTML =
            "<p>No VIP purchased.</p>";

            dailyIncome.textContent = "0 RWF";

            return;

        }

        snapshot.forEach((child) => {

            const vip = child.val();

            if (vip.status === "active") {

    totalDaily += Number(vip.dailyIncome || 0);

    totalProfitAmount += Number(vip.totalProfit || 0);

    activeVipCount++;

            }

            const card =
            document.createElement("div");

            card.className = "owned-vip-card";

            card.innerHTML = `

                <h4>${vip.vipName}</h4>

                <p>Daily Income:
                ${Number(vip.dailyIncome).toLocaleString()} RWF</p>

                <p>Remaining Days:
                ${vip.remainingDays}</p>

                <p>Status:
                ${vip.status}</p>

            `;

            ownedVipList.appendChild(card);

        });

        
dailyIncome.textContent =
totalDaily.toLocaleString() + " RWF";

totalProfit.textContent =
totalProfitAmount.toLocaleString() + " RWF";

currentVip.textContent =
activeVipCount + " Active VIP Plan(s)";
    });

}

          // ======================================
// PART 10
// CLAIM DAILY INCOME
// ======================================

const claimBtn =
document.getElementById("claimIncomeBtn");

claimBtn?.addEventListener("click", claimDailyIncome);

async function claimDailyIncome(){

    if(!currentUser) return;

    const userRef =
    ref(db,"users/" + currentUser.uid);

    const userSnap =
    await get(userRef);

    if(!userSnap.exists()) return;

    const user =
    userSnap.val();

    const vipPlans =
    user.vipPlans || {};

    let totalIncome = 0;

    for(const key in vipPlans){

        const vip = vipPlans[key];

        if(vip.status !== "active")
        continue;

        totalIncome +=
        Number(vip.dailyIncome || 0);

        let remaining =
        Number(vip.remainingDays || 0);

        remaining--;

        if(remaining <= 0){

            await update(

                ref(db,
                "users/" +
                currentUser.uid +
                "/vipPlans/" + key),

                {

                    remainingDays:0,

                    status:"expired"

                }

            );

        }

        else{

            await update(

                ref(db,
                "users/" +
                currentUser.uid +
                "/vipPlans/" + key),

                {

                    remainingDays:remaining

                }

            );

        }

    }

    if(totalIncome <= 0){

        alert("No Active VIP Plans.");

        return;

    }

    const newBalance =
    Number(user.balance || 0)
    + totalIncome;

    await update(userRef,{

        balance:newBalance,

        lastClaim:Date.now()

    });

    const tx =
    push(ref(db,"transactions"));

    await set(tx,{

        uid:currentUser.uid,

        type:"Daily Income",

        amount:totalIncome,

        createdAt:Date.now(),

        status:"Completed"

    });

    alert(

        "Daily Income Claimed\n\n+" +

        totalIncome.toLocaleString()

        + " RWF"

    );

}

// ======================================
// PART 11
// 24 HOUR CLAIM LOCK
// ======================================

const claimBtn =
document.getElementById("claimIncomeBtn");

const claimTimer =
document.getElementById("claimTimer");

// ======================================
// PART 11
// 24 HOUR CLAIM LOCK
// ======================================

const claimBtn =
document.getElementById("claimIncomeBtn");

const claimTimer =
document.getElementById("claimTimer");

setInterval(updateClaimTimer,1000);

async function updateClaimTimer(){

    if(!currentUser) return;

    const snap =
    await get(
        ref(db,"users/" + currentUser.uid)
    );

    if(!snap.exists()) return;

    const user = snap.val();

    const lastClaim =
    Number(user.lastClaim || 0);

    const oneDay =
    24 * 60 * 60 * 1000;

    const now =
    Date.now();

    const remaining =
    oneDay - (now - lastClaim);

    if(lastClaim === 0 || remaining <= 0){

        claimBtn.disabled = false;

        claimBtn.innerHTML =
        "Claim Daily Income";

        claimTimer.textContent =
        "Ready to Claim";

        return;

    }

    claimBtn.disabled = true;

    const hours =
    Math.floor(remaining / 3600000);

    const minutes =
    Math.floor((remaining % 3600000)/60000);

    const seconds =
    Math.floor((remaining % 60000)/1000);

    claimTimer.textContent =

    hours + "h " +

    minutes + "m " +

    seconds + "s";

}

async function updateClaimTimer(){

    if(!currentUser) return;

    const snap =
    await get(
        ref(db,"users/" + currentUser.uid)
    );

    if(!snap.exists()) return;

    const user = snap.val();

    const lastClaim =
    Number(user.lastClaim || 0);

    const oneDay =
    24 * 60 * 60 * 1000;

    const now =
    Date.now();

    const remaining =
    oneDay - (now - lastClaim);

    if(lastClaim === 0 || remaining <= 0){

        claimBtn.disabled = false;

        claimBtn.innerHTML =
        "Claim Daily Income";

        claimTimer.textContent =
        "Ready to Claim";

        return;

    }

    claimBtn.disabled = true;

    const hours =
    Math.floor(remaining / 3600000);

    const minutes =
    Math.floor((remaining % 3600000)/60000);

    const seconds =
    Math.floor((remaining % 60000)/1000);

    claimTimer.textContent =

    hours + "h " +

    minutes + "m " +

    seconds + "s";

}

           function loadVipPackages(){

    const plansRef =
    ref(db,"vipPlans");

    onValue(plansRef,(snapshot)=>{

        if(!snapshot.exists()) return;

        vipGrid.innerHTML="";

        snapshot.forEach((child)=>{

            const vip=child.val();

            if(vip.status!==true) return;

            vipGrid.innerHTML += `

            <div class="vip-card">

                <div class="vip-badge">

                    ${vip.name}

                </div>

                <h2>

                    ${Number(vip.price).toLocaleString()} RWF

                </h2>

                <p>

                    Daily Income:
                    ${Number(vip.dailyIncome).toLocaleString()} RWF

                </p>

                <p>

                    Duration:
                    ${vip.duration} Days

                </p>

                <p>

                    Total Profit:
                    ${Number(vip.totalProfit).toLocaleString()} RWF

                </p>

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
            
