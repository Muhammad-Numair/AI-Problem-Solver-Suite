import { useState } from 'react'
import { analyzeSchedule, getStats, toMin, fromMin, durLabel } from '../algorithms/schedulerAlgo.js'
import StatCard from '../components/StatCard.jsx'

const PRI_COLOR = { Critical:'#F78166', High:'#E3B341', Medium:'#58A6FF', Low:'#8B949E' }
const PRI_BG    = { Critical:'#3d1a1a', High:'#3d2e0a', Medium:'#0e2340', Low:'#1a1e26' }

const DEMO = [
  { name:'Morning Standup',    priority:'High',     startTime:'09:00', endTime:'09:30' },
  { name:'Fix Critical Bug',   priority:'Critical', startTime:'09:00', endTime:'11:30' },  // overlaps standup
  { name:'Code Review',        priority:'Medium',   startTime:'10:00', endTime:'11:00' },  // overlaps bug fix
  { name:'Lunch Break',        priority:'Low',      startTime:'12:00', endTime:'13:00' },
  { name:'Design Meeting',     priority:'High',     startTime:'13:00', endTime:'14:00' },
  { name:'Client Call',        priority:'Critical', startTime:'13:30', endTime:'14:30' },  // overlaps design
  { name:'Unit Testing',       priority:'Medium',   startTime:'14:00', endTime:'16:00' },
  { name:'Performance Review', priority:'High',     startTime:'15:00', endTime:'16:00' },  // overlaps testing
  { name:'Documentation',      priority:'Low',      startTime:'16:00', endTime:'17:30' },
  { name:'Deploy to Staging',  priority:'Critical', startTime:'17:00', endTime:'18:00' },  // overlaps docs
]

// ── Timeline SVG ──────────────────────────────────────────────────────────────
function Timeline({ tasks }) {
  const [hover, setHover] = useState(null)
  if (!tasks.length) return null

  const minT  = Math.min(...tasks.map(t => t.startMin))
  const maxT  = Math.max(...tasks.map(t => t.endMin))
  const span  = maxT - minT || 60
  const lanes = Math.max(...tasks.map(t => t.lane)) + 1

  const SVG_W    = 700
  const PAD_L    = 52   // left margin for time labels
  const PAD_R    = 12
  const LANE_H   = 44
  const BAR_H    = 32
  const AXIS_H   = 26
  const SVG_H    = lanes * LANE_H + AXIS_H + 8

  const toX = min => PAD_L + ((min - minT) / span) * (SVG_W - PAD_L - PAD_R)
  const toY = lane => lane * LANE_H + 4

  // Tick marks every 30 min
  const ticks = []
  const startHour = minT - (minT % 30)
  for (let t = startHour; t <= maxT; t += 30) {
    if (t >= minT) ticks.push(t)
  }

  return (
    <div style={{ overflowX:'auto', borderRadius:8, border:'1px solid var(--border)' }}>
      <svg width={SVG_W} height={SVG_H} style={{ display:'block', background:'var(--bg-card)', borderRadius:8 }}>
        {/* Grid lines */}
        {ticks.map(t => (
          <line key={t} x1={toX(t)} y1={0} x2={toX(t)} y2={SVG_H - AXIS_H}
            stroke="#21262D" strokeWidth={1} />
        ))}

        {/* Task bars */}
        {tasks.map((t, i) => {
          const x = toX(t.startMin)
          const w = Math.max(4, toX(t.endMin) - toX(t.startMin))
          const y = toY(t.lane)
          const hasConflict = t.conflictsWith.length > 0
          const bg = hasConflict ? PRI_BG[t.priority] : PRI_BG[t.priority]
          const stroke = hasConflict ? '#F78166' : PRI_COLOR[t.priority]
          const isHovered = hover === i

          return (
            <g key={i} style={{ cursor:'pointer' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}>
              {/* Bar */}
              <rect x={x} y={y} width={w} height={BAR_H} rx={5}
                fill={bg} stroke={stroke}
                strokeWidth={isHovered ? 2 : hasConflict ? 1.5 : 1}
                opacity={isHovered ? 1 : 0.92} />
              {/* Priority stripe */}
              <rect x={x} y={y} width={4} height={BAR_H} rx={2}
                fill={PRI_COLOR[t.priority]} />
              {/* Task name (clip to bar) */}
              <clipPath id={`clip-${i}`}>
                <rect x={x+6} y={y} width={w-10} height={BAR_H} />
              </clipPath>
              <text x={x+10} y={y + BAR_H/2 + 4} fontSize={11} fontWeight={600}
                fill="#E6EDF3" clipPath={`url(#clip-${i})`}
                style={{ userSelect:'none' }}>
                {t.name}
              </text>
              {/* Conflict badge */}
              {hasConflict && (
                <text x={x + w - 4} y={y + 10} fontSize={9} fill="#F78166"
                  textAnchor="end" fontWeight={700}>⚠</text>
              )}
            </g>
          )
        })}

        {/* Axis */}
        <rect x={0} y={SVG_H - AXIS_H} width={SVG_W} height={AXIS_H} fill="#161B22" />
        <line x1={PAD_L} y1={SVG_H - AXIS_H} x2={SVG_W - PAD_R} y2={SVG_H - AXIS_H}
          stroke="#30363D" strokeWidth={1} />
        {ticks.map(t => (
          <text key={t} x={toX(t)} y={SVG_H - 6} fontSize={9}
            fill="#8B949E" textAnchor="middle" fontFamily="monospace">
            {fromMin(t)}
          </text>
        ))}

        {/* Lane labels */}
        {Array.from({ length: lanes }, (_, l) => (
          <text key={l} x={PAD_L - 4} y={toY(l) + BAR_H/2 + 4}
            fontSize={9} fill="#484F58" textAnchor="end">
            L{l + 1}
          </text>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hover !== null && (
        <div style={{
          padding:'10px 14px', background:'var(--bg-panel)', borderTop:'1px solid var(--border)',
          display:'flex', gap:16, alignItems:'center', flexWrap:'wrap',
        }}>
          <span style={{ fontWeight:700, color: PRI_COLOR[tasks[hover].priority] }}>
            {tasks[hover].name}
          </span>
          <span className="muted">{tasks[hover].startTime} → {tasks[hover].endTime}</span>
          <span style={{ color:'var(--txt2)' }}>{durLabel(tasks[hover].duration)}</span>
          <span className="badge"
            style={{ background: PRI_COLOR[tasks[hover].priority]+'22', color: PRI_COLOR[tasks[hover].priority] }}>
            {tasks[hover].priority}
          </span>
          {tasks[hover].conflictsWith.length > 0 && (
            <span style={{ color:'#F78166', fontSize:11 }}>
              ⚠ Overlaps with: {tasks[hover].conflictsWith.map(j => tasks[j]?.name).join(', ')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TaskScheduler({ onStatus }) {
  const [tasks,     setTasks]   = useState([])
  const [analyzed,  setAnalyzed]= useState([])
  const [name,      setName]    = useState('')
  const [priority,  setPri]     = useState('Medium')
  const [startTime, setStart]   = useState('09:00')
  const [endTime,   setEnd]     = useState('10:00')
  const [stats,     setStats]   = useState(null)

  const addTask = () => {
    if (!name.trim()) return
    if (toMin(endTime) <= toMin(startTime)) {
      onStatus('End time must be after start time.')
      return
    }
    setTasks(ts => [...ts, { name: name.trim(), priority, startTime, endTime }])
    setName('')
  }

  const removeTask = i => {
    setTasks(ts => ts.filter((_, j) => j !== i))
    setAnalyzed([]); setStats(null)
  }

  const loadDemo = () => { setTasks(DEMO); setAnalyzed([]); setStats(null) }

  const analyze = () => {
    if (!tasks.length) return
    const result = analyzeSchedule(tasks)
    const s = getStats(result)
    setAnalyzed(result); setStats(s)
    onStatus(`${s.total} tasks · ${s.conflicted} overlap(s) detected · ${s.lanes} parallel lane(s)`)
  }

  const exportJSON = () => {
    if (!analyzed.length) return
    const blob = new Blob([JSON.stringify(analyzed, null, 2)], { type:'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = 'schedule.json'; a.click()
  }

  return (
    <div className="module">
      {/* ── Visualization ── */}
      <div className="module-viz" style={{ gap:10 }}>
        <div style={{ fontWeight:700, color:'#39D0D8', fontSize:14, marginBottom:4 }}>
          Task Timeline
          <span className="muted" style={{ fontSize:11, marginLeft:10 }}>
            Overlapping tasks are stacked in lanes · ⚠ = conflict
          </span>
        </div>

        {analyzed.length ? (
          <>
            <Timeline tasks={analyzed} />

            {/* Table view below timeline */}
            <div className="tbl-wrap" style={{ marginTop:10 }}>
              <table>
                <thead><tr>
                  {['#','Task','Priority','Start','End','Duration','Status'].map(h =>
                    <th key={h}>{h}</th>
                  )}
                </tr></thead>
                <tbody>
                  {analyzed.map((t, i) => (
                    <tr key={i}>
                      <td className="muted">{i + 1}</td>
                      <td style={{ textAlign:'left', fontWeight:600, color:'var(--txt)' }}>{t.name}</td>
                      <td>
                        <span className="badge"
                          style={{ background: PRI_COLOR[t.priority]+'22', color: PRI_COLOR[t.priority] }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ fontFamily:'var(--mono)', color:'var(--txt2)' }}>{t.startTime}</td>
                      <td style={{ fontFamily:'var(--mono)', color:'var(--txt2)' }}>{t.endTime}</td>
                      <td className="muted">{durLabel(t.duration)}</td>
                      <td>
                        {t.conflictsWith.length > 0
                          ? <span style={{ color:'#F78166', fontSize:11 }}>
                              ⚠ Overlaps {t.conflictsWith.length} task(s)
                            </span>
                          : <span style={{ color:'#3FB950', fontSize:11 }}>✓ No conflict</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {stats && (
              <div className="stat-row" style={{ marginTop:6 }}>
                <StatCard label="Total Tasks"   value={stats.total}     color="#39D0D8" />
                <StatCard label="Clean"         value={stats.clean}     color="#3FB950" />
                <StatCard label="Overlaps"      value={stats.conflicted} color="#F78166" />
                <StatCard label="Parallel Lanes" value={stats.lanes}    color="#E3B341" />
                <StatCard label="Total Time"    value={durLabel(stats.totalMin)} color="#BC8CFF" />
              </div>
            )}
          </>
        ) : (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            flexDirection:'column', gap:12, color:'var(--txt2)' }}>
            <div style={{ fontSize:48 }}>⏰</div>
            <div>Add tasks and click <b>Analyze Schedule</b> to see the timeline.</div>
            <div className="muted" style={{ fontSize:11 }}>
              Tasks with overlapping times will be shown in separate lanes.
            </div>
          </div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="module-ctrl">
        <h3 style={{ color:'#39D0D8', fontWeight:700, fontSize:16 }}>⏰ Task Scheduler</h3>
        <p className="muted">Overlap-aware timeline · tasks may share time slots</p>

        {/* Add Task */}
        <div className="grp"><div className="grp-title">Add Task</div>
          <div className="flex-col">
            <input placeholder="Task name…" value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()} />

            <div className="field"><label>Priority</label>
              <select value={priority} onChange={e => setPri(e.target.value)}>
                {['Low','Medium','High','Critical'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="row">
              <label>Start:</label>
              <input type="time" value={startTime} onChange={e => setStart(e.target.value)}
                style={{ flex:1 }} />
            </div>
            <div className="row">
              <label>End:</label>
              <input type="time" value={endTime} onChange={e => setEnd(e.target.value)}
                style={{ flex:1 }} />
            </div>

            {toMin(endTime) <= toMin(startTime) && (
              <div style={{ color:'#F78166', fontSize:11 }}>⚠ End must be after start</div>
            )}

            <button className="btn btn-success btn-sm btn-block" onClick={addTask}
              disabled={!name.trim() || toMin(endTime) <= toMin(startTime)}>
              ➕ Add Task
            </button>
          </div>
        </div>

        {/* Task list */}
        {tasks.length > 0 && (
          <div className="grp"><div className="grp-title">Tasks ({tasks.length})</div>
            <ul className="entry-list" style={{ maxHeight:200, overflowY:'auto' }}>
              {tasks.map((t, i) => (
                <li key={i} className="entry-item">
                  <span style={{ color: PRI_COLOR[t.priority], fontWeight:700, fontSize:10, minWidth:14 }}>
                    {t.priority[0]}
                  </span>
                  <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:12 }}>
                    {t.name}
                  </span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:10, color:'var(--txt3)', whiteSpace:'nowrap' }}>
                    {t.startTime}–{t.endTime}
                  </span>
                  <button className="btn btn-sm" style={{ padding:'2px 6px' }}
                    onClick={() => removeTask(i)}>✕</button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button className="btn btn-sm btn-block" onClick={loadDemo}>📋 Load Demo Tasks</button>
        <button className="btn btn-primary btn-block" onClick={analyze}
          disabled={!tasks.length}>
          ▶ Analyze Schedule
        </button>
        <button className="btn btn-danger btn-block"
          onClick={() => { setTasks([]); setAnalyzed([]); setStats(null) }}>
          🗑 Clear All
        </button>
        <button className="btn btn-sm btn-block" onClick={exportJSON}
          disabled={!analyzed.length}>
          💾 Export JSON
        </button>
      </div>
    </div>
  )
}
