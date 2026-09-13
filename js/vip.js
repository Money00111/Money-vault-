/* =========================================================
   MONEY VAULT - VIP.JS
   AUTOMATIC VIP VERSION
   CURRENCY: RWF / FRW

   FEATURES
   - Loads active VIP plans
   - Automatic VIP purchase
   - Deducts VIP price from user balance
   - Same VIP plan cannot be purchased twice
   - Multiple different VIP plans allowed
   - Creates approved VIP request automatically
   - Creates VIP buyer record
   - Creates VIP purchase transaction
   - Automatic referral bonus = 1,000 RWF
   - Referral bonus paid once only
   - Daily income available after 24 hours
   - Claim once per 24 hours
   - Supports claimDailyIncome / claimIncomeBtn
========================================================= */

import {
  auth,
  db,
  authReady
} from "./firebase.js";

import {
  ref,
  get,
  set,
  update,
  push,
  query,
  orderByChild,
  equalTo,
  onValue,
  runTransaction
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

const REFERRAL_BONUS = 1000;
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
  return safeNumber(
    plan?.totalProfit ??
    plan?.profit ??
    (getDailyIncome(plan) * getDuration(plan))
  );
}

function showMessage(message, type = "info") {
  console.log(`[VIP ${type}]`, message);

  const possibleIds = [
    "vipMessage",
    "vipStatus",
    "message",
    "statusMessage"
  ];

  let element = null;

  for (const id of possibleIds) {
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
    console.warn("Auth ready warning:", error);
  }

  if (auth.currentUser) {
    currentUser = auth.currentUser;
    return currentUser;
  }

  return await new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      unsubscribe();

      if (user) {
        currentUser = user;
      }

      resolve(user);
    });
  });
}


/* =========================================================
   LOAD VIP PLANS
========================================================= */

function loadVipPlans() {
  const plansRef = ref(db, "vipPlans");

  onValue(
    plansRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        vipPlansData = {};
        renderVipPlans();
        return;
      }

      vipPlansData = snapshot.val() || {};
      renderVipPlans();
    },
    (error) => {
      console.error("VIP plans load error:", error);
      showMessage(
        "VIP Plans failed to load: " + error.message,
        "error"
      );
    }
  );
}


/* =========================================================
   LOAD USER DATA
========================================================= */

function loadUserData(uid) {
  if (!uid) return;

  const userRef = ref(db, `users/${uid}`);

  onValue(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        userData = {};
        ownedVipPlans = {};
        renderVipPlans();
        renderOwnedVipPlans();
        return;
      }

      userData = snapshot.val() || {};
      ownedVipPlans = userData.vipPlans || {};

      renderVipPlans();
      renderOwnedVipPlans();
      updateBalanceDisplay();
    },
    (error) => {
      console.error("User data load error:", error);
      showMessage(
        "Failed to load user data: " + error.message,
        "error"
      );
    }
  );
}


/* =========================================================
   BALANCE DISPLAY
========================================================= */

function updateBalanceDisplay() {
  const balance = safeNumber(userData.balance);

  const ids = [
    "vipBalance",
    "userBalance",
    "balance",
    "balanceAmount"
  ];

  ids.forEach((id) => {
    const el = $(id);

    if (el) {
      el.textContent = `${formatMoney(balance)} RWF`;
    }
  });
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
    console.warn("VIP grid element not found.");
    return;
  }

  grid.innerHTML = "";

  const plans = Object.entries(vipPlansData || {});

  if (!plans.length) {
    grid.innerHTML = `
      <div class="empty-state">
        No VIP plans available.
      </div>
    `;
    return;
  }

  plans.forEach(([rawId, rawPlan]) => {
    const plan = rawPlan || {};
    const planId = getPlanId(plan, rawId);

    const name = getPlanName(plan);
    const price = getPlanPrice(plan);
    const dailyIncome = getDailyIncome(plan);
    const duration = getDuration(plan);
    const totalProfit = getTotalProfit(plan);

    const alreadyOwned =
      ownedVipPlans &&
      Object.prototype.hasOwnProperty.call(
        ownedVipPlans,
        planId
      );

    const ownedRecord =
      alreadyOwned ? ownedVipPlans[planId] : null;

    const active =
      ownedRecord?.active === true ||
      ownedRecord?.status === "active";

    const card = document.createElement("div");

    card.className = "vip-card";

    card.innerHTML = `
      <div class="vip-card-inner">

        <h3>${escapeHtml(name)}</h3>

        <div class="vip-price">
          ${formatMoney(price)} RWF
        </div>

        <div class="vip-details">

          <div>
            <span>Daily Income</span>
            <strong>${formatMoney(dailyIncome)} RWF</strong>
          </div>

          <div>
            <span>Duration</span>
            <strong>${duration} Days</strong>
          </div>

          <div>
            <span>Total Profit</span>
            <strong>${formatMoney(totalProfit)} RWF</strong>
          </div>

        </div>

        ${
          alreadyOwned
            ? `
              <button
                class="vip-buy-btn owned"
                disabled
              >
                ${active ? "ACTIVE" : "OWNED"}
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

    const button = card.querySelector(".vip-buy-btn");

    if (button && !alreadyOwned) {
      button.addEventListener("click", () => {
        buyVip(planId);
      });
    }

    grid.appendChild(card);
  });
}


/* =========================================================
   RENDER OWNED VIP PLANS
========================================================= */

function renderOwnedVipPlans() {
  const container =
    $("ownedVipList") ||
    $("ownedVIPList") ||
    $("myVipPlans");

  if (!container) return;

  container.innerHTML = "";

  const entries = Object.entries(
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

  entries.forEach(([planId, vip]) => {
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
      (vip?.active ? "active" : "inactive");

    const lastClaim =
      safeNumber(
        vip?.lastClaim ??
        vip?.lastClaimTime ??
        vip?.approvedAt ??
        vip?.purchasedAt
      );

    const card = document.createElement("div");

    card.className = "owned-vip-card";

    card.innerHTML = `
      <div>
        <h4>${escapeHtml(name)}</h4>

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
                ? new Date(lastClaim).toLocaleString()
                : "Not claimed"
            }
          </span>
        </p>
      </div>
    `;

    container.appendChild(card);
  });
}


/* =========================================================
   BUY VIP
========================================================= */

async function buyVip(planId) {
  try {
    const user = await waitForUser();

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

    const price = getPlanPrice(plan);

    if (price <= 0) {
      showMessage(
        "Invalid VIP price.",
        "error"
      );
      return;
    }

    const existing =
      ownedVipPlans?.[planId];

    if (existing) {
      showMessage(
        "You already own this VIP plan.",
        "error"
      );
      return;
    }

    const confirmed = confirm(
      `Buy ${getPlanName(plan)} for ${formatMoney(price)} RWF?`
    );

    if (!confirmed) return;

    const userRef =
      ref(db, `users/${user.uid}`);

    /*
      Transaction on ONLY balance.

      This avoids replacing the whole user object.
    */

    const balanceResult =
      await runTransaction(
        ref(db, `users/${user.uid}/balance`),
        (currentBalance) => {
          const balance =
            safeNumber(currentBalance);

          if (balance < price) {
            return;
          }

          return balance - price;
        }
      );

    if (!balanceResult.committed) {
      showMessage(
        "Insufficient balance.",
        "error"
      );
      return;
    }

    const now = Date.now();

    const requestKey =
      push(ref(db, "vipPurchaseRequests")).key;

    const buyerKey =
      push(ref(db, "vipBuyers")).key;

    const transactionKey =
      push(ref(db, "transactions")).key;

    if (!requestKey || !buyerKey || !transactionKey) {
      /*
        Refund if keys could not be generated.
      */

      await runTransaction(
        ref(db, `users/${user.uid}/balance`),
        (balance) => safeNumber(balance) + price
      );

      throw new Error(
        "Could not create VIP records."
      );
    }

    const vipRecord = {
      planId: planId,
      vipPlanId: planId,
      name: getPlanName(plan),
      vipName: getPlanName(plan),

      price: price,
      dailyIncome: getDailyIncome(plan),
      totalProfit: getTotalProfit(plan),
      duration: getDuration(plan),

      currency: CURRENCY,

      status: "active",
      active: true,

      purchasedAt: now,
      approvedAt: now,

      /*
        IMPORTANT:
        No income is credited at purchase time.
        Claim becomes available after 24 hours.
      */
      lastClaim: now,
      lastClaimTime: now
    };


    /* =====================================================
       MULTI LOCATION WRITE
    ===================================================== */

    const updates = {};

    updates[
      `users/${user.uid}/vipPlans/${planId}`
    ] = vipRecord;

    updates[
      `vipPurchaseRequests/${requestKey}`
    ] = {
      uid: user.uid,

      planId: planId,
      vipPlanId: planId,

      vipName: getPlanName(plan),

      price: price,
      dailyIncome: getDailyIncome(plan),
      totalProfit: getTotalProfit(plan),
      duration: getDuration(plan),

      paymentMethod: "Account Balance",
      currency: CURRENCY,

      status: "approved",
      autoApproved: true,

      createdAt: now,
      approvedAt: now
    };


    updates[
      `vipBuyers/${buyerKey}`
    ] = {
      uid: user.uid,

      planId: planId,
      vipPlanId: planId,

      vipName: getPlanName(plan),

      price: price,
      dailyIncome: getDailyIncome(plan),
      totalProfit: getTotalProfit(plan),
      duration: getDuration(plan),

      currency: CURRENCY,

      status: "active",
      active: true,

      purchaseRequestId: requestKey,

      createdAt: now,
      approvedAt: now
    };


    updates[
      `transactions/${transactionKey}`
    ] = {
      uid: user.uid,

      type: "vip_purchase",
      category: "VIP",

      amount: price,

      currency: CURRENCY,

      planId: planId,
      vipPlanId: planId,

      description:
        `Purchased ${getPlanName(plan)}`,

      status: "completed",

      createdAt: now
    };


    await update(
      ref(db),
      updates
    );


    /* =====================================================
       REFERRAL BONUS
    ===================================================== */

    try {
      await payReferralBonus(
        user.uid,
        requestKey
      );
    } catch (referralError) {
      console.error(
        "Referral bonus error:",
        referralError
      );

      /*
        VIP purchase itself remains successful.
        Referral error is shown in console.
      */
    }


    showMessage(
      `${getPlanName(plan)} purchased successfully.`,
      "success"
    );

    alert(
      `${getPlanName(plan)} purchased successfully!\n\n` +
      `Price: ${formatMoney(price)} RWF\n` +
      `Daily income: ${formatMoney(getDailyIncome(plan))} RWF\n\n` +
      `Your first income claim will be available after 24 hours.`
    );

  } catch (error) {
    console.error("VIP purchase error:", error);

    showMessage(
      "VIP purchase failed: " +
      (error?.message || error),
      "error"
    );
  }
}


/* =========================================================
   FIND REFERRER
========================================================= */

async function findReferrer(referredUserUid) {
  const referredUserSnap =
    await get(
      ref(db, `users/${referredUserUid}`)
    );

  if (!referredUserSnap.exists()) {
    return null;
  }

  const referredUser =
    referredUserSnap.val() || {};

  const referralCode =
    referredUser.referredBy;

  if (!referralCode) {
    return null;
  }


  /* -------------------------------------------------------
     FIRST: referralCodes/{code}
  ------------------------------------------------------- */

  const codeSnap =
    await get(
      ref(
        db,
        `referralCodes/${referralCode}`
      )
    );

  if (codeSnap.exists()) {
    const codeData =
      codeSnap.val() || {};

    if (
      codeData.uid &&
      codeData.uid !== referredUserUid
    ) {
      return codeData.uid;
    }
  }


  /* -------------------------------------------------------
     FALLBACK: search users by referralCode
  ------------------------------------------------------- */

  const usersQuery =
    query(
      ref(db, "users"),
      orderByChild("referralCode"),
      equalTo(referralCode)
    );

  const usersSnap =
    await get(usersQuery);

  if (!usersSnap.exists()) {
    return null;
  }

  let referrerUid = null;

  usersSnap.forEach((child) => {
    if (
      !referrerUid &&
      child.key !== referredUserUid
    ) {
      referrerUid = child.key;
    }
  });

  return referrerUid;
}


/* =========================================================
   PAY REFERRAL BONUS
========================================================= */

async function payReferralBonus(
  referredUserUid,
  purchaseRequestId
) {
  if (!referredUserUid) return;

  /*
    One referral bonus per referred user.
  */

  const bonusRef =
    ref(
      db,
      `vipReferralBonuses/${referredUserUid}`
    );

  const existingBonus =
    await get(bonusRef);

  if (existingBonus.exists()) {
    console.log(
      "Referral bonus already paid."
    );
    return;
  }

  const referrerUid =
    await findReferrer(
      referredUserUid
    );

  if (!referrerUid) {
    console.log(
      "No referrer found."
    );
    return;
  }

  if (referrerUid === referredUserUid) {
    return;
  }

  const referrerSnap =
    await get(
      ref(
        db,
        `users/${referrerUid}`
      )
    );

  if (!referrerSnap.exists()) {
    return;
  }

  const referrer =
    referrerSnap.val() || {};

  const currentBalance =
    safeNumber(referrer.balance);

  const currentReferralBonus =
    safeNumber(referrer.referralBonus);

  const currentReferralEarnings =
    safeNumber(referrer.referralEarnings);

  const currentReferralCount =
    safeNumber(referrer.referralCount);


  /*
    Transaction protects against two clients
    trying to pay the same bonus simultaneously.
  */

  const bonusClaim =
    await runTransaction(
      bonusRef,
      (current) => {
        if (current !== null) {
          return;
        }

        return {
          referredUserUid:
            referredUserUid,

          referrerUid:
            referrerUid,

          amount:
            REFERRAL_BONUS,

          currency:
            CURRENCY,

          status:
            "paid",

          purchaseRequestId:
            purchaseRequestId,

          createdAt:
            Date.now()
        };
      }
    );


  if (!bonusClaim.committed) {
    console.log(
      "Referral bonus was already claimed."
    );
    return;
  }


  /*
    Update referrer.
  */

  const transactionKey =
    push(ref(db, "transactions")).key;

  const now = Date.now();

  const updates = {};

  updates[
    `users/${referrerUid}/balance`
  ] =
    currentBalance + REFERRAL_BONUS;

  updates[
    `users/${referrerUid}/referralBonus`
  ] =
    currentReferralBonus + REFERRAL_BONUS;

  updates[
    `users/${referrerUid}/referralEarnings`
  ] =
    currentReferralEarnings + REFERRAL_BONUS;

  updates[
    `users/${referrerUid}/referralCount`
  ] =
    currentReferralCount + 1;


  if (transactionKey) {
    updates[
      `transactions/${transactionKey}`
    ] = {
      uid: referrerUid,

      type: "referral_bonus",
      category: "Referral",

      amount: REFERRAL_BONUS,

      currency: CURRENCY,

      referredUserUid:
        referredUserUid,

      purchaseRequestId:
        purchaseRequestId,

      description:
        "VIP Referral Bonus",

      status:
        "completed",

      createdAt:
        now
    };
  }


  await update(
    ref(db),
    updates
  );

  console.log(
    `Referral bonus ${REFERRAL_BONUS} RWF paid to ${referrerUid}`
  );
}


/* =========================================================
   DAILY INCOME
========================================================= */

async function claimDailyIncome() {
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

    const freshSnap =
      await get(
        ref(db, `users/${user.uid}`)
      );

    if (!freshSnap.exists()) {
      showMessage(
        "User account not found.",
        "error"
      );
      return;
    }

    const freshUser =
      freshSnap.val() || {};

    const vipPlans =
      freshUser.vipPlans || {};

    const now =
      Date.now();

    let totalIncome = 0;
    const claimUpdates = {};

    Object.entries(vipPlans).forEach(
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

        /*
          IMPORTANT:
          Must wait full 24 hours.
        */

        if (
          !lastClaim ||
          now - lastClaim < DAY_MS
        ) {
          return;
        }

        totalIncome += dailyIncome;

        claimUpdates[
          `users/${user.uid}/vipPlans/${planId}/lastClaim`
        ] = now;

        claimUpdates[
          `users/${user.uid}/vipPlans/${planId}/lastClaimTime`
        ] = now;
      }
    );


    if (totalIncome <= 0) {
      showMessage(
        "No VIP income is ready yet. Please wait until 24 hours have passed.",
        "info"
      );
      return;
    }


    /* -----------------------------------------------------
       Get latest balance/totals
    ----------------------------------------------------- */

    const balance =
      safeNumber(freshUser.balance);

    const totalEarnings =
      safeNumber(freshUser.totalEarnings);

    const totalTransactions =
      safeNumber(
        freshUser.totalTransactions
      );


    claimUpdates[
      `users/${user.uid}/balance`
    ] =
      balance + totalIncome;

    claimUpdates[
      `users/${user.uid}/totalEarnings`
    ] =
      totalEarnings + totalIncome;

    claimUpdates[
      `users/${user.uid}/totalTransactions`
    ] =
      totalTransactions + 1;


    const transactionKey =
      push(
        ref(db, "transactions")
      ).key;

    if (transactionKey) {
      claimUpdates[
        `transactions/${transactionKey}`
      ] = {
        uid: user.uid,

        type: "vip_income",
        category: "VIP",

        amount: totalIncome,

        currency: CURRENCY,

        description:
          "Daily VIP Income",

        status:
          "completed",

        createdAt:
          now
      };
    }


    await update(
      ref(db),
      claimUpdates
    );


    showMessage(
      `You received ${formatMoney(totalIncome)} RWF VIP income.`,
      "success"
    );

    alert(
      `VIP income claimed successfully!\n\n` +
      `Amount: ${formatMoney(totalIncome)} RWF`
    );

  } catch (error) {
    console.error(
      "Claim income error:",
      error
    );

    showMessage(
      "Claim failed: " +
      (error?.message || error),
      "error"
    );
  }
}


/* =========================================================
   CLAIM BUTTON
========================================================= */

function setupClaimButton() {
  const button =
    $("claimIncomeBtn") ||
    $("claimDailyIncome");

  if (!button) {
    console.warn(
      "Claim income button not found."
    );
    return;
  }

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
      console.warn(
        "No authenticated user."
      );

      showMessage(
        "Please login to view VIP plans.",
        "error"
      );

      return;
    }

    currentUser = user;

    if (!vipListenerStarted) {
      vipListenerStarted = true;
      loadVipPlans();
    }

    if (!userListenerStarted) {
      userListenerStarted = true;
      loadUserData(user.uid);
    }

    setupClaimButton();

    console.log(
      "Money Vault VIP initialized."
    );

  } catch (error) {
    console.error(
      "VIP initialization error:",
      error
    );

    showMessage(
      "VIP initialization failed: " +
      (error?.message || error),
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
