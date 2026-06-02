// ── Min‑Heap ─────────────────────────────────────────────────────────────────
class MinHeap {
  constructor(cmp = (a,b) => a[0]-b[0]) { this.h=[]; this.cmp=cmp }
  push(v){ this.h.push(v); this._up(this.h.length-1) }
  pop(){
    if(!this.h.length) return undefined
    const top=this.h[0], last=this.h.pop()
    if(this.h.length){ this.h[0]=last; this._down(0) }
    return top
  }
  get size(){ return this.h.length }
  _up(i){ while(i>0){ const p=i-1>>1; if(this.cmp(this.h[p],this.h[i])<=0)break; [this.h[p],this.h[i]]=[this.h[i],this.h[p]]; i=p } }
  _down(i){ const n=this.h.length; while(true){ let s=i,l=2*i+1,r=2*i+2; if(l<n&&this.cmp(this.h[l],this.h[s])<0)s=l; if(r<n&&this.cmp(this.h[r],this.h[s])<0)s=r; if(s===i)break; [this.h[i],this.h[s]]=[this.h[s],this.h[i]]; i=s } }
}

// ── Maze Generation (Recursive Backtracker) ──────────────────────────────────
export function generateMaze(rows, cols) {
  // ensure odd dimensions
  rows = rows%2===0 ? rows+1 : rows
  cols = cols%2===0 ? cols+1 : cols
  const W=1, E=0, S=2, G=3
  const grid = Array.from({length:rows}, ()=>Array(cols).fill(W))

  const start = [1,1], goal = [rows-2, cols-2]
  grid[1][1] = E

  const stack = [[1,1]]
  const visited = new Set(['1,1'])

  while(stack.length){
    const [r,c] = stack[stack.length-1]
    const dirs = [[-2,0],[2,0],[0,-2],[0,2]]
      .map(([dr,dc])=>([r+dr,c+dc,r+dr/2,c+dc/2]))
      .filter(([nr,nc])=>nr>0&&nr<rows-1&&nc>0&&nc<cols-1&&!visited.has(`${nr},${nc}`))

    if(dirs.length){
      const [nr,nc,wr,wc] = dirs[Math.floor(Math.random()*dirs.length)]
      grid[wr][wc]=E; grid[nr][nc]=E
      visited.add(`${nr},${nc}`)
      stack.push([nr,nc])
    } else stack.pop()
  }

  grid[start[0]][start[1]] = S
  grid[goal[0]][goal[1]]   = G
  return { grid, rows, cols, start, goal, W, E, S, G }
}

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]]

function passable(grid, r, c) {
  return grid[r]?.[c] !== 1
}

function reconstruct(prev, goal) {
  const path=[]; let k=`${goal[0]},${goal[1]}`
  while(k){ path.push(k.split(',').map(Number)); k=prev.get(k) }
  return path.reverse()
}

// ── BFS ──────────────────────────────────────────────────────────────────────
export function bfs(maze, start, goal) {
  const t0=performance.now()
  const queue=[start], prev=new Map([[`${start}`,null]])
  const visited=[]

  while(queue.length){
    const [r,c]=queue.shift()
    const key=`${r},${c}`
    visited.push([r,c])
    if(r===goal[0]&&c===goal[1]){
      return { path:reconstruct(prev,goal), visited, nodes:visited.length, ms:performance.now()-t0 }
    }
    for(const [dr,dc] of DIRS){
      const [nr,nc]=[r+dr,c+dc], nk=`${nr},${nc}`
      if(!prev.has(nk)&&passable(maze.grid,nr,nc)){
        prev.set(nk,key); queue.push([nr,nc])
      }
    }
  }
  return { path:[], visited, nodes:visited.length, ms:performance.now()-t0 }
}

// ── DFS ──────────────────────────────────────────────────────────────────────
export function dfs(maze, start, goal) {
  const t0=performance.now()
  const stack=[start], prev=new Map([[`${start}`,null]])
  const visited=[], seen=new Set()

  while(stack.length){
    const [r,c]=stack.pop(), key=`${r},${c}`
    if(seen.has(key))continue; seen.add(key)
    visited.push([r,c])
    if(r===goal[0]&&c===goal[1]){
      return { path:reconstruct(prev,goal), visited, nodes:visited.length, ms:performance.now()-t0 }
    }
    for(const [dr,dc] of DIRS){
      const [nr,nc]=[r+dr,c+dc], nk=`${nr},${nc}`
      if(!prev.has(nk)&&passable(maze.grid,nr,nc)){
        prev.set(nk,key); stack.push([nr,nc])
      }
    }
  }
  return { path:[], visited, nodes:visited.length, ms:performance.now()-t0 }
}

// ── Heuristics ────────────────────────────────────────────────────────────────
const manhattan  = ([r1,c1],[r2,c2]) => Math.abs(r1-r2)+Math.abs(c1-c2)
const euclidean  = ([r1,c1],[r2,c2]) => Math.hypot(r1-r2,c1-c2)
export const getH = h => h==='Euclidean' ? euclidean : manhattan

// ── A* ────────────────────────────────────────────────────────────────────────
export function astar(maze, start, goal, hName='Manhattan') {
  const t0=performance.now(), h=getH(hName)
  const heap=new MinHeap(), prev=new Map([[`${start}`,null]])
  const g=new Map([[`${start}`,0]]), visited=[], seen=new Set()
  heap.push([h(start,goal),0,start])

  while(heap.size){
    const [,gc,cur]=heap.pop(), key=`${cur}`
    if(seen.has(key))continue; seen.add(key)
    visited.push(cur)
    if(cur[0]===goal[0]&&cur[1]===goal[1]){
      return { path:reconstruct(prev,goal), visited, nodes:visited.length, ms:performance.now()-t0 }
    }
    for(const [dr,dc] of DIRS){
      const nb=[cur[0]+dr,cur[1]+dc], nk=`${nb}`
      if(!seen.has(nk)&&passable(maze.grid,nb[0],nb[1])){
        const ng=gc+1
        if(ng<(g.get(nk)??Infinity)){
          g.set(nk,ng); prev.set(nk,key)
          heap.push([ng+h(nb,goal),ng,nb])
        }
      }
    }
  }
  return { path:[], visited, nodes:visited.length, ms:performance.now()-t0 }
}

// ── Greedy Best‑First ─────────────────────────────────────────────────────────
export function greedyBFS(maze, start, goal, hName='Manhattan') {
  const t0=performance.now(), h=getH(hName)
  const heap=new MinHeap(), prev=new Map([[`${start}`,null]])
  const visited=[], seen=new Set()
  heap.push([h(start,goal),start])

  while(heap.size){
    const [,cur]=heap.pop(), key=`${cur}`
    if(seen.has(key))continue; seen.add(key)
    visited.push(cur)
    if(cur[0]===goal[0]&&cur[1]===goal[1]){
      return { path:reconstruct(prev,goal), visited, nodes:visited.length, ms:performance.now()-t0 }
    }
    for(const [dr,dc] of DIRS){
      const nb=[cur[0]+dr,cur[1]+dc], nk=`${nb}`
      if(!prev.has(nk)&&passable(maze.grid,nb[0],nb[1])){
        prev.set(nk,key); heap.push([h(nb,goal),nb])
      }
    }
  }
  return { path:[], visited, nodes:visited.length, ms:performance.now()-t0 }
}

export function solveMaze(maze, algo, heuristic) {
  switch(algo){
    case 'DFS':               return dfs(maze, maze.start, maze.goal)
    case 'A*':                return astar(maze, maze.start, maze.goal, heuristic)
    case 'Greedy Best-First': return greedyBFS(maze, maze.start, maze.goal, heuristic)
    default:                  return bfs(maze, maze.start, maze.goal)
  }
}
