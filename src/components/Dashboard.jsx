const AI_CARDS = [
  { id:'maze',      icon:'🌀', title:'Maze Solver',          color:'#58A6FF', desc:'BFS · DFS · A* · Greedy\nAnimated pathfinding with stats' },
  { id:'puzzle',    icon:'🧩', title:'Sliding Puzzle',       color:'#BC8CFF', desc:'A* · Web Worker solver\nSizes 3×3 to 7×7 with live progress' },
  { id:'route',     icon:'🗺️', title:'Route Finder',         color:'#3FB950', desc:'Dijkstra · A*\nWeighted graph, step-by-step animation' },
  { id:'tictactoe', icon:'❌', title:'Tic-Tac-Toe AI',       color:'#F78166', desc:'Minimax · Alpha-Beta Pruning\nUnbeatable AI with difficulty modes' },
  { id:'timetable', icon:'📅', title:'Timetable Generator',  color:'#E3B341', desc:'CSP Backtracking\nFull school timetable with custom config' },
  { id:'scheduler', icon:'⏰', title:'Task Scheduler',       color:'#39D0D8', desc:'Start/End times · Overlap detection\nGantt-style timeline view' },
]

const PUZZLE_CARDS = [
  { id:'nqueens',   icon:'♛',  title:'N-Queens',             color:'#E3B341', desc:'Backtracking · N=4–12\nAnimate the search, find all solutions' },
  { id:'sudoku',    icon:'🔢', title:'Mini Sudoku',           color:'#3FB950', desc:'6×6 grid · Numbers 1–6\nBacktracking solver + 3 difficulty levels' },
  { id:'shikaku',   icon:'⬛', title:'Shikaku',              color:'#BC8CFF', desc:'Rectangle partition puzzle\nCSP solver + interactive drawing' },
  { id:'tango',     icon:'🌙', title:'LinkedIn Tango',        color:'#F78166', desc:'Sun & Moon constraint puzzle\nCSP backtracking solver' },
]

function CardGrid({ cards, onSelect }) {
  return (
    <div style={{
      display:'grid',
      gridTemplateColumns:'repeat(auto-fill,minmax(230px,1fr))',
      gap:14, width:'100%', maxWidth:1000,
    }}>
      {cards.map(c=>(
        <div key={c.id} className="module-card"
          style={{'--card-color':c.color}}
          onClick={()=>onSelect(c.id)}>
          <div className="mc-icon">{c.icon}</div>
          <div className="mc-title" style={{color:c.color}}>{c.title}</div>
          <div className="mc-desc">{c.desc}</div>
          <div className="mc-bar" style={{background:c.color}}/>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard({ onSelect }) {
  return (
    <div className="dash">
      <div className="dash-header">
        <div className="dash-badge">Classical AI · Symbolic Reasoning · Puzzle Games</div>
        <h1 className="dash-title">AI Problem Solver Suite</h1>
        <p className="dash-sub">
          11 interactive modules covering Search, Heuristics, Adversarial AI,
          Constraint Satisfaction, Scheduling, and classic Logic Puzzles.
        </p>
      </div>

      {/* AI Algorithm modules */}
      <div style={{width:'100%',maxWidth:1000}}>
        <p style={{fontSize:11,fontWeight:700,color:'var(--txt3)',
          letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>
          AI Algorithms
        </p>
        <CardGrid cards={AI_CARDS} onSelect={onSelect}/>
      </div>

      {/* Puzzle Games */}
      <div style={{width:'100%',maxWidth:1000}}>
        <p style={{fontSize:11,fontWeight:700,color:'var(--txt3)',
          letterSpacing:2,textTransform:'uppercase',marginBottom:12}}>
          Puzzle Games
        </p>
        <CardGrid cards={PUZZLE_CARDS} onSelect={onSelect}/>
      </div>

      <p style={{color:'var(--txt3)',fontSize:10,fontFamily:'var(--mono)'}}>
        AI Problem Solver Suite v1.0 · React + Vite · 11 modules
      </p>
    </div>
  )
}
