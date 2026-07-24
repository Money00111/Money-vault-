// ======================================
// ADMIN NAVIGATION
// adminNavigation.js
// ======================================

// Menu Links

const menuLinks = document.querySelectorAll(".menu-link");

// Pages

const pages = {

    dashboard: document.getElementById("dashboardSection"),

    deposits: document.getElementById("depositSection"),

    withdraws: document.getElementById("withdrawSection"),

    users: document.getElementById("usersSection"),

    transactions: document.getElementById("transactionsSection"),

    settings: document.getElementById("settingsSection")

};

// Sidebar

const sidebar = document.querySelector(".sidebar");

// Menu Button

const menuBtn = document.getElementById("menuBtn");

// ======================================
// SHOW PAGE
// ======================================

export function showPage(page){

    // Hide All Pages

    Object.values(pages).forEach(section=>{

        if(section){

            section.classList.remove("active");

        }

    });

    // Show Selected Page

    if(pages[page]){

        pages[page].classList.add("active");

    }

    // Active Menu

    menuLinks.forEach(link=>{

        link.classList.remove("active");

        if(link.dataset.page===page){

            link.classList.add("active");

        }

    });

}

// ======================================
// ADMIN NAVIGATION PART 2
// SIDEBAR TOGGLE + NAVIGATION
// ======================================

// Mobile Sidebar

menuBtn?.addEventListener("click", () => {

    sidebar.classList.toggle("active");

});

// ======================================
// MENU NAVIGATION
// ======================================

menuLinks.forEach(link => {

    link.addEventListener("click", (e) => {

        e.preventDefault();

        const page = link.dataset.page;

        if (!page) return;

        showPage(page);

        // Change URL Hash

        window.location.hash = page;

        // Close Sidebar on Mobile

        if (window.innerWidth <= 768) {

            sidebar.classList.remove("active");

        }

    });

});

// ======================================
// HASH NAVIGATION
// ======================================

function loadFromHash() {

    const hash = window.location.hash.replace("#", "");

    if (hash && pages[hash]) {

        showPage(hash);

    } else {

        showPage("dashboard");

    }

}

// Load First Page

loadFromHash();

// Change Page when Hash Changes

window.addEventListener("hashchange", loadFromHash);

// ======================================
// CLOSE SIDEBAR ON RESIZE
// ======================================

window.addEventListener("resize", () => {

    if (window.innerWidth > 768) {

        sidebar.classList.remove("active");

    }

});

    // ======================================
// ADMIN NAVIGATION PART 3
// PAGE TITLE + LOADING + HELPERS
// ======================================

// Header Title

const pageTitle = document.getElementById("pageTitle");

// Loading Screen

const loadingScreen = document.getElementById("loadingScreen");

// ======================================
// PAGE TITLES
// ======================================

const pageTitles = {

    dashboard: "Admin Dashboard",

    deposits: "Deposit Requests",

    withdraws: "Withdraw Requests",

    users: "Users Management",

    transactions: "Transactions",

    settings: "System Settings"

};

// ======================================
// UPDATE HEADER
// ======================================

function updateHeader(page){

    if(pageTitle){

        pageTitle.textContent =
            pageTitles[page] || "Money Vault Admin";

    }

}

// ======================================
// SHOW PAGE (Override)
// ======================================

export function{

showPage

};
