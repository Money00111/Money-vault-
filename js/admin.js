<!DOCTYPE html>
<html lang="en">

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Money Vault | Admin Panel</title>

<link rel="stylesheet"
href="css/admin.css">

<link rel="stylesheet"
href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">

</head>

<body>

<!-- ======================================
LOADING SCREEN
====================================== -->

<div id="loadingScreen" class="loading-screen">

<div class="loader"></div>

<h2>Loading Admin Panel...</h2>

</div>

<!-- ======================================
SIDEBAR
====================================== -->

<aside class="sidebar" id="sidebar">

<div class="sidebar-top">

<div class="logo">

<h2>💰 Money Vault</h2>

<p>Administrator</p>

</div>

</div>

<nav class="sidebar-menu">

<a href="#"
class="menu-link active"
data-page="dashboard">

<i class="fa-solid fa-chart-line"></i>

<span>Dashboard</span>

</a>

<a href="#"
class="menu-link"
data-page="deposits">

<i class="fa-solid fa-wallet"></i>

<span>Deposits</span>

</a>

<a href="#"
class="menu-link"
data-page="withdraws">

<i class="fa-solid fa-money-bill-transfer"></i>

<span>Withdraws</span>

</a>

<a href="#"
class="menu-link"
data-page="users">

<i class="fa-solid fa-users"></i>

<span>Users</span>

</a>

<a href="#"
class="menu-link"
data-page="transactions">

<i class="fa-solid fa-clock-rotate-left"></i>

<span>Transactions</span>

</a>

<a href="#"
class="menu-link"
data-page="quickActions">

<i class="fa-solid fa-bolt"></i>

<span>Quick Actions</span>

</a>

<a href="#"
class="menu-link"
data-page="settings">

<i class="fa-solid fa-gear"></i>

<span>Settings</span>

</a>

</nav>

<div class="sidebar-bottom">

<button id="logoutBtn" class="logout-btn">

<i class="fa-solid fa-right-from-bracket"></i>

Logout

</button>

</div>

</aside>

<!-- ======================================
MAIN CONTENT
====================================== -->

<div class="main-content">

<!-- HEADER -->

<header class="top-header">

<div class="left-header">

<button id="menuBtn">

<i class="fa-solid fa-bars"></i>

</button>

<h1 id="pageTitle">

Dashboard

</h1>

</div>

<div class="right-header">

<i class="fa-solid fa-user-shield"></i>

<div>

<h4 id="adminName">

Loading...

</h4>

<p id="adminEmail">

Loading...

</p>

</div>

</div>

</header>

<!-- ======================================
CONTENT
====================================== -->

<div id="contentArea">

<!-- ======================================
DASHBOARD
====================================== -->

<section
id="dashboardSection"
class="page-section active">

<!-- Dashboard izaza muri Part 2 -->

</section>

<!-- ======================================
DEPOSITS
====================================== -->

<section
id="depositsSection"
class="page-section">

<!-- Deposits zizaza muri Part 3 -->

</section>

<!-- ======================================
WITHDRAWS
====================================== -->

<section
id="withdrawsSection"
class="page-section">

<!-- Withdraws zizaza muri Part 4 -->

</section>

<!-- ======================================
USERS
====================================== -->

<section
id="usersSection"
class="page-section">

<!-- Users zizaza muri Part 5 -->

</section>

<!-- ======================================
TRANSACTIONS
====================================== -->

<section
id="transactionsSection"
class="page-section">

<!-- Transactions zizaza muri Part 5 -->

</section>

<!-- ======================================
QUICK ACTIONS
====================================== -->

<section
id="quickActionsSection"
class="page-section">

<!-- Quick Actions zizaza muri Part 6 -->

</section>

<!-- ======================================
SETTINGS
====================================== -->

<section
id="settingsSection"
class="page-section">

<!-- Settings zizaza muri Part 6 -->

</section>

</div>

</div>

<script type="module" src="js/admin.js"></script>

</body>

</html>

    
