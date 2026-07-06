// ======================================
// PROFILE.JS - FULL CLEAN VERSION
// Firebase Auth + RTDB + Storage + UI
// ======================================

import { auth, db, storage } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
  ref as sRef,
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

const darkModeToggle = document.getElementById("darkMode");

// ======================================
// SIDEBAR TOGGLE
// ======================================
menuBtn?.addEventListener("click", () => {
  sidebar.classList.toggle("active");
});

// ======================================
// LOGOUT
// ======================================
logoutBtn?.addEventListener("click", async (e) => {
  e.preventDefault();

  if (!confirm("Urashaka gusohoka?")) return;

  try {
    await signOut(auth);
    window.location.href = "login.html";
  } catch (err) {
    alert(err.message);
  }
});

// ======================================
// AUTH STATE
// ======================================
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  await loadProfile(user);

  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 700);
});

// ======================================
// LOAD PROFILE
// ======================================
async function loadProfile(user) {
  try {
    const snap = await get(ref(db, "users/" + user.uid));

    if (!snap.exists()) return;

    const data = snap.val();

    // Header
    fullName.textContent = data.fullName || "User";
    userEmail.textContent = user.email;

    // Wallet
    balance.textContent = (data.balance || 0).toLocaleString() + " RWF";
    bonus.textContent = (data.bonus || 0).toLocaleString() + " RWF";
    referralBonus.textContent = (data.referralBonus || 0).toLocaleString() + " RWF";

    // VIP
    vipLevel.textContent = data.vip || "VIP 0";
    vipCard.textContent = data.vip || "VIP 0";

    // Stats
    totalDeposit.textContent = (data.totalDeposit || 0).toLocaleString() + " RWF";
    totalWithdraw.textContent = (data.totalWithdraw || 0).toLocaleString() + " RWF";
    totalTransactions.textContent = data.totalTransactions || 0;

    // Account
    accountId.textContent = user.uid.slice(0, 12);
    joinDate.textContent = new Date(user.metadata.creationTime).toLocaleDateString();

    // Form
    nameInput.value = data.fullName || "";
    phoneInput.value = data.phone || "";
    emailInput.value = user.email;
    countryInput.value = data.country || "Rwanda";
    addressInput.value = data.address || "";

    // Photo
    if (data.photoURL) {
      profilePhoto.src = data.photoURL;
    }

  } catch (err) {
    console.error(err);
    alert("Ntibishobotse gupakira profile.");
  }
}

// ======================================
// SAVE PROFILE
// ======================================
const profileForm = document.getElementById("profileForm");

profileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) return;

  const fullNameVal = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (fullNameVal.length < 3) {
    return alert("Andika amazina yuzuye neza.");
  }

  if (phone.length < 10) {
    return alert("Nimero ya telephone siyo.");
  }

  try {
    await update(ref(db, "users/" + user.uid), {
      fullName: fullNameVal,
      phone,
      country: countryInput.value,
      address: addressInput.value.trim(),
      updatedAt: Date.now()
    });

    alert("Profile yavuguruwe neza!");
  } catch (err) {
    alert(err.message);
  }
});

// ======================================
// PROFILE PHOTO UPLOAD (FIREBASE STORAGE)
// ======================================
photoInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  const user = auth.currentUser;

  if (!file || !user) return;

  const storageRef = sRef(storage, "profilePhotos/" + user.uid);

  const uploadTask = uploadBytesResumable(storageRef, file);

  uploadTask.on(
    "state_changed",
    null,
    (error) => {
      console.error(error);
      alert("Upload yanze.");
    },
    async () => {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

      profilePhoto.src = downloadURL;

      await update(ref(db, "users/" + user.uid), {
        photoURL: downloadURL
      });

      alert("Ifoto ya profile yashyizweho!");
    }
  );
});

// ======================================
// DARK MODE
// ======================================
darkModeToggle?.addEventListener("change", () => {
  document.body.classList.toggle("dark");

  localStorage.setItem(
    "darkMode",
    document.body.classList.contains("dark")
  );
});

// Load saved dark mode
if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark");
  if (darkModeToggle) darkModeToggle.checked = true;
}

// ======================================
// EDIT BUTTON
// ======================================
document.getElementById("editProfileBtn")?.addEventListener("click", () => {
  nameInput.focus();
});

// ======================================
// CANCEL BUTTON
// ======================================
document.querySelector(".cancel-btn")?.addEventListener("click", () => {
  location.reload();
});

console.log("✅ Profile JS Loaded Successfully");
