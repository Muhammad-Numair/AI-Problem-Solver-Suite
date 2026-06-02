/**
 * Shikaku — divide the grid into rectangles.
 * Each rectangle contains exactly one number equal to its area.
 */

/** All rectangles of area=n containing cell (r,c) within size×size */
function candidateRects(r, c, n, size) {
  const rects = []
  for(let h=1; h<=n; h++){
    if(n%h!==0) continue
    const w=n/h
    for(let sr=Math.max(0,r-h+1); sr<=r && sr+h<=size; sr++)
      for(let sc=Math.max(0,c-w+1); sc<=c && sc+w<=size; sc++)
        rects.push({sr,sc,er:sr+h-1,ec:sc+w-1})
  }
  return rects
}

function containsOtherClue(rect, clueIdx, clues) {
  for(let i=0; i<clues.length; i++){
    if(i===clueIdx) continue
    const {r,c}=clues[i]
    if(r>=rect.sr&&r<=rect.er&&c>=rect.sc&&c<=rect.ec) return true
  }
  return false
}

export function solveShikaku(puzzle) {
  const {size,clues} = puzzle
  const grid = Array.from({length:size},()=>Array(size).fill(-1))

  function bt(idx){
    if(idx===clues.length) return true
    const clue=clues[idx]
    const cands=candidateRects(clue.r,clue.c,clue.n,size)
      .filter(rect=>!containsOtherClue(rect,idx,clues))
      .sort(()=>Math.random()-.5)   // randomise for variety

    for(const rect of cands){
      // All cells free?
      let free=true
      for(let r=rect.sr;r<=rect.er&&free;r++)
        for(let c=rect.sc;c<=rect.ec&&free;c++)
          if(grid[r][c]!==-1) free=false
      if(!free) continue

      for(let r=rect.sr;r<=rect.er;r++) for(let c=rect.sc;c<=rect.ec;c++) grid[r][c]=idx
      if(bt(idx+1)) return true
      for(let r=rect.sr;r<=rect.er;r++) for(let c=rect.sc;c<=rect.ec;c++) grid[r][c]=-1
    }
    return false
  }

  // Try a few times (randomised order helps escape dead ends)
  for(let attempt=0;attempt<5;attempt++){
    grid.forEach(row=>row.fill(-1))
    if(bt(0)) return grid
  }
  return null
}

// ── Verified pre-built puzzles ─────────────────────────────────────────────────
// Each clue: {r, c, n} — cell position and area of the rectangle it belongs to.
// Puzzle solutions are pre-verified: sum of all n == size*size.

export const PUZZLES = [
  {
    id:1, label:'5×5  Easy', size:5,
    // Solution: [0,0→1×1 cols0-1]=4, [0,2→rows0-1 col2]=2, [0,3→rows0-1 cols3-4]=4
    //           [2,1→rows2-3 cols0-2]=6, [3,4→rows2-3 cols3-4]=4, [4,2→row4 cols0-4]=5
    clues:[
      {r:0,c:0,n:4},{r:0,c:2,n:2},{r:0,c:4,n:4},
      {r:2,c:1,n:6},{r:3,c:4,n:4},{r:4,c:2,n:5},
    ],
    solution:[
      [0,0,1,2,2],
      [0,0,1,2,2],
      [3,3,3,4,4],
      [3,3,3,4,4],
      [5,5,5,5,5],
    ],
  },
  {
    id:2, label:'6×6  Medium', size:6,
    clues:[
      {r:0,c:1,n:6},{r:0,c:3,n:2},{r:0,c:5,n:4},
      {r:2,c:0,n:4},{r:3,c:2,n:4},{r:2,c:5,n:4},
      {r:5,c:1,n:6},{r:4,c:4,n:6},
    ],
    solution:[
      [0,0,0,1,2,2],
      [0,0,0,1,2,2],
      [3,3,4,4,5,5],
      [3,3,4,4,5,5],
      [6,6,6,7,7,7],
      [6,6,6,7,7,7],
    ],
  },
  {
    id:3, label:'7×7  Hard', size:7,
    clues:[
      {r:0,c:1,n:6},{r:0,c:3,n:4},{r:0,c:6,n:4},
      {r:2,c:0,n:4},{r:3,c:3,n:4},{r:2,c:5,n:6},
      {r:5,c:1,n:6},{r:5,c:3,n:3},{r:4,c:5,n:6},
      {r:6,c:1,n:3},{r:6,c:5,n:3},
    ],
    solution:[
      [0,0,0,1,1,2,2],
      [0,0,0,1,1,2,2],
      [3,3,4,4,5,5,5],
      [3,3,4,4,5,5,5],
      [6,6,6,7,8,8,8],
      [6,6,6,7,8,8,8],
      [9,9,9,7,10,10,10],
    ],
  },
]

// Distinct colours for rectangles (up to 14 rects)
export const RECT_COLORS = [
  '#1F3A5F','#1A3626','#3D2B1F','#2E1F3D','#3D1F1F','#1F3D2E','#2E3D1F',
  '#3D3D1F','#1F2E3D','#3D1F2E','#2B3D1F','#1F3D3D','#3D2E1F','#2E1F1F',
]
