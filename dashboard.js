import { db } from "./firebase.js";

import {
  ref,
  onValue,
  get,
  update,
  push,
  set
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

const auth = getAuth();

const ADMIN_EMAIL = "SHYIRAMO_EMAIL_YAWE";

let currentUserRef = null;

onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  currentUserRef = ref(db, "users/" + user.uid);

  if (user.email === ADMIN_EMAIL) {

    const adminMenu =
      document.getElementById("adminMenu");

    if (adminMenu) {
      adminMenu.style.display = "block";
    }

  }

  onValue(currentUserRef, (snapshot) => {

    const data = snapshot.val();

    if (!data) return;

    const welcomeUser =
      document.getElementById("welcomeUser");

    const profileName =
      document.getElementById("profileName");

    const balanceValue =
      document.getElementById("balanceValue");

    const homeBalance =
      document.getElementById("homeBalance");

    if (welcomeUser) {
      welcomeUser.innerText =
        "Hello, " + data.name + " 👋";
    }

    if (profileName) {
      profileName.innerText =
        data.name;
    }

    if (balanceValue) {
      balanceValue.innerText =
        (data.balance || 0) + " RWF";
    }

    if (homeBalance) {
      homeBalance.innerText =
        (data.balance || 0);
    }

  });

});
