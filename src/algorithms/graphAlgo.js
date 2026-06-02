// ── Min‑Heap ──────────────────────────────────────────────────────────────────
class MinHeap {
  constructor(){ this.h=[] }
  push(v){ this.h.push(v);this._up(this.h.length-1) }
  pop(){ if(!this.h.length)return; const t=this.h[0],l=this.h.pop(); if(this.h.length){this.h[0]=l;this._down(0)} return t }
  get size(){ return this.h.length }
  _cmp(a,b){ return a[0]-b[0]||a[1]-b[1] }
  _up(i){ while(i>0){const p=i-1>>1;if(this._cmp(this.h[p],this.h[i])<=0)break;[this.h[p],this.h[i]]=[this.h[i],this.h[p]];i=p} }
  _down(i){ const n=this.h.length;while(true){let s=i,l=2*i+1,r=2*i+2;if(l<n&&this._cmp(this.h[l],this.h[s])<0)s=l;if(r<n&&this._cmp(this.h[r],this.h[s])<0)s=r;if(s===i)break;[this.h[i],this.h[s]]=[this.h[s],this.h[i]];i=s} }
}

// ── Dijkstra ──────────────────────────────────────────────────────────────────
export function dijkstra(adj, start, goal) {
  const t0=performance.now()
  const dist=new Map([[start,0]]), prev=new Map([[start,null]])
  const heap=new MinHeap(), visited=new Set()
  let counter=0, nodes=0
  heap.push([0,counter++,start])

  while(heap.size){
    const [d,,node]=heap.pop()
    if(visited.has(node))continue
    visited.add(node); nodes++
    if(node===goal){
      return { path:buildPath(prev,goal), cost:d, nodes, ms:performance.now()-t0 }
    }
    for(const [nb,w] of (adj.get(node)||[])){
      const nd=d+w
      if(nd<(dist.get(nb)??Infinity)){
        dist.set(nb,nd); prev.set(nb,node)
        heap.push([nd,counter++,nb])
      }
    }
  }
  return { path:[], cost:Infinity, nodes, ms:performance.now()-t0 }
}

// ── A* on graph ───────────────────────────────────────────────────────────────
export function astarGraph(adj, positions, start, goal) {
  const t0=performance.now()
  const h=n=>{ if(!positions.has(n)||!positions.has(goal))return 0; const [ax,ay]=positions.get(n),[bx,by]=positions.get(goal); return Math.hypot(ax-bx,ay-by) }
  const dist=new Map([[start,0]]), prev=new Map([[start,null]])
  const heap=new MinHeap(), visited=new Set()
  let counter=0, nodes=0
  heap.push([h(start),counter++,0,start])

  while(heap.size){
    const [,, g, node]=heap.pop()
    if(visited.has(node))continue
    visited.add(node); nodes++
    if(node===goal){
      return { path:buildPath(prev,goal), cost:g, nodes, ms:performance.now()-t0 }
    }
    for(const [nb,w] of (adj.get(node)||[])){
      const ng=g+w
      if(ng<(dist.get(nb)??Infinity)){
        dist.set(nb,ng); prev.set(nb,node)
        heap.push([ng+h(nb),counter++,ng,nb])
      }
    }
  }
  return { path:[], cost:Infinity, nodes, ms:performance.now()-t0 }
}

function buildPath(prev, goal) {
  const path=[]; let n=goal
  while(n!==null){ path.push(n); n=prev.get(n) }
  return path.reverse()
}

// ── Demo graph (Pakistani cities) ─────────────────────────────────────────────
export function loadDemoGraph() {
  const nodes=new Map([
    ['Lahore',[200,150]],['Islamabad',[300,80]],['Karachi',[150,420]],
    ['Quetta',[80,300]],['Peshawar',[270,50]],['Multan',[190,280]],
    ['Faisalabad',[210,200]],['Rawalpindi',[295,95]],
    ['Hyderabad',[180,390]],['Sukkur',[160,330]],
  ])
  const edgeList=[
    ['Lahore','Islamabad',375],['Lahore','Faisalabad',128],['Lahore','Multan',340],
    ['Islamabad','Peshawar',170],['Islamabad','Rawalpindi',14],['Rawalpindi','Peshawar',170],
    ['Multan','Quetta',560],['Multan','Sukkur',390],['Multan','Faisalabad',265],
    ['Sukkur','Quetta',480],['Sukkur','Hyderabad',320],['Hyderabad','Karachi',165],
    ['Karachi','Quetta',695],['Faisalabad','Islamabad',278],
  ]
  return buildGraph(nodes, edgeList)
}

// ── Random graph ──────────────────────────────────────────────────────────────
export function generateRandomGraph(n, W=600, H=420) {
  if(n<2)n=2
  // Node labels
  const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const label=i=>i<26?alpha[i]:alpha[Math.floor(i/26)-1]+alpha[i%26]

  // Place in jittered grid
  const cols=Math.ceil(Math.sqrt(n)), rows=Math.ceil(n/cols)
  const mx=60, cw=(W-2*mx)/Math.max(cols-1,1), ch=(H-2*mx)/Math.max(rows-1,1)
  const names=[], positions=new Map()
  for(let i=0;i<n;i++){
    const r=Math.floor(i/cols), c=i%cols
    const jx=cw>4?(Math.random()-.5)*cw*.4:0
    const jy=ch>4?(Math.random()-.5)*ch*.4:0
    const x=mx+c*cw+jx, y=mx+r*ch+jy
    names.push(label(i)); positions.set(label(i),[x,y])
  }

  // Spanning tree (Prim's random) → guarantees connectivity
  const edgeList=[], connected=new Set([0]), unconn=new Set([...Array(n).keys()].slice(1))
  while(unconn.size){
    const a=names[[...connected][Math.floor(Math.random()*connected.size)]]
    const bi=[...unconn][Math.floor(Math.random()*unconn.size)]
    const b=names[bi]
    const [ax,ay]=positions.get(a),[bx,by]=positions.get(b)
    const w=Math.round(Math.hypot(ax-bx,ay-by)*(.8+Math.random()*.7))
    edgeList.push([a,b,Math.max(10,w)])
    connected.add(bi); unconn.delete(bi)
  }

  // Extra random edges
  const edgeSet=new Set(edgeList.map(([a,b])=>[a,b].sort().join('|')))
  const extra=Math.min(n, Math.floor(n*1.2))
  for(let t=0;t<extra*8&&edgeList.length-n+1<extra;t++){
    const ai=Math.floor(Math.random()*n), bi=Math.floor(Math.random()*n)
    if(ai===bi)continue
    const a=names[ai],b=names[bi], key=[a,b].sort().join('|')
    if(edgeSet.has(key))continue
    const [ax,ay]=positions.get(a),[bx,by]=positions.get(b)
    const w=Math.round(Math.hypot(ax-bx,ay-by)*(.7+Math.random()*.8))
    edgeList.push([a,b,Math.max(10,w)]); edgeSet.add(key)
  }

  return buildGraph(positions, edgeList)
}

function buildGraph(positions, edgeList) {
  const adj=new Map()
  for(const n of positions.keys()) adj.set(n,[])
  const edges=new Map()
  for(const [a,b,w] of edgeList){
    adj.get(a)?.push([b,w]); adj.get(b)?.push([a,w])
    edges.set(`${a}|${b}`,w); edges.set(`${b}|${a}`,w)
  }
  return { positions, adj, edges, nodes:[...positions.keys()] }
}
