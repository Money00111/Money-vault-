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
    runTransaction,
    query,
    orderByChild,
    equalTo
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
// BUY VIP - ONE TIME ONLY
// ======================================

async function buyVip(button) {

    // ==================================
    // PREVENT DOUBLE CLICK IMMEDIATELY
    // ==================================

    if (
        button.dataset.buying === "true"
    ) {
        return;
    }

    button.dataset.buying = "true";


    try {

        // ==================================
        // CHECK USER
        // ==================================

        if (!currentUser) {

            button.dataset.buying = "false";

            alert("Please login first.");

            return;

        }


        // ==================================
        // READ VIP DATA
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
        // VALIDATE
        // ==================================

        if (
            !vipName ||
            price <= 0 ||
            dailyIncome <= 0 ||
            totalDays <= 0
        ) {

            button.dataset.buying = "false";

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

            button.dataset.buying = "false";

            alert(
                `Insufficient balance.\n\n` +
                `VIP Price: ${price.toLocaleString()} RWF\n` +
                `Your Balance: ${balanceValue.toLocaleString()} RWF`
            );

            return;

        }


        // ==================================
        // CONFIRM
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

            button.dataset.buying = "false";

            return;

        }


        // ==================================
        // BUTTON = PROCESSING
        // ==================================

        button.disabled = true;

        button.innerHTML =
            `
            <i class="fas fa-spinner fa-spin"></i>
            Processing...
            `;


        // ==================================
        // CHECK USER'S REQUESTS ONLY
        // ==================================

        const requestsQuery =
            query(
                ref(
                    db,
                    "vipPurchaseRequests"
                ),
                orderByChild("uid"),
                equalTo(currentUser.uid)
            );


        const snapshot =
            await get(requestsQuery);


        let alreadyRequested = false;


        if (snapshot.exists()) {

            const requests =
                snapshot.val() || {};


            Object.values(requests).forEach(
                (request) => {

                    if (!request) {
                        return;
                    }


                    const requestName =
                        request.vipName ||
                        request.name ||
                        "";


                    const status =
                        String(
                            request.status || ""
                        ).toLowerCase();


                    if (
                        requestName === vipName &&
                        (
                            status === "pending" ||
                            status === "processing" ||
                            status === "approved"
                        )
                    ) {

                        alreadyRequested = true;

                    }

                }
            );

        }


        // ==================================
        // ALREADY REQUESTED
        // ==================================

        if (alreadyRequested) {

            button.disabled = true;

            button.dataset.buying = "false";

            button.classList.add(
                "purchased"
            );

            button.innerHTML =
                `
                <i class="fas fa-clock"></i>
                Pending
                `;

            button.style.display = "none";

            alert(
                `You already have a request or purchase for ${vipName}.`
            );

            return;

        }


        // ==================================
        // CREATE REQUEST
        // ==================================

        const requestRef =
            push(
                ref(
                    db,
                    "vipPurchaseRequests"
                )
            );


        await set(
            requestRef,
            {

                uid:
                    currentUser.uid,

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

            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        button.disabled = true;

        button.dataset.buying = "false";

        button.classList.add(
            "purchased"
        );


        button.innerHTML =
            `
            <i class="fas fa-clock"></i>
            Pending
            `;


        button.style.display = "none";


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


        // ==================================
        // RESTORE BUTTON ONLY IF FAILED
        // ==================================

        button.disabled = false;

        button.dataset.buying = "false";

        button.classList.remove(
            "purchased"
        );

        button.style.display = "";


        button.innerHTML =
            `
            <i class="fas fa-cart-shopping"></i>
            Buy Now
            `;


        alert(
            "VIP purchase failed: " +
            (
                error.message ||
                error
            )
        );

    }

}

         // ======================================
// VIP.JS - PART 4
// BUY VIP - ONE TIME ONLY
// ======================================

async function buyVip(button) {

    // ==================================
    // PREVENT DOUBLE CLICK IMMEDIATELY
    // ==================================

    if (
        button.dataset.buying === "true"
    ) {
        return;
    }

    button.dataset.buying = "true";


    try {

        // ==================================
        // CHECK USER
        // ==================================

        if (!currentUser) {

            button.dataset.buying = "false";

            alert("Please login first.");

            return;

        }


        // ==================================
        // READ VIP DATA
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
        // VALIDATE
        // ==================================

        if (
            !vipName ||
            price <= 0 ||
            dailyIncome <= 0 ||
            totalDays <= 0
        ) {

            button.dataset.buying = "false";

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

            button.dataset.buying = "false";

            alert(
                `Insufficient balance.\n\n` +
                `VIP Price: ${price.toLocaleString()} RWF\n` +
                `Your Balance: ${balanceValue.toLocaleString()} RWF`
            );

            return;

        }


        // ==================================
        // CONFIRM
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

            button.dataset.buying = "false";

            return;

        }


        // ==================================
        // BUTTON = PROCESSING
        // ==================================

        button.disabled = true;

        button.innerHTML =
            `
            <i class="fas fa-spinner fa-spin"></i>
            Processing...
            `;


        // ==================================
        // CHECK USER'S REQUESTS ONLY
        // ==================================

        const requestsQuery =
            query(
                ref(
                    db,
                    "vipPurchaseRequests"
                ),
                orderByChild("uid"),
                equalTo(currentUser.uid)
            );


        const snapshot =
            await get(requestsQuery);


        let alreadyRequested = false;


        if (snapshot.exists()) {

            const requests =
                snapshot.val() || {};


            Object.values(requests).forEach(
                (request) => {

                    if (!request) {
                        return;
                    }


                    const requestName =
                        request.vipName ||
                        request.name ||
                        "";


                    const status =
                        String(
                            request.status || ""
                        ).toLowerCase();


                    if (
                        requestName === vipName &&
                        (
                            status === "pending" ||
                            status === "processing" ||
                            status === "approved"
                        )
                    ) {

                        alreadyRequested = true;

                    }

                }
            );

        }


        // ==================================
        // ALREADY REQUESTED
        // ==================================

        if (alreadyRequested) {

            button.disabled = true;

            button.dataset.buying = "false";

            button.classList.add(
                "purchased"
            );

            button.innerHTML =
                `
                <i class="fas fa-clock"></i>
                Pending
                `;

            button.style.display = "none";

            alert(
                `You already have a request or purchase for ${vipName}.`
            );

            return;

        }


        // ==================================
        // CREATE REQUEST
        // ==================================

        const requestRef =
            push(
                ref(
                    db,
                    "vipPurchaseRequests"
                )
            );


        await set(
            requestRef,
            {

                uid:
                    currentUser.uid,

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

            }
        );


        // ==================================
        // SUCCESS
        // ==================================

        button.disabled = true;

        button.dataset.buying = "false";

        button.classList.add(
            "purchased"
        );


        button.innerHTML =
            `
            <i class="fas fa-clock"></i>
            Pending
            `;


        button.style.display = "none";


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


        // ==================================
        // RESTORE BUTTON ONLY IF FAILED
        // ==================================

        button.disabled = false;

        button.dataset.buying = "false";

        button.classList.remove(
            "purchased"
        );

        button.style.display = "";


        button.innerHTML =
            `
            <i class="fas fa-cart-shopping"></i>
            Buy Now
            `;


        alert(
            "VIP purchase failed: " +
            (
                error.message ||
                error
            )
        );

    }

}   
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


console.log(
    "VIP EXPIRATION CHECK COMPLETE"
);

// ======================================
// VIP.JS - PART 7
// CLAIM DAILY VIP INCOME
// ONE CLAIM AT A TIME
// ======================================

let claimInProgress = false;


async function claimDailyIncome() {

    // ==================================
    // PREVENT DOUBLE CLAIM
    // ==================================

    if (claimInProgress) {
        return;
    }


    if (!currentUser) {

        alert("Please login first.");

        return;

    }


    const claimButton =
        document.getElementById(
            "claimDailyIncome"
        );


    // ==================================
    // LOCK CLAIM BUTTON
    // ==================================

    claimInProgress = true;


    if (claimButton) {

        claimButton.disabled = true;

        claimButton.innerHTML =
            `
            <i class="fas fa-spinner fa-spin"></i>
            Claiming...
            `;

    }


    try {

        const userRef =
            ref(
                db,
                `users/${currentUser.uid}`
            );


        // ==================================
        // ATOMIC TRANSACTION
        // ==================================

        const result =
            await runTransaction(
                userRef,
                (user) => {

                    if (!user) {
                        return;
                    }


                    const plans =
                        user.vipPlans || {};


                    let balance =
                        Number(
                            user.balance || 0
                        );


                    const now =
                        Date.now();


                    const DAY =
                        24 *
                        60 *
                        60 *
                        1000;


                    let claimedTotal = 0;


                    // ==================================
                    // CHECK VIP PLANS
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


                            const startDate =
                                Number(
                                    plan.startDate ??
                                    plan.purchasedAt ??
                                    plan.approvedAt ??
                                    plan.createdAt ??
                                    0
                                );


                            if (
                                startDate &&
                                now < startDate
                            ) {
                                return;
                            }


                            // ==================================
                            // END DATE
                            // ==================================

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
                                        DAY
                                    );

                            }


                            if (
                                endDate &&
                                now >= endDate
                            ) {

                                return;

                            }


                            // ==================================
                            // LAST CLAIM
                            // ==================================

                            const lastClaim =
                                Number(
                                    plan.lastClaim || 0
                                );


                            // ==================================
                            // MUST WAIT 24 HOURS
                            // ==================================

                            if (
                                lastClaim > 0 &&
                                (
                                    now -
                                    lastClaim
                                ) < DAY
                            ) {

                                return;

                            }


                            // ==================================
                            // CLAIM
                            // ==================================

                            balance += daily;

                            claimedTotal += daily;


                            // ==================================
                            // UPDATE LAST CLAIM
                            // ==================================

                            plan.lastClaim =
                                now;


                            // ==================================
                            // TOTAL EARNED
                            // ==================================

                            const oldEarned =
                                Number(
                                    plan.totalEarned ??
                                    plan.earned ??
                                    0
                                );


                            plan.totalEarned =
                                oldEarned +
                                daily;


                            plan.earned =
                                plan.totalEarned;


                            // ==================================
                            // CLAIM COUNT
                            // ==================================

                            const oldCount =
                                Number(
                                    plan.claimCount || 0
                                );


                            plan.claimCount =
                                oldCount + 1;


                            plans[id] =
                                plan;

                        }
                    );


                    // ==================================
                    // NOTHING TO CLAIM
                    // ==================================

                    if (
                        claimedTotal <= 0
                    ) {

                        return;

                    }


                    // ==================================
                    // SAVE
                    // ==================================

                    user.balance =
                        balance;

                    user.vipPlans =
                        plans;


                    return user;

                }
            );


        // ==================================
        // TRANSACTION FAILED
        // ==================================

        if (
            !result.committed
        ) {

            throw new Error(
                "No VIP income is available to claim yet."
            );

        }


        // ==================================
        // UPDATE LOCAL DATA
        // ==================================

        const updatedUser =
            result.snapshot.val() || {};


        userData =
            updatedUser;


        vipPlans =
            updatedUser.vipPlans || {};


        // ==================================
        // UPDATE BALANCE
        // ==================================

        if (balance) {

            const newBalance =
                Number(
                    updatedUser.balance || 0
                );


            balance.textContent =
                `${newBalance.toLocaleString()} RWF`;

        }


        // ==================================
        // SUCCESS
        // ==================================

        if (claimButton) {

            claimButton.disabled =
                true;

            claimButton.innerHTML =
                `
                <i class="fas fa-check-circle"></i>
                Claimed
                `;

        }


        console.log(
            "VIP DAILY INCOME CLAIMED"
        );


        alert(
            "Daily VIP income claimed successfully!"
        );


        // ==================================
        // REFRESH TIMER
        // ==================================

        setTimeout(
            () => {

                startClaimTimer();

            },
            300
        );


    } catch (error) {

        console.error(
            "CLAIM DAILY INCOME ERROR:",
            error
        );


        if (claimButton) {

            claimButton.disabled =
                false;

            claimButton.innerHTML =
                `
                <i class="fas fa-coins"></i>
                Claim Daily Income
                `;

        }


        alert(
            "Claim failed: " +
            (
                error.message ||
                error
            )
        );

    } finally {

        claimInProgress = false;

    }

}


console.log(
    "VIP PART 7 READY"
);

        
        
