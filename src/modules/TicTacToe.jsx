import { useState, useEffect, useRef } from 'react'
import { checkWinner, isDraw, aiMove } from '../algorithms/gameAI.js'

const EMPTY = Array(9).fill('')

export default function TicTacToe({ onStatus }) {
  const [board,      setBoard]   = useState([...EMPTY])
  const [current,    setCurrent] = useState('X')
  const [gameOver,   setOver]    = useState(false)
  const [winner,     setWinner]  = useState(null)   // {winner,line} | 'draw' | null
  const [difficulty, setDiff]    = useState('Impossible')
  const [useAB,      setUseAB]   = useState(true)
  const [score,      setScore]   = useState({ X:0, O:0, D:0 })
  const [aiThink,    setAIThink] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const checkEnd = (b) => {
    const w = checkWinner(b)
    if(w) {
      setWinner(w); setOver(true)
      setScore(s => ({...s, [w.winner]: s[w.winner]+1}))
      onStatus(w.winner==='X' ? '🎉 You win!' : '🤖 AI wins!')
      return true
    }
    if(isDraw(b)) {
      setWinner('draw'); setOver(true)
      setScore(s => ({...s, D: s.D+1}))
      onStatus("🤝 It's a draw!")
      return true
    }
    return false
  }

  const humanClick = (idx) => {
    if(gameOver || board[idx] !== '' || current !== 'X' || aiThink) return
    const nb = [...board]; nb[idx] = 'X'
    setBoard(nb)
    if(!checkEnd(nb)) {
      setCurrent('O'); setAIThink(true)
      timerRef.current = setTimeout(() => doAI(nb), 400)
    }
  }

  const doAI = (b) => {
    const move = aiMove(b, difficulty, useAB, 'O', 'X')
    if(move < 0) { setAIThink(false); return }
    const nb = [...b]; nb[move] = 'O'
    setBoard(nb); setAIThink(false)
    if(!checkEnd(nb)) setCurrent('X')
  }

  const reset = () => {
    clearTimeout(timerRef.current)
    setBoard([...EMPTY]); setCurrent('X'); setOver(false)
    setWinner(null); setAIThink(false)
    onStatus('New game started.')
  }

  const winLine = winner && winner !== 'draw' ? winner.line : []

  const statusText = () => {
    if(aiThink)            return '🤖 AI is thinking…'
    if(!winner)            return current==='X' ? 'Your turn  (X)' : 'AI turn  (O)'
    if(winner==='draw')    return "🤝  It's a draw!"
    return winner.winner==='X' ? '🎉  You win!' : '🤖  AI wins!'
  }

  const statusColor = () => {
    if(!winner) return '#E6EDF3'
    if(winner==='draw') return '#E3B341'
    return winner.winner==='X' ? '#3FB950' : '#F78166'
  }

  return (
    <div className="module">
      {/* ── Board ── */}
      <div className="module-viz" style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24}}>

        {/* Status */}
        <div style={{fontSize:16,fontWeight:700,color:statusColor(),minHeight:28,textAlign:'center'}}>
          {statusText()}
        </div>

        {/* 3×3 grid — uses .ttt-board from CSS (explicit size) */}
        <div className="ttt-board">
          {board.map((v, i) => (
            <div key={i}
              className={[
                'ttt-cell',
                v ? 'taken' : '',
                v==='X' ? 'x' : '',
                v==='O' ? 'o' : '',
                winLine.includes(i) ? 'win' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => humanClick(i)}
            >
              {v}
            </div>
          ))}
        </div>

        {/* Scoreboard */}
        <div style={{display:'flex',gap:32,textAlign:'center'}}>
          {[
            {label:'You (X)', val:score.X, color:'#3FB950'},
            {label:'Draws',   val:score.D, color:'#E3B341'},
            {label:'AI  (O)', val:score.O, color:'#F78166'},
          ].map(({label,val,color}) => (
            <div key={label}>
              <div style={{fontSize:28,fontWeight:900,color}}>{val}</div>
              <div className="muted">{label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* ── Controls ── */}
      <div className="module-ctrl">
        <h3 style={{color:'#F78166',fontWeight:700,fontSize:16}}>❌ Tic-Tac-Toe AI</h3>

        <div className="grp"><div className="grp-title">AI Settings</div>
          <div className="flex-col">
            <div className="field"><label>Difficulty</label>
              <select value={difficulty} onChange={e => setDiff(e.target.value)}>
                <option>Easy</option><option>Medium</option><option>Impossible</option>
              </select>
            </div>
            <div className="field"><label>Algorithm</label>
              <select value={useAB ? 'Alpha-Beta Pruning' : 'Minimax'}
                onChange={e => setUseAB(e.target.value === 'Alpha-Beta Pruning')}>
                <option>Alpha-Beta Pruning</option>
                <option>Minimax</option>
              </select>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-block" style={{marginTop:4}} onClick={reset}>
          ⟳  New Game
        </button>

        <div className="grp"><div className="grp-title">How to Play</div>
          <div className="flex-col muted" style={{gap:4,fontSize:11,lineHeight:1.6}}>
            <span>You are <b style={{color:'#F78166'}}>✕</b>, AI is <b style={{color:'#58A6FF'}}>○</b></span>
            <span>Click any empty cell to play.</span>
            <span><b>Impossible</b> — full game tree search, never loses.</span>
            <span><b>Medium</b> — 50% random moves.</span>
            <span><b>Easy</b> — fully random AI.</span>
          </div>
        </div>

        <div className="grp"><div className="grp-title">Current Settings</div>
          <div className="flex-col" style={{gap:6}}>
            <div className="row">
              <span className="muted">Algorithm:</span>
              <span style={{color:'#F78166',fontWeight:700}}>{useAB ? 'α-β Pruning' : 'Minimax'}</span>
            </div>
            <div className="row">
              <span className="muted">Difficulty:</span>
              <span style={{color:'#E3B341',fontWeight:700}}>{difficulty}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
