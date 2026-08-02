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

const vipGrid = document.getElementById("vipGrid");


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

    loadUserVipPlans();

});



// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    const userRef = ref(db, "users/" + currentUser.uid);

    onValue(userRef, (snapshot) => {
    if(loadingScreen){

loadingScreen.style.display="none";

    }

    if (!snapshot.exists()) {

        console.log("User data not found");

        return;

    }

    userData = snapshot.val();

    vipPlans = userData.vipPlans || {};

    balance.textContent =
    Number(userData.balance || 0).toLocaleString() + " RWF";

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

        if (!vipGrid) {
            console.log("vipGrid not found");
            return;
        }

        vipGrid.innerHTML = "";

        if (!snapshot.exists()) {

            vipGrid.innerHTML = `
                <div class="emptyVip">
                    No VIP Plans Available
                </div>
            `;

            return;

            
        }
        console.log("SNAPSHOT:", snapshot.val());

        snapshot.forEach((child) => {

            const vip = child.val()

console.log("KEY:", child.key);
console.log("DATA:", child.val());
console.log(vip.price);
console.log(vip.dailyIncome);
console.log(vip.duration);
console.log(vip.totalProfit);

            const name = vip.name || "VIP Plan";
            const price = Number(vip.price ?? 0);
            const dailyIncome = Number(vip.dailyIncome ?? 0);
            const duration = Number(vip.duration ?? 0);

            const totalProfit =
                vip.totalProfit != null
                ? Number(vip.totalProfit)
                : dailyIncome * duration;

            const card = document.createElement("div");

            card.className = "vip-card";

            card.innerHTML = `
                <div class="vip-badge">
                    ${name}
                </div>

                <i class="fas fa-gem vip-icon"></i>

                <h2>${name}</h2>

                <h1>${price.toLocaleString()} RWF</h1>

                <p>
                    Daily Income:
                    <b>${dailyIncome.toLocaleString()} RWF</b>
                </p>

                <p>
                    Duration:
                    <b>${duration} Days</b>
                </p>

                <p>
                    Total Profit:
                    <b>${totalProfit.toLocaleString()} RWF</b>
                </p>

                <button
                    class="buyVipBtn"
                    data-vip="${name}"
                    data-price="${price}"
                    data-daily="${dailyIncome}"
                    data-profit="${totalProfit}"
                    data-days="${duration}">

                    <i class="fas fa-cart-shopping"></i>
                    Buy Now

                </button>
            `;

            vipGrid.appendChild(card);

        });

        registerVipButtons();
        updateVipButtons();

    }, (error) => {

        console.error("VIP LOAD ERROR:", error);

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
// BUY VIP PLAN REQUEST
// ======================================

async function buyVip(button) {

    if (!currentUser) return;


    const vipName =
        button.dataset.vip;

    const price =
        Number(button.dataset.price);

    const daily =
        Number(button.dataset.daily);

    const profit =
        Number(button.dataset.profit);

    const days =
        Number(button.dataset.days);



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



        const user =
            snap.val();



        const balanceNow =
            Number(user.balance || 0);



        if (balanceNow < price) {

            alert("Insufficient Balance.");

            return;

        }



        // ======================================
        // CREATE VIP PURCHASE REQUEST
        // ======================================


        const requestRef =
            push(ref(db, "vipPurchaseRequests"));



        await set(requestRef, {


            uid: currentUser.uid,


            email: user.email || currentUser.email,


            vipName: vipName,


            price: price,


            dailyIncome: daily,


            totalProfit: profit,


            totalDays: days,


            status: "pending",


            createdAt: Date.now()


        });



        alert(
            "VIP purchase request sent successfully. Wait for admin approval."
        );



    }

    catch(error) {


        console.error(error);


        alert(error.message);


    }


}


console.log("VIP PART 4 REQUEST SYSTEM READY");

            
// ======================================
// VIP.JS - PART 5
// LOAD USER VIP PLANS
// ======================================

function loadUserVipPlans(){

    if(!currentUser) return;


    const vipRef = ref(
        db,
        "users/" + currentUser.uid + "/vipPlans"
    );


    onValue(vipRef, (snapshot)=>{


        ownedVipList.innerHTML = "";


        let activeCount = 0;

        let totalDaily = 0;

        let totalProfitAmount = 0;



        if(!snapshot.exists()){


            ownedVipList.innerHTML = `

            <div class="emptyVip">

                No VIP Purchased

            </div>

            `;


            currentVip.textContent =
            "VIP 0";


            dailyIncome.textContent =
            "0 RWF";


            totalProfit.textContent =
            "0 RWF";


            return;

        }



        snapshot.forEach((child)=>{


            const vip = child.val();



            if(vip.status === "active"){


                activeCount++;


                totalDaily +=
                Number(vip.dailyIncome || 0);


                totalProfitAmount +=
                Number(vip.totalProfit || 0);


            }



            ownedVipList.innerHTML += `


            <div class="owned-vip-card">


                <h3>

                    ${vip.vipName}

                </h3>


                <p>

                Daily Income:

                <b>
                ${Number(vip.dailyIncome || 0)
                .toLocaleString()} RWF
                </b>

                </p>


                <p>

                Remaining Days:

                <b>
                ${vip.remainingDays || 0}
                </b>


                </p>



                <p>

                Status:

                <span class="vip-status">

                ${vip.status}

                </span>

                </p>


            </div>


            `;


        });



        currentVip.textContent =
        activeCount + " Active VIP";


        dailyIncome.textContent =
        totalDaily.toLocaleString() + " RWF";


        totalProfit.textContent =
        totalProfitAmount.toLocaleString() + " RWF";


        updateVipButtons();

    });


}


console.log("VIP PART 5 READY");

// ======================================
// VIP.JS - PART 9
// UPDATE VIP BUTTONS
// ======================================

function updateVipButtons() {

    const buyButtons =
        document.querySelectorAll(".buyVipBtn");

    buyButtons.forEach((button) => {

        const vipName =
            button.dataset.vip;

        const purchased =
    Object.values(vipPlans).find(plan =>

        (plan.vipName || plan.name) === vipName &&
        plan.status === "active"

    );

        if (purchased) {

            button.innerHTML = `
                <i class="fas fa-check-circle"></i>
                Purchased
            `;

            button.disabled = true;

            button.classList.add("purchased");

        } else {

            button.innerHTML = `
                <i class="fas fa-cart-shopping"></i>
                Buy Now
            `;

            button.disabled = false;

            button.classList.remove("purchased");

        }

    });

}

console.log("VIP PART 9 READY");

// ======================================
// VIP.JS - PART 7
// CLAIM DAILY INCOME
// ======================================

async function claimDailyIncome() {

    console.log("Claim button clicked");

    if (!currentUser) return;

    
const claimIncomeBtn =
document.getElementById("claimIncomeBtn");

const claimTimer =
document.getElementById("claimTimer");

claimIncomeBtn?.addEventListener("click", claimDailyIncome);

async function claimDailyIncome() {

    if (!currentUser) return;

    try {

        const userRef =
        ref(db, "users/" + currentUser.uid);

        const userSnap =
        await get(userRef);

        if (!userSnap.exists()) {

            alert("User not found");
            return;

        }

        const user =
        userSnap.val();

        const vipPlans =
        user.vipPlans || {};

        let totalIncome = 0;
        let updated = false;

        const now = Date.now();

        for (const key in vipPlans) {

            const vip = vipPlans[key];

            if (vip.status !== "active")
                continue;

            const lastClaim =
            Number(vip.lastClaim || 0);

            if (now - lastClaim < 86400000)
                continue;

            totalIncome +=
            Number(vip.dailyIncome || 0);

            vipPlans[key].lastClaim =
            now;

            updated = true;

        }

        if (!updated) {

            alert("Daily income is not available yet.");

            return;

        }

        await update(userRef, {

            balance:
            Number(user.balance || 0) + totalIncome,

            vipPlans:
            vipPlans

        });

        const txRef =
        push(ref(db, "transactions"));

        await set(txRef, {

            uid: currentUser.uid,

            email: currentUser.email,

            type: "dailyIncome",

            amount: totalIncome,

            status: "completed",

            createdAt: now

        });

        alert(
            totalIncome.toLocaleString() +
            " RWF claimed successfully."
        );

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// VIP.JS - PART 8
// VIP EXPIRATION SYSTEM
// ======================================

checkVipExpiration();

setInterval(checkVipExpiration, 60000);

async function checkVipExpiration() {

    if (!currentUser) return;

    try {

        const vipRef =
        ref(db,
        "users/" +
        currentUser.uid +
        "/vipPlans");

        const snap =
        await get(vipRef);

        if (!snap.exists())
            return;

        const vipPlans =
        snap.val();

        const now =
        Date.now();

        let changed =
        false;

        for (const key in vipPlans) {

            const vip =
            vipPlans[key];

            if (vip.status !== "active")
                continue;

            const totalDays =
            Number(vip.totalDays || 0);

            const purchasedAt =
            Number(vip.purchasedAt || 0);

            const daysPassed =
            Math.floor(
                (now - purchasedAt) /
                86400000
            );

            const remaining =
            totalDays - daysPassed;

            vip.remainingDays =
            remaining > 0
            ? remaining
            : 0;

            if (remaining <= 0) {

                vip.status =
                "expired";

            }

            changed = true;

        }

        if (changed) {

            await update(vipRef, vipPlans);

        }

    }

    catch (error) {

        console.error(error);

    }

}



        // ======================================
// VIP.JS - PART 10
// CLAIM COUNTDOWN TIMER
// ======================================

startClaimTimer();

setInterval(startClaimTimer, 1000);


async function startClaimTimer() {

    if (!currentUser) return;


    try {


        const vipRef =
        ref(
            db,
            "users/" +
            currentUser.uid +
            "/vipPlans"
        );


        const snap =
        await get(vipRef);



        if (!snap.exists()) {


            if (claimTimer) {

                claimTimer.textContent =
                "No Active VIP";

            }


            if (claimIncomeBtn) {

                claimIncomeBtn.disabled = true;

            }


            return;

        }



        const vipPlans =
        snap.val();



        const now =
        Date.now();



        let nextClaim = 0;

        let hasActiveVip = false;



        for (const key in vipPlans) {


            const vip =
            vipPlans[key];



            if (vip.status !== "active") {

                continue;

            }



            hasActiveVip = true;



            const claimTime =

            Number(vip.lastClaim || 0)
            +
            86400000;



            if (

                nextClaim === 0 ||

                claimTime < nextClaim

            ) {

                nextClaim = claimTime;

            }


        }



        if (!hasActiveVip) {


            if (claimTimer) {

                claimTimer.textContent =
                "No Active VIP";

            }


            if (claimIncomeBtn) {

                claimIncomeBtn.disabled = true;

            }


            return;

        }




        if (now >= nextClaim) {


            if (claimTimer) {

                claimTimer.textContent =
                "Ready To Claim";

            }


            if (claimIncomeBtn) {

                claimIncomeBtn.disabled = false;

            }


            return;

        }




        const diff =
        nextClaim - now;



        const hours =
        Math.floor(
            diff / 3600000
        );



        const minutes =
        Math.floor(
            (diff % 3600000) / 60000
        );



        const seconds =
        Math.floor(
            (diff % 60000) / 1000
        );



        if (claimTimer) {


            claimTimer.textContent =

            hours.toString().padStart(2,"0")
            + ":" +

            minutes.toString().padStart(2,"0")
            + ":" +

            seconds.toString().padStart(2,"0");


        }



        if (claimIncomeBtn) {

            claimIncomeBtn.disabled = true;

        }



    }


    catch(error) {


        console.error(
            "Claim Timer Error:",
            error
        );


    }


}



            

    


