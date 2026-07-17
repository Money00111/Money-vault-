// ======================================
// DEPOSIT.JS - PART 1
// AUTHENTICATION + SETUP
// Money Vault
// ======================================

import { auth, db, storage } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

// ======================================
// CURRENT USER
// ======================================

let currentUser = null;

// ======================================
// ELEMENTS
// ======================================

const loadingScreen = document.getElementById("loadingScreen");

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const logoutBtn = document.getElementById("logoutBtn");

const depositForm = document.getElementById("depositForm");

const paymentProof = document.getElementById("paymentProof");
const imagePreview = document.getElementById("imagePreview");

const paymentDate = document.getElementById("paymentDate");

const copyMTN = document.getElementById("copyMTN");
const copyAirtel = document.getElementById("copyAirtel");

// ======================================
// AUTH
// ======================================

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

    const ok = confirm("Logout from Money Vault?");

    if (!ok) return;

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        alert(error.message);

    }

});

// ======================================
// COPY MTN NUMBER
// ======================================

copyMTN?.addEventListener("click", async () => {

    const number = document.getElementById("mtnNumber").innerText;

    await navigator.clipboard.writeText(number);

    alert("MTN Number Copied");

});

// ======================================
// COPY AIRTEL NUMBER
// ======================================

copyAirtel?.addEventListener("click", async () => {

    const number = document.getElementById("airtelNumber").innerText;

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
// DEFAULT DATE & TIME
// ======================================

if (paymentDate) {

    const now = new Date();

    const local = new Date(
        now.getTime() -
        now.getTimezoneOffset() * 60000
    );

    paymentDate.value =
        local.toISOString().slice(0, 16);

}

// ======================================
// READY
// ======================================

console.log("==================================");
console.log(" Deposit Part 1 Ready ");
console.log(" Firebase Authentication OK ");
console.log(" Firebase Storage OK ");
console.log(" Realtime Database OK ");
console.log("==================================");

    // ======================================
// DEPOSIT.JS - PART 2
// SUBMIT DEPOSIT
// ======================================

depositForm?.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!currentUser) {

        alert("Please login first.");

        return;

    }

    const submitBtn =
        document.querySelector(".submit-btn");

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

    // ==========================
    // VALIDATION
    // ==========================

    if (amount < 1000) {

        alert("Minimum Deposit is 1,000 RWF.");

        return;

    }

    if (paymentMethod === "") {

        alert("Select payment method.");

        return;

    }

    if (senderPhone === "") {

        alert("Enter sender phone number.");

        return;

    }

    if (transactionId === "") {

        alert("Enter transaction ID.");

        return;

    }

    if (!file) {

        alert("Upload payment screenshot.");

        return;

    }

    try {

        submitBtn.disabled = true;

        submitBtn.innerHTML =
            "Uploading...";

        // ==========================
        // Upload Screenshot
        // ==========================

        const proofRef = storageRef(

            storage,

            "depositProofs/" +

            currentUser.uid +

            "/" +

            Date.now() +

            "_" +

            file.name

        );

        await uploadBytes(proofRef, file);

        const proofImage =
            await getDownloadURL(proofRef);

        // ==========================
        // Save Request
        // ==========================

        const depositRef =
            ref(db,
                "depositRequests/" +
                Date.now()
            );

        await set(depositRef, {

            id: depositRef.key || Date.now(),

            uid: currentUser.uid,

            email: currentUser.email,

            amount: amount,

            paymentMethod: paymentMethod,

            senderPhone: senderPhone,

            transactionId: transactionId,

            paymentDate: paymentDate,

            note: note,

            proofImage: proofImage,

            status: "Pending",

            createdAt: Date.now()

        });

        alert(
            "Deposit request submitted successfully."
        );

        depositForm.reset();

        imagePreview.src = "";

        imagePreview.style.display = "none";

        // Restore Date

        const now = new Date();

        const local = new Date(
            now.getTime() -
            now.getTimezoneOffset() * 60000
        );

        document.getElementById(
            "paymentDate"
        ).value =
            local.toISOString().slice(0,16);

    }

    catch (error) {

        console.error(error);

        alert(error.message);

    }

    finally {

        submitBtn.disabled = false;

        submitBtn.innerHTML =
            "Submit Deposit Request";

    }

});

console.log("✅ Deposit Part 2 Loaded");
