// ─── STATE ──────────────────────────────────────────────────
const S = {
  page:     'kiritish',
  date:     new Date().toISOString().split('T')[0],
  period:   'daily',
  selected: null,
  params:   [],
  facts:    {},
};

// ─── HELPERS ────────────────────────────────────────────────
function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function subcatBadgeClass(sub) {
  if (sub === "PU bo'lim")  return 'badge-pu';
  if (sub === "TEP bo'lim") return 'badge-tep';
  return 'badge-um';
}

// ─── INIT ───────────────────────────────────────────────────
async function init() {
  if (!Auth.isLoggedIn()) { renderLogin(); return; }
  S.params = await API.getParams().catch(() => []);
  renderApp();
  showPage('kiritish');
}

// ─── LOGIN ──────────────────────────────────────────────────
function renderLogin() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('appPage').style.display   = 'none';
}

function renderApp() {
  document.getElementById('loginPage').style.display = 'none';
  document.getElementById('appPage').style.display   = 'flex';
}

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value;
  const errEl    = document.getElementById('loginErr');
  errEl.textContent = '';
  try {
    await Auth.login(username, password);
    S.params = await API.getParams().catch(() => []);
    renderApp();
    showPage('kiritish');
  } catch (err) {
    errEl.textContent = err.message;
  }
}

// ─── NAVIGATION ─────────────────────────────────────────────
function showPage(page) {
  S.page    = page;
  S.selected = null;

  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.page === page)
  );

  const isKiritish = page === 'kiritish';
  document.getElementById('pageKiritish').style.display  = isKiritish ? 'flex' : 'none';
  document.getElementById('pageTahlil').style.display    = isKiritish ? 'none' : 'flex';
  document.getElementById('searchBlock').style.display   = isKiritish ? '' : 'none';
  document.getElementById('pageTitle').textContent       = isKiritish ? 'Ishlab chiqarish' : 'Tahlil';

  if (isKiritish) { resetInputPanel(); loadKiritish(); }
  else              loadTahlil();
}

function onDateChange(val) {
  S.date     = val;
  S.selected = null;
  resetInputPanel();
  if (S.page === 'kiritish') loadKiritish();
  else                        loadTahlil();
}

function setPeriod(period, el) {
  S.period = period;
  document.querySelectorAll('.ptab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  loadTahlil();
}

// ─── KIRITISH ───────────────────────────────────────────────
async function loadKiritish() {
  const data = await API.getFacts(S.date).catch(() => ({ facts: [] }));
  S.facts[S.date] = {};
  (data.facts || []).forEach(f => {
    S.facts[S.date][f.param_name] = { id: f.id, value: f.value, unit: f.unit };
  });
  renderList();
}

function renderList() {
  const q   = (document.getElementById('searchInput')?.value || '').trim().toLowerCase();
  const df  = S.facts[S.date] || {};
  const out = document.getElementById('paramList');
  let html  = '', any = false;

  S.params.forEach(cat => {
    const matchedSubcats = cat.subcats
      .map(sub => ({
        ...sub,
        items: sub.items.filter(it => !q || it.toLowerCase().includes(q))
      }))
      .filter(sub => sub.items.length > 0);

    if (!matchedSubcats.length) return;
    any = true;

    html += `<div class="cat-header">${cat.cat}</div>`;

    matchedSubcats.forEach(sub => {
      html += `<div class="subcat-label">${sub.name}</div>`;
      sub.items.forEach(it => {
        const f   = df[it];
        const sel = S.selected === it;
        html += `
          <div class="param-row${sel ? ' selected' : ''}" onclick="selectParam('${esc(it)}','${esc(cat.cat)}','${esc(sub.name)}')">
            <span class="param-name">${it}</span>
            ${f ? `<span class="fact-badge">✓ ${f.value} ${f.unit}</span>` : ''}
          </div>`;
      });
    });
  });

  out.innerHTML = any ? html : '<div class="no-result">Topilmadi</div>';
}

function selectParam(name, cat, subcat) {
  S.selected = name;
  const f = (S.facts[S.date] || {})[name];

  document.getElementById('inputPanel').innerHTML = `
    <div class="ip-subcat"><span class="badge ${subcatBadgeClass(subcat)}">${subcat}</span></div>
    <div class="ip-name">${name}</div>
    <div class="ip-row">
      <input type="number" id="factValue" class="fact-input"
             placeholder="Qiymat..." value="${f ? f.value : ''}">
      <select id="unitSel" class="unit-sel">
        ${['gramm','kg','tonna','dona','soat','daqiqa','%','kishi']
          .map(u => `<option${f && f.unit === u ? ' selected' : ''}>${u}</option>`).join('')}
      </select>
    </div>
    <button class="save-btn" id="saveBtn"
            onclick="saveFact('${esc(name)}','${esc(cat)}','${esc(subcat)}')">
      ✓ Saqlash
    </button>
    <div class="saved-title">Bu kun kiritilganlar</div>
    <div id="savedFacts"></div>
  `;

  renderSaved();
  renderList();
  document.getElementById('factValue')?.focus();
}

function resetInputPanel() {
  document.getElementById('inputPanel').innerHTML =
    `<div class="ip-hint">👈 Ko'rsatkichni tanlang va qiymat kiriting</div>`;
}

async function saveFact(name, cat, subcat) {
  const val  = document.getElementById('factValue')?.value.trim();
  const unit = document.getElementById('unitSel')?.value;
  if (!val) { alert('Qiymat kiriting!'); return; }

  try {
    const saved = await API.saveFact({
      date: S.date,
      param_name: name,
      category: cat,
      subcategory: subcat,
      value: parseFloat(val),
      unit,
    });
    if (!S.facts[S.date]) S.facts[S.date] = {};
    S.facts[S.date][name] = { id: saved.id, value: saved.value, unit: saved.unit };
    renderList();
    renderSaved();
    const btn = document.getElementById('saveBtn');
    if (btn) {
      btn.textContent = '✓ Saqlandi!';
      btn.style.background = '#2e7d32';
      setTimeout(() => { btn.textContent = '✓ Saqlash'; btn.style.background = ''; }, 1000);
    }
  } catch (err) { alert(err.message); }
}

async function deleteFact(id, name) {
  await API.deleteFact(id).catch(() => {});
  if (S.facts[S.date]) delete S.facts[S.date][name];
  if (S.selected === name) resetInputPanel();
  renderList();
}

function renderSaved() {
  const el      = document.getElementById('savedFacts');
  if (!el) return;
  const entries = Object.entries(S.facts[S.date] || {});
  el.innerHTML  = entries.length
    ? entries.map(([k, v]) => `
        <div class="saved-row">
          <span class="saved-row-name" title="${k}">${k.length > 22 ? k.slice(0,20) + '…' : k}</span>
          <span class="saved-row-val">${v.value} ${v.unit}</span>
          <span class="saved-row-del" onclick="deleteFact(${v.id},'${esc(k)}')">×</span>
        </div>`).join('')
    : '<div class="saved-empty">Hali kiritilmagan</div>';
}

// ─── TAHLIL ─────────────────────────────────────────────────
async function loadTahlil() {
  const data = await API.getSummary(S.period, S.date).catch(() => ({ facts: [], dates: [] }));
  renderTahlil(data);
}

function renderTahlil(data) {
  const facts = data.facts || [];
  const wrap  = document.getElementById('tahlilContent');

  if (!facts.length) {
    wrap.innerHTML = `<div class="empty-state">📭<br>Bu davr uchun ma'lumot yo'q</div>`;
    return;
  }

  const bySubcat = {};
  facts.forEach(f => {
    if (!bySubcat[f.subcategory]) bySubcat[f.subcategory] = [];
    bySubcat[f.subcategory].push(f);
  });

  wrap.innerHTML = `
    <div class="stat-row">
      <div class="stat-card">
        <div class="sc-label">Jami kiritilgan</div>
        <div class="sc-val">${facts.length}<span class="sc-unit">ta</span></div>
      </div>
      ${Object.entries(bySubcat).map(([sub, items]) => `
        <div class="stat-card">
          <div class="sc-label">${sub}</div>
          <div class="sc-val">${items.length}<span class="sc-unit">ta</span></div>
        </div>`).join('')}
    </div>

    <div class="tahlil-card">
      <div class="tahlil-card-header">
        <span class="tahlil-card-title">Barcha ko'rsatkichlar</span>
        <span class="tahlil-card-sub">${facts.length} ta yozuv</span>
      </div>
      <table class="t-table">
        <thead><tr>
          <th>#</th>
          <th>Ko'rsatkich</th>
          <th>Bo'lim</th>
          ${S.period !== 'daily' ? '<th>Sana</th>' : ''}
          <th>Fakt</th>
        </tr></thead>
        <tbody>
          ${facts.map((f, i) => `
            <tr>
              <td class="t-num">${i + 1}</td>
              <td>${f.param_name}</td>
              <td><span class="badge ${subcatBadgeClass(f.subcategory)}">${f.subcategory}</span></td>
              ${S.period !== 'daily' ? `<td class="t-date">${f.date}</td>` : ''}
              <td><b>${f.value}</b> <span class="t-unit">${f.unit}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="tahlil-card" style="margin-top:12px">
      <div class="tahlil-card-header">
        <span class="tahlil-card-title">Grafik</span>
      </div>
      <div style="padding:16px 16px 8px">
        <canvas id="mainChart" height="90"></canvas>
      </div>
    </div>`;

  const labels = facts.map(f =>
    f.param_name.length > 18 ? f.param_name.slice(0, 16) + '…' : f.param_name
  );
  Charts.renderBar('mainChart', labels, facts.map(f => parseFloat(f.value)));
}

// ─── BOOT ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
