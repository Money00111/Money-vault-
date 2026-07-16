// ======================================
// FIREBASE CONFIG
// Money Vault
// Realtime Database Version
// ======================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-storage.js";

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
// INITIALIZE
// ======================================

const app = initializeApp(firebaseConfig);

// ======================================
// SERVICES
// ======================================

const auth = getAuth(app);

const db = getDatabase(app);

const storage = getStorage(app);

// ======================================
// EXPORTS
// ======================================

export {

    app,

    auth,

    db,

    storage

};
