import { db } from "./firebase.js";
import { ref, onValue, get, update } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

const auth = getAuth();

onAuthStateChanged(auth, (user) => {

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    const userRef = ref(db, "users/" + user.uid);

    onValue(userRef, (snapshot) => {

        const data = snapshot.val();

        if (!data) return;

        document.getElementById("welcomeUser").innerText =
            "Hello, " + data.name + " 👋";

        document.getElementById("balanceValue").innerText =
            (data.balance || 0) + " RWF";

        const profileName =
            document.getElementById("profileName");

        if (profileName) {
            profileName.innerText = data.name;
        }

    });

});
// 👇 user reference (urashobora guhindura userId nyuma ya login)
const userId = "user1";
const userRef = ref(db, "users/" + userId);

// ===== LIVE DASHBOARD UPDATE =====
onValue(userRef, (snapshot) => {
    const data = snapshot.val();

    if (!data) return;

    document.getElementById("balanceValue").innerText = data.balance + " RWF";
    document.getElementById("welcomeUser").innerText = "Hello, " + data.name + " 👋";
});

// ===== DEPOSIT =====
window.deposit = async function () {
    const amount = Number(document.getElementById("depositAmount").value);

    if (!amount || amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    const snapshot = await get(userRef);
    const data = snapshot.val();

    await update(userRef, {
        balance: (data.balance || 0) + amount
    });

    document.getElementById("depositAmount").value = "";
    alert("Deposit successful ✅");
};

// ===== WITHDRAW =====
window.withdraw = async function () {
    const amount = Number(document.getElementById("withdrawAmount").value);

    if (!amount || amount <= 0) {
        alert("Enter valid amount");
        return;
    }

    const snapshot = await get(userRef);
    const data = snapshot.val();

    if (data.balance < amount) {
        alert("Insufficient balance ⚠️");
        return;
    }

    await update(userRef, {
        balance: data.balance - amount
    });

    document.getElementById("withdrawAmount").value = "";
    alert("Withdraw successful 💰");
};
