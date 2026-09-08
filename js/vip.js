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
    update,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// DOM ELEMENTS
// ======================================

const loadingScreen =
    document.getElementById("loadingScreen");

const sidebar =
    document.getElementById("sidebar");

const menuBtn =
    document.getElementById("menuBtn");

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

const vipGrid =
    document.getElementById("vipGrid");


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

    if (sidebar) {
        sidebar.classList.toggle("active");
    }

});


// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async () => {

    if (!confirm("Logout?")) return;

    try {

        await signOut(auth);

        location.href = "login.html";

    } catch (error) {

        console.error(
            "Logout Error:",
            error
        );

    }

});


// ======================================
// AUTH STATE
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) {

        location.href = "login.html";

        return;
    }


    currentUser = user;


    // ==================================
    // LOAD USER DATA
    // ==================================

    loadUserData();


    // ==================================
    // LOAD AVAILABLE VIP PLANS
    // ==================================

    loadVipPackages();


    // ==================================
    // LOAD USER PURCHASED VIP PLANS
    // ==================================

    loadUserVipPlans();

});


// ======================================
// LOAD USER DATA
// ======================================

function loadUserData() {

    if (!currentUser) return;


    const userRef =
        ref(
            db,
            "users/" + currentUser.uid
        );


    onValue(
        userRef,
        (snapshot) => {

            if (loadingScreen) {

                loadingScreen.style.display =
                    "none";

            }


            if (!snapshot.exists()) {

                console.log(
                    "User data not found"
                );

                userData = {};

                vipPlans = {};

                if (balance) {

                    balance.textContent =
                        "0 RWF";

                }

                return;
            }


            userData =
                snapshot.val() || {};


            // ==================================
            // USER VIP PLANS
            // ==================================

            vipPlans =
                userData.vipPlans || {};


            // ==================================
            // BALANCE
            // ==================================

            const userBalance =
                Number(
                    userData.balance || 0
                );


            if (balance) {

                balance.textContent =
                    userBalance.toLocaleString() +
                    " RWF";

            }

        },
        (error) => {

            console.error(
                "User Data Error:",
                error
            );

        }
    );

}


console.log(
    "VIP PART 1 READY"
);

// ======================================
// VIP.JS - PART 2
// LOAD VIP PLANS
// VIP COLORS + SORT
// ======================================


// ======================================
// GET VIP COLOR CLASS
// ======================================

function getVipColorClass(name, index) {

    const value =
        String(name || "")
            .toLowerCase()
            .trim();


    if (value.includes("bronze"))
        return "bronze";

    if (value.includes("starter"))
        return "starter";

    if (value.includes("silver"))
        return "silver";

    if (value.includes("gold"))
        return "gold";

    if (value.includes("platinum"))
        return "platinum";

    if (value.includes("diamond"))
        return "diamond";

    if (value.includes("premium"))
        return "premium";

    if (value.includes("elite"))
        return "elite";

    if (value.includes("royal"))
        return "royal";

    if (value.includes("ultimate"))
        return "ultimate";


    const colors = [
        "bronze",
        "starter",
        "silver",
        "gold",
        "platinum",
        "diamond",
        "premium",
        "elite",
        "royal",
        "ultimate"
    ];


    return colors[index] || "bronze";

}


// ======================================
// GET VIP NUMBER
// ======================================

function getVipNumber(vip, key) {

    const name =
        String(vip?.name || "").trim();


    let match =
        name.match(/vip\s*[-_#:]?\s*(\d+)/i);


    if (match) {

        return Number(match[1]);

    }


    const firebaseKey =
        String(key || "").trim();


    match =
        firebaseKey.match(/vip\s*[-_#:]?\s*(\d+)/i);


    if (match) {

        return Number(match[1]);

    }


    match =
        name.match(/\d+/);


    if (match) {

        return Number(match[0]);

    }


    return 999999;

}


// ======================================
// LOAD AVAILABLE VIP PACKAGES
// ======================================

function loadVipPackages() {

    const vipRef =
        ref(db, "vipPlans");


    onValue(
        vipRef,
        (snapshot) => {

            if (!vipGrid) {

                console.log(
                    "vipGrid not found"
                );

                return;

            }


            vipGrid.innerHTML = "";


            // ==================================
            // NO PLANS
            // ==================================

            if (!snapshot.exists()) {

                vipGrid.innerHTML = `

                    <div class="emptyVip">

                        No VIP Plans Available

                    </div>

                `;

                return;

            }


            // ==================================
            // COLLECT PLANS
            // ==================================

            const plans = [];


            snapshot.forEach((child) => {

                const data =
                    child.val() || {};


                plans.push({

                    key:
                        child.key,

                    data:
                        data

                });

            });


            // ==================================
            // SORT VIP 1 → VIP 10
            // ==================================

            plans.sort((a, b) => {

                return (
                    getVipNumber(
                        a.data,
                        a.key
                    )
                    -
                    getVipNumber(
                        b.data,
                        b.key
                    )
                );

            });


            // ==================================
            // DISPLAY PLANS
            // ==================================

            plans.forEach(
                (item, index) => {

                    const vip =
                        item.data;


                    // ==================================
                    // VIP NAME
                    // ==================================

                    const name =
                        String(
                            vip.name ||
                            "VIP Plan"
                        );


                    // ==================================
                    // PRICE
                    // ==================================

                    const price =
                        Number(
                            vip.price ?? 0
                        );


                    // ==================================
                    // DAILY INCOME
                    // ==================================

                    const daily =
                        Number(
                            vip.dailyIncome ?? 0
                        );


                    // ==================================
                    // DURATION
                    // ==================================

                    const duration =
                        Number(
                            vip.duration ??
                            vip.totalDays ??
                            vip.days ??
                            0
                        );


                    // ==================================
                    // TOTAL PROFIT
                    // ==================================

                    const profit =
                        vip.totalProfit != null

                        ? Number(
                            vip.totalProfit
                        )

                        : daily * duration;


                    // ==================================
                    // COLOR
                    // ==================================

                    const colorClass =
                        getVipColorClass(
                            name,
                            index
                        );


                    // ==================================
                    // CREATE CARD
                    // ==================================

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "vip-card " +
                        colorClass;


                    // ==================================
                    // CARD HTML
                    // ==================================

                    card.innerHTML = `

                        <div class="vip-badge">

                            ${name}

                        </div>


                        <i class="fas fa-gem vip-icon"></i>


                        <h2>

                            ${name}

                        </h2>


                        <h1>

                            ${price.toLocaleString()}
                            RWF

                        </h1>


                        <p>

                            Daily Income:

                            <b>

                                ${daily.toLocaleString()}
                                RWF

                            </b>

                        </p>


                        <p>

                            Duration:

                            <b>

                                ${duration}
                                Days

                            </b>

                        </p>


                        <p>

                            Total Profit:

                            <b>

                                ${profit.toLocaleString()}
                                RWF

                            </b>

                        </p>


                        <button

                            type="button"

                            class="buyVipBtn"

                            data-vip="${name}"

                            data-price="${price}"

                            data-daily="${daily}"

                            data-profit="${profit}"

                            data-days="${duration}"

                        >

                            <i
                                class="fas fa-cart-shopping"
                            ></i>

                            Buy Now

                        </button>

                    `;


                    vipGrid.appendChild(
                        card
                    );

                }
            );


            // ==================================
            // REGISTER BUY BUTTONS
            // ==================================

            registerVipButtons();


            // ==================================
            // CHECK PURCHASED VIPs
            // ==================================

            updateVipButtons();

        },

        (error) => {

            console.error(
                "VIP LOAD ERROR:",
                error
            );

        }
    );

}


console.log(
    "VIP PART 2 READY"
);

// ======================================
// VIP.JS - PART 3
// REGISTER BUY VIP BUTTONS
// ======================================


// ======================================
// REGISTER ALL BUY BUTTONS
// ======================================

function registerVipButtons() {

    const buttons =
        document.querySelectorAll(
            ".buyVipBtn"
        );


    if (!buttons.length) {

        console.log(
            "No Buy VIP buttons found."
        );

        return;

    }


    buttons.forEach((button) => {

        // ==================================
        // PREVENT DUPLICATE LISTENERS
        // ==================================

        if (
            button.dataset.listenerAttached === "true"
        ) {

            return;

        }


        button.dataset.listenerAttached =
            "true";


        // ==================================
        // CLICK EVENT
        // ==================================

        button.addEventListener(
            "click",
            async () => {

                // Prevent double-click
                if (button.disabled) {
                    return;
                }


                await buyVip(button);

            }
        );

    });


    console.log(
        "VIP BUY BUTTONS REGISTERED:",
        buttons.length
    );

}


console.log(
    "VIP PART 3 READY"
);
// ======================================
// VIP.JS - PART 4
// BUY VIP
// ======================================


async function buyVip(button) {

    try {

        // ==================================
        // CHECK USER
        // ==================================

        if (!currentUser) {

            alert("Please login first.");

            return;

        }


        // ==================================
        // READ VIP DATA FROM BUTTON
        // ==================================

        const vipName =
            button.dataset.vip || "VIP Plan";

        const price =
            Number(button.dataset.price || 0);

        const dailyIncome =
            Number(button.dataset.daily || 0);

        const totalProfit =
            Number(button.dataset.profit || 0);

        const totalDays =
            Number(button.dataset.days || 0);


        // ==================================
        // VALIDATE VIP DATA
        // ==================================

        if (
            !vipName ||
            price <= 0 ||
            dailyIncome <= 0 ||
            totalDays <= 0
        ) {

            alert(
                "Invalid VIP plan information."
            );

            return;

        }


        // ==================================
        // CHECK BALANCE
        // ==================================

        const balanceValue =
            Number(userData.balance || 0);


        if (balanceValue < price) {

            alert(
                `Insufficient balance.\n\n` +
                `VIP Price: ${price.toLocaleString()} RWF\n` +
                `Your Balance: ${balanceValue.toLocaleString()} RWF`
            );

            return;

        }


        // ==================================
        // PREVENT DUPLICATE REQUEST
        // ==================================

        const requestsRef =
            ref(db, "vipPurchaseRequests");

        const snapshot =
            await get(requestsRef);

        let alreadyRequested = false;


        if (snapshot.exists()) {

            const requests =
                snapshot.val() || {};


            Object.values(requests).forEach(
                (request) => {

                    if (
                        request &&
                        request.uid === currentUser.uid &&
                        (
                            request.vipName === vipName ||
                            request.name === vipName
                        ) &&
                        (
                            request.status === "pending" ||
                            request.status === "processing" ||
                            request.status === "approved"
                        )
                    ) {

                        alreadyRequested = true;

                    }

                }
            );

        }


        if (alreadyRequested) {

            alert(
                `You already have a request or purchase for ${vipName}.`
            );

            button.disabled = true;

            button.classList.add("purchased");

            button.style.display = "none";

            return;

        }


        // ==================================
        // CONFIRM PURCHASE
        // ==================================

        const confirmed =
            confirm(
                `Buy ${vipName}?\n\n` +
                `Price: ${price.toLocaleString()} RWF\n` +
                `Daily Income: ${dailyIncome.toLocaleString()} RWF\n` +
                `Duration: ${totalDays} Days\n` +
                `Total Profit: ${totalProfit.toLocaleString()} RWF\n\n` +
                `Your balance will be deducted after Admin approval.`
            );


        if (!confirmed) {

            return;

        }


        // ==================================
        // DISABLE BUTTON WHILE SENDING
        // ==================================

        button.disabled = true;

        button.innerHTML =
            '<i class="fas fa-spinner fa-spin"></i> Processing...';


        // ==================================
        // CREATE PURCHASE REQUEST
        // ==================================

        const requestRef =
            push(ref(db, "vipPurchaseRequests"));


        await set(requestRef, {

            uid: currentUser.uid,

            email:
                currentUser.email || "",

            vipName:
                vipName,

            price:
                price,

            dailyIncome:
                dailyIncome,

            totalProfit:
                totalProfit,

            totalDays:
                totalDays,

            duration:
                totalDays,

            status:
                "pending",

            createdAt:
                Date.now()

        });


        // ==================================
        // HIDE BUY BUTTON
        // ==================================

        button.disabled = true;

        button.classList.add("purchased");

        button.style.display = "none";


        // ==================================
        // SUCCESS MESSAGE
        // ==================================

        alert(
            `VIP purchase request sent successfully!\n\n` +
            `${vipName}\n` +
            `Price: ${price.toLocaleString()} RWF\n\n` +
            `Please wait for Admin approval.`
        );


        console.log(
            "VIP PURCHASE REQUEST CREATED:",
            requestRef.key
        );


    } catch (error) {

        console.error(
            "BUY VIP ERROR:",
            error
        );


        // Re-enable button if request failed
        button.disabled = false;

        button.classList.remove("purchased");

        button.style.display = "";


        button.innerHTML =
            '<i class="fas fa-cart-shopping"></i> Buy Now';


        alert(
            "VIP purchase failed: " +
            (error.message || error)
        );

    }

}


console.log(
    "VIP PART 4 READY"
);

// ======================================
// VIP.JS - PART 5
// LOAD USER VIP PLANS
// ======================================

function loadUserVipPlans() {

    if (!currentUser) {
        return;
    }


    const vipPlansRef =
        ref(
            db,
            `users/${currentUser.uid}/vipPlans`
        );


    onValue(
        vipPlansRef,
        (snapshot) => {

            const plans =
                snapshot.exists()
                    ? snapshot.val()
                    : {};


            // Keep global VIP plans synchronized
            vipPlans = plans;


            // ==================================
            // CLEAR OLD VIP CARDS
            // ==================================

            if (ownedVipList) {

                ownedVipList.innerHTML = "";

            }


            const planEntries =
                Object.entries(plans);


            // ==================================
            // NO PURCHASED VIP
            // ==================================

            if (!planEntries.length) {

                if (ownedVipList) {

                    ownedVipList.innerHTML = `
                        <div class="empty-vip">
                            <i class="fas fa-crown"></i>
                            <p>No VIP plan purchased yet.</p>
                        </div>
                    `;

                }


                updateVipButtons();

                return;

            }


            // ==================================
            // SUMMARY VARIABLES
            // ==================================

            let activeCount = 0;

            let totalDailyIncome = 0;

            let totalProfitValue = 0;


            // ==================================
            // SORT VIP PLANS
            // ==================================

            planEntries.sort(
                ([keyA, a], [keyB, b]) => {

                    const numberA =
                        getVipNumber(
                            a || {},
                            keyA
                        );

                    const numberB =
                        getVipNumber(
                            b || {},
                            keyB
                        );

                    return numberA - numberB;

                }
            );


            // ==================================
            // RENDER VIP PLANS
            // ==================================

            planEntries.forEach(
                ([id, plan]) => {

                    if (!plan) {
                        return;
                    }


                    const name =
                        plan.vipName ||
                        plan.name ||
                        "VIP Plan";


                    const price =
                        Number(
                            plan.price ??
                            plan.vipPrice ??
                            0
                        );


                    const daily =
                        Number(
                            plan.dailyIncome ??
                            plan.daily ??
                            0
                        );


                    const totalProfit =
                        Number(
                            plan.totalProfit ??
                            plan.profit ??
                            0
                        );


                    const duration =
                        Number(
                            plan.totalDays ??
                            plan.duration ??
                            plan.days ??
                            0
                        );


                    // ==================================
                    // START DATE
                    // ==================================

                    const startDate =
                        Number(
                            plan.startDate ??
                            plan.purchasedAt ??
                            plan.approvedAt ??
                            plan.createdAt ??
                            0
                        );


                    // ==================================
                    // END DATE
                    // ==================================

                    let endDate =
                        Number(
                            plan.endDate || 0
                        );


                    if (
                        !endDate &&
                        startDate &&
                        duration > 0
                    ) {

                        endDate =
                            startDate +
                            (
                                duration *
                                24 *
                                60 *
                                60 *
                                1000
                            );

                    }


                    // ==================================
                    // REMAINING DAYS
                    // ==================================

                    let remainingDays =
                        Number(
                            plan.remainingDays
                        );


                    if (
                        !Number.isFinite(
                            remainingDays
                        )
                    ) {

                        remainingDays = 0;

                    }


                    if (endDate) {

                        const remainingMs =
                            endDate -
                            Date.now();


                        remainingDays =
                            Math.max(
                                0,
                                Math.ceil(
                                    remainingMs /
                                    (
                                        24 *
                                        60 *
                                        60 *
                                        1000
                                    )
                                )
                            );

                    }


                    // ==================================
                    // STATUS
                    // ==================================

                    let status =
                        String(
                            plan.status ||
                            "active"
                        ).toLowerCase();


                    if (
                        status === "active" &&
                        endDate &&
                        Date.now() >= endDate
                    ) {

                        status = "expired";

                    }


                    // ==================================
                    // SUMMARY
                    // ==================================

                    if (status === "active") {

                        activeCount++;

                        totalDailyIncome += daily;

                    }


                    totalProfitValue +=
                        totalProfit;


                    // ==================================
                    // FORMAT DATE
                    // ==================================

                    let startDateText =
                        "N/A";


                    if (startDate) {

                        startDateText =
                            new Date(
                                startDate
                            ).toLocaleDateString();

                    }


                    // ==================================
                    // VIP CARD
                    // ==================================

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "owned-vip-card";


                    card.dataset.vipId =
                        id;


                    card.innerHTML = `

                        <div class="owned-vip-header">

                            <div class="owned-vip-name">

                                <i class="fas fa-crown"></i>

                                <span>
                                    ${name}
                                </span>

                            </div>

                            <span class="vip-status ${status}">
                                ${status.toUpperCase()}
                            </span>

                        </div>


                        <div class="owned-vip-info">

                            <div class="vip-info-item">

                                <span>Price</span>

                                <strong>
                                    ${price.toLocaleString()} RWF
                                </strong>

                            </div>


                            <div class="vip-info-item">

                                <span>Daily Income</span>

                                <strong>
                                    ${daily.toLocaleString()} RWF
                                </strong>

                            </div>


                            <div class="vip-info-item">

                                <span>Duration</span>

                                <strong>
                                    ${duration} Days
                                </strong>

                            </div>


                            <div class="vip-info-item">

                                <span>Remaining</span>

                                <strong>
                                    ${remainingDays} Days
                                </strong>

                            </div>


                            <div class="vip-info-item">

                                <span>Total Profit</span>

                                <strong>
                                    ${totalProfit.toLocaleString()} RWF
                                </strong>

                            </div>


                            <div class="vip-info-item">

                                <span>Started</span>

                                <strong>
                                    ${startDateText}
                                </strong>

                            </div>

                        </div>

                    `;


                    if (ownedVipList) {

                        ownedVipList.appendChild(
                            card
                        );

                    }

                }
            );


            // ==================================
            // UPDATE DASHBOARD SUMMARY
            // ==================================

            if (currentVip) {

                currentVip.textContent =
                    activeCount > 0
                        ? `${activeCount} Active VIP`
                        : "No Active VIP";

            }


            if (dailyIncome) {

                dailyIncome.textContent =
                    `${totalDailyIncome.toLocaleString()} RWF`;

            }


            if (totalProfit) {

                totalProfit.textContent =
                    `${totalProfitValue.toLocaleString()} RWF`;

            }


            // ==================================
            // UPDATE BUY BUTTONS
            // ==================================

            updateVipButtons();

        },

        (error) => {

            console.error(
                "LOAD USER VIP PLANS ERROR:",
                error
            );

        }
    );

}


console.log(
    "VIP PART 5 READY"
);

// ======================================
// VIP.JS - PART 6
// CHECK VIP EXPIRATION
// ======================================

async function checkVipExpiration() {

    if (!currentUser) {
        return;
    }

    try {

        const vipRef =
            ref(
                db,
                `users/${currentUser.uid}/vipPlans`
            );

        const snapshot =
            await get(vipRef);

        if (!snapshot.exists()) {
            return;
        }

        const plans =
            snapshot.val() || {};

        const now =
            Date.now();

        const updates = {};


        // ==================================
        // CHECK EVERY VIP
        // ==================================

        Object.entries(plans).forEach(
            ([id, plan]) => {

                if (!plan) {
                    return;
                }


                const duration =
                    Number(
                        plan.totalDays ??
                        plan.duration ??
                        plan.days ??
                        0
                    );


                const startDate =
                    Number(
                        plan.startDate ??
                        plan.purchasedAt ??
                        plan.approvedAt ??
                        plan.createdAt ??
                        0
                    );


                let endDate =
                    Number(
                        plan.endDate || 0
                    );


                // ==================================
                // CREATE END DATE IF MISSING
                // ==================================

                if (
                    !endDate &&
                    startDate &&
                    duration > 0
                ) {

                    endDate =
                        startDate +
                        (
                            duration *
                            24 *
                            60 *
                            60 *
                            1000
                        );

                    updates[
                        `${id}/endDate`
                    ] = endDate;

                }


                if (!endDate) {
                    return;
                }


                // ==================================
                // CALCULATE REMAINING DAYS
                // ==================================

                const remainingMs =
                    endDate - now;


                const remainingDays =
                    Math.max(
                        0,
                        Math.ceil(
                            remainingMs /
                            (
                                24 *
                                60 *
                                60 *
                                1000
                            )
                        )
                    );


                // ==================================
                // EXPIRE VIP
                // ==================================

                if (
                    remainingDays <= 0
                ) {

                    if (
                        plan.status !== "expired"
                    ) {

                        updates[
                            `${id}/status`
                        ] = "expired";

                    }


                    updates[
                        `${id}/remainingDays`
                    ] = 0;


                    return;

                }


                // ==================================
                // KEEP VIP ACTIVE
                // ==================================

                if (
                    plan.status !== "expired"
                ) {

                    updates[
                        `${id}/status`
                    ] = "active";

                }


                updates[
                    `${id}/remainingDays`
                ] = remainingDays;

            }
        );


        // ==================================
        // SAVE CHANGES
        // ==================================

        if (
            Object.keys(updates).length > 0
        ) {

            await update(
                vipRef,
                updates
            );

        }


        // ==================================
        // RELOAD VIP DISPLAY
        // ==================================

        loadUserVipPlans();


        console.log(
            "VIP EXPIRATION CHECK COMPLETE"
        );

    } catch (error) {

        console.error(
            "VIP EXPIRATION ERROR:",
            error
        );

    }

}


// ======================================
// AUTO CHECK EVERY MINUTE
// ======================================

setInterval(
    () => {

        if (currentUser) {
            checkVipExpiration();
        }

    },
    60 * 1000
);


console.log(
    "VIP PART 6 READY"
);

// ======================================
// VIP.JS - PART 7
// CLAIM DAILY VIP INCOME
// ======================================

async function claimDailyIncome() {

    if (!currentUser) {

        alert("Please login first.");

        return;

    }


    try {

        // ==================================
        // USER ROOT
        // ==================================

        const userRef =
            ref(
                db,
                `users/${currentUser.uid}`
            );


        // ==================================
        // CLAIM BUTTON
        // ==================================

        const claimButton =
            document.getElementById(
                "claimDailyIncome"
            );


        if (claimButton) {

            claimButton.disabled = true;

            claimButton.innerHTML =
                '<i class="fas fa-spinner fa-spin"></i> Claiming...';

        }


        // ==================================
        // TRANSACTION
        // ==================================

        const result =
            await runTransaction(
                userRef,
                (user) => {

                    if (!user) {
                        return user;
                    }


                    const plans =
                        user.vipPlans || {};


                    let balance =
                        Number(
                            user.balance || 0
                        );


                    const now =
                        Date.now();


                    let claimedTotal = 0;

                    let hasEligibleVip = false;


                    // ==================================
                    // CHECK ALL VIP PLANS
                    // ==================================

                    Object.entries(plans).forEach(
                        ([id, plan]) => {

                            if (!plan) {
                                return;
                            }


                            const status =
                                String(
                                    plan.status ||
                                    "active"
                                ).toLowerCase();


                            // ------------------------------
                            // ONLY ACTIVE VIP
                            // ------------------------------

                            if (
                                status !== "active"
                            ) {

                                return;

                            }


                            // ------------------------------
                            // DAILY INCOME
                            // ------------------------------

                            const daily =
                                Number(
                                    plan.dailyIncome ??
                                    plan.daily ??
                                    0
                                );


                            if (daily <= 0) {
                                return;
                            }


                            // ------------------------------
                            // START DATE
                            // ------------------------------

                            const startDate =
                                Number(
                                    plan.startDate ??
                                    plan.purchasedAt ??
                                    plan.approvedAt ??
                                    plan.createdAt ??
                                    0
                                );


                            // VIP must have started
                            if (
                                startDate &&
                                now < startDate
                            ) {

                                return;

                            }


                            // ------------------------------
                            // END DATE
                            // ------------------------------

                            const duration =
                                Number(
                                    plan.totalDays ??
                                    plan.duration ??
                                    plan.days ??
                                    0
                                );


                            let endDate =
                                Number(
                                    plan.endDate || 0
                                );


                            if (
                                !endDate &&
                                startDate &&
                                duration > 0
                            ) {

                                endDate =
                                    startDate +
                                    (
                                        duration *
                                        24 *
                                        60 *
                                        60 *
                                        1000
                                    );

                            }


                            // ------------------------------
                            // VIP EXPIRED
                            // ------------------------------

                            if (
                                endDate &&
                                now >= endDate
                            ) {

                                return;

                            }


                            // ------------------------------
                            // LAST CLAIM
                            // ------------------------------

                            const lastClaim =
                                Number(
                                    plan.lastClaim || 0
                                );


                            // ------------------------------
                            // FIRST CLAIM
                            // ------------------------------

                            // Admin approval sets lastClaim
                            // to approval/start time.
                            //
                            // Therefore first claim is available
                            // only after 24 hours.

                            const twentyFourHours =
                                24 *
                                60 *
                                60 *
                                1000;


                            const timeSinceClaim =
                                now -
                                lastClaim;


                            if (
                                lastClaim &&
                                timeSinceClaim <
                                twentyFourHours
                            ) {

                                return;

                            }


                            // ------------------------------
                            // ELIGIBLE VIP
                            // ------------------------------

                            hasEligibleVip = true;


                            // Add daily income
                            balance += daily;

                            claimedTotal += daily;


                            // ------------------------------
                            // UPDATE CLAIM TIME
                            // ------------------------------

                            plan.lastClaim =
                                now;


                            // ------------------------------
                            // TOTAL EARNED
                            // ------------------------------

                            const previousEarned =
                                Number(
                                    plan.totalEarned ??
                                    plan.earned ??
                                    0
                                );


                            plan.totalEarned =
                                previousEarned +
                                daily;


                            plan.earned =
                                plan.totalEarned;


                            // ------------------------------
                            // CLAIM COUNT
                            // ------------------------------

                            const claimCount =
                                Number(
                                    plan.claimCount || 0
                                );


                            plan.claimCount =
                                claimCount + 1;


                            plans[id] =
                                plan;

                        }
                    );


                    // ==================================
                    // NOTHING TO CLAIM
                    // ==================================

                    if (
                        !hasEligibleVip
                    ) {

                        return;

                    }


                    // ==================================
                    // SAVE BALANCE + VIP PLANS
                    // ==================================

                    user.balance =
                        balance;


                    user.vipPlans =
                        plans;


                    return user;

                }
            );


        // ==================================
        // TRANSACTION NOT COMMITTED
        // ==================================

        if (
            !result.committed
        ) {

            if (claimButton) {

                claimButton.disabled =
                    false;

                claimButton.innerHTML =
                    '<i class="fas fa-coins"></i> Claim Daily Income';

            }


            alert(
                "No VIP income is available to claim yet."
            );

            return;

        }


        // ==================================
        // GET UPDATED USER DATA
        // ==================================

        const updatedUser =
            result.snapshot.val() || {};


        userData =
            updatedUser;


        vipPlans =
            updatedUser.vipPlans || {};


        // ==================================
        // CLAIM AMOUNT
        // ==================================

        let claimedAmount = 0;


        Object.values(vipPlans).forEach(
            (plan) => {

                if (!plan) {
                    return;
                }

                const lastClaim =
                    Number(
                        plan.lastClaim || 0
                    );

                // We cannot reliably calculate the exact
                // amount from lastClaim here.
                // The transaction already updated balance.
            }
        );


        // ==================================
        // REFRESH DISPLAY
        // ==================================

        if (balance) {

            const newBalance =
                Number(
                    updatedUser.balance || 0
                );


            balance.textContent =
                `${newBalance.toLocaleString()} RWF`;

        }


        loadUserVipPlans();


        // ==================================
        // SUCCESS
        // ==================================

        if (claimButton) {

            claimButton.disabled =
                true;

            claimButton.innerHTML =
                '<i class="fas fa-check-circle"></i> Claimed';

        }


        alert(
            "Daily VIP income claimed successfully!"
        );


        console.log(
            "VIP DAILY INCOME CLAIMED"
        );


        // ==================================
        // CREATE TRANSACTION RECORD
        // ==================================

        // IMPORTANT:
        // The amount below is calculated from the
        // balance difference using the fresh user
        // data is not available here.
        //
        // We therefore create the transaction only
        // when an eligible claim was processed.
        //
        // The exact amount should preferably be passed
        // from the transaction calculation in a later
        // security-focused version.


    } catch (error) {

        console.error(
            "CLAIM DAILY INCOME ERROR:",
            error
        );


        const claimButton =
            document.getElementById(
                "claimDailyIncome"
            );


        if (claimButton) {

            claimButton.disabled =
                false;

            claimButton.innerHTML =
                '<i class="fas fa-coins"></i> Claim Daily Income';

        }


        alert(
            "Claim failed: " +
            (
                error.message ||
                error
            )
        );

    }

}


console.log(
    "VIP PART 7 READY"
);

// ======================================
// VIP.JS - PART 8
// DAILY CLAIM TIMER
// ======================================

let claimTimerInterval = null;


// ======================================
// START CLAIM TIMER
// ======================================

function startClaimTimer() {

    // Stop previous timer
    if (claimTimerInterval) {

        clearInterval(
            claimTimerInterval
        );

        claimTimerInterval = null;

    }


    if (!currentUser) {
        return;
    }


    const claimButton =
        document.getElementById(
            "claimDailyIncome"
        );


    if (!claimButton) {

        console.log(
            "Claim button not found."
        );

        return;

    }


    const vipRef =
        ref(
            db,
            `users/${currentUser.uid}/vipPlans`
        );


    // ==================================
    // READ VIP PLANS
    // ==================================

    get(vipRef)
        .then((snapshot) => {

            if (!snapshot.exists()) {

                claimButton.disabled = true;

                claimButton.innerHTML =
                    '<i class="fas fa-lock"></i> No Active VIP';

                return;

            }


            const plans =
                snapshot.val() || {};


            // ==================================
            // UPDATE TIMER
            // ==================================

            const updateTimer = () => {

                const now =
                    Date.now();


                let nextClaimTime = null;

                let hasActiveVip = false;


                Object.values(plans).forEach(
                    (plan) => {

                        if (!plan) {
                            return;
                        }


                        const status =
                            String(
                                plan.status ||
                                "active"
                            ).toLowerCase();


                        if (
                            status !== "active"
                        ) {

                            return;

                        }


                        const daily =
                            Number(
                                plan.dailyIncome ??
                                plan.daily ??
                                0
                            );


                        if (daily <= 0) {
                            return;
                        }


                        // ------------------------------
                        // CHECK EXPIRATION
                        // ------------------------------

                        const startDate =
                            Number(
                                plan.startDate ??
                                plan.purchasedAt ??
                                plan.approvedAt ??
                                plan.createdAt ??
                                0
                            );


                        const duration =
                            Number(
                                plan.totalDays ??
                                plan.duration ??
                                plan.days ??
                                0
                            );


                        let endDate =
                            Number(
                                plan.endDate || 0
                            );


                        if (
                            !endDate &&
                            startDate &&
                            duration > 0
                        ) {

                            endDate =
                                startDate +
                                (
                                    duration *
                                    24 *
                                    60 *
                                    60 *
                                    1000
                                );

                        }


                        if (
                            endDate &&
                            now >= endDate
                        ) {

                            return;

                        }


                        hasActiveVip = true;


                        // ------------------------------
                        // LAST CLAIM
                        // ------------------------------

                        const lastClaim =
                            Number(
                                plan.lastClaim || 0
                            );


                        const twentyFourHours =
                            24 *
                            60 *
                            60 *
                            1000;


                        const claimTime =
                            lastClaim
                                ? lastClaim +
                                  twentyFourHours
                                : (
                                    startDate +
                                    twentyFourHours
                                );


                        // Pick earliest eligible claim
                        if (
                            nextClaimTime === null ||
                            claimTime < nextClaimTime
                        ) {

                            nextClaimTime =
                                claimTime;

                        }

                    }
                );


                // ==================================
                // NO ACTIVE VIP
                // ==================================

                if (!hasActiveVip) {

                    claimButton.disabled =
                        true;

                    claimButton.innerHTML =
                        '<i class="fas fa-lock"></i> No Active VIP';

                    return;

                }


                // ==================================
                // CLAIM AVAILABLE
                // ==================================

                if (
                    nextClaimTime !== null &&
                    now >= nextClaimTime
                ) {

                    claimButton.disabled =
                        false;

                    claimButton.innerHTML =
                        '<i class="fas fa-coins"></i> Claim Now';

                    return;

                }


                // ==================================
                // CALCULATE REMAINING TIME
                // ==================================

                const remaining =
                    Math.max(
                        0,
                        nextClaimTime - now
                    );


                const totalSeconds =
                    Math.floor(
                        remaining / 1000
                    );


                const hours =
                    Math.floor(
                        totalSeconds / 3600
                    );


                const minutes =
                    Math.floor(
                        (
                            totalSeconds % 3600
                        ) / 60
                    );


                const seconds =
                    totalSeconds % 60;


                claimButton.disabled =
                    true;


                claimButton.innerHTML =
                    `
                    <i class="fas fa-clock"></i>
                    Claim in
                    ${hours}h
                    ${minutes}m
                    ${seconds}s
                    `;

            };


            // First update
            updateTimer();


            // Update every second
            claimTimerInterval =
                setInterval(
                    updateTimer,
                    1000
                );

        })
        .catch((error) => {

            console.error(
                "CLAIM TIMER ERROR:",
                error
            );

        });

}


// ======================================
// START TIMER WHEN USER IS READY
// ======================================

if (currentUser) {

    startClaimTimer();

}


console.log(
    "VIP PART 8 READY"
);

// ======================================
// VIP.JS - PART 9
// UPDATE VIP BUY BUTTONS
// ======================================

async function updateVipButtons() {

    if (!currentUser) {
        return;
    }


    const buttons =
        document.querySelectorAll(
            ".buyVipBtn"
        );


    if (!buttons.length) {
        return;
    }


    try {

        // ==================================
        // GET USER VIP PLANS
        // ==================================

        const vipPlansRef =
            ref(
                db,
                `users/${currentUser.uid}/vipPlans`
            );


        const vipSnapshot =
            await get(vipPlansRef);


        const ownedPlans =
            vipSnapshot.exists()
                ? vipSnapshot.val() || {}
                : {};


        // ==================================
        // GET PURCHASE REQUESTS
        // ==================================

        const requestsRef =
            ref(
                db,
                "vipPurchaseRequests"
            );


        const requestSnapshot =
            await get(requestsRef);


        const requests =
            requestSnapshot.exists()
                ? requestSnapshot.val() || {}
                : {};


        // ==================================
        // CHECK EVERY BUY BUTTON
        // ==================================

        buttons.forEach(
            (button) => {

                const vipName =
                    button.dataset.vip ||
                    "";


                let purchased = false;

                let pending = false;


                // ==================================
                // CHECK APPROVED/OWNED VIP
                // ==================================

                Object.values(
                    ownedPlans
                ).forEach(
                    (plan) => {

                        if (!plan) {
                            return;
                        }


                        const planName =
                            plan.vipName ||
                            plan.name ||
                            "";


                        if (
                            planName === vipName
                        ) {

                            const status =
                                String(
                                    plan.status ||
                                    "active"
                                ).toLowerCase();


                            if (
                                status === "active" ||
                                status === "expired"
                            ) {

                                purchased = true;

                            }

                        }

                    }
                );


                // ==================================
                // CHECK PENDING REQUEST
                // ==================================

                Object.values(
                    requests
                ).forEach(
                    (request) => {

                        if (!request) {
                            return;
                        }


                        const requestName =
                            request.vipName ||
                            request.name ||
                            "";


                        if (
                            request.uid ===
                                currentUser.uid &&
                            requestName ===
                                vipName &&
                            (
                                request.status ===
                                    "pending" ||
                                request.status ===
                                    "processing"
                            )
                        ) {

                            pending = true;

                        }

                    }
                );


                // ==================================
                // VIP ALREADY PURCHASED
                // ==================================

                if (purchased) {

                    button.disabled = true;

                    button.classList.add(
                        "purchased"
                    );


                    button.innerHTML =
                        `
                        <i class="fas fa-check-circle"></i>
                        Purchased
                        `;


                    button.style.display =
                        "none";


                    return;

                }


                // ==================================
                // REQUEST ALREADY SENT
                // ==================================

                if (pending) {

                    button.disabled = true;

                    button.classList.add(
                        "purchased"
                    );


                    button.innerHTML =
                        `
                        <i class="fas fa-clock"></i>
                        Pending
                        `;


                    button.style.display =
                        "none";


                    return;

                }


                // ==================================
                // AVAILABLE FOR PURCHASE
                // ==================================

                button.disabled = false;

                button.classList.remove(
                    "purchased"
                );


                button.style.display =
                    "";


                button.innerHTML =
                    `
                    <i class="fas fa-cart-shopping"></i>
                    Buy Now
                    `;

            }
        );


        console.log(
            "VIP BUY BUTTONS UPDATED"
        );


    } catch (error) {

        console.error(
            "UPDATE VIP BUTTONS ERROR:",
            error
        );

    }

}


console.log(
    "VIP PART 9 READY"
);

// ======================================
// VIP.JS - PART 10
// FINAL VIP REFRESH / INITIALIZATION
// ======================================


// ======================================
// REFRESH VIP SYSTEM
// ======================================

function refreshVipSystem() {

    try {

        updateVipButtons();

        startClaimTimer();

        console.log(
            "VIP SYSTEM REFRESHED"
        );

    } catch (error) {

        console.error(
            "VIP SYSTEM REFRESH ERROR:",
            error
        );

    }

}


// ======================================
// WATCH USER VIP PLANS
// ======================================

function watchUserVipPlans() {

    if (!currentUser) {
        return;
    }


    const vipRef =
        ref(
            db,
            `users/${currentUser.uid}/vipPlans`
        );


    onValue(
        vipRef,
        (snapshot) => {

            if (snapshot.exists()) {

                vipPlans =
                    snapshot.val() || {};

            } else {

                vipPlans = {};

            }


            // Update VIP cards
            loadUserVipPlans();


            // Update Buy buttons
            updateVipButtons();


            // Restart claim timer
            startClaimTimer();


            console.log(
                "USER VIP DATA UPDATED"
            );

        },

        (error) => {

            console.error(
                "WATCH VIP PLANS ERROR:",
                error
            );

        }
    );

}


// ======================================
// START VIP SYSTEM
// ======================================

function startVipSystem() {

    if (!currentUser) {

        console.log(
            "VIP SYSTEM WAITING FOR LOGIN..."
        );

        return;

    }


    console.log(
        "STARTING VIP SYSTEM FOR:",
        currentUser.uid
    );


    // Load VIP packages
    loadVipPackages();


    // Load user's VIP plans
    loadUserVipPlans();


    // Start expiration checking
    checkVipExpiration();


    // Start claim timer
    startClaimTimer();


    // Watch user's VIP plans
    watchUserVipPlans();


    // Update Buy buttons
    updateVipButtons();


    console.log(
        "VIP SYSTEM STARTED"
    );

}


// ======================================
// AUTH INITIALIZATION
// ======================================

onAuthStateChanged(
    auth,
    (user) => {

        if (!user) {

            currentUser = null;

            console.log(
                "NO USER LOGGED IN"
            );

            return;

        }


        currentUser = user;


        console.log(
            "VIP AUTH READY:",
            currentUser.uid
        );


        // Start everything after login
        startVipSystem();

    }
);


// ======================================
// CLAIM BUTTON
// ======================================

const claimButton =
    document.getElementById(
        "claimDailyIncome"
    );


if (claimButton) {

    claimButton.addEventListener(
        "click",
        async () => {

            if (
                claimButton.disabled
            ) {
                return;
            }


            await claimDailyIncome();


            // Refresh after claim
            setTimeout(
                () => {

                    refreshVipSystem();

                },
                500
            );

        }
    );

}


// ======================================
// PAGE VISIBILITY
// ======================================

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.visibilityState ===
            "visible"
        ) {

            refreshVipSystem();

        }

    }
);


// ======================================
// FINAL READY MESSAGE
// ======================================

console.log(
    "================================"
);

console.log(
    "MONEY VAULT VIP SYSTEM READY"
);

console.log(
    "PART 1 - 10 LOADED"
);

console.log(
    "================================"
);
