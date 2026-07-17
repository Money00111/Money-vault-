// ======================================
// ADMIN.JS - PART 1
// AUTHENTICATION + SETUP
// Money Vault
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

// ======================================
// AUTHENTICATION
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";

        return;

    }

    // Admin Email Check
    if (user.email !== ADMIN_EMAIL) {

        alert("Access Denied!");

        await signOut(auth);

        window.location.href = "dashboard.html";

        return;

    }

    currentAdmin = user;

    try {

        const snapshot = await get(
            ref(db, "users/" + user.uid)
        );

        if (snapshot.exists()) {

            const data = snapshot.val();

            if (adminName) {

                adminName.textContent =
                    data.fullName || "Administrator";

            }

        } else {

            if (adminName) {

                adminName.textContent = "Administrator";

            }

        }

    } catch (error) {

        console.error(error);

    }

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

    console.log("✅ Admin Logged In");

});

// ======================================
// SIDEBAR
// ======================================

menuBtn?.addEventListener("click", () => {

    sidebar?.classList.toggle("active");

});

// ======================================
// LOGOUT
// ======================================

logoutBtn?.addEventListener("click", async (e) => {

    e.preventDefault();

    const ok = confirm("Logout from Admin Panel?");

    if (!ok) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// PAGE ANIMATION
// ======================================

window.addEventListener("load", () => {

    document.body.style.opacity = "0";

    setTimeout(() => {

        document.body.style.transition = "opacity .4s";

        document.body.style.opacity = "1";

    }, 100);

});

// ======================================
// HIDE LOADING
// ======================================

window.addEventListener("load", () => {

    setTimeout(() => {

        if (loadingScreen) {

            loadingScreen.style.display = "none";

        }

    }, 800);

});

// ======================================
// READY
// ======================================

console.log("=================================");
console.log(" Money Vault Admin Ready ");
console.log(" Authentication Connected ");
console.log(" Admin Email Verified ");
console.log(" Realtime Database Connected ");
console.log("=================================");

