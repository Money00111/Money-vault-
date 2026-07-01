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

// ===============================
// DEPOSIT.JS - PART 3
// Deposit History + Status
// ===============================

import {
collection,
query,
where,
orderBy,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// HTML Elements

const historyList =
document.getElementById("historyList");

const depositStatus =
document.getElementById("depositStatus");

// ===============================
// Load Deposit History
// ===============================

function loadDepositHistory(user){

const q = query(

collection(db,"deposits"),

where("userId","==",user.uid),

orderBy("createdAt","desc")

);

onSnapshot(q,(snapshot)=>{

historyList.innerHTML="";

if(snapshot.empty){

historyList.innerHTML=`

<div class="history-card">

<div>

<h3>No Deposits Yet</h3>

<p>Your deposit history will appear here.</p>

</div>

</div>

`;

depositStatus.textContent="No Deposit Request";

return;

}

snapshot.forEach((doc)=>{

const data=doc.data();

let badgeClass="pending";

if(data.status==="Approved"){

badgeClass="approved";

}

if(data.status==="Rejected"){

badgeClass="rejected";

}

const date=data.createdAt?.toDate()

? data.createdAt.toDate().toLocaleString()

: "Waiting...";

historyList.innerHTML+=`

<div class="history-card">

<div>

<h3>${Number(data.amount).toLocaleString()} RWF</h3>

<p><strong>Method:</strong> ${data.paymentMethod}</p>

<p><strong>Transaction ID:</strong> ${data.transactionId}</p>

<p><strong>Date:</strong> ${date}</p>

</div>

<span class="${badgeClass}">

${data.status}

</span>

</div>

`;

});

const latest=snapshot.docs[0].data();

depositStatus.innerHTML=`

<strong>${latest.status}</strong>

`;

});

}

// ===============================
// Start History
// ===============================

onAuthStateChanged(auth,(user)=>{

if(!user) return;

loadDepositHistory(user);

});

// ===============================
// DEPOSIT.JS - PART 4
// Final Functions
// ===============================

// ---------- Logout ----------

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {

logoutBtn.addEventListener("click", async (e) => {

e.preventDefault();

const ok = confirm("Do you want to logout?");

if (!ok) return;

try {

await auth.signOut();

window.location.href = "login.html";

} catch (error) {

alert(error.message);

}

});

}

// ---------- Notification ----------

function showToast(message, color = "#2563eb") {

const toast = document.createElement("div");

toast.innerText = message;

toast.style.position = "fixed";
toast.style.top = "20px";
toast.style.right = "20px";
toast.style.background = color;
toast.style.color = "#fff";
toast.style.padding = "15px 22px";
toast.style.borderRadius = "12px";
toast.style.fontWeight = "600";
toast.style.zIndex = "99999";
toast.style.boxShadow = "0 10px 25px rgba(0,0,0,.25)";
toast.style.animation = "fadeIn .3s";

document.body.appendChild(toast);

setTimeout(() => {

toast.remove();

},3000);

}

// ---------- Better Copy Buttons ----------

copyMTN?.addEventListener("click",()=>{

navigator.clipboard.writeText(

document.getElementById("mtnNumber").innerText

);

showToast("✅ MTN Number Copied","#10b981");

});

copyAirtel?.addEventListener("click",()=>{

navigator.clipboard.writeText(

document.getElementById("airtelNumber").innerText

);

showToast("✅ Airtel Number Copied","#10b981");

});

// ---------- Validation ----------

depositForm?.addEventListener("submit",(e)=>{

const amount = Number(

document.getElementById("amount").value

);

if(amount < 1000){

e.preventDefault();

showToast(

"Minimum deposit is 1,000 RWF",

"#ef4444"

);

return;

}

});

// ---------- Online / Offline ----------

window.addEventListener("online",()=>{

showToast("Internet Connected","#10b981");

});

window.addEventListener("offline",()=>{

showToast("No Internet Connection","#ef4444");

});

// ---------- Page Animation ----------

window.addEventListener("load",()=>{

document.body.style.opacity="0";

setTimeout(()=>{

document.body.style.transition="opacity .4s";

document.body.style.opacity="1";

},100);

});

// ---------- Initialize ----------

console.log("Deposit Page Ready");
