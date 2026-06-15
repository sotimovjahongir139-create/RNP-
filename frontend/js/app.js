<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RNP — Ishlab Chiqarish</title>
<link rel="stylesheet" href="css/style.css">
</head>
<body>
<div id="loginOverlay" class="login-overlay">
  <div class="login-card">
    <div class="login-logo">RNP</div>
    <p class="login-sub">Ishlab chiqarish paneli</p>
    <div class="form-group">
      <label>Email</label>
      <input type="email" id="loginEmail" placeholder="admin@rnp.uz" autocomplete="email">
    </div>
    <div class="form-group">
      <label>Parol</label>
      <input type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password">
    </div>
    <div id="loginError" class="error-msg"></div>
    <button id="loginBtn" class="btn-primary">Kirish</button>
  </div>
</div>
<div id="app" class="app hidden">
  <div class="sidebar-overlay" id="sidebarOverlay"></div>
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-header">
      <span class="logo">RNP</span>
      <button class="sidebar-close" id="sidebarClose">✕</button>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-group">
        <span class="nav-label">ISHLAB CHIQARISH</span>
        <a href="#" class="nav-item active"><span class="nav-icon">📋</span> Ishlab chiqarish</a>
      </div>
      <div class="nav-group">
        <span class="nav-label">TAHLIL</span>
        <a href="#" class="nav-item"><span class="nav-icon">📊</span> Tahlil</a>
      </div>
    </nav>
    <div class="sidebar-footer">
      <span id="userDisplay" class="user-display"></span>
      <button id="logoutBtn" class="btn-logout">Chiqish</button>
    </div>
  </aside>
  <div class="main-wrap">
    <header class="topbar">
      <button class="menu-btn" id="menuBtn">☰</button>
      <h1 class="page-title">Ishlab chiqarish</h1>
      <div class="topbar-right">
        <input type="date" id="dateInput" class="date-input">
        <input type="text" id="searchInput" placeholder="Qidirish..." class="search-input">
      </div>
    </header>
    <div class="content-area">
      <div class="params-panel">
        <div id="paramsList" class="params-list"></div>
      </div>
      <div class="input-panel" id="inputPanel">
        <div class="input-panel-inner">
          <div class="input-section-label" id="inputSectionLabel">—</div>
          <div class="active-param-name" id="activeParamName">Parametr tanlang</div>
          <div class="input-row">
            <input type="number" id="valueInput" class="value-input" placeholder="Qiymat..." step="any">
            <span class="unit-label" id="unitLabel">—</span>
          </div>
          <button id="saveBtn" class="btn-save">✓ Saqlash</button>
          <div class="today-label">BU KUN KIRITILGANLAR</div>
          <div id="todayList" class="today-list">
            <span class="empty-hint">Hali kiritilmagan</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div id="toast" class="toast"></div>
<script src="js/app.js"></script>
</body>
</html>
