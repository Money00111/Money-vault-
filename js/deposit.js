// ======================================
// DEPOSIT.JS - PART 1
// Authentication + Setup
// Realtime Database Version
// ======================================

import { auth, db, storage } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    push,
    set,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// ======================================
// ELEMENTS
// ======================================

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

const depositForm = document.getElementById("depositForm");

const paymentProof = document.getElementById("paymentProof");
const imagePreview = document.getElementById("imagePreview");

const copyMTN = document.getElementById("copyMTN");
const copyAirtel = document.getElementById("copyAirtel");

const loadingScreen = document.getElementById("loadingScreen");

// ======================================
// AUTH
// ======================================

let currentUser = null;

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;

    if (loadingScreen) {
        loadingScreen.style.display = "none";
    }

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

    if (!confirm("Logout from Money Vault?")) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// COPY MTN
// ======================================

copyMTN?.addEventListener("click", async () => {

    const number =
        document.getElementById("mtnNumber").innerText;

    await navigator.clipboard.writeText(number);

    alert("MTN Number Copied");

});

// ======================================
// COPY AIRTEL
// ======================================

copyAirtel?.addEventListener("click", async () => {

    const number =
        document.getElementById("airtelNumber").innerText;

    await navigator.clipboard.writeText(number);

    alert("Airtel Number Copied");

});

// ======================================
// IMAGE PREVIEW
// ======================================

paymentProof?.addEventListener("change", (e) => {

    const file = e.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {

        imagePreview.src = event.target.result;

        imagePreview.style.display = "block";

    };

    reader.readAsDataURL(file);

});

// ======================================
// DEFAULT DATE
// ======================================

const paymentDate =
document.getElementById("paymentDate");

if (paymentDate) {

    const now = new Date();

    const local = new Date(
        now.getTime() -
        now.getTimezoneOffset() * 60000
    );

    paymentDate.value =
        local.toISOString().slice(0,16);

}

console.log("✅ Deposit Part 1 Loaded");
// ======================================
// DEPOSIT.JS - PART 2
// SUBMIT DEPOSIT
// Realtime Database
// ======================================

depositForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {
        alert("Please login first.");
        return;
    }

    const amount =
        Number(document.getElementById("amount").value);

    const paymentMethod =
        document.getElementById("paymentMethod").value;

    const senderPhone =
        document.getElementById("senderPhone").value.trim();

    const transactionId =
        document.getElementById("transactionId").value.trim();

    const paymentDate =
        document.getElementById("paymentDate").value;

    const note =
        document.getElementById("note").value.trim();

    const file =
        paymentProof.files[0];

    if (amount < 1000) {

        alert("Minimum deposit is 1,000 RWF.");

        return;

    }

    if (!file) {

        alert("Upload payment screenshot.");

        return;

    }

    const submitBtn =
        document.querySelector(".submit-btn");

    try {

        submitBtn.disabled = true;

        submitBtn.innerHTML = "Uploading...";

        // ==========================
        // Upload Image
        // ==========================

        const imageRef = storageRef(

            storage,

            "depositProofs/" +

            currentUser.uid +

            "/" +

            Date.now() +

            "_" +

            file.name

        );

        await uploadBytes(imageRef, file);

        const imageUrl =
            await getDownloadURL(imageRef);

        // ==========================
        // Save Deposit
        // ==========================

        const depositRef =
            push(ref(db, "depositRequests"));

        await set(depositRef, {

            id: depositRef.key,

            uid: currentUser.uid,

            email: currentUser.email,

            amount: amount,

            paymentMethod: paymentMethod,

            senderPhone: senderPhone,

            transactionId: transactionId,

            paymentDate: paymentDate,

            note: note,

            proofImage: imageUrl,

            status: "Pending",

            createdAt: Date.now()

        });

        alert("Deposit request submitted successfully.");

        depositForm.reset();

        imagePreview.style.display = "none";

        submitBtn.disabled = false;

        submitBtn.innerHTML =
            "Submit Deposit Request";

    }

    catch (error) {

        console.error(error);

        alert(error.message);

        submitBtn.disabled = false;

        submitBtn.innerHTML =
            "Submit Deposit Request";

    }

});

console.log("✅ Deposit Part 2 Loaded");
