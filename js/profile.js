// ======================================
// PROFILE.JS - PART 1
// Money Vault
// ======================================

import { auth, db, storage } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
    ref as storageRef,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// ======================================
// ELEMENTS
// ======================================

const sidebar = document.getElementById("sidebar");
const menuBtn = document.getElementById("menuBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loadingScreen = document.getElementById("loadingScreen");

const profilePhoto = document.getElementById("profilePhoto");
const photoInput = document.getElementById("photoInput");

const fullName = document.getElementById("fullName");
const userEmail = document.getElementById("userEmail");

const balance = document.getElementById("balance");
const bonus = document.getElementById("bonus");
const referralBonus = document.getElementById("referralBonus");

const vipLevel = document.getElementById("vipLevel");
const vipCard = document.getElementById("vipCard");

const totalDeposit = document.getElementById("totalDeposit");
const totalWithdraw = document.getElementById("totalWithdraw");
const totalTransactions = document.getElementById("totalTransactions");

const accountId = document.getElementById("accountId");
const joinDate = document.getElementById("joinDate");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const emailInput = document.getElementById("email");
const countryInput = document.getElementById("country");
const addressInput = document.getElementById("address");

const profileForm = document.getElementById("profileForm");
const darkModeToggle = document.getElementById("darkMode");

// ======================================
// USER
// ======================================

let currentUser = null;
let userData = {};

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

    if (!confirm("Are you sure you want to logout?")) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// AUTH
// ======================================

onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "login.html";
        return;

    }

    currentUser = user;

    try {

        await loadProfile(user);
} catch (error) {

    console.error("Profile Error:", error);

    alert(error.message);

} finally {

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

}

});

console.log("Profile Part 1 Loaded");

// ======================================
// PROFILE.JS - PART 2
// LOAD PROFILE
// ======================================

async function loadProfile(user) {

    const userRef = ref(db, "users/" + user.uid);

    const snapshot = await get(userRef);

if (!snapshot.exists()) {

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

    alert("User profile not found.");

    return;
}

    userData = snapshot.val();

    // ==========================
    // HEADER
    // ==========================

    if (fullName)
        fullName.textContent = userData.fullName || "Money Vault User";

    if (userEmail)
        userEmail.textContent = user.email || "";

    // ==========================
    // WALLET
    // ==========================

    if (balance)
        balance.textContent =
            Number(userData.balance || 0).toLocaleString() + " RWF";

    if (bonus)
        bonus.textContent =
            Number(userData.bonus || 0).toLocaleString() + " RWF";

    if (referralBonus)
        referralBonus.textContent =
            Number(userData.referralBonus || 0).toLocaleString() + " RWF";

    // ==========================
    // VIP
    // ==========================

    const vip = userData.vip || "VIP 0";

    if (vipLevel)
        vipLevel.textContent = vip;

    if (vipCard)
        vipCard.textContent = vip;

    // ==========================
    // ACCOUNT STATS
    // ==========================

    if (totalDeposit)
        totalDeposit.textContent =
            Number(userData.totalDeposit || 0).toLocaleString() + " RWF";

    if (totalWithdraw)
        totalWithdraw.textContent =
            Number(userData.totalWithdraw || 0).toLocaleString() + " RWF";

    if (totalTransactions)
        totalTransactions.textContent =
            Number(userData.totalTransactions || 0);

    // ==========================
    // ACCOUNT INFO
    // ==========================

    if (accountId)
        accountId.textContent = user.uid.substring(0, 12);

    if (joinDate)
        joinDate.textContent =
            new Date(user.metadata.creationTime).toLocaleDateString();

    // ==========================
    // FORM
    // ==========================

    if (nameInput)
        nameInput.value = userData.fullName || "";

    if (phoneInput)
        phoneInput.value = userData.phone || "";

    if (emailInput)
        emailInput.value = user.email || "";

    if (countryInput)
        countryInput.value = userData.country || "🇷🇼 Rwanda";

    if (addressInput)
        addressInput.value = userData.address || "";

    // ==========================
    // PROFILE PHOTO
    // ==========================

    if (profilePhoto && userData.photoURL) {

        profilePhoto.src = userData.photoURL;

    }

}

console.log("Profile Part 2 Loaded Successfully");

// ======================================
// PROFILE.JS - PART 3
// SAVE PROFILE + PHOTO + DARK MODE
// ======================================

// ======================================
// SAVE PROFILE
// ======================================

profileForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) return;

    const fullNameValue = nameInput.value.trim();
    const phoneValue = phoneInput.value.trim();

    if (fullNameValue.length < 3) {

        alert("Enter your full name.");

        return;

    }

    try {

        await update(ref(db, "users/" + currentUser.uid), {

            fullName: fullNameValue,
            phone: phoneValue,
            country: countryInput.value,
            address: addressInput.value.trim(),
            updatedAt: Date.now()

        });

        if (fullName)
            fullName.textContent = fullNameValue;

        alert("Profile updated successfully.");

    } catch (error) {

        console.error(error);

        alert(error.message);

    }

});

// ======================================
// PROFILE PHOTO
// ======================================

photoInput?.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file || !currentUser) return;

    const fileRef = storageRef(
        storage,
        "profilePhotos/" + currentUser.uid
    );

    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(

        "state_changed",

        null,

        (error) => {

            console.error(error);

            alert("Photo upload failed.");

        },

        async () => {

            const url = await getDownloadURL(uploadTask.snapshot.ref);

            await update(
                ref(db, "users/" + currentUser.uid),
                {
                    photoURL: url
                }
            );

            if (profilePhoto)
                profilePhoto.src = url;

            alert("Profile photo updated.");

        }

    );

});

// ======================================
// DARK MODE
// ======================================

if (localStorage.getItem("darkMode") === "true") {

    document.body.classList.add("dark");

    if (darkModeToggle)
        darkModeToggle.checked = true;

}

darkModeToggle?.addEventListener("change", () => {

    document.body.classList.toggle("dark");

    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark")
    );

});

// ======================================
// EDIT BUTTON
// ======================================

document.getElementById("editProfileBtn")
?.addEventListener("click", () => {

    nameInput?.focus();

});

// ======================================
// CANCEL
// ======================================

document.querySelector(".cancel-btn")
?.addEventListener("click", () => {

    loadProfile(currentUser);

});

// ======================================
// SCROLL TO TOP
// ======================================

const scrollBtn = document.getElementById("scrollTopBtn");

window.addEventListener("scroll", () => {

    if (!scrollBtn) return;

    if (window.scrollY > 300) {

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

console.log("✅ Profile Part 3 Loaded Successfully");

        // ======================================
// PROFILE.JS - PART 4
// REFERRAL SYSTEM
// ======================================

// ELEMENTS

const referralCode = document.getElementById("referralCode");
const referralLink = document.getElementById("referralLink");
const copyReferralBtn = document.getElementById("copyReferralBtn");
const totalReferrals = document.getElementById("totalReferrals");
const shareWhatsappBtn = document.getElementById("shareWhatsappBtn");

// ======================================
// LOAD REFERRAL
// ======================================

function loadReferralData() {

    if (!userData) return;

    const code = userData.referralCode || "";

    if (referralCode) {

        referralCode.textContent = code;

    }

    if (referralLink) {

        referralLink.value =
            window.location.origin +
            "/register.html?ref=" +
            code;

    }

    if (totalReferrals) {

        totalReferrals.textContent =
            Number(userData.referralCount || 0);

    }

}

// ======================================
// COPY REFERRAL
// ======================================

copyReferralBtn?.addEventListener("click", async () => {

    try {

        await navigator.clipboard.writeText(
            referralLink.value
        );

        alert("Referral link copied successfully.");

    } catch (error) {

        alert("Copy failed.");

    }

});

// ======================================
// SHARE WHATSAPP
// ======================================

shareWhatsappBtn?.addEventListener("click", () => {

    const text =

`Join Money Vault using my referral link:

${referralLink.value}

Earn rewards after registration.`;

    window.open(

        "https://wa.me/?text=" +
        encodeURIComponent(text),

        "_blank"

    );

});

// ======================================
// REFRESH REFERRAL
// ======================================

loadReferralData();

console.log("Referral System Ready");
