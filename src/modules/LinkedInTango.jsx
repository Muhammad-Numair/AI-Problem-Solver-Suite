import { useState, useCallback } from 'react'
import { SUN, MOON, SIZE, PUZZLES, solveTango, getViolations } from '../algorithms/tangoAlgo.js'
import StatCard from '../components/StatCard.jsx'

const CELL = 64

const SYM = { [SUN]:'☀️', [MOON]:'🌙', 0:'' }
const HALF = SIZE / 2

// ── Sub-components ─────────────────────────────────────────────────────────────
function CountBadge({ count, symbol, warn }) {
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:2,
      fontSize:11, fontWeight:700,
      color: warn ? '#F78166' : count===HALF ? '#3FB950' : '#8B949E',
    }}>{symbol}{count}</span>
  )
}

function TangoGrid({ grid, given, constraints, violations, onToggle }) {
  const givenSet = new Set(given.map(([r,c])=>`${r},${c}`))

  return (
    <div style={{position:'relative', width:SIZE*CELL, height:SIZE*CELL, flexShrink:0,
      border:'2px solid var(--border)', borderRadius:8, overflow:'hidden' }}>

      {/* Cells */}
      {Array.from({length:SIZE*SIZE}, (_,i)=>{
        const r=i/SIZE|0, c=i%SIZE
        const val     = grid[r][c]
        const isGiven = givenSet.has(`${r},${c}`)
        const isBad   = violations.has(`${r},${c}`)
        const light   = (r+c)%2===0

        let bg = light ? '#1C2128' : '#161B22'
        if(isBad)   bg = '#3d1a1a'
        if(isGiven) bg = light ? '#1e2a38' : '#172032'

        return (
          <div key={i}
            onClick={()=>{ if(!isGiven) onToggle(r,c) }}
            style={{
              position:'absolute', left:c*CELL, top:r*CELL,
              width:CELL, height:CELL,
              background:bg,
              display:'flex', alignItems:'center', justifyContent:'center',
              cursor:isGiven?'default':'pointer',
              fontSize:30, userSelect:'none',
              border:'1px solid #21262D',
              transition:'background .1s',
            }}>
            {val ? SYM[val] : (
              <span style={{fontSize:20,opacity:.15,color:'#fff'}}>+</span>
            )}
            {isGiven && val!==0 && (
              <div style={{position:'absolute',bottom:3,right:4,
                width:5,height:5,borderRadius:'50%',background:'#58A6FF44'}}/>
            )}
          </div>
        )
      })}

      {/* Constraint badges between adjacent cells */}
      {constraints.map((ct,i)=>{
        const {r1,c1,r2,c2,type}=ct
        const horiz = r1===r2
        const bx = horiz ? (c1+1)*CELL-12 : c1*CELL+CELL/2-12
        const by = horiz ? r1*CELL+CELL/2-12 : (r1+1)*CELL-12
        const col = type==='=' ? '#3FB950' : '#F78166'

        return (
          <div key={i} style={{
            position:'absolute', left:bx, top:by,
            width:24, height:24, borderRadius:'50%',
            background:'#0d1117', border:`2px solid ${col}`,
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:10, fontWeight:900, color:col,
            zIndex:10, pointerEvents:'none', boxShadow:`0 0 6px ${col}66`,
          }}>
            {type==='='?'=':'✕'}
          </div>
        )
      })}
    </div>
  )
}

// ── Row / column count strip ───────────────────────────────────────────────────
function RowCounts({ grid }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:0, marginLeft:8}}>
      {grid.map((row,r)=>{
        const sc=row.filter(v=>v===SUN).length, mc=row.filter(v=>v===MOON).length
        return (
          <div key={r} style={{height:CELL,display:'flex',flexDirection:'column',
            alignItems:'flex-start',justifyContent:'center',gap:2, paddingLeft:4}}>
            <CountBadge count={sc} symbol="☀" warn={sc>HALF}/>
            <CountBadge count={mc} symbol="🌙" warn={mc>HALF}/>
          </div>
        )
      })}
    </div>
  )
}

function ColCounts({ grid }) {
  return (
    <div style={{display:'flex', marginTop:6}}>
      {Array.from({length:SIZE},(_,c)=>{
        const sc=grid.map(r=>r[c]).filter(v=>v===SUN).length
        const mc=grid.map(r=>r[c]).filter(v=>v===MOON).length
        return (
          <div key={c} style={{width:CELL,display:'flex',flexDirection:'row',
            justifyContent:'center',gap:6}}>
            <CountBadge count={sc} symbol="☀" warn={sc>HALF}/>
            <CountBadge count={mc} symbol="🌙" warn={mc>HALF}/>
          </div>
        )
      })}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LinkedInTango({ onStatus }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [grid,      setGrid]      = useState(()=>buildGrid(PUZZLES[0]))
  const [msg,       setMsg]       = useState('Click cells to cycle: ☀️ → 🌙 → empty.')
  const [solved,    setSolved]    = useState(false)
  const [stats,     setStats]     = useState(null)

  const puzzle      = PUZZLES[puzzleIdx]
  const violations  = getViolations(grid, puzzle.constraints)
  const filled      = grid.flat().filter(Boolean).length

  function buildGrid(p) {
    const g = Array.from({length:SIZE},()=>Array(SIZE).fill(0))
    for(const [r,c,v] of p.given) g[r][c]=v
    return g
  }

  const loadPuzzle = (idx) => {
    setPuzzleIdx(idx)
    setGrid(buildGrid(PUZZLES[idx]))
    setMsg('Click cells to cycle: ☀️ → 🌙 → empty.')
    setSolved(false); setStats(null)
    onStatus(`Tango: ${PUZZLES[idx].label} loaded.`)
  }

  const toggle = useCallback((r,c) => {
    if(solved) return
    setGrid(g=>{
      const ng = g.map(row=>[...row])
      ng[r][c] = ng[r][c]===0 ? SUN : ng[r][c]===SUN ? MOON : 0
      // Check solved
      if(checkSolved(ng, puzzle)){
        setSolved(true)
        setMsg('🎉 Puzzle solved! Perfect Tango!')
        onStatus(`Tango ${puzzle.label} solved!`)
      } else {
        setMsg('Click cells to cycle: ☀️ → 🌙 → empty.')
      }
      return ng
    })
  },[solved, puzzle, onStatus])

  const aiSolve = () => {
    const t0 = performance.now()
    const sol = solveTango(puzzle)
    const ms  = (performance.now()-t0).toFixed(1)
    if(!sol){ setMsg('❌ No solution found.'); return }
    setGrid(sol); setSolved(true)
    setStats({ ms })
    setMsg(`✅ Solved by AI in ${ms}ms!`)
    onStatus(`Tango ${puzzle.label} AI solved.`)
  }

  const reset = () => {
    setGrid(buildGrid(puzzle)); setSolved(false); setStats(null)
    setMsg('Click cells to cycle: ☀️ → 🌙 → empty.')
  }

  const checkPuzzle = () => {
    if(violations.size===0 && filled===SIZE*SIZE){ setMsg('✅ Correct — no violations!'); setSolved(true) }
    else if(violations.size>0) setMsg(`⚠ ${violations.size} violation(s) highlighted in red.`)
    else setMsg(`Keep going — ${SIZE*SIZE-filled} cells remaining.`)
  }

  return (
    <div className="module">
      {/* Board */}
      <div className="module-viz" style={{alignItems:'center',justifyContent:'center',gap:10}}>
        <div style={{display:'flex',gap:0}}>
          <div style={{display:'flex',flexDirection:'column'}}>
            <TangoGrid
              grid={grid}
              given={puzzle.given}
              constraints={puzzle.constraints}
              violations={violations}
              onToggle={toggle}
            />
            <ColCounts grid={grid}/>
          </div>
          <RowCounts grid={grid}/>
        </div>

        {stats && (
          <div className="stat-row">
            <StatCard label="Solve Time" value={`${stats.ms}ms`} color="#E3B341"/>
          </div>
        )}

        <div style={{textAlign:'center', fontSize:13, fontWeight:600, minHeight:22,
          color: solved?'#3FB950': violations.size>0?'#F78166': 'var(--txt2)'}}>
          {msg}
        </div>

        {/* Constraint legend */}
        <div style={{display:'flex',gap:16,fontSize:11}}>
          <div className="row" style={{gap:6}}>
            <span style={{width:20,height:20,borderRadius:'50%',border:'2px solid #3FB950',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:9,fontWeight:800,color:'#3FB950'}}>
              =
            </span>
            <span className="muted">Same symbol</span>
          </div>
          <div className="row" style={{gap:6}}>
            <span style={{width:20,height:20,borderRadius:'50%',border:'2px solid #F78166',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:9,fontWeight:800,color:'#F78166'}}>
              ✕
            </span>
            <span className="muted">Different symbol</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="module-ctrl">
        <h3 style={{color:'#E3B341',fontWeight:700,fontSize:16}}>🌙 LinkedIn Tango</h3>
        <p className="muted">Place suns ☀️ and moons 🌙<br/>following all the rules.</p>

        <div className="grp"><div className="grp-title">Puzzle</div>
          <div className="flex-col" style={{gap:4}}>
            {PUZZLES.map((p,i)=>(
              <button key={i} className={`btn btn-sm${puzzleIdx===i?' btn-primary':''}`}
                onClick={()=>loadPuzzle(i)}>{p.label}</button>
            ))}
          </div>
        </div>

        <div className="grp"><div className="grp-title">Rules</div>
          <div className="flex-col muted" style={{gap:3,fontSize:11,lineHeight:1.6}}>
            <span>• Each row: exactly 3☀ and 3🌙</span>
            <span>• Each column: exactly 3☀ and 3🌙</span>
            <span>• No 3 consecutive same symbol</span>
            <span>• <span style={{color:'#3FB950'}}>●=●</span> cells must match</span>
            <span>• <span style={{color:'#F78166'}}>●✕●</span> cells must differ</span>
            <span>• Blue dot = given cell (fixed)</span>
            <span>• Red background = rule broken</span>
          </div>
        </div>

        <button className="btn btn-block" onClick={checkPuzzle}>✓ Check</button>
        <button className="btn btn-primary btn-block" onClick={aiSolve} disabled={solved}>🤖 AI Solve</button>
        <button className="btn btn-block" onClick={reset}>↺ Reset</button>
      </div>
    </div>
  )
}

function checkSolved(grid, puzzle) {
  if(grid.flat().some(v=>v===0)) return false
  return getViolations(grid, puzzle.constraints).size === 0
}
