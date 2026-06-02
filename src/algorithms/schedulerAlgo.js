/**
 * schedulerAlgo.js
 * Tasks have explicit startTime / endTime.  Overlaps are ALLOWED and flagged.
 * Lane assignment lets the visual timeline stack overlapping tasks side-by-side.
 */

const PRI_RANK = { Critical:4, High:3, Medium:2, Low:1 }

export function toMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
export function fromMin(m) {
  return `${String(m / 60 | 0).padStart(2,'0')}:${String(m % 60).padStart(2,'0')}`
}
export function durMin(startTime, endTime) {
  return toMin(endTime) - toMin(startTime)
}
export function durLabel(min) {
  if (min < 60) return `${min}m`
  const h = min / 60 | 0, m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

/**
 * analyzeSchedule(tasks)
 * Returns the same tasks sorted by startTime, enriched with:
 *   startMin, endMin, duration, lane, conflictsWith[]
 */
export function analyzeSchedule(tasks) {
  if (!tasks.length) return []

  const enriched = tasks.map((t, i) => ({
    ...t,
    id: i,
    startMin:   toMin(t.startTime),
    endMin:     toMin(t.endTime),
    duration:   durMin(t.startTime, t.endTime),
    conflictsWith: [],
    lane: 0,
  })).sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin)

  // O(n²) overlap detection — fine for daily task lists
  for (let i = 0; i < enriched.length; i++) {
    for (let j = i + 1; j < enriched.length; j++) {
      const a = enriched[i], b = enriched[j]
      if (a.startMin < b.endMin && b.startMin < a.endMin) {
        a.conflictsWith.push(j)
        b.conflictsWith.push(i)
      }
    }
  }

  // Greedy lane packing (interval graph colouring)
  const laneEnds = []
  for (const t of enriched) {
    let lane = laneEnds.findIndex(end => end <= t.startMin)
    if (lane === -1) lane = laneEnds.length
    t.lane = lane
    laneEnds[lane] = t.endMin
  }

  return enriched
}

export function getStats(tasks) {
  if (!tasks.length) return { total:0, conflicted:0, clean:0, totalMin:0, lanes:0 }
  const conflicted = tasks.filter(t => t.conflictsWith.length > 0).length
  return {
    total:     tasks.length,
    conflicted,
    clean:     tasks.length - conflicted,
    totalMin:  tasks.reduce((s, t) => s + t.duration, 0),
    lanes:     Math.max(...tasks.map(t => t.lane)) + 1,
  }
}
