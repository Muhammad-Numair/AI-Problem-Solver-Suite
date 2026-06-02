const WINS = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

export function checkWinner(board) {
  for(const [a,b,c] of WINS)
    if(board[a]&&board[a]===board[b]&&board[a]===board[c]) return { winner:board[a], line:[a,b,c] }
  return null
}

export function isFull(board){ return board.every(c=>c!=='') }
export function isDraw(board){ return !checkWinner(board)&&isFull(board) }

// ── Minimax ───────────────────────────────────────────────────────────────────
export function minimax(board, depth, isMax, ai='O', human='X') {
  const w=checkWinner(board)
  if(w?.winner===ai)    return 10-depth
  if(w?.winner===human) return depth-10
  if(isFull(board))     return 0

  let best=isMax?-Infinity:Infinity
  for(let i=0;i<9;i++){
    if(board[i]!=='')continue
    board[i]=isMax?ai:human
    const s=minimax(board,depth+1,!isMax,ai,human)
    board[i]=''
    best=isMax?Math.max(best,s):Math.min(best,s)
  }
  return best
}

// ── Alpha‑Beta ────────────────────────────────────────────────────────────────
export function alphaBeta(board, depth, alpha, beta, isMax, ai='O', human='X') {
  const w=checkWinner(board)
  if(w?.winner===ai)    return 10-depth
  if(w?.winner===human) return depth-10
  if(isFull(board))     return 0

  if(isMax){
    let best=-Infinity
    for(let i=0;i<9;i++){
      if(board[i]!=='')continue
      board[i]=ai
      best=Math.max(best,alphaBeta(board,depth+1,alpha,beta,false,ai,human))
      board[i]=''
      alpha=Math.max(alpha,best)
      if(beta<=alpha)break
    }
    return best
  } else {
    let best=Infinity
    for(let i=0;i<9;i++){
      if(board[i]!=='')continue
      board[i]=human
      best=Math.min(best,alphaBeta(board,depth+1,alpha,beta,true,ai,human))
      board[i]=''
      beta=Math.min(beta,best)
      if(beta<=alpha)break
    }
    return best
  }
}

// ── Best move ─────────────────────────────────────────────────────────────────
export function bestMove(board, ai='O', human='X', useAB=true) {
  const empty=board.map((v,i)=>v===''?i:-1).filter(i=>i>=0)
  if(!empty.length)return -1

  let bestScore=-Infinity, move=empty[0]
  const b=[...board]
  for(const i of empty){
    b[i]=ai
    const s=useAB
      ? alphaBeta(b,0,-Infinity,Infinity,false,ai,human)
      : minimax(b,0,false,ai,human)
    b[i]=''
    if(s>bestScore){ bestScore=s; move=i }
  }
  return move
}

// ── AI move by difficulty ─────────────────────────────────────────────────────
export function aiMove(board, difficulty, useAB=true, ai='O', human='X') {
  const empty=board.map((v,i)=>v===''?i:-1).filter(i=>i>=0)
  if(!empty.length)return -1
  if(difficulty==='Easy') return empty[Math.floor(Math.random()*empty.length)]
  if(difficulty==='Medium'&&Math.random()<.5) return empty[Math.floor(Math.random()*empty.length)]
  return bestMove(board,ai,human,useAB)
}
