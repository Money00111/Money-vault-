import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  ref,
  set
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import { db } from "./firebase.js";

const auth = getAuth();

// Tabs
const loginTab = document.getElementById("loginTab");
const registerTab = document.getElementById("registerTab");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");

const message = document.getElementById("message");

// Switch Forms
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

// REGISTER
document.getElementById("registerBtn").onclick = async () => {

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
        displayName: name
      }
    );

    await set(
      ref(db, "users/" + userCredential.user.uid),
      {
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
      }
    );

    message.innerText =
      "Account created successfully ✅";

  } catch (error) {

    message.innerText =
      error.message;

  }

};

// LOGIN
document.getElementById("loginBtn").onclick = async () => {

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

    window.location.href =
      "dashboard.html";

  } catch (error) {

    message.innerText =
      error.message;

  }

};

// AUTO LOGIN CHECK
onAuthStateChanged(auth, (user) => {

  if (user) {
    console.log("Logged in:", user.email);
  }

});
