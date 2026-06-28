import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// 🔥 Firebase config (UZASHYIRAMO YOUR DATA)
const firebaseConfig = {
  apiKey: "AIzaSyC0ugw0iH2h00bJxxHq7qMRBvYYmFjPqCU",
  authDomain: "money-vault-c48d3.firebaseapp.com",
  databaseURL: "https://money-vault-c48d3-default-rtdb.firebaseio.com",
  projectId: "money-vault-c48d3",
  storageBucket: "money-vault-c48d3.firebasestorage.app",
  messagingSenderId: "1068478656241",
  appId: "1:1068478656241:web:06b698f04f3382a9784350",
  measurementId: "G-FBBMY3L8YF"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
