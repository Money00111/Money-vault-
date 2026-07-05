// ===========================
// FIREBASE IMPORTS
// ===========================
import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-auth.js";

import {
    doc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.1/firebase-firestore.js";

// ===========================
// ELEMENTS
// ===========================
const fullName = document.getElementById("fullName");
const userEmail = document.getElementById("userEmail");
const balanceEl = document.getElementById("balance");
const bonusEl = document.getElementById("bonus");
const referralEl = document.getElementById("referralBonus");
const vipLevelEl = document.getElementById("vipLevel");
const vipCardEl = document.getElementById("vipCard");
const profilePhoto = document.getElementById("profilePhoto");
const photoInput = document.getElementById("photoInput");

const logoutBtn = document.getElementById("logoutBtn");
const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");

// ===========================
// RESPONSIVE SIDEBAR TOGGLE
// ===========================
menuBtn?.addEventListener("click", () => {
    sidebar.classList.toggle("active");
});

// ===========================
// AUTH CHECK
// ===========================
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    userEmail.textContent = user.email;

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();

        // PROFILE DATA
        fullName.textContent = data.fullName || "User";
        balanceEl.textContent = (data.balance || 0) + " RWF";
        bonusEl.textContent = (data.bonus || 0) + " RWF";
        referralEl.textContent = (data.referralBonus || 0) + " RWF";

        vipLevelEl.textContent = data.vipLevel || "VIP 0";
        vipCardEl.textContent = data.vipLevel || "VIP 0";

        // PROFILE IMAGE
        if (data.photoURL) {
            profilePhoto.src = data.photoURL;
        }

        // SETTINGS
        document.getElementById("twoFA").checked = data.twoFA || false;
        document.getElementById("notifications").checked = data.notifications ?? true;
    }
});

// ===========================
// PROFILE PHOTO UPLOAD (base64 simple version)
// ===========================
photoInput?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
        const base64 = reader.result;
        profilePhoto.src = base64;

        const user = auth.currentUser;
        if (!user) return;

        const userRef = doc(db, "users", user.uid);

        await updateDoc(userRef, {
            photoURL: base64
        });
    };

    reader.readAsDataURL(file);
});

// ===========================
// LOGOUT
// ===========================
logoutBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    await signOut(auth);
    window.location.href = "login.html";
});

// ===========================
// UPDATE PROFILE INFO
// ===========================
document.getElementById("profileForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return;

    const name = document.getElementById("name").value;
    const phone = document.getElementById("phone").value;
    const country = document.getElementById("country").value;
    const address = document.getElementById("address").value;

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
        fullName: name,
        phone,
        country,
        address
    });

    alert("Profile updated successfully!");
});

// ===========================
// SECURITY SETTINGS (TOGGLES)
// ===========================
document.getElementById("twoFA")?.addEventListener("change", async (e) => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
        twoFA: e.target.checked
    });
});

document.getElementById("notifications")?.addEventListener("change", async (e) => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user.uid);

    await updateDoc(userRef, {
        notifications: e.target.checked
    });
});

// ===========================
// SCROLL TO TOP BUTTON
// ===========================
const scrollBtn = document.getElementById("scrollTop");

window.addEventListener("scroll", () => {
    if (window.scrollY > 200) {
        scrollBtn.style.display = "flex";
    } else {
        scrollBtn.style.display = "none";
    }
});

scrollBtn?.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// ===========================
// SCREEN STABILITY FIX (IMPORTANT)
// ===========================
function fixLayout() {
    const width = window.innerWidth;

    if (width < 600) {
        sidebar?.classList.remove("active");
    }
}

window.addEventListener("resize", fixLayout);
fixLayout();
