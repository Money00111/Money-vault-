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
push(ref(db, "depositRequests"));

        await set(id: depositRef.key,{

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

// ======================================
// DEPOSIT.JS - PART 3
// DEPOSIT HISTORY
// ======================================

// ======================================
// ELEMENTS
// ======================================

const historyList =
    document.getElementById("historyList");

const depositStatus =
    document.getElementById("depositStatus");

// ======================================
// LOAD DEPOSIT HISTORY
// ======================================

function loadDepositHistory(user) {

    const depositsRef =
        ref(db, "depositRequests");

    onValue(depositsRef, (snapshot) => {

        historyList.innerHTML = "";

        const deposits = [];

        if (snapshot.exists()) {

            snapshot.forEach((child) => {

                const data = child.val();

                if (data.uid === user.uid) {

                    deposits.unshift(data);

                }

            });

        }

        if (deposits.length === 0) {

            historyList.innerHTML = `

            <div class="history-card">

                <div>

                    <h3>No Deposits Yet</h3>

                    <p>Your deposit history will appear here.</p>

                </div>

            </div>

            `;

            depositStatus.textContent =
                "No Deposit Request";

            return;

        }

        deposits.forEach((data) => {

            let badge = "pending";

            if (data.status === "Approved") {

                badge = "approved";

            }

            if (data.status === "Rejected") {

                badge = "rejected";

            }

            const date = new Date(
                data.createdAt
            ).toLocaleString();

            historyList.innerHTML += `

            <div class="history-card">

                <div>

                    <h3>

                    ${Number(data.amount).toLocaleString()} RWF

                    </h3>

                    <p>

                    <strong>Method:</strong>

                    ${data.paymentMethod}

                    </p>

                    <p>

                    <strong>Sender:</strong>

                    ${data.senderPhone}

                    </p>

                    <p>

                    <strong>Transaction ID:</strong>

                    ${data.transactionId}

                    </p>

                    <p>

                    <strong>Date:</strong>

                    ${date}

                    </p>

                </div>

                <span class="${badge}">

                    ${data.status}

                </span>

            </div>

            `;

        });

        depositStatus.innerHTML =

            `<strong>${deposits[0].status}</strong>`;

    });

}

// ======================================
// START HISTORY
// ======================================

onAuthStateChanged(auth, (user) => {

    if (!user) return;

    loadDepositHistory(user);

});

console.log("✅ Deposit Part 3 Loaded Successfully");

// ======================================
// DEPOSIT.JS - PART 4
// FINAL FUNCTIONS
// ======================================

// ======================================
// TOAST MESSAGE
// ======================================

function showToast(message, color = "#2563eb") {

    const toast = document.createElement("div");

    toast.textContent = message;

    toast.style.position = "fixed";
    toast.style.top = "20px";
    toast.style.right = "20px";
    toast.style.background = color;
    toast.style.color = "#fff";
    toast.style.padding = "15px 20px";
    toast.style.borderRadius = "10px";
    toast.style.fontWeight = "600";
    toast.style.zIndex = "99999";

    document.body.appendChild(toast);

    setTimeout(() => {

        toast.remove();

    }, 3000);

}

// ======================================
// ONLINE / OFFLINE
// ======================================

window.addEventListener("online", () => {

    showToast(
        "Internet Connected",
        "#10b981"
    );

});

window.addEventListener("offline", () => {

    showToast(
        "No Internet Connection",
        "#ef4444"
    );

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
// GLOBAL ERROR
// ======================================

window.addEventListener("error", (event) => {

    console.error(event.error);

    if (loadingScreen) {

        loadingScreen.style.display = "none";

    }

});

// ======================================
// READY
// ======================================

console.log("=================================");
console.log(" Money Vault Deposit Ready ");
console.log(" Authentication Connected ");
console.log(" Realtime Database Connected ");
console.log(" Firebase Storage Connected ");
console.log(" Deposit History Ready ");
console.log(" Deposit Upload Ready ");
console.log("=================================");
