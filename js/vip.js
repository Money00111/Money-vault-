/* =========================================================
   MONEY VAULT - VIP.JS
   AUTOMATIC VIP PURCHASE VERSION

   CURRENCY: RWF / FRW

   FEATURES
   ---------------------------------------------------------
   1. Loads active VIP plans
   2. User buys VIP automatically
   3. Balance deducted immediately
   4. Multiple different VIP plans allowed
   5. Same VIP plan cannot be purchased twice
   6. VIP activated immediately
   7. Daily income claim after 24 hours
   8. Referral bonus = 1,000 RWF
   9. Referrer gets bonus immediately after successful VIP buy
   10. Referral bonus paid only once per referred user
   11. Transaction records created
   12. Mobile sidebar supported
========================================================= */

import { auth, db } from "./firebase.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

import {
  ref,
  get,
  set,
  update,
  onValue,
  runTransaction,
  push,
  query,
  orderByChild,
  equalTo
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-database.js";


/* =========================================================
   CONFIG
========================================================= */

const CURRENCY = "RWF";
const REFERRAL_BONUS = 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const VIP_PLANS_PATH = "vipPlans";
const USERS_PATH = "users";
const VIP_BUYERS_PATH = "vipBuyers";
const TRANSACTIONS_PATH = "transactions";


/* =========================================================
   GLOBAL STATE
========================================================= */

let currentUser = null;
let userData = {};
let vipPlans = {};
let ownedVIPs = [];

let userListener = null;
let plansListener = null;
let buyersListener = null;

let claimTimerInterval = null;
let selectedClaimVIP = null;


/* =========================================================
   DOM
========================================================= */

const $ = (id) => document.getElementById(id);


/* =========================================================
   HELPERS
========================================================= */

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}


function money(value) {
  return `${number(value).toLocaleString("en-US")} ${CURRENCY}`;
}


function now() {
  return Date.now();
}


function normalizeStatus(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}


function getPlanName(plan, fallback = "VIP") {
  return (
    plan?.name ||
    plan?.vipName ||
    fallback
  );
}


function getPlanPrice(plan) {
  return number(
    plan?.price ??
    plan?.amount ??
    plan?.cost
  );
}


function getPlanDailyIncome(plan) {
  return number(
    plan?.dailyIncome ??
    plan?.dailyProfit ??
    plan?.daily
  );
}


function getPlanDays(plan) {
  return number(
    plan?.duration ??
    plan?.totalDays ??
    plan?.days
  );
}


function getPlanTotalProfit(plan) {
  const direct = number(
    plan?.totalProfit ??
    plan?.profit
  );

  if (direct > 0) {
    return direct;
  }

  return getPlanDailyIncome(plan) * getPlanDays(plan);
}


function escapeHTML(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function toast(message, type = "info") {
  let box = document.getElementById("mvToast");

  if (!box) {
    box = document.createElement("div");
    box.id = "mvToast";

    box.style.position = "fixed";
    box.style.left = "50%";
    box.style.bottom = "25px";
    box.style.transform = "translateX(-50%)";
    box.style.zIndex = "99999";
    box.style.padding = "13px 18px";
    box.style.borderRadius = "10px";
    box.style.background = "#111";
    box.style.color = "#fff";
    box.style.fontSize = "14px";
    box.style.maxWidth = "90%";
    box.style.textAlign = "center";
    box.style.boxShadow = "0 5px 20px rgba(0,0,0,.25)";

    document.body.appendChild(box);
  }

  box.textContent = message;

  if (type === "success") {
    box.style.background = "#16803c";
  } else if (type === "error") {
    box.style.background = "#c62828";
  } else {
    box.style.background = "#111";
  }

  box.style.display = "block";

  clearTimeout(box._timer);

  box._timer = setTimeout(() => {
    box.style.display = "none";
  }, 3500);
}


/* =========================================================
   AUTH
========================================================= */

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  await startVIPSystem();
});


/* =========================================================
   START VIP SYSTEM
========================================================= */

async function startVIPSystem() {

  try {

    await loadUser();

    startUserListener();
    startPlansListener();
    startBuyersListener();

    setupMenu();
    setupLogout();

    updateClaimTimer();

    if (claimTimerInterval) {
      clearInterval(claimTimerInterval);
    }

    claimTimerInterval = setInterval(() => {
      updateClaimTimer();
    }, 1000);

  } catch (error) {

    console.error("VIP SYSTEM ERROR:", error);

    toast(
      "VIP system failed to load: " +
      (error?.message || "Unknown error"),
      "error"
    );
  }
}


/* =========================================================
   LOAD USER
========================================================= */

async function loadUser() {

  if (!currentUser) {
    return;
  }

  const userRef = ref(
    db,
    `${USERS_PATH}/${currentUser.uid}`
  );

  const snapshot = await get(userRef);

  if (!snapshot.exists()) {
    userData = {};
    return;
  }

  userData = snapshot.val() || {};

  updateBalanceUI();
}


/* =========================================================
   USER LISTENER
========================================================= */

function startUserListener() {

  if (!currentUser) {
    return;
  }

  if (userListener) {
    userListener();
  }

  const userRef = ref(
    db,
    `${USERS_PATH}/${currentUser.uid}`
  );

  userListener = onValue(
    userRef,
    (snapshot) => {

      userData = snapshot.val() || {};

      updateBalanceUI();
      updateHeroStats();
      renderOwnedVIPs();
      updateClaimVIP();
    },
    (error) => {

      console.error(
        "User listener error:",
        error
      );
    }
  );
}


/* =========================================================
   BALANCE UI
========================================================= */

function updateBalanceUI() {

  const balanceElement = $("balance");

  if (!balanceElement) {
    return;
  }

  balanceElement.textContent =
    money(userData?.balance || 0);
}


/* =========================================================
   VIP PLANS LISTENER
========================================================= */

function startPlansListener() {

  if (plansListener) {
    plansListener();
  }

  const plansRef = ref(
    db,
    VIP_PLANS_PATH
  );

  plansListener = onValue(
    plansRef,
    (snapshot) => {

      vipPlans = snapshot.val() || {};

      renderVIPPlans();
    },
    (error) => {

      console.error(
        "VIP plans listener error:",
        error
      );

      toast(
        "VIP Plans failed to load.",
        "error"
      );
    }
  );
}


/* =========================================================
   VIP BUYERS LISTENER
========================================================= */

function startBuyersListener() {

  if (!currentUser) {
    return;
  }

  if (buyersListener) {
    buyersListener();
  }

  const buyersRef = ref(
    db,
    `${VIP_BUYERS_PATH}/${currentUser.uid}`
  );

  buyersListener = onValue(
    buyersRef,
    (snapshot) => {

      const data = snapshot.val() || {};

      ownedVIPs = [];

      Object.entries(data).forEach(
        ([id, buyer]) => {

          if (!buyer) {
            return;
          }

          ownedVIPs.push({
            id,
            ...buyer
          });
        }
      );

      renderOwnedVIPs();
      updateHeroStats();
      updateClaimVIP();
      renderVIPPlans();
    },
    (error) => {

      console.error(
        "VIP buyers listener error:",
        error
      );
    }
  );
}


/* =========================================================
   GET ACTIVE VIPS
========================================================= */

function getActiveVIPs() {

  const currentTime = now();

  return ownedVIPs.filter((vip) => {

    const status =
      normalizeStatus(vip.status);

    if (
      status === "expired" ||
      status === "inactive" ||
      status === "rejected"
    ) {
      return false;
    }

    if (vip.active === false) {
      return false;
    }

    const start =
      number(
        vip.startTime ||
        vip.activatedAt ||
        vip.approvedAt ||
        vip.createdAt
      );

    const days =
      number(
        vip.duration ||
        vip.totalDays
      );

    if (
      start > 0 &&
      days > 0
    ) {

      const expiry =
        start + days * DAY_MS;

      if (currentTime >= expiry) {
        return false;
      }
    }

    return true;
  });
}


/* =========================================================
   RENDER VIP PLANS
========================================================= */

function renderVIPPlans() {

  const grid = $("vipGrid");

  if (!grid) {
    return;
  }

  const entries =
    Object.entries(vipPlans || {});

  if (!entries.length) {

    grid.innerHTML = `
      <div class="empty-state">
        No VIP plans available.
      </div>
    `;

    return;
  }

  const ownedPlanIds =
    new Set(
      ownedVIPs.map(
        (vip) =>
          String(
            vip.planId ||
            vip.vipPlanId ||
            ""
          )
      )
    );

  let html = "";

  entries.forEach(
    ([planId, plan]) => {

      if (!plan) {
        return;
      }

      const status =
        normalizeStatus(
          plan.status
        );

      if (
        status &&
        status !== "active" &&
        status !== "enabled"
      ) {
        return;
      }

      const name =
        getPlanName(
          plan,
          `VIP ${planId}`
        );

      const price =
        getPlanPrice(plan);

      const daily =
        getPlanDailyIncome(plan);

      const days =
        getPlanDays(plan);

      const totalProfit =
        getPlanTotalProfit(plan);

      const alreadyOwned =
        ownedPlanIds.has(
          String(planId)
        );

      html += `
        <div class="vip-card">

          <div class="vip-card-header">
            <h3>${escapeHTML(name)}</h3>
          </div>

          <div class="vip-card-body">

            <p>
              Price:
              <strong>${money(price)}</strong>
            </p>

            <p>
              Daily Income:
              <strong>${money(daily)}</strong>
            </p>

            <p>
              Duration:
              <strong>${days} days</strong>
            </p>

            <p>
              Total Profit:
              <strong>${money(totalProfit)}</strong>
            </p>

            ${
              alreadyOwned
                ? `
                  <button
                    class="vip-buy-btn"
                    disabled
                  >
                    Already Purchased
                  </button>
                `
                : `
                  <button
                    class="vip-buy-btn"
                    data-plan-id="${escapeHTML(planId)}"
                    onclick="buyVIP('${escapeHTML(planId)}')"
                  >
                    Buy Now
                  </button>
                `
            }

          </div>
        </div>
      `;
    }
  );

  if (!html) {

    grid.innerHTML = `
      <div class="empty-state">
        No active VIP plans available.
      </div>
    `;

    return;
  }

  grid.innerHTML = html;
}


/* =========================================================
   BUY VIP
========================================================= */

async function buyVIP(planId) {

  if (!currentUser) {
    toast(
      "Please login first.",
      "error"
    );
    return;
  }

  const plan =
    vipPlans?.[planId];

  if (!plan) {
    toast(
      "VIP plan not found.",
      "error"
    );
    return;
  }

  const price =
    getPlanPrice(plan);

  const dailyIncome =
    getPlanDailyIncome(plan);

  const days =
    getPlanDays(plan);

  const totalProfit =
    getPlanTotalProfit(plan);

  const vipName =
    getPlanName(
      plan,
      `VIP ${planId}`
    );

  if (price <= 0) {
    toast(
      "Invalid VIP price.",
      "error"
    );
    return;
  }

  if (ownedVIPs.some(
    (vip) =>
      String(
        vip.planId ||
        vip.vipPlanId ||
        ""
      ) === String(planId)
  )) {

    toast(
      "You already purchased this VIP.",
      "error"
    );

    return;
  }

  const balance =
    number(userData?.balance);

  if (balance < price) {

    toast(
      `Insufficient balance. You need ${money(price)}.`,
      "error"
    );

    return;
  }

  const confirmed =
    confirm(
      `Buy ${vipName} for ${money(price)}?`
    );

  if (!confirmed) {
    return;
  }

  disableBuyButtons(true);

  const purchaseTime = now();

  const buyerRef =
    ref(
      db,
      `${VIP_BUYERS_PATH}/${currentUser.uid}`
    );

  const newBuyerRef =
    push(buyerRef);

  const buyerId =
    newBuyerRef.key;

  if (!buyerId) {

    disableBuyButtons(false);

    toast(
      "Could not create VIP purchase.",
      "error"
    );

    return;
  }

  let balanceDeducted = false;
  let buyerCreated = false;
  let transactionCreated = false;

  try {

    /* -----------------------------------------------------
       1. DEDUCT USER BALANCE
    ----------------------------------------------------- */

    const userRef =
      ref(
        db,
        `${USERS_PATH}/${currentUser.uid}`
      );

    await runTransaction(
      userRef,
      (current) => {

        if (!current) {
          return current;
        }

        const currentBalance =
          number(current.balance);

        if (currentBalance < price) {
          return;
        }

        return {
          ...current,

          balance:
            currentBalance - price,

          totalTransactions:
            number(
              current.totalTransactions
            ) + 1,

          totalVipPurchases:
            number(
              current.totalVipPurchases
            ) + 1
        };
      }
    );

    balanceDeducted = true;


    /* -----------------------------------------------------
       2. CREATE ACTIVE VIP
    ----------------------------------------------------- */

    const buyerData = {

      uid:
        currentUser.uid,

      planId:
        String(planId),

      vipPlanId:
        String(planId),

      vipName:
        vipName,

      name:
        vipName,

      price:
        price,

      dailyIncome:
        dailyIncome,

      duration:
        days,

      totalDays:
        days,

      totalProfit:
        totalProfit,

      paymentMethod:
        "Account Balance",

      currency:
        CURRENCY,

      status:
        "active",

      active:
        true,

      createdAt:
        purchaseTime,

      activatedAt:
        purchaseTime,

      startTime:
        purchaseTime,

      lastClaim:
        purchaseTime,

      claimCount:
        0,

      totalClaimed:
        0,

      referralBonusGiven:
        false
    };


    await set(
      newBuyerRef,
      buyerData
    );

    buyerCreated = true;


    /* -----------------------------------------------------
       3. CREATE PURCHASE TRANSACTION
    ----------------------------------------------------- */

    const transactionRef =
      push(
        ref(
          db,
          `${TRANSACTIONS_PATH}/${currentUser.uid}`
        )
      );

    await set(
      transactionRef,
      {

        uid:
          currentUser.uid,

        type:
          "vip_purchase",

        category:
          "VIP Purchase",

        amount:
          price,

        currency:
          CURRENCY,

        planId:
          String(planId),

        vipPlanId:
          String(planId),

        vipName:
          vipName,

        status:
          "completed",

        paymentMethod:
          "Account Balance",

        createdAt:
          purchaseTime
      }
    );

    transactionCreated = true;


    /* -----------------------------------------------------
       4. REFERRAL BONUS
       IMPORTANT:
       REFERRER GETS 1,000 RWF IMMEDIATELY
    ----------------------------------------------------- */

    await processReferralBonus(
      purchaseTime,
      vipName,
      planId,
      buyerId
    );


    /* -----------------------------------------------------
       5. SUCCESS
    ----------------------------------------------------- */

    toast(
      `${vipName} purchased successfully. Referral bonus processed.`,
      "success"
    );

    await loadUser();

    renderVIPPlans();
    renderOwnedVIPs();
    updateHeroStats();
    updateClaimVIP();

  } catch (error) {

    console.error(
      "BUY VIP ERROR:",
      error
    );


    /* -----------------------------------------------------
       ROLLBACK
    ----------------------------------------------------- */

    try {

      if (buyerCreated) {

        await set(
          newBuyerRef,
          null
        );
      }

      if (transactionCreated) {

        const userTransactionsRef =
          ref(
            db,
            `${TRANSACTIONS_PATH}/${currentUser.uid}`
          );

        const transactionSnapshot =
          await get(
            userTransactionsRef
          );

        if (
          transactionSnapshot.exists()
        ) {

          const transactions =
            transactionSnapshot.val() || {};

          const updates = {};

          Object.entries(
            transactions
          ).forEach(
            ([id, transaction]) => {

              if (
                transaction &&
                transaction.type === "vip_purchase" &&
                transaction.planId === String(planId) &&
                transaction.createdAt === purchaseTime
              ) {

                updates[
                  `${TRANSACTIONS_PATH}/${currentUser.uid}/${id}`
                ] = null;
              }
            }
          );

          if (
            Object.keys(updates).length
          ) {

            await update(
              ref(db),
              updates
            );
          }
        }
      }


      if (balanceDeducted) {

        const userRef =
          ref(
            db,
            `${USERS_PATH}/${currentUser.uid}`
          );

        await runTransaction(
          userRef,
          (current) => {

            if (!current) {
              return current;
            }

            return {

              ...current,

              balance:
                number(current.balance) + price,

              totalTransactions:
                Math.max(
                  0,
                  number(
                    current.totalTransactions
                  ) - 1
                ),

              totalVipPurchases:
                Math.max(
                  0,
                  number(
                    current.totalVipPurchases
                  ) - 1
                )
            };
          }
        );
      }

    } catch (rollbackError) {

      console.error(
        "ROLLBACK ERROR:",
        rollbackError
      );
    }


    toast(
      "VIP purchase failed: " +
      (
        error?.message ||
        "Unknown error"
      ),
      "error"
    );

  } finally {

    disableBuyButtons(false);
  }
}


/* =========================================================
   REFERRAL BONUS
========================================================= */

async function processReferralBonus(
  purchaseTime,
  vipName,
  planId,
  buyerId
) {

  if (!currentUser) {
    return;
  }

  const referredUserUid =
    currentUser.uid;


  /* -------------------------------------------------------
     GET REFERRER VALUE
     Can be:
     - UID
     - referralCode
     - referredBy
     - referrerUid
     - referrerId
     - referralCodeUsed
  ------------------------------------------------------- */

  const referrerValue =
    String(
      userData?.referredBy ||
      userData?.referrerUid ||
      userData?.referrerId ||
      userData?.referralCodeUsed ||
      ""
    ).trim();


  if (!referrerValue) {

    console.log(
      "No referrer found for this user."
    );

    return;
  }


  /* -------------------------------------------------------
     FIND REFERRER
  ------------------------------------------------------- */

  let referrerUid =
    "";


  /* First assume value is UID */
  const directReferrerRef =
    ref(
      db,
      `${USERS_PATH}/${referrerValue}`
    );

  const directSnapshot =
    await get(
      directReferrerRef
    );

  if (
    directSnapshot.exists()
  ) {

    referrerUid =
      referrerValue;

  } else {

    /* -----------------------------------------------------
       If not UID, search referralCode
    ----------------------------------------------------- */

    const usersRef =
      ref(db, USERS_PATH);

    const referralQuery =
      query(
        usersRef,
        orderByChild("referralCode"),
        equalTo(referrerValue)
      );

    const referralSnapshot =
      await get(
        referralQuery
      );

    if (
      referralSnapshot.exists()
    ) {

      const users =
        referralSnapshot.val() || {};

      const firstMatch =
        Object.keys(users)[0];

      if (firstMatch) {
        referrerUid =
          firstMatch;
      }
    }
  }


  /* -------------------------------------------------------
     REFERRER NOT FOUND
  ------------------------------------------------------- */

  if (!referrerUid) {

    console.warn(
      "Referrer not found:",
      referrerValue
    );

    return;
  }


  /* -------------------------------------------------------
     PREVENT SELF REFERRAL
  ------------------------------------------------------- */

  if (
    String(referrerUid) ===
    String(referredUserUid)
  ) {

    console.warn(
      "Self referral blocked."
    );

    return;
  }


  /* -------------------------------------------------------
     CHECK IF BONUS ALREADY GIVEN
  ------------------------------------------------------- */

  const buyerRef =
    ref(
      db,
      `${VIP_BUYERS_PATH}/${referredUserUid}/${buyerId}`
    );

  const buyerSnapshot =
    await get(
      buyerRef
    );

  if (
    buyerSnapshot.exists()
  ) {

    const buyer =
      buyerSnapshot.val() || {};

    if (
      buyer.referralBonusGiven === true
    ) {

      console.log(
        "Referral bonus already paid for this VIP."
      );

      return;
    }
  }


  /* -------------------------------------------------------
     REFERRER USER
  ------------------------------------------------------- */

  const referrerRef =
    ref(
      db,
      `${USERS_PATH}/${referrerUid}`
    );


  /* -------------------------------------------------------
     PAY REFERRER
     +1,000 RWF
  ------------------------------------------------------- */

  let bonusPaid = false;

  await runTransaction(
    referrerRef,
    (current) => {

      if (!current) {
        return;
      }

      const oldBalance =
        number(current.balance);

      const oldReferralBonus =
        number(current.referralBonus);

      const oldReferralEarnings =
        number(current.referralEarnings);

      const oldReferralCount =
        number(current.referralCount);

      const oldTotalEarnings =
        number(current.totalEarnings);


      bonusPaid = true;

      return {

        ...current,

        balance:
          oldBalance + REFERRAL_BONUS,

        referralBonus:
          oldReferralBonus + REFERRAL_BONUS,

        referralEarnings:
          oldReferralEarnings + REFERRAL_BONUS,

        referralCount:
          oldReferralCount + 1,

        totalEarnings:
          oldTotalEarnings + REFERRAL_BONUS
      };
    }
  );


  if (!bonusPaid) {

    console.warn(
      "Could not pay referral bonus."
    );

    return;
  }


  /* -------------------------------------------------------
     MARK THIS VIP AS BONUS PAID
  ------------------------------------------------------- */

  await update(
    buyerRef,
    {
      referralBonusGiven:
        true,

      referralBonusAmount:
        REFERRAL_BONUS,

      referralBonusPaidAt:
        purchaseTime,

      referralBonusTo:
        referrerUid
    }
  );


  /* -------------------------------------------------------
     CREATE REFERRAL TRANSACTION
  ------------------------------------------------------- */

  const referralTransactionRef =
    push(
      ref(
        db,
        `${TRANSACTIONS_PATH}/${referrerUid}`
      )
    );

  await set(
    referralTransactionRef,
    {

      uid:
        referrerUid,

      type:
        "referral_bonus",

      category:
        "Referral Bonus",

      amount:
        REFERRAL_BONUS,

      currency:
        CURRENCY,

      referredUser:
        referredUserUid,

      referredUserName:
        userData?.fullName ||
        userData?.name ||
        "",

      planId:
        String(planId),

      vipName:
        vipName,

      status:
        "completed",

      createdAt:
        purchaseTime
    }
  );


  /* -------------------------------------------------------
     OPTIONAL NOTIFICATION
  ------------------------------------------------------- */

  try {

    const notificationRef =
      push(
        ref(
          db,
          `notifications/${referrerUid}`
        )
      );

    await set(
      notificationRef,
      {

        type:
          "referral_bonus",

        title:
          "Referral Bonus Received",

        message:
          `You received ${money(REFERRAL_BONUS)} referral bonus.`,

        amount:
          REFERRAL_BONUS,

        currency:
          CURRENCY,

        referredUser:
          referredUserUid,

        createdAt:
          purchaseTime,

        read:
          false
      }
    );

  } catch (notificationError) {

    console.warn(
      "Notification failed:",
      notificationError
    );
  }


  toast(
    `Referral bonus ${money(REFERRAL_BONUS)} sent successfully.`,
    "success"
  );
}


/* =========================================================
   RENDER OWNED VIPS
========================================================= */

function renderOwnedVIPs() {

  const container =
    $("ownedVipList");

  if (!container) {
    return;
  }

  if (!ownedVIPs.length) {

    container.innerHTML = `
      <div class="empty-state">
        You don't own any VIP yet.
      </div>
    `;

    return;
  }


  const currentTime =
    now();

  let html = "";


  ownedVIPs.forEach(
    (vip) => {

      const status =
        normalizeStatus(
          vip.status
        );

      const start =
        number(
          vip.startTime ||
          vip.activatedAt ||
          vip.createdAt
        );

      const days =
        number(
          vip.duration ||
          vip.totalDays
        );

      const expiry =
        start > 0 && days > 0
          ? start + days * DAY_MS
          : 0;

      const expired =
        expiry > 0 &&
        currentTime >= expiry;

      const active =
        !expired &&
        vip.active !== false &&
        status !== "expired" &&
        status !== "inactive";


      html += `

        <div class="owned-vip-card">

          <h3>
            ${escapeHTML(
              vip.vipName ||
              vip.name ||
              "VIP"
            )}
          </h3>

          <p>
            Status:
            <strong>
              ${active ? "Active" : "Expired"}
            </strong>
          </p>

          <p>
            Price:
            <strong>
              ${money(vip.price)}
            </strong>
          </p>

          <p>
            Daily Income:
            <strong>
              ${money(vip.dailyIncome)}
            </strong>
          </p>

          <p>
            Total Profit:
            <strong>
              ${money(vip.totalProfit)}
            </strong>
          </p>

          <p>
            Claimed:
            <strong>
              ${money(vip.totalClaimed || 0)}
            </strong>
          </p>

        </div>
      `;
    }
  );


  container.innerHTML =
    html;
}


/* =========================================================
   HERO STATS
========================================================= */

function updateHeroStats() {

  const activeVIPs =
    getActiveVIPs();


  const totalDaily =
    activeVIPs.reduce(
      (sum, vip) =>
        sum +
        number(vip.dailyIncome),
      0
    );


  const totalProfit =
    activeVIPs.reduce(
      (sum, vip) =>
        sum +
        number(vip.totalProfit),
      0
    );


  const currentVip =
    $("currentVip");

  const dailyIncome =
    $("dailyIncome");

  const totalProfitElement =
    $("totalProfit");


  if (currentVip) {

    currentVip.textContent =
      activeVIPs.length
        ? activeVIPs
            .map(
              (vip) =>
                vip.vipName ||
                vip.name ||
                "VIP"
            )
            .join(", ")
        : "VIP 0";
  }


  if (dailyIncome) {

    dailyIncome.textContent =
      money(totalDaily);
  }


  if (totalProfitElement) {

    totalProfitElement.textContent =
      money(totalProfit);
  }
}


/* =========================================================
   FIND READY VIP FOR CLAIM
========================================================= */

function updateClaimVIP() {

  const activeVIPs =
    getActiveVIPs();

  const currentTime =
    now();


  selectedClaimVIP =
    null;


  for (
    const vip of activeVIPs
  ) {

    const lastClaim =
      number(
        vip.lastClaim ||
        vip.startTime ||
        vip.activatedAt ||
        vip.createdAt
      );

    if (
      currentTime -
      lastClaim >= DAY_MS
    ) {

      selectedClaimVIP =
        vip;

      break;
    }
  }


  const button =
    $("claimDailyIncome");

  if (!button) {
    return;
  }


  if (selectedClaimVIP) {

    button.disabled =
      false;

    button.textContent =
      "Claim Daily Income";

  } else {

    button.disabled =
      true;

    button.textContent =
      "Claim Not Ready";
  }
}


/* =========================================================
   CLAIM DAILY INCOME
========================================================= */

async function claimDailyIncome() {

  if (!currentUser) {
    return;
  }

  if (!selectedClaimVIP) {

    toast(
      "Your daily income is not ready yet.",
      "error"
    );

    return;
  }


  const vip =
    selectedClaimVIP;

  const vipId =
    vip.id;

  const income =
    number(vip.dailyIncome);


  if (income <= 0) {

    toast(
      "Invalid daily income.",
      "error"
    );

    return;
  }


  const lastClaim =
    number(
      vip.lastClaim ||
      vip.startTime ||
      vip.activatedAt ||
      vip.createdAt
    );


  if (
    now() -
    lastClaim <
    DAY_MS
  ) {

    toast(
      "You must wait 24 hours before claiming again.",
      "error"
    );

    return;
  }


  const button =
    $("claimDailyIncome");

  if (button) {
    button.disabled = true;
    button.textContent = "Claiming...";
  }


  const userRef =
    ref(
      db,
      `${USERS_PATH}/${currentUser.uid}`
    );


  try {

    /* -----------------------------------------------------
       CREDIT BALANCE
    ----------------------------------------------------- */

    let credited =
      false;

    await runTransaction(
      userRef,
      (current) => {

        if (!current) {
          return;
        }

        credited = true;

        return {

          ...current,

          balance:
            number(current.balance) +
            income,

          totalEarnings:
            number(current.totalEarnings) +
            income,

          totalTransactions:
            number(current.totalTransactions) +
            1
        };
      }
    );


    if (!credited) {
      throw new Error(
        "Could not update user balance."
      );
    }


    /* -----------------------------------------------------
       UPDATE VIP CLAIM DATA
    ----------------------------------------------------- */

    const buyerRef =
      ref(
        db,
        `${VIP_BUYERS_PATH}/${currentUser.uid}/${vipId}`
      );


    const newClaimTime =
      now();


    await update(
      buyerRef,
      {

        lastClaim:
          newClaimTime,

        claimCount:
          number(vip.claimCount) + 1,

        totalClaimed:
          number(vip.totalClaimed) +
          income
      }
    );


    /* -----------------------------------------------------
       TRANSACTION
    ----------------------------------------------------- */

    const transactionRef =
      push(
        ref(
          db,
          `${TRANSACTIONS_PATH}/${currentUser.uid}`
        )
      );


    await set(
      transactionRef,
      {

        uid:
          currentUser.uid,

        type:
          "daily_income",

        category:
          "VIP Daily Income",

        amount:
          income,

        currency:
          CURRENCY,

        vipId:
          vipId,

        vipPlanId:
          vip.planId ||
          vip.vipPlanId ||
          "",

        vipName:
          vip.vipName ||
          vip.name ||
          "VIP",

        status:
          "completed",

        createdAt:
          newClaimTime
      }
    );


    toast(
      `You received ${money(income)} daily income.`,
      "success"
    );


    await loadUser();


    selectedClaimVIP =
      null;

    updateClaimVIP();
    updateClaimTimer();


  } catch (error) {

    console.error(
      "CLAIM ERROR:",
      error
    );


    toast(
      "Claim failed: " +
      (
        error?.message ||
        "Unknown error"
      ),
      "error"
    );

  } finally {

    updateClaimVIP();
  }
}


/* =========================================================
   CLAIM TIMER
========================================================= */

function updateClaimTimer() {

  const timer =
    $("claimTimer");

  if (!timer) {
    return;
  }


  const activeVIPs =
    getActiveVIPs();


  if (!activeVIPs.length) {

    timer.textContent =
      "No active VIP";

    return;
  }


  const currentTime =
    now();


  let smallestRemaining =
    Infinity;


  activeVIPs.forEach(
    (vip) => {

      const lastClaim =
        number(
          vip.lastClaim ||
          vip.startTime ||
          vip.activatedAt ||
          vip.createdAt
        );

      const nextClaim =
        lastClaim + DAY_MS;

      const remaining =
        Math.max(
          0,
          nextClaim - currentTime
        );

      if (
        remaining <
        smallestRemaining
      ) {

        smallestRemaining =
          remaining;
      }
    }
  );


  if (
    smallestRemaining <= 0
  ) {

    timer.textContent =
      "Income is ready to claim.";

    updateClaimVIP();

    return;
  }


  const hours =
    Math.floor(
      smallestRemaining /
      (60 * 60 * 1000)
    );

  const minutes =
    Math.floor(
      (
        smallestRemaining %
        (60 * 60 * 1000)
      ) /
      (60 * 1000)
    );

  const seconds =
    Math.floor(
      (
        smallestRemaining %
        (60 * 1000)
      ) /
      1000
    );


  timer.textContent =
    `${hours}h ${minutes}m ${seconds}s`;
}


/* =========================================================
   DISABLE BUY BUTTONS
========================================================= */

function disableBuyButtons(disabled) {

  const buttons =
    document.querySelectorAll(
      ".vip-buy-btn"
    );

  buttons.forEach(
    (button) => {

      if (
        button.textContent
          .includes("Already")
      ) {
        return;
      }

      button.disabled =
        disabled;
    }
  );
}


/* =========================================================
   MENU
========================================================= */

function setupMenu() {

  const menuBtn =
    $("menuBtn");

  const sidebar =
    $("sidebar");


  if (
    !menuBtn ||
    !sidebar
  ) {
    return;
  }


  menuBtn.onclick =
    () => {

      sidebar.classList.toggle(
        "active"
      );
    };


  document.addEventListener(
    "click",
    (event) => {

      if (
        !sidebar.classList.contains(
          "active"
        )
      ) {
        return;
      }


      if (
        sidebar.contains(
          event.target
        ) ||
        menuBtn.contains(
          event.target
        )
      ) {
        return;
      }


      sidebar.classList.remove(
        "active"
      );
    }
  );
}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

  const logoutBtn =
    $("logoutBtn");

  if (!logoutBtn) {
    return;
  }


  logoutBtn.onclick =
    async () => {

      try {

        await signOut(auth);

        window.location.href =
          "login.html";

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        toast(
          "Logout failed.",
          "error"
        );
      }
    };
}


/* =========================================================
   GLOBAL FUNCTIONS
========================================================= */

window.buyVIP =
  buyVIP;

window.claimDailyIncome =
  claimDailyIncome;


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
  "beforeunload",
  () => {

    if (userListener) {
      userListener();
    }

    if (plansListener) {
      plansListener();
    }

    if (buyersListener) {
      buyersListener();
    }

    if (claimTimerInterval) {
      clearInterval(
        claimTimerInterval
      );
    }
  }
);
