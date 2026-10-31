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

## My design decisions

### 1. How I model the team

I model employees, pods, brands, and processes as separate entities. Each employee belongs to a pod and has a weekly off day; each pod has a lead; and each brand belongs to a pod. Processes are shared types. An assignment links an employee to a brand and process, while a brand-process rule stores its working calendar and minimum staffing. This lets one employee serve several assignments and lets an assignment have multiple employees.

### 2. How I generate and validate a roster

I generate a roster deterministically for each day in the selected month. I apply employee status precedence (`leave > comp-off > weekly-off > work`), check whether each brand-process rule requires work that day, and count assigned employees who are available. I compare that count with the configured minimum (including weekday-specific minimums) and report coverage gaps. I also check configured shift times for overlaps.

### 3. Single-employee and multi-employee brands

I use the same assignment and staffing-rule model for both cases. A single-person brand-process has one assignment and normally requires one available employee; multi-process brands can have different employees per process. I also model a shared process explicitly: NestNook CS has two assigned employees and requires both (`minStaff=2`).

### 4. When the only assigned employee is unavailable

I flag a coverage conflict on a required working day, show its date and brand-process details in the Conflict Center, mark the gap in the heatmap, and suggest available pod members as backups. I leave approving a backup or rescheduling leave to the operations manager.

### 5. Conflicting requirements and insufficient staffing

I treat working calendars and minimum staffing as requirements, and report staffing shortfalls and configured shift overlaps rather than silently accepting them. Weekly offs can be overridden for a specific day. A manager decides how to resolve a conflict, such as assigning a backup or rescheduling leave.

### 6. What I automate and what I leave to people

I automate roster generation from configured rules, leave and holiday application, conflict detection, backup suggestions, and CSV export. I leave assignments, leave approvals, conflict resolution, day overrides, and final approval to people. This keeps deterministic work consistent while leaving operational trade-offs to the team.

### 7. What I would change if the team doubled

For roughly 60 employees and 40 brands, I would move from browser-only `localStorage` to a shared database and authenticated API so data and permissions work across users. I would add pagination or virtual scrolling for larger roster grids, then consider caching and regenerating only the schedules affected by a change.

### 8. What I would improve with one more week

I would first add a roster approval workflow: pod leads review a generated roster before an operations manager publishes it. That would add a clear human review step without hiding unresolved coverage issues.

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
