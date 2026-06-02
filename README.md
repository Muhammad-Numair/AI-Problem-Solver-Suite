# 🧠 AI Problem Solver Suite — Web Edition

**11 interactive modules** running entirely in the browser. No server needed.  
Built with **React 18 + Vite 5**. Dark GitHub-inspired theme. Fully responsive.

---

## 🚀 Quick Start

```bash
npm install
npm run dev
# → http://localhost:5173
```

## 📦 Production Build

```bash
npm run build && npm run preview
```

---

## ✨ Modules

### 🤖 AI Algorithm Modules

| Module | Algorithm | Highlights |
|--------|-----------|------------|
| 🌀 **Maze Solver** | BFS · DFS · A* · Greedy | Animated step-by-step, deferred stats |
| 🧩 **Sliding Puzzle** | A* / IDA* (3×3–7×7) | Web Worker keeps UI live; progress overlay |
| 🗺️ **Route Finder** | Dijkstra · A* | Random graph generator, step animation |
| ❌ **Tic-Tac-Toe AI** | Minimax · Alpha-Beta | Easy/Medium/Impossible, scoreboard |
| 📅 **School Timetable** | CSP Backtracking | Period duration, breaks, rooms, multi-class |
| ⏰ **Task Scheduler** | Overlap-aware timeline | Start/End times, Gantt SVG, conflict lanes |

### 🎮 Puzzle Games

| Module | Technique | Highlights |
|--------|-----------|------------|
| ♛ **N-Queens** | Backtracking | N=4–12, animate BT, find all solutions |
| 🔢 **Mini Sudoku** | Backtracking | 6×6 grid, 3 difficulty levels, keyboard input |
| ⬛ **Shikaku** | CSP | Rectangle partition, 3 verified puzzles |
| 🌙 **LinkedIn Tango** | CSP | Sun/Moon constraints, 3 puzzles, AI solver |

---

## 📁 Project Structure

```
src/
├── App.jsx                   Shell · sidebar with sections · mobile hamburger
├── index.css                 Dark theme · responsive breakpoints · animations
├── main.jsx
│
├── algorithms/               Pure JS — zero React dependency
│   ├── mazeAlgo.js           Maze generation + BFS/DFS/A*/Greedy (MinHeap)
│   ├── puzzleAlgo.js         Sliding puzzle A* (counter tie-breaker)
│   ├── graphAlgo.js          Dijkstra · A* · Prim's random graph generator
│   ├── gameAI.js             Minimax · Alpha-Beta pruning
│   ├── timetableAlgo.js      School CSP · time-slot builder · pivot grid builder
│   ├── schedulerAlgo.js      Overlap detection · lane packing · stats
│   ├── nQueensAlgo.js        Solutions · BT steps · attack detection
│   ├── sudokuAlgo.js         6×6 solver · error checker · verified puzzles
│   ├── shikakuAlgo.js        Rectangle CSP · 3 pre-verified puzzles
│   └── tangoAlgo.js          Sun/Moon CSP · violation checker · 3 puzzles
│
├── workers/
│   └── puzzleSolver.js       Web Worker: A* (≤4×4) + IDA* (5×5+) + progress
│
├── components/
│   ├── Dashboard.jsx          Two-section card grid (AI + Puzzles)
│   └── StatCard.jsx
│
└── modules/
    ├── MazeSolver.jsx          Canvas · ResizeObserver · deferred stats
    ├── SlidingPuzzle.jsx       Worker spawn · solving overlay · tile scaling
    ├── RouteFinder.jsx         SVG graph · step-by-step path animation
    ├── TicTacToe.jsx           Explicit board sizing · AI delay · scoreboard
    ├── TimetableGenerator.jsx  5-tab config · pivot grid · CSV/JSON export
    ├── TaskScheduler.jsx       Time-range tasks · SVG Gantt · conflict lanes
    ├── NQueens.jsx             Interactive board · BT animation · find-all
    ├── MiniSudoku.jsx          6×6 grid · box borders · keyboard + numpad
    ├── Shikaku.jsx             Click-to-draw rectangles · color feedback
    └── LinkedInTango.jsx       Constraint badges · row/col counters · AI solve
```

---

## 🧩 Sliding Puzzle — Complexity & Web Worker

| Size | States | Algorithm | Typical time |
|------|--------|-----------|-------------|
| 3×3  | 181 440 | A*    | < 50 ms     |
| 4×4  | ~10¹³   | A* (10 s cap) | 0.1–8 s |
| 5×5  | ~10²⁴   | IDA* (15 s cap) | may timeout |
| 6×6+ | ~10³⁵+  | IDA* (15 s cap) | almost always timeout |

The UI **never freezes** — the solver runs in a dedicated Web Worker thread.

---

## ⏰ Task Scheduler — Design

Tasks have explicit **Start Time** and **End Time** (not duration).  
Overlapping tasks are **allowed** and detected automatically:
- Conflicts highlighted with ⚠ badge
- Overlapping tasks placed in separate **parallel lanes** in the Gantt view
- Full statistics: total tasks, conflicts, clean tasks, total time, lane count

---

## Requirements

- Node.js ≥ 18
- npm ≥ 9
