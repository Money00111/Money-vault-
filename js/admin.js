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
    updatePassword
}
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue
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

    // ======================================
// ADMIN.JS - PART 8
// USER DETAILS + BLOCK / ACTIVATE
// ======================================

// ---------- ELEMENTS ----------

const userModal = document.getElementById("userModal");

const closeUserModal =
document.getElementById("closeUserModal");

const userFullName =
document.getElementById("userFullName");

const userEmail =
document.getElementById("userEmail");

const userPhone =
document.getElementById("userPhone");

const userBalance =
document.getElementById("userBalance");

const userDeposits =
document.getElementById("userDeposits");

const userWithdraws =
document.getElementById("userWithdraws");

const userVip =
document.getElementById("userVip");

const userJoined =
document.getElementById("userJoined");

const blockUserBtn =
document.getElementById("blockUserBtn");

const activateUserBtn =
document.getElementById("activateUserBtn");

// ======================================
// CURRENT USER
// ======================================

let selectedUserId = null;

// ======================================
// OPEN USER MODAL
// ======================================

async function openUserModal(uid) {

    selectedUserId = uid;

    try {

        const snap = await get(
            ref(db, "users/" + uid)
        );

        if (!snap.exists()) {

            alert("User not found");

            return;

        }

        const user = snap.val();

        userFullName.textContent =
            user.fullName || "-";

        userEmail.textContent =
            user.email || "-";

        userPhone.textContent =
            user.phone || "-";

        userBalance.textContent =
            Number(user.balance || 0).toLocaleString() +
            " RWF";

        userDeposits.textContent =
            Number(user.totalDeposits || 0).toLocaleString() +
            " RWF";

        userWithdraws.textContent =
            Number(user.totalWithdraws || 0).toLocaleString() +
            " RWF";

        userVip.textContent =
            user.vipPlan || "None";

        userJoined.textContent =
            user.createdAt
            ? new Date(user.createdAt).toLocaleString()
            : "-";

        if (user.status === "Blocked") {

            blockUserBtn.style.display = "none";
            activateUserBtn.style.display = "inline-block";

        } else {

            blockUserBtn.style.display = "inline-block";
            activateUserBtn.style.display = "none";

        }

        userModal.style.display = "flex";

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// CLOSE MODAL
// ======================================

closeUserModal?.addEventListener("click", () => {

    userModal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if (e.target === userModal) {

        userModal.style.display = "none";

    }

});

// ======================================
// BLOCK USER
// ======================================

blockUserBtn?.addEventListener("click", async () => {

    if (!selectedUserId) return;

    if (!confirm("Block this user?")) return;

    await update(
        ref(db, "users/" + selectedUserId),
        {
            status: "Blocked"
        }
    );

    alert("User Blocked");

    userModal.style.display = "none";

});

// ======================================
// ACTIVATE USER
// ======================================

activateUserBtn?.addEventListener("click", async () => {

    if (!selectedUserId) return;

    if (!confirm("

        // ======================================
// ADMIN.JS - PART 9
// ACTIVATE USER + LOAD USERS
// ======================================

// ======================================
// ACTIVATE USER
// ======================================

activateUserBtn?.addEventListener("click", async () => {

    if (!selectedUserId) return;

    if (!confirm("Activate this user?")) return;

    try {

        await update(
            ref(db, "users/" + selectedUserId),
            {
                status: "Active"
            }
        );

        alert("User Activated");

        userModal.style.display = "none";

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ======================================
// USERS CONTAINER
// ======================================

const usersContainer =
document.getElementById("usersContainer");

const allUsers =
document.getElementById("allUsers");

const activeUsers =
document.getElementById("activeUsers");

const blockedUsers =
document.getElementById("blockedUsers");

const emptyUsers =
document.getElementById("emptyUsers");

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

            emptyUsers.style.display = "block";

            return;

        }

        emptyUsers.style.display = "none";

        snapshot.forEach((child) => {

            total++;

            const user = child.val();
            const uid = child.key;

            if (user.status === "Blocked") {

                blocked++;

            } else {

                active++;

            }

            usersContainer.innerHTML += `

            <div class="user-card">

                <h3>${user.fullName || "Unknown User"}</h3>

                <p>${user.email || "-"}</p>

                <p>${user.phone || "-"}</p>

                <p>

                    Balance:
                    <strong>
                    ${Number(user.balance || 0).toLocaleString()} RWF
                    </strong>

                </p>

                <span class="status ${user.status === "Blocked" ? "rejected" : "approved"}">

                    ${user.status || "Active"}

                </span>

                <button
                    class="viewUserBtn"
                    data-id="${uid}">

                    View Details

                </button>

            </div>

            `;

        });

        allUsers.textContent = total;
        activeUsers.textContent = active;
        blockedUsers.textContent = blocked;

        document
        .querySelectorAll(".viewUserBtn")
        .forEach(btn => {

            btn.onclick = () => {

                openUserModal(btn.dataset.id);

            };

        });

    });

}

// ======================================
// START USERS
// ======================================

loadUsers();

console.log("✅ Admin Part 9 Loaded");

    // ======================================
// ADMIN.JS - PART 10
// LOAD WITHDRAW REQUESTS
// ======================================

// ---------- ELEMENTS ----------

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

const emptyWithdraw =
document.getElementById("emptyWithdraw");

// ======================================
// LOAD WITHDRAW REQUESTS
// ======================================

function loadWithdrawRequests() {

    onValue(ref(db, "withdrawRequests"), (snapshot) => {

        if (!withdrawRequests) return;

        withdrawRequests.innerHTML = "";

        let total = 0;
        let pending = 0;
        let approved = 0;
        let rejected = 0;

        if (!snapshot.exists()) {

            emptyWithdraw.style.display = "block";

            withdrawCount.textContent = "0";
            withdrawPending.textContent = "0";
            withdrawApproved.textContent = "0";
            withdrawRejected.textContent = "0";

            return;

        }

        emptyWithdraw.style.display = "none";

        const requests = [];

        snapshot.forEach((child) => {

            requests.unshift({

                id: child.key,

                ...child.val()

            });

        });

        requests.forEach((data) => {

            total++;

            if (data.status === "Pending") pending++;
            if (data.status === "Approved") approved++;
            if (data.status === "Rejected") rejected++;

            withdrawRequests.innerHTML += `

            <div class="request-card">

                <h3>

                    ${Number(data.amount || 0).toLocaleString()} RWF

                </h3>

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
                    ${data.phone || "-"}

                </p>

                <p>

                    <strong>Method:</strong>
                    ${data.method || "-"}

                </p>

                <p>

                    <strong>Status:</strong>

                    <span class="${(data.status || "").toLowerCase()}">

                        ${data.status || "Pending"}

                    </span>

                </p>

                <div class="action-buttons">

                    <button
                    class="approveWithdrawBtn"
                    data-id="${data.id}">

                        Approve

                    </button>

                    <button
                    class="viewWithdrawBtn"
                    data-id="${data.id}">

                        View

                    </button>

                    <button
                    class="rejectWithdrawBtn"
                    data-id="${data.id}">

                        Reject

                    </button>

                </div>

            </div>

            `;

        });

        withdrawCount.textContent = total;
        withdrawPending.textContent = pending;
        withdrawApproved.textContent = approved;
        withdrawRejected.textContent = rejected;

        activateWithdrawButtons();

    });

}

// ======================================
// START
// ======================================

loadWithdrawRequests();

console.log("✅ Admin Part 10 Loaded");

        // ======================================
// ADMIN.JS - PART 11
// APPROVE + REJECT WITHDRAW
// ======================================

// ======================================
// APPROVE WITHDRAW
// ======================================

async function approveWithdraw(id) {

    if (!confirm("Approve this withdraw request?")) {
        return;
    }

    try {

        const withdrawRef =
        ref(db, "withdrawRequests/" + id);

        const withdrawSnap =
        await get(withdrawRef);

        if (!withdrawSnap.exists()) {

            alert("Withdraw request not found.");

            return;

        }

        const withdraw =
        withdrawSnap.val();

        if (withdraw.status === "Approved") {

            alert("Already Approved");

            return;

        }

        const userRef =
        ref(db, "users/" + withdraw.uid);

        const userSnap =
        await get(userRef);

        if (!userSnap.exists()) {

            alert("User not found.");

            return;

        }

        const user =
        userSnap.val();

        const balance =
        Number(user.balance || 0);

        const amount =
        Number(withdraw.amount || 0);

        if (balance < amount) {

            alert("Insufficient User Balance");

            return;

        }

        // UPDATE USER

        await update(userRef, {

            balance: balance - amount,

            totalWithdraws:
            Number(user.totalWithdraws || 0) + amount,

            totalTransactions:
            Number(user.totalTransactions || 0) + 1

        });

        // UPDATE REQUEST

        await update(withdrawRef, {

            status: "Approved",

            approvedAt: Date.now(),

            approvedBy:
            currentAdmin.email

        });

        alert("Withdraw Approved Successfully");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// REJECT WITHDRAW
// ======================================

async function rejectWithdraw(id) {

    if (!confirm("Reject this withdraw request?")) {
        return;
    }

    try {

        await update(

            ref(db, "withdrawRequests/" + id),

            {

                status: "Rejected",

                rejectedAt: Date.now(),

                rejectedBy:
                currentAdmin.email

            }

        );

        alert("Withdraw Rejected");

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// BUTTON EVENTS
// ======================================

function activateWithdrawButtons() {

    document
    .querySelectorAll(".approveWithdrawBtn")
    .forEach((btn) => {

        btn.onclick = () => {

            approveWithdraw(

                btn.dataset.id

            );

        };

    });

    document
    .querySelectorAll(".rejectWithdrawBtn")
    .forEach((btn) => {

        btn.onclick = () => {

            rejectWithdraw(

                btn.dataset.id

            );

        };

    });

}

console.log("✅ Admin Part 11 Loaded");                          

// ======================================
// ADMIN.JS - PART 12
// WITHDRAW DETAILS + SEARCH + FILTER
// ======================================

// ---------- ELEMENTS ----------

const withdrawModal =
document.getElementById("withdrawModal");

const closeWithdrawModal =
document.getElementById("closeWithdrawModal");

const modalUser =
document.getElementById("modalUser");

const modalEmail =
document.getElementById("modalEmail");

const modalPhone =
document.getElementById("modalPhone");

const modalAmount =
document.getElementById("modalAmount");

const modalMethod =
document.getElementById("modalMethod");

const modalStatus =
document.getElementById("modalStatus");

const withdrawSearch =
document.getElementById("withdrawSearch");

const withdrawFilter =
document.getElementById("withdrawFilter");

// ======================================
// VIEW WITHDRAW DETAILS
// ======================================

async function viewWithdraw(id) {

    try {

        const snap =
        await get(ref(db,
        "withdrawRequests/" + id));

        if (!snap.exists()) {

            alert("Withdraw not found");

            return;

        }

        const data = snap.val();

        modalUser.textContent =
        data.fullName || "-";

        modalEmail.textContent =
        data.email || "-";

        modalPhone.textContent =
        data.phone || "-";

        modalAmount.textContent =
        Number(data.amount || 0)
        .toLocaleString() + " RWF";

        modalMethod.textContent =
        data.method || "-";

        modalStatus.textContent =
        data.status || "Pending";

        withdrawModal.style.display =
        "flex";

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// CLOSE MODAL
// ======================================

closeWithdrawModal?.addEventListener("click",()=>{

    withdrawModal.style.display="none";

});

window.addEventListener("click",(e)=>{

    if(e.target===withdrawModal){

        withdrawModal.style.display="none";

    }

});

// ======================================
// VIEW BUTTONS
// ======================================

document.addEventListener("click",(e)=>{

    if(e.target.classList.contains("viewWithdrawBtn")){

        viewWithdraw(

            e.target.dataset.id

        );

    }

});

// ======================================
// SEARCH
// ======================================

withdrawSearch?.addEventListener("keyup",()=>{

    const keyword =
    withdrawSearch.value.toLowerCase();

    document
    .querySelectorAll("#withdrawRequests .request-card")
    .forEach(card=>{

        if(card.innerText
        .toLowerCase()
        .includes(keyword)){

            card.style.display="block";

        }else{

            card.style.display="none";

        }

    });

});

// ======================================
// FILTER
// ======================================

withdrawFilter?.addEventListener("change",()=>{

    const value =
    withdrawFilter.value;

    document
    .querySelectorAll("#withdrawRequests .request-card")
    .forEach(card=>{

        const status =
        card.querySelector("span")
        ?.innerText || "";

        if(
            value==="All" ||
            status===value
        ){

            card.style.display="block";

        }else{

            card.style.display="none";

        }

    });

});

// ======================================
// READY
// ======================================

console.log("✅ Admin Part 12 Loaded");

      // ======================================
// ADMIN.JS - PART 13
// TRANSACTION HISTORY
// ======================================

// ---------- ELEMENTS ----------

const transactionsContainer =
document.getElementById("transactionsContainer");

const transactionTotal =
document.getElementById("transactionTotal");

const transactionApproved =
document.getElementById("transactionApproved");

const transactionPending =
document.getElementById("transactionPending");

const transactionRejected =
document.getElementById("transactionRejected");

// ======================================
// LOAD TRANSACTIONS
// ======================================

function loadTransactions() {

    const allTransactions = [];

    // --------------------------
    // DEPOSITS
    // --------------------------

    onValue(ref(db,"depositRequests"),(snapshot)=>{

        allTransactions.length = 0;

        if(snapshot.exists()){

            snapshot.forEach((child)=>{

                allTransactions.push({

                    id:child.key,

                    type:"Deposit",

                    ...child.val()

                });

            });

        }

        loadWithdrawTransactions(allTransactions);

    });

}

// ======================================
// LOAD WITHDRAWS
// ======================================

function loadWithdrawTransactions(allTransactions){

    onValue(ref(db,"withdrawRequests"),(snapshot)=>{

        if(snapshot.exists()){

            snapshot.forEach((child)=>{

                allTransactions.push({

                    id:child.key,

                    type:"Withdraw",

                    ...child.val()

                });

            });

        }

        renderTransactions(allTransactions);

    });

}

// ======================================
// RENDER
// ======================================

function renderTransactions(list){

    if(!transactionsContainer) return;

    transactionsContainer.innerHTML="";

    let approved=0;
    let pending=0;
    let rejected=0;

    list.sort((a,b)=>

        (b.createdAt||0)-
        (a.createdAt||0)

    );

    list.forEach((data)=>{

        if(data.status==="Approved") approved++;

        if(data.status==="Pending") pending++;

        if(data.status==="Rejected") rejected++;

        transactionsContainer.innerHTML += `

        <div class="request-card">

            <h3>

            ${data.type}

            </h3>

            <p>

            Amount:
            ${Number(data.amount||0).toLocaleString()} RWF

            </p>

            <p>

            Email:
            ${data.email || "-"}

            </p>

            <p>

            Status:
            <strong>${data.status}</strong>

            </p>

            <p>

            Date:
            ${data.createdAt
            ? new Date(data.createdAt).toLocaleString()
            : "-"}

            </p>

        </div>

        `;

    });

    if(transactionTotal)
    transactionTotal.textContent=
    list.length;

    if(transactionApproved)
    transactionApproved.textContent=
    approved;

    if(transactionPending)
    transactionPending.textContent=
    pending;

    if(transactionRejected)
    transactionRejected.textContent=
    rejected;

}

// ======================================
// START
// ======================================

loadTransactions();

console.log("✅ Admin Part 13 Loaded");
    
// ======================================
// ADMIN.JS - PART 14
// TRANSACTION SEARCH + FILTER
// ======================================


// ---------- ELEMENTS ----------

const transactionSearch =
document.getElementById("transactionSearch");


const transactionFilter =
document.getElementById("transactionFilter");


// kubika transactions zose
let allTransactionData = [];


// ======================================
// UPDATE DATA FROM PART 13
// ======================================

function saveTransactionsData(data){

    allTransactionData = data;

    displayFilteredTransactions(
        allTransactionData
    );

}


// ======================================
// FILTER FUNCTION
// ======================================

function displayFilteredTransactions(data){


    if(!transactionsContainer) return;


    transactionsContainer.innerHTML="";


    data.forEach((transaction)=>{


        transactionsContainer.innerHTML += `


        <div class="request-card">


            <h3>

            <i class="fa-solid fa-clock-rotate-left"></i>

            ${transaction.type}

            </h3>


            <p>

            <b>Amount:</b>

            ${Number(transaction.amount || 0)
            .toLocaleString()} RWF

            </p>


            <p>

            <b>Email:</b>

            ${transaction.email || "-"}

            </p>


            <p>

            <b>Phone:</b>

            ${transaction.phone || "-"}

            </p>


            <p>

            <b>Status:</b>

            <strong>
            ${transaction.status || "Pending"}
            </strong>

            </p>


            <p>

            <b>Date:</b>

            ${
            transaction.createdAt
            ?
            new Date(transaction.createdAt)
            .toLocaleString()
            :
            "-"
            }

            </p>


        </div>


        `;


    });


}


// ======================================
// SEARCH
// ======================================


transactionSearch?.addEventListener(
"input",
()=>{


    const value =
    transactionSearch.value
    .toLowerCase();



    const filtered =
    allTransactionData.filter((item)=>{


        return (

            item.email
            ?.toLowerCase()
            .includes(value)

            ||

            item.phone
            ?.toLowerCase()
            .includes(value)


            ||

            item.type
            ?.toLowerCase()
            .includes(value)


            ||

            item.status
            ?.toLowerCase()
            .includes(value)


        );


    });



    displayFilteredTransactions(
        filtered
    );


});



// ======================================
// FILTER STATUS / TYPE
// ======================================


transactionFilter?.addEventListener(
"change",
()=>{


    const value =
    transactionFilter.value;



    let filtered =
    allTransactionData;



    if(value !== "All"){


        filtered =
        allTransactionData.filter(
        (item)=>{


            return (

            item.type === value

            ||

            item.status === value

            );


        });


    }



    displayFilteredTransactions(
        filtered
    );


});


// ======================================
// READY
// ======================================

console.log(
"✅ Admin Part 14 Loaded");

    // ======================================
// ADMIN.JS - PART 15
// SETTINGS MANAGEMENT
// ======================================

// ---------- ELEMENTS ----------

const settingsName =
document.getElementById("settingsName");

const settingsEmail =
document.getElementById("settingsEmail");

const settingsPhone =
document.getElementById("settingsPhone");

const profileForm =
document.getElementById("profileForm");

const fullNameInput =
document.getElementById("fullName");

const phoneInput =
document.getElementById("phone");

const saveProfileBtn =
document.getElementById("saveProfile");

const passwordForm =
document.getElementById("passwordForm");

const newPassword =
document.getElementById("newPassword");

const confirmPassword =
document.getElementById("confirmPassword");

const changePasswordBtn =
document.getElementById("changePassword");

// ======================================
// IMPORT
// ======================================


// ======================================
// LOAD PROFILE
// ======================================

async function loadAdminProfile() {

    if (!currentAdmin) return;

    try {

        const snap = await get(
            ref(db, "users/" + currentAdmin.uid)
        );

        if (!snap.exists()) return;

        const user = snap.val();

        settingsName.textContent =
        user.fullName || "Administrator";

        settingsEmail.textContent =
        user.email || "-";

        settingsPhone.textContent =
        user.phone || "-";

        fullNameInput.value =
        user.fullName || "";

        phoneInput.value =
        user.phone || "";

    }

    catch (error) {

        console.error(error);

    }

}

// ======================================
// UPDATE PROFILE
// ======================================

profileForm?.addEventListener("submit",
async (e)=>{

    e.preventDefault();

    try{

        await update(

            ref(db,"users/"+currentAdmin.uid),

            {

                fullName:
                fullNameInput.value.trim(),

                phone:
                phoneInput.value.trim()

            }

        );

        alert("Profile Updated");

        loadAdminProfile();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});

// ======================================
// CHANGE PASSWORD
// ======================================

passwordForm?.addEventListener("submit",
async(e)=>{

    e.preventDefault();

    if(

        newPassword.value !==
        confirmPassword.value

    ){

        alert("Passwords do not match");

        return;

    }

    if(newPassword.value.length < 6){

        alert("Minimum 6 characters");

        return;

    }

    try{

        await updatePassword(

            currentAdmin,

            newPassword.value

        );

        alert("Password Changed");

        passwordForm.reset();

    }

    catch(error){

        console.error(error);

        alert(error.message);

    }

});

// ======================================
// START
// ======================================

loadAdminProfile();

console.log("✅ Admin Part 15 Loaded");

    // ======================================
// ADMIN.JS - PART 16
// ADMIN ACTIVITY LOGS
// ======================================

// ---------- ELEMENTS ----------

const adminLogs =
document.getElementById("adminLogs");

const totalLogs =
document.getElementById("totalLogs");

// ======================================
// SAVE LOG
// ======================================

async function saveAdminLog(action, details) {

    if (!currentAdmin) return;

    try {

        const logId =
        Date.now().toString();

        await update(

            ref(db,
            "adminLogs/" + logId),

            {

                adminUid:
                currentAdmin.uid,

                adminEmail:
                currentAdmin.email,

                action:
                action,

                details:
                details,

                createdAt:
                Date.now()

            }

        );

    }

    catch(error){

        console.error(error);

    }

}

// ======================================
// LOAD LOGS
// ======================================

function loadAdminLogs(){

    if(!adminLogs) return;

    onValue(

        ref(db,"adminLogs"),

        (snapshot)=>{

            adminLogs.innerHTML="";

            let total=0;

            if(!snapshot.exists()){

                adminLogs.innerHTML=`

                <div class="empty-card">

                    <h3>No Activity Logs</h3>

                </div>

                `;

                if(totalLogs){

                    totalLogs.textContent="0";

                }

                return;

            }

            const logs=[];

            snapshot.forEach((child)=>{

                logs.unshift(child.val());

            });

            logs.forEach((log)=>{

                total++;

                adminLogs.innerHTML+=`

                <div class="request-card">

                    <h3>

                    ${log.action}

                    </h3>

                    <p>

                    ${log.details}

                    </p>

                    <p>

                    ${log.adminEmail}

                    </p>

                    <small>

                    ${
                    new Date(
                    log.createdAt
                    ).toLocaleString()
                    }

                    </small>

                </div>

                `;

            });

            if(totalLogs){

                totalLogs.textContent=total;

            }

        }

    );

}

// ======================================
// START
// ======================================

loadAdminLogs();

console.log("✅ Admin Part 16 Loaded");

    // ======================================
// ADMIN.JS - PART 17
// REALTIME NOTIFICATIONS
// ======================================

// ---------- ELEMENTS ----------

const notificationBadge =
document.getElementById("notificationBadge");

const notificationList =
document.getElementById("notificationList");

const notificationBtn =
document.getElementById("notificationBtn");

const notificationPanel =
document.getElementById("notificationPanel");

// ======================================
// COUNTERS
// ======================================

let lastDepositCount = 0;
let lastWithdrawCount = 0;

// ======================================
// LOAD NOTIFICATIONS
// ======================================

function loadNotifications() {

    // -------------------------
    // DEPOSITS
    // -------------------------

    onValue(ref(db, "depositRequests"), (snapshot) => {

        let pending = 0;

        if (notificationList) {

            notificationList.innerHTML = "";

        }

        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const data = child.val();

                if (data.status === "Pending") {

                    pending++;

                    notificationList.innerHTML += `

                    <div class="notification-item">

                        <i class="fa-solid fa-wallet"></i>

                        <div>

                            <strong>
                            New Deposit
                            </strong>

                            <p>

                            ${Number(data.amount || 0)
                            .toLocaleString()} RWF

                            </p>

                        </div>

                    </div>

                    `;

                }

            });

            if (snapshot.size > lastDepositCount &&
                lastDepositCount !== 0) {

                playNotificationSound();

            }

            lastDepositCount = snapshot.size;

        }

        updateNotificationBadge(pending);

    });

    // -------------------------
    // WITHDRAWS
    // -------------------------

    onValue(ref(db, "withdrawRequests"), (snapshot) => {

        let pending = 0;

        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const data = child.val();

                if (data.status === "Pending") {

                    pending++;

                    notificationList.innerHTML += `

                    <div class="notification-item">

                        <i class="fa-solid fa-money-bill-transfer"></i>

                        <div>

                            <strong>

                            New Withdraw

                            </strong>

                            <p>

                            ${Number(data.amount || 0)
                            .toLocaleString()} RWF

                            </p>

                        </div>

                    </div>

                    `;

                }

            });

            if (snapshot.size > lastWithdrawCount &&
                lastWithdrawCount !== 0) {

                playNotificationSound();

            }

            lastWithdrawCount = snapshot.size;

        }

        updateNotificationBadge();

    });

}

// ======================================
// UPDATE BADGE
// ======================================

function updateNotificationBadge() {

    const deposits =
    document.querySelectorAll(
    ".notification-item").length;

    if (!notificationBadge) return;

    notificationBadge.textContent = deposits;

    notificationBadge.style.display =
    deposits > 0 ? "flex" : "none";

}

// ======================================
// PANEL OPEN/CLOSE
// ======================================

notificationBtn?.addEventListener("click", () => {

    notificationPanel.classList.toggle("show");

});

// ======================================
// SOUND
// ======================================

function playNotificationSound() {

    const audio = new Audio(
    "sounds/notification.mp3"
    );

    audio.play().catch(() => {});

}

// ======================================
// CLOSE PANEL
// ======================================

window.addEventListener("click", (e) => {

    if (

        notificationPanel &&
        notificationBtn &&

        !notificationPanel.contains(e.target) &&
        !notificationBtn.contains(e.target)

    ) {

        notificationPanel.classList.remove("show");

    }

});

// ======================================
// START
// ======================================

loadNotifications();

console.log("✅ Admin Part 17 Loaded");

 // ======================================
// ADMIN.JS - PART 18
// BROWSER NOTIFICATIONS + HISTORY
// ======================================

// ======================================
// REQUEST PERMISSION
// ======================================

async function requestNotificationPermission() {

    if (!("Notification" in window)) {

        console.log("Browser Notifications Not Supported");

        return;

    }

    if (Notification.permission === "default") {

        await Notification.requestPermission();

    }

}

requestNotificationPermission();

// ======================================
// SHOW NOTIFICATION
// ======================================

function showBrowserNotification(title, body) {

    if (Notification.permission !== "granted") return;

    new Notification(title, {

        body: body,

        icon: "images/logo.png",

        badge: "images/logo.png"

    });

}

// ======================================
// SAVE NOTIFICATION
// ======================================

async function saveNotification(type, message) {

    try {

        const id = Date.now().toString();

        await update(

            ref(db, "notifications/" + id),

            {

                type: type,

                message: message,

                createdAt: Date.now(),

                admin: currentAdmin.email

            }

        );

    }

    catch (error) {

        console.error(error);

    }

}

// ======================================
// WATCH NEW DEPOSITS
// ======================================

let depositCounter = 0;

onValue(ref(db, "depositRequests"), (snapshot) => {

    if (!snapshot.exists()) return;

    if (snapshot.size > depositCounter && depositCounter !== 0) {

        showBrowserNotification(

            "New Deposit",

            "A new deposit request has been received."

        );

        saveNotification(

            "Deposit",

            "New Deposit Request"

        );

    }

    depositCounter = snapshot.size;

});

// ======================================
// WATCH NEW WITHDRAWS
// ======================================

let withdrawCounter = 0;

onValue(ref(db, "withdrawRequests"), (snapshot) => {

    if (!snapshot.exists()) return;

    if (snapshot.size > withdrawCounter && withdrawCounter !== 0) {

        showBrowserNotification(

            "New Withdraw",

            "A new withdraw request has been received."

        );

        saveNotification(

            "Withdraw",

            "New Withdraw Request"

        );

    }

    withdrawCounter = snapshot.size;

});

// ======================================
// LOAD NOTIFICATION HISTORY
// ======================================

function loadNotificationHistory() {

    if (!notificationList) return;

    onValue(

        ref(db, "notifications"),

        (snapshot) => {

            notificationList.innerHTML = "";

            if (!snapshot.exists()) {

                notificationList.innerHTML = `

                <div class="empty-card">

                    No Notifications

                </div>

                `;

                return;

            }

            const notifications = [];

            snapshot.forEach((child) => {

                notifications.unshift(child.val());

            });

            notifications.forEach((item) => {

                notificationList.innerHTML += `

                <div class="notification-item">

                    <strong>

                        ${item.type}

                    </strong>

                    <p>

                        ${item.message}

                    </p>

                    <small>

                        ${new Date(item.createdAt)
                        .toLocaleString()}

                    </small>

                </div>

                `;

            });

        }

    );

}

// ======================================
// START
// ======================================

loadNotificationHistory();

console.log("✅ Admin Part 18 Loaded"); 

    
// ======================================
// ADMIN.JS - PART 19
// ANALYTICS DASHBOARD
// ======================================

// ---------- ELEMENTS ----------

const analyticsBalance =
document.getElementById("analyticsBalance");

const analyticsDeposits =
document.getElementById("analyticsDeposits");

const analyticsWithdraws =
document.getElementById("analyticsWithdraws");

const analyticsProfit =
document.getElementById("analyticsProfit");

const analyticsToday =
document.getElementById("analyticsToday");

const analyticsMonth =
document.getElementById("analyticsMonth");

// ======================================
// LOAD ANALYTICS
// ======================================

function loadAnalytics(){

    let totalBalance = 0;
    let totalDeposits = 0;
    let totalWithdraws = 0;

    let todayDeposits = 0;
    let monthDeposits = 0;

    // USERS

    onValue(ref(db,"users"),(snapshot)=>{

        if(snapshot.exists()){

            snapshot.forEach((child)=>{

                const user = child.val();

                totalBalance +=
                Number(user.balance || 0);

            });

        }

        if(analyticsBalance){

            analyticsBalance.textContent =
            totalBalance.toLocaleString() + " RWF";

        }

    });

    // DEPOSITS

    onValue(ref(db,"depositRequests"),(snapshot)=>{

        totalDeposits = 0;
        todayDeposits = 0;
        monthDeposits = 0;

        if(snapshot.exists()){

            snapshot.forEach((child)=>{

                const item = child.val();

                if(item.status === "Approved"){

                    totalDeposits +=
                    Number(item.amount || 0);

                    const date =
                    new Date(item.createdAt || 0);

                    const now =
                    new Date();

                    if(
                        date.toDateString() ===
                        now.toDateString()
                    ){

                        todayDeposits +=
                        Number(item.amount || 0);

                    }

                    if(
                        date.getMonth() ===
                        now.getMonth()
                        &&
                        date.getFullYear() ===
                        now.getFullYear()
                    ){

                        monthDeposits +=
                        Number(item.amount || 0);

                    }

                }

            });

        }

        if(analyticsDeposits){

            analyticsDeposits.textContent =
            totalDeposits.toLocaleString() + " RWF";

        }

        if(analyticsToday){

            analyticsToday.textContent =
            todayDeposits.toLocaleString() + " RWF";

        }

        if(analyticsMonth){

            analyticsMonth.textContent =
            monthDeposits.toLocaleString() + " RWF";

        }

        updateProfit();

    });

    // WITHDRAWS

    onValue(ref(db,"withdrawRequests"),(snapshot)=>{

        totalWithdraws = 0;

        if(snapshot.exists()){

            snapshot.forEach((child)=>{

                const item = child.val();

                if(item.status === "Approved"){

                    totalWithdraws +=
                    Number(item.amount || 0);

                }

            });

        }

        if(analyticsWithdraws){

            analyticsWithdraws.textContent =
            totalWithdraws.toLocaleString() + " RWF";

        }

        updateProfit();

    });

    // PROFIT

    function updateProfit(){

        const profit =
        totalDeposits - totalWithdraws;

        if(analyticsProfit){

            analyticsProfit.textContent =
            profit.toLocaleString() + " R

        
