export const pieceNames={p:'Bauer',n:'Springer',b:'Läufer',r:'Turm',q:'Dame',k:'König'};
const worth={p:1,n:3,b:3,r:5,q:9,k:100};
const squares=()=>Array.from({length:64},(_,i)=>'abcdefgh'[i%8]+(1+Math.floor(i/8)));
// Attacks are geometric control, including pinned pieces. They are deliberately
// labelled attacks, not forced wins. Pre-move warnings use legal moves instead.
export function attacks(board,attackerColor='b'){
  const result=[];
  for(const to of squares()){
    const victim=board.get(to);
    if(!victim||victim.color===attackerColor)continue;
    for(const from of board.attackers(to,attackerColor)){
      const attacker=board.get(from);
      result.push({from,to,piece:attacker.type,victim:victim.type,value:worth[victim.type],
        defended:board.attackers(to,victim.color).length>0});
    }
  }
  return result.sort((a,b)=>b.value-a.value||a.to.localeCompare(b.to));
}
export function risksAfter(Chess,game,move){
  const next=new Chess(game.fen());next.move(move);
  // A move that ends the game cannot be answered, even if squares are attacked.
  if(next.isGameOver())return [];
  return next.moves({verbose:true}).filter(m=>m.captured&&worth[m.captured]>=3)
    .sort((a,b)=>worth[b.captured]-worth[a.captured])
    .slice(0,3).map(m=>({from:m.from,to:m.to,piece:m.piece,victim:m.captured,
      text:`${pieceNames[m.piece]} auf ${m.from} kann ${pieceNames[m.captured]} auf ${m.to} schlagen.`}));
}
export function describeMove(Chess,move){
  const before=new Chess(move.before),after=new Chess(move.after),color=move.color;
  const actor=color==='w'?'Weiß':'Schwarz';
  const title=`${actor}: ${pieceNames[move.piece]} ${move.from} → ${move.to}`;
  const reasons=[];
  if(move.captured)reasons.push(`Dabei wird ${pieceNames[move.captured]} auf ${move.flags.includes('e')?move.to[0]+move.from[1]:move.to} geschlagen${move.flags.includes('e')?' (en passant)':''}.`);
  if(move.flags.includes('k')||move.flags.includes('q'))reasons.push('Die Rochade bewegt König und Turm: Der König verlässt die Mitte, der Turm kommt näher ins Spiel.');
  if(move.promotion)reasons.push(`Der Bauer wird in ${pieceNames[move.promotion]} umgewandelt.`);
  if(after.isCheckmate())reasons.push('Das ist Schachmatt: Es gibt keinen legalen Zug mehr, der das Schach abwehrt.');
  else if(after.isCheck())reasons.push('Das gibt Schach. Die andere Seite muss zuerst ihren König schützen; ein eigener Angriff muss warten.');
  const previous=new Set(attacks(before,color).map(a=>a.from+':'+a.to));
  const fresh=attacks(after,color).filter(a=>!previous.has(a.from+':'+a.to));
  const direct=fresh.filter(a=>a.from===move.to);
  const forks=[...new Set(direct.filter(a=>a.value>=3).map(a=>a.to))];
  if(forks.length>=2)reasons.push(`Die gezogene Figur greift gleichzeitig mehrere wichtige Ziele an: ${forks.join(' und ')}. Das ist eine Gabel – prüfe, ob du beide Ziele schützen oder den Angreifer ausschalten kannst.`);
  else if(direct.length){
    const t=direct[0];reasons.push(`Von dort greift ${pieceNames[t.piece]} ${pieceNames[t.victim]} auf ${t.to} an. ${t.defended?'Das Ziel ist gedeckt; ein Tausch muss trotzdem geprüft werden.':'Das Ziel ist geometrisch nicht durch eine eigene Figur gedeckt.'}`);
  }
  const discovered=fresh.find(a=>a.from!==move.to&&a.value>=3);
  if(discovered)reasons.push(`Außerdem ist ein neuer Angriff von ${pieceNames[discovered.piece]} auf ${discovered.from} gegen ${pieceNames[discovered.victim]} auf ${discovered.to} sichtbar. Der Zug hat die Angriffsverhältnisse verändert.`);
  if(!reasons.length){
    if(['n','b'].includes(move.piece)&&move.from[1]===(color==='w'?'1':'8'))
      reasons.push('Eine Leichtfigur verlässt ihre Grundreihe und kann auf neuen Feldern mitspielen. Das ist ein Entwicklungszug.');
    else if(move.piece==='p'&&['d4','e4','d5','e5'].includes(move.to))
      reasons.push('Der Bauer besetzt ein Zentrumsfeld und verändert, welche Felder für die anderen Figuren zugänglich sind.');
    else reasons.push('Die Figur wechselt ihre Stellung. Ein eindeutiges taktisches Motiv wird hier nicht erkannt. Die Beispielvariante zeigt eine berechnete Möglichkeit, wie es weitergehen könnte.');
  }
  return {title,text:reasons.join(' '),arrows:[{from:move.from,to:move.to,kind:'move'},...fresh.slice(0,3).map(a=>({...a,kind:'threat'}))]};
}
export function buildLine(Chess,fen,uciMoves){
  const board=new Chess(fen),steps=[];
  for(const uci of uciMoves.slice(0,6)){
    if(board.isGameOver())break;
    try{
      const move=board.move({from:uci.slice(0,2),to:uci.slice(2,4),...(uci[4]?{promotion:uci[4]}:{})});
      steps.push({move,fen:board.fen(),...describeMove(Chess,move)});
    }catch{break;}
  }
  return steps;
}
