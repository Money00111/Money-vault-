

  // ===============================
// DEPOSIT.JS - PART 1
// ===============================

import { app } from "./firebase.js";

import {
getAuth,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ===============================
// Authentication
// ===============================

onAuthStateChanged(auth,(user)=>{

if(!user){

window.location.href="login.html";

return;

}

console.log("Logged in:",user.email);

});

// ===============================
// Sidebar Toggle
// ===============================

const menuBtn=document.getElementById("menuBtn");

const sidebar=document.getElementById("sidebar");

if(menuBtn){

menuBtn.addEventListener("click",()=>{

sidebar.classList.toggle("active");

});

}

// ===============================
// Copy MTN Number
// ===============================

const copyMTN=document.getElementById("copyMTN");

if(copyMTN){

copyMTN.addEventListener("click",()=>{

const number=document
.getElementById("mtnNumber")
.innerText;

navigator.clipboard.writeText(number);

alert("MTN Number Copied Successfully");

});

}

// ===============================
// Copy Airtel Number
// ===============================

const copyAirtel=document.getElementById("copyAirtel");

if(copyAirtel){

copyAirtel.addEventListener("click",()=>{

const number=document
.getElementById("airtelNumber")
.innerText;

navigator.clipboard.writeText(number);

alert("Airtel Number Copied Successfully");

});

}

// ===============================
// Image Preview
// ===============================

const paymentProof=document
.getElementById("paymentProof");

const imagePreview=document
.getElementById("imagePreview");

if(paymentProof){

paymentProof.addEventListener("change",(e)=>{

const file=e.target.files[0];

if(!file) return;

const reader=new FileReader();

reader.onload=function(event){

imagePreview.src=event.target.result;

imagePreview.style.display="block";

};

reader.readAsDataURL(file);

});

}

// ===============================
// Default Date & Time
// ===============================

const paymentDate=document
.getElementById("paymentDate");

if(paymentDate){

const now=new Date();

const local=new Date(
now.getTime()-now.getTimezoneOffset()*60000
);

paymentDate.value=
local.toISOString().slice(0,16);

}

// ===============================
// DEPOSIT.JS - PART 2
// ===============================

import {
collection,
addDoc,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
ref,
uploadBytes,
getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Deposit Form

const depositForm = document.getElementById("depositForm");

depositForm.addEventListener("submit", async (e) => {

e.preventDefault();

const user = auth.currentUser;

if (!user) {
alert("Please login first.");
return;
}

// Form Values

const amount = document.getElementById("amount").value;

const paymentMethod =
document.getElementById("paymentMethod").value;

const senderPhone =
document.getElementById("senderPhone").value;

const transactionId =
document.getElementById("transactionId").value;

const paymentDate =
document.getElementById("paymentDate").value;

const note =
document.getElementById("note").value;

const file =
document.getElementById("paymentProof").files[0];

if (!file) {

alert("Please upload payment screenshot.");

return;

}

try {

// Loading Button

const submitBtn =
document.querySelector(".submit-btn");

submitBtn.disabled = true;

submitBtn.innerHTML =
"Uploading...";

// Upload Image

const imageRef = ref(
storage,
`deposits/${user.uid}/${Date.now()}_${file.name}`
);

await uploadBytes(imageRef, file);

const imageUrl =
await getDownloadURL(imageRef);

// Save Firestore

await addDoc(collection(db, "deposits"), {

userId: user.uid,

email: user.email,

amount: Number(amount),

paymentMethod,

senderPhone,

transactionId,

paymentDate,

note,

proofImage: imageUrl,

status: "Pending",

createdAt: serverTimestamp()

});

// Success

submitBtn.innerHTML =
"Deposit Submitted";

alert(
"Deposit request submitted successfully."
);

// Reset Form

depositForm.reset();

imagePreview.style.display = "none";

submitBtn.disabled = false;

submitBtn.innerHTML =
"Submit Deposit Request";

} catch (error) {

console.error(error);

alert(error.message);

const submitBtn =
document.querySelector(".submit-btn");

submitBtn.disabled = false;

submitBtn.innerHTML =
"Submit Deposit Request";

}

});
