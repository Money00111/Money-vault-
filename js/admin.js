// ======================================
// ADMIN.JS PART 1
// IMPORTS + AUTH + NAVIGATION
// Money Vault
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

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
// ADMIN CONFIG
// ======================================

const ADMIN_EMAIL = "Niyigenaepizo9@gmail.com";

let currentAdmin = null;

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const sidebar = document.getElementById("sidebar");

const menuBtn = document.getElementById("menuBtn");

const logoutBtn = document.getElementById("logoutBtn");

const adminName = document.getElementById("adminName");

const menuLinks =
document.querySelectorAll(".menu-link");

const pageSections =
document.querySelectorAll(".page-section");

// ======================================
// SHOW PAGE
// ======================================

function openPage(pageName) {

    pageSections.forEach(section => {

        section.style.display = "none";

    });

    menuLinks.forEach(link => {

        link.classList.remove("active");

    });

    const page =
    document.getElementById(
        pageName + "Section"
    );

    if (page) {

        page.style.display = "block";

    }

    document
    .querySelector(`[data-page="${pageName}"]`)
    ?.classList.add("active");

    sidebar?.classList.remove("show");

}

// ======================================
// MENU LINKS
// ======================================

menuLinks.forEach(link => {

    link.addEventListener("click",(e)=>{

        e.preventDefault();

        openPage(link.dataset.page);

    });

});

// ======================================
// MOBILE MENU
// ======================================

menuBtn?.addEventListener("click",()=>{

    sidebar.classList.toggle("show");

});

// ======================================
// AUTH CHECK
// ======================================

onAuthStateChanged(auth, async(user)=>{

    if(!user){

        location.href="login.html";

        return;

    }

    if(
        !user.email ||
        user.email.toLowerCase()!=
        ADMIN_EMAIL.toLowerCase()
    ){

        alert("Access Denied");

        await signOut(auth);

        location.href="dashboard.html";

        return;

    }

    currentAdmin=user;

    try{

        const snap=
        await get(
            ref(db,"users/"+user.uid)
        );

        if(snap.exists()){

            const data=snap.val();

            adminName.textContent=
            data.fullName ||
            "Administrator";

        }else{

            adminName.textContent=
            "Administrator";

        }

    }catch(error){

        console.log(error);

        adminName.textContent=
        "Administrator";

    }

    if(loadingScreen){

        loadingScreen.style.display="none";

    }

    openPage("dashboard");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click",async()=>{

    if(!confirm("Logout Admin ?")) return;

    await signOut(auth);

    location.href="login.html";

});

console.log("✅ ADMIN PART 1 LOADED");

// ======================================
// ADMIN.JS PART 2
// DASHBOARD STATISTICS
// ======================================

// ---------- ELEMENTS ----------

const totalUsers =
document.getElementById("totalUsers");

const totalDeposits =
document.getElementById("totalDeposits");

const totalPending =
document.getElementById("totalPending");

const totalApproved =
document.getElementById("totalApproved");

const totalRejected =
document.getElementById("totalRejected");

const totalAmount =
document.getElementById("totalAmount");

// ======================================
// LOAD DASHBOARD
// ======================================

function loadDashboardStats() {

    // USERS

    onValue(
        ref(db, "users"),
        (snapshot) => {

            let users = 0;

            if (snapshot.exists()) {

                snapshot.forEach(() => {

                    users++;

                });

            }

            if (totalUsers) {

                totalUsers.textContent =
                users.toLocaleString();

            }

        }
    );

    // DEPOSITS

    onValue(
        ref(db, "depositRequests"),
        (snapshot) => {

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

                    if (data.status === "Pending") {

                        pending++;

                    }

                    if (data.status === "Approved") {

                        approved++;

                    }

                    if (data.status === "Rejected") {

                        rejected++;

                    }

                });

            }

            if (totalDeposits) {

                totalDeposits.textContent =
                deposits.toLocaleString();

            }

            if (totalPending) {

                totalPending.textContent =
                pending.toLocaleString();

            }

            if (totalApproved) {

                totalApproved.textContent =
                approved.toLocaleString();

            }

            if (totalRejected) {

                totalRejected.textContent =
                rejected.toLocaleString();

            }

            if (totalAmount) {

                totalAmount.textContent =
                amount.toLocaleString() +
                " RWF";

            }

        }
    );

}

// ======================================
// START DASHBOARD
// ======================================

loadDashboardStats();

console.log("✅ ADMIN PART 2 LOADED");


// ======================================
// ADMIN.JS PART 3
// LOAD DEPOSIT REQUESTS
// ======================================

// ---------- ELEMENTS ----------

const depositContainer =
document.getElementById("depositRequests");

const emptyDeposit =
document.getElementById("emptyDeposit");

// ======================================
// LOAD DEPOSITS
// ======================================

function loadDeposits() {

    onValue(
        ref(db, "depositRequests"),
        (snapshot) => {

            if (!depositContainer) return;

            depositContainer.innerHTML = "";

            if (!snapshot.exists()) {

                if (emptyDeposit) {

                    emptyDeposit.style.display = "block";

                }

                return;

            }

            if (emptyDeposit) {

                emptyDeposit.style.display = "none";

            }

            snapshot.forEach((child) => {

                const id = child.key;

                const data = child.val();

                depositContainer.innerHTML += `

<div class="request-card">

<div class="request-top">

<h3>${Number(data.amount || 0).toLocaleString()} RWF</h3>

<span class="status ${String(data.status || "Pending").toLowerCase()}">

${data.status || "Pending"}

</span>

</div>

<p><strong>Name:</strong> ${data.fullName || "-"}</p>

<p><strong>Email:</strong> ${data.email || "-"}</p>

<p><strong>Phone:</strong> ${data.senderPhone || "-"}</p>

<p><strong>Method:</strong> ${data.method || "-"}</p>

<p><strong>Transaction ID:</strong> ${data.transactionId || "-"}</p>

<div class="action-buttons">

<button
class="approveBtn"
data-id="${id}">

<i class="fa-solid fa-check"></i>

Approve

</button>

<button
class="rejectBtn"
data-id="${id}">

<i class="fa-solid fa-xmark"></i>

Reject

</button>

<button
class="viewProof"
data-image="${data.proofImage || ""}">

<i class="fa-solid fa-image"></i>

Screenshot

</button>

<button
class="copyTransaction"
data-code="${data.transactionId || ""}">

<i class="fa-solid fa-copy"></i>

Copy ID

</button>

</div>

</div>

`;

            });

            activateDepositButtons();

        }

    );

}

// ======================================
// START
// ======================================

loadDeposits();

console.log("✅ ADMIN PART 3 LOADED");

// ======================================
// ADMIN.JS PART 4
// DEPOSIT ACTION BUTTONS
// ======================================

// ---------- MODAL ----------

const proofModal =
document.getElementById("proofModal");

const proofImage =
document.getElementById("proofImage");

const closeProof =
document.getElementById("closeProof");

// ======================================
// ACTIVATE BUTTONS
// ======================================

function activateDepositButtons() {

    // APPROVE

    document.querySelectorAll(".approveBtn")
    .forEach(button => {

        button.onclick = async () => {

            const id = button.dataset.id;

            if (!confirm("Approve this deposit?")) return;

            const depositRef =
            ref(db, "depositRequests/" + id);

            const snap =
            await get(depositRef);

            if (!snap.exists()) return;

            const deposit =
            snap.val();

            await update(depositRef, {

                status: "Approved"

            });

            if (deposit.uid) {

                const userRef =
                ref(db, "users/" + deposit.uid);

                const userSnap =
                await get(userRef);

                if (userSnap.exists()) {

                    const user =
                    userSnap.val();

                    const balance =
                    Number(user.balance || 0);

                    const deposits =
                    Number(user.totalDeposits || 0);

                    await update(userRef, {

                        balance:
                        balance + Number(deposit.amount || 0),

                        totalDeposits:
                        deposits + Number(deposit.amount || 0)

                    });

                }

            }

            alert("Deposit Approved");

        };

    });

    // REJECT

    document.querySelectorAll(".rejectBtn")
    .forEach(button => {

        button.onclick = async () => {

            const id =
            button.dataset.id;

            if (!confirm("Reject this deposit?")) return;

            await update(

                ref(db, "depositRequests/" + id),

                {

                    status: "Rejected"

                }

            );

            alert("Deposit Rejected");

        };

    });

    // VIEW SCREENSHOT

    document.querySelectorAll(".viewProof")
    .forEach(button => {

        button.onclick = () => {

            const image =
            button.dataset.image;

            if (!image) {

                alert("No Screenshot");

                return;

            }

            proofImage.src = image;

            proofModal.style.display = "flex";

        };

    });

    // COPY TRANSACTION ID

    document.querySelectorAll(".copyTransaction")
    .forEach(button => {

        button.onclick = async () => {

            await navigator.clipboard.writeText(

                button.dataset.code

            );

            alert("Transaction ID Copied");

        };

    });

}

// ======================================
// CLOSE MODAL
// ======================================

closeProof?.addEventListener("click", () => {

    proofModal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if (e.target === proofModal) {

        proofModal.style.display = "none";

    }

});

console.log("✅ ADMIN PART 4 LOADED");

// ======================================
// ADMIN.JS PART 5
// LOAD WITHDRAW REQUESTS
// ======================================

// ---------- ELEMENTS ----------

const withdrawContainer =
document.getElementById("withdrawRequests");

const emptyWithdraw =
document.getElementById("emptyWithdraw");

// ======================================
// LOAD WITHDRAW REQUESTS
// ======================================

function loadWithdraws() {

    onValue(

        ref(db, "withdrawRequests"),

        (snapshot) => {

            if (!withdrawContainer) return;

            withdrawContainer.innerHTML = "";

            if (!snapshot.exists()) {

                if (emptyWithdraw) {

                    emptyWithdraw.style.display = "block";

                }

                return;

            }

            if (emptyWithdraw) {

                emptyWithdraw.style.display = "none";

            }

            const list = [];

            snapshot.forEach((child) => {

                list.unshift({

                    id: child.key,

                    ...child.val()

                });

            });

            list.forEach((data) => {

                withdrawContainer.innerHTML += `

<div class="request-card">

<div class="request-top">

<h3>

${Number(data.amount || 0).toLocaleString()} RWF

</h3>

<span class="status ${String(data.status || "Pending").toLowerCase()}">

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

${data.phone || "-"}

</p>

<p>

<strong>Method:</strong>

${data.method || "-"}

</p>

<p>

<strong>Account:</strong>

${data.accountNumber || "-"}

</p>

<div class="action-buttons">

<button
class="approveWithdrawBtn"
data-id="${data.id}">

<i class="fa-solid fa-check"></i>

Approve

</button>

<button
class="rejectWithdrawBtn"
data-id="${data.id}">

<i class="fa-solid fa-xmark"></i>

Reject

</button>

<button
class="viewWithdrawBtn"
data-id="${data.id}">

<i class="fa-solid fa-eye"></i>

View

</button>

</div>

</div>

`;

            });

            activateWithdrawButtons();

        }

    );

}

// ======================================
// START
// ======================================

loadWithdraws();

console.log("✅ ADMIN PART 5 LOADED");

// ======================================
// ADMIN.JS PART 6
// WITHDRAW ACTIONS
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

// ======================================
// BUTTONS
// ======================================

function activateWithdrawButtons() {

    // ---------- APPROVE ----------

    document
    .querySelectorAll(".approveWithdrawBtn")
    .forEach(button => {

        button.onclick = async () => {

            const id = button.dataset.id;

            if (!confirm("Approve this withdraw?")) return;

            const withdrawRef =
            ref(db, "withdrawRequests/" + id);

            const snap =
            await get(withdrawRef);

            if (!snap.exists()) return;

            const data = snap.val();

            await update(withdrawRef, {

                status: "Approved"

            });

            if (data.uid) {

                const userRef =
                ref(db, "users/" + data.uid);

                const userSnap =
                await get(userRef);

                if (userSnap.exists()) {

                    const user =
                    userSnap.val();

                    const balance =
                    Number(user.balance || 0);

                    const totalWithdraws =
                    Number(user.totalWithdraws || 0);

                    await update(userRef, {

                        balance:
                        balance - Number(data.amount || 0),

                        totalWithdraws:
                        totalWithdraws +
                        Number(data.amount || 0)

                    });

                }

            }

            alert("Withdraw Approved");

        };

    });

    // ---------- REJECT ----------

    document
    .querySelectorAll(".rejectWithdrawBtn")
    .forEach(button => {

        button.onclick = async () => {

            const id = button.dataset.id;

            if (!confirm("Reject this withdraw?")) return;

            await update(

                ref(db, "withdrawRequests/" + id),

                {

                    status: "Rejected"

                }

            );

            alert("Withdraw Rejected");

        };

    });

    // ---------- VIEW DETAILS ----------

    document
    .querySelectorAll(".viewWithdrawBtn")
    .forEach(button => {

        button.onclick = async () => {

            const id = button.dataset.id;

            const snap =
            await get(
                ref(db, "withdrawRequests/" + id)
            );

            if (!snap.exists()) return;

            const data = snap.val();

            modalUser.textContent =
            data.fullName || "-";

            modalEmail.textContent =
            data.email || "-";

            modalPhone.textContent =
            data.phone || "-";

            modalAmount.textContent =
            Number(data.amount || 0).toLocaleString() +
            " RWF";

            modalMethod.textContent =
            data.method || "-";

            modalStatus.textContent =
            data.status || "Pending";

            withdrawModal.style.display = "flex";

        };

    });

}

// ======================================
// CLOSE MODAL
// ======================================

closeWithdrawModal?.addEventListener("click", () => {

    withdrawModal.style.display = "none";

});

window.addEventListener("click", (e) => {

    if (e.target === withdrawModal) {

        withdrawModal.style.display = "none";

    }

});

console.log("✅ ADMIN PART 6 LOADED");

// ======================================
// ADMIN.JS PART 7
// LOAD USERS
// ======================================

// ---------- ELEMENTS ----------

const usersContainer =
document.getElementById("usersContainer");

const emptyUsers =
document.getElementById("emptyUsers");

const allUsers =
document.getElementById("allUsers");

const activeUsers =
document.getElementById("activeUsers");

const blockedUsers =
document.getElementById("blockedUsers");

// ======================================
// LOAD USERS
// ======================================

function loadUsers() {

    onValue(

        ref(db, "users"),

        (snapshot) => {

            if (!usersContainer) return;

            usersContainer.innerHTML = "";

            let total = 0;
            let active = 0;
            let blocked = 0;

            if (!snapshot.exists()) {

                emptyUsers.style.display = "block";

                allUsers.textContent = "0";
                activeUsers.textContent = "0";
                blockedUsers.textContent = "0";

                return;

            }

            emptyUsers.style.display = "none";

            const list = [];

            snapshot.forEach((child) => {

                list.unshift({

                    uid: child.key,

                    ...child.val()

                });

            });

            list.forEach((user) => {

                total++;

                if (user.status === "Blocked") {

                    blocked++;

                } else {

                    active++;

                }

                usersContainer.innerHTML += `

<div class="user-card">

<div class="user-header">

<i class="fa-solid fa-user"></i>

<h3>

${user.fullName || "Unknown User"}

</h3>

</div>

<p>

<strong>Email:</strong>

${user.email || "-"}

</p>

<p>

<strong>Phone:</strong>

${user.phone || "-"}

</p>

<p>

<strong>Balance:</strong>

${Number(user.balance || 0).toLocaleString()} RWF

</p>

<p>

<strong>VIP:</strong>

${user.vipPlan || "None"}

</p>

<p>

<strong>Status:</strong>

<span class="${user.status === "Blocked"
? "status rejected"
: "status approved"}">

${user.status || "Active"}

</span>

</p>

<button
class="viewUserBtn"
data-id="${user.uid}">

<i class="fa-solid fa-eye"></i>

View Details

</button>

</div>

`;

            });

            allUsers.textContent = total;
            activeUsers.textContent = active;
            blockedUsers.textContent = blocked;

            activateUserButtons();

        }

    );

}

// ======================================
// USER BUTTONS
// ======================================

function activateUserButtons() {

    document
    .querySelectorAll(".viewUserBtn")
    .forEach(button => {

        button.onclick = () => {

            openUserModal(

                button.dataset.id

            );

        };

    });

}

// ======================================
// START
// ======================================

loadUsers();

console.log("✅ ADMIN PART 7 LOADED");


     // ======================================
// ADMIN.JS PART 8
// USER DETAILS + BLOCK / ACTIVATE
// ======================================

// ---------- ELEMENTS ----------

const userModal =
document.getElementById("userModal");

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

const userSearch =
document.getElementById("userSearch");

// ======================================
// CURRENT USER
// ======================================

let selectedUserId = null;

// ======================================
// OPEN USER MODAL
// ======================================

async function openUserModal(uid){

    selectedUserId = uid;

    try{

        const snap =
        await get(
            ref(db,"users/"+uid)
        );

        if(!snap.exists()){

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

        if(user.status === "Blocked"){

            blockUserBtn.style.display = "none";

            activateUserBtn.style.display = "inline-block";

        }else{

            blockUserBtn.style.display = "inline-block";

            activateUserBtn.style.display = "none";

        }

        userModal.style.display = "flex";

    }catch(error){

        console.error(error);

        alert(error.message);

    }

}

// ======================================
// CLOSE USER MODAL
// ======================================

closeUserModal?.addEventListener("click",()=>{

    userModal.style.display="none";

});

window.addEventListener("click",(e)=>{

    if(e.target===userModal){

        userModal.style.display="none";

    }

});

// ======================================
// BLOCK USER
// ======================================

blockUserBtn?.addEventListener("click",async()=>{

    if(!selectedUserId) return;

    if(!confirm("Block this user?")) return;

    await update(

        ref(db,"users/"+selectedUserId),

        {

            status:"Blocked"

        }

    );

    alert("User Blocked Successfully");

    userModal.style.display="none";

});

// ======================================
// ACTIVATE USER
// ======================================

activateUserBtn?.addEventListener("click",async()=>{

    if(!selectedUserId) return;

    if(!confirm("Activate this user?")) return;

    await update(

        ref(db,"users/"+selectedUserId),

        {

            status:"Active"

        }

    );

    alert("User Activated Successfully");

    userModal.style.display="none";

});

// ======================================
// SEARCH USERS
// ======================================

userSearch?.addEventListener("keyup",()=>{

    const value =
    userSearch.value.toLowerCase();

    document
    .querySelectorAll(".user-card")
    .forEach(card=>{

        card.style.display =
        card.innerText
        .toLowerCase()
        .includes(value)
        ? "block"
        : "none";

    });

});

console.log("✅ ADMIN PART 8 LOADED");           
