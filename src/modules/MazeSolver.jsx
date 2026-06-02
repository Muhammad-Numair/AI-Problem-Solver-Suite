import { useState, useRef, useEffect, useCallback } from 'react'
import { generateMaze, solveMaze } from '../algorithms/mazeAlgo.js'
import StatCard from '../components/StatCard.jsx'

const COLORS = {
  0:'#161B22', 1:'#21262D', 2:'#3FB950', 3:'#E3B341',
  visited:'#1A3A5C', path:'#F78166',
}

export default function MazeSolver({ onStatus }) {
  const [algo,    setAlgo]    = useState('BFS')
  const [heur,    setHeur]    = useState('Manhattan')
  const [size,    setSize]    = useState(21)
  const [speed,   setSpeed]   = useState(60)
  const [animating, setAnimating] = useState(false)
  const [stats,   setStats]   = useState(null)
  const [progress, setProgress] = useState('')

  const canvasRef   = useRef(null)
  const mazeRef     = useRef(null)
  const visitedRef  = useRef(new Set())
  const pathRef     = useRef(new Set())
  const timerRef    = useRef(null)
  const seqRef      = useRef([])
  const pathSeqRef  = useRef([])
  const idxRef      = useRef(0)
  const pendingStats = useRef(null)

  // ── Draw ──────────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if(!canvas || !mazeRef.current) return
    const { grid, rows, cols } = mazeRef.current
    const ctx = canvas.getContext('2d')
    const cw = canvas.width  / cols
    const ch = canvas.height / rows

    for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
      const key=`${r},${c}`, v=grid[r][c]
      if(pathRef.current.has(key))        ctx.fillStyle=COLORS.path
      else if(visitedRef.current.has(key)&&v!==2&&v!==3&&v!==1) ctx.fillStyle=COLORS.visited
      else ctx.fillStyle=COLORS[v]??'#161B22'
      ctx.fillRect(Math.floor(c*cw), Math.floor(r*ch), Math.ceil(cw)+1, Math.ceil(ch)+1)
    }
  }, [])

  // ── Resize canvas to parent ───────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current
    if(!el) return
    const resize = () => {
      el.width  = el.offsetWidth  || 500
      el.height = el.offsetHeight || 500
      draw()
    }
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    resize()
    return () => ro.disconnect()
  }, [draw])

  // ── New maze ──────────────────────────────────────────────────────────────
  const newMaze = useCallback(() => {
    clearInterval(timerRef.current)
    setAnimating(false)
    setStats(null)
    setProgress('')
    visitedRef.current = new Set()
    pathRef.current    = new Set()
    const s = size%2===0?size+1:size
    mazeRef.current = generateMaze(s, s)
    requestAnimationFrame(draw)
    onStatus(`New ${s}×${s} maze generated.`)
  }, [size, draw, onStatus])

  useEffect(() => { newMaze() }, [])   // initial maze

  // ── Solve ─────────────────────────────────────────────────────────────────
  const solve = () => {
    if(!mazeRef.current || animating) return
    clearInterval(timerRef.current)
    visitedRef.current = new Set()
    pathRef.current    = new Set()
    setStats(null)
    setProgress('Computing…')

    const result = solveMaze(mazeRef.current, algo, heur)
    seqRef.current   = result.visited
    pathSeqRef.current = result.path
    idxRef.current   = 0
    pendingStats.current = result

    setAnimating(true)
    const delay = Math.max(1, 110 - speed)
    timerRef.current = setInterval(() => {
      const batch = Math.max(1, Math.floor(speed/20))
      for(let b=0;b<batch;b++){
        if(idxRef.current < seqRef.current.length){
          const [r,c] = seqRef.current[idxRef.current++]
          visitedRef.current.add(`${r},${c}`)
        }
      }
      setProgress(`Animating… ${idxRef.current} / ${seqRef.current.length}`)
      draw()
      if(idxRef.current >= seqRef.current.length){
        clearInterval(timerRef.current)
        // Show path
        pathSeqRef.current.forEach(([r,c]) => pathRef.current.add(`${r},${c}`))
        draw()
        // Reveal stats only NOW
        const ps = pendingStats.current
        setStats({ nodes:ps.nodes, path:ps.path.length||'None', ms:ps.ms.toFixed(2) })
        setAnimating(false)
        setProgress('✅ Done')
        const msg = ps.path.length
          ? `Path found! Length=${ps.path.length}, Nodes=${ps.nodes}, Time=${ps.ms.toFixed(2)}ms`
          : `No path found. Explored ${ps.nodes} nodes.`
        onStatus(msg)
      }
    }, delay)
  }

  const reset = () => {
    clearInterval(timerRef.current)
    setAnimating(false); setStats(null); setProgress('')
    visitedRef.current=new Set(); pathRef.current=new Set()
    draw()
  }

  return (
    <div className="module">
      <div className="module-viz">
        <div className="canvas-wrap" style={{flex:1,minHeight:0}}>
          <canvas ref={canvasRef} style={{width:'100%',height:'100%',borderRadius:8,border:'1px solid var(--border)'}} />
        </div>
        {stats && (
          <div className="stat-row" style={{marginTop:10}}>
            <StatCard label="Nodes Explored" value={stats.nodes} color="#58A6FF" />
            <StatCard label="Path Length"    value={stats.path}  color="#3FB950" />
            <StatCard label="Time (ms)"      value={stats.ms}    color="#E3B341" />
          </div>
        )}
        <div className="progress-lbl" style={{marginTop:6}}>{progress}</div>
      </div>

      <div className="module-ctrl">
        <h3 style={{color:'#58A6FF',fontWeight:700,fontSize:16}}>🌀 Maze Solver</h3>

        <div className="grp"><div className="grp-title">Algorithm</div>
          <div className="flex-col">
            <div className="field"><label>Algorithm</label>
              <select value={algo} onChange={e=>setAlgo(e.target.value)}>
                {['BFS','DFS','A*','Greedy Best-First'].map(a=><option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="field"><label>Heuristic (A* / Greedy)</label>
              <select value={heur} onChange={e=>setHeur(e.target.value)}>
                <option>Manhattan</option><option>Euclidean</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grp"><div className="grp-title">Maze Size (odd)</div>
          <div className="row">
            <label>Size:</label>
            <input type="number" min={11} max={51} step={2} value={size}
              onChange={e=>setSize(Number(e.target.value))}
              style={{width:70}} />
          </div>
        </div>

        <div className="grp"><div className="grp-title">Animation Speed</div>
          <input type="range" min={1} max={100} value={speed} onChange={e=>setSpeed(Number(e.target.value))} />
          <div className="muted" style={{textAlign:'center'}}>{speed}%</div>
        </div>

        <button className="btn btn-block" style={{background:'var(--bg-hover)'}} onClick={newMaze}>⟳  New Maze</button>
        <button className="btn btn-primary btn-block" onClick={solve} disabled={animating}>
          {animating?'Animating…':'▶  Solve'}
        </button>
        <button className="btn btn-block" onClick={reset} disabled={animating}>↺  Reset Overlay</button>

        <div className="grp" style={{marginTop:'auto'}}><div className="grp-title">Legend</div>
          <div className="flex-col" style={{gap:4}}>
            {[['#3FB950','Start'],['#E3B341','Goal'],['#1A3A5C','Visited'],['#F78166','Path'],['#21262D','Wall']].map(([c,l])=>(
              <div key={l} className="row"><span style={{width:14,height:14,background:c,borderRadius:3,display:'inline-block'}} /><span className="muted">{l}</span></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
