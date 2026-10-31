# SmartRoster — Smart Roster Management System

**Datastraw Tech Internship Assessment | Built by Rohit Tupe**

A fully browser-based, zero-dependency Smart Roster Management System for D2C operations teams managing 30+ employees across multiple brands, processes, and pods.

---

## Quick start

### Windows (PowerShell)

1. Open PowerShell.
2. Change to the project folder:

   ```powershell
   cd D:\project1
   ```

3. Start the local web server:

   ```powershell
   python -m http.server 8000
   ```

   If `python` is not recognized, try `py -m http.server 8000`.
4. Leave PowerShell open and visit **http://localhost:8000** in your browser.
5. To stop the server, return to PowerShell and press **Ctrl+C**.

Run the server from the project folder so the browser serves this app, not another folder. If port 8000 is already in use, use `python -m http.server 8001` instead and open **http://localhost:8001**.

The app has no install or build step. You can also open `index.html` directly in a modern browser, but the local server is recommended.

```
project1/
├── index.html      → Entry point (open this)
├── style.css       → Responsive interface styling
├── data.js         → Sample dataset (32 employees, 20 brands, 5 processes) + localStorage helpers
├── scheduler.js    → Core constraint-based scheduling engine
├── app.js          → Main app logic, roster views, navigation
├── pages.js        → Employees, Brands, Leaves, Conflicts, Settings pages
└── README.md       → This file
```

---

## Deploy for free

SmartRoster is a static site: it needs no server, build command, or package installation. The files in the project root can be served directly.

### Free hosting options

| Host | Best for | Notes |
|---|---|---|
| **GitHub Pages** | The simplest option for this GitHub-hosted project | Publish the repository root from the `main` branch. Use a public repository for the free Pages plan. |
| **Cloudflare Pages** | Git-based deploys and fast global delivery | Connect the repository; leave the build command empty and publish the project root. |
| **Netlify** | A straightforward Git-connected deploy | Import the repository, use no build command, and set the publish directory to the project root (`.`). |
| **Vercel** | Git-based deploys and preview URLs | Import the repository as a static project with no build command. |

Free-plan terms and limits can change; check each provider's current plan before choosing.

### Publish with GitHub Pages

1. Make sure `index.html`, `style.css`, `data.js`, `scheduler.js`, `app.js`, and `pages.js` are committed and pushed to the GitHub repository's `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/(root)`, then save.
4. Wait for the Pages deployment to finish. The site URL will appear in **Settings → Pages**.

No build step is needed. The site uses browser `localStorage`, so roster data is saved only in the browser and origin where it was entered; it is not shared with teammates or synced across devices. Moving from localhost to the hosted URL starts with separate browser storage. Do not use this deployment for real employee data or shared team operations until authentication and a shared backend are added.

---

## Features

- **Dashboard** — Stats overview, pod summary, recent rosters, quick actions
- **Roster Generation** — One-click monthly roster for all 32 employees
- **5 Roster Views** — Company-wide, Pod, Brand, Process, Employee
- **Coverage Heatmap** — Visual ✓/⚠ grid per brand-process per day  
- **Conflict Detection** — Automatic detection of coverage gaps before publishing
- **Manual Overrides** — Click any cell to change an employee's day status, with instant re-validation
- **Leave Management** — Add planned leaves, comp-offs, and approve pending requests
- **Holiday Management** — Configure public holidays that affect scheduling
- **Brand & Process Rules** — Four operating calendars, configurable default staffing, and weekday-specific minimum staffing
- **Employee, Pod, Brand & Process Management** — Add, edit, and remove operational records and assignments in the UI
- **Shift Validation** — Optional assignment shift times; overlapping shifts for an employee are flagged
- **CSV Export** — Download any roster as a spreadsheet
- **Backup Suggestions** — When a gap is detected, suggests available pod members as backups
- **Persistent Storage** — All data saved in localStorage; survives browser refresh

If you opened an earlier version of the app in the same browser, its saved data is retained. To load the updated sample dataset, open **Settings → Reset to Sample Data** (this removes custom data saved in that browser).

---

## 📊 Sample Dataset

| Metric | Value |
|---|---|
| Employees | 32 (across 4 pods) |
| Brands | 20 |
| Processes | 5 (CS, ACC, NDR, RET, QA) |
| Assignments | 37 employee-brand-process links |
| Single-employee brands | 30% (6 of 20; one-process brands) |
| Multi-employee brands | 70% (14 of 20; different employee per process, with two employees sharing NestNook CS) |
| Pod Leads | 4 (one per pod, also operationally assigned) |

---

## Design and implementation

### 1. Data Model

The system models five core entities and their relationships:

- **Employee** → belongs to a `Pod`, has a `weeklyOffDay` (0=Sun, 6=Sat)
- **Pod** → has a `leadId` pointing to one employee
- **Brand** → belongs to a `Pod`
- **Process** → global types (CS, ACC, NDR, RET, QA)
- **BrandProcessRule** → links a Brand + Process with a built-in or custom weekday `workingRule`, default `minStaff`, and optional weekday-specific minimums
- **Assignment** → links Employee + Brand + Process, with optional shift start/end times for overlap validation

This normalised relational design means a single employee can be assigned to multiple brands and processes, and a single brand-process can have multiple employees (for redundancy or minStaff > 1 scenarios).

### 2. Roster Generation

For each date in the selected month, the scheduler:

1. Checks each employee's status: `leave > comp-off > weekly-off > work`
2. For each `BrandProcessRule`, evaluates whether the date is a **required working day** based on the rule (`365`, `no-holidays`, `no-sunday-holidays`, or configured custom weekdays)
3. Finds all employees assigned to that brand-process combination
4. Counts how many of them are in `work` status
5. Applies a weekday-specific minimum when configured; otherwise uses the default `minStaff`
6. If available staff is below the minimum → records a conflict with full details
7. Checks configured assignment shift times for overlapping responsibilities

This is a **deterministic constraint-checking** approach (not stochastic), which ensures reproducibility and explainability. Given the operational nature of the problem (humans remain in control of assignments), this is the correct tradeoff.

### 3. Single vs Multi-Employee Brands

The sample assigns different employees to different processes within a brand. Six one-process brands have one assigned employee; multi-process brands have separate employees per process. NestNook additionally has two employees sharing CS (`minStaff=2`), so both emp30 and emp31 must be available on required days. This demonstrates process-level separation across the sample, rather than the assessment's approximately 80% single-dedicated-employee mix.

The system handles both cases identically through the `Assignment` + `BrandProcessRule` tables. The distinction is purely in how many rows exist per brand-process pair.

### 4. Single Employee Unavailability

If an employee is the sole person assigned to a brand-process (e.g. SwiftCart-CS handled only by Sneha Patel), and that employee goes on leave on a required working day, the system:
- detects a **critical conflict** (0/1 available vs 1 required)
- surfaces it in the Conflict Center with date, brand, process, and reason
- suggests available pod members as potential backups
- flags the gap on the brand's coverage heatmap as ⚠️

The operations manager must then either approve a backup assignment or move the leave to a non-required day.

### 5. Conflicting Requirements / Insufficient Staffing

The system distinguishes:
- **Mandatory constraints**: BrandProcessRule `workingRule` and `minStaff` → always flagged as conflicts
- **Preferences**: Employee `weeklyOffDay` → can be overridden manually by clicking the cell and changing the status

Coverage gaps and configured shift overlaps are never silently dropped. If they cannot be auto-resolved, they appear in the Conflict Center with explanations. The operations manager retains full control.

### 6. Automation vs Human Control

| Automated | Human-Controlled |
|---|---|
| Monthly roster generation from rules | Assignment of employees to brands/processes |
| Weekly-off and holiday application | Leave approval |
| Conflict detection and gap flagging | Resolving gaps (pickup assignments, leave reschedule) |
| Backup employee suggestions | Final roster approval/publish |
| CSV export | Override any individual day's status |

The guiding principle: **automate what is deterministic, surface what requires judgement**.

### 7. Scalability

If the team doubled (60+ employees, 40+ brands):

- The current data model scales horizontally — more rows, same logic
- The scheduling engine runs in O(employees × days × brandProcessRules) which is well within browser limits even at 100 employees
- The main bottleneck would be UI rendering of large roster grids → would need **virtual scrolling** or server-side pagination
- Would move storage from localStorage to a proper database (PostgreSQL/Supabase) with a REST API (FastAPI or Node.js)
- Would add roster caching and incremental regeneration (only re-run affected employees when a leave changes)

### 8. One More Week Improvements

In priority order:
1. **Roster approval workflow** — Pod leads review before operations manager publishes
2. **Fair weekly-off distribution** — Rotate Sunday offs so no employee always gets the worst days
3. **Automatic schedule optimization after configuration changes** — Existing saved rosters are revalidated when leaves, holidays, assignments, staffing rules, or employee availability change; automatic schedule optimization could be added
4. **Google Sheets integration** — Direct export/sync for teams already using Sheets
5. **Preference-based scheduling** — Allow employees to mark preferred off days; scheduler respects these when coverage allows

---

## 🔧 Technology Stack

- **HTML5 / Vanilla JS / CSS3** — Zero dependencies, runs in any browser
- **localStorage** — Persistent client-side storage (no server needed)
- **Google Fonts (Inter)** — Typography
- **Responsive interface** — Clean, light styling with mobile layouts and keyboard focus states

---

## 📝 Assumptions

1. **Weekly off is fixed per employee** (same day every week). The system allows this to be changed per-employee, and manual overrides can handle occasional exceptions.
2. **Public holidays are configurable** — the sample list uses common Indian national holidays.
3. **Approved leaves always override weekly offs** — if an employee is approved for leave on their weekly off day, it shows as "leave" (no functional difference, but tracked separately).
4. **A pod lead can also be operationally assigned** to brands (e.g., Arjun Mehta handles UrbanPulse CS while leading Alpha Pod).
5. **Comp-off is treated the same as leave** for coverage purposes.
6. **Roster regeneration does not delete manual overrides** — overrides persist and are re-applied after regeneration.
7. **Shift overlap detection applies only when both shift times are configured** — assignments without shift times are not assumed to conflict.

---

## Deploy on Netlify

The app is static and has no build or install step. The included `netlify.toml` publishes the project root.

1. Push the project to the `main` branch of the GitHub repository.
2. In Netlify, choose **Add new site → Import an existing project** and connect the GitHub repository.
3. Keep the build command empty. Netlify reads the publish directory (`.`) from `netlify.toml`.
4. Choose **Deploy site**. Netlify will provide a public URL and automatically deploy future commits pushed to the connected branch.

Roster data is stored in browser `localStorage`, not on Netlify or shared with other users. The deployed site has separate browser storage from localhost; do not enter real employee data until a secured shared backend is added.

---

## 📬 Submission

Before submitting, deploy the static files to a public host and replace the placeholders below with working links. Record a 3–5 minute demo showing roster generation, the five roster views, a detected conflict, and how changing availability or assignments triggers revalidation.

**Application URL:** [Add your deployed application URL]  
**GitHub Repo:** [Add your public repository URL]  
**Demo video:** [Add your demo video URL]  
**LinkedIn:** [Add your LinkedIn profile URL]

---

*Built for Datastraw Tech Internship Assessment — Smart Roster Management System*
