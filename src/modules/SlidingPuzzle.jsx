import { useState, useCallback, useRef, useEffect } from 'react'
import { goalState, shuffle, puzzleNeighbors } from '../algorithms/puzzleAlgo.js'
import StatCard from '../components/StatCard.jsx'

// Worker complexity warnings
const SIZE_WARNINGS = {
  5: '5×5 has 25!/2 ≈ 7.7×10²⁴ states. IDA* will try up to 15 s.',
  6: '6×6 is extremely hard. AI will attempt 15 s with IDA* — may timeout.',
  7: '7×7 is computationally infeasible for optimal solving. AI will try briefly.',
}

export default function SlidingPuzzle({ onStatus }) {
  const [size,      setSize]     = useState(3)
  const [state,     setState]    = useState(() => goalState(3))
  const [heur,      setHeur]     = useState('Manhattan Distance')
  const [moves,     setMoves]    = useState(0)
  const [solved,    setSolved]   = useState(true)
  const [solving,   setSolving]  = useState(false)
  const [stats,     setStats]    = useState(null)
  const [msg,       setMsg]      = useState('Shuffle the puzzle to begin.')
  // Worker progress state
  const [wNodes,    setWNodes]   = useState(0)
  const [wElapsed,  setWElapsed] = useState(0)
  const [wAlgo,     setWAlgo]    = useState('')

  const timerRef  = useRef(null)
  const stepsRef  = useRef([])
  const stepIdx   = useRef(0)
  const workerRef = useRef(null)

  const goal = goalState(size)
  const isSolved = s => s.join(',') === goal.join(',')

  // Kill any running work on unmount
  useEffect(() => () => {
    clearInterval(timerRef.current)
    workerRef.current?.terminate()
  }, [])

  const applySize = useCallback((s) => {
    clearInterval(timerRef.current)
    workerRef.current?.terminate(); workerRef.current = null
    setSolving(false); setStats(null); setWNodes(0); setWElapsed(0)
    const g = goalState(s)
    setState(g); setMoves(0); setSolved(true)
    setMsg(`${s}×${s} puzzle (${s*s-1} tiles). Shuffle to start.`)
    onStatus(`Board resized to ${s}×${s}.`)
  }, [onStatus])

  useEffect(() => { applySize(3) }, [])

  const doShuffle = () => {
    clearInterval(timerRef.current)
    workerRef.current?.terminate(); workerRef.current = null
    setSolving(false); setStats(null); setWNodes(0)
    const m = Math.max(80, size * size * 20)
    setState(shuffle(goal, size, m))
    setMoves(0); setSolved(false)
    setMsg('Shuffled! Click tiles to play, or press AI Solve.')
    onStatus('Puzzle shuffled.')
  }

  const handleTile = (idx) => {
    if(solving) return
    const blank = state.indexOf(0)
    if(!puzzleNeighbors(blank, size).includes(idx)) return
    const ns = [...state]; [ns[blank], ns[idx]] = [ns[idx], ns[blank]]
    setState(ns)
    const m = moves + 1; setMoves(m)
    if(isSolved(ns)) { setSolved(true); setMsg('✅ Solved!'); onStatus('Puzzle solved!') }
  }

  const aiSolve = () => {
    if(solving) return
    if(isSolved(state)) { setMsg('Already solved!'); return }

    // Terminate any previous worker
    workerRef.current?.terminate()

    const heurName = heur === 'Manhattan Distance' ? 'Manhattan Distance' : 'Misplaced Tiles'
    setWNodes(0); setWElapsed(0); setSolving(true)
    setStats(null)

    const algo = size >= 5 ? 'IDA*' : 'A*'
    setWAlgo(algo)
    setMsg(`🤖 ${algo} running in background thread… UI stays responsive.`)

    // Spawn Web Worker
    const worker = new Worker(
      new URL('../workers/puzzleSolver.js', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker

    worker.onmessage = (e) => {
      const d = e.data
      if(d.type === 'start') {
        setWAlgo(d.useIDA ? 'IDA*' : 'A*')
      } else if(d.type === 'progress') {
        setWNodes(d.nodes)
        setWElapsed((d.elapsed/1000).toFixed(1))
      } else if(d.type === 'timeout') {
        setSolving(false)
        worker.terminate(); workerRef.current = null
        setMsg(`⏱ Time limit reached after ${d.nodes.toLocaleString()} nodes. Puzzle too hard for current configuration — try a smaller size or fewer shuffle moves.`)
        onStatus(`AI timeout after ${d.nodes.toLocaleString()} nodes.`)
      } else if(d.type === 'done') {
        const { path, nodes, ms } = d
        worker.terminate(); workerRef.current = null
        if(!path.length) {
          setSolving(false)
          setMsg('No solution found.')
          return
        }
        const numMoves = path.length - 1
        setStats({ moves: numMoves, nodes, ms: ms.toFixed(0), algo: wAlgo || algo })
        stepsRef.current = path; stepIdx.current = 1
        timerRef.current = setInterval(() => {
          if(stepIdx.current >= stepsRef.current.length) {
            clearInterval(timerRef.current); setSolving(false)
            setMsg('✅ AI solved the puzzle!')
            setSolved(true); onStatus(`Solved in ${numMoves} moves.`)
            return
          }
          setState(stepsRef.current[stepIdx.current])
          setMoves(stepIdx.current)
          stepIdx.current++
        }, Math.max(100, 500 - size * 30))
        setMsg(`Playing back solution: ${numMoves} moves…`)
        onStatus(`AI solved in ${numMoves} moves, explored ${nodes.toLocaleString()} nodes.`)
      }
    }

    worker.onerror = (err) => {
      setSolving(false)
      setMsg(`Worker error: ${err.message}`)
    }

    worker.postMessage({ state: [...state], size, heuristic: heurName })
  }

  const stopSolving = () => {
    clearInterval(timerRef.current)
    workerRef.current?.terminate(); workerRef.current = null
    setSolving(false); setMsg('Stopped.')
  }

  const reset = () => {
    clearInterval(timerRef.current)
    workerRef.current?.terminate(); workerRef.current = null
    setSolving(false); setStats(null); setWNodes(0)
    setState(goal); setMoves(0); setSolved(true)
    setMsg('Reset to solved state.')
  }

  // Tile sizing — scales with grid size and viewport
  const tilePx = Math.max(36, Math.min(88, Math.floor(380 / size) - 6))
  const tFontSize = Math.max(11, Math.floor(tilePx / 2.8))

  return (
    <div className="module">
      {/* ── Board area ── */}
      <div className="module-viz" style={{position:'relative'}}>
        <div className="puzzle-area">
          <div style={{
            display:'grid',
            gridTemplateColumns:`repeat(${size}, ${tilePx}px)`,
            gap:6,
          }}>
            {state.map((v, i) => (
              <div key={i}
                className={`tile${v===0?' blank':''}${solved&&v!==0?' solved':''}`}
                style={{
                  width:tilePx, height:tilePx, fontSize:tFontSize,
                  borderRadius:Math.floor(tilePx/8),
                  cursor: v===0||solving ? 'default' : 'pointer',
                  opacity: solving && v!==0 ? .85 : 1,
                }}
                onClick={() => handleTile(i)}
              >{v || ''}</div>
            ))}
          </div>

          {/* Stats */}
          {stats && (
            <div className="stat-row">
              <StatCard label="Moves"     value={stats.moves} color="#BC8CFF" />
              <StatCard label="Nodes"     value={stats.nodes.toLocaleString()} color="#3FB950" />
              <StatCard label="Time (ms)" value={stats.ms}    color="#E3B341" />
              <StatCard label="Algorithm" value={stats.algo}  color="#58A6FF" />
            </div>
          )}

          <div className="muted" style={{textAlign:'center', maxWidth: size*tilePx+6*(size-1)}}>{msg}</div>
        </div>

        {/* ── Solving overlay (main thread stays free!) ── */}
        {solving && stepIdx.current === 0 && (
          <div className="solving-overlay">
            <div className="solving-spinner" />
            <div style={{color:'var(--purple)',fontWeight:700,fontSize:14}}>
              {wAlgo || 'AI'} Solving…
            </div>
            <div style={{color:'var(--txt2)',fontSize:12}}>
              Nodes explored: <strong style={{color:'var(--txt)'}}>{wNodes.toLocaleString()}</strong>
            </div>
            <div style={{color:'var(--txt2)',fontSize:12}}>
              Elapsed: <strong style={{color:'var(--txt)'}}>{wElapsed}s</strong>
            </div>
            <div style={{color:'var(--txt3)',fontSize:10,textAlign:'center',maxWidth:200}}>
              Running in background thread — UI remains fully responsive
            </div>
            <button className="btn btn-danger btn-sm" onClick={stopSolving}>✕ Stop</button>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="module-ctrl">
        <h3 style={{color:'#BC8CFF',fontWeight:700,fontSize:16}}>🧩 Sliding Puzzle</h3>
        <p className="muted">Click adjacent tiles to slide,<br/>or let AI solve it.</p>

        <div className="grp"><div className="grp-title">Puzzle Size</div>
          <select value={size} onChange={e => { const s=Number(e.target.value); setSize(s); applySize(s) }}>
            {[3,4,5,6,7].map(s => (
              <option key={s} value={s}>{s}×{s}  ({s*s-1} tiles)</option>
            ))}
          </select>
          {SIZE_WARNINGS[size] && (
            <div style={{marginTop:6,padding:'6px 8px',background:'#3d2b0022',border:'1px solid #E3B34133',borderRadius:6,fontSize:10,color:'#E3B341',lineHeight:1.5}}>
              ⚠️ {SIZE_WARNINGS[size]}
            </div>
          )}
        </div>

        <div className="grp"><div className="grp-title">AI Heuristic</div>
          <select value={heur} onChange={e => setHeur(e.target.value)}>
            <option>Manhattan Distance</option>
            <option>Misplaced Tiles</option>
          </select>
        </div>

        <div className="grp"><div className="grp-title">Move Counter</div>
          <div style={{fontSize:30,fontWeight:800,color:'#BC8CFF',textAlign:'center',letterSpacing:2}}>{moves}</div>
        </div>

        <button className="btn btn-block" onClick={doShuffle} disabled={solving}>🔀  Shuffle</button>
        <button className="btn btn-primary btn-block" onClick={aiSolve} disabled={solving}>
          🤖  AI Solve {size>=5?`(IDA*)`:`(A*)`}
        </button>
        {solving && (
          <button className="btn btn-danger btn-block" onClick={stopSolving}>✕  Stop</button>
        )}
        <button className="btn btn-block" onClick={reset} disabled={solving&&stepIdx.current===0}>↺  Reset Board</button>

        <div className="grp" style={{fontSize:10,color:'var(--txt3)'}}>
          <div className="grp-title">Why Web Worker?</div>
          <p style={{lineHeight:1.6}}>
            A* runs in a separate thread so the browser never freezes,
            even for hard puzzles. Progress is reported back live.
          </p>
        </div>
      </div>
    </div>
  )
}
