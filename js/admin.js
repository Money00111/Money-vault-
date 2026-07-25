// ======================================
// ADMIN.JS - PART 1
// Money Vault Admin Panel
// ======================================

import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


// ======================================
// DOM ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const adminName = document.getElementById("adminName");
const adminEmail = document.getElementById("adminEmail");

const logoutBtn = document.getElementById("logoutBtn");


// ======================================
// ADMIN AUTH CHECK
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "admin-login.html";
        return;

    }

    try {

        const adminRef = ref(db, "admins/" + user.uid);

        const snap = await get(adminRef);

        if (!snap.exists()) {

            alert("Access Denied!");

            await signOut(auth);

            window.location.href = "login.html";

            return;

        }

        const admin = snap.val();

        adminName.textContent =
            admin.name || "Administrator";

        adminEmail.textContent =
            user.email;

        loadingScreen.style.display = "none";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

});


// ======================================
// SIDEBAR NAVIGATION
// ======================================

const menuLinks =
document.querySelectorAll(".menu-link");

const sections =
document.querySelectorAll(".page-section");

menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        menuLinks.forEach(item =>
            item.classList.remove("active"));

        link.classList.add("active");

        const page =
            link.dataset.page;

        sections.forEach(section =>
            section.classList.remove("active"));

        document
            .getElementById(page + "Section")
            .classList.add("active");

        document
            .getElementById("pageTitle")
            .textContent =
            link.innerText.trim();

    });

});


// ======================================
// LOGOUT
// ======================================

logoutBtn.addEventListener("click", async () => {

    if (!confirm("Logout Admin?"))
        return;

    await signOut(auth);

    window.location.href =
        "admin-login.html";

});

            
