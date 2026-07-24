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

