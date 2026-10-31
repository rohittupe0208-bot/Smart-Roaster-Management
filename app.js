// ============================================================
// SMART ROSTER MANAGEMENT SYSTEM - Main App Logic
// ============================================================

// ---- GLOBAL STATE ----
const App = {
  currentPage: 'dashboard',
  currentRosterKey: null,
  currentRosterData: null,
  filters: { pod: '', brand: '', employee: '', month: '' },
};
let modalEscapeHandler = null;

// ---- UTILITIES ----
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const AVATAR_COLORS = ["#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#a855f7"];
const PROCESS_CHIPS = { pr1: 'cs', pr2: 'acc', pr3: 'ndr', pr4: 'ret', pr5: 'qa' };
const WORKING_RULE_LABELS = { '365': '365 Days', 'no-holidays': 'No Holidays', 'no-sunday-holidays': 'No Sun & Holidays', 'custom-days': 'Custom Weekdays' };
const LEAVE_TYPES = { PL: 'Planned Leave', CO: 'Comp-Off', SL: 'Sick Leave', EL: 'Emergency Leave' };
const STATUS_LABELS = { work: 'W', 'weekly-off': 'OFF', leave: 'L', 'comp-off': 'CO', 'comp_off': 'CO' };
const STATUS_CLASSES = { work: 'status-work', 'weekly-off': 'status-weekly-off', leave: 'status-leave', 'comp-off': 'status-comp-off', 'comp_off': 'status-comp-off' };

function avatarColor(id) {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}
function fmtDate(ds) {
  const d = new Date(ds + 'T00:00:00'); return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
}
function rosterKey(y, m) { return `${y}-${m}`; }
function getCurrentMonthKey() {
  const n = new Date(); return rosterKey(n.getFullYear(), n.getMonth());
}

function showToast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(10px)'; t.style.transition = 'all 0.3s'; setTimeout(() => t.remove(), 300); }, 3000);
}

function showLoading(msg = 'Generating Roster...') {
  document.getElementById('loading-overlay').style.display = 'flex';
  document.getElementById('loading-text').textContent = msg;
}
function hideLoading() { document.getElementById('loading-overlay').style.display = 'none'; }

function openModal(html, size = '') {
  const ov = document.getElementById('modal-overlay');
  if (modalEscapeHandler) document.removeEventListener('keydown', modalEscapeHandler, true);
  ov.innerHTML = `<div class="modal ${size}" role="dialog" aria-modal="true" aria-labelledby="modal-title" onclick="event.stopPropagation()">${html}</div>`;
  const title = ov.querySelector('.modal-title');
  if (title) title.id = 'modal-title';
  ov.style.display = 'flex';
  ov.onclick = closeModal;
  const firstField = ov.querySelector('input, select, textarea') || ov.querySelector('.form-group button') || ov.querySelector('button');
  if (firstField) firstField.focus();
  modalEscapeHandler = event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
    }
  };
  document.addEventListener('keydown', modalEscapeHandler, true);
}
function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  if (modalEscapeHandler) {
    document.removeEventListener('keydown', modalEscapeHandler, true);
    modalEscapeHandler = null;
  }
  overlay.style.display = 'none';
  overlay.innerHTML = '';
}

// ---- NAVIGATION ----
function navigate(page) {
  App.currentPage = page;
  document.querySelectorAll('.nav-item[data-page]').forEach(n => {
    const active = n.dataset.page === page;
    n.classList.toggle('active', active);
    if (active) n.setAttribute('aria-current', 'page');
    else n.removeAttribute('aria-current');
  });
  const pageMap = {
    dashboard: renderDashboard,
    roster: renderRosterPage,
    employees: renderEmployeesPage,
    brands: renderBrandsPage,
    leaves: renderLeavesPage,
    conflicts: renderConflictsPage,
    settings: renderSettingsPage,
  };
  document.getElementById('page-title').textContent = {
    dashboard: 'Dashboard', roster: 'Roster', employees: 'People & pods',
    brands: 'Brands & processes', leaves: 'Leave & holidays', conflicts: 'Conflicts', settings: 'Settings'
  }[page] || page;
  document.getElementById('page-description').textContent = {
    dashboard: 'Your team and roster at a glance.',
    roster: 'Create and review monthly schedules.',
    employees: 'Manage employees, pods, and weekly days off.',
    brands: 'Set up brands, processes, and staffing.',
    leaves: 'Track leave requests and public holidays.',
    conflicts: 'Review staffing gaps and schedule overlaps.',
    settings: 'Manage your saved data and roster rules.',
  }[page] || '';
  const fn = pageMap[page];
  if (fn) fn();
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggle = document.getElementById('sidebar-toggle');
  const collapsed = sidebar.classList.toggle('collapsed');
  toggle.setAttribute('aria-expanded', String(!collapsed));
  toggle.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
  toggle.querySelector('.nav-label').textContent = collapsed ? 'Expand navigation' : 'Collapse navigation';
}

// ---- DASHBOARD ----
function renderDashboard() {
  const employees = DB.get('employees');
  const brands = DB.get('brands');
  const processes = DB.get('processes');
  const pods = DB.get('pods');
  const leaves = DB.get('leaves');
  const assignments = DB.get('assignments');
  const rosters = DB.getObj('rosters');
  const rosterKeys = Object.keys(rosters);
  let totalConflicts = 0;
  rosterKeys.forEach(k => { totalConflicts += (rosters[k].conflicts || []).length; });

  const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
  const today = new Date(); const curKey = rosterKey(today.getFullYear(), today.getMonth());
  const hasCurrentRoster = !!rosters[curKey];

  document.getElementById('page-content').innerHTML = `
<div class="fade-in">
  <div class="page-intro">
    <h1>Overview</h1>
    <p>A quick look at your team, schedules, and items that need attention.</p>
  </div>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${employees.length}</div>
      <div class="stat-label">People</div>
      <div class="stat-trend">${pods.length} pods</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${brands.length}</div>
      <div class="stat-label">Brands</div>
      <div class="stat-trend">${processes.length} processes</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${assignments.length}</div>
      <div class="stat-label">Assignments</div>
      <div class="stat-trend">People assigned to work</div>
    </div>
    <div class="stat-card">
      <div class="stat-value ${totalConflicts > 0 ? 'text-danger' : 'text-success'}">${totalConflicts}</div>
      <div class="stat-label">Roster issues</div>
      <div class="stat-trend">${totalConflicts > 0 ? 'Review conflicts' : 'No issues found'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${rosterKeys.length}</div>
      <div class="stat-label">Rosters</div>
      <div class="stat-trend">${hasCurrentRoster ? 'This month is ready' : 'This month not created'}</div>
    </div>
    <div class="stat-card">
      <div class="stat-value ${pendingLeaves > 0 ? 'text-warning' : 'text-success'}">${pendingLeaves}</div>
      <div class="stat-label">Leave requests</div>
      <div class="stat-trend">${leaves.filter(l => l.status === 'approved').length} approved</div>
    </div>
  </div>

  <div class="grid-2 mb-4">
    <div class="card">
      <div class="card-header"><div><div class="card-title">Your pods</div><div class="card-subtitle">Team size and pod leads</div></div></div>
      ${pods.map(pod => {
    const podEmps = employees.filter(e => e.podId === pod.id);
    const lead = employees.find(e => e.id === pod.leadId);
    const podBrands = brands.filter(b => b.podId === pod.id);
    return `<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--border)">
          <div class="pod-mark">${pod.name.slice(0, 2).toUpperCase()}</div>
          <div style="flex:1">
            <div style="font-weight:600;font-size:13px">${pod.name}</div>
            <div style="font-size:11px;color:var(--text-muted)">Lead: ${lead ? lead.name : 'Not assigned'} &bull; ${podEmps.length} people &bull; ${podBrands.length} brands</div>
          </div>
          <div class="pod-count">${podEmps.length}</div>
        </div>`;
  }).join('')}
    </div>
    <div class="card">
      <div class="card-header"><div><div class="card-title">Get started</div><div class="card-subtitle">Choose what you want to do next</div></div></div>
      <div class="quick-actions">
        <button class="btn btn-primary" onclick="navigate('roster')">Open roster</button>
        <button class="btn btn-secondary" onclick="navigate('leaves')">Review leave requests</button>
        <button class="btn btn-secondary" onclick="navigate('employees')">Manage people</button>
        <button class="btn btn-secondary" onclick="navigate('brands')">Manage brands</button>
        ${totalConflicts > 0 ? `<button class="btn btn-danger" onclick="navigate('conflicts')">Review ${totalConflicts} issues</button>` : ''}
      </div>
    </div>
  </div>

  <div class="card">
    <div class="card-header"><div><div class="card-title">Recent rosters</div><div class="card-subtitle">Your latest monthly schedules</div></div></div>
    ${rosterKeys.length === 0 ? `<div class="empty-state"><div class="empty-title">No rosters yet</div><div class="empty-sub">Create a monthly roster to see schedules and coverage here.</div><button class="btn btn-primary mt-3" onclick="navigate('roster')">Create a roster</button></div>`
      : `<div class="table-wrapper"><table><thead><tr><th>Month</th><th>Employees</th><th>Conflicts</th><th>Generated</th><th>Action</th></tr></thead><tbody>
    ${rosterKeys.slice(-5).reverse().map(k => {
        const r = rosters[k]; const [y, m] = k.split('-').map(Number);
        const conflicts = (r.conflicts || []).length;
        return `<tr><td><b>${MONTH_NAMES[m]} ${y}</b></td><td>${Object.keys(r.roster || {}).length}</td>
      <td>${conflicts > 0 ? `<span class="badge badge-danger">${conflicts} issues</span>` : '<span class="badge badge-success">No issues</span>'}</td>
      <td style="font-size:11px;color:var(--text-muted)">${r.generatedAt ? new Date(r.generatedAt).toLocaleDateString() : '-'}</td>
      <td><button class="btn btn-sm btn-secondary" onclick="loadRoster('${k}')">Open</button></td></tr>`;
      }).join('')}
    </tbody></table></div>`}
  </div>
</div>`;
}

// ---- ROSTER PAGE ----
function renderRosterPage() {
  const rosters = DB.getObj('rosters');
  const today = new Date();
  const selYear = App.rosterYear || today.getFullYear();
  const selMonth = App.rosterMonth !== undefined ? App.rosterMonth : today.getMonth();
  const key = rosterKey(selYear, selMonth);
  const hasRoster = !!rosters[key];

  let yearOpts = '';
  for (let y = 2025; y <= 2027; y++) yearOpts += `<option value="${y}" ${y === selYear ? 'selected' : ''}>${y}</option>`;
  let monthOpts = MONTH_NAMES.map((m, i) => `<option value="${i}" ${i === selMonth ? 'selected' : ''}>${m}</option>`).join('');

  document.getElementById('page-content').innerHTML = `
<div class="fade-in">
  <div class="flex items-center justify-between mb-4 flex-wrap gap-3">
    <div class="flex items-center gap-3 flex-wrap">
      <div class="month-selector" aria-label="Select roster month">
        <select id="sel-month" aria-label="Roster month" onchange="App.rosterMonth=+this.value;renderRosterPage()">${monthOpts}</select>
        <select id="sel-year" aria-label="Roster year" onchange="App.rosterYear=+this.value;renderRosterPage()">${yearOpts}</select>
      </div>
      <button class="btn btn-primary" onclick="doGenerateRoster()">${hasRoster ? 'Regenerate roster' : 'Create roster'}</button>
      ${hasRoster ? `<button class="btn btn-secondary" onclick="exportRosterCSV('${key}')">Export CSV</button>` : ''}
    </div>
    ${hasRoster && (rosters[key].conflicts || []).length > 0 ? `<button type="button" class="conflict-badge" onclick="navigate('conflicts')">${rosters[key].conflicts.length} roster issues</button>` : ''}
  </div>

  ${!hasRoster ? `<div class="empty-state"><div class="empty-title">No roster for ${MONTH_NAMES[selMonth]} ${selYear}</div><div class="empty-sub">Create a roster to see each person’s schedule and check coverage.</div><button class="btn btn-primary mt-3" onclick="doGenerateRoster()">Create roster</button></div>`
      : `<div id="roster-view-area">${renderRosterTabs(key)}</div>`}
</div>`;

  if (hasRoster) {
    showRosterTab(App.rosterTab || 'company', key);
  }
}

function renderRosterTabs(key) {
  const tabs = ['company', 'pod', 'brand', 'process', 'employee'];
  const labels = { company: 'Company', pod: 'Pod', brand: 'Brand', process: 'Process', employee: 'Person' };
  return `<div class="tabs" role="tablist" aria-label="Roster views">${tabs.map(t => `<button type="button" role="tab" id="roster-tab-${t}" aria-controls="roster-tab-content" aria-selected="${(App.rosterTab || 'company') === t}" class="tab ${(App.rosterTab || 'company') === t ? 'active' : ''}" onclick="showRosterTab('${t}','${key}')">${labels[t]}</button>`).join('')}</div>
  <div id="roster-tab-content" role="tabpanel" tabindex="0" aria-labelledby="roster-tab-${App.rosterTab || 'company'}"></div>`;
}

function showRosterTab(tab, key) {
  App.rosterTab = tab;
  document.querySelectorAll('.tab').forEach(t => {
    const active = t.getAttribute('role') === 'tab' && t.textContent.trim().toLowerCase() === (tab === 'employee' ? 'person' : tab);
    t.classList.toggle('active', active);
    t.setAttribute('aria-selected', String(active));
  });
  const cont = document.getElementById('roster-tab-content');
  if (!cont) return;
  cont.setAttribute('aria-labelledby', `roster-tab-${tab}`);
  const rosters = DB.getObj('rosters');
  const data = rosters[key];
  if (!data) return;
  switch (tab) {
    case 'company': cont.innerHTML = renderCompanyRosterView(data, key); break;
    case 'pod': cont.innerHTML = renderPodRosterView(data, key); break;
    case 'brand': cont.innerHTML = renderBrandRosterView(data, key); break;
    case 'process': cont.innerHTML = renderProcessRosterView(data, key); break;
    case 'employee': cont.innerHTML = renderEmployeeRosterView(data, key); break;
  }
}

function renderCompanyRosterView(data, key) {
  const [year, month] = key.split('-').map(Number);
  const employees = DB.get('employees');
  const pods = DB.get('pods');
  const dates = Scheduler.getMonthDates(year, month);
  const holidays = DB.get('publicHolidays');

  let html = `<div class="legend">${[['status-work', 'Work (W)'], ['status-weekly-off', 'Weekly Off'], ['status-leave', 'Leave (L)'], ['status-comp-off', 'Comp-Off (CO)']].map(([c, l]) => `<div class="legend-item"><div class="legend-dot" style="background:var(--status-${c.replace('status-', '')})"></div>${l}</div>`).join('')}</div>`;

  html += `<div class="roster-grid-container"><div class="roster-grid" style="grid-template-columns: 160px repeat(${dates.length}, 35px)">`;

  // Header row
  html += `<div class="rg-cell rg-emp-name rg-header" style="font-size:11px;color:var(--text-muted)">Employee</div>`;
  dates.forEach(d => {
    const ds = Scheduler.isoDate(d);
    const isSun = d.getDay() === 0;
    const isHol = Scheduler.isHoliday(ds, holidays);
    const ph = holidays.find(h => h.date === ds);
    const cls = isHol ? 'holiday-col' : isSun ? 'weekend' : '';
    html += `<div class="rg-cell rg-header ${cls}" title="${isHol ? ph.name : ''}">${d.getDate()}<br>${DAY_NAMES[d.getDay()].slice(0, 2)}</div>`;
  });

  // Emp rows
  employees.forEach(emp => {
    const empRoster = data.roster[emp.id] || {};
    html += `<div class="rg-cell rg-emp-name" title="${emp.name}">${emp.name.split(' ')[0]} ${emp.name.split(' ')[1]?.[0] || ''}.</div>`;
    dates.forEach(d => {
      const ds = Scheduler.isoDate(d);
      const status = empRoster[ds] || 'work';
      const isSun = d.getDay() === 0;
      const isHol = Scheduler.isHoliday(ds, holidays);
      const lbl = STATUS_LABELS[status] || 'W';
      const cls = STATUS_CLASSES[status] || 'status-work';
      const colCls = isHol ? 'holiday-col' : isSun ? 'weekend' : '';
      html += `<div class="rg-cell ${colCls}" title="${emp.name} - ${ds}: ${status}">
        <button type="button" class="rg-status ${cls}" aria-label="Edit ${emp.name}'s status for ${ds}: ${status}" onclick="showDayEdit('${key}','${emp.id}','${ds}','${status}')">${lbl}</button></div>`;
    });
  });
  html += `</div></div>`;

  const stats = Scheduler.getRosterStats(data);
  html += `<div class="mt-4 card"><div class="card-header"><div class="card-title">Roster Summary</div></div>
  <div class="table-wrapper"><table><thead><tr><th>Employee</th><th>Work Days</th><th>Leave Days</th><th>Weekly Offs</th><th>Comp-Offs</th></tr></thead><tbody>`;
  employees.forEach(emp => {
    const s = stats.employeeStats[emp.id] || {};
    html += `<tr><td class="emp-name">${emp.name}</td><td><span class="badge badge-success">${s.workDays || 0}</span></td><td><span class="badge badge-warning">${s.leaveDays || 0}</span></td><td><span class="badge badge-muted">${s.weeklyOffDays || 0}</span></td><td><span class="badge badge-info">${s.compOffDays || 0}</span></td></tr>`;
  });
  html += `</tbody></table></div></div>`;
  return html;
}

function renderPodRosterView(data, key) {
  const pods = DB.get('pods');
  const employees = DB.get('employees');
  let html = '';
  pods.forEach(pod => {
    const podEmps = employees.filter(e => e.podId === pod.id);
    const lead = employees.find(e => e.id === pod.leadId);
    html += `<div class="card mb-4"><div class="card-header">
      <div><div class="card-title">${pod.name}</div><div class="card-subtitle">Lead: ${lead?.name || '—'} &bull; ${podEmps.length} members</div></div>
    </div>${renderMiniRosterTable(podEmps, data, key)}</div>`;
  });
  return html;
}

function renderMiniRosterTable(emps, data, key) {
  const [year, month] = key.split('-').map(Number);
  const dates = Scheduler.getMonthDates(year, month);
  const holidays = DB.get('publicHolidays');
  let html = `<div class="roster-grid-container"><div class="roster-grid" style="grid-template-columns: 150px repeat(${dates.length},32px)">`;
  html += `<div class="rg-cell rg-emp-name rg-header" style="font-size:10px">Employee</div>`;
  dates.forEach(d => {
    const ds = Scheduler.isoDate(d); const isSun = d.getDay() === 0; const isHol = Scheduler.isHoliday(ds, holidays);
    html += `<div class="rg-cell rg-header ${isHol ? 'holiday-col' : isSun ? 'weekend' : ''}">${d.getDate()}</div>`;
  });
  emps.forEach(emp => {
    const empRoster = data.roster[emp.id] || {};
    html += `<div class="rg-cell rg-emp-name" title="${emp.name}" style="font-size:11px">${emp.name.split(' ')[0]}</div>`;
    dates.forEach(d => {
      const ds = Scheduler.isoDate(d); const status = empRoster[ds] || 'work';
      const isSun = d.getDay() === 0; const isHol = Scheduler.isHoliday(ds, holidays);
      html += `<div class="rg-cell ${isHol ? 'holiday-col' : isSun ? 'weekend' : ''}" title="${emp.name}-${ds}:${status}">
        <button type="button" class="rg-status ${STATUS_CLASSES[status] || 'status-work'}" style="width:22px;height:22px;font-size:9px" aria-label="Edit ${emp.name}'s status for ${ds}: ${status}" onclick="showDayEdit('${key}','${emp.id}','${ds}','${status}')">${STATUS_LABELS[status] || 'W'}</button></div>`;
    });
  });
  html += `</div></div>`;
  return html;
}

function renderBrandRosterView(data, key) {
  const brands = DB.get('brands'); const assignments = DB.get('assignments');
  const employees = DB.get('employees'); const bprs = DB.get('brandProcessRules');
  const processes = DB.get('processes');
  const [year, month] = key.split('-').map(Number);
  const dates = Scheduler.getMonthDates(year, month);
  const holidays = DB.get('publicHolidays');

  let html = '';
  brands.forEach(brand => {
    const brandAssign = assignments.filter(a => a.brandId === brand.id);
    const brandEmps = [...new Set(brandAssign.map(a => a.empId))].map(id => employees.find(e => e.id === id)).filter(Boolean);
    const brandBprs = bprs.filter(b => b.brandId === brand.id);
    if (brandEmps.length === 0) return;

    html += `<div class="card mb-3"><div class="brand-header" style="padding:12px;margin-bottom:12px">
      <div class="brand-icon" style="background:${avatarColor(brand.id)}">${brand.name[0]}</div>
      <div style="flex:1"><div style="font-weight:700">${brand.name}</div>
        <div style="font-size:11px;color:var(--text-muted)">${brandEmps.length} employee${brandEmps.length > 1 ? 's' : ''} &bull; ${brandBprs.length} process${brandBprs.length > 1 ? 'es' : ''}</div>
      </div>
      <div class="tag-list">${brandBprs.map(r => { const p = processes.find(x => x.id === r.processId); return `<span class="chip chip-${PROCESS_CHIPS[r.processId] || 'cs'}">${p?.code || '?'}</span>`; }).join('')}</div>
    </div>`;

    // Coverage heatmap
    html += `<div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:8px">COVERAGE HEATMAP</div>`;
    html += `<div class="roster-grid-container"><div class="roster-grid" style="grid-template-columns:140px repeat(${dates.length},34px)">`;
    html += `<div class="rg-cell rg-emp-name rg-header" style="font-size:10px">Process/Employee</div>`;
    dates.forEach(d => {
      const ds = Scheduler.isoDate(d); const isSun = d.getDay() === 0; const isHol = Scheduler.isHoliday(ds, holidays);
      html += `<div class="rg-cell rg-header ${isHol ? 'holiday-col' : isSun ? 'weekend' : ''}">${d.getDate()}</div>`;
    });

    brandBprs.forEach(bpr => {
      const proc = processes.find(p => p.id === bpr.processId);
      html += `<div class="rg-cell rg-emp-name" style="font-size:10px;background:rgba(99,102,241,0.05)">${proc?.name || '?'}</div>`;
      dates.forEach(d => {
        const ds = Scheduler.isoDate(d);
        const covKey = `${brand.id}__${bpr.processId}`;
        const cov = (data.coverage || {})[covKey]?.[ds];
        if (!cov || !cov.required) {
          html += `<div class="rg-cell ${d.getDay() === 0 ? 'weekend' : ''}"><div class="coverage-cell cov-na" title="Not required">—</div></div>`;
        } else if (cov.conflict) {
          html += `<div class="rg-cell"><div class="coverage-cell cov-gap" title="Coverage gap! ${cov.working.length}/${cov.needed}">⚠</div></div>`;
        } else {
          html += `<div class="rg-cell"><div class="coverage-cell cov-ok" title="${cov.working.length}/${cov.needed} covered">✓</div></div>`;
        }
      });
    });

    brandEmps.forEach(emp => {
      if (!emp) return;
      const empProcs = brandAssign.filter(a => a.empId === emp.id).map(a => { const p = processes.find(x => x.id === a.processId); return p?.code || '?'; }).join(',');
      html += `<div class="rg-cell rg-emp-name" style="font-size:11px" title="${emp.name}">${emp.name.split(' ')[0]} (${empProcs})</div>`;
      dates.forEach(d => {
        const ds = Scheduler.isoDate(d); const status = (data.roster[emp.id] || {})[ds] || 'work';
        const isSun = d.getDay() === 0; const isHol = Scheduler.isHoliday(ds, holidays);
        html += `<div class="rg-cell ${isHol ? 'holiday-col' : isSun ? 'weekend' : ''}" title="${emp.name}-${ds}:${status}">
          <button type="button" class="rg-status ${STATUS_CLASSES[status] || 'status-work'}" style="width:22px;height:22px;font-size:9px" aria-label="Edit ${emp.name}'s status for ${ds}: ${status}" onclick="showDayEdit('${key}','${emp.id}','${ds}','${status}')">${STATUS_LABELS[status] || 'W'}</button></div>`;
      });
    });
    html += `</div></div></div>`;
  });
  return html;
}

function renderProcessRosterView(data, key) {
  const processes = DB.get('processes'); const assignments = DB.get('assignments');
  const employees = DB.get('employees'); const bprs = DB.get('brandProcessRules');
  const brands = DB.get('brands');
  let html = '';
  processes.forEach(proc => {
    const procAssign = assignments.filter(a => a.processId === proc.id);
    if (procAssign.length === 0) return;
    const procBrands = [...new Set(procAssign.map(a => a.brandId))].map(id => brands.find(b => b.id === id)).filter(Boolean);
    const procEmps = [...new Set(procAssign.map(a => a.empId))].map(id => employees.find(e => e.id === id)).filter(Boolean);
    const stats = Scheduler.getRosterStats(data);
    html += `<div class="card mb-3"><div class="card-header">
      <div><div class="card-title"><span class="chip chip-${PROCESS_CHIPS[proc.id] || 'cs'}">${proc.code}</span> ${proc.name}</div>
        <div class="card-subtitle">${procEmps.length} employees across ${procBrands.length} brands</div></div>
    </div>
    <div class="table-wrapper"><table><thead><tr><th>Employee</th><th>Brand(s)</th><th>Work Days</th><th>Leaves</th><th>Weekly Offs</th></tr></thead><tbody>`;
    procEmps.forEach(emp => {
      if (!emp) return;
      const empBrands = procAssign.filter(a => a.empId === emp.id).map(a => brands.find(b => b.id === a.brandId)?.name || '?');
      const s = stats.employeeStats[emp.id] || {};
      html += `<tr><td class="emp-name">${emp.name}</td><td>${empBrands.map(b => `<span class="tag" style="font-size:10px">${b}</span>`).join(' ')}</td>
        <td><span class="badge badge-success">${s.workDays || 0}</span></td>
        <td><span class="badge badge-warning">${s.leaveDays || 0}</span></td>
        <td><span class="badge badge-muted">${s.weeklyOffDays || 0}</span></td></tr>`;
    });
    html += `</tbody></table></div>${renderMiniRosterTable(procEmps, data, key)}</div>`;
  });
  return html;
}

function renderEmployeeRosterView(data, key) {
  const employees = DB.get('employees');
  const assignments = DB.get('assignments');
  const brands = DB.get('brands');
  const processes = DB.get('processes');
  const [year, month] = key.split('-').map(Number);
  const dates = Scheduler.getMonthDates(year, month);
  const holidays = DB.get('publicHolidays');

  let html = `<div class="mb-3"><select class="form-control" style="max-width:280px" id="emp-roster-sel" onchange="filterEmpRosterView('${key}',this.value)">
    <option value="">— Select Employee —</option>
    ${employees.map(e => `<option value="${e.id}" ${App.selectedEmpForRoster === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
  </select></div><div id="emp-roster-detail">`;

  const emp = employees.find(e => e.id === App.selectedEmpForRoster);
  if (emp) {
    const empRoster = data.roster[emp.id] || {};
    const empAssign = assignments.filter(a => a.empId === emp.id);
    const empBrands = [...new Set(empAssign.map(a => a.brandId))].map(id => brands.find(b => b.id === id)?.name || '?');
    const empProcs = [...new Set(empAssign.map(a => a.processId))].map(id => processes.find(p => p.id === id)?.name || '?');
    const stats = Scheduler.getRosterStats(data);
    const s = stats.employeeStats[emp.id] || {};

    html += `<div class="card mb-3"><div class="card-header">
      <div style="display:flex;gap:12px;align-items:center">
        <div class="emp-avatar" style="background:${avatarColor(emp.id)};width:48px;height:48px">${initials(emp.name)}</div>
        <div><div class="card-title">${emp.name}</div><div class="card-subtitle">${emp.employeeCode} &bull; Weekly Off: ${DAY_NAMES[emp.weeklyOffDay]}</div></div>
      </div>
      <div style="display:flex;gap:8px">
        ${[['success', s.workDays || 0, 'Work'], ['warning', (s.leaveDays || 0) + (s.compOffDays || 0), 'Leaves/CO'], ['muted', s.weeklyOffDays || 0, 'Offs']].map(([t, v, l]) => `<div style="text-align:center"><div style="font-size:20px;font-weight:800;color:var(--${t === 'muted' ? 'text-muted' : ''})">${v}</div><div style="font-size:10px;color:var(--text-muted)">${l}</div></div>`).join('')}
      </div>
    </div>
    <div class="tag-list mb-3">${empBrands.map(b => `<span class="tag">${b}</span>`).join('')} ${empProcs.map(p => `<span class="tag" style="background:rgba(6,182,212,0.1);color:var(--accent)">${p}</span>`).join('')}</div>`;

    // Calendar view
    html += `<div class="legend">
      <div class="legend-item"><div class="legend-dot" style="background:var(--status-work)"></div>Work</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--status-weekly-off)"></div>Weekly off</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--status-leave)"></div>Leave</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--status-comp-off)"></div>Comp-off</div>
      <div class="legend-item"><div class="legend-dot" style="background:var(--warning)"></div>Public holiday</div>
    </div>`;
    html += `<div class="roster-grid-container"><div class="roster-grid" style="grid-template-columns: 100px repeat(${dates.length},34px)">
      <div class="rg-cell rg-emp-name rg-header" style="font-size:10px">Day</div>`;
    dates.forEach(d => {
      const ds = Scheduler.isoDate(d); const isSun = d.getDay() === 0; const ph = holidays.find(h => h.date === ds);
      html += `<div class="rg-cell rg-header ${ph ? 'holiday-col' : isSun ? 'weekend' : ''}" title="${ph?.name || ds}">${d.getDate()}<br><span style="font-size:9px">${DAY_NAMES[d.getDay()].slice(0, 2)}</span></div>`;
    });
    html += `<div class="rg-cell rg-emp-name" style="font-size:11px">${emp.name.split(' ')[0]}</div>`;
    dates.forEach(d => {
      const ds = Scheduler.isoDate(d); const status = empRoster[ds] || 'work';
      const isSun = d.getDay() === 0; const ph = holidays.find(h => h.date === ds);
      html += `<div class="rg-cell ${ph ? 'holiday-col' : isSun ? 'weekend' : ''}" title="${ph?.name || ds}:${status}">
        <button type="button" class="rg-status ${STATUS_CLASSES[status] || 'status-work'}" style="width:26px;height:26px;font-size:10px" aria-label="Edit ${emp.name}'s status for ${ds}: ${status}" onclick="showDayEdit('${key}','${emp.id}','${ds}','${status}')">${STATUS_LABELS[status] || 'W'}</button></div>`;
    });
    html += `</div></div></div>`;
  } else {
    html += `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">Select an Employee</div><div class="empty-sub">Choose an employee from the dropdown to view their monthly schedule.</div></div>`;
  }
  html += `</div>`;
  return html;
}

function filterEmpRosterView(key, empId) {
  App.selectedEmpForRoster = empId;
  showRosterTab('employee', key);
}

// ---- ROSTER GENERATION ----
function doGenerateRoster() {
  const y = App.rosterYear || new Date().getFullYear();
  const m = App.rosterMonth !== undefined ? App.rosterMonth : new Date().getMonth();
  showLoading(`Generating roster for ${MONTH_NAMES[m]} ${y}...`);
  setTimeout(() => {
    try {
      const data = Scheduler.generateRoster(y, m);
      const key = rosterKey(y, m);
      const rosters = DB.getObj('rosters');
      const previousOverrides = rosters[key]?.manualOverrides || {};
      data.manualOverrides = previousOverrides;
      Object.entries(previousOverrides).forEach(([empId, overrides]) => {
        Object.entries(overrides).forEach(([date, status]) => {
          if (data.roster[empId]) data.roster[empId][date] = status;
        });
      });
      rosters[key] = data;
      DB.setObj('rosters', rosters);
      Scheduler.revalidateRoster(key);
      App.currentRosterKey = key;
      App.currentRosterData = DB.getObj('rosters')[key];
      hideLoading();
      updateConflictBadge();
      renderRosterPage();
      if (data.conflicts.length > 0) showToast(`Roster generated with ${data.conflicts.length} conflicts!`, 'warning');
      else showToast(`Roster generated successfully for ${MONTH_NAMES[m]} ${y}!`, 'success');
    } catch (e) {
      hideLoading();
      showToast('Error generating roster: ' + e.message, 'error');
    }
  }, 800);
}

function loadRoster(key) {
  navigate('roster');
  const [y, m] = key.split('-').map(Number);
  App.rosterYear = y; App.rosterMonth = m;
  renderRosterPage();
}

// ---- DAY EDIT MODAL ----
function showDayEdit(key, empId, date, currentStatus) {
  const employees = DB.get('employees');
  const emp = employees.find(e => e.id === empId);
  if (!emp) return;
  const statuses = ['work', 'weekly-off', 'leave', 'comp-off'];
  openModal(`  <div class="modal-header"><div class="modal-title">Edit day — ${emp.name}</div><button type="button" class="modal-close" aria-label="Close dialog" onclick="closeModal()">×</button></div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Date: <b style="color:var(--text-primary)">${fmtDate(date)}</b></div>
    <div class="form-group"><div class="form-label">Status</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${statuses.map(s => `<button class="btn ${s === currentStatus ? 'btn-primary' : 'btn-secondary'}" onclick="applyDayEdit('${key}','${empId}','${date}','${s}')">${s === 'work' ? 'Work' : s === 'weekly-off' ? 'Weekly off' : s === 'leave' ? 'Leave' : 'Comp-off'}</button>`).join('')}
    </div></div>
    <div class="modal-footer"><button class="btn btn-secondary" onclick="closeModal()">Cancel</button></div>`);
}

function applyDayEdit(key, empId, date, newStatus) {
  const data = Scheduler.applyOverride(key, empId, date, newStatus);
  closeModal();
  updateConflictBadge();
  showToast(`Updated ${date} to ${newStatus}`, 'success');
  showRosterTab(App.rosterTab || 'company', key);
}

function exportRosterCSV(key) {
  const rosters = DB.getObj('rosters');
  const data = rosters[key];
  if (!data) return;
  const employees = DB.get('employees');
  const [year, month] = key.split('-').map(Number);
  const dates = Scheduler.getMonthDates(year, month);
  let csv = 'Employee,' + dates.map(d => Scheduler.isoDate(d)).join(',') + '\n';
  employees.forEach(emp => {
    const row = [emp.name, ...dates.map(d => (data.roster[emp.id] || {})[Scheduler.isoDate(d)] || 'work')];
    csv += row.join(',') + '\n';
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = `roster_${MONTH_NAMES[month]}_${year}.csv`; a.click();
  showToast('CSV exported!', 'success');
}
