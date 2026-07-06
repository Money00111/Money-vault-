// ======================================
// FIREBASE CONFIG (FIXED)
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import {
  getAuth
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  getDatabase
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// CONFIG
// ======================================

const firebaseConfig = {
  apiKey: "AIzaSyC0ugw0iH2h00bJxxHq7qMRBvYYmFjPqCU",
  authDomain: "money-vault-c48d3.firebaseapp.com",
  databaseURL: "https://money-vault-c48d3-default-rtdb.firebaseio.com",
  projectId: "money-vault-c48d3",
  storageBucket: "money-vault-c48d3.appspot.com",
  messagingSenderId: "1068478656241",
  appId: "1:1068478656241:web:aacbcf12922a21fe784350"
};

// ======================================
// INIT
// ======================================

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getDatabase(app);

export { app, auth, db };
