/**
 * timetableAlgo.js — School Timetable Generator (CSP backtracking)
 *
 * DATA MODEL
 * ----------
 * config   : { days, periodsPerDay, startTime, periodDuration, breaks:[{afterPeriod,duration}] }
 * subjects : [{ id, name, periodsPerWeek, color }]
 * teachers : [{ id, name, subjectIds:[id] }]
 * classes  : [{ id, name }]
 * rooms    : [{ name }]
 *
 * CONSTRAINT SET
 * --------------
 * C1 — a teacher can't be in two places at the same (day, period)
 * C2 — a room can't host two classes at the same (day, period)
 * C3 — a class can't have two lessons at the same (day, period)
 * C4 — same subject max once per day per class (spread subjects)
 * C5 — teacher teaches only subjects in their subjectIds list
 */

export const DEFAULT_DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday']
export const SUBJECT_COLORS = [
  '#1F3A5F','#1A3626','#3D2B1F','#2E1F3D','#3D1F1F',
  '#1F3D2E','#2E3D1F','#3D3D1F','#1F2E3D','#3D1F2E',
]

// ── Time slot builder ─────────────────────────────────────────────────────────
export function buildTimeSlots(config) {
  const { startTime='08:00', periodDuration=45, periodsPerDay=7, breaks=[] } = config
  let cur = toMin(startTime)
  const slots = []

  for(let p = 1; p <= periodsPerDay; p++) {
    const start = fromMin(cur)
    const end   = fromMin(cur + periodDuration)
    slots.push({ type:'period', period:p, label:`Period ${p}`, start, end, time:`${start}–${end}` })
    cur += periodDuration

    const brk = breaks.find(b => b.afterPeriod === p)
    if(brk) {
      const bs = fromMin(cur), be = fromMin(cur + brk.duration)
      slots.push({ type:'break', label:`Break (${brk.duration} min)`, start:bs, end:be, time:`${bs}–${be}` })
      cur += brk.duration
    }
  }
  return slots
}

// ── Main solver ────────────────────────────────────────────────────────────────
export function solveSchoolTimetable(classes, subjects, teachers, rooms, config) {
  const { days = DEFAULT_DAYS, periodsPerDay = 7 } = config
  if(!classes.length || !subjects.length || !teachers.length) return null

  /**
   * Strategy: solve each class independently using greedy backtracking.
   * Global state tracks teacher + room occupancy across all classes.
   */
  const globalOcc = {}          // `teacher|day|period` and `room|day|period` → true
  const classSchedules = {}     // classId → { day → { period → {subjectId,teacherId,room} } }

  for(const cls of classes) {
    const schedule = {}
    for(const d of days) { schedule[d] = {}; for(let p=1;p<=periodsPerDay;p++) schedule[d][p]=null }

    // Build assignment list: (subjectId, occurrence) sorted by most-periods-per-week first
    const assignments = subjects.flatMap(s =>
      Array.from({length:s.periodsPerWeek}, (_,i) => ({ subjectId:s.id, occ:i }))
    ).sort((a,b) => {
      const sa = subjects.find(s=>s.id===a.subjectId)
      const sb = subjects.find(s=>s.id===b.subjectId)
      return (sb?.periodsPerWeek||0) - (sa?.periodsPerWeek||0)
    })

    const ok = backtrackClass(assignments, 0, cls.id, schedule, subjects, teachers, rooms.map(r=>r.name), days, periodsPerDay, globalOcc)
    if(!ok) return null   // failed for this class
    classSchedules[cls.id] = schedule
  }

  return classSchedules
}

function backtrackClass(assignments, idx, classId, schedule, subjects, teachers, roomNames, days, periodsPerDay, globalOcc) {
  if(idx === assignments.length) return true

  const { subjectId } = assignments[idx]
  const subj   = subjects.find(s => s.id === subjectId)
  const validTeachers = teachers.filter(t => t.subjectIds.includes(subjectId))
  if(!validTeachers.length) return true   // skip — no teacher assigned

  // Shuffle domain for variety across attempts
  const domain = shuffle2d(days, periodsPerDay)

  for(const [day, period] of domain) {
    if(schedule[day][period] !== null) continue                          // C3: class busy

    // C4: same subject max once per day per class
    const todayCount = Object.values(schedule[day]).filter(e=>e?.subjectId===subjectId).length
    if(todayCount >= 1) continue

    for(const teacher of validTeachers) {
      if(globalOcc[`t|${teacher.id}|${day}|${period}`]) continue        // C1: teacher busy

      const room = roomNames.find(r => !globalOcc[`r|${r}|${day}|${period}`])
      if(!room) continue                                                  // C2: no free room

      // Assign
      schedule[day][period]                             = { subjectId, teacherId:teacher.id, room }
      globalOcc[`t|${teacher.id}|${day}|${period}`]    = true
      globalOcc[`r|${room}|${day}|${period}`]           = true

      if(backtrackClass(assignments, idx+1, classId, schedule, subjects, teachers, roomNames, days, periodsPerDay, globalOcc))
        return true

      // Undo
      schedule[day][period] = null
      delete globalOcc[`t|${teacher.id}|${day}|${period}`]
      delete globalOcc[`r|${room}|${day}|${period}`]
    }
  }
  return false
}

function shuffle2d(days, periodsPerDay) {
  const all = days.flatMap(d => Array.from({length:periodsPerDay},(_,i)=>[d,i+1]))
  return all.sort(() => Math.random() - .5)
}

// ── Display builder ───────────────────────────────────────────────────────────
export function buildClassGrid(classId, schedule, subjects, teachers, timeSlots, days) {
  /** Returns rows for the pivot table: each row = one time-slot entry */
  return timeSlots.map(slot => {
    if(slot.type === 'break') return { ...slot, cells: null }

    const cells = days.map(day => {
      const entry = schedule[classId]?.[day]?.[slot.period]
      if(!entry) return null
      const subj    = subjects.find(s=>s.id===entry.subjectId)
      const teacher = teachers.find(t=>t.id===entry.teacherId)
      return { subj, teacher, room:entry.room }
    })
    return { ...slot, cells }
  })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function toMin(t)   { const [h,m]=t.split(':').map(Number); return h*60+m }
function fromMin(m) { return `${String(m/60|0).padStart(2,'0')}:${String(m%60).padStart(2,'0')}` }
