// ======================================
// ADMIN.JS PART 1
// AUTH + SETUP + NAVIGATION
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
    ref,
    get,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ADMIN EMAIL
// ======================================

const ADMIN_EMAIL = "Niyigenaepizo9@gmail.com";

// ======================================
// CURRENT ADMIN
// ======================================

let currentAdmin = null;

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminName = document.getElementById("adminName");

const menuLinks = document.querySelectorAll(".menu-link");
const pageSections = document.querySelectorAll(".page-section");

// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    if (
        !user.email ||
        user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {

        alert("Access Denied");

        await signOut(auth);

        window.location.href = "dashboard.html";

        return;
    }

    currentAdmin = user;

    try {

        const snap = await get(
            ref(db, "users/" + user.uid)
        );

        if (snap.exists()) {

            const data = snap.val();

            adminName.textContent =
                data.fullName || "Administrator";

        } else {

            adminName.textContent =
                "Administrator";

        }

    } catch (error) {

        console.log(error);

        adminName.textContent =
            "Administrator";

    }

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

});

// ======================================
// SIDEBAR BUTTON
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("show");

});

// ======================================
// CHANGE PAGE
// ======================================

function openPage(pageName) {

    pageSections.forEach(section => {

        section.style.display = "none";

    });

    menuLinks.forEach(link => {

        link.classList.remove("active");

    });

    const page = document.getElementById(
        pageName + "Section"
    );

    if (page) {

        page.style.display = "block";

    }

    const activeLink = document.querySelector(
        `[data-page="${pageName}"]`
    );

    if (activeLink) {

        activeLink.classList.add("active");

    }

    sidebar.classList.remove("show");

}

// ======================================
// SIDEBAR MENU
// ======================================

menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        const page = link.dataset.page;

        openPage(page);

    });

});

// ======================================
// QUICK ACTION BUTTONS
// ======================================

document.getElementById("openDeposits")?.addEventListener(
    "click",
    () => openPage("deposit")
);

document.getElementById("openWithdraws")?.addEventListener(
    "click",
    () => openPage("withdraw")
);

document.getElementById("openUsers")?.addEventListener(
    "click",
    () => openPage("users")
);

document.getElementById("openSettings")?.addEventListener(
    "click",
    () => openPage("settings")
);

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async () => {

    const ok = confirm(
        "Logout from Admin Panel?"
    );

    if (!ok) return;

    await signOut(auth);

    window.location.href = "login.html";

});

// ======================================
// DEFAULT PAGE
// ======================================

window.addEventListener("load", () => {

    openPage("dashboard");

});

// ======================================
// READY
// ======================================

console.log("==================================");
console.log("Admin Part 1 Loaded Successfully");
console.log("==================================");

// ======================================
// ADMIN.JS PART 2
// LOAD DEPOSIT REQUESTS
// ======================================

const depositContainer =
document.getElementById("depositRequests");

function loadDeposits() {

    const depositsRef = ref(db, "depositRequests");

    onValue(depositsRef, (snapshot) => {

        if (!depositContainer) return;

        depositContainer.innerHTML = "";

        if (!snapshot.exists()) {

            depositContainer.innerHTML = `

            <div class="empty-card">

                <i class="fa-solid fa-wallet"></i>

                <h3>No Deposit Requests</h3>

            </div>

            `;

            return;
        }

        const list = [];

        snapshot.forEach((child) => {

            list.unshift({

                id: child.key,

                ...child.val()

            });

        });

        list.forEach((data) => {

            depositContainer.innerHTML += `

            <div class="request-card">

                <div class="request-top">

                    <h3>${Number(data.amount || 0).toLocaleString()} RWF</h3>

                    <span class="status ${String(data.status).toLowerCase()}">

                        ${data.status || "Pending"}

                    </span>

                </div>

                <p>

                    <strong>Name:</strong>

                    ${data.fullName || "-"}

                </p>

                <p>

                    <strong>Email:</strong>

                    ${data.email || "-"}

                </p>

                <p>

                    <strong>Phone:</strong>

                    ${data.senderPhone || "-"}

                </p>

                <p>

                    <strong>Transaction ID:</strong>

                    ${data.transactionId || "-"}

                </p>

                <div class="action-buttons">

                    <button
                    class="approveBtn"
                    data-id="${data.id}">

                        <i class="fa fa-check"></i>

                        Approve

                    </button>

                    <button
                    class="rejectBtn"
                    data-id="${data.id}">

                        <i class="fa fa-times"></i>

                        Reject

                    </button>

                    <button
                    class="viewProof"
                    data-image="${data.proofImage || ""}">

                        <i class="fa fa-image"></i>

                        Screenshot

                    </button>

                    <button
                    class="copyTransaction"
                    data-id="${data.transactionId || ""}">

                        <i class="fa fa-copy"></i>

                        Copy ID

                    </button>

                </div>

            </div>

            `;

        });

        activateButtons();

    });

}

loadDeposits();

console.log("✅ Deposits Loaded");

// ======================================
// ADMIN.JS - PART 3
// DASHBOARD + NAVIGATION
// ======================================

// ---------- Dashboard Elements ----------

const totalUsers = document.getElementById("totalUsers");
const totalDeposits = document.getElementById("totalDeposits");
const totalPending = document.getElementById("totalPending");
const totalApproved = document.getElementById("totalApproved");
const totalRejected = document.getElementById("totalRejected");
const totalAmount = document.getElementById("totalAmount");

// ---------- Load Dashboard Statistics ----------

function loadDashboardStats() {

    // USERS

    onValue(ref(db, "users"), (snapshot) => {

        let count = 0;

        if (snapshot.exists()) {

            snapshot.forEach(() => {

                count++;

            });

        }

        if (totalUsers) {

            totalUsers.textContent = count;

        }

    });

    // DEPOSITS

    onValue(ref(db, "depositRequests"), (snapshot) => {

        let deposits = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;
        let amount = 0;

        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const data = child.val();

                deposits++;

                amount += Number(data.amount || 0);

                if (data.status === "Pending") pending++;

                if (data.status === "Approved") approved++;

                if (data.status === "Rejected") rejected++;

            });

        }

        if (totalDeposits) totalDeposits.textContent = deposits;

        if (totalPending) totalPending.textContent = pending;

        if (totalApproved) totalApproved.textContent = approved;

        if (totalRejected) totalRejected.textContent = rejected;

        if (totalAmount) {

            totalAmount.textContent =
                amount.toLocaleString() + " RWF";

        }

    });

}

loadDashboardStats();

// ======================================
// PAGE NAVIGATION
// ======================================

const pages = document.querySelectorAll(".page-section");

const menuLinks = document.querySelectorAll(".menu-link");

function openPage(pageId) {

    pages.forEach(section => {

        section.style.display = "none";

    });

    menuLinks.forEach(link => {

        link.classList.remove("active");

    });

    if (pageId === "dashboard") {

        document.getElementById("dashboardSection").style.display = "block";

    }

    if (pageId === "deposits") {

        document.getElementById("depositSection").style.display = "block";

    }

    if (pageId === "withdraws") {

        document.getElementById("withdrawSection").style.display = "block";

    }

    if (pageId === "users") {

        document.getElementById("usersSection").style.display = "block";

    }

    if (pageId === "transactions") {

        document.getElementById("transactionsSection").style.display = "block";

    }

    if (pageId === "settings") {

        document.getElementById("settingsSection").style.display = "block";

    }

    document
        .querySelector(`[data-page="${pageId}"]`)
        ?.classList.add("active");

}

// ======================================
// MENU LINKS
// ======================================

menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        openPage(link.dataset.page);

    });

});

// ======================================
// QUICK ACTION BUTTONS
// ======================================

document.getElementById("openDeposits")?.addEventListener("click", () => {

    openPage("deposits");

});

document.getElementById("openWithdraws")?.addEventListener("click", () => {

    openPage("withdraws");

});

document.getElementById("openUsers")?.addEventListener("click", () => {

    openPage("users");

});

document.getElementById("openSettings")?.addEventListener("click", () => {

    openPage("settings");

});

// ======================================
// MOBILE MENU
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("show");

});

// ======================================
// START PAGE
// ======================================

openPage("dashboard");

console.log("✅ Admin Part 3 Loaded");
// ======================================
// ADMIN.JS - PART 4
// WITHDRAW REQUESTS
// ======================================


// ======================================
// ELEMENTS
// ======================================

const withdrawRequests =
document.getElementById("withdrawRequests");

const withdrawCount =
document.getElementById("withdrawCount");

const withdrawPending =
document.getElementById("withdrawPending");

const withdrawApproved =
document.getElementById("withdrawApproved");

const withdrawRejected =
document.getElementById("withdrawRejected");

// ======================================
// LOAD WITHDRAW REQUESTS
// ======================================

function loadWithdraws(){

const withdrawRef =
ref(db,"withdrawRequests");

onValue(withdrawRef,(snapshot)=>{

if(!withdrawRequests) return;

withdrawRequests.innerHTML="";

let total=0;
let pending=0;
let approved=0;
let rejected=0;

if(!snapshot.exists()){

withdrawRequests.innerHTML=`

<div class="empty-state">

<h3>No Withdraw Requests</h3>

</div>

`;

return;

}

snapshot.forEach(child=>{

const data=child.val();

total++;

if(data.status==="Pending") pending++;
if(data.status==="Approved") approved++;
if(data.status==="Rejected") rejected++;

withdrawRequests.innerHTML+=`

<div class="request-card">

<h3>

${Number(data.amount).toLocaleString()} RWF

</h3>

<p>

<b>Name:</b>

${data.fullName||"-"}

</p>

<p>

<b>Email:</b>

${data.email||"-"}

</p>

<p>

<b>Phone:</b>

${data.phone||"-"}

</p>

<p>

<b>Method:</b>

${data.method||"-"}

</p>

<p>

<b>Status:</b>

<strong>${data.status}</strong>

</p>

<div class="action-buttons">

<button
class="approveWithdraw"
data-id="${child.key}">

Approve

</button>

<button
class="rejectWithdraw"
data-id="${child.key}">

Reject

</button>

</div>

</div>

`;

});

withdrawCount.textContent=total;
withdrawPending.textContent=pending;
withdrawApproved.textContent=approved;
withdrawRejected.textContent=rejected;

activateWithdrawButtons();

});

}

// ======================================
// APPROVE
// ======================================

async function approveWithdraw(id){

if(!confirm("Approve Withdraw?")) return;

const requestRef=
ref(db,"withdrawRequests/"+id);

const snap=
await get(requestRef);

if(!snap.exists()) return;

const withdraw=
snap.val();

if(withdraw.status==="Approved"){

alert("Already Approved");

return;

}

const userRef=
ref(db,"users/"+withdraw.uid);

const userSnap=
await get(userRef);

if(!userSnap.exists()) return;

const user=
userSnap.val();

const balance=
Number(user.balance||0);

if(balance<Number(withdraw.amount)){

alert("Insufficient User Balance");

return;

}

await update(userRef,{

balance:
balance-
Number(withdraw.amount),

totalWithdraws:
Number(user.totalWithdraws||0)+
Number(withdraw.amount)

});

await update(requestRef,{

status:"Approved",

approvedAt:Date.now()

});

alert("Withdraw Approved");

}

// ======================================
// REJECT
// ======================================

async function rejectWithdraw(id){

if(!confirm("Reject Withdraw?")) return;

await update(

ref(db,"withdrawRequests/"+id),

{

status:"Rejected",

rejectedAt:Date.now()

}

);

alert("Withdraw Rejected");

}

// ======================================
// BUTTONS
// ======================================

function activateWithdrawButtons(){

document
.querySelectorAll(".approveWithdraw")
.forEach(btn=>{

btn.onclick=()=>{

approveWithdraw(

btn.dataset.id

);

};

});

document
.querySelectorAll(".rejectWithdraw")
.forEach(btn=>{

btn.onclick=()=>{

rejectWithdraw(

btn.dataset.id

);

};

});

}

// ======================================
// START
// ======================================

loadWithdraws();

console.log("✅ Admin Part 4 Loaded");

// ======================================
// ADMIN.JS - PART 5
// PAGE NAVIGATION
// ======================================

// MENU LINKS
const menuLinks = document.querySelectorAll(".menu-link");

// SECTIONS
const sections = {
    dashboard: document.getElementById("dashboardSection"),
    deposits: document.getElementById("depositSection"),
    withdraws: document.getElementById("withdrawSection"),
    users: document.getElementById("usersSection"),
    transactions: document.getElementById("transactionsSection"),
    settings: document.getElementById("settingsSection")
};

// SHOW PAGE
function showPage(page) {

    // HIDE ALL SECTIONS
    Object.values(sections).forEach(section => {
        if (section) {
            section.style.display = "none";
            section.classList.remove("active");
        }
    });

    // REMOVE ACTIVE MENU
    menuLinks.forEach(link => {
        link.classList.remove("active");
    });

    // SHOW CURRENT PAGE
    if (sections[page]) {
        sections[page].style.display = "block";
        sections[page].classList.add("active");
    }

    // ACTIVATE MENU
    const activeLink = document.querySelector(
        `.menu-link[data-page="${page}"]`
    );

    if (activeLink) {
        activeLink.classList.add("active");
    }

}

// MENU CLICK
menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        const page = link.dataset.page;

        showPage(page);

    });

});

// QUICK ACTION BUTTONS
document.getElementById("openDeposits")?.addEventListener("click", () => {
    showPage("deposits");
});

document.getElementById("openWithdraws")?.addEventListener("click", () => {
    showPage("withdraws");
});

document.getElementById("openUsers")?.addEventListener("click", () => {
    showPage("users");
});

document.getElementById("openSettings")?.addEventListener("click", () => {
    showPage("settings");
});

// DEFAULT PAGE
showPage("dashboard");

console.log("✅ Admin Part 5 Loaded");

                          
// ======================================
// ADMIN.JS - PART 6
// PAGE NAVIGATION
// ======================================

const menuLinks = document.querySelectorAll(".menu-link");
const sections = document.querySelectorAll(".page-section");

// Function yo kwerekana page imwe
function showSection(sectionId) {

    sections.forEach(section => {
        section.style.display = "none";
        section.classList.remove("active");
    });

    const selected = document.getElementById(sectionId);

    if (selected) {
        selected.style.display = "block";
        selected.classList.add("active");
    }

    menuLinks.forEach(link => {
        link.classList.remove("active");
    });

}

// Sidebar Navigation
menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        const page = link.dataset.page;

        link.classList.add("active");

        switch (page) {

            case "dashboard":
                showSection("dashboardSection");
                break;

            case "deposits":
                showSection("depositSection");
                break;

            case "withdraws":
                showSection("withdrawSection");
                break;

            case "users":
                showSection("usersSection");
                break;

            case "transactions":
                showSection("transactionsSection");
                break;

            case "settings":
                showSection("settingsSection");
                break;

        }

        // Mobile sidebar ifunge nyuma yo gukanda
        if (window.innerWidth < 900) {
            sidebar?.classList.remove("active");
        }

    });

});

// Quick Action Buttons
document.getElementById("openDeposits")?.addEventListener("click", () => {
    showSection("depositSection");
});

document.getElementById("openWithdraws")?.addEventListener("click", () => {
    showSection("withdrawSection");
});

document.getElementById("openUsers")?.addEventListener("click", () => {
    showSection("usersSection");
});

document.getElementById("openSettings")?.addEventListener("click", () => {
    showSection("settingsSection");
});

// Default Page
showSection("dashboardSection");

console.log("✅ Admin Part 6 Loaded");

// ======================================
// ADMIN.JS - PART 7
// USERS MANAGEMENT
// ======================================

// ---------- ELEMENTS ----------

const usersContainer =
document.getElementById("usersContainer");

const allUsers =
document.getElementById("allUsers");

const activeUsers =
document.getElementById("activeUsers");

const blockedUsers =
document.getElementById("blockedUsers");

const userSearch =
document.getElementById("userSearch");

// ======================================
// LOAD USERS
// ======================================

function loadUsers() {

    onValue(ref(db, "users"), (snapshot) => {

        if (!usersContainer) return;

        usersContainer.innerHTML = "";

        let total = 0;
        let active = 0;
        let blocked = 0;

        if (!snapshot.exists()) {

            usersContainer.innerHTML = `

            <div class="empty-state">

                <h3>No Users Found</h3>

            </div>

            `;

            return;

        }

        snapshot.forEach((child) => {

            const user = child.val();

            total++;

            if (user.status === "Blocked") {

                blocked++;

            } else {

                active++;

            }

            usersContainer.innerHTML += `

            <div class="user-card">

                <h3>${user.fullName || "Unknown User"}</h3>

                <p><b>Email:</b> ${user.email || "-"}</p>

                <p><b>Phone:</b> ${user.phone || "-"}</p>

                <p><b>Balance:</b>
                ${Number(user.balance || 0).toLocaleString()} RWF
                </p>

                <p><b>VIP:</b>
                ${user.vipPlan || "None"}
                </p>

                <div class="action-buttons">

                    <button
                    class="viewUserBtn"
                    data-id="${child.key}">

                        View

                    </button>

                </div>

            </div>

            `;

        });

        if (allUsers)
            allUsers.textContent = total;

        if (activeUsers)
            activeUsers.textContent = active;

        if (blockedUsers)
            blockedUsers.textContent = blocked;

        activateUserButtons();

    });

}

// ======================================
// SEARCH USERS
// ======================================

userSearch?.addEventListener("keyup", () => {

    const keyword =
    userSearch.value.toLowerCase();

    document
    .querySelectorAll(".user-card")
    .forEach(card => {

        if (
            card.innerText
            .toLowerCase()
            .includes(keyword)
        ) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

});

// ======================================
// VIEW BUTTON
// ======================================

function activateUserButtons() {

    document
    .querySelectorAll(".viewUserBtn")
    .forEach(btn => {

        btn.onclick = () => {

            openUserModal(
                btn.dataset.id
            );

        };

    });

}

// ======================================
// START
// ======================================

loadUsers();

console.log("✅ Admin Part 7 Loaded");

    
