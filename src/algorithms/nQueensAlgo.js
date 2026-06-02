/** N-Queens: find solutions, backtracking animation steps, attack detection */

export function isSafe(queens, row, col) {
  for (let r = 0; r < row; r++) {
    if (queens[r] === col) return false
    if (Math.abs(queens[r] - col) === row - r) return false
  }
  return true
}

/** Returns array of all solutions (each = column placements per row) */
export function findAllSolutions(n) {
  const solutions = [], queens = []
  function bt(row) {
    if (row === n) { solutions.push([...queens]); return }
    for (let c = 0; c < n; c++) {
      if (isSafe(queens, row, c)) {
        queens.push(c); bt(row + 1); queens.pop()
      }
    }
  }
  bt(0)
  return solutions
}

/** Find first solution only (fast) */
export function findFirstSolution(n) {
  const queens = []
  function bt(row) {
    if (row === n) return true
    for (let c = 0; c < n; c++) {
      if (isSafe(queens, row, c)) {
        queens.push(c)
        if (bt(row + 1)) return true
        queens.pop()
      }
    }
    return false
  }
  return bt(0) ? [...queens] : null
}

/**
 * Generate animation steps for backtracking visualisation.
 * Each step: { type: 'try'|'place'|'fail'|'backtrack'|'solution', queens[], row, col }
 */
export function getBacktrackSteps(n) {
  const steps = [], queens = new Array(n).fill(-1)
  function bt(row) {
    if (row === n) {
      steps.push({ type:'solution', queens:[...queens], row:-1, col:-1 })
      return true
    }
    for (let col = 0; col < n; col++) {
      queens[row] = col
      if (isSafe(queens, row, col)) {
        steps.push({ type:'place', queens:[...queens], row, col })
        if (bt(row + 1)) return true
        steps.push({ type:'backtrack', queens:[...queens], row, col })
        queens[row] = -1
      } else {
        steps.push({ type:'fail', queens:[...queens], row, col })
        queens[row] = -1
      }
    }
    return false
  }
  bt(0)
  return steps
}

/** Set of "r,c" strings that are attacked by any placed queen */
export function getAttackedCells(queens, n) {
  const attacked = new Set()
  for (let r = 0; r < n; r++) {
    const qc = queens[r]
    if (qc < 0) continue
    for (let c = 0; c < n; c++) {
      if (c !== qc) attacked.add(`${r},${c}`)         // same row
    }
    for (let row = 0; row < n; row++) {
      if (row !== r) attacked.add(`${row},${qc}`)     // same col
      const d = row - r
      if (d !== 0) {
        if (qc + d >= 0 && qc + d < n) attacked.add(`${row},${qc+d}`)
        if (qc - d >= 0 && qc - d < n) attacked.add(`${row},${qc-d}`)
      }
    }
  }
  return attacked
}

/** Known solution counts (for display) */
export const SOLUTION_COUNTS = {4:2,5:10,6:4,7:40,8:92,9:352,10:724,11:2680,12:14200}
