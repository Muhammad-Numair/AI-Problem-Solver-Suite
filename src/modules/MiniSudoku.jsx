import { useState, useEffect, useCallback } from 'react'
import { SIZE, BOX_H, BOX_W, PUZZLES, solveSudoku, getErrors, isSolved } from '../algorithms/sudokuAlgo.js'
import StatCard from '../components/StatCard.jsx'

const CELL = 58   // pixel size per cell

const BOX_BORDER = '2px solid #58A6FF44'
const THIN_BORDER = '1px solid #30363D'

function borderStyle(r, c) {
  const top    = r===0 ? '2px solid #484F58' : r%BOX_H===0 ? BOX_BORDER : THIN_BORDER
  const left   = c===0 ? '2px solid #484F58' : c%BOX_W===0 ? BOX_BORDER : THIN_BORDER
  const bottom = r===SIZE-1 ? '2px solid #484F58' : THIN_BORDER
  const right  = c===SIZE-1 ? '2px solid #484F58' : THIN_BORDER
  return { borderTop:top, borderLeft:left, borderBottom:bottom, borderRight:right }
}

export default function MiniSudoku({ onStatus }) {
  const [difficulty, setDiff]    = useState('Easy')
  const [grid,       setGrid]    = useState(()=>PUZZLES.Easy.map(r=>[...r]))
  const [given,      setGiven]   = useState(()=>PUZZLES.Easy.map(r=>r.map(v=>v!==0)))
  const [selected,   setSelected]= useState(null)
  const [errors,     setErrors]  = useState(new Set())
  const [solved,     setSolved]  = useState(false)
  const [msg,        setMsg]     = useState('Click a cell and type a number (1–6).')
  const [stats,      setStats]   = useState(null)

  const loadPuzzle = useCallback((diff)=>{
    const p = PUZZLES[diff]
    setGrid(p.map(r=>[...r]))
    setGiven(p.map(r=>r.map(v=>v!==0)))
    setSelected(null); setErrors(new Set()); setSolved(false); setStats(null)
    setMsg(`${diff} puzzle loaded. Fill in the empty cells (1–6).`)
    onStatus(`Mini Sudoku: ${diff} puzzle loaded.`)
  },[onStatus])

  useEffect(()=>{ loadPuzzle('Easy') },[])

  const selectCell = (r,c)=>{
    if(given[r][c]) return
    setSelected([r,c])
  }

  const handleKey = (e)=>{
    if(!selected) return
    const [r,c] = selected
    if(given[r][c]) return
    const num = parseInt(e.key)
    if(num>=1 && num<=6){
      const ng = grid.map(row=>[...row]); ng[r][c]=num; setGrid(ng)
      const errs = getErrors(ng.map(row=>[...row])); setErrors(errs)
      if(isSolved(ng.map(row=>[...row]))){ setSolved(true); setMsg('🎉 Puzzle solved!'); onStatus('Mini Sudoku solved!') }
    } else if(e.key==='Backspace'||e.key==='Delete'||e.key==='0'){
      const ng = grid.map(row=>[...row]); ng[r][c]=0; setGrid(ng)
      setErrors(getErrors(ng.map(row=>[...row])))
    } else if(e.key==='ArrowRight') setSelected([r,Math.min(c+1,SIZE-1)])
    else if(e.key==='ArrowLeft')  setSelected([r,Math.max(c-1,0)])
    else if(e.key==='ArrowDown')  setSelected([Math.min(r+1,SIZE-1),c])
    else if(e.key==='ArrowUp')    setSelected([Math.max(r-1,0),c])
  }

  const solvePuzzle = ()=>{
    const t0=performance.now()
    const sol = solveSudoku(grid.map(r=>[...r]))
    const ms=(performance.now()-t0).toFixed(1)
    if(!sol){ setMsg('No solution — check for errors.'); return }
    setGrid(sol); setErrors(new Set()); setSolved(true)
    setStats({ms})
    setMsg(`✅ Solved in ${ms}ms!`); onStatus('Sudoku solved by AI.')
  }

  const checkPuzzle = ()=>{
    const errs = getErrors(grid.map(r=>[...r]))
    setErrors(errs)
    if(errs.size===0 && isSolved(grid)) { setSolved(true); setMsg('✅ Correct!') }
    else if(errs.size===0) setMsg('No errors so far — keep going!')
    else setMsg(`${errs.size} error(s) found — highlighted in red.`)
  }

  const clearUserInput = ()=>{
    const p=PUZZLES[difficulty]
    setGrid(p.map(r=>[...r])); setErrors(new Set()); setSolved(false)
    setSelected(null); setMsg('Cleared. Start again!')
  }

  const filled = grid.flat().filter(Boolean).length
  const total  = SIZE*SIZE

  return (
    <div className="module" onKeyDown={handleKey} tabIndex={0}
      style={{outline:'none'}}>

      {/* Board */}
      <div className="module-viz" style={{alignItems:'center',justifyContent:'center',gap:14}}>
        <div style={{position:'relative',display:'inline-block'}}>
          <div style={{
            display:'grid', gridTemplateColumns:`repeat(${SIZE},${CELL}px)`,
            boxShadow:'0 0 20px #0006',
          }}>
            {grid.map((row,r)=>row.map((val,c)=>{
              const isSelected = selected?.[0]===r && selected?.[1]===c
              const isGiven    = given[r][c]
              const isError    = errors.has(`${r},${c}`)
              const sameNum    = val && selected && grid[selected[0]][selected[1]]===val
              const sameRow    = selected?.[0]===r
              const sameCol    = selected?.[1]===c
              const sameBox    = selected && Math.floor(r/BOX_H)===Math.floor(selected[0]/BOX_H)
                                          && Math.floor(c/BOX_W)===Math.floor(selected[1]/BOX_W)

              let bg = '#1C2128'
              if(isError) bg='#3d1a1a'
              else if(isSelected) bg='#1F3A5F'
              else if(sameNum) bg='#1F3A5F88'
              else if(sameRow||sameCol||sameBox) bg='#21262D'

              return (
                <div key={`${r}-${c}`}
                  onClick={()=>selectCell(r,c)}
                  style={{
                    width:CELL,height:CELL,
                    background:bg,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    cursor:isGiven?'default':'pointer',
                    fontSize:24, fontWeight:isGiven?700:500,
                    color:isError?'#F78166':isGiven?'#E6EDF3':solved?'#3FB950':'#58A6FF',
                    ...borderStyle(r,c),
                    transition:'background .1s',
                    userSelect:'none',
                  }}>
                  {val||''}
                </div>
              )
            }))}
          </div>

          {/* Progress bar */}
          <div style={{marginTop:8,height:4,background:'var(--border)',borderRadius:2}}>
            <div style={{height:'100%',background:solved?'#3FB950':'#58A6FF',
              width:`${filled/total*100}%`,borderRadius:2,transition:'width .3s'}}/>
          </div>
        </div>

        {/* Number pad */}
        <div style={{display:'flex',gap:6}}>
          {[1,2,3,4,5,6].map(n=>(
            <button key={n} className="btn"
              style={{width:42,height:42,fontSize:18,fontWeight:700,
                color:'#58A6FF',padding:0,justifyContent:'center'}}
              onClick={()=>{
                if(!selected)return
                const [r,c]=selected; if(given[r][c])return
                const ng=grid.map(row=>[...row]); ng[r][c]=n; setGrid(ng)
                setErrors(getErrors(ng.map(row=>[...row])))
                if(isSolved(ng.map(row=>[...row]))){ setSolved(true); setMsg('🎉 Solved!') }
              }}>{n}</button>
          ))}
          <button className="btn" style={{width:42,height:42,padding:0,justifyContent:'center'}}
            onClick={()=>{
              if(!selected)return
              const[r,c]=selected;if(given[r][c])return
              const ng=grid.map(row=>[...row]);ng[r][c]=0;setGrid(ng)
              setErrors(getErrors(ng.map(row=>[...row])))
            }}>✕</button>
        </div>

        <div style={{textAlign:'center',color:solved?'#3FB950':errors.size?'#F78166':'var(--txt2)',fontWeight:600}}>
          {msg}
        </div>
        <div className="muted">{filled}/{total} cells filled</div>

        {stats && (
          <div className="stat-row">
            <StatCard label="Solve Time" value={`${stats.ms}ms`} color="#3FB950"/>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="module-ctrl">
        <h3 style={{color:'#3FB950',fontWeight:700,fontSize:16}}>🔢 Mini Sudoku  (6×6)</h3>
        <p className="muted">Fill each row, column and 2×3 box<br/>with numbers 1–6.</p>

        <div className="grp"><div className="grp-title">Difficulty</div>
          <div style={{display:'flex',gap:6}}>
            {['Easy','Medium','Hard'].map(d=>(
              <button key={d} className={`btn btn-sm${difficulty===d?' btn-primary':''}`}
                onClick={()=>{ setDiff(d); loadPuzzle(d) }}>{d}</button>
            ))}
          </div>
        </div>

        <div className="grp"><div className="grp-title">How to Play</div>
          <div className="flex-col muted" style={{gap:3,fontSize:11,lineHeight:1.6}}>
            <span>• Click a cell, then type 1–6</span>
            <span>• Or use the number buttons below the board</span>
            <span>• Arrow keys move the selection</span>
            <span>• Blue thick lines = 2×3 box borders</span>
            <span>• Red cells = rule violations</span>
          </div>
        </div>

        <button className="btn btn-block" onClick={checkPuzzle}>✓ Check Puzzle</button>
        <button className="btn btn-primary btn-block" onClick={solvePuzzle} disabled={solved}>🤖 AI Solve</button>
        <button className="btn btn-block" onClick={clearUserInput}>↺ Clear Answers</button>
        <button className="btn btn-block" onClick={()=>loadPuzzle(difficulty)}>⟳ New Puzzle</button>
      </div>
    </div>
  )
}
