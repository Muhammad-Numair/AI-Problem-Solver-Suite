// ── Min‑Heap (local copy) ─────────────────────────────────────────────────────
class MinHeap {
  constructor(){ this.h=[] }
  push(v){ this.h.push(v); this._up(this.h.length-1) }
  pop(){
    if(!this.h.length)return undefined
    const top=this.h[0],last=this.h.pop()
    if(this.h.length){this.h[0]=last;this._down(0)}
    return top
  }
  get size(){ return this.h.length }
  _cmp(a,b){ return a[0]-b[0]||a[1]-b[1] }
  _up(i){ while(i>0){const p=i-1>>1;if(this._cmp(this.h[p],this.h[i])<=0)break;[this.h[p],this.h[i]]=[this.h[i],this.h[p]];i=p} }
  _down(i){ const n=this.h.length;while(true){let s=i,l=2*i+1,r=2*i+2;if(l<n&&this._cmp(this.h[l],this.h[s])<0)s=l;if(r<n&&this._cmp(this.h[r],this.h[s])<0)s=r;if(s===i)break;[this.h[i],this.h[s]]=[this.h[s],this.h[i]];i=s} }
}

// ── Goal state ────────────────────────────────────────────────────────────────
export function goalState(size) {
  const n=size*size
  return [...Array(n-1).keys()].map(i=>i+1).concat(0)
}

// ── Shuffle (random walk — always solvable) ───────────────────────────────────
export function shuffle(state, size, moves=120) {
  state=[...state]; let prev=-1
  for(let m=0;m<moves;m++){
    const blank=state.indexOf(0)
    const nb=neighbors(blank,size).filter(n=>n!==prev)
    const sw=nb[Math.floor(Math.random()*nb.length)]
    ;[state[blank],state[sw]]=[state[sw],state[blank]]
    prev=blank
  }
  return state
}

function neighbors(idx,size){
  const r=Math.floor(idx/size),c=idx%size,res=[]
  if(r>0)res.push(idx-size); if(r<size-1)res.push(idx+size)
  if(c>0)res.push(idx-1);    if(c<size-1)res.push(idx+1)
  return res
}

// ── Heuristics ────────────────────────────────────────────────────────────────
function manhattanH(state,size){
  let d=0
  for(let i=0;i<state.length;i++){
    const v=state[i]; if(!v)continue
    const gr=Math.floor((v-1)/size),gc=(v-1)%size
    const cr=Math.floor(i/size),cc=i%size
    d+=Math.abs(cr-gr)+Math.abs(cc-gc)
  }
  return d
}

function misplacedH(state,goal){
  let c=0
  for(let i=0;i<state.length;i++) if(state[i]&&state[i]!==goal[i])c++
  return c
}

// ── A* Solver ─────────────────────────────────────────────────────────────────
export function solveAstar(startState, size, heuristic='Manhattan') {
  const t0=performance.now()
  const goal=goalState(size)
  const goalKey=goal.join(',')
  const h = heuristic==='Manhattan'
    ? s=>manhattanH(s,size)
    : s=>misplacedH(s,goal)

  const heap=new MinHeap()
  let counter=0
  heap.push([h(startState),counter++,0,startState,null])

  const best=new Map([[startState.join(','),0]])
  const prev=new Map()
  let nodes=0

  while(heap.size){
    const [,, g, state, parentKey]=heap.pop()
    const key=state.join(',')
    if(best.has(key)&&best.get(key)<g)continue
    nodes++
    if(key===goalKey){
      // Reconstruct path
      const path=[state]; let k=prev.get(key)
      while(k){ const s=k.split(',').map(Number); path.unshift(s); k=prev.get(k) }
      return { path, nodes, ms:performance.now()-t0 }
    }
    const blank=state.indexOf(0)
    for(const nb of neighbors(blank,size)){
      const ns=[...state];[ns[blank],ns[nb]]=[ns[nb],ns[blank]]
      const nk=ns.join(','), ng=g+1
      if(ng<(best.get(nk)??Infinity)){
        best.set(nk,ng); prev.set(nk,key)
        heap.push([ng+h(ns),counter++,ng,ns,key])
      }
    }
  }
  return { path:[], nodes, ms:performance.now()-t0 }
}

export function puzzleNeighbors(idx, size) { return neighbors(idx, size) }
