# SmartRoster — Smart Roster Management System

**Datastraw Tech Internship Assessment | Built by Rohit Tupe**

I built SmartRoster as a browser-based, zero-dependency roster management system for D2C operations teams managing employees across brands, processes, and pods.

---

## Run locally

I use Python's built-in web server to run the app locally on Windows:

1. Open PowerShell and change to the project folder:

   ```powershell
   cd D:\project1
   ```

2. Start the local web server:

   ```powershell
   python -m http.server 8000
   ```

   If `python` is not recognized, I use `py -m http.server 8000` instead.
3. Keep PowerShell open and visit **http://localhost:8000** in your browser.
4. To stop the server, press **Ctrl+C** in PowerShell.

I start the server from the project folder so it serves this app. If port 8000 is already in use, I use `python -m http.server 8001` and visit **http://localhost:8001**.

I don't need to install dependencies or build the app. I can open `index.html` directly in a modern browser, but I recommend the local server.

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

## Deploy on Netlify

I deploy SmartRoster as a static site from the project root. I don't need a server, build command, or package installation. The committed [`netlify.toml`](./netlify.toml) sets `publish = "."`, which is the correct publish directory for this project: `index.html` and the app assets are in the root.

To deploy from GitHub, I:

1. Push the project to the GitHub repository's `main` branch.
2. Sign in to Netlify, choose **Add new site → Import an existing project**, and connect GitHub.
3. Select the SmartRoster repository. I leave the build command empty and use `.` as the publish directory; Netlify can read the publish directory from `netlify.toml`.
4. Choose **Deploy site**. Netlify gives me a public URL and deploys future commits pushed to the connected branch.

I store roster data in browser `localStorage`, not on Netlify. Data is specific to the browser and site origin, so the deployed site does not share data with localhost or other users. I would not use this deployment for real employee data until I add authentication and a shared backend.

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

## 🔧 Technology I used

- **HTML5 / Vanilla JS / CSS3** — I built the app without framework dependencies
- **localStorage** — I persist data in the user's browser, with no server
- **Google Fonts (Inter)** — I use Inter for typography
- **Responsive interface** — I support mobile layouts and keyboard focus states

---

## 📝 My assumptions

1. I assign one fixed weekly off day to each employee, with day-level overrides for exceptions.
2. I make public holidays configurable and include common Indian national holidays in the sample.
3. I let approved leave take precedence over a weekly off so it remains separately tracked.
4. I allow pod leads to also have operational assignments.
5. I treat comp-off like leave when checking coverage.
6. I preserve and reapply manual overrides when regenerating a roster.
7. I flag shift overlaps only when both assignments have configured shift times.

---

## 📬 Submission

For my submission, I will deploy the static files, replace the placeholders below with working links, and record a 3–5 minute demo showing roster generation, the five roster views, a detected conflict, and revalidation after an availability or assignment change.

**Application URL:** [Add your deployed application URL]  
**GitHub Repo:** [Add your public repository URL]  
**Demo video:** [Add your demo video URL]  
**LinkedIn:** [Add your LinkedIn profile URL]

---

*Built for Datastraw Tech Internship Assessment — Smart Roster Management System*
