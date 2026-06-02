/**
 * LinkedIn Tango (Sun & Moon)
 * 6×6 grid  |  1 = ☀  2 = 🌙  0 = empty
 * Rules:
 *   R1: each row has exactly 3 suns and 3 moons
 *   R2: each column has exactly 3 suns and 3 moons
 *   R3: no 3 consecutive same symbol in any row or column
 *   R4: fixed (given) cells cannot be changed
 *   R5: edge constraints — = (same symbol) or × (different symbol) between adjacent cells
 */

export const SUN=1, MOON=2, SIZE=6, HALF=3

/** Check if placing val at (r,c) in grid violates Tango rules */
export function isValidTango(grid, r, c, val, constraints) {
  const half=SIZE/2

  // R1 — row count
  const rowCount=grid[r].filter(x=>x===val).length
  if(rowCount>=half) return false

  // R2 — col count
  let colCount=0
  for(let i=0;i<SIZE;i++) if(grid[i][c]===val) colCount++
  if(colCount>=half) return false

  // R3 — no 3 consecutive in row
  const row=[...grid[r]]; row[c]=val
  for(let j=0;j<=SIZE-3;j++) if(row[j]&&row[j]===row[j+1]&&row[j]===row[j+2]) return false

  // R3 — no 3 consecutive in col
  const col=grid.map((row2,ri)=>ri===r?val:row2[c])
  for(let i=0;i<=SIZE-3;i++) if(col[i]&&col[i]===col[i+1]&&col[i]===col[i+2]) return false

  // R5 — edge constraints
  for(const ct of constraints){
    const {r1,c1,r2,c2,type}=ct
    const v1=(r1===r&&c1===c)?val:grid[r1][c1]
    const v2=(r2===r&&c2===c)?val:grid[r2][c2]
    if(!v1||!v2) continue
    if(type==='='&&v1!==v2) return false
    if(type==='x'&&v1===v2) return false
  }

  return true
}

export function solveTango(puzzle) {
  const {size=SIZE,given,constraints} = puzzle
  const grid = Array.from({length:size},()=>Array(size).fill(0))
  for(const [r,c,v] of given) grid[r][c]=v

  function solve(pos){
    while(pos<size*size){
      const r=pos/size|0, c=pos%size
      if(grid[r][c]!==0) { pos++; continue }
      for(const v of [SUN,MOON]){
        if(isValidTango(grid,r,c,v,constraints)){
          grid[r][c]=v
          if(solve(pos+1)) return true
          grid[r][c]=0
        }
      }
      return false
    }
    return true
  }
  return solve(0) ? grid : null
}

export function getViolations(grid, constraints) {
  const bad=new Set()
  const half=SIZE/2

  // Row/col count violations
  for(let r=0;r<SIZE;r++){
    const sc=grid[r].filter(x=>x===SUN).length, mc=grid[r].filter(x=>x===MOON).length
    if(sc>half||mc>half) for(let c=0;c<SIZE;c++) if(grid[r][c]) bad.add(`${r},${c}`)
  }
  for(let c=0;c<SIZE;c++){
    let sc=0,mc=0; for(let r=0;r<SIZE;r++){ if(grid[r][c]===SUN)sc++; if(grid[r][c]===MOON)mc++ }
    if(sc>half||mc>half) for(let r=0;r<SIZE;r++) if(grid[r][c]) bad.add(`${r},${c}`)
  }

  // 3-consecutive
  for(let r=0;r<SIZE;r++)
    for(let j=0;j<=SIZE-3;j++)
      if(grid[r][j]&&grid[r][j]===grid[r][j+1]&&grid[r][j]===grid[r][j+2])
        [j,j+1,j+2].forEach(c=>bad.add(`${r},${c}`))
  for(let c=0;c<SIZE;c++)
    for(let i=0;i<=SIZE-3;i++)
      if(grid[i][c]&&grid[i][c]===grid[i+1][c]&&grid[i][c]===grid[i+2][c])
        [i,i+1,i+2].forEach(r=>bad.add(`${r},${c}`))

  // Constraint violations
  for(const {r1,c1,r2,c2,type} of constraints){
    const v1=grid[r1][c1], v2=grid[r2][c2]
    if(!v1||!v2) continue
    if(type==='='&&v1!==v2){ bad.add(`${r1},${c1}`); bad.add(`${r2},${c2}`) }
    if(type==='x'&&v1===v2){ bad.add(`${r1},${c1}`); bad.add(`${r2},${c2}`) }
  }

  return bad
}

// ── Verified 6×6 Tango puzzles ────────────────────────────────────────────────
// Solution verified: 3 suns + 3 moons per row/col, no 3 consecutive, constraints satisfied.
// S=☀=1  M=🌙=2
export const PUZZLES = [
  {
    id:1, label:'Tango 1  Easy',
    // Solution: [[1,2,1,2,1,2],[2,1,2,1,2,1],[1,2,1,1,2,2],[2,1,2,2,1,1],[1,2,2,1,2,1],[2,1,1,2,1,2]]
    solution:[[1,2,1,2,1,2],[2,1,2,1,2,1],[1,2,1,1,2,2],[2,1,2,2,1,1],[1,2,2,1,2,1],[2,1,1,2,1,2]],
    given:[[0,0,1],[0,5,2],[1,2,2],[2,3,1],[3,0,2],[4,4,2],[5,1,1],[5,5,2]],
    constraints:[
      {r1:0,c1:2,r2:0,c2:3,type:'x'},  // 1≠2 ✓
      {r1:2,c1:2,r2:2,c2:3,type:'='},  // 1=1 ✓
      {r1:3,c1:2,r2:3,c2:3,type:'='},  // 2=2 ✓
      {r1:1,c1:4,r2:2,c2:4,type:'='},  // 2=2 ✓
      {r1:4,c1:1,r2:4,c2:2,type:'='},  // 2=2 ✓
      {r1:0,c1:4,r2:1,c2:4,type:'x'},  // 1≠2 ✓
      {r1:3,c1:0,r2:4,c2:0,type:'x'},  // 2≠1 ✓
    ],
  },
  {
    id:2, label:'Tango 2  Medium',
    // Different starting clues, same solution structure but rotated
    solution:[[2,1,2,1,2,1],[1,2,1,2,1,2],[2,1,2,2,1,1],[1,2,1,1,2,2],[2,1,1,2,1,2],[1,2,2,1,2,1]],
    given:[[0,0,2],[0,3,1],[1,5,2],[2,1,1],[3,4,2],[4,2,1],[5,0,1],[5,5,1]],
    constraints:[
      {r1:0,c1:1,r2:0,c2:2,type:'x'},
      {r1:1,c1:2,r2:2,c2:2,type:'x'},
      {r1:2,c1:2,r2:2,c2:3,type:'='},
      {r1:3,c1:0,r2:4,c2:0,type:'x'},
      {r1:4,c1:3,r2:5,c2:3,type:'x'},
      {r1:1,c1:0,r2:2,c2:0,type:'x'},
      {r1:3,c1:3,r2:3,c2:4,type:'x'},
    ],
  },
  {
    id:3, label:'Tango 3  Hard',
    solution:[[1,1,2,2,1,2],[2,2,1,1,2,1],[1,2,2,1,1,2],[2,1,1,2,2,1],[1,2,1,2,1,2],[2,1,2,1,2,1]],
    given:[[0,0,1],[0,5,2],[2,0,1],[3,5,1],[4,2,1],[5,1,1]],
    constraints:[
      {r1:0,c1:0,r2:0,c2:1,type:'='},  // 1=1 ✓
      {r1:0,c1:2,r2:0,c2:3,type:'='},  // 2=2 ✓
      {r1:1,c1:0,r2:1,c2:1,type:'='},  // 2=2 ✓
      {r1:2,c1:2,r2:3,c2:2,type:'x'},  // 2≠1 ✓
      {r1:4,c1:4,r2:5,c2:4,type:'x'},  // 1≠2 ✓
      {r1:2,c1:3,r2:3,c2:3,type:'x'},  // 1≠2 ✓
    ],
  },
]
