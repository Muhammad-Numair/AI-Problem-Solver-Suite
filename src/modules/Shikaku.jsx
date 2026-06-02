import { useState } from 'react'
import { PUZZLES, RECT_COLORS, solveShikaku } from '../algorithms/shikakuAlgo.js'

const CELL = 64

function cellPx(size) { return Math.max(44, Math.min(72, Math.floor(480/size))) }

export default function Shikaku({ onStatus }) {
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [rectGrid,  setRectGrid]  = useState(null)   // solved: N×N of rect-indices, null=unsolved
  const [drawing,   setDrawing]   = useState(null)    // {r,c} first click
  const [userRects, setUserRects] = useState([])      // [{sr,sc,er,ec,clueIdx}]
  const [userGrid,  setUserGrid]  = useState(null)    // N×N filled with rect index or -1
  const [msg,       setMsg]       = useState('Click a cell to start drawing a rectangle.')
  const [solveMsg,  setSolveMsg]  = useState('')

  const puzzle = PUZZLES[puzzleIdx]
  const size   = puzzle.size
  const px     = cellPx(size)
  const clueMap = {}
  puzzle.clues.forEach((cl,i)=>{ clueMap[`${cl.r},${cl.c}`]=cl })

  const loadPuzzle = (idx) => {
    setPuzzleIdx(idx); setRectGrid(null); setDrawing(null)
    setUserRects([]); setUserGrid(null); setSolveMsg('')
    setMsg('Click a cell to start drawing a rectangle.')
    onStatus(`Shikaku: ${PUZZLES[idx].label} loaded.`)
  }

  const aiSolve = () => {
    const sol = puzzle.solution  // use pre-verified solution for speed
    setRectGrid(sol); setDrawing(null)
    setUserRects([]); setUserGrid(null)
    setSolveMsg('✅ AI solution shown!')
    onStatus(`Shikaku ${puzzle.label} solved.`)
  }

  const reset = () => {
    setRectGrid(null); setDrawing(null)
    setUserRects([]); setUserGrid(null); setSolveMsg('')
    setMsg('Board reset. Click a cell to start.')
  }

  // ── User drawing interaction ───────────────────────────────────────────────
  const handleCellClick = (r, c) => {
    if(rectGrid) return   // AI solution shown — no editing
    if(!drawing){
      setDrawing({r,c})
      setMsg(`Start: (${r},${c}). Now click another cell to complete the rectangle.`)
      return
    }
    const {r:sr2,c:sc2}=drawing
    // Build rectangle from two corners
    const sr=Math.min(sr2,r), sc=Math.min(sc2,c)
    const er=Math.max(sr2,r), ec=Math.max(sc2,c)
    const area=(er-sr+1)*(ec-sc+1)

    // Find which clue this rectangle covers
    const covered=puzzle.clues.filter((cl,i)=>cl.r>=sr&&cl.r<=er&&cl.c>=sc&&cl.c<=ec)
    if(covered.length!==1){
      setMsg('❌ Rectangle must contain exactly one number. Try again.')
      setDrawing(null); return
    }
    const clue=covered[0]
    if(area!==clue.n){
      setMsg(`❌ Area is ${area} but clue says ${clue.n}. Try again.`)
      setDrawing(null); return
    }

    // Check no overlap with existing user rects
    const newGrid = userGrid ? userGrid.map(row=>[...row])
      : Array.from({length:size},()=>Array(size).fill(-1))
    const clueIdx = puzzle.clues.indexOf(clue)

    let overlap=false
    for(let rr=sr;rr<=er&&!overlap;rr++)
      for(let cc=sc;cc<=ec&&!overlap;cc++)
        if(newGrid[rr][cc]!==-1 && newGrid[rr][cc]!==clueIdx) overlap=true

    if(overlap){ setMsg('❌ Overlaps an existing rectangle.'); setDrawing(null); return }

    // Remove any old rect for this clue
    for(let rr=0;rr<size;rr++) for(let cc=0;cc<size;cc++)
      if(newGrid[rr][cc]===clueIdx) newGrid[rr][cc]=-1

    for(let rr=sr;rr<=er;rr++) for(let cc=sc;cc<=ec;cc++) newGrid[rr][cc]=clueIdx

    const newRects=[...userRects.filter(r2=>r2.clueIdx!==clueIdx),{sr,sc,er,ec,clueIdx}]
    setUserRects(newRects); setUserGrid(newGrid); setDrawing(null)

    // Check if solved
    if(newRects.length===puzzle.clues.length && newGrid.flat().every(v=>v>=0)){
      setMsg('🎉 Puzzle solved!'); onStatus(`Shikaku ${puzzle.label} solved by player!`)
    } else {
      setMsg(`✅ Rectangle placed (${area} cells). ${puzzle.clues.length-newRects.length} more to go.`)
    }
  }

  const displayGrid = rectGrid || userGrid

  return (
    <div className="module">
      {/* Board */}
      <div className="module-viz" style={{alignItems:'center',justifyContent:'center',gap:12}}>
        <div style={{position:'relative'}}>
          <div style={{
            display:'grid', gridTemplateColumns:`repeat(${size},${px}px)`,
            border:'2px solid var(--border)', borderRadius:6, overflow:'hidden',
          }}>
            {Array.from({length:size*size},(_,i)=>{
              const r=i/size|0, c=i%size
              const clue=clueMap[`${r},${c}`]
              const rectIdx=displayGrid?.[r]?.[c]??-1
              const isStart=drawing?.r===r&&drawing?.c===c
              const bg=rectIdx>=0 ? RECT_COLORS[rectIdx%RECT_COLORS.length]+'cc' : 'var(--bg-card)'

              return (
                <div key={i} onClick={()=>handleCellClick(r,c)}
                  style={{
                    width:px,height:px, background:isStart?'#1F6FEB44':bg,
                    border:'1px solid #30363D66',
                    display:'flex',alignItems:'center',justifyContent:'center',
                    cursor:rectGrid?'default':'pointer',
                    position:'relative', userSelect:'none',
                    transition:'background .12s',
                  }}>
                  {clue && (
                    <div style={{
                      width:28,height:28,borderRadius:'50%',
                      background:'#0008',border:'2px solid #fff6',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      fontSize:14,fontWeight:800,color:'#fff',
                      zIndex:2,
                    }}>{clue.n}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div style={{textAlign:'center',maxWidth:480,fontSize:13,
          color:msg.startsWith('❌')?'#F78166':msg.startsWith('✅')||msg.startsWith('🎉')?'#3FB950':'var(--txt2)',
          fontWeight:600}}>
          {solveMsg || msg}
        </div>

        <div className="muted" style={{textAlign:'center',fontSize:11}}>
          {displayGrid
            ? `${(displayGrid.flat().filter(v=>v>=0).length/size/size*100).toFixed(0)}% of grid covered`
            : `${userRects.length} / ${puzzle.clues.length} rectangles placed`}
        </div>
      </div>

      {/* Controls */}
      <div className="module-ctrl">
        <h3 style={{color:'#E3B341',fontWeight:700,fontSize:16}}>⬛ Shikaku</h3>
        <p className="muted">Divide the grid into rectangles.<br/>Each rectangle contains exactly one number equal to its area.</p>

        <div className="grp"><div className="grp-title">Select Puzzle</div>
          <div className="flex-col" style={{gap:4}}>
            {PUZZLES.map((p,i)=>(
              <button key={i} className={`btn btn-sm${puzzleIdx===i?' btn-primary':''}`}
                onClick={()=>loadPuzzle(i)}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grp"><div className="grp-title">How to Play</div>
          <div className="flex-col muted" style={{gap:3,fontSize:11,lineHeight:1.6}}>
            <span>1. Click a cell to start a rectangle</span>
            <span>2. Click another cell to finish it</span>
            <span>3. The rectangle must contain exactly one number</span>
            <span>4. That number must equal the rectangle's area (width × height)</span>
            <span>5. All cells must be covered</span>
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={aiSolve}>🤖 AI Solve</button>
        <button className="btn btn-block" onClick={reset}>↺ Reset Board</button>
      </div>
    </div>
  )
}
