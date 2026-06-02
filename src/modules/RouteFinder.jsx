import { useState, useRef, useCallback } from 'react'
import { loadDemoGraph, generateRandomGraph, dijkstra, astarGraph } from '../algorithms/graphAlgo.js'
import StatCard from '../components/StatCard.jsx'

export default function RouteFinder({ onStatus }) {
  const [graph,      setGraph]     = useState(null)
  const [algo,       setAlgo]      = useState('Dijkstra')
  const [nodeCount,  setNodeCount] = useState(10)
  const [startNode,  setStart]     = useState(null)
  const [goalNode,   setGoal]      = useState(null)
  const [pickMode,   setPickMode]  = useState(null)  // 'start'|'goal'|null
  const [revealed,   setRevealed]  = useState(0)
  const [fullPath,   setFullPath]  = useState([])
  const [stats,      setStats]     = useState(null)
  const [pathInfo,   setPathInfo]  = useState([])
  const timerRef = useRef(null)

  const SVG_W=620, SVG_H=440

  // Scale node positions to SVG viewport
  const scalePos = useCallback((graph) => {
    if(!graph) return new Map()
    const xs=[...graph.positions.values()].map(([x])=>x)
    const ys=[...graph.positions.values()].map(([,y])=>y)
    const minX=Math.min(...xs),maxX=Math.max(...xs)
    const minY=Math.min(...ys),maxY=Math.max(...ys)
    const padX=50, padY=40
    const scaleX=(SVG_W-2*padX)/(maxX-minX||1)
    const scaleY=(SVG_H-2*padY)/(maxY-minY||1)
    const scaled=new Map()
    graph.positions.forEach(([x,y],n)=>{
      scaled.set(n,[padX+(x-minX)*scaleX, padY+(y-minY)*scaleY])
    })
    return scaled
  }, [])

  const loadDemo = () => {
    clearInterval(timerRef.current)
    const g = loadDemoGraph()
    setGraph(g); setStart('Lahore'); setGoal('Karachi')
    setRevealed(0); setFullPath([]); setStats(null); setPathInfo([])
    onStatus('Demo graph loaded — Pakistani cities.')
  }

  const loadRandom = () => {
    clearInterval(timerRef.current)
    const g = generateRandomGraph(nodeCount, SVG_W-40, SVG_H-40)
    const names = g.nodes
    setGraph(g); setStart(names[0]); setGoal(names[names.length-1])
    setRevealed(0); setFullPath([]); setStats(null); setPathInfo([])
    onStatus(`Random graph with ${nodeCount} nodes generated.`)
  }

  const handleNodeClick = (name) => {
    if(pickMode==='start'){ setStart(name); setPickMode(null); onStatus(`Start set to ${name}.`) }
    else if(pickMode==='goal'){ setGoal(name); setPickMode(null); onStatus(`Goal set to ${name}.`) }
  }

  const solve = () => {
    if(!graph||!startNode||!goalNode) return
    clearInterval(timerRef.current)
    setRevealed(0); setFullPath([]); setPathInfo([])

    const pos = scalePos(graph)
    const result = algo==='A*'
      ? astarGraph(graph.adj, pos, startNode, goalNode)
      : dijkstra(graph.adj, startNode, goalNode)

    setStats({ nodes:result.nodes, cost:result.cost===Infinity?'∞':Math.round(result.cost), ms:result.ms.toFixed(2), hops:result.path.length-1 })

    if(!result.path.length){ onStatus('No route found.'); return }

    // Build path info
    let total=0
    const info = result.path.map((n,i)=>{
      if(i===0) return `📍 ${n} (start)`
      const w=Math.round(graph.edges.get(`${result.path[i-1]}|${n}`)||0)
      total+=w
      return `→ ${n}  (+${w}, total ${total})`
    })
    setPathInfo(info)
    setFullPath(result.path)
    setRevealed(1)
    timerRef.current = setInterval(()=>{
      setRevealed(r=>{
        if(r>=result.path.length){ clearInterval(timerRef.current); return r }
        return r+1
      })
    }, 500)
    onStatus(`Route: ${result.path.join(' → ')}  |  Cost=${Math.round(result.cost)}`)
  }

  const pos = graph ? scalePos(graph) : new Map()
  const revealedSet = new Set(fullPath.slice(0,revealed))
  const revealedEdges = new Set(fullPath.slice(0,revealed).flatMap((_,i,a)=>i?[`${a[i-1]}|${a[i]}`,`${a[i]}|${a[i-1]}`]:[]))

  return (
    <div className="module">
      {/* SVG Graph */}
      <div className="module-viz">
        <div style={{flex:1,minHeight:0,position:'relative'}}>
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="graph-svg">
            {/* Edges */}
            {graph && [...graph.edges.entries()].filter(([k])=>k.indexOf('|')>0&&k<k.split('|').reverse().join('|')).map(([k,w])=>{
              const [a,b]=k.split('|')
              if(!pos.has(a)||!pos.has(b))return null
              const [ax,ay]=pos.get(a),[bx,by]=pos.get(b)
              const inPath=revealedEdges.has(k)||revealedEdges.has(`${b}|${a}`)
              return <g key={k}>
                <line x1={ax} y1={ay} x2={bx} y2={by} stroke={inPath?'#3FB950':'#30363D'} strokeWidth={inPath?2.5:1.2}/>
                {!inPath&&<text x={(ax+bx)/2} y={(ay+by)/2-3} fill="#484F58" fontSize="9" textAnchor="middle">{w}</text>}
                {inPath&&<text x={(ax+bx)/2} y={(ay+by)/2-3} fill="#3FB950" fontSize="10" fontWeight="bold" textAnchor="middle">{w}</text>}
              </g>
            })}
            {/* Nodes */}
            {graph && [...pos.entries()].map(([name,[x,y]])=>{
              const isStart=name===startNode, isGoal=name===goalNode
              const inPath=revealedSet.has(name)
              const fill=isStart?'#3FB950':isGoal?'#E3B341':inPath?'#F78166':'#1C2128'
              const stroke=isStart?'#3FB950':isGoal?'#E3B341':'#58A6FF'
              const picking=pickMode==='start'||pickMode==='goal'
              return <g key={name} style={{cursor:picking?'crosshair':'pointer'}} onClick={()=>handleNodeClick(name)}>
                <circle cx={x} cy={y} r={14} fill={fill} stroke={stroke} strokeWidth={2}/>
                <text x={x} y={y+4} fill="#E6EDF3" fontSize="9" fontWeight="bold" textAnchor="middle">{name.slice(0,8)}</text>
              </g>
            })}
          </svg>
          {pickMode && (
            <div style={{position:'absolute',top:8,left:8,background:'#1F6FEB',color:'#fff',padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:700}}>
              Click a node to set {pickMode} ✦
            </div>
          )}
        </div>
        {stats && (
          <div className="stat-row" style={{marginTop:10}}>
            <StatCard label="Explored" value={stats.nodes} color="#3FB950"/>
            <StatCard label="Cost"     value={stats.cost}  color="#E3B341"/>
            <StatCard label="Hops"     value={stats.hops}  color="#BC8CFF"/>
            <StatCard label="Time(ms)" value={stats.ms}    color="#58A6FF"/>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="module-ctrl">
        <h3 style={{color:'#3FB950',fontWeight:700,fontSize:16}}>🗺️ Route Finder</h3>

        <div className="grp"><div className="grp-title">Algorithm</div>
          <select value={algo} onChange={e=>setAlgo(e.target.value)}>
            <option>Dijkstra</option><option>A*</option>
          </select>
        </div>

        <div className="grp"><div className="grp-title">Graph</div>
          <div className="flex-col">
            <button className="btn btn-sm btn-block" onClick={loadDemo}>🏙️  Load Demo (Cities)</button>
            <div className="row">
              <label>Nodes:</label>
              <input type="number" min={4} max={30} value={nodeCount}
                onChange={e=>setNodeCount(Number(e.target.value))} style={{width:60}}/>
              <button className="btn btn-sm" onClick={loadRandom}>🎲 Random</button>
            </div>
          </div>
        </div>

        <div className="grp"><div className="grp-title">Select Nodes (click graph)</div>
          <div className="flex-col">
            <button className={`btn btn-sm btn-block${pickMode==='start'?' btn-success':''}`}
              onClick={()=>setPickMode('start')}>📍  Pick Start Node</button>
            <button className={`btn btn-sm btn-block${pickMode==='goal'?' btn-success':''}`}
              onClick={()=>setPickMode('goal')}>🏁  Pick Goal Node</button>
            <div className="muted" style={{color:'#3FB950'}}>Start: {startNode||'—'}</div>
            <div className="muted" style={{color:'#E3B341'}}>Goal:  {goalNode||'—'}</div>
          </div>
        </div>

        <button className="btn btn-primary btn-block" onClick={solve} disabled={!graph||!startNode||!goalNode}>
          ▶  Find Route
        </button>

        {pathInfo.length>0 && (
          <div className="grp"><div className="grp-title">Path</div>
            <ul className="path-list">
              {pathInfo.map((l,i)=><li key={i}>{l}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
