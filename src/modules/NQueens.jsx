import { useState, useRef, useEffect } from 'react'
import {
  findFirstSolution, findAllSolutions,
  getBacktrackSteps, getAttackedCells, isSafe, SOLUTION_COUNTS
} from '../algorithms/nQueensAlgo.js'
import StatCard from '../components/StatCard.jsx'

const STEP_COLORS = { place:'#3FB950', fail:'#F7816633', backtrack:'#E3B34144', solution:'#E3B341' }

function Board({ n, queens, attacked, animStep }) {
  const cellPx = Math.max(36, Math.min(72, Math.floor(500 / n)))
  const qFontSz = Math.floor(cellPx * 0.58)

  return (
    <div style={{
      display:'grid', gridTemplateColumns:`repeat(${n},${cellPx}px)`,
      border:'2px solid var(--border)', borderRadius:6, overflow:'hidden',
      boxShadow:'0 0 24px #0006', flexShrink:0,
    }}>
      {Array.from({length:n*n}, (_,i)=>{
        const r=i/n|0, c=i%n
        const light   = (r+c)%2===0
        const hasQ    = queens[r]===c
        const atk     = !hasQ && attacked.has(`${r},${c}`)
        const isTrying= animStep?.row===r && animStep?.col===c
        const isSol   = animStep?.type==='solution'

        let bg = light ? '#1e2a38' : '#0d1117'
        if(isTrying) bg = STEP_COLORS[animStep?.type] ?? bg
        else if(atk) bg = '#F7816618'

        return (
          <div key={i} style={{
            width:cellPx, height:cellPx, background:bg,
            display:'flex', alignItems:'center', justifyContent:'center',
            borderRight: c<n-1?'1px solid #21262D':'none',
            borderBottom: r<n-1?'1px solid #21262D':'none',
            fontSize:qFontSz, lineHeight:1, userSelect:'none',
            transition:'background .08s',
          }}>
            {hasQ && <span style={{
              color: isSol ? '#E3B341' : atk ? '#F78166' : '#E6EDF3',
              textShadow:`0 0 8px currentColor`,
              animation: isSol ? 'pulse 0.4s ease' : 'none',
            }}>♛</span>}
          </div>
        )
      })}
    </div>
  )
}

export default function NQueens({ onStatus }) {
  const [n,         setN]         = useState(8)
  const [queens,    setQueens]    = useState(Array(8).fill(-1))
  const [animStep,  setAnimStep]  = useState(null)
  const [animating, setAnimating] = useState(false)
  const [stats,     setStats]     = useState(null)
  const [msg,       setMsg]       = useState('Click cells to place queens, or use the buttons below.')
  const [solIdx,    setSolIdx]    = useState(0)
  const [allSols,   setAllSols]   = useState(null)

  const timerRef = useRef(null)
  const stepsRef = useRef([])
  const stepIdx  = useRef(0)

  useEffect(()=>()=>clearInterval(timerRef.current),[])

  const attacked = getAttackedCells(queens, n)

  const changeN = (newN) => {
    clearInterval(timerRef.current); setAnimating(false)
    setN(newN); setQueens(Array(newN).fill(-1))
    setAnimStep(null); setStats(null); setAllSols(null); setSolIdx(0)
    setMsg(`${newN}×${newN} board. Known solutions: ${SOLUTION_COUNTS[newN]??'?'}`)
    onStatus(`N-Queens: N=${newN}`)
  }

  const handleCellClick = (r, c) => {
    if(animating) return
    const q = [...queens]
    q[r] = q[r]===c ? -1 : c     // toggle
    setQueens(q)
    const placed = q.filter(x=>x>=0).length
    if(placed===n) {
      const atk = getAttackedCells(q,n)
      const safe = q.every((col,row)=>col>=0 && !atk.has(`${row},${col}`) && isSafe(q.slice(0,row),row,col))
      setMsg(safe ? '✅ Valid solution!' : '⚠ Queens are attacking each other.')
    } else setMsg(`${placed} / ${n} queens placed.`)
  }

  const solveFirst = () => {
    clearInterval(timerRef.current); setAnimating(false)
    const sol = findFirstSolution(n)
    if(!sol){ setMsg('No solution (unexpected).'); return }
    setQueens(sol); setAnimStep(null)
    setStats({found:1, steps:'—', time:'—'})
    setMsg(`✅ Solution found for N=${n}!`)
    onStatus(`N-Queens N=${n} solved.`)
  }

  const solveAll = () => {
    clearInterval(timerRef.current); setAnimating(false)
    const t0=performance.now()
    const sols = findAllSolutions(n)
    const ms=(performance.now()-t0).toFixed(1)
    setAllSols(sols); setSolIdx(0)
    if(sols.length){ setQueens(sols[0]) }
    setStats({found:sols.length, steps:'—', time:ms})
    setMsg(`Found ${sols.length} solutions in ${ms}ms. Use ← → to browse.`)
    onStatus(`N-Queens N=${n}: ${sols.length} solutions.`)
  }

  const browseSol = (dir) => {
    if(!allSols?.length) return
    const idx = (solIdx+dir+allSols.length)%allSols.length
    setSolIdx(idx); setQueens(allSols[idx])
    setMsg(`Solution ${idx+1} of ${allSols.length}`)
  }

  const animateBT = () => {
    clearInterval(timerRef.current)
    if(n>10){ setMsg('Animation capped at N≤10 to keep it smooth.'); return }
    const steps = getBacktrackSteps(n)
    stepsRef.current = steps; stepIdx.current = 0
    setQueens(Array(n).fill(-1)); setAnimStep(null); setAnimating(true)
    setMsg(`Animating ${steps.length} backtracking steps…`)

    timerRef.current = setInterval(()=>{
      if(stepIdx.current >= stepsRef.current.length){
        clearInterval(timerRef.current); setAnimating(false)
        setMsg('✅ Backtracking animation complete.')
        onStatus(`N-Queens backtracking done (${stepsRef.current.length} steps).`)
        return
      }
      const step = stepsRef.current[stepIdx.current++]
      setQueens([...step.queens])
      setAnimStep(step)
      setStats(s=>({...s, steps:stepIdx.current}))
    }, Math.max(30, 400/n))
  }

  const reset = () => {
    clearInterval(timerRef.current); setAnimating(false)
    setQueens(Array(n).fill(-1)); setAnimStep(null)
    setStats(null); setAllSols(null); setSolIdx(0)
    setMsg('Board reset. Click cells to place queens.')
  }

  const placedCount = queens.filter(x=>x>=0).length
  const hasConflict = placedCount>0 && queens.some((col,row)=>col>=0&&attacked.has(`${row},${col}`))

  return (
    <div className="module">
      {/* Board */}
      <div className="module-viz" style={{alignItems:'center',justifyContent:'center',gap:14}}>
        <Board n={n} queens={queens} attacked={attacked} animStep={animStep}/>

        {stats && (
          <div className="stat-row">
            {stats.found!==undefined && <StatCard label="Solutions" value={stats.found} color="#E3B341"/>}
            {stats.steps!=='—'       && <StatCard label="BT Steps"  value={stats.steps} color="#BC8CFF"/>}
            {stats.time!=='—'        && <StatCard label="Time(ms)"  value={stats.time}  color="#39D0D8"/>}
          </div>
        )}

        <div style={{textAlign:'center',maxWidth:480}}>
          <div style={{
            fontSize:13, fontWeight:600,
            color: hasConflict?'#F78166' : placedCount===n?'#3FB950' : 'var(--txt2)',
            minHeight:22,
          }}>{msg}</div>

          {allSols && allSols.length>1 && (
            <div style={{display:'flex',gap:8,justifyContent:'center',marginTop:8}}>
              <button className="btn btn-sm" onClick={()=>browseSol(-1)}>← Prev</button>
              <span className="muted">{solIdx+1} / {allSols.length}</span>
              <button className="btn btn-sm" onClick={()=>browseSol(1)}>Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="module-ctrl">
        <h3 style={{color:'#E3B341',fontWeight:700,fontSize:16}}>♛ N-Queens</h3>
        <p className="muted">Place N queens so none attack each other.<br/>Or watch backtracking solve it.</p>

        <div className="grp"><div className="grp-title">Board Size (N)</div>
          <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
            {[4,5,6,7,8,9,10,12].map(v=>(
              <button key={v} className={`btn btn-sm${n===v?' btn-primary':''}`}
                onClick={()=>changeN(v)}>{v}</button>
            ))}
          </div>
          <div className="muted" style={{marginTop:6,fontSize:11}}>
            Known solutions: <strong style={{color:'#E3B341'}}>{SOLUTION_COUNTS[n]??'computationally large'}</strong>
          </div>
        </div>

        <div className="grp"><div className="grp-title">Legend</div>
          <div className="flex-col" style={{gap:3}}>
            {[['♛','#E6EDF3','Safe queen'],['♛','#F78166','Attacking queen'],['','#F7816618','Attacked cell'],['','#3FB95044','Backtrack: place'],['','#F7816633','Backtrack: fail']].map(([sym,col,lbl])=>(
              <div key={lbl} className="row" style={{gap:8}}>
                <span style={{width:22,height:22,background:col,borderRadius:3,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0}}>{sym}</span>
                <span className="muted">{lbl}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-block" onClick={solveFirst} disabled={animating}>⚡ Find First Solution</button>
        <button className="btn btn-block" onClick={solveAll}   disabled={animating || n>11}>🔍 Find All Solutions {n>11?'(N≤11)':''}</button>
        <button className="btn btn-primary btn-block" onClick={animateBT} disabled={animating || n>10}>
          {animating?'Animating…':'▶ Animate Backtracking'}
        </button>
        <button className="btn btn-block" onClick={reset} disabled={animating&&!allSols}>↺ Reset Board</button>
      </div>
    </div>
  )
}
