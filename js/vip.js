/* =========================================================
   MONEY VAULT - VIP.JS
   SECURE REQUEST VERSION
   CURRENCY: RWF / FRW

   IMPORTANT:
   - User can READ VIP plans
   - User can CREATE a VIP purchase request
   - User CANNOT directly change balance
   - User CANNOT directly activate VIP
   - Admin approves the request
   - Admin handles balance deduction
   - Admin activates VIP
   - Admin pays referral bonus once
   - Daily income starts 24h AFTER approval
   - Same VIP plan cannot be bought twice
   - Different VIP plans can be owned
========================================================= */

import {
  auth,
  db,
  authReady
} from "./firebase.js";

import {
  ref,
  get,
  push,
  query,
  orderByChild,
  equalTo,
  onValue
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let userData = {};
let vipPlansData = {};
let ownedVipPlans = {};

let vipListenerStarted = false;
let userListenerStarted = false;
let claimButtonStarted = false;

const CURRENCY = "RWF";
const DAY_MS = 24 * 60 * 60 * 1000;


/* =========================================================
   HELPERS
========================================================= */

function $(id) {
  return document.getElementById(id);
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMoney(value) {
  return safeNumber(value).toLocaleString("en-US");
}

function getPlanId(plan, fallbackId = "") {
  if (plan?.id) return String(plan.id);
  if (plan?.planId) return String(plan.planId);
  return String(fallbackId);
}

function getPlanName(plan) {
  return (
    plan?.name ||
    plan?.vipName ||
    plan?.title ||
    "VIP Plan"
  );
}

function getPlanPrice(plan) {
  return safeNumber(
    plan?.price ??
    plan?.amount ??
    plan?.cost
  );
}

function getDailyIncome(plan) {
  return safeNumber(
    plan?.dailyIncome ??
    plan?.dailyProfit ??
    plan?.daily
  );
}

function getDuration(plan) {
  return safeNumber(
    plan?.duration ??
    plan?.totalDays ??
    plan?.days
  );
}

function getTotalProfit(plan) {
  const stored = safeNumber(
    plan?.totalProfit ??
    plan?.profit
  );

  if (stored > 0) return stored;

  return (
    getDailyIncome(plan) *
    getDuration(plan)
  );
}

function showMessage(message, type = "info") {
  console.log(`[VIP ${type}]`, message);

  const ids = [
    "vipMessage",
    "vipStatus",
    "message",
    "statusMessage"
  ];

  let element = null;

  for (const id of ids) {
    const el = $(id);

    if (el) {
      element = el;
      break;
    }
  }

  if (!element) {
    if (type === "error") {
      alert(message);
    }

    return;
  }

  element.textContent = message;
  element.className = `vip-message ${type}`;
}


/* =========================================================
   AUTH
========================================================= */

async function waitForUser() {
  try {
    if (authReady) {
      await authReady;
    }
  } catch (error) {
    console.warn(
      "Auth persistence warning:",
      error
    );
  }

  if (auth.currentUser) {
    currentUser = auth.currentUser;
    return currentUser;
  }

  return await new Promise((resolve) => {
    let finished = false;

    const unsubscribe =
      auth.onAuthStateChanged((user) => {

        if (finished) return;

        finished = true;

        unsubscribe();

        if (user) {
          currentUser = user;
        }

        resolve(user);
      });

    setTimeout(() => {
      if (!finished) {
        finished = true;

        unsubscribe();

        resolve(auth.currentUser || null);
      }
    }, 10000);
  });
}


/* =========================================================
   LOAD VIP PLANS
========================================================= */

function loadVipPlans() {
  const plansRef =
    ref(db, "vipPlans");

  onValue(
    plansRef,
    (snapshot) => {

      if (!snapshot.exists()) {
        vipPlansData = {};

        renderVipPlans();

        return;
      }

      const raw =
        snapshot.val() || {};

      /*
        Only keep valid active plans.
      */

      const activePlans = {};

      Object.entries(raw).forEach(
        ([id, plan]) => {

          if (!plan) return;

          /*
            Support old/new status formats.
          */

          const status =
            plan.status;

          const active =
            plan.active === true ||
            status === "active" ||
            status === true ||
            status === undefined;

          if (!active) return;

          activePlans[id] = plan;
        }
      );

      vipPlansData =
        activePlans;

      renderVipPlans();
    },
    (error) => {

      console.error(
        "VIP plans load error:",
        error
      );

      showMessage(
        "VIP Plans failed to load: " +
        error.message,
        "error"
      );
    }
  );
}


/* =========================================================
   LOAD USER
========================================================= */

function loadUserData(uid) {

  if (!uid) return;

  const userRef =
    ref(db, `users/${uid}`);

  onValue(
    userRef,
    (snapshot) => {

      if (!snapshot.exists()) {

        userData = {};
        ownedVipPlans = {};

        renderVipPlans();
        renderOwnedVipPlans();
        updateBalanceDisplay();

        return;
      }

      userData =
        snapshot.val() || {};

      ownedVipPlans =
        userData.vipPlans || {};

      renderVipPlans();
      renderOwnedVipPlans();
      updateBalanceDisplay();
    },
    (error) => {

      console.error(
        "User data load error:",
        error
      );

      showMessage(
        "Failed to load user data: " +
        error.message,
        "error"
      );
    }
  );
}


/* =========================================================
   BALANCE
========================================================= */

function updateBalanceDisplay() {

  const balance =
    safeNumber(
      userData.balance
    );

  const ids = [
    "vipBalance",
    "userBalance",
    "balance",
    "balanceAmount"
  ];

  ids.forEach((id) => {

    const el = $(id);

    if (!el) return;

    el.textContent =
      `${formatMoney(balance)} RWF`;
  });
}


/* =========================================================
   CHECK OWNERSHIP
========================================================= */

function ownsPlan(planId) {

  if (!ownedVipPlans) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(
    ownedVipPlans,
    planId
  );
}


/* =========================================================
   RENDER VIP PLANS
========================================================= */

function renderVipPlans() {

  const grid =
    $("vipGrid") ||
    $("vipPlans") ||
    $("plansGrid");

  if (!grid) {
    console.warn(
      "VIP grid element not found."
    );

    return;
  }

  grid.innerHTML = "";

  const plans =
    Object.entries(
      vipPlansData || {}
    );

  if (!plans.length) {

    grid.innerHTML = `
      <div class="empty-state">
        No VIP plans available.
      </div>
    `;

    return;
  }


  plans.forEach(
    ([rawId, rawPlan]) => {

      const plan =
        rawPlan || {};

      const planId =
        getPlanId(
          plan,
          rawId
        );

      const name =
        getPlanName(plan);

      const price =
        getPlanPrice(plan);

      const dailyIncome =
        getDailyIncome(plan);

      const duration =
        getDuration(plan);

      const totalProfit =
        getTotalProfit(plan);

      const alreadyOwned =
        ownsPlan(planId);

      const ownedRecord =
        alreadyOwned
          ? ownedVipPlans[planId]
          : null;

      const active =
        ownedRecord?.active === true ||
        ownedRecord?.status === "active";


      const card =
        document.createElement("div");

      card.className =
        "vip-card";


      card.innerHTML = `
        <div class="vip-card-inner">

          <h3>
            ${escapeHtml(name)}
          </h3>

          <div class="vip-price">
            ${formatMoney(price)} RWF
          </div>

          <div class="vip-details">

            <div>
              <span>Daily Income</span>
              <strong>
                ${formatMoney(dailyIncome)} RWF
              </strong>
            </div>

            <div>
              <span>Duration</span>
              <strong>
                ${duration} Days
              </strong>
            </div>

            <div>
              <span>Total Profit</span>
              <strong>
                ${formatMoney(totalProfit)} RWF
              </strong>
            </div>

          </div>

          ${
            alreadyOwned
              ? `
                <button
                  class="vip-buy-btn owned"
                  disabled
                >
                  ${
                    active
                      ? "ACTIVE"
                      : "OWNED"
                  }
                </button>
              `
              : `
                <button
                  class="vip-buy-btn"
                  data-plan-id="${escapeHtml(planId)}"
                >
                  BUY NOW
                </button>
              `
          }

        </div>
      `;


      const button =
        card.querySelector(
          ".vip-buy-btn"
        );


      if (
        button &&
        !alreadyOwned
      ) {

        button.addEventListener(
          "click",
          () => buyVip(planId)
        );
      }


      grid.appendChild(card);
    }
  );
}


/* =========================================================
   RENDER OWNED VIP
========================================================= */

function renderOwnedVipPlans() {

  const container =
    $("ownedVipList") ||
    $("ownedVIPList") ||
    $("myVipPlans");

  if (!container) return;

  container.innerHTML = "";

  const entries =
    Object.entries(
      ownedVipPlans || {}
    );


  if (!entries.length) {

    container.innerHTML = `
      <div class="empty-state">
        You don't own any VIP plan yet.
      </div>
    `;

    return;
  }


  entries.forEach(
    ([planId, vip]) => {

      const plan =
        vipPlansData?.[planId] ||
        {};

      const name =
        vip?.vipName ||
        vip?.name ||
        getPlanName(plan);

      const dailyIncome =
        safeNumber(
          vip?.dailyIncome ??
          getDailyIncome(plan)
        );

      const status =
        vip?.status ||
        (
          vip?.active
            ? "active"
            : "inactive"
        );

      const lastClaim =
        safeNumber(
          vip?.lastClaim ??
          vip?.lastClaimTime ??
          vip?.approvedAt ??
          vip?.purchasedAt
        );


      const card =
        document.createElement("div");

      card.className =
        "owned-vip-card";


      card.innerHTML = `
        <div>

          <h4>
            ${escapeHtml(name)}
          </h4>

          <p>
            Daily:
            <strong>
              ${formatMoney(dailyIncome)} RWF
            </strong>
          </p>

          <p>
            Status:
            <strong>
              ${escapeHtml(status)}
            </strong>
          </p>

          <p>
            Last Claim:
            <span>
              ${
                lastClaim
                  ? new Date(
                      lastClaim
                    ).toLocaleString()
                  : "Not claimed"
              }
            </span>
          </p>

        </div>
      `;


      container.appendChild(card);
    }
  );
}


/* =========================================================
   CHECK PENDING REQUEST
========================================================= */

async function hasPendingRequest(
  uid,
  planId
) {

  const requestsQuery =
    query(
      ref(
        db,
        "vipPurchaseRequests"
      ),
      orderByChild("uid"),
      equalTo(uid)
    );


  const snapshot =
    await get(requestsQuery);


  if (!snapshot.exists()) {
    return false;
  }


  let found = false;


  snapshot.forEach(
    (child) => {

      const request =
        child.val() || {};


      if (
        request.planId === planId &&
        request.status === "pending"
      ) {

        found = true;
      }
    }
  );


  return found;
}


/* =========================================================
   BUY VIP
========================================================= */

async function buyVip(planId) {

  try {

    const user =
      await waitForUser();


    if (!user) {

      showMessage(
        "Please login first.",
        "error"
      );

      return;
    }


    currentUser = user;


    const plan =
      vipPlansData?.[planId];


    if (!plan) {

      showMessage(
        "VIP plan not found.",
        "error"
      );

      return;
    }


    const price =
      getPlanPrice(plan);


    const dailyIncome =
      getDailyIncome(plan);


    const duration =
      getDuration(plan);


    const totalProfit =
      getTotalProfit(plan);


    if (price <= 0) {

      showMessage(
        "Invalid VIP price.",
        "error"
      );

      return;
    }


    if (dailyIncome <= 0) {

      showMessage(
        "Invalid VIP daily income.",
        "error"
      );

      return;
    }


    if (duration <= 0) {

      showMessage(
        "Invalid VIP duration.",
        "error"
      );

      return;
    }


    /*
      Same plan cannot be purchased twice.
    */

    if (ownsPlan(planId)) {

      showMessage(
        "You already own this VIP plan.",
        "error"
      );

      return;
    }


    /*
      Prevent duplicate pending request.
    */

    const pending =
      await hasPendingRequest(
        user.uid,
        planId
      );


    if (pending) {

      showMessage(
        "You already have a pending request for this VIP plan.",
        "error"
      );

      return;
    }


    /*
      Read current balance only for display/check.
      IMPORTANT:
      We do NOT modify it here.
    */

    const userSnapshot =
      await get(
        ref(
          db,
          `users/${user.uid}`
        )
      );


    if (!userSnapshot.exists()) {

      showMessage(
        "User account not found.",
        "error"
      );

      return;
    }


    const freshUser =
      userSnapshot.val() || {};


    const balance =
      safeNumber(
        freshUser.balance
      );


    if (balance < price) {

      showMessage(
        `Insufficient balance. You need ${formatMoney(price)} RWF.`,
        "error"
      );

      return;
    }


    const confirmed =
      confirm(
        `Buy ${getPlanName(plan)} for ${formatMoney(price)} RWF?\n\n` +
        `Your request will be sent to the administrator for approval.`
      );


    if (!confirmed) return;


    const requestRef =
      push(
        ref(
          db,
          "vipPurchaseRequests"
        )
      );


    const requestId =
      requestRef.key;


    if (!requestId) {

      throw new Error(
        "Could not create request ID."
      );
    }


    const now =
      Date.now();


    /*
      IMPORTANT:
      User creates ONLY a pending request.

      No balance deduction happens here.
      No VIP activation happens here.
      No referral bonus happens here.

      Admin will perform the trusted financial update.
    */

    const requestData = {

      uid:
        user.uid,

      userId:
        user.uid,

      planId:
        planId,

      vipPlanId:
        planId,

      vipName:
        getPlanName(plan),

      name:
        getPlanName(plan),

      price:
        price,

      dailyIncome:
        dailyIncome,

      totalProfit:
        totalProfit,

      duration:
        duration,

      paymentMethod:
        "Account Balance",

      currency:
        CURRENCY,

      status:
        "pending",

      createdAt:
        now,

      requestedAt:
        now
    };


    /*
      ONLY one write:
      vipPurchaseRequests/{requestId}
    */

    await set(
      requestRef,
      requestData
    );


    showMessage(
      `${getPlanName(plan)} purchase request submitted successfully.`,
      "success"
    );


    alert(
      `VIP request submitted successfully!\n\n` +
      `Plan: ${getPlanName(plan)}\n` +
      `Price: ${formatMoney(price)} RWF\n\n` +
      `Waiting for administrator approval.`
    );


  } catch (error) {

    console.error(
      "VIP purchase request error:",
      error
    );


    showMessage(
      "VIP purchase failed: " +
      (
        error?.message ||
        error
      ),
      "error"
    );
  }
}


/* =========================================================
   CLAIM DAILY INCOME
========================================================= */

async function claimDailyIncome() {

  /*
    IMPORTANT:

    With strict frontend-only rules, the user must NOT
    directly change balance.

    Therefore the claim button creates a claim request.
    Admin/trusted processor performs the actual credit.
  */

  try {

    const user =
      await waitForUser();


    if (!user) {

      showMessage(
        "Please login first.",
        "error"
      );

      return;
    }


    const snapshot =
      await get(
        ref(
          db,
          `users/${user.uid}`
        )
      );


    if (!snapshot.exists()) {

      showMessage(
        "User account not found.",
        "error"
      );

      return;
    }


    const freshUser =
      snapshot.val() || {};


    const vipPlans =
      freshUser.vipPlans || {};


    const now =
      Date.now();


    let readyIncome = 0;
    let readyPlans = [];


    Object.entries(
      vipPlans
    ).forEach(
      ([planId, vip]) => {

        if (!vip) return;


        const active =
          vip.active === true ||
          vip.status === "active";


        if (!active) return;


        const dailyIncome =
          safeNumber(
            vip.dailyIncome ??
            vipPlansData?.[planId]?.dailyIncome
          );


        if (dailyIncome <= 0) return;


        const lastClaim =
          safeNumber(
            vip.lastClaim ??
            vip.lastClaimTime ??
            vip.approvedAt ??
            vip.purchasedAt
          );


        if (!lastClaim) return;


        if (
          now - lastClaim <
          DAY_MS
        ) {

          return;
        }


        readyIncome +=
          dailyIncome;


        readyPlans.push({
          planId,
          dailyIncome
        });
      }
    );


    if (!readyPlans.length) {

      showMessage(
        "No VIP income is ready yet. Please wait until 24 hours have passed.",
        "info"
      );

      return;
    }


    /*
      Check whether a claim request is already pending.
    */

    const claimQuery =
      query(
        ref(
          db,
          "vipIncomeClaims"
        ),
        orderByChild("uid"),
        equalTo(user.uid)
      );


    const claimSnapshot =
      await get(claimQuery);


    if (claimSnapshot.exists()) {

      let alreadyPending = false;


      claimSnapshot.forEach(
        (child) => {

          const claim =
            child.val() || {};


          if (
            claim.status ===
            "pending"
          ) {

            alreadyPending = true;
          }
        }
      );


      if (alreadyPending) {

        showMessage(
          "You already have a pending VIP income claim.",
          "info"
        );

        return;
      }
    }


    const claimRef =
      push(
        ref(
          db,
          "vipIncomeClaims"
        )
      );


    const claimId =
      claimRef.key;


    if (!claimId) {

      throw new Error(
        "Could not create claim ID."
      );
    }


    await set(
      claimRef,
      {

        uid:
          user.uid,

        amount:
          readyIncome,

        currency:
          CURRENCY,

        plans:
          readyPlans,

        status:
          "pending",

        createdAt:
          now
      }
    );


    showMessage(
      `VIP income claim submitted: ${formatMoney(readyIncome)} RWF.`,
      "success"
    );


    alert(
      `VIP income claim submitted.\n\n` +
      `Amount: ${formatMoney(readyIncome)} RWF\n\n` +
      `Waiting for processing.`
    );


  } catch (error) {

    console.error(
      "VIP claim error:",
      error
    );


    showMessage(
      "Claim failed: " +
      (
        error?.message ||
        error
      ),
      "error"
    );
  }
}


/* =========================================================
   CLAIM BUTTON
========================================================= */

function setupClaimButton() {

  if (claimButtonStarted) {
    return;
  }


  const button =
    $("claimIncomeBtn") ||
    $("claimDailyIncome");


  if (!button) {

    console.warn(
      "Claim income button not found."
    );

    return;
  }


  claimButtonStarted = true;


  button.addEventListener(
    "click",
    claimDailyIncome
  );
}


/* =========================================================
   EXPOSE FUNCTIONS
========================================================= */

window.buyVip =
  buyVip;

window.claimDailyIncome =
  claimDailyIncome;

window.claimIncome =
  claimDailyIncome;

window.loadVipPlans =
  loadVipPlans;


/* =========================================================
   INIT
========================================================= */

async function initVipPage() {

  try {

    const user =
      await waitForUser();


    if (!user) {

      showMessage(
        "Please login to view VIP plans.",
        "error"
      );

      return;
    }


    currentUser =
      user;


    if (!vipListenerStarted) {

      vipListenerStarted = true;

      loadVipPlans();
    }


    if (!userListenerStarted) {

      userListenerStarted = true;

      loadUserData(
        user.uid
      );
    }


    setupClaimButton();


    console.log(
      "Money Vault secure VIP initialized."
    );


  } catch (error) {

    console.error(
      "VIP initialization error:",
      error
    );


    showMessage(
      "VIP initialization failed: " +
      (
        error?.message ||
        error
      ),
      "error"
    );
  }
}


/* =========================================================
   START
========================================================= */

if (
  document.readyState ===
  "loading"
) {

  document.addEventListener(
    "DOMContentLoaded",
    initVipPage
  );

} else {

  initVipPage();
}
