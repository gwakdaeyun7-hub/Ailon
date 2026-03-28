/**
 * Hopfield Network interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 7x7 binary grid (black/white cells) — current network state
 * - 3 stored patterns: letters A, T, X (Hebbian learning)
 * - Click cells to flip, "Corrupt 30%" button
 * - Async update: pick random neuron, s_i = sign(sum w_ij * s_j)
 * - "Recall Step" (one sweep) + "Recall Auto" (until convergence)
 * - Energy plot: E(t) over update steps (monotonically decreasing)
 * - Stats: energy, iterations, convergence, Hamming distance to stored patterns
 * - Stored pattern thumbnails on side
 * - Dark/light theme, Korean/English bilingual
 */

export function getHopfieldSimulationHTML(isDark: boolean, lang: string): string {
  const themeClass = isDark ? 'dark' : '';

  return '<!DOCTYPE html>' +
'<html class="' + themeClass + '"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">' +
'<style>' +
':root{--bg:#FFFFFF;--card:#FFFFFF;--text:#000;--text2:#57534E;--text3:#A8A29E;' +
'--border:#E7E5E4;--surface:#F5F2EE;--teal:#5EEAD4;--tealLight:#F0FDFA;' +
'--accent:#B45309;--red:#DC2626;--green:#15803D}' +
'.dark{--bg:#1A1816;--card:#231F1D;--text:#E7E5E4;--text2:#A8A29E;--text3:#78716C;' +
'--border:#302B28;--surface:#211D1B;--teal:#5EEAD4;--tealLight:#112525;' +
'--accent:#F59E0B;--red:#F87171;--green:#4ADE80}' +
'*{box-sizing:border-box;margin:0;padding:0}' +
'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);padding:0;-webkit-user-select:none;user-select:none;overflow-x:hidden}' +
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px;border-radius:8px}' +
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card);border-radius:8px;touch-action:none}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:72px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:14px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:var(--bg)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .err{color:var(--red);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:10px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;border-radius:8px;min-height:44px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.thumb-row{display:flex;gap:8px;margin-bottom:8px}' +
'.thumb-box{text-align:center}' +
'.thumb-label{font-size:9px;font-weight:700;color:var(--text3);margin-top:2px}' +
'</style></head><body>' +

// ── Grid Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-grid"></div>' +
'<div style="display:flex;gap:12px;align-items:flex-start">' +
'<canvas id="cvGrid" height="180" style="flex:1"></canvas>' +
'<div id="thumbs" style="flex-shrink:0"></div>' +
'</div></div>' +

// ── Energy Plot Panel ──
'<div class="panel"><div class="label" id="lbl-energy"></div>' +
'<canvas id="cvEnergy" height="140"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="preset-row">' +
'<div class="preset" id="preA" onclick="loadPattern(0)">A</div>' +
'<div class="preset" id="preT" onclick="loadPattern(1)">T</div>' +
'<div class="preset" id="preX" onclick="loadPattern(2)">X</div>' +
'</div>' +
'<div class="row">' +
'<div class="ctrl-name" id="lbl-corruptPct"></div>' +
'<input type="range" id="rngCorrupt" min="10" max="80" step="5" value="30" oninput="onCorruptPctChange(this.value)">' +
'<div class="ctrl-val" id="valCorrupt">30%</div>' +
'</div>' +
'<div class="row">' +
'<div class="ctrl-name" id="lbl-patterns"></div>' +
'<input type="range" id="rngPatterns" min="3" max="15" step="1" value="3" oninput="onPatternsChange(this.value)">' +
'<div class="ctrl-val" id="valPatterns">3 / 7</div>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn" id="btnCorrupt" onclick="corrupt()"></div>' +
'<div class="btn btn-primary" id="btnStep" onclick="recallStep()"></div>' +
'<div class="btn" id="btnAuto" onclick="recallAuto()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{grid:"\\uD648\\uD544\\uB4DC \\uB124\\uD2B8\\uC6CC\\uD06C",' +
'energy:"\\uC5D0\\uB108\\uC9C0 \\uD50C\\uB86F",ctrl:"\\uCEE8\\uD2B8\\uB864",' +
'stats:"\\uD1B5\\uACC4",' +
'corrupt:"\\uC190\\uC0C1",step:"\\uC2A4\\uD15D",' +
'auto:"\\uC790\\uB3D9",reset:"\\u21BA \\uB9AC\\uC14B",' +
'stored:"\\uC800\\uC7A5 \\uD328\\uD134",energyVal:"\\uC5D0\\uB108\\uC9C0",' +
'iter:"\\uBC18\\uBCF5",converged:"\\uC218\\uB834",' +
'notConverged:"\\uBBF8\\uC218\\uB834",hamming:"\\uD574\\uBC0D \\uAC70\\uB9AC",' +
'closest:"\\uAC00\\uC7A5 \\uAC00\\uAE4C\\uC6B4",tapFlip:"\\uC140 \\uD0ED\\uD558\\uC5EC \\uBC18\\uC804",' +
'running:"\\uBCF5\\uC6D0 \\uC911...",' +
'corruptPct:"\\uC190\\uC0C1 %",patterns:"\\uD328\\uD134 \\uC218",' +
'capacity:"\\uC6A9\\uB7C9",overCap:"\\uC6A9\\uB7C9 \\uCD08\\uACFC!",' +
'spurious:"\\uD5C8\\uC704 \\uAE30\\uC5B5"},' +
'en:{grid:"HOPFIELD NETWORK",' +
'energy:"ENERGY PLOT",ctrl:"CONTROLS",' +
'stats:"STATISTICS",' +
'corrupt:"Corrupt",step:"Step",' +
'auto:"Auto",reset:"\\u21BA Reset",' +
'stored:"Stored",energyVal:"Energy",' +
'iter:"Iterations",converged:"Converged",' +
'notConverged:"Not converged",hamming:"Hamming Dist",' +
'closest:"Closest",tapFlip:"Tap cell to flip",' +
'running:"Recalling...",' +
'corruptPct:"Corrupt %",patterns:"Patterns",' +
'capacity:"Capacity",overCap:"Over capacity!",' +
'spurious:"Spurious state"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var N=7;var NN=N*N;' +
'var state=[];' + // current state: +1/-1
'var weights=[];' + // NN x NN weight matrix (flat)
'var energyHistory=[];' +
'var iterations=0;' +
'var isConverged=false;' +
'var autoTimer=null;' +
'var PATTERN_NAMES=["A","T","X"];' +

// ── Stored patterns (7x7, +1=black, -1=white) ──
// A pattern
'var PAT_A=[' +
'-1,-1,+1,+1,+1,-1,-1,' +
'-1,+1,-1,-1,-1,+1,-1,' +
'+1,-1,-1,-1,-1,-1,+1,' +
'+1,+1,+1,+1,+1,+1,+1,' +
'+1,-1,-1,-1,-1,-1,+1,' +
'+1,-1,-1,-1,-1,-1,+1,' +
'+1,-1,-1,-1,-1,-1,+1];' +

// T pattern
'var PAT_T=[' +
'+1,+1,+1,+1,+1,+1,+1,' +
'-1,-1,-1,+1,-1,-1,-1,' +
'-1,-1,-1,+1,-1,-1,-1,' +
'-1,-1,-1,+1,-1,-1,-1,' +
'-1,-1,-1,+1,-1,-1,-1,' +
'-1,-1,-1,+1,-1,-1,-1,' +
'-1,-1,-1,+1,-1,-1,-1];' +

// X pattern
'var PAT_X=[' +
'+1,-1,-1,-1,-1,-1,+1,' +
'-1,+1,-1,-1,-1,+1,-1,' +
'-1,-1,+1,-1,+1,-1,-1,' +
'-1,-1,-1,+1,-1,-1,-1,' +
'-1,-1,+1,-1,+1,-1,-1,' +
'-1,+1,-1,-1,-1,+1,-1,' +
'+1,-1,-1,-1,-1,-1,+1];' +

'var BASE_PATTERNS=[PAT_A,PAT_T,PAT_X];' +
'var PATTERNS=BASE_PATTERNS.slice();' +
'var extraPatterns=[];' +
'var corruptPct=30;' +
'var patternCount=3;' +
'var CAPACITY=Math.round(0.138*NN);' + // ≈ 7

// ── Generate random pattern ──
'function genRandomPat(){var p=[];for(var i=0;i<NN;i++)p.push(Math.random()<0.5?1:-1);return p}' +

// ── Slider handlers ──
'function onCorruptPctChange(v){corruptPct=parseInt(v);document.getElementById("valCorrupt").textContent=v+"%"}' +

'function onPatternsChange(v){' +
'stopAuto();patternCount=parseInt(v);' +
'while(extraPatterns.length<patternCount-3){extraPatterns.push(genRandomPat())}' +
'PATTERNS=BASE_PATTERNS.slice().concat(extraPatterns.slice(0,patternCount-3));' +
'buildWeights();' +
'var cs=getComputedStyle(document.documentElement);' +
'var el=document.getElementById("valPatterns");' +
'el.textContent=patternCount+" / "+CAPACITY;' +
'el.style.color=patternCount>CAPACITY?cs.getPropertyValue("--red").trim():cs.getPropertyValue("--teal").trim();' +
'energyHistory=[computeEnergy()];iterations=0;isConverged=false;' +
'drawAll();notifyHeight()}' +

// ── Hebbian weight matrix: w_ij = (1/P) * sum_p (xi_p * xj_p), w_ii = 0 ──
'function buildWeights(){' +
'weights=[];var P=PATTERNS.length;' +
'for(var i=0;i<NN;i++){' +
'for(var j=0;j<NN;j++){' +
'if(i===j){weights.push(0);continue}' +
'var w=0;for(var p=0;p<P;p++){w+=PATTERNS[p][i]*PATTERNS[p][j]}' +
'weights.push(w/P)}}}' +

// ── Compute energy: E = -0.5 * sum_ij w_ij * s_i * s_j ──
'function computeEnergy(){' +
'var E=0;' +
'for(var i=0;i<NN;i++){' +
'for(var j=i+1;j<NN;j++){' +
'E-=weights[i*NN+j]*state[i]*state[j]}}' +
'return E}' +

// ── Hamming distance ──
'function hamming(a,b){' +
'var d=0;for(var i=0;i<NN;i++){if(a[i]!==b[i])d++}return d}' +

// ── Closest pattern ──
'function closestPattern(){' +
'var minD=NN+1;var minIdx=-1;' +
'for(var p=0;p<BASE_PATTERNS.length;p++){' +
'var d=hamming(state,BASE_PATTERNS[p]);' +
'if(d<minD){minD=d;minIdx=p}}' +
'return{idx:minIdx,dist:minD}}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'if(cv.id==="cvGrid"){w=Math.min(w,cv.parentElement.clientWidth-90)}' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw 7x7 grid ──
'function drawGrid(){' +
'var cv=document.getElementById("cvGrid");' +
'var dim=setupCanvas(cv,180);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +

'var cellSize=Math.min(Math.floor((w-16)/N),Math.floor((h-24)/N));' +
'var gridW=cellSize*N;var gridH=cellSize*N;' +
'var offX=Math.floor((w-gridW)/2);' +
'var offY=Math.floor((h-gridH)/2);' +

'for(var r=0;r<N;r++){' +
'for(var c=0;c<N;c++){' +
'var idx=r*N+c;' +
'var cx=offX+c*cellSize;var cy=offY+r*cellSize;' +
'ctx.fillStyle=state[idx]===1?tealC:surfaceC;' +
'ctx.fillRect(cx,cy,cellSize,cellSize);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.strokeRect(cx,cy,cellSize,cellSize)}}' +

// outer border
'ctx.strokeStyle=borderC;ctx.lineWidth=2;' +
'ctx.strokeRect(offX,offY,gridW,gridH);' +

// hint
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.tapFlip,w/2,h-2)}' +

// ── Draw stored pattern thumbnails ──
'function drawThumbs(){' +
'var box=document.getElementById("thumbs");box.innerHTML="";' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'for(var p=0;p<BASE_PATTERNS.length;p++){' +
'var div=document.createElement("div");div.className="thumb-box";' +
'var cv=document.createElement("canvas");' +
'var sz=7;var cs2=6;cv.width=sz*cs2;cv.height=sz*cs2;' +
'cv.style.width=(sz*cs2)+"px";cv.style.height=(sz*cs2)+"px";' +
'cv.style.border="2px solid "+borderC;' +
'var ctx=cv.getContext("2d");' +
'for(var r=0;r<sz;r++){for(var c=0;c<sz;c++){' +
'ctx.fillStyle=BASE_PATTERNS[p][r*sz+c]===1?tealC:surfaceC;' +
'ctx.fillRect(c*cs2,r*cs2,cs2,cs2);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.strokeRect(c*cs2,r*cs2,cs2,cs2)}}' +
'div.appendChild(cv);' +
'var lbl=document.createElement("div");lbl.className="thumb-label";' +
'lbl.textContent=PATTERN_NAMES[p];div.appendChild(lbl);' +
'box.appendChild(div)}}' +

// ── Draw energy plot ──
'function drawEnergy(){' +
'var cv=document.getElementById("cvEnergy");' +
'var dim=setupCanvas(cv,140);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +

'var pad=40;var pr=14;var pt=14;var pb=26;' +
'var pw=w-pad-pr;var ph=h-pt-pb;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +

'if(energyHistory.length<2){' +
'ctx.fillStyle=textC;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.energyVal,w/2,h/2);return}' +

// find min/max energy
'var minE=energyHistory[0],maxE=energyHistory[0];' +
'for(var i=1;i<energyHistory.length;i++){' +
'if(energyHistory[i]<minE)minE=energyHistory[i];' +
'if(energyHistory[i]>maxE)maxE=energyHistory[i]}' +
'var range=maxE-minE;if(range<1)range=1;' +
'minE-=range*0.1;maxE+=range*0.1;range=maxE-minE;' +

// axis labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(maxE.toFixed(0),pad-4,pt+6);' +
'ctx.fillText(minE.toFixed(0),pad-4,h-pb);' +
'ctx.textAlign="center";' +
'ctx.fillText("0",pad+4,h-pb+14);' +
'ctx.fillText(""+(energyHistory.length-1),w-pr,h-pb+14);' +

// plot line
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<energyHistory.length;i++){' +
'var x=pad+i/(Math.max(energyHistory.length-1,1))*pw;' +
'var y=pt+(maxE-energyHistory[i])/range*ph;' +
'if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}' +
'ctx.stroke();' +

// dots
'ctx.fillStyle=tealC;' +
'for(var i=0;i<energyHistory.length;i++){' +
'var x=pad+i/(Math.max(energyHistory.length-1,1))*pw;' +
'var y=pt+(maxE-energyHistory[i])/range*ph;' +
'ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}' +

// label
'ctx.fillStyle=textC;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText("E(t)",w/2,h-4)}' +

// ── Async update: one full sweep (N*N neurons) ──
'function asyncUpdate(){' +
'var changed=false;' +
'var order=[];for(var i=0;i<NN;i++)order.push(i);' +
// shuffle
'for(var i=NN-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=order[i];order[i]=order[j];order[j]=tmp}' +
'for(var k=0;k<NN;k++){' +
'var i=order[k];' +
'var h2=0;for(var j=0;j<NN;j++){h2+=weights[i*NN+j]*state[j]}' +
'var newS=h2>=0?1:-1;' +
'if(newS!==state[i]){state[i]=newS;changed=true}}' +
'return changed}' +

// ── Load pattern ──
'function loadPattern(idx){' +
'stopAuto();' +
'state=PATTERNS[idx].slice();' +
'energyHistory=[computeEnergy()];iterations=0;isConverged=false;' +
'for(var i=0;i<3;i++){document.getElementById("pre"+PATTERN_NAMES[i]).className=i===idx?"preset active":"preset"}' +
'drawAll();notifyHeight()}' +

// ── Corrupt 30% ──
'function corrupt(){' +
'stopAuto();' +
'var nFlip=Math.round(NN*corruptPct/100);' +
'var indices=[];for(var i=0;i<NN;i++)indices.push(i);' +
'for(var i=NN-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var tmp=indices[i];indices[i]=indices[j];indices[j]=tmp}' +
'for(var i=0;i<nFlip;i++){state[indices[i]]*=-1}' +
'energyHistory=[computeEnergy()];iterations=0;isConverged=false;' +
'drawAll();notifyHeight()}' +

// ── Recall step (one sweep) ──
'function recallStep(){' +
'stopAuto();' +
'var changed=asyncUpdate();iterations++;' +
'energyHistory.push(computeEnergy());' +
'if(!changed)isConverged=true;' +
'drawAll();notifyHeight()}' +

// ── Recall auto ──
'function recallAuto(){' +
'if(autoTimer){stopAuto();return}' +
'isConverged=false;' +
'document.getElementById("btnAuto").textContent="\\u25A0";' +
'document.getElementById("btnAuto").className="btn btn-stop";' +
'autoTimer=setInterval(function(){' +
'var changed=asyncUpdate();iterations++;' +
'energyHistory.push(computeEnergy());' +
'if(!changed||iterations>100){isConverged=true;stopAuto()}' +
'drawAll()},150)}' +

'function stopAuto(){' +
'if(autoTimer){clearInterval(autoTimer);autoTimer=null}' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn";' +
'notifyHeight()}' +

// ── Tap to flip cell ──
'function initGridTap(){' +
'var cv=document.getElementById("cvGrid");' +
'cv.addEventListener("click",function(e){' +
'var rect=cv.getBoundingClientRect();' +
'var x=e.clientX-rect.left;var y=e.clientY-rect.top;' +
'var cw=cv.clientWidth;var ch=cv.clientHeight;' +
'var cellSize=Math.min(Math.floor((cw-16)/N),Math.floor((ch-24)/N));' +
'var gridW2=cellSize*N;var gridH2=cellSize*N;' +
'var offX=Math.floor((cw-gridW2)/2);' +
'var offY=Math.floor((ch-gridH2)/2);' +
'var col=Math.floor((x-offX)/cellSize);' +
'var row=Math.floor((y-offY)/cellSize);' +
'if(col>=0&&col<N&&row>=0&&row<N){' +
'state[row*N+col]*=-1;drawAll();notifyHeight()}})}' +

// ── Reset ──
'function onReset(){' +
'stopAuto();' +
'state=[];for(var i=0;i<NN;i++)state.push(-1);' +
'energyHistory=[computeEnergy()];iterations=0;isConverged=false;' +
'for(var i=0;i<3;i++){document.getElementById("pre"+PATTERN_NAMES[i]).className="preset"}' +
'drawAll();notifyHeight()}' +

// ── Draw all ──
'function drawAll(){drawGrid();drawEnergy();updateStats()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var E=computeEnergy();' +
'var cl=closestPattern();' +
'var s="<span class=\\"hi\\">"+T.energyVal+"</span> "+E.toFixed(1)+"<br>";' +
's+=T.iter+": <span class=\\"hi\\">"+iterations+"</span><br>";' +
's+=isConverged?"<span class=\\"hi\\">\\u2714 "+T.converged+"</span><br>":"<span class=\\"warn\\">"+T.notConverged+"</span><br>";' +
// capacity line
's+=T.capacity+": ";' +
'if(patternCount>CAPACITY){s+="<span class=\\"err\\">"+patternCount+" / "+CAPACITY+" \\u26A0 "+T.overCap+"</span>"}' +
'else{s+="<span class=\\"hi\\">"+patternCount+" / "+CAPACITY+"</span>"}' +
's+="<br><br>";' +
'for(var p=0;p<BASE_PATTERNS.length;p++){' +
'var d=hamming(state,BASE_PATTERNS[p]);' +
'var marker=p===cl.idx?"\\u2192 ":"&nbsp;&nbsp;";' +
's+=marker+PATTERN_NAMES[p]+": <span class=\\"warn\\">"+d+"</span> / "+NN+"<br>"}' +
's+="<br>"+T.closest+": ";' +
'if(isConverged&&cl.dist>Math.floor(NN*0.3)){s+="<span class=\\"err\\">"+T.spurious+"</span>"}' +
'else{s+="<span class=\\"hi\\">"+PATTERN_NAMES[cl.idx]+"</span>"}' +
's+=" ("+T.hamming+": "+cl.dist+")";' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-grid").textContent=T.grid;' +
'document.getElementById("lbl-energy").textContent=T.energy;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnCorrupt").textContent=T.corrupt;' +
'document.getElementById("btnStep").textContent=T.step;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lbl-corruptPct").textContent=T.corruptPct;' +
'document.getElementById("lbl-patterns").textContent=T.patterns;' +

// ── Init ──
'buildWeights();' +
'state=PAT_A.slice();' +
'energyHistory=[computeEnergy()];' +
'document.getElementById("preA").className="preset active";' +
'drawAll();drawThumbs();initGridTap();' +
'window.addEventListener("resize",function(){drawAll();drawThumbs();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
