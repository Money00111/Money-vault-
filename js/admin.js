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
