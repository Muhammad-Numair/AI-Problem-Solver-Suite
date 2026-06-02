import { useState, useId } from 'react'
import {
  DEFAULT_DAYS, SUBJECT_COLORS, buildTimeSlots,
  solveSchoolTimetable, buildClassGrid,
} from '../algorithms/timetableAlgo.js'

// ── Colour helpers ─────────────────────────────────────────────────────────────
const PRESET_COLORS = ['#1F3A5F','#1A3626','#3D2B1F','#2E1F3D','#3D1F1F','#1F3D2E','#2E3D1F','#3D3D1F','#1F2E3D','#3D1F2E']
function pickColor(i) { return PRESET_COLORS[i % PRESET_COLORS.length] }

// ── Default demo data ──────────────────────────────────────────────────────────
function defaultDemo() {
  const subjects = [
    {id:'s1',name:'Mathematics',  periodsPerWeek:5,color:'#1F3A5F'},
    {id:'s2',name:'Physics',      periodsPerWeek:4,color:'#1A3626'},
    {id:'s3',name:'Chemistry',    periodsPerWeek:4,color:'#3D2B1F'},
    {id:'s4',name:'English',      periodsPerWeek:5,color:'#2E1F3D'},
    {id:'s5',name:'Computer Sci', periodsPerWeek:3,color:'#3D1F1F'},
    {id:'s6',name:'Biology',      periodsPerWeek:3,color:'#1F3D2E'},
    {id:'s7',name:'History',      periodsPerWeek:2,color:'#2E3D1F'},
  ]
  const teachers = [
    {id:'t1',name:'Mr. Ahmed',   subjectIds:['s1']},
    {id:'t2',name:'Ms. Sara',    subjectIds:['s2']},
    {id:'t3',name:'Mr. Hassan',  subjectIds:['s3']},
    {id:'t4',name:'Ms. Fatima',  subjectIds:['s4']},
    {id:'t5',name:'Mr. Bilal',   subjectIds:['s5']},
    {id:'t6',name:'Ms. Ayesha',  subjectIds:['s6']},
    {id:'t7',name:'Mr. Zain',    subjectIds:['s7']},
  ]
  const classes = [{id:'c1',name:'Grade 9-A'},{id:'c2',name:'Grade 9-B'}]
  const rooms   = [{name:'Room 101'},{name:'Room 102'},{name:'Room 103'},{name:'Room 104'}]
  return { subjects, teachers, classes, rooms }
}

// ── Mini input helpers ──────────────────────────────────────────────────────────
const Inp = ({value, onChange, placeholder, style={}}) => (
  <input type="text" value={value} onChange={e=>onChange(e.target.value)}
    placeholder={placeholder} style={{...style}}/>
)
const Num = ({value, onChange, min=1, max=20, style={}}) => (
  <input type="number" value={value} min={min} max={max}
    onChange={e=>onChange(Number(e.target.value))} style={{width:60,...style}}/>
)

// ── Main component ─────────────────────────────────────────────────────────────
export default function TimetableGenerator({ onStatus }) {
  // Config
  const [schoolName,    setSN]     = useState('My School')
  const [selectedDays,  setDays]   = useState(DEFAULT_DAYS)
  const [periodsPerDay, setPPD]    = useState(7)
  const [startTime,     setST]     = useState('08:00')
  const [periodDur,     setPDur]   = useState(45)
  const [breaks,        setBreaks] = useState([{afterPeriod:3,duration:15},{afterPeriod:6,duration:30}])

  // Data
  const [subjects,  setSubjects]  = useState([])
  const [teachers,  setTeachers]  = useState([])
  const [classes,   setClasses]   = useState([])
  const [rooms,     setRooms]     = useState([{name:'Room 101'},{name:'Room 102'},{name:'Room 103'}])

  // Add-form temps
  const [newSubj,  setNewSubj]  = useState({name:'',periodsPerWeek:4})
  const [newTeach, setNewTeach] = useState({name:'',subjectIds:[]})
  const [newClass, setNewClass] = useState('')
  const [newRoom,  setNewRoom]  = useState('')

  // Output
  const [schedules,    setSchedules]   = useState(null)
  const [generating,   setGenerating]  = useState(false)
  const [activeClass,  setActiveClass] = useState(null)
  const [genMsg,       setGenMsg]      = useState('')
  const [activeTab,    setActiveTab]   = useState('config')  // config|subjects|teachers|classes|rooms

  const config = { days:selectedDays, periodsPerDay, startTime, periodDuration:periodDur, breaks }
  const timeSlots = buildTimeSlots(config)

  // ── Config helpers ────────────────────────────────────────────────────────────
  const toggleDay = (d) => setDays(ds => ds.includes(d) ? ds.filter(x=>x!==d) : [...DEFAULT_DAYS.filter(x=>[...ds,d].includes(x))])
  const addBreak  = () => setBreaks(bs => [...bs, {afterPeriod:Math.floor(periodsPerDay/2), duration:15}])
  const rmBreak   = (i)=> setBreaks(bs => bs.filter((_,j)=>j!==i))
  const updBreak  = (i,k,v)=> setBreaks(bs => bs.map((b,j)=>j===i?{...b,[k]:Number(v)}:b))

  // ── Subject helpers ───────────────────────────────────────────────────────────
  const addSubject = () => {
    if(!newSubj.name.trim()) return
    const id = `s${Date.now()}`
    setSubjects(ss => [...ss, {...newSubj, id, color:pickColor(ss.length)}])
    setNewSubj({name:'',periodsPerWeek:4})
  }
  const rmSubject = (id) => {
    setSubjects(ss=>ss.filter(s=>s.id!==id))
    setTeachers(ts=>ts.map(t=>({...t,subjectIds:t.subjectIds.filter(x=>x!==id)})))
  }

  // ── Teacher helpers ───────────────────────────────────────────────────────────
  const addTeacher = () => {
    if(!newTeach.name.trim()) return
    setTeachers(ts=>[...ts,{id:`t${Date.now()}`,name:newTeach.name.trim(),subjectIds:[...newTeach.subjectIds]}])
    setNewTeach({name:'',subjectIds:[]})
  }
  const toggleTeacherSubject = (sid) =>
    setNewTeach(t=>({...t,subjectIds:t.subjectIds.includes(sid)?t.subjectIds.filter(x=>x!==sid):[...t.subjectIds,sid]}))
  const rmTeacher = (id)=> setTeachers(ts=>ts.filter(t=>t.id!==id))

  // ── Class / Room helpers ──────────────────────────────────────────────────────
  const addClass  = () => { if(!newClass.trim()) return; setClasses(cs=>[...cs,{id:`c${Date.now()}`,name:newClass.trim()}]); setNewClass('') }
  const rmClass   = (id)=> setClasses(cs=>cs.filter(c=>c.id!==id))
  const addRoom   = () => { if(!newRoom.trim()) return; setRooms(rs=>[...rs,{name:newRoom.trim()}]); setNewRoom('') }
  const rmRoom    = (i) => setRooms(rs=>rs.filter((_,j)=>j!==i))

  // ── Generate ──────────────────────────────────────────────────────────────────
  const generate = () => {
    if(!classes.length)  { setGenMsg('⚠️  Add at least one class.'); return }
    if(!subjects.length) { setGenMsg('⚠️  Add at least one subject.'); return }
    if(!teachers.length) { setGenMsg('⚠️  Add at least one teacher.'); return }

    // Check feasibility
    const totalPerWeek = subjects.reduce((s,x)=>s+x.periodsPerWeek,0)
    const totalSlots   = selectedDays.length * periodsPerDay
    if(totalPerWeek > totalSlots) {
      setGenMsg(`⚠️  Total periods/week (${totalPerWeek}) exceeds available slots (${totalSlots}). Reduce periods or add more days/periods per day.`)
      return
    }

    setGenerating(true); setGenMsg('⚙️  Generating school timetable…'); setSchedules(null)
    setTimeout(() => {
      const result = solveSchoolTimetable(classes, subjects, teachers, rooms, config)
      setGenerating(false)
      if(!result) {
        setGenMsg('❌  No valid timetable found. Try: add more rooms, reduce periods/week, or add more teachers.')
        onStatus('Generation failed.')
        return
      }
      setSchedules(result)
      setActiveClass(classes[0]?.id || null)
      const totalAssigned = Object.values(result).reduce((s,sched)=>s+Object.values(sched).flatMap(Object.values).filter(Boolean).length,0)
      setGenMsg(`✅  Generated! ${totalAssigned} lessons scheduled across ${classes.length} class(es).`)
      onStatus(`School timetable generated — ${totalAssigned} lessons.`)
    }, 20)
  }

  const exportJSON = () => {
    if(!schedules) return
    const data = { schoolName, config, classes, subjects, teachers, rooms, schedules }
    const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download=`${schoolName.replace(/\s+/g,'_')}_timetable.json`; a.click()
  }

  const exportCSV = () => {
    if(!schedules || !activeClass) return
    const sched = schedules[activeClass]
    const cls   = classes.find(c=>c.id===activeClass)
    const rows  = [['Time', ...selectedDays]]
    timeSlots.forEach(slot => {
      if(slot.type==='break') { rows.push([slot.label,...selectedDays.map(()=>'BREAK')]); return }
      const cells = selectedDays.map(day => {
        const e = sched?.[day]?.[slot.period]
        if(!e) return ''
        const s = subjects.find(x=>x.id===e.subjectId)
        const t = teachers.find(x=>x.id===e.teacherId)
        return `${s?.name||''} (${t?.name||''}) [${e.room}]`
      })
      rows.push([slot.time, ...cells])
    })
    const csv = rows.map(r=>r.map(c=>`"${c}"`).join(',')).join('\n')
    const blob = new Blob([csv],{type:'text/csv'})
    const a = document.createElement('a'); a.href=URL.createObjectURL(blob)
    a.download=`${cls?.name}_timetable.csv`; a.click()
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="module" style={{flexDirection:'column',gap:12}}>

      {/* ── Top row: controls + timetable ── */}
      <div style={{display:'flex',gap:12,flex:1,minHeight:0,flexWrap:'wrap'}}>

        {/* Left: configuration panel */}
        <div style={{width:300,minWidth:260,display:'flex',flexDirection:'column',gap:8,overflowY:'auto'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 style={{color:'#E3B341',fontWeight:700,fontSize:15}}>📅 School Timetable</h3>
          </div>

          {/* Tab bar */}
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {['config','subjects','teachers','classes','rooms'].map(t=>(
              <button key={t} className={`btn btn-sm${activeTab===t?' btn-primary':''}`}
                onClick={()=>setActiveTab(t)} style={{textTransform:'capitalize'}}>
                {t}
              </button>
            ))}
          </div>

          {/* ── CONFIG tab ── */}
          {activeTab==='config' && (
            <div className="flex-col">
              <div className="field"><label>School Name</label>
                <Inp value={schoolName} onChange={setSN} placeholder="School name…"/>
              </div>
              <div className="field"><label>Start Time</label>
                <input type="time" value={startTime} onChange={e=>setST(e.target.value)}
                  style={{background:'var(--bg-hover)',border:'1px solid var(--border)',borderRadius:6,color:'var(--txt)',padding:'6px 10px'}}/>
              </div>
              <div className="row"><label>Period Duration (min):</label>
                <Num value={periodDur} onChange={setPDur} min={20} max={120}/>
              </div>
              <div className="row"><label>Periods / Day:</label>
                <Num value={periodsPerDay} onChange={setPPD} min={3} max={12}/>
              </div>
              <div className="field"><label>Days</label>
                <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                  {DEFAULT_DAYS.map(d=>(
                    <button key={d} className={`btn btn-sm${selectedDays.includes(d)?' btn-success':''}`}
                      onClick={()=>toggleDay(d)} style={{padding:'3px 8px',fontSize:10}}>
                      {d.slice(0,3)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grp"><div className="grp-title">Breaks</div>
                {breaks.map((b,i)=>(
                  <div key={i} className="row" style={{marginBottom:4}}>
                    <span className="muted">After P</span>
                    <input type="number" value={b.afterPeriod} min={1} max={periodsPerDay-1}
                      onChange={e=>updBreak(i,'afterPeriod',e.target.value)}
                      style={{width:44,textAlign:'center'}}/>
                    <span className="muted">for</span>
                    <input type="number" value={b.duration} min={5} max={60}
                      onChange={e=>updBreak(i,'duration',e.target.value)}
                      style={{width:48,textAlign:'center'}}/>
                    <span className="muted">min</span>
                    <button className="btn btn-sm" onClick={()=>rmBreak(i)}>✕</button>
                  </div>
                ))}
                <button className="btn btn-sm btn-block" onClick={addBreak}>+ Add Break</button>
              </div>

              {/* Time preview */}
              <div className="grp" style={{maxHeight:140,overflowY:'auto'}}><div className="grp-title">Schedule Preview</div>
                {timeSlots.map((s,i)=>(
                  <div key={i} className="row" style={{padding:'2px 0',gap:8}}>
                    <span style={{fontFamily:'var(--mono)',fontSize:10,color:'var(--txt3)',minWidth:110}}>{s.time}</span>
                    <span style={{fontSize:10,color:s.type==='break'?'var(--yellow)':'var(--txt2)'}}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUBJECTS tab ── */}
          {activeTab==='subjects' && (
            <div className="flex-col">
              <div className="grp"><div className="grp-title">Add Subject</div>
                <Inp value={newSubj.name} onChange={v=>setNewSubj(s=>({...s,name:v}))} placeholder="Subject name…"/>
                <div className="row" style={{marginTop:4}}>
                  <span className="muted">Periods/week:</span>
                  <Num value={newSubj.periodsPerWeek} onChange={v=>setNewSubj(s=>({...s,periodsPerWeek:v}))} min={1} max={selectedDays.length*periodsPerDay}/>
                </div>
                <button className="btn btn-success btn-sm btn-block" style={{marginTop:6}} onClick={addSubject}>➕ Add</button>
              </div>
              <ul className="entry-list">
                {subjects.map(s=>(
                  <li key={s.id} className="entry-item">
                    <span style={{width:10,height:10,background:s.color,borderRadius:2,flexShrink:0,display:'inline-block'}}/>
                    <span style={{flex:1,fontWeight:600}}>{s.name}</span>
                    <span className="badge" style={{background:s.color+'44',color:'var(--txt2)'}}>{s.periodsPerWeek}×/wk</span>
                    <button className="btn btn-sm" style={{padding:'2px 6px'}} onClick={()=>rmSubject(s.id)}>✕</button>
                  </li>
                ))}
                {!subjects.length && <li style={{padding:8,color:'var(--txt3)',fontSize:11}}>No subjects added.</li>}
              </ul>
            </div>
          )}

          {/* ── TEACHERS tab ── */}
          {activeTab==='teachers' && (
            <div className="flex-col">
              <div className="grp"><div className="grp-title">Add Teacher</div>
                <Inp value={newTeach.name} onChange={v=>setNewTeach(t=>({...t,name:v}))} placeholder="Teacher name…"/>
                {subjects.length>0 && (
                  <div style={{marginTop:6}}>
                    <div className="muted" style={{marginBottom:4}}>Can teach:</div>
                    <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                      {subjects.map(s=>(
                        <button key={s.id}
                          className={`btn btn-sm${newTeach.subjectIds.includes(s.id)?' btn-success':''}`}
                          style={{padding:'3px 8px',fontSize:10}}
                          onClick={()=>toggleTeacherSubject(s.id)}>{s.name}</button>
                      ))}
                    </div>
                  </div>
                )}
                <button className="btn btn-success btn-sm btn-block" style={{marginTop:6}} onClick={addTeacher}>➕ Add</button>
              </div>
              <ul className="entry-list">
                {teachers.map(t=>(
                  <li key={t.id} className="entry-item" style={{flexDirection:'column',alignItems:'flex-start',gap:2}}>
                    <div style={{display:'flex',justifyContent:'space-between',width:'100%'}}>
                      <span style={{fontWeight:600,color:'#58A6FF'}}>{t.name}</span>
                      <button className="btn btn-sm" style={{padding:'2px 6px'}} onClick={()=>rmTeacher(t.id)}>✕</button>
                    </div>
                    <div style={{fontSize:10,color:'var(--txt3)'}}>
                      {t.subjectIds.map(id=>subjects.find(s=>s.id===id)?.name).filter(Boolean).join(', ') || 'No subjects'}
                    </div>
                  </li>
                ))}
                {!teachers.length && <li style={{padding:8,color:'var(--txt3)',fontSize:11}}>No teachers added.</li>}
              </ul>
            </div>
          )}

          {/* ── CLASSES tab ── */}
          {activeTab==='classes' && (
            <div className="flex-col">
              <div className="grp"><div className="grp-title">Add Class</div>
                <Inp value={newClass} onChange={setNewClass} placeholder="e.g. Grade 9-A"/>
                <button className="btn btn-success btn-sm btn-block" style={{marginTop:6}} onClick={addClass}>➕ Add</button>
              </div>
              <ul className="entry-list">
                {classes.map(c=>(
                  <li key={c.id} className="entry-item">
                    <span style={{flex:1,fontWeight:600,color:'#3FB950'}}>{c.name}</span>
                    <button className="btn btn-sm" style={{padding:'2px 6px'}} onClick={()=>rmClass(c.id)}>✕</button>
                  </li>
                ))}
                {!classes.length && <li style={{padding:8,color:'var(--txt3)',fontSize:11}}>No classes added.</li>}
              </ul>
            </div>
          )}

          {/* ── ROOMS tab ── */}
          {activeTab==='rooms' && (
            <div className="flex-col">
              <div className="grp"><div className="grp-title">Add Room</div>
                <Inp value={newRoom} onChange={setNewRoom} placeholder="e.g. Room 101"/>
                <button className="btn btn-success btn-sm btn-block" style={{marginTop:6}} onClick={addRoom}>➕ Add</button>
              </div>
              <ul className="entry-list">
                {rooms.map((r,i)=>(
                  <li key={i} className="entry-item">
                    <span style={{flex:1,color:'#39D0D8'}}>{r.name}</span>
                    <button className="btn btn-sm" style={{padding:'2px 6px'}} onClick={()=>rmRoom(i)}>✕</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex-col" style={{marginTop:'auto',gap:6}}>
            <button className="btn btn-sm btn-block" onClick={()=>{const d=defaultDemo();setSubjects(d.subjects);setTeachers(d.teachers);setClasses(d.classes);setRooms(d.rooms);onStatus('Demo data loaded.')}}>
              📋 Load Demo Data
            </button>
            <button className="btn btn-primary btn-block" onClick={generate} disabled={generating}>
              {generating ? '⚙️ Generating…' : '⚙️  Generate Timetable'}
            </button>
            {schedules && <>
              <button className="btn btn-sm btn-block" onClick={exportJSON}>💾 Export JSON</button>
              <button className="btn btn-sm btn-block" onClick={exportCSV}>📄 Export CSV (current class)</button>
            </>}
          </div>

          {genMsg && (
            <div style={{padding:'8px 10px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:6,fontSize:11,color:'var(--txt2)',lineHeight:1.5}}>
              {genMsg}
            </div>
          )}
        </div>

        {/* Right: timetable grid */}
        <div style={{flex:1,minWidth:0,display:'flex',flexDirection:'column',gap:8}}>
          {!schedules ? (
            <div style={{display:'flex',flex:1,alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:'var(--txt2)'}}>
              <div style={{fontSize:48}}>📅</div>
              <div style={{fontSize:14,fontWeight:600}}>{schoolName}</div>
              <div className="muted">Configure and generate to see the timetable.</div>
              {(subjects.length===0||teachers.length===0||classes.length===0) && (
                <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:8,padding:'12px 16px',fontSize:12,lineHeight:1.8,maxWidth:320}}>
                  <div style={{fontWeight:700,marginBottom:4,color:'var(--yellow)'}}>Quick setup checklist:</div>
                  <div style={{color:subjects.length?'var(--green)':'var(--orange)'}}>
                    {subjects.length?'✅':'➡️'} Subjects ({subjects.length} added)
                  </div>
                  <div style={{color:teachers.length?'var(--green)':'var(--orange)'}}>
                    {teachers.length?'✅':'➡️'} Teachers ({teachers.length} added)
                  </div>
                  <div style={{color:classes.length?'var(--green)':'var(--orange)'}}>
                    {classes.length?'✅':'➡️'} Classes ({classes.length} added)
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Class tabs */}
              <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
                <span style={{fontSize:12,fontWeight:700,color:'var(--yellow)',marginRight:4}}>{schoolName}</span>
                {classes.map(c=>(
                  <button key={c.id}
                    className={`btn btn-sm${activeClass===c.id?' btn-primary':''}`}
                    onClick={()=>setActiveClass(c.id)}>{c.name}</button>
                ))}
              </div>

              {/* Timetable grid */}
              {activeClass && (
                <div className="tt-grid-wrap" style={{flex:1}}>
                  <table className="tt-grid">
                    <thead>
                      <tr>
                        <th style={{minWidth:110}}>Time</th>
                        {selectedDays.map(d=><th key={d}>{d}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {buildClassGrid(activeClass, schedules, subjects, teachers, timeSlots, selectedDays).map((slot,i)=>(
                        <tr key={i}>
                          {slot.type==='break' ? (
                            <td colSpan={selectedDays.length+1}>
                              <div className="tt-break">☕ {slot.label} &nbsp; {slot.time}</div>
                            </td>
                          ) : (
                            <>
                              <td><div className="tt-time">{slot.time}<br/><span style={{opacity:.6}}>{slot.label}</span></div></td>
                              {slot.cells?.map((cell,j)=>(
                                <td key={j} style={{background: cell?.subj?.color ? cell.subj.color+'cc' : 'transparent'}}>
                                  {cell ? (
                                    <div className="tt-cell">
                                      <div className="tt-cell-subj" style={{color:'#fff'}}>{cell.subj?.name}</div>
                                      <div className="tt-cell-teacher">{cell.teacher?.name}</div>
                                      <div className="tt-cell-room">{cell.room}</div>
                                    </div>
                                  ) : (
                                    <div className="tt-cell" style={{opacity:.25,fontSize:10,color:'var(--txt3)',justifyContent:'center',alignItems:'center',textAlign:'center'}}>—</div>
                                  )}
                                </td>
                              ))}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Subject legend */}
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {subjects.map(s=>(
                  <div key={s.id} style={{display:'flex',alignItems:'center',gap:4}}>
                    <span style={{width:10,height:10,background:s.color,borderRadius:2,display:'inline-block'}}/>
                    <span style={{fontSize:10,color:'var(--txt2)'}}>{s.name}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
