# Code Mentor — Practice & Learning Platform

A LeetCode-style DSA practice platform whose signature feature is a **Personalized Mistake-Based Problem Recommendation System**: it records every wrong submission, detects the student's weak topics, and recommends targeted problems to close those gaps.

Built for the Software Engineering lab. Every screen and flow follows the project's Use Case, Activity, Sequence, State and Component diagrams and Test Cases TC01–TC10.

---

## Features

| Area | What you get |
|---|---|
| **Problemset** | LeetCode table: Status (Solved / Attempted / Todo), Title, Topic tag, Acceptance %, Difficulty. Difficulty pills, topic chips + dropdown, status filter, search, "Pick One". |
| **Coding workspace** | Split screen. Left: `Description · Hints · Submissions` tabs. Right: language selector (JavaScript / Python / Java / C++), editor with line numbers, Testcase / Test Result console, **Run** and **Submit**. |
| **Verdicts** | Green **Accepted** with runtime / memory and "beats %". Red **Wrong Answer** with Input / Output / Expected, plus **Try Again** and **I'm Stuck** buttons. AI Mentor feedback and a "Next Problem" suggestion. |
| **Recommendations** ⭐ | Weak Topics alert strip (e.g. `Arrays — 33% accuracy • 2 recent mistakes`) and ranked recommendations, each with a reason badge: *Retry after previous mistake*, *Targeted for weak topic: X*, *Explore new topic*, *Level up*. Also a Mistake Log. |
| **Progressive hints** | "I'm Stuck" reveals Hint 1 (intuition), then Hint 2 (approach), then Hint 3 (algorithm), one click at a time. Revealed hints are saved. |
| **Dashboard** | Solved ring with Easy/Medium/Hard breakdown, daily streak, daily-goal bar, acceptance, points, rank, weak topics, Recommended For You, topic success-rate bars, 5-week activity heatmap, practice history, leaderboard, and a **Simulate Next-Day Solve** demo button. |
| **Practice Mode** | Choose difficulty, optional topic, 3–5 problems and a time limit. Live countdown that auto-finishes at 00:00. Practice Summary shows Final Score, Accuracy % and Time Taken. Past sessions are listed. |
| **Admin Console** | Reports (users, submissions, pass rate, most-failed topics and problems, pass rate by difficulty, recent submissions). Manage Users (update name / email / role / password, delete). Manage Problems (view, add, delete). |
| **Profile & Settings** | Edit name, set daily goal, change password, **Reset Demo Data**. |

## Architecture

```
src/
├── data/seedData.js           # 20 DSA problems (4-language starter code, 3 hints each), demo accounts, seed history
├── services/
│   ├── storageService.js      # "Database": one JSON document in localStorage, plus session and code drafts
│   ├── authService.js         # Authentication Service: register / login / logout / role routing
│   ├── problemService.js      # Problem Service: catalogue, deterministic evaluator, submissions, streaks, leaderboard, practice mode
│   ├── aiEngine.js            # AI / Solution Engine: weak-topic detection, recommendations, hints, feedback
│   └── adminService.js        # Admin Console backend: reports, user and problem management
├── context/AppContext.jsx     # Session state; re-renders when storage changes
├── components/                # Navbar, route guards, CodeEditor, verdict/hint panels, recommendation cards, UI kit
└── pages/                     # Login, Register, Dashboard, Problems, Workspace, Recommended, Practice, Profile, Admin
```

These modules match the Component / Sequence diagrams: **Web App → Authentication Service / Problem Service → AI / Solution Engine → Database**, and **Admin Console → Backend → Database**.

### Simplifications (on purpose, for a no-config lab deployment)

- **No backend server or DB binary.** The "Database" is a pre-seeded JSON document kept in `localStorage`. It sets itself up on first load, survives page reloads, and can be restored with **Reset Demo Data**. This means it deploys to any static host (Vercel) with no setup. *Trade-off: data lives in each browser and is not shared between devices.*
- **Deterministic evaluator instead of real code execution.** Running untrusted code needs a sandboxed judge. The evaluator uses fixed rules instead, so a live demo never fails at random:
  - ✅ **Accepted** when the code adds real logic beyond the starter template (a `return`, loop, condition or assignment).
  - ❌ **Wrong Answer** when the code is empty, is the unchanged template, is too short, or contains `// fail`, `# fail` or the word `wrong`.
- **Rule-based "AI".** Weak topic = **2+ wrong submissions, or under 50% accuracy over 2+ attempts**, and not yet back above 70%. Recommendations are ranked: retry failed problems → weak-topic problems (easiest first) → unexplored topics → level-ups.
- Passwords are stored in plain text in the browser. This is acceptable for a demo only; a production build would hash them on a server.
- Each user has a virtual clock so **Simulate Next-Day Solve** can show a multi-day streak live.

## Run locally

Requires Node 18+.

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. Other commands:

```bash
npm run build      # production build into dist/
```

```bash
npm test           # service-level verification of TC01–TC10 (54 checks)
```

## Demo credentials

The Login page has one-click **Demo Fill** buttons for each account.

| Role | Email | Password | Notes |
|---|---|---|---|
| Student | `student@codementor.edu` | `student123` | Priya — 8 solved, 4-day streak, **Arrays already flagged weak** (33%) |
| Student | `alex@codementor.edu` | `alex123` | Alex — fresh account, nothing attempted yet |
| Admin | `admin@codementor.edu` | `admin123` | Opens the Admin Console at `/admin` |

## Test-case verification (TC01–TC10)

`npm test` runs the real services under Node (54/54 passing). Every flow below was also run end to end in headless Chromium against the production build, with no console errors.

| TC | Scenario | How it's satisfied | Status |
|---|---|---|---|
| TC01 | Student Registration | Name / Email ID / Password form. Validates email format, password length and duplicate emails. Saves the account and redirects to `/dashboard` with a welcome message. | ✅ |
| TC02 | Login with Invalid Credentials | A wrong email or password shows a red error and blocks access. Students go to `/dashboard`, admins to `/admin`. Protected routes redirect to `/login`. Sign out ends the session. | ✅ |
| TC03 | Fetch Problems by Difficulty | Easy / Medium / Hard pills show only matching problems (8 / 8 / 4). Combines with the topic and search filters. | ✅ |
| TC04 | Successful Problem Submission | The deterministic evaluator returns Accepted with runtime and memory. The problem is marked Solved and progress, history, streak and leaderboard update. A next problem is suggested. Failures show Wrong Answer with Input / Output / Expected. | ✅ |
| TC05 | Identification of Weak Topics | 2+ wrong submissions or under 50% accuracy flags the topic. The alert strip, the navbar badge and the recommendations update straight away. | ✅ |
| TC06 | Progressive Hint System | "I'm Stuck" reveals Hint 1, then 2, then 3, one per click, and saves them. | ✅ |
| TC07 | Practice Based on Previous Mistakes | The Recommended tab lists retry and weak-topic problems with reason badges and explanations, plus a Mistake Log. | ✅ |
| TC08 | Updating Streak and Progress | The dashboard shows the streak, daily goal, Easy/Medium/Hard counts, topic bars, history and leaderboard. **Simulate Next-Day Solve** adds 1 to the streak. | ✅ |
| TC09 | Practice Mode with Timer | Pick a difficulty (and optional topic), 3–5 problems and a time limit. The countdown runs live and auto-finishes. The summary shows Score, Accuracy % and Time Taken. | ✅ |
| TC10 | Admin User Management | Protected `/admin` with Reports, Manage Users (update / delete, list refreshes at once) and Manage Problems (add / delete). | ✅ |

## Deploy to Vercel

`vercel.json` rewrites every path to `index.html`, so deep links such as `/problems/3` don't 404 after a refresh.

1. Merge the PR into `main` on GitHub.
2. Go to https://vercel.com/new, sign in with GitHub, and **Import** this repository.
3. Vercel detects **Vite** automatically: build command `npm run build`, output folder `dist`. No environment variables are needed.
4. Click **Deploy**. Later pushes to `main` redeploy automatically.
