/* =========================================================
   MONEY VAULT - ADMIN.JS
   FULL CLEAN VERSION
   CURRENCY: RWF / FRW

   FEATURES
   - Admin authentication via admins/{uid}
   - Dashboard statistics
   - Total users
   - Total system balance
   - Users list + search
   - User details
   - Block / Activate user
   - Deposit requests
   - Deposit approve / reject
   - Withdraw requests
   - Withdraw approve / reject
   - Transactions
   - Navigation
   - Quick Actions
   - Settings
   - Proof image viewer
   - No duplicate declarations
========================================================= */

import { auth, db, authReady } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
    ref,
    get,
    onValue,
    update,
    push
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   CONFIG
========================================================= */

const CURRENCY = "RWF";

const MIN_WITHDRAW = 4000;
const MAX_WITHDRAW = 500000;

let currentAdmin = null;
let adminReady = false;

let allUsersData = {};
let allDepositData = {};
let allWithdrawData = {};
let allTransactionData = {};

let selectedUserId = null;


/* =========================================================
   HELPERS
========================================================= */

function money(value) {

    const number = Number(value || 0);

    return number.toLocaleString("en-US") +
        " " +
        CURRENCY;
}


function number(value) {

    return Number(value || 0);
}


function normalizeStatus(value) {

    return String(value || "pending")
        .trim()
        .toLowerCase();
}


function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function getName(user) {

    return (
        user?.fullName ||
        user?.name ||
        "Unknown User"
    );
}


function getEmail(user) {

    return user?.email || "-";
}


function getPhone(user) {

    return (
        user?.phone ||
        user?.senderPhone ||
        "-"
    );
}


function showToast(message) {

    const toast =
        document.getElementById("toast");

    const toastMessage =
        document.getElementById("toastMessage");

    if (toastMessage) {
        toastMessage.textContent = message;
    }

    if (toast) {

        toast.classList.add("show");

        setTimeout(() => {
            toast.classList.remove("show");
        }, 2500);

    } else {

        console.log(message);

    }
}


function showError(message) {

    console.error(message);

    alert(message);
}


/* =========================================================
   ELEMENT HELPERS
========================================================= */

function el(id) {

    return document.getElementById(id);

}


/* =========================================================
   LOADING SCREEN
========================================================= */

const loadingScreen =
    el("loadingScreen");


function hideLoading() {

    if (loadingScreen) {

        loadingScreen.style.display =
            "none";

    }

}


/* =========================================================
   NAVIGATION ELEMENTS
========================================================= */

const sidebar =
    el("sidebar");

const menuBtn =
    el("menuBtn");

const logoutBtn =
    el("logoutBtn");

const adminName =
    el("adminName");

const menuLinks =
    document.querySelectorAll(".menu-link");

const pageSections =
    document.querySelectorAll(".page-section");


/* =========================================================
   PAGE NAVIGATION
========================================================= */

function openPage(pageName) {

    pageSections.forEach(section => {

        section.style.display = "none";

        section.classList.remove("active");

    });


    menuLinks.forEach(link => {

        link.classList.remove("active");

    });


    const sectionMap = {

        dashboard:
            "dashboardSection",

        deposits:
            "depositSection",

        deposit:
            "depositSection",

        withdraws:
            "withdrawSection",

        withdraw:
            "withdrawSection",

        vipRequests:
            "vipRequestsSection",

        vipBuyers:
            "vipBuyersSection",

        bonusRequests:
            "bonusRequestsSection",

        users:
            "usersSection",

        transactions:
            "transactionsSection",

        settings:
            "settingsSection"

    };


    const sectionId =
        sectionMap[pageName];


    if (sectionId) {

        const section =
            el(sectionId);

        if (section) {

            section.style.display =
                "block";

            section.classList.add("active");

        }

    }


    const activeLink =
        document.querySelector(
            `[data-page="${pageName}"]`
        );


    if (activeLink) {

        activeLink.classList.add("active");

    }


    if (sidebar) {

        sidebar.classList.remove("show");
        sidebar.classList.remove("active");

    }

}


/* =========================================================
   MENU LINKS
========================================================= */

menuLinks.forEach(link => {

    link.addEventListener("click", event => {

        event.preventDefault();

        const page =
            link.dataset.page;

        if (page) {

            openPage(page);

        }

    });

});


/* =========================================================
   MOBILE MENU
========================================================= */

menuBtn?.addEventListener(
    "click",
    () => {

        if (!sidebar) return;

        sidebar.classList.toggle("show");
        sidebar.classList.toggle("active");

    }
);


/* =========================================================
   QUICK ACTIONS
========================================================= */

el("openDeposits")?.addEventListener(
    "click",
    () => openPage("deposits")
);


el("openWithdraws")?.addEventListener(
    "click",
    () => openPage("withdraws")
);


el("openUsers")?.addEventListener(
    "click",
    () => openPage("users")
);


el("openTransactions")?.addEventListener(
    "click",
    () => openPage("transactions")
);


el("openSettings")?.addEventListener(
    "click",
    () => openPage("settings")
);


/* =========================================================
   LOGOUT
========================================================= */

logoutBtn?.addEventListener(
    "click",
    async () => {

        const ok =
            confirm(
                "Logout from Admin Panel?"
            );

        if (!ok) return;

        try {

            await signOut(auth);

            window.location.href =
                "login.html";

        } catch (error) {

            showError(
                "Logout failed: " +
                error.message
            );

        }

    }
);


/* =========================================================
   ADMIN AUTHENTICATION
========================================================= */

async function checkAdmin(user) {

    if (!user) {

        window.location.href =
            "login.html";

        return false;

    }


    try {

        const adminSnap =
            await get(
                ref(
                    db,
                    "admins/" +
                    user.uid
                )
            );


        if (!adminSnap.exists()) {

            alert(
                "Access Denied: You are not an administrator."
            );

            await signOut(auth);

            window.location.href =
                "dashboard.html";

            return false;

        }


        currentAdmin = user;
        adminReady = true;


        const userSnap =
            await get(
                ref(
                    db,
                    "users/" +
                    user.uid
                )
            );


        if (
            userSnap.exists() &&
            adminName
        ) {

            const data =
                userSnap.val();

            adminName.textContent =
                data.fullName ||
                data.name ||
                "Administrator";

        } else if (adminName) {

            adminName.textContent =
                "Administrator";

        }


        hideLoading();

        console.log(
            "✅ ADMIN AUTHENTICATED:",
            user.uid
        );


        startAdminData();

        return true;


    } catch (error) {

        console.error(
            "ADMIN AUTH ERROR:",
            error
        );

        hideLoading();

        alert(
            "Admin authentication failed:\n" +
            error.message
        );

        return false;

    }

}


/* =========================================================
   AUTH STATE
========================================================= */

authReady
    .catch(() => {})
    .finally(() => {

        onAuthStateChanged(
            auth,
            user => {

                checkAdmin(user);

            }
        );

    });


/* =========================================================
   DASHBOARD ELEMENTS
========================================================= */

const totalUsersEl =
    el("totalUsers");

const totalDepositsEl =
    el("totalDeposits");

const totalPendingEl =
    el("totalPending");

const totalApprovedEl =
    el("totalApproved");

const totalRejectedEl =
    el("totalRejected");

const totalAmountEl =
    el("totalAmount");

const activeUsersEl =
    el("activeUsers");

const blockedUsersEl =
    el("blockedUsers");

const allUsersEl =
    el("allUsers");


/* =========================================================
   CREATE SYSTEM BALANCE CARD IF MISSING
========================================================= */

function ensureSystemBalanceCard() {

    let systemBalanceEl =
        el("systemBalance");


    if (systemBalanceEl) {

        return systemBalanceEl;

    }


    if (!totalUsersEl) {

        return null;

    }


    const originalCard =
        totalUsersEl.closest(".stat-card");


    if (!originalCard) {

        return null;

    }


    const card =
        document.createElement("div");

    card.className =
        "stat-card";


    card.innerHTML = `

        <div class="stat-icon balance">

            <i class="fa-solid fa-coins"></i>

        </div>

        <div class="stat-info">

            <h3 id="systemBalance">
                0 RWF
            </h3>

            <p>
                Total System Balance
            </p>

        </div>

    `;


    originalCard.parentNode
        ?.insertBefore(
            card,
            originalCard.nextSibling
        );


    return el("systemBalance");

}


/* =========================================================
   DASHBOARD USERS + SYSTEM BALANCE
========================================================= */

function loadUsersDashboard() {

    const usersRef =
        ref(db, "users");


    onValue(
        usersRef,

        snapshot => {

            allUsersData = {};

            let totalUsers = 0;
            let totalBalance = 0;
            let activeUsers = 0;
            let blockedUsers = 0;


            if (snapshot.exists()) {

                snapshot.forEach(child => {

                    const uid =
                        child.key;

                    const user =
                        child.val() || {};


                    allUsersData[uid] =
                        user;


                    totalUsers++;


                    totalBalance +=
                        number(
                            user.balance
                        );


                    const status =
                        normalizeStatus(
                            user.status
                        );


                    if (
                        status === "blocked" ||
                        status === "suspended"
                    ) {

                        blockedUsers++;

                    } else {

                        activeUsers++;

                    }

                });

            }


            if (totalUsersEl) {

                totalUsersEl.textContent =
                    totalUsers.toLocaleString();

            }


            if (allUsersEl) {

                allUsersEl.textContent =
                    totalUsers.toLocaleString();

            }


            if (activeUsersEl) {

                activeUsersEl.textContent =
                    activeUsers.toLocaleString();

            }


            if (blockedUsersEl) {

                blockedUsersEl.textContent =
                    blockedUsers.toLocaleString();

            }


            const systemBalanceEl =
                ensureSystemBalanceCard();


            if (systemBalanceEl) {

                systemBalanceEl.textContent =
                    money(totalBalance);

            }


            renderUsers(
                allUsersData
            );

        },

        error => {

            console.error(
                "USERS LOAD ERROR:",
                error
            );

            renderUsersError(
                error.message
            );

        }

    );

}


/* =========================================================
   USERS LIST
========================================================= */

const usersContainer =
    el("usersContainer");


function renderUsersError(message) {

    if (!usersContainer) return;


    usersContainer.innerHTML = `

        <div class="empty-state">

            <i class="fa-solid fa-triangle-exclamation"></i>

            <h3>
                Failed to Load Users
            </h3>

            <p>
                ${escapeHTML(message)}
            </p>

        </div>

    `;

}


function renderUsers(users) {

    if (!usersContainer) return;


    const entries =
        Object.entries(users || {});


    if (!entries.length) {

        usersContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-users"></i>

                <h3>
                    No Users Found
                </h3>

                <p>
                    Registered users will appear here.
                </p>

            </div>

        `;

        return;

    }


    usersContainer.innerHTML = "";


    entries.forEach(
        ([uid, user]) => {

            const name =
                getName(user);

            const email =
                getEmail(user);

            const phone =
                getPhone(user);

            const balance =
                number(user.balance);

            const status =
                normalizeStatus(
                    user.status
                );

            const blocked =
                status === "blocked" ||
                status === "suspended";


            const vip =
                user.vip ||
                user.vipPlan ||
                "VIP 0";


            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "user-card";


            card.innerHTML = `

                <div class="user-card-header">

                    <div class="user-avatar">

                        <i class="fa-solid fa-user"></i>

                    </div>


                    <div class="user-main-info">

                        <h3>
                            ${escapeHTML(name)}
                        </h3>

                        <p>
                            ${escapeHTML(email)}
                        </p>

                    </div>


                    <span class="status ${
                        blocked
                            ? "blocked"
                            : "active"
                    }">

                        ${
                            blocked
                                ? "Blocked"
                                : "Active"
                        }

                    </span>

                </div>


                <div class="user-card-details">

                    <div>

                        <small>
                            Phone
                        </small>

                        <strong>
                            ${escapeHTML(phone)}
                        </strong>

                    </div>


                    <div>

                        <small>
                            Balance
                        </small>

                        <strong>
                            ${money(balance)}
                        </strong>

                    </div>


                    <div>

                        <small>
                            VIP
                        </small>

                        <strong>
                            ${escapeHTML(
                                String(vip)
                            )}
                        </strong>

                    </div>

                </div>


                <div class="user-card-footer">

                    <small>
                        UID:
                        ${escapeHTML(uid)}
                    </small>


                    <button
                        class="viewUserBtn"
                        data-id="${escapeHTML(uid)}">

                        View

                    </button>

                </div>

            `;


            usersContainer.appendChild(
                card
            );

        }
    );


    activateUserViewButtons();

}


/* =========================================================
   USER SEARCH
========================================================= */

el("userSearch")
    ?.addEventListener(
        "input",
        event => {

            const keyword =
                event.target.value
                    .trim()
                    .toLowerCase();


            if (!keyword) {

                renderUsers(
                    allUsersData
                );

                return;

            }


            const filtered = {};


            Object.entries(
                allUsersData
            ).forEach(
                ([uid, user]) => {

                    const text = [

                        user.fullName,
                        user.name,
                        user.email,
                        user.phone,
                        uid

                    ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();


                    if (
                        text.includes(
                            keyword
                        )
                    ) {

                        filtered[uid] =
                            user;

                    }

                }
            );


            renderUsers(filtered);

        }
    );


/* =========================================================
   USER VIEW BUTTONS
========================================================= */

function activateUserViewButtons() {

    document
        .querySelectorAll(
            ".viewUserBtn"
        )
        .forEach(button => {

            button.onclick = () => {

                openUserModal(
                    button.dataset.id
                );

            };

        });

}


/* =========================================================
   USER MODAL
========================================================= */

const userModal =
    el("userModal");

const closeUserModal =
    el("closeUserModal");

const userFullName =
    el("userFullName");

const userEmail =
    el("userEmail");

const userPhone =
    el("userPhone");

const userBalance =
    el("userBalance");

const userDeposits =
    el("userDeposits");

const userWithdraws =
    el("userWithdraws");

const userVip =
    el("userVip");

const userJoined =
    el("userJoined");

const blockUserBtn =
    el("blockUserBtn");

const activateUserBtn =
    el("activateUserBtn");


async function openUserModal(uid) {

    selectedUserId =
        uid;


    try {

        const snapshot =
            await get(
                ref(
                    db,
                    "users/" + uid
                )
            );


        if (!snapshot.exists()) {

            alert(
                "User not found."
            );

            return;

        }


        const user =
            snapshot.val();


        if (userFullName) {

            userFullName.textContent =
                getName(user);

        }


        if (userEmail) {

            userEmail.textContent =
                getEmail(user);

        }


        if (userPhone) {

            userPhone.textContent =
                getPhone(user);

        }


        if (userBalance) {

            userBalance.textContent =
                money(user.balance);

        }


        if (userDeposits) {

            userDeposits.textContent =
                money(
                    user.totalDeposits ??
                    user.totalDeposit ??
                    0
                );

        }


        if (userWithdraws) {

            userWithdraws.textContent =
                money(
                    user.totalWithdraws ??
                    user.totalWithdraw ??
                    0
                );

        }


        if (userVip) {

            userVip.textContent =
                user.vip ||
                user.vipPlan ||
                "None";

        }


        if (userJoined) {

            userJoined.textContent =
                user.createdAt
                    ? new Date(
                        user.createdAt
                    ).toLocaleString()
                    : "-";

        }


        const status =
            normalizeStatus(
                user.status
            );


        if (blockUserBtn) {

            blockUserBtn.style.display =
                (
                    status === "blocked" ||
                    status === "suspended"
                )
                    ? "none"
                    : "inline-block";

        }


        if (activateUserBtn) {

            activateUserBtn.style.display =
                (
                    status === "blocked" ||
                    status === "suspended"
                )
                    ? "inline-block"
                    : "none";

        }


        if (userModal) {

            userModal.style.display =
                "flex";

        }


    } catch (error) {

        console.error(
            "OPEN USER ERROR:",
            error
        );

        alert(
            error.message
        );

    }

}


/* =========================================================
   CLOSE USER MODAL
========================================================= */

closeUserModal?.addEventListener(
    "click",
    () => {

        if (userModal) {

            userModal.style.display =
                "none";

        }

    }
);


window.addEventListener(
    "click",
    event => {

        if (
            userModal &&
            event.target === userModal
        ) {

            userModal.style.display =
                "none";

        }

    }
);


/* =========================================================
   BLOCK USER
========================================================= */

blockUserBtn?.addEventListener(
    "click",
    async () => {

        if (!selectedUserId) return;


        if (
            !confirm(
                "Block this user?"
            )
        ) {

            return;

        }


        try {

            await update(
                ref(
                    db,
                    "users/" +
                    selectedUserId
                ),
                {
                    status: "blocked"
                }
            );


            showToast(
                "User blocked successfully."
            );


            if (userModal) {

                userModal.style.display =
                    "none";

            }


        } catch (error) {

            showError(
                "Block user failed: " +
                error.message
            );

        }

    }
);


/* =========================================================
   ACTIVATE USER
========================================================= */

activateUserBtn?.addEventListener(
    "click",
    async () => {

        if (!selectedUserId) return;


        if (
            !confirm(
                "Activate this user?"
            )
        ) {

            return;

        }


        try {

            await update(
                ref(
                    db,
                    "users/" +
                    selectedUserId
                ),
                {
                    status: "active"
                }
            );


            showToast(
                "User activated successfully."
            );


            if (userModal) {

                userModal.style.display =
                    "none";

            }


        } catch (error) {

            showError(
                "Activate user failed: " +
                error.message
            );

        }

    }
);


/* =========================================================
   DASHBOARD DEPOSIT STATISTICS
========================================================= */

function loadDashboardDeposits() {

    onValue(
        ref(db, "depositRequests"),

        snapshot => {

            let total = 0;
            let pending = 0;
            let approved = 0;
            let rejected = 0;
            let amount = 0;


            if (snapshot.exists()) {

                snapshot.forEach(child => {

                    const data =
                        child.val() || {};

                    total++;

                    amount +=
                        number(data.amount);


                    const status =
                        normalizeStatus(
                            data.status
                        );


                    if (
                        status === "pending"
                    ) {

                        pending++;

                    } else if (
                        status === "approved"
                    ) {

                        approved++;

                    } else if (
                        status === "rejected"
                    ) {

                        rejected++;

                    }

                });

            }


            if (totalDepositsEl) {

                totalDepositsEl.textContent =
                    total;

            }


            if (totalPendingEl) {

                totalPendingEl.textContent =
                    pending;

            }


            if (totalApprovedEl) {

                totalApprovedEl.textContent =
                    approved;

            }


            if (totalRejectedEl) {

                totalRejectedEl.textContent =
                    rejected;

            }


            if (totalAmountEl) {

                totalAmountEl.textContent =
                    money(amount);

            }

        },

        error => {

            console.error(
                "DASHBOARD DEPOSIT ERROR:",
                error
            );

        }

    );

}


/* =========================================================
   DEPOSIT ELEMENTS
========================================================= */

const depositContainer =
    el("depositRequests");

const depositSearch =
    el("searchInput");

const depositFilter =
    el("filterStatus");

const depositCount =
    el("depositCount");

const pendingCount =
    el("pendingCount");

const approvedCount =
    el("approvedCount");

const rejectedCount =
    el("rejectedCount");

const emptyDeposit =
    el("emptyDeposit");


/* =========================================================
   LOAD DEPOSITS
========================================================= */

function loadDeposits() {

    onValue(
        ref(
            db,
            "depositRequests"
        ),

        snapshot => {

            allDepositData = {};


            if (snapshot.exists()) {

                snapshot.forEach(
                    child => {

                        allDepositData[
                            child.key
                        ] = {
                            id: child.key,
                            ...(child.val() || {})
                        };

                    }
                );

            }


            renderDeposits();

        },

        error => {

            console.error(
                "DEPOSIT LOAD ERROR:",
                error
            );


            if (depositContainer) {

                depositContainer.innerHTML = `

                    <div class="empty-state">

                        <h3>
                            Failed to Load Deposits
                        </h3>

                        <p>
                            ${escapeHTML(
                                error.message
                            )}
                        </p>

                    </div>

                `;

            }

        }

    );

}


/* =========================================================
   RENDER DEPOSITS
========================================================= */

function renderDeposits() {

    if (!depositContainer) return;


    const keyword =
        (
            depositSearch?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const filter =
        depositFilter?.value ||
        "All";


    const entries =
        Object.values(
            allDepositData
        );


    let total = entries.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;


    entries.forEach(data => {

        const status =
            normalizeStatus(
                data.status
            );


        if (status === "pending")
            pending++;

        if (status === "approved")
            approved++;

        if (status === "rejected")
            rejected++;

    });


    if (depositCount)
        depositCount.textContent =
            total;


    if (pendingCount)
        pendingCount.textContent =
            pending;


    if (approvedCount)
        approvedCount.textContent =
            approved;


    if (rejectedCount)
        rejectedCount.textContent =
            rejected;


    let filtered =
        entries.filter(data => {

            const status =
                normalizeStatus(
                    data.status
                );


            const text = [

                data.fullName,
                data.name,
                data.email,
                data.phone,
                data.senderPhone,
                data.transactionId,
                data.uid,
                data.amount

            ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();


            const matchesSearch =
                !keyword ||
                text.includes(keyword);


            const matchesFilter =
                filter === "All" ||
                status ===
                    filter.toLowerCase();


            return (
                matchesSearch &&
                matchesFilter
            );

        });


    filtered.sort(
        (a, b) =>
            number(b.createdAt) -
            number(a.createdAt)
    );


    depositContainer.innerHTML = "";


    if (!filtered.length) {

        if (emptyDeposit) {

            emptyDeposit.style.display =
                "block";

        }


        depositContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-wallet"></i>

                <h3>
                    No Deposit Requests
                </h3>

                <p>
                    Deposit requests will appear here.
                </p>

            </div>

        `;

        return;

    }


    if (emptyDeposit) {

        emptyDeposit.style.display =
            "none";

    }


    filtered.forEach(data => {

        const status =
            normalizeStatus(
                data.status
            );


        const statusLabel =
            status.charAt(0)
                .toUpperCase() +
            status.slice(1);


        const canAction =
            status === "pending";


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "request-card";


        card.innerHTML = `

            <div class="request-top">

                <h3>
                    ${money(data.amount)}
                </h3>

                <span class="status ${escapeHTML(status)}">

                    ${escapeHTML(
                        statusLabel
                    )}

                </span>

            </div>


            <p>
                <strong>Name:</strong>
                ${escapeHTML(
                    data.fullName ||
                    data.name ||
                    "-"
                )}
            </p>


            <p>
                <strong>Email:</strong>
                ${escapeHTML(
                    data.email ||
                    "-"
                )}
            </p>


            <p>
                <strong>Phone:</strong>
                ${escapeHTML(
                    data.senderPhone ||
                    data.phone ||
                    "-"
                )}
            </p>


            <p>
                <strong>Transaction ID:</strong>
                ${escapeHTML(
                    data.transactionId ||
                    "-"
                )}
            </p>


            <p>
                <strong>Created:</strong>
                ${
                    data.createdAt
                        ? new Date(
                            data.createdAt
                        ).toLocaleString()
                        : "-"
                }
            </p>


            <div class="action-buttons">

                ${
                    canAction
                    ? `

                        <button
                            class="approveDeposit"
                            data-id="${escapeHTML(data.id)}">

                            <i class="fa-solid fa-check"></i>
                            Approve

                        </button>


                        <button
                            class="rejectDeposit"
                            data-id="${escapeHTML(data.id)}">

                            <i class="fa-solid fa-xmark"></i>
                            Reject

                        </button>

                    `
                    : ""
                }


                ${
                    data.proofImage
                    ? `

                        <button
                            class="viewProof"
                            data-image="${escapeHTML(
                                data.proofImage
                            )}">

                            <i class="fa-solid fa-image"></i>
                            Screenshot

                        </button>

                    `
                    : ""
                }


                ${
                    data.transactionId
                    ? `

                        <button
                            class="copyTransaction"
                            data-id="${escapeHTML(
                                data.transactionId
                            )}">

                            <i class="fa-solid fa-copy"></i>
                            Copy ID

                        </button>

                    `
                    : ""
                }

            </div>

        `;


        depositContainer.appendChild(
            card
        );

    });


    activateDepositButtons();

}


/* =========================================================
   DEPOSIT SEARCH / FILTER
========================================================= */

depositSearch?.addEventListener(
    "input",
    renderDeposits
);


depositFilter?.addEventListener(
    "change",
    renderDeposits
);


/* =========================================================
   APPROVE DEPOSIT
========================================================= */

async function approveDeposit(id) {

    if (
        !confirm(
            "Approve this deposit?"
        )
    ) {

        return;

    }


    try {

        const requestRef =
            ref(
                db,
                "depositRequests/" +
                id
            );


        const requestSnap =
            await get(requestRef);


        if (!requestSnap.exists()) {

            throw new Error(
                "Deposit request not found."
            );

        }


        const request =
            requestSnap.val() || {};


        const status =
            normalizeStatus(
                request.status
            );


        if (
            status === "approved"
        ) {

            alert(
                "This deposit is already approved."
            );

            return;

        }


        if (
            status === "rejected"
        ) {

            alert(
                "This deposit has already been rejected."
            );

            return;

        }


        const uid =
            request.uid;


        if (!uid) {

            throw new Error(
                "Deposit request has no user UID."
            );

        }


        const amount =
            number(request.amount);


        if (
            amount <= 0
        ) {

            throw new Error(
                "Invalid deposit amount."
            );

        }


        const userRef =
            ref(
                db,
                "users/" +
                uid
            );


        const userSnap =
            await get(userRef);


        if (!userSnap.exists()) {

            throw new Error(
                "User account not found."
            );

        }


        const user =
            userSnap.val() || {};


        const oldBalance =
            number(user.balance);


        const transactionKey =
            push(
                ref(
                    db,
                    "transactions"
                )
            ).key;


        const updates = {};


        updates[
            "users/" +
            uid +
            "/balance"
        ] =
            oldBalance + amount;


        updates[
            "users/" +
            uid +
            "/totalDeposit"
        ] =
            number(
                user.totalDeposit
            ) + amount;


        updates[
            "users/" +
            uid +
            "/totalDeposits"
        ] =
            number(
                user.totalDeposits
            ) + amount;


        updates[
            "users/" +
            uid +
            "/totalTransactions"
        ] =
            number(
                user.totalTransactions
            ) + 1;


        updates[
            "depositRequests/" +
            id +
            "/status"
        ] =
            "approved";


        updates[
            "depositRequests/" +
            id +
            "/approvedAt"
        ] =
            Date.now();


        updates[
            "depositRequests/" +
            id +
            "/approvedBy"
        ] =
            currentAdmin?.uid ||
            "admin";


        if (transactionKey) {

            updates[
                "transactions/" +
                transactionKey
            ] = {

                uid: uid,

                type: "Deposit",

                category: "Deposit",

                amount: amount,

                currency: CURRENCY,

                status: "Approved",

                requestId: id,

                transactionId:
                    request.transactionId ||
                    transactionKey,

                createdAt:
                    Date.now(),

                approvedAt:
                    Date.now(),

                description:
                    "Deposit approved by admin"

            };

        }


        await update(
            ref(db),
            updates
        );


        showToast(
            "Deposit approved successfully."
        );


    } catch (error) {

        console.error(
            "DEPOSIT APPROVE ERROR:",
            error
        );

        alert(
            "Deposit approve failed:\n" +
            error.message
        );

    }

}


/* =========================================================
   REJECT DEPOSIT
========================================================= */

async function rejectDeposit(id) {

    if (
        !confirm(
            "Reject this deposit?"
        )
    ) {

        return;

    }


    try {

        const requestRef =
            ref(
                db,
                "depositRequests/" +
                id
            );


        const snap =
            await get(requestRef);


        if (!snap.exists()) {

            throw new Error(
                "Deposit request not found."
            );

        }


        const request =
            snap.val() || {};


        const status =
            normalizeStatus(
                request.status
            );


        if (
            status !== "pending"
        ) {

            alert(
                "This request is no longer pending."
            );

            return;

        }


        await update(
            requestRef,
            {

                status: "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin?.uid ||
                    "admin"

            }
        );


        showToast(
            "Deposit rejected."
        );


    } catch (error) {

        console.error(
            "DEPOSIT REJECT ERROR:",
            error
        );

        alert(
            "Deposit reject failed:\n" +
            error.message
        );

    }

}


/* =========================================================
   DEPOSIT BUTTONS
========================================================= */

function activateDepositButtons() {

    document
        .querySelectorAll(
            ".approveDeposit"
        )
        .forEach(button => {

            button.onclick = () => {

                approveDeposit(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(
            ".rejectDeposit"
        )
        .forEach(button => {

            button.onclick = () => {

                rejectDeposit(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(
            ".viewProof"
        )
        .forEach(button => {

            button.onclick = () => {

                openProof(
                    button.dataset.image
                );

            };

        });


    document
        .querySelectorAll(
            ".copyTransaction"
        )
        .forEach(button => {

            button.onclick = async () => {

                const value =
                    button.dataset.id ||
                    "";

                try {

                    await navigator.clipboard.writeText(
                        value
                    );

                    showToast(
                        "Transaction ID copied."
                    );

                } catch {

                    alert(value);

                }

            };

        });

}


/* =========================================================
   PROOF MODAL
========================================================= */

const proofModal =
    el("proofModal");

const proofImage =
    el("proofImage");

const closeProof =
    el("closeProof");


function openProof(image) {

    if (!proofModal) return;


    if (proofImage) {

        proofImage.src =
            image || "";

    }


    proofModal.style.display =
        "flex";

}


closeProof?.addEventListener(
    "click",
    () => {

        if (proofModal) {

            proofModal.style.display =
                "none";

        }

    }
);


/* =========================================================
   WITHDRAW ELEMENTS
========================================================= */

const withdrawContainer =
    el("withdrawRequests");

const withdrawSearch =
    el("withdrawSearch");

const withdrawFilter =
    el("withdrawFilter");

const withdrawCount =
    el("withdrawCount");

const withdrawPending =
    el("withdrawPending");

const withdrawApproved =
    el("withdrawApproved");

const withdrawRejected =
    el("withdrawRejected");

const emptyWithdraw =
    el("emptyWithdraw");


/* =========================================================
   LOAD WITHDRAWS
========================================================= */

function loadWithdraws() {

    onValue(
        ref(
            db,
            "withdrawRequests"
        ),

        snapshot => {

            allWithdrawData = {};


            if (snapshot.exists()) {

                snapshot.forEach(
                    child => {

                        allWithdrawData[
                            child.key
                        ] = {

                            id: child.key,

                            ...(child.val() || {})

                        };

                    }
                );

            }


            renderWithdraws();

        },

        error => {

            console.error(
                "WITHDRAW LOAD ERROR:",
                error
            );

        }

    );

}


/* =========================================================
   RENDER WITHDRAWS
========================================================= */

function renderWithdraws() {

    if (!withdrawContainer) return;


    const keyword =
        (
            withdrawSearch?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const filter =
        withdrawFilter?.value ||
        "All";


    const entries =
        Object.values(
            allWithdrawData
        );


    let pending = 0;
    let approved = 0;
    let rejected = 0;


    entries.forEach(data => {

        const status =
            normalizeStatus(
                data.status
            );


        if (status === "pending")
            pending++;

        if (status === "approved")
            approved++;

        if (status === "rejected")
            rejected++;

    });


    if (withdrawCount)
        withdrawCount.textContent =
            entries.length;


    if (withdrawPending)
        withdrawPending.textContent =
            pending;


    if (withdrawApproved)
        withdrawApproved.textContent =
            approved;


    if (withdrawRejected)
        withdrawRejected.textContent =
            rejected;


    const filtered =
        entries
            .filter(data => {

                const text = [

                    data.fullName,
                    data.name,
                    data.email,
                    data.phone,
                    data.method,
                    data.amount,
                    data.uid

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                const status =
                    normalizeStatus(
                        data.status
                    );


                return (

                    (
                        !keyword ||
                        text.includes(keyword)
                    )

                    &&

                    (
                        filter === "All" ||
                        status ===
                            filter.toLowerCase()
                    )

                );

            })
            .sort(
                (a, b) =>
                    number(b.createdAt) -
                    number(a.createdAt)
            );


    withdrawContainer.innerHTML = "";


    if (!filtered.length) {

        if (emptyWithdraw) {

            emptyWithdraw.style.display =
                "block";

        }


        withdrawContainer.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-money-bill-transfer"></i>

                <h3>
                    No Withdraw Requests
                </h3>

                <p>
                    Withdraw requests will appear here.
                </p>

            </div>

        `;

        return;

    }


    if (emptyWithdraw) {

        emptyWithdraw.style.display =
            "none";

    }


    filtered.forEach(data => {

        const status =
            normalizeStatus(
                data.status
            );


        const label =
            status.charAt(0)
                .toUpperCase() +
            status.slice(1);


        const card =
            document.createElement(
                "div"
            );


        card.className =
            "request-card";


        card.innerHTML = `

            <div class="request-top">

                <h3>
                    ${money(data.amount)}
                </h3>

                <span class="status ${escapeHTML(status)}">

                    ${escapeHTML(label)}

                </span>

            </div>


            <p>

                <strong>Name:</strong>

                ${escapeHTML(
                    data.fullName ||
                    data.name ||
                    "-"
                )}

            </p>


            <p>

                <strong>Email:</strong>

                ${escapeHTML(
                    data.email ||
                    "-"
                )}

            </p>


            <p>

                <strong>Phone:</strong>

                ${escapeHTML(
                    data.phone ||
                    "-"
                )}

            </p>


            <p>

                <strong>Method:</strong>

                ${escapeHTML(
                    data.method ||
                    data.paymentMethod ||
                    "-"
                )}

            </p>


            <div class="action-buttons">

                ${
                    status === "pending"
                    ? `

                        <button
                            class="approveWithdraw"
                            data-id="${escapeHTML(data.id)}">

                            <i class="fa-solid fa-check"></i>
                            Approve

                        </button>


                        <button
                            class="rejectWithdraw"
                            data-id="${escapeHTML(data.id)}">

                            <i class="fa-solid fa-xmark"></i>
                            Reject

                        </button>

                    `
                    : ""
                }

                <button
                    class="viewWithdraw"
                    data-id="${escapeHTML(data.id)}">

                    View

                </button>

            </div>

        `;


        withdrawContainer.appendChild(
            card
        );

    });


    activateWithdrawButtons();

}


/* =========================================================
   WITHDRAW SEARCH / FILTER
========================================================= */

withdrawSearch?.addEventListener(
    "input",
    renderWithdraws
);


withdrawFilter?.addEventListener(
    "change",
    renderWithdraws
);


/* =========================================================
   APPROVE WITHDRAW
========================================================= */

async function approveWithdraw(id) {

    if (
        !confirm(
            "Approve this withdraw?"
        )
    ) {

        return;

    }


    try {

        const requestRef =
            ref(
                db,
                "withdrawRequests/" +
                id
            );


        const requestSnap =
            await get(requestRef);


        if (!requestSnap.exists()) {

            throw new Error(
                "Withdraw request not found."
            );

        }


        const request =
            requestSnap.val() || {};


        const status =
            normalizeStatus(
                request.status
            );


        if (
            status === "approved"
        ) {

            alert(
                "This withdraw is already approved."
            );

            return;

        }


        if (
            status === "rejected"
        ) {

            alert(
                "This withdraw has already been rejected."
            );

            return;

        }


        const uid =
            request.uid;


        if (!uid) {

            throw new Error(
                "Withdraw request has no user UID."
            );

        }


        const amount =
            number(request.amount);


        if (
            amount < MIN_WITHDRAW ||
            amount > MAX_WITHDRAW
        ) {

            throw new Error(
                "Withdraw must be between " +
                MIN_WITHDRAW.toLocaleString() +
                " and " +
                MAX_WITHDRAW.toLocaleString() +
                " RWF."
            );

        }


        const userRef =
            ref(
                db,
                "users/" +
                uid
            );


        const userSnap =
            await get(userRef);


        if (!userSnap.exists()) {

            throw new Error(
                "User account not found."
            );

        }


        const user =
            userSnap.val() || {};


        const balance =
            number(user.balance);


        if (
            balance < amount
        ) {

            throw new Error(
                "Insufficient user balance."
            );

        }


        const transactionKey =
            push(
                ref(
                    db,
                    "transactions"
                )
            ).key;


        const now =
            Date.now();


        const updates = {};


        updates[
            "users/" +
            uid +
            "/balance"
        ] =
            balance - amount;


        updates[
            "users/" +
            uid +
            "/totalWithdraw"
        ] =
            number(
                user.totalWithdraw
            ) + amount;


        updates[
            "users/" +
            uid +
            "/totalWithdraws"
        ] =
            number(
                user.totalWithdraws
            ) + amount;


        updates[
            "users/" +
            uid +
            "/totalTransactions"
        ] =
            number(
                user.totalTransactions
            ) + 1;


        updates[
            "withdrawRequests/" +
            id +
            "/status"
        ] =
            "approved";


        updates[
            "withdrawRequests/" +
            id +
            "/approvedAt"
        ] =
            now;


        updates[
            "withdrawRequests/" +
            id +
            "/approvedBy"
        ] =
            currentAdmin?.uid ||
            "admin";


        if (transactionKey) {

            updates[
                "transactions/" +
                transactionKey
            ] = {

                uid: uid,

                type: "Withdraw",

                category: "Withdraw",

                amount: amount,

                currency: CURRENCY,

                status: "Approved",

                requestId: id,

                transactionId:
                    request.transactionId ||
                    transactionKey,

                method:
                    request.method ||
                    request.paymentMethod ||
                    "",

                createdAt: now,

                approvedAt: now,

                description:
                    "Withdraw approved by admin"

            };

        }


        await update(
            ref(db),
            updates
        );


        showToast(
            "Withdraw approved successfully."
        );


    } catch (error) {

        console.error(
            "WITHDRAW APPROVE ERROR:",
            error
        );

        alert(
            "Withdraw approve failed:\n" +
            error.message
        );

    }

}


/* =========================================================
   REJECT WITHDRAW
========================================================= */

async function rejectWithdraw(id) {

    if (
        !confirm(
            "Reject this withdraw?"
        )
    ) {

        return;

    }


    try {

        const requestRef =
            ref(
                db,
                "withdrawRequests/" +
                id
            );


        const snap =
            await get(requestRef);


        if (!snap.exists()) {

            throw new Error(
                "Withdraw request not found."
            );

        }


        const request =
            snap.val() || {};


        if (
            normalizeStatus(
                request.status
            ) !== "pending"
        ) {

            alert(
                "This request is no longer pending."
            );

            return;

        }


        await update(
            requestRef,
            {

                status: "rejected",

                rejectedAt:
                    Date.now(),

                rejectedBy:
                    currentAdmin?.uid ||
                    "admin"

            }
        );


        showToast(
            "Withdraw rejected."
        );


    } catch (error) {

        console.error(
            "WITHDRAW REJECT ERROR:",
            error
        );

        alert(
            "Withdraw reject failed:\n" +
            error.message
        );

    }

}


/* =========================================================
   WITHDRAW BUTTONS
========================================================= */

function activateWithdrawButtons() {

    document
        .querySelectorAll(
            ".approveWithdraw"
        )
        .forEach(button => {

            button.onclick = () => {

                approveWithdraw(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(
            ".rejectWithdraw"
        )
        .forEach(button => {

            button.onclick = () => {

                rejectWithdraw(
                    button.dataset.id
                );

            };

        });


    document
        .querySelectorAll(
            ".viewWithdraw"
        )
        .forEach(button => {

            button.onclick = () => {

                openWithdrawModal(
                    button.dataset.id
                );

            };

        });

}


/* =========================================================
   WITHDRAW MODAL
========================================================= */

const withdrawModal =
    el("withdrawModal");

const closeWithdrawModal =
    el("closeWithdrawModal");


function openWithdrawModal(id) {

    const data =
        allWithdrawData[id];


    if (!data) return;


    const modalUser =
        el("modalUser");

    const modalEmail =
        el("modalEmail");

    const modalPhone =
        el("modalPhone");

    const modalAmount =
        el("modalAmount");

    const modalMethod =
        el("modalMethod");

    const modalStatus =
        el("modalStatus");


    if (modalUser)
        modalUser.textContent =
            data.fullName ||
            data.name ||
            "-";


    if (modalEmail)
        modalEmail.textContent =
            data.email || "-";


    if (modalPhone)
        modalPhone.textContent =
            data.phone || "-";


    if (modalAmount)
        modalAmount.textContent =
            money(data.amount);


    if (modalMethod)
        modalMethod.textContent =
            data.method ||
            data.paymentMethod ||
            "-";


    if (modalStatus)
        modalStatus.textContent =
            data.status ||
            "-";


    if (withdrawModal) {

        withdrawModal.style.display =
            "flex";

    }

}


closeWithdrawModal?.addEventListener(
    "click",
    () => {

        if (withdrawModal) {

            withdrawModal.style.display =
                "none";

        }

    }
);


/* =========================================================
   TRANSACTIONS
========================================================= */

const transactionList =
    el("transactionList");

const transactionSearch =
    el("transactionSearch");

const transactionFilter =
    el("transactionFilter");

const transactionTotal =
    el("transactionTotal");


function loadTransactions() {

    onValue(
        ref(
            db,
            "transactions"
        ),

        snapshot => {

            allTransactionData = {};


            if (snapshot.exists()) {

                snapshot.forEach(
                    child => {

                        allTransactionData[
                            child.key
                        ] = {

                            id: child.key,

                            ...(child.val() || {})

                        };

                    }
                );

            }


            renderTransactions();

        },

        error => {

            console.error(
                "TRANSACTIONS ERROR:",
                error
            );

        }

    );

}


function renderTransactions() {

    if (!transactionList) return;


    const keyword =
        (
            transactionSearch?.value ||
            ""
        )
        .trim()
        .toLowerCase();


    const filter =
        transactionFilter?.value ||
        "All";


    const entries =
        Object.values(
            allTransactionData
        );


    if (transactionTotal) {

        transactionTotal.textContent =
            entries.length;

    }


    const filtered =
        entries
            .filter(data => {

                const text = [

                    data.uid,
                    data.email,
                    data.fullName,
                    data.transactionId,
                    data.requestId,
                    data.type,
                    data.category,
                    data.amount

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                const status =
                    normalizeStatus(
                        data.status
                    );


                const type =
                    String(
                        data.type ||
                        data.category ||
                        ""
                    )
                    .toLowerCase();


                let matchesFilter =
                    true;


                if (
                    filter !== "All"
                ) {

                    const wanted =
                        filter.toLowerCase();


                    matchesFilter =
                        status === wanted ||
                        type === wanted.toLowerCase();

                }


                return (

                    (
                        !keyword ||
                        text.includes(keyword)
                    )

                    &&

                    matchesFilter

                );

            })
            .sort(
                (a, b) =>
                    number(b.createdAt) -
                    number(a.createdAt)
            );


    transactionList.innerHTML = "";


    if (!filtered.length) {

        transactionList.innerHTML = `

            <div class="empty-state">

                <i class="fa-solid fa-clock-rotate-left"></i>

                <h3>
                    No Transactions Found
                </h3>

            </div>

        `;

        return;

    }


    filtered.forEach(data => {

        const card =
            document.createElement(
                "div"
            );


        card.className =
            "request-card";


        card.innerHTML = `

            <div class="request-top">

                <h3>
                    ${money(data.amount)}
                </h3>

                <span class="status">

                    ${escapeHTML(
                        data.status ||
                        "-"
                    )}

                </span>

            </div>


            <p>

                <strong>Type:</strong>

                ${escapeHTML(
                    data.type ||
                    data.category ||
                    "-"
                )}

            </p>


            <p>

                <strong>User UID:</strong>

                ${escapeHTML(
                    data.uid ||
                    "-"
                )}

            </p>


            <p>

                <strong>Transaction ID:</strong>

                ${escapeHTML(
                    data.transactionId ||
                    data.id ||
                    "-"
                )}

            </p>


            <p>

                <strong>Date:</strong>

                ${
                    data.createdAt
                        ? new Date(
                            data.createdAt
                        ).toLocaleString()
                        : "-"
                }

            </p>

        `;


        transactionList.appendChild(
            card
        );

    });

}


transactionSearch?.addEventListener(
    "input",
    renderTransactions
);


transactionFilter?.addEventListener(
    "change",
    renderTransactions
);


/* =========================================================
   SETTINGS
========================================================= */

const adminNameInput =
    el("adminNameInput");

const adminEmailInput =
    el("adminEmailInput");

const saveSettings =
    el("saveSettings");


function loadSettings() {

    if (adminNameInput) {

        adminNameInput.value =
            adminName?.textContent ||
            "Administrator";

    }


    if (
        adminEmailInput &&
        currentAdmin
    ) {

        adminEmailInput.value =
            currentAdmin.email ||
            "";

    }

}


saveSettings?.addEventListener(
    "click",
    async () => {

        if (!currentAdmin) {

            alert(
                "Admin not ready."
            );

            return;

        }


        const name =
            adminNameInput?.value
                ?.trim();


        if (!name) {

            alert(
                "Enter admin name."
            );

            return;

        }


        try {

            await update(
                ref(
                    db,
                    "users/" +
                    currentAdmin.uid
                ),
                {
                    fullName: name
                }
            );


            if (adminName) {

                adminName.textContent =
                    name;

            }


            showToast(
                "Settings saved."
            );


        } catch (error) {

            alert(
                "Settings save failed:\n" +
                error.message
            );

        }

    }
);


/* =========================================================
   VIP REQUESTS
   INFORMATIONAL ONLY
   VIP PURCHASE IS AUTOMATIC
========================================================= */

function loadVipRequests() {

    const container =
        el("vipRequestList");

    if (!container) return;


    onValue(
        ref(
            db,
            "vipPurchaseRequests"
        ),

        snapshot => {

            container.innerHTML = "";


            if (!snapshot.exists()) {

                container.innerHTML = `

                    <div class="empty-state">

                        <h3>
                            No VIP Requests
                        </h3>

                    </div>

                `;

                return;

            }


            const entries = [];


            snapshot.forEach(
                child => {

                    entries.unshift({

                        id: child.key,

                        ...(child.val() || {})

                    });

                }
            );


            entries.forEach(
                data => {

                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "request-card";


                    card.innerHTML = `

                        <div class="request-top">

                            <h3>
                                ${escapeHTML(
                                    data.vipName ||
                                    data.name ||
                                    "VIP"
                                )}
                            </h3>

                            <span class="status">

                                ${escapeHTML(
                                    data.status ||
                                    "active"
                                )}

                            </span>

                        </div>


                        <p>

                            <strong>Price:</strong>

                            ${money(
                                data.price
                            )}

                        </p>


                        <p>

                            <strong>User UID:</strong>

                            ${escapeHTML(
                                data.uid ||
                                "-"
                            )}

                        </p>


                        <p>

                            <strong>Payment:</strong>

                            ${escapeHTML(
                                data.paymentMethod ||
                                "Account Balance"
                            )}

                        </p>


                        <p>

                            <strong>Currency:</strong>

                            ${escapeHTML(
                                data.currency ||
                                CURRENCY
                            )}

                        </p>


                        <p>

                            <strong>Date:</strong>

                            ${
                                data.createdAt
                                    ? new Date(
                                        data.createdAt
                                    ).toLocaleString()
                                    : "-"
                            }

                        </p>


                        <small>
                            VIP purchase is automatic.
                            No admin approval required.
                        </small>

                    `;


                    container.appendChild(
                        card
                    );

                }
            );

        },

        error => {

            console.error(
                "VIP REQUEST ERROR:",
                error
            );

        }

    );

}


/* =========================================================
   VIP BUYERS
========================================================= */

function loadVipBuyers() {

    const container =
        el("vipBuyerList");

    if (!container) return;


    onValue(
        ref(
            db,
            "vipBuyers"
        ),

        snapshot => {

            container.innerHTML = "";


            let total = 0;
            let active = 0;
            let expired = 0;


            if (snapshot.exists()) {

                snapshot.forEach(
                    child => {

                        const data =
                            child.val() || {};


                        total++;


                        const status =
                            normalizeStatus(
                                data.status
                            );


                        if (
                            status === "expired"
                        ) {

                            expired++;

                        } else {

                            active++;

                        }


                        const card =
                            document.createElement(
                                "div"
                            );


                        card.className =
                            "request-card";


                        card.innerHTML = `

                            <div class="request-top">

                                <h3>

                                    ${escapeHTML(
                                        data.vipName ||
                                        data.name ||
                                        "VIP"
                                    )}

                                </h3>

                                <span class="status">

                                    ${escapeHTML(
                                        data.status ||
                                        "active"
                                    )}

                                </span>

                            </div>


                            <p>

                                <strong>User:</strong>

                                ${escapeHTML(
                                    data.uid ||
                                    "-"
                                )}

                            </p>


                            <p>

                                <strong>Price:</strong>

                                ${money(
                                    data.price
                                )}

                            </p>


                            <p>

                                <strong>Daily Income:</strong>

                                ${money(
                                    data.dailyIncome
                                )}

                            </p>


                            <p>

                                <strong>Activated:</strong>

                                ${
                                    data.activatedAt
                                        ? new Date(
                                            data.activatedAt
                                        ).toLocaleString()
                                        : "-"
                                }

                            </p>

                        `;


                        container.appendChild(
                            card
                        );

                    }
                );

            }


            if (el("vipBuyerTotalCount"))
                el(
                    "vipBuyerTotalCount"
                ).textContent = total;


            if (el("vipBuyerActiveCount"))
                el(
                    "vipBuyerActiveCount"
                ).textContent = active;


            if (el("vipBuyerExpiredCount"))
                el(
                    "vipBuyerExpiredCount"
                ).textContent = expired;


            if (
                total === 0 &&
                el("emptyVipBuyer")
            ) {

                el(
                    "emptyVipBuyer"
                ).style.display =
                    "block";

            }

        },

        error => {

            console.error(
                "VIP BUYERS ERROR:",
                error
            );

        }

    );

}


/* =========================================================
   BONUS REQUESTS
========================================================= */

function loadBonusRequests() {

    const container =
        el("bonusRequestList");

    if (!container) return;


    onValue(
        ref(
            db,
            "bonusRequests"
        ),

        snapshot => {

            container.innerHTML = "";


            if (!snapshot.exists()) {

                container.innerHTML = `

                    <div class="empty-state">

                        <h3>
                            No Bonus Requests
                        </h3>

                    </div>

                `;

                return;

            }


            snapshot.forEach(
                child => {

                    const data =
                        child.val() || {};


                    const card =
                        document.createElement(
                            "div"
                        );


                    card.className =
                        "request-card";


                    card.innerHTML = `

                        <div class="request-top">

                            <h3>
                                ${money(
                                    data.amount
                                )}
                            </h3>

                            <span class="status">

                                ${escapeHTML(
                                    data.status ||
                                    "-"
                                )}

                            </span>

                        </div>


                        <p>

                            <strong>User UID:</strong>

                            ${escapeHTML(
                                data.uid ||
                                "-"
                            )}

                        </p>


                        <p>

                            <strong>Date:</strong>

                            ${
                                data.createdAt
                                    ? new Date(
                                        data.createdAt
                                    ).toLocaleString()
                                    : "-"
                            }

                        </p>

                    `;


                    container.appendChild(
                        card
                    );

                }
            );

        },

        error => {

            console.error(
                "BONUS REQUEST ERROR:",
                error
            );

        }

    );

}


/* =========================================================
   QUICK REFRESH
========================================================= */

el("refreshDashboardQuick")
    ?.addEventListener(
        "click",
        () => {

            startAdminData();

            showToast(
                "Dashboard refreshed."
            );

        }
    );


/* =========================================================
   APPROVE ALL DEPOSITS
========================================================= */

el("approveAllDeposits")
    ?.addEventListener(
        "click",
        async () => {

            const pending =
                Object.values(
                    allDepositData
                )
                .filter(
                    item =>
                        normalizeStatus(
                            item.status
                        ) === "pending"
                );


            if (!pending.length) {

                alert(
                    "No pending deposits."
                );

                return;

            }


            if (
                !confirm(
                    "Approve all pending deposits?"
                )
            ) {

                return;

            }


            for (
                const item of pending
            ) {

                try {

                    await approveDeposit(
                        item.id
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                }

            }

        }
    );


/* =========================================================
   APPROVE ALL WITHDRAWS
========================================================= */

el("approveAllWithdraws")
    ?.addEventListener(
        "click",
        async () => {

            const pending =
                Object.values(
                    allWithdrawData
                )
                .filter(
                    item =>
                        normalizeStatus(
                            item.status
                        ) === "pending"
                );


            if (!pending.length) {

                alert(
                    "No pending withdraws."
                );

                return;

            }


            if (
                !confirm(
                    "Approve all pending withdraws?"
                )
            ) {

                return;

            }


            for (
                const item of pending
            ) {

                try {

                    await approveWithdraw(
                        item.id
                    );

                } catch (error) {

                    console.error(
                        error
                    );

                }

            }

        }
    );


/* =========================================================
   START ALL ADMIN LISTENERS
========================================================= */

let dataStarted = false;


function startAdminData() {

    if (!adminReady) return;


    /*
       Prevent duplicate listeners.
    */

    if (dataStarted) return;

    dataStarted = true;


    console.log(
        "🚀 Starting Admin Data Listeners..."
    );


    loadUsersDashboard();

    loadDashboardDeposits();

    loadDeposits();

    loadWithdraws();

    loadTransactions();

    loadVipRequests();

    loadVipBuyers();

    loadBonusRequests();

    loadSettings();


    openPage("dashboard");


    console.log(
        "✅ ALL ADMIN LISTENERS STARTED"
    );

}


/* =========================================================
   INITIAL PAGE
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        openPage("dashboard");

    }
);


/* =========================================================
   GLOBAL MODAL CLOSE
========================================================= */

window.addEventListener(
    "click",
    event => {

        if (
            proofModal &&
            event.target === proofModal
        ) {

            proofModal.style.display =
                "none";

        }


        if (
            withdrawModal &&
            event.target === withdrawModal
        ) {

            withdrawModal.style.display =
                "none";

        }

    }
);


/* =========================================================
   FINAL
========================================================= */

console.log(
    "=========================================="
);

console.log(
    " MONEY VAULT ADMIN.JS"
);

console.log(
    " CLEAN FULL VERSION"
);

console.log(
    " CURRENCY: RWF / FRW"
);

console.log(
    " USERS + BALANCE + DEPOSITS + WITHDRAWS"
);

console.log(
    " TRANSACTIONS + VIP + SETTINGS"
);

console.log(
    " NO DUPLICATE LISTENERS"
);

console.log(
    "=========================================="
);
