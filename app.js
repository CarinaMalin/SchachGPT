import {attacks,risksAfter,describeMove,buildLine} from './training.mjs';
const $ = id => document.getElementById(id);
const names = {p:'Bauer',n:'Springer',b:'Läufer',r:'Turm',q:'Dame',k:'König'};
const symbols = {p:'♟',n:'♞',b:'♝',r:'♜',q:'♛',k:'♚'};
let Chess, game, selected = null, targets = [], worker, ready = false, job = null, generation = 0, noticeTimer, engineTimer;
let trainingMode='guided', overlays=[], pendingMove=null, variation=null;
const key = 'schachgpt-game-v1';
function notice(message) { $('notice').textContent = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(()=>$('notice').textContent='',5500); }
function coach(title,text) { $('coach-title').textContent=title; $('coach-text').textContent=text; }
function persist() {
  try { localStorage.setItem(key,JSON.stringify({pgn:game.pgn(),level:$('level').value,trainingMode})); }
  catch { $('save-status').textContent='Speichern im Browser ist nicht verfügbar. Nutze den Partie-Export.'; }
}
function status() {
  if(game.isCheckmate()) return game.turn()==='w'?'Schachmatt – Schwarz gewinnt. Eine neue Idee wartet in der nächsten Partie.':'Schachmatt – du hast gewonnen!';
  if(game.isStalemate()) return 'Patt – die Partie endet remis.';
  if(game.isThreefoldRepetition()) return 'Remis durch dreifache Stellungswiederholung.';
  if(game.isInsufficientMaterial()) return 'Remis – zu wenig Material zum Mattsetzen.';
  if(game.isDraw()) return 'Die Partie endet remis.';
  if(pendingMove)return 'Zugvorschau – dein Zug ist noch nicht gespielt.';
  if(variation)return 'Beispielvariante – deine Partie bleibt unverändert.';
  if(job?.kind==='line')return 'Eine mögliche Fortsetzung wird berechnet …';
  if(job?.kind==='hint') return 'Ein Zughinweis wird berechnet …';
  return (game.turn()==='w'?'Du bist am Zug.':'Stockfish ist am Zug.')+(game.isCheck()?' Achtung, Schach!':'');
}
function render() {
  const display=pendingMove?.board||(variation?new Chess(variation.index?variation.steps[variation.index-1].fen:variation.fen):game);
  const last = pendingMove?.move||(variation?(variation.index?variation.steps[variation.index-1].move:null):game.history({verbose:true}).at(-1));
  const fragment=document.createDocumentFragment();
  for(let rank=8;rank>=1;rank--) for(let file=0;file<8;file++){
    const square='abcdefgh'[file]+rank, piece=display.get(square), button=document.createElement('button');
    button.type='button';button.dataset.square=square;
    button.className='square'+((file+rank)%2===1?' dark':'');
    if(piece?.color==='w')button.classList.add('white-piece');
    if(square===selected)button.classList.add('selected');
    if(last&&(last.from===square||last.to===square))button.classList.add('last');
    if(targets.some(m=>m.to===square))button.classList.add('target',...(piece?['capture']:[]));
    if(piece?.type==='k'&&piece.color===display.turn()&&display.isCheck())button.classList.add('check');
    if(overlays.some(a=>a.kind==='threat'&&a.to===square))button.classList.add('under-attack');
    button.disabled=!!pendingMove||!!variation;
    button.setAttribute('aria-label',square+(piece?`, ${piece.color==='w'?'Weiß':'Schwarz'} ${names[piece.type]}`:', leer'));
    button.setAttribute('aria-pressed',String(square===selected));
    if(piece)button.textContent=symbols[piece.type];
    if(file===0){let label=document.createElement('span');label.className='coord rank';label.textContent=rank;button.append(label);}
    if(rank===1){let label=document.createElement('span');label.className='coord file';label.textContent='abcdefgh'[file];button.append(label);}
    fragment.append(button);
  }
  $('board').replaceChildren(fragment);
  $('status').textContent=status();
  $('hint').disabled=!ready||!!job||!!pendingMove||!!variation||game.turn()!=='w'||game.isGameOver();
  $('variation').disabled=$('hint').disabled;
  $('threats').disabled=!!pendingMove||!!variation||!!job||game.turn()!=='w';
  $('explain').disabled=!!pendingMove||!!variation||!!job||!game.history().length;
  $('undo').disabled=game.history().length===0;
  $('copy').disabled=!!pendingMove||!!variation;$('export').disabled=!!pendingMove||!!variation;
  $('view-banner').hidden=!pendingMove&&!variation;
  $('view-banner').textContent=pendingMove?'Zugvorschau · noch nicht gespielt':variation?'Beispielvariante · nicht deine laufende Partie':'';
  $('move-warning').hidden=!pendingMove;
  $('line-controls').hidden=!variation;
  if(variation){
    $('line-label').textContent=`Schritt ${variation.index} von ${variation.steps.length} · ${variation.index?'Beispielzüge':'aktuelle Stellung'}`;
    $('line-prev').disabled=variation.index===0;$('line-next').disabled=variation.index===variation.steps.length;
  }
  drawArrows();
  const history=game.history();$('move-count').textContent=`${Math.ceil(history.length/2)} Züge`;
  $('moves').replaceChildren();
  if(!history.length){const p=document.createElement('p');p.className='subtle';p.textContent='Dein erster Zug wartet auf dich.';$('moves').append(p);}
  for(let i=0;i<history.length;i+=2){const row=document.createElement('div');row.className='move-row';for(const s of [String(i/2+1)+'.',history[i],history[i+1]||'…']){let span=document.createElement('span');span.textContent=s;row.append(span);}$('moves').append(row);}
  $('moves').scrollTop=$('moves').scrollHeight;
}
function trainer(title,text){$('trainer-title').textContent=title;$('trainer-text').textContent=text;}
function resetTraining(){
  pendingMove=null;variation=null;overlays=[];$('threat-list').replaceChildren();
}
function drawArrows(){
  const svg=$('arrows');svg.replaceChildren();
  const create=(tag,attrs)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));return el;};
  const defs=create('defs',{});
  for(const [kind,color] of [['threat','#a33e2d'],['move','#226c9b']]){
    const marker=create('marker',{id:'arrow-'+kind,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:3,markerHeight:3,orient:'auto-start-reverse'});
    marker.append(create('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:color}));defs.append(marker);
  }svg.append(defs);
  const point=s=>[('abcdefgh'.indexOf(s[0])+.5)*100,(8-Number(s[1])+.5)*100];
  for(const a of overlays.slice(0,4)){
    const [x1,y1]=point(a.from),[x2,y2]=point(a.to),kind=a.kind||'threat';
    svg.append(create('line',{x1,y1,x2,y2,stroke:kind==='move'?'#226c9b':'#a33e2d','stroke-width':12,'stroke-linecap':'round',opacity:.8,'marker-end':`url(#arrow-${kind})`}));
  }
}
function showThreats(){
  const list=attacks(game,'b').slice(0,3);
  overlays=list.map(a=>({...a,kind:'threat'}));
  $('threat-list').replaceChildren();
  trainer(list.length?'Diese Figuren stehen unter Angriff.':'Kein direkter Angriff auf eine weiße Figur erkannt.',
    list.length?'Verfolge die roten Pfeile vom Angreifer zum Ziel. Prüfe: ausweichen, decken, dazwischenziehen oder den Angreifer schlagen? Ein Angriff bedeutet nicht automatisch Figurenverlust.':'Das bedeutet nicht, dass die Stellung ungefährlich ist. Achte auch auf mögliche Schachs, Gabeln und neue offene Linien.');
  for(const a of list){
    const p=document.createElement('p');p.className='threat-item';
    p.textContent=`${symbols[a.piece]} ${names[a.piece]} ${a.from} → ${names[a.victim]} ${a.to}. ${a.defended?'Ziel gedeckt – Tausch prüfen.':'Ziel nicht durch eine eigene Figur gedeckt.'}`;
    $('threat-list').append(p);
  }
  render();
}
function explainLast(){
  const move=game.history({verbose:true}).at(-1);if(!move)return;
  const explanation=describeMove(Chess,move);
  trainer(explanation.title,explanation.text);overlays=explanation.arrows;$('threat-list').replaceChildren();render();
}
function refreshTraining(){
  resetTraining();
  if(trainingMode==='guided'&&game.turn()==='w'&&!game.isGameOver()){
    if(game.history().length)explainLast();else showThreats();
  }else{
    trainer('Was droht Schwarz?',trainingMode==='challenge'?'Finde zuerst selbst die Drohung. Mit den Schaltflächen kannst du deine Idee anschließend überprüfen.':'Überlege zuerst selbst. Bei Bedarf kannst du Angriffe markieren, den letzten Zug erklären oder eine mögliche Fortsetzung durchgehen.');
  }
}
function showLineStep(){
  if(!variation)return;
  if(variation.index===0){overlays=[];trainer('Eine mögliche Fortsetzung','Starte mit „Weiter“. Weiß und Schwarz wechseln sich ab. Das ist eine berechnete Beispielvariante mit Gegenwehr, keine Vorhersage deiner Züge.');}
  else{const step=variation.steps[variation.index-1];overlays=step.arrows;trainer(step.title,step.text);}
  render();
}
function commitMove(input){
  resetTraining();const move=game.move(input);
  selected=null;targets=[];moveFeedback(move);persist();render();maybeReply();
}
function plan() {
  if(game.isGameOver()){coach('Eine Partie, viele kleine Lektionen.','Kopiere die Partie für unseren Chat. Wir können gemeinsam nach einem guten Eröffnungsplan und einem entscheidenden Moment suchen.');return;}
  if(game.isCheck()){coach('Dein König braucht zuerst Hilfe.','Im Schach musst du die Bedrohung abwehren: König wegziehen, die angreifende Figur schlagen oder – wenn möglich – eine Figur dazwischenstellen.');return;}
  const history=game.history({verbose:true});
  if(history.length<16){
    const atHome=['b1','g1','c1','f1'].filter(s=>game.get(s)?.color==='w'&&['n','b'].includes(game.get(s).type));
    if(atHome.length){coach('Hol deine Figuren mit ins Spiel.',`Noch ${atHome.length} deiner Leichtfiguren stehen auf ihren Startfeldern. Suche ein aktives Feld für einen Springer oder Läufer. Prüfe davor immer: Was droht Schwarz?`);}
    else{coach('Zeit für einen sicheren König.','Deine Leichtfiguren sind entwickelt. Prüfe, ob eine Rochade möglich und sinnvoll ist. Danach kannst du deine Türme verbinden und einen Plan im Zentrum suchen.');}
  }else coach('Erst die Drohung, dann dein Plan.','Was hat der letzte Zug verändert? Prüfe Schachs, Schlagzüge und direkte Drohungen. Suche dann nach deiner am wenigsten aktiven Figur und einem besseren Feld für sie.');
}
function moveFeedback(move) {
  if(game.isGameOver()){plan();return;}
  if(move.flags.includes('k')||move.flags.includes('q'))coach('Der König zieht um.','Mit der Rochade bringst du den König aus dem Zentrum und einen Turm näher ins Spiel. Achte trotzdem auf offene Linien in seiner Nähe.');
  else if(move.promotion)coach('Ein Bauer hat es geschafft.','Dein Bauer ist umgewandelt. Prüfe jetzt Schachs und Mattdrohungen – und ob die neue Figur gedeckt ist.');
  else if(move.captured)coach('Geschlagen – und jetzt nachzählen.','Ein Schlagzug verändert die Stellung. Prüfe, ob Schwarz zurückschlagen kann und welche Linie dadurch frei geworden ist. Das ist noch keine Bewertung, ob der Tausch gut war.');
  else if(game.history().length<=12&&move.piece==='p'&&['d4','e4'].includes(move.to))coach('Du meldest dich im Zentrum an.','Ein zentraler Bauer nimmt Raum und öffnet Wege für deine Figuren. Der nächste Gedanke: Welche Leichtfigur kann davon profitieren?');
  else if(game.history().length<=12&&['n','b'].includes(move.piece))coach('Eine Figur kommt ins Spiel.','Ein Entwicklungszug kann neue Felder kontrollieren. Prüfe, ob die Figur auf ihrem neuen Feld sicher steht und mit deinen anderen Figuren zusammenarbeitet.');
  else plan();
}
function engineFail() {
  clearTimeout(engineTimer);worker?.terminate();worker=null;ready=false;job=null;
  $('engine-status').textContent='Engine nicht verfügbar · Seite neu laden';
  notice('Stockfish konnte nicht geladen werden. Prüfe die Internetverbindung und lade die Seite neu. Deine Partie bleibt erhalten.');
  render();
}
function startEngine() {
  generation++;const current=generation;worker?.terminate();ready=false;job=null;clearTimeout(engineTimer);
  $('engine-status').textContent='Stockfish wird geladen …';
  try{worker=new Worker('./engine-worker.js');}catch{engineFail();return;}
  engineTimer=setTimeout(engineFail,30000);
  worker.onerror=()=>{if(current===generation)engineFail();};
  worker.onmessage=e=>{
    if(current!==generation)return;
    const line=String(e.data);
    if(line==='uciok'){worker.postMessage('setoption name Hash value 16');worker.postMessage('isready');}
    if(line==='readyok'){
      clearTimeout(engineTimer);ready=true;$('engine-status').textContent='Stockfish · rechnet auf deinem Gerät';render();maybeReply();
    }
    if(job&&line.startsWith('info ')&&line.includes(' pv ')&&(!line.includes(' multipv ')||line.includes(' multipv 1 '))){
      job.pv=line.split(' pv ')[1].trim().split(/\s+/);
    }
    if(line.startsWith('bestmove ')&&job){
      clearTimeout(engineTimer);
      const completed=job;job=null;
      if(game.fen()!==completed.fen){render();return;}
      if(completed.kind==='line'){
        const steps=buildLine(Chess,completed.fen,completed.pv||[]);
        if(!steps.length){notice('Keine Beispielvariante verfügbar. Bitte noch einmal versuchen.');render();return;}
        variation={fen:completed.fen,steps,index:0};selected=null;targets=[];$('threat-list').replaceChildren();showLineStep();return;
      }
      const uci=line.split(' ')[1];
      const legal=game.moves({verbose:true}).find(m=>m.from===uci.slice(0,2)&&m.to===uci.slice(2,4)&&(!m.promotion||m.promotion===uci[4]));
      if(!legal){engineFail();return;}
      if(completed.kind==='reply'){
        game.move({from:legal.from,to:legal.to,promotion:legal.promotion});persist();
        refreshTraining();
        if(game.isGameOver())plan();
      }else{
        selected=legal.from;targets=[legal];
        coach(`Ein Kandidat: ${legal.san}`,`${names[legal.piece]} von ${legal.from} nach ${legal.to}. Das ist ein berechneter Vorschlag, keine Garantie für den besten Zug. Überlege zuerst selbst: Was verändert er, und was könnte Schwarz antworten?`);
      }
      render();
    }
  };
  worker.postMessage('uci');
}
function search(kind) {
  if(!ready||job||pendingMove||variation||game.isGameOver())return;
  job={kind,fen:game.fen()};render();
  worker.postMessage(`setoption name Skill Level value ${kind==='reply'?$('level').value:20}`);
  // Preserve the entire history, including repetitions, for engine searches.
  const history=game.history({verbose:true});
  const start=history[0]?.before||game.fen();
  worker.postMessage(`position fen ${start}${history.length?' moves '+history.map(m=>m.from+m.to+(m.promotion||'')).join(' '):''}`);
  worker.postMessage(`go movetime ${kind==='line'?1800:kind==='hint'?900:550}`);
  engineTimer=setTimeout(engineFail,15000);
}
function maybeReply(){if(game.turn()==='b'&&!game.isGameOver())search('reply');}
async function playSquare(square) {
  if(!game||game.turn()!=='w'||game.isGameOver()||job||pendingMove||variation)return;
  const options=selected?game.moves({square:selected,verbose:true}).filter(m=>m.to===square):[];
  if(options.length){
    let promotion;
    if(options.some(m=>m.promotion)){
      const dialog=$('promotion');dialog.returnValue='';dialog.showModal();
      promotion=await new Promise(resolve=>dialog.addEventListener('close',()=>resolve(dialog.returnValue),{once:true}));
      if(!['q','r','b','n'].includes(promotion))return;
    }
    const input={from:selected,to:square,...(promotion?{promotion}:{})};
    if(trainingMode==='guided'){
      const risks=risksAfter(Chess,game,input);
      if(risks.length){
        const board=new Chess(game.fen()),move=board.move(input);
        pendingMove={input,board,move};
        overlays=risks.map(a=>({...a,kind:'threat'}));selected=null;targets=[];
        $('warning-text').textContent=risks.map(a=>a.text).join(' ');
        render();return;
      }
    }
    commitMove(input);return;
  }
  if(game.get(square)?.color==='w'){selected=square;targets=game.moves({square,verbose:true});}else{selected=null;targets=[];}
  render();
  document.querySelector(`[data-square="${square}"]`)?.focus({preventScroll:true});
}
function chatText(){
  return `Ich spiele Schach und möchte die Stellung mit dir besprechen. Ich spiele Weiß. Bitte erkläre verständlich, prüfe die Stellung sorgfältig und erfinde keine Züge. Gib zunächst einen Denkanstoß, nicht sofort eine lange Variante.\n\nFrage: ${$('question').value.trim()||'Was wäre hier ein sinnvoller Plan, und warum?'}\n\nAktuelle Stellung (FEN): ${game.fen()}\nAm Zug: ${game.turn()==='w'?'Weiß':'Schwarz'}\n\nPartie (PGN):\n${game.pgn()||'Noch keine Züge.'}`;
}
async function init(){
  try{({Chess}=await import('https://cdn.jsdelivr.net/npm/chess.js@1.4.0/dist/esm/chess.js'));}catch{
    $('status').textContent='Die Schachregeln konnten nicht geladen werden. Bitte Internetverbindung prüfen und Seite neu laden.';
    $('engine-status').textContent='Laden fehlgeschlagen';return;
  }
  game=new Chess();
  try{
    const saved=JSON.parse(localStorage.getItem(key)||'null');
    if(saved?.pgn)game.loadPgn(saved.pgn);
    if(['0','5','20'].includes(saved?.level))$('level').value=saved.level;
    if(saved?.level==='12')$('level').value='20';
    if(['guided','practice','challenge'].includes(saved?.trainingMode))trainingMode=saved.trainingMode;
  }catch{game=new Chess();notice('Die gespeicherte Partie konnte nicht geladen werden. Eine neue Partie wurde vorbereitet.');}
  $('board').addEventListener('click',e=>{const square=e.target.closest('[data-square]');if(square)playSquare(square.dataset.square);});
  $('undo').onclick=()=>{
    if(!game.history().length)return;
    // Terminate before changing the position so late engine replies cannot enter this game.
    generation++;worker?.terminate();job=null;ready=false;
    game.undo();if(game.turn()==='b'&&game.history().length)game.undo();
    selected=null;targets=[];refreshTraining();persist();plan();render();startEngine();
  };
  $('new').onclick=()=>{
    if(game.history().length&&!confirm('Eine neue Partie starten? Exportiere deine aktuelle Partie vorher, wenn du sie behalten möchtest.'))return;
    game=new Chess();selected=null;targets=[];refreshTraining();persist();coach('Erst eine Idee, dann ein Zug.','Besetze das Zentrum, bring deine Figuren ins Spiel und schütze deinen König. Du musst nicht alles auf einmal erledigen.');startEngine();render();
  };
  $('hint').onclick=()=>{selected=null;targets=[];search('hint');};
  $('level').onchange=persist;
  $('training-mode').value=trainingMode;
  const modeText=()=>{
    $('mode-description').textContent=trainingMode==='guided'?'Gegnerzüge werden erklärt und Angriffe markiert. Vor möglichen Figurenverlusten kannst du deinen Zug überdenken.':trainingMode==='practice'?'Du spielst selbstständig. Drohungen, Erklärungen und Beispielvarianten erhältst du auf Knopfdruck.':'Keine automatischen Warnungen. Finde einen eigenen Plan; Hilfe bleibt auf Wunsch verfügbar.';
  };
  modeText();
  $('training-mode').onchange=()=>{trainingMode=$('training-mode').value;refreshTraining();modeText();persist();render();};
  $('threats').onclick=showThreats;
  $('explain').onclick=explainLast;
  $('variation').onclick=()=>{selected=null;targets=[];search('line');};
  $('line-prev').onclick=()=>{if(variation&&variation.index>0){variation.index--;showLineStep();}};
  $('line-next').onclick=()=>{if(variation&&variation.index<variation.steps.length){variation.index++;showLineStep();}};
  $('line-close').onclick=()=>{refreshTraining();render();};
  $('cancel-move').onclick=()=>{refreshTraining();render();};
  $('confirm-move').onclick=()=>{if(pendingMove)commitMove(pendingMove.input);};
  document.querySelectorAll('[data-topic]').forEach(button=>button.onclick=()=>{
    if(button.dataset.topic==='plan')plan();
    if(button.dataset.topic==='opening')coach('Drei Fragen für deinen Anfang.','1. Habe ich Einfluss auf das Zentrum? 2. Welche Leichtfigur steht noch untätig zu Hause? 3. Wie bringe ich meinen König in Sicherheit? Zum Beispiel öffnet 1. e4 Wege für Läufer und Dame. Was danach passt, hängt auch von Schwarz ab.');
    if(button.dataset.topic==='fun')coach('Eine kleine Schachweisheit.',[
      'Dein Springer hat keine geraden Wege nötig. Er kommt auch mit Umwegen zum Punkt.',
      'Die Dame kann fast alles. Trotzdem muss sie nicht die ganze Gruppenarbeit allein machen.',
      'Rochade: Wenn König und Turm gemeinsam beschließen, dass ein Tapetenwechsel guttut.'
    ][Math.floor(Math.random()*3)]);
  });
  $('copy').onclick=async()=>{
    const text=chatText();
    try{await navigator.clipboard.writeText(text);notice('Kopiert! Füge die Stellung jetzt hier im Chat ein.');}
    catch{$('copy-text').value=text;$('copy-dialog').showModal();$('copy-text').select();}
  };
  $('close-copy').onclick=()=>$('copy-dialog').close();
  $('export').onclick=()=>{
    const url=URL.createObjectURL(new Blob([game.pgn()],{type:'text/plain;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='SchachGPT-Partie.pgn';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  $('import').onclick=()=>$('file').click();
  $('file').onchange=async()=>{
    const file=$('file').files[0];if(!file)return;
    try{
      if(file.size>200000)throw Error('size');
      const next=new Chess();next.loadPgn(await file.text());
      if(game.history().length&&!confirm('Die aktuelle Partie durch die importierte Partie ersetzen?'))return;
      game=next;selected=null;targets=[];refreshTraining();persist();startEngine();plan();render();notice('Partie geladen. Du spielst Weiß.');
    }catch{notice('Die Datei konnte nicht als PGN-Partie geladen werden (maximal 200 KB). Deine Partie bleibt erhalten.');}
    finally{$('file').value='';}
  };
  refreshTraining();render();startEngine();
}
init();
