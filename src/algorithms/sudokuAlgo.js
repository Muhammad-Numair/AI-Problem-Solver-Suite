/** Mini Sudoku  —  6×6 grid, 2×3 boxes, numbers 1–6 */

export const SIZE = 6
export const BOX_H = 2, BOX_W = 3

export function isValidPlacement(grid, r, c, num) {
  for(let j=0;j<SIZE;j++) if(j!==c && grid[r][j]===num) return false
  for(let i=0;i<SIZE;i++) if(i!==r && grid[i][c]===num) return false
  const br=Math.floor(r/BOX_H)*BOX_H, bc=Math.floor(c/BOX_W)*BOX_W
  for(let i=br;i<br+BOX_H;i++)
    for(let j=bc;j<bc+BOX_W;j++)
      if((i!==r||j!==c) && grid[i][j]===num) return false
  return true
}

export function solveSudoku(grid) {
  const g = grid.map(r=>[...r])
  function solve(){
    for(let r=0;r<SIZE;r++)
      for(let c=0;c<SIZE;c++)
        if(!g[r][c]){
          for(let n=1;n<=SIZE;n++){
            if(isValidPlacement(g,r,c,n)){
              g[r][c]=n; if(solve()) return true; g[r][c]=0
            }
          }
          return false
        }
    return true
  }
  return solve() ? g : null
}

export function getErrors(grid) {
  const errs = new Set()
  for(let r=0;r<SIZE;r++)
    for(let c=0;c<SIZE;c++){
      const v=grid[r][c]; if(!v) continue
      grid[r][c]=0
      if(!isValidPlacement(grid,r,c,v)) errs.add(`${r},${c}`)
      grid[r][c]=v
    }
  return errs
}

export function isSolved(grid) {
  for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!grid[r][c]) return false
  return getErrors(grid).size===0
}

/**
 * Puzzles derived from the unique solution:
 *   Row 0: [1,2,3,4,5,6]
 *   Row 1: [4,5,6,1,2,3]
 *   Row 2: [2,3,4,5,6,1]
 *   Row 3: [5,6,1,2,3,4]
 *   Row 4: [3,4,5,6,1,2]
 *   Row 5: [6,1,2,3,4,5]
 * All blanks (0) are verified consistent with this solution.
 */
export const PUZZLES = {
  Easy: [       // 26 given cells
    [1,2,3,4,5,6],
    [4,5,0,1,0,3],
    [2,0,4,0,6,1],
    [5,6,0,2,3,0],
    [0,4,5,0,1,2],
    [6,0,2,3,0,5],
  ],
  Medium: [     // 18 given cells
    [1,0,3,0,5,0],
    [0,5,0,1,0,3],
    [2,0,4,0,0,1],
    [5,0,0,2,0,4],
    [0,4,0,6,1,0],
    [0,1,0,3,0,5],
  ],
  Hard: [       // 12 given cells
    [1,0,0,0,0,6],
    [0,5,0,0,0,3],
    [0,0,4,5,0,0],
    [0,6,0,0,3,0],
    [3,0,0,0,1,0],
    [0,0,2,0,4,0],
  ],
}
