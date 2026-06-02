/**
 * puzzleSolver.js  —  Web Worker
 *
 * WHY A WEB WORKER?
 * -----------------
 * JavaScript is single-threaded. A* on a 5×5 puzzle can explore millions of
 * states, each taking ~1µs → seconds of blocked main thread → frozen UI.
 * Running in a Worker gives A* its own thread so the page stays interactive.
 *
 * ALGORITHM
 * ---------
 * • 3×3  : plain A*        (typically < 50 ms)
 * • 4×4  : A* + 8-sec cap  (usually solvable; warns if timeout)
 * • 5×5+ : IDA*             (memory-efficient; still capped at 12 sec)
 *
 * MESSAGES SENT BACK
 * ------------------
 * { type:'progress', nodes, elapsed }   — every 20 000 nodes
 * { type:'done',     path, nodes, ms }  — solution found
 * { type:'timeout',  nodes, ms }        — time limit exceeded
 */

// ── MinHeap ───────────────────────────────────────────────────────────────────
class MinHeap {
  constructor() { this.h = [] }
  push(v)  { this.h.push(v); this._up(this.h.length-1) }
  pop()    {
    if(!this.h.length) return
    const t=this.h[0], l=this.h.pop()
    if(this.h.length){ this.h[0]=l; this._down(0) }
    return t
  }
  get size(){ return this.h.length }
  _cmp(a,b){ return a[0]-b[0]||a[1]-b[1] }
  _up(i)  { while(i>0){const p=i-1>>1;if(this._cmp(this.h[p],this.h[i])<=0)break;[this.h[p],this.h[i]]=[this.h[i],this.h[p]];i=p} }
  _down(i){ const n=this.h.length;while(true){let s=i,l=2*i+1,r=2*i+2;if(l<n&&this._cmp(this.h[l],this.h[s])<0)s=l;if(r<n&&this._cmp(this.h[r],this.h[s])<0)s=r;if(s===i)break;[this.h[i],this.h[s]]=[this.h[s],this.h[i]];i=s} }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function goalState(size) {
  const n = size*size
  return [...Array(n-1).keys()].map(i=>i+1).concat(0)
}

function neighbors(idx, size) {
  const r=Math.floor(idx/size), c=idx%size, res=[]
  if(r>0)       res.push(idx-size)
  if(r<size-1)  res.push(idx+size)
  if(c>0)       res.push(idx-1)
  if(c<size-1)  res.push(idx+1)
  return res
}

function manhattanH(state, size) {
  let d=0
  for(let i=0;i<state.length;i++){
    const v=state[i]; if(!v) continue
    const gr=Math.floor((v-1)/size), gc=(v-1)%size
    const cr=Math.floor(i/size),     cc=i%size
    d += Math.abs(cr-gr)+Math.abs(cc-gc)
  }
  return d
}

function misplacedH(state, goal) {
  let c=0
  for(let i=0;i<state.length;i++) if(state[i] && state[i]!==goal[i]) c++
  return c
}

// ── A* (for 3×3 and 4×4) ──────────────────────────────────────────────────────
function solveAstar(startState, size, hFn, timeLimitMs) {
  const t0     = performance.now()
  const goal   = goalState(size)
  const goalKey= goal.join(',')
  const heap   = new MinHeap()
  let counter  = 0
  heap.push([hFn(startState), counter++, 0, startState])

  const best  = new Map([[startState.join(','), 0]])
  const prev  = new Map()
  let nodes   = 0

  while(heap.size) {
    const elapsed = performance.now()-t0
    if(elapsed > timeLimitMs) return { timeout:true, nodes, ms:elapsed }

    const [, , g, state] = heap.pop()
    const key = state.join(',')
    if((best.get(key)??Infinity) < g) continue
    nodes++

    // Progress every 20k nodes
    if(nodes % 20000 === 0) self.postMessage({ type:'progress', nodes, elapsed })

    if(key === goalKey) {
      const path=[state]; let k=prev.get(key)
      while(k){ path.unshift(k.split(',').map(Number)); k=prev.get(k) }
      return { path, nodes, ms:performance.now()-t0 }
    }

    const blank = state.indexOf(0)
    for(const nb of neighbors(blank, size)) {
      const ns=[...state]; [ns[blank],ns[nb]]=[ns[nb],ns[blank]]
      const nk=ns.join(','), ng=g+1
      if(ng < (best.get(nk)??Infinity)) {
        best.set(nk, ng); prev.set(nk, key)
        heap.push([ng + hFn(ns), counter++, ng, ns])
      }
    }
  }
  return { path:[], nodes, ms:performance.now()-t0 }
}

// ── IDA* (for 5×5+, memory-efficient) ────────────────────────────────────────
function solveIDAStar(startState, size, hFn, timeLimitMs) {
  const t0   = performance.now()
  const goal = goalState(size)
  const goalKey = goal.join(',')
  let nodes  = 0
  let threshold = hFn(startState)
  const path = [startState]
  const inPath = new Set([startState.join(',')])

  const FOUND = -1

  function search(g, bound) {
    const state = path[path.length-1]
    const f = g + hFn(state)
    if(f > bound) return f
    if(state.join(',') === goalKey) return FOUND

    const elapsed = performance.now()-t0
    if(elapsed > timeLimitMs) return Infinity   // signal timeout

    nodes++
    if(nodes % 20000 === 0) self.postMessage({ type:'progress', nodes, elapsed })

    let min = Infinity
    const blank = state.indexOf(0)
    for(const nb of neighbors(blank, size)) {
      const ns=[...state]; [ns[blank],ns[nb]]=[ns[nb],ns[blank]]
      const nk=ns.join(',')
      if(inPath.has(nk)) continue
      path.push(ns); inPath.add(nk)
      const t = search(g+1, bound)
      if(t === FOUND) return FOUND
      if(t < min) min = t
      path.pop(); inPath.delete(nk)
    }
    return min
  }

  while(true) {
    const t = search(0, threshold)
    if(t === FOUND) return { path:[...path], nodes, ms:performance.now()-t0 }
    if(t === Infinity) return { timeout:true, nodes, ms:performance.now()-t0 }
    threshold = t
  }
}

// ── Entry point ───────────────────────────────────────────────────────────────
self.onmessage = function(e) {
  const { state, size, heuristic } = e.data
  const goal = goalState(size)
  const hFn  = heuristic === 'Misplaced Tiles'
    ? s => misplacedH(s, goal)
    : s => manhattanH(s, size)

  // Choose algorithm and time limit by puzzle size
  const useIDA    = size >= 5
  const timeLimit = size <= 3 ? 5000 : size === 4 ? 10000 : 15000

  self.postMessage({ type:'start', useIDA, timeLimit })

  const result = useIDA
    ? solveIDAStar(state, size, hFn, timeLimit)
    : solveAstar(state, size, hFn, timeLimit)

  if(result.timeout) {
    self.postMessage({ type:'timeout', nodes:result.nodes, ms:result.ms })
  } else {
    self.postMessage({ type:'done', path:result.path, nodes:result.nodes, ms:result.ms })
  }
}
