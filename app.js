import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { db } from "./firebase.js";
import { ref, get, update } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { set, ref } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";
import { db } from "./firebase.js";
window.deposit = async function () {
    const userId = document.getElementById("userId").value;
    const amount = Number(document.getElementById("amount").value);

    const userRef = ref(db, "users/" + userId);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        let balance = snapshot.val().balance;

        await update(userRef, {
            balance: balance + amount
        });

        alert("Deposit successful ✅");
    } else {
        alert("User not found ❌");
    }
};

window.withdraw = async function () {
    const userId = document.getElementById("userId").value;
    const amount = Number(document.getElementById("amount").value);

    const userRef = ref(db, "users/" + userId);
    const snapshot = await get(userRef);

    if (snapshot.exists()) {
        let balance = snapshot.val().balance;

        if (balance >= amount) {
            await update(userRef, {
                balance: balance - amount
            });

            alert("Withdraw successful 💰");
        } else {
            alert("Not enough balance ⚠️");
        }
    } else {
        alert("User not found ❌");
    }
};
import {getAuth,createUserWithEmailAndPassword,signInWithEmailAndPassword,updateProfile,onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const firebaseConfig = {
apiKey: "AIzaSyC0ugw0iH2h00bJxxHq7qMRBvYYmFjPqCU",
authDomain: "money-vault-c48d3.firebaseapp.com",
projectId: "money-vault-c48d3",
storageBucket: "money-vault-c48d3.firebasestorage.app",
messagingSenderId: "1068478656241",
appId: "1:1068478656241:web:aacbcf12922a21fe784350",
measurementId: "G-0EQDFC7EK8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const message = document.getElementById("message");

loginTab.onclick = () => {
loginTab.classList.add("active");
registerTab.classList.remove("active");

loginForm.classList.remove("hidden");
registerForm.classList.add("hidden");
};

registerTab.onclick = () => {
registerTab.classList.add("active");
loginTab.classList.remove("active");

registerForm.classList.remove("hidden");
loginForm.classList.add("hidden");
};

document.getElementById("registerBtn").onclick =
async () => {

const name =
document.getElementById("registerName").value;

const email =
document.getElementById("registerEmail").value;

const password =
document.getElementById("registerPassword").value;

try {

const userCredential =
await createUserWithEmailAndPassword(
auth,
email,
password
);

await updateProfile(
userCredential.user,
{
displayName:name
}
);
await set(ref(db, "users/" + userCredential.user.uid), {
  name: name,
  email: email,
  balance: 0,
  totalDeposits: 0,
  totalWithdrawals: 0,
  vip: {
    plan: "None",
    dailyIncome: 0,
    daysLeft: 0
  },
  createdAt: Date.now()
});
message.innerText =
"Account created successfully";

}
catch(error){

message.innerText =
error.message;

}

};

document.getElementById("loginBtn").onclick =
async () => {

const email =
document.getElementById("loginEmail").value;

const password =
document.getElementById("loginPassword").value;

try {

await signInWithEmailAndPassword(
auth,
email,
password
);

message.innerText =
"Login successful";

window.location.href =
"dashboard.html";

}
catch(error){

message.innerText =
error.message;

}

};

onAuthStateChanged(auth,(user)=>{

if(user){

console.log(
"Logged in:",
user.email
);

}

});
