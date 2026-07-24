// ======================================
// ADMIN LOGIN.JS PART 3
// FIREBASE ADMIN LOGIN
// ======================================

import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    setPersistence,
    browserLocalPersistence,
    browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";

// ======================================
// ELEMENTS
// ======================================

const loginForm = document.getElementById("adminLoginForm");

const emailInput = document.getElementById("adminEmail");

const passwordInput = document.getElementById("adminPassword");

const rememberMe = document.getElementById("rememberMe");

const loginBtn = document.getElementById("loginBtn");

const loginError = document.getElementById("loginError");

const loadingScreen = document.getElementById("loadingScreen");

const togglePassword = document.getElementById("togglePassword");

// ======================================
// REMOVE LOADING
// ======================================

window.addEventListener("load",()=>{

    loadingScreen.style.opacity="0";

    setTimeout(()=>{

        loadingScreen.style.display="none";

    },500);

});

// ======================================
// SHOW / HIDE PASSWORD
// ======================================

togglePassword.addEventListener("click",()=>{

    if(passwordInput.type==="password"){

        passwordInput.type="text";

        togglePassword.innerHTML=
        '<i class="fa-solid fa-eye-slash"></i>';

    }else{

        passwordInput.type="password";

        togglePassword.innerHTML=
        '<i class="fa-solid fa-eye"></i>';

    }

});

// ======================================
// ADMIN LOGIN
// ======================================

loginForm.addEventListener("submit",async(e)=>{

    e.preventDefault();

    loginError.textContent="";

    loginBtn.disabled=true;

    loginBtn.innerHTML=
    '<i class="fa-solid fa-spinner fa-spin"></i> Signing In...';

    try{

        // Remember Me

        await setPersistence(

            auth,

            rememberMe.checked

            ?

            browserLocalPersistence

            :

            browserSessionPersistence

        );

        // Login

        const userCredential=

        await signInWithEmailAndPassword(

            auth,

            emailInput.value.trim(),

            passwordInput.value

        );

        const uid=userCredential.user.uid;

        // Check Role

        const userRef=

        ref(db,"users/"+uid);

        const snapshot=

        await get(userRef);

        if(!snapshot.exists()){

            throw new Error("User profile not found.");

        }

        const userData=snapshot.val();

        if(userData.role!=="admin"){

            throw new Error("Access denied. Admin only.");

        }

        // Success

        window.location.href="admin.html";

    }

    catch(error){

        console.error(error);

        loginError.textContent=error.message;

        loginBtn.disabled=false;

        loginBtn.innerHTML=
        '<i class="fa-solid fa-right-to-bracket"></i> Login';

    }

});
