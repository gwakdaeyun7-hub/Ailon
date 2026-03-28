/**
 * Dynamic Programming — Grid World Value Iteration simulation
 *
 * Features:
 * - 6x6 grid with goal (bottom-right), agent (top-left), toggleable walls
 * - Bellman value iteration V(s) = max_a [R(s,a) + gamma * V(s')]
 * - Policy arrows showing optimal direction per cell
 * - Step (1 sweep), Auto (run to convergence), Reset controls
 * - Gamma slider, speed slider
 * - Agent auto-walks optimal path after convergence
 * - Dark/light theme, Korean/English bilingual
 */

export function getDPSimulationHTML(isDark: boolean, lang: string): string {
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
'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);padding:0 6px;-webkit-user-select:none;user-select:none;overflow-x:hidden}' +
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px;border-radius:8px;overflow:hidden}' +
'canvas{width:100%;display:block;background:var(--card);border-radius:6px}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:40px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:44px;text-align:right;flex-shrink:0;white-space:nowrap}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:32px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'</style></head><body>' +

// ── Grid Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-grid"></div>' +
'<canvas id="cvGrid" height="320"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lblGamma"></span>' +
'<input type="range" id="slGamma" min="0" max="99" value="90" oninput="onGamma()">' +
'<span class="ctrl-val" id="valGamma"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lblSpeed"></span>' +
'<input type="range" id="slSpeed" min="1" max="10" value="5" oninput="onSpeed()">' +
'<span class="ctrl-val" id="valSpeed"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnStep" onclick="doStep()"></div>' +
'<div class="btn" id="btnAuto" onclick="toggleAuto()"></div>' +
'<div class="btn" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{grid:"\\uADF8\\uB9AC\\uB4DC \\uC6D4\\uB4DC",ctrl:"\\uC81C\\uC5B4",stats:"\\uD1B5\\uACC4",' +
'gamma:"\\uD560\\uC778\\uC728(\\u03B3)",speed:"\\uC18D\\uB3C4",' +
'step:"\\uC2A4\\uD15D",auto:"\\uC790\\uB3D9",stop:"\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'iter:"\\uBC18\\uBCF5",maxDelta:"\\uCD5C\\uB300 \\u0394V",converged:"\\uC218\\uB834!",' +
'tapWall:"\\uC140 \\uD130\\uCE58 = \\uBCBD \\uD1A0\\uAE00",walking:"\\uCD5C\\uC801 \\uACBD\\uB85C \\uC774\\uB3D9 \\uC911...",' +
'goal:"\\uBAA9\\uD45C",wall:"\\uBCBD",agent:"\\uC5D0\\uC774\\uC804\\uD2B8",' +
'valIter:"\\uAC00\\uCE58 \\uBC18\\uBCF5",policy:"\\uC815\\uCC45",optPath:"\\uCD5C\\uC801 \\uACBD\\uB85C"},' +
'en:{grid:"GRID WORLD",ctrl:"CONTROLS",stats:"STATISTICS",' +
'gamma:"Discount(\\u03B3)",speed:"Speed",' +
'step:"Step",auto:"Auto",stop:"Stop",reset:"\\u21BA Reset",' +
'iter:"Iteration",maxDelta:"Max \\u0394V",converged:"Converged!",' +
'tapWall:"Tap cell = toggle wall",walking:"Walking optimal path...",' +
'goal:"Goal",wall:"Wall",agent:"Agent",' +
'valIter:"Value Iteration",policy:"Policy",optPath:"Optimal Path"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var ROWS=6,COLS=6;' +
'var GOAL_R=5,GOAL_C=5;' +
'var GOAL_REWARD=10,STEP_COST=-0.1;' +
'var gamma=0.9,speed=5;' +
'var V=[];var walls=[];var policy=[];' +
'var iteration=0,maxDelta=0,isConverged=false;' +
'var autoTimer=null;' +
'var agentR=0,agentC=0,walkTimer=null,walkPath=[];' +

// ── Init grid ──
'function initGrid(){' +
'V=[];walls=[];policy=[];' +
'for(var r=0;r<ROWS;r++){V[r]=[];walls[r]=[];policy[r]=[];' +
'for(var c=0;c<COLS;c++){V[r][c]=0;walls[r][c]=false;policy[r][c]=-1}}' +
'iteration=0;maxDelta=0;isConverged=false;agentR=0;agentC=0;walkPath=[];' +
'if(walkTimer){clearInterval(walkTimer);walkTimer=null}' +
'if(autoTimer){clearInterval(autoTimer);autoTimer=null;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn"}}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Directions: up, down, left, right ──
'var DR=[-1,1,0,0];var DC=[0,0,-1,1];' +
'var ARROWS=["\\u2191","\\u2193","\\u2190","\\u2192"];' +

// ── One Bellman sweep ──
'function bellmanSweep(){' +
'var delta=0;' +
'for(var r=0;r<ROWS;r++){for(var c=0;c<COLS;c++){' +
'if(walls[r][c])continue;' +
'if(r===GOAL_R&&c===GOAL_C)continue;' +
'var bestVal=-1e9;var bestA=-1;' +
'for(var a=0;a<4;a++){' +
'var nr=r+DR[a],nc=c+DC[a];' +
'if(nr<0||nr>=ROWS||nc<0||nc>=COLS||walls[nr][nc]){nr=r;nc=c}' +
'var val=STEP_COST+gamma*V[nr][nc];' +
'if(val>bestVal){bestVal=val;bestA=a}}' +
'var d=Math.abs(bestVal-V[r][c]);if(d>delta)delta=d;' +
'V[r][c]=bestVal;policy[r][c]=bestA}}' +
'V[GOAL_R][GOAL_C]=GOAL_REWARD;' +
'iteration++;maxDelta=delta;' +
'if(delta<0.001)isConverged=true;' +
'return delta}' +

// ── Draw grid ──
'function drawGrid(){' +
'var cv=document.getElementById("cvGrid");' +
'var dim=setupCanvas(cv,320);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +
'var pad=8;var cellW=(w-pad*2)/COLS;var cellH=(h-pad*2)/ROWS;' +

// find min/max V for coloring
'var minV=1e9,maxV=-1e9;' +
'for(var r=0;r<ROWS;r++){for(var c=0;c<COLS;c++){' +
'if(!walls[r][c]){if(V[r][c]<minV)minV=V[r][c];if(V[r][c]>maxV)maxV=V[r][c]}}}' +
'var rangeV=maxV-minV||1;' +

// draw cells
'for(var r=0;r<ROWS;r++){for(var c=0;c<COLS;c++){' +
'var x=pad+c*cellW;var y=pad+r*cellH;' +
// wall
'if(walls[r][c]){ctx.fillStyle=text3C;ctx.fillRect(x,y,cellW,cellH);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(x,y,cellW,cellH);continue}' +
// value color: lerp from red(low) to teal(high)
'var t=rangeV>0.01?(V[r][c]-minV)/rangeV:0.5;' +
'var red0=180,g0=60,b0=60;' +
'var red1=94,g1=234,b1=212;' +
'var rr=Math.round(red0+(red1-red0)*t);' +
'var gg=Math.round(g0+(g1-g0)*t);' +
'var bb=Math.round(b0+(b1-b0)*t);' +
'ctx.fillStyle="rgba("+rr+","+gg+","+bb+",0.25)";ctx.fillRect(x,y,cellW,cellH);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(x,y,cellW,cellH);' +

// value text
'ctx.fillStyle=textC;ctx.font="10px monospace";ctx.textAlign="center";ctx.textBaseline="middle";' +
'ctx.fillText(V[r][c].toFixed(1),x+cellW/2,y+cellH*0.35);' +

// policy arrow
'if(policy[r][c]>=0&&!(r===GOAL_R&&c===GOAL_C)){' +
'ctx.fillStyle=tealC;ctx.font="16px sans-serif";' +
'ctx.fillText(ARROWS[policy[r][c]],x+cellW/2,y+cellH*0.7)}' +

// goal marker
'if(r===GOAL_R&&c===GOAL_C){' +
'ctx.fillStyle=accentC;ctx.font="20px sans-serif";' +
'ctx.fillText("\\u2605",x+cellW/2,y+cellH*0.7)}' +
'}}' +

// walk path highlight
'if(walkPath.length>0){' +
'ctx.strokeStyle=tealC;ctx.lineWidth=3;ctx.setLineDash([4,3]);ctx.beginPath();' +
'for(var i=0;i<walkPath.length;i++){' +
'var px=pad+walkPath[i][1]*cellW+cellW/2;' +
'var py=pad+walkPath[i][0]*cellH+cellH/2;' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}' +
'ctx.stroke();ctx.setLineDash([])}' +

// agent
'var ax=pad+agentC*cellW+cellW/2;var ay=pad+agentR*cellH+cellH/2;' +
'ctx.fillStyle="rgba(94,234,212,0.85)";ctx.beginPath();' +
'ctx.arc(ax,ay,Math.min(cellW,cellH)*0.22,0,Math.PI*2);ctx.fill();' +
'ctx.strokeStyle="rgba(94,234,212,1)";ctx.lineWidth=2;ctx.stroke();' +
'}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var s="<span class=\\"hi\\">"+T.iter+"</span> "+iteration;' +
's+=" &nbsp;|&nbsp; "+T.maxDelta+": <span class=\\"warn\\">"+maxDelta.toFixed(5)+"</span>";' +
's+="<br>\\u03B3 = "+gamma.toFixed(2);' +
'if(isConverged){s+=" &nbsp;|&nbsp; <span class=\\"hi\\">"+T.converged+"</span>"}' +
'if(!isConverged&&iteration===0){s+="<br>"+T.tapWall}' +
'if(walkTimer){s+="<br><span class=\\"hi\\">"+T.walking+"</span>"}' +
'box.innerHTML=s}' +

// ── Step ──
'function doStep(){' +
'if(isConverged&&!walkTimer){startWalk();return}' +
'if(walkTimer)return;' +
'bellmanSweep();drawGrid();updateStats();notifyHeight();' +
'if(isConverged)startWalk()}' +

// ── Auto ──
'function toggleAuto(){' +
'if(walkTimer)return;' +
'if(autoTimer){clearInterval(autoTimer);autoTimer=null;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn";return}' +
'document.getElementById("btnAuto").textContent=T.stop;' +
'document.getElementById("btnAuto").className="btn btn-stop";' +
'var ms=Math.max(20,300-speed*28);' +
'autoTimer=setInterval(function(){' +
'bellmanSweep();drawGrid();updateStats();notifyHeight();' +
'if(isConverged){clearInterval(autoTimer);autoTimer=null;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn";' +
'startWalk()}' +
'},ms)}' +

// ── Walk optimal path ──
'function startWalk(){' +
'if(walkTimer)return;' +
'walkPath=[[0,0]];agentR=0;agentC=0;' +
'var visited={};visited["0,0"]=true;' +
'walkTimer=setInterval(function(){' +
'if(agentR===GOAL_R&&agentC===GOAL_C){clearInterval(walkTimer);walkTimer=null;drawGrid();updateStats();return}' +
'var a=policy[agentR][agentC];' +
'if(a<0){clearInterval(walkTimer);walkTimer=null;return}' +
'var nr=agentR+DR[a],nc=agentC+DC[a];' +
'if(nr<0||nr>=ROWS||nc<0||nc>=COLS||walls[nr][nc]){clearInterval(walkTimer);walkTimer=null;return}' +
'var key=nr+","+nc;if(visited[key]){clearInterval(walkTimer);walkTimer=null;return}' +
'visited[key]=true;' +
'agentR=nr;agentC=nc;walkPath.push([nr,nc]);' +
'drawGrid();updateStats()' +
'},250)}' +

// ── Tap to toggle wall ──
'document.getElementById("cvGrid").addEventListener("pointerdown",function(e){' +
'if(walkTimer)return;' +
'var rect=e.target.getBoundingClientRect();' +
'var x=e.clientX-rect.left;var y=e.clientY-rect.top;' +
'var cw=(rect.width-16)/COLS;var ch=(rect.height-16)/ROWS;' +
'var c=Math.floor((x-8)/cw);var r=Math.floor((y-8)/ch);' +
'if(r<0||r>=ROWS||c<0||c>=COLS)return;' +
'if(r===0&&c===0)return;' +
'if(r===GOAL_R&&c===GOAL_C)return;' +
'walls[r][c]=!walls[r][c];' +
'if(walls[r][c]){V[r][c]=0;policy[r][c]=-1}' +
'drawGrid();notifyHeight()});' +

// ── Gamma slider ──
'function onGamma(){' +
'gamma=+document.getElementById("slGamma").value/100;' +
'document.getElementById("valGamma").textContent=gamma.toFixed(2);' +
'if(iteration>0&&!walkTimer){iteration=0;maxDelta=0;isConverged=false;' +
'for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){if(!walls[r][c])V[r][c]=0;policy[r][c]=-1}' +
'drawGrid();updateStats()}notifyHeight()}' +

// ── Speed slider ──
'function onSpeed(){' +
'speed=+document.getElementById("slSpeed").value;' +
'document.getElementById("valSpeed").textContent=speed;' +
'if(autoTimer){clearInterval(autoTimer);' +
'var ms=Math.max(20,300-speed*28);' +
'autoTimer=setInterval(function(){' +
'bellmanSweep();drawGrid();updateStats();notifyHeight();' +
'if(isConverged){clearInterval(autoTimer);autoTimer=null;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn";startWalk()}' +
'},ms)}}' +

// ── Reset ──
'function doReset(){' +
'initGrid();drawGrid();updateStats();notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-grid").textContent=T.grid;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lblGamma").textContent=T.gamma;' +
'document.getElementById("lblSpeed").textContent=T.speed;' +
'document.getElementById("btnStep").textContent=T.step;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("valGamma").textContent="0.90";' +
'document.getElementById("valSpeed").textContent="5";' +

// ── Init ──
'initGrid();drawGrid();updateStats();' +
'window.addEventListener("resize",function(){drawGrid();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
