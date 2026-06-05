import { useState } from 'react'
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/react"
import Dashboard from './components/Dashboard.jsx'
import MazeSolver from './modules/MazeSolver.jsx'
import SlidingPuzzle from './modules/SlidingPuzzle.jsx'
import RouteFinder from './modules/RouteFinder.jsx'
import TicTacToe from './modules/TicTacToe.jsx'
import TimetableGenerator from './modules/TimetableGenerator.jsx'
import TaskScheduler from './modules/TaskScheduler.jsx'
import NQueens from './modules/NQueens.jsx'
import MiniSudoku from './modules/MiniSudoku.jsx'
import Shikaku from './modules/Shikaku.jsx'
import LinkedInTango from './modules/LinkedInTango.jsx'

const PAGES = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠', color: '#8B949E' },
    // ── AI Algorithms ──
    { id: 'maze', label: 'Maze Solver', icon: '🌀', color: '#58A6FF' },
    { id: 'puzzle', label: 'Sliding Puzzle', icon: '🧩', color: '#BC8CFF' },
    { id: 'route', label: 'Route Finder', icon: '🗺️', color: '#3FB950' },
    { id: 'tictactoe', label: 'Tic-Tac-Toe AI', icon: '❌', color: '#F78166' },
    { id: 'timetable', label: 'Timetable Generator', icon: '📅', color: '#E3B341' },
    { id: 'scheduler', label: 'Task Scheduler', icon: '⏰', color: '#39D0D8' },
    // ── Puzzle Games ──
    { id: 'nqueens', label: 'N-Queens', icon: '♛', color: '#E3B341' },
    { id: 'sudoku', label: 'Mini Sudoku', icon: '🔢', color: '#3FB950' },
    { id: 'shikaku', label: 'Shikaku', icon: '⬛', color: '#BC8CFF' },
    { id: 'tango', label: 'LinkedIn Tango', icon: '🌙', color: '#F78166' },
]

const SECTIONS = [
    { label: 'AI Algorithms', ids: ['maze', 'puzzle', 'route', 'tictactoe', 'timetable', 'scheduler'] },
    { label: 'Puzzle Games', ids: ['nqueens', 'sudoku', 'shikaku', 'tango'] },
]

const SUBTITLES = {
    dashboard: 'Select a module to begin',
    maze: 'BFS · DFS · A* · Greedy Best-First',
    puzzle: 'A* · Heuristic Search · Sizes 3×3–7×7',
    route: 'Dijkstra · A* on weighted graphs',
    tictactoe: 'Minimax · Alpha-Beta Pruning',
    timetable: 'School Timetable · CSP Backtracking',
    scheduler: 'Overlap-aware timeline scheduling',
    nqueens: 'Backtracking · N=4 to 12',
    sudoku: '6×6 grid · Backtracking solver',
    shikaku: 'Rectangle partition · CSP',
    tango: 'Sun & Moon · Constraint satisfaction',
}

export default function App() {
    const [page, setPage] = useState('dashboard')
    const [status, setStatus] = useState('Welcome — select a module to begin.')
    const [sideOpen, setSide] = useState(false)

    const navigate = (id) => {
        setPage(id)
        setStatus(`Module: ${PAGES.find(p => p.id === id)?.label}`)
        setSide(false)
    }

    const COMPONENTS = {
        dashboard: <Dashboard onSelect={navigate} />,
        maze: <MazeSolver onStatus={setStatus} />,
        puzzle: <SlidingPuzzle onStatus={setStatus} />,
        route: <RouteFinder onStatus={setStatus} />,
        tictactoe: <TicTacToe onStatus={setStatus} />,
        timetable: <TimetableGenerator onStatus={setStatus} />,
        scheduler: <TaskScheduler onStatus={setStatus} />,
        nqueens: <NQueens onStatus={setStatus} />,
        sudoku: <MiniSudoku onStatus={setStatus} />,
        shikaku: <Shikaku onStatus={setStatus} />,
        tango: <LinkedInTango onStatus={setStatus} />,
    }

    const current = PAGES.find(p => p.id === page)

    return (
        <div className="app">
            {/* Mobile backdrop */}
            <div className={`sidebar-backdrop${sideOpen ? ' open' : ''}`}
                onClick={() => setSide(false)} />

            {/* Sidebar */}
            <nav className={`sidebar${sideOpen ? ' open' : ''}`}>
                <div className="sidebar-logo"><span>🧠</span> AI Suite</div>

                {/* Dashboard */}
                <button
                    className={`nav-btn${page === 'dashboard' ? ' active' : ''}`}
                    style={page === 'dashboard' ? { color: '#8B949E', borderLeftColor: '#8B949E' } : {}}
                    onClick={() => navigate('dashboard')}>
                    <span className="icon">🏠</span> Dashboard
                </button>

                {SECTIONS.map(sec => (
                    <div key={sec.label} className="nav-section">
                        <div className="nav-label">{sec.label}</div>
                        {PAGES.filter(p => sec.ids.includes(p.id)).map(p => (
                            <button key={p.id}
                                className={`nav-btn${page === p.id ? ' active' : ''}`}
                                style={page === p.id ? { color: p.color, borderLeftColor: p.color } : {}}
                                onClick={() => navigate(p.id)}>
                                <span className="icon">{p.icon}</span>{p.label}
                            </button>
                        ))}
                    </div>
                ))}

                <div className="sidebar-footer">v1.0 · 11 modules</div>
            </nav>

            {/* Main */}
            <div className="main">
                <div className="topbar">
                    <button className="hamburger" onClick={() => setSide(s => !s)}>☰</button>
                    <span style={{ fontSize: 18 }}>{current?.icon}</span>
                    <span className="topbar-title">{current?.label}</span>
                    <span className="topbar-sub">— {SUBTITLES[page]}</span>
                </div>
                <div className="page">{COMPONENTS[page]}</div>
                <div className="statusbar">{status}</div>
            </div>
            <Analytics />
            <SpeedInsights />
        </div>
    )
}
