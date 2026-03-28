/**
 * Experience Replay — Memory buffer-based learning in RL
 *
 * Features:
 * - Grid world: Agent, Goal, Walls, Traps with Q-value heatmap
 * - Replay buffer visualization: card stack, random/priority sampling highlight
 * - 3 Modes: Sequential (No Replay) / Uniform Replay / Priority Replay (PER)
 * - Fair Compare: independent Q-tables for all 3 modes, 50 episodes each
 * - Buffer Size / Batch Size sliders with endpoint labels
 * - Presets: Balanced / Tiny Buffer / Large Buffer
 * - Explore / Train / Test / Compare / Reset buttons
 * - Learning curve comparison graph (3 lines)
 * - Simple tabular Q-learning + TD-error based prioritization
 * - Dark/light theme, Korean/English bilingual
 */

export function getReplaySimulationHTML(isDark: boolean, lang: string): string {
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
'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);padding:0 6px 60px;-webkit-user-select:none;user-select:none;overflow-x:hidden}' +
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px;border-radius:8px;overflow:hidden}' +
'canvas{width:100%;display:block;background:var(--card);border-radius:6px;touch-action:none}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:40px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:44px;text-align:right;flex-shrink:0;white-space:nowrap}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:var(--bg)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.seg-row{display:flex;gap:0;margin-bottom:10px}' +
'.seg{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;border-radius:8px;min-height:44px}' +
'.seg:not(:last-child){border-right:none}' +
'.seg.active{border-color:var(--teal);background:var(--tealLight);color:var(--teal)}' +
'.preset-row{display:flex;gap:6px;margin-bottom:10px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;min-height:44px;border-radius:8px;min-width:0;overflow:hidden}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.ep-row{display:flex;justify-content:space-between;margin:-4px 0 10px;padding:0 52px 0 48px;font-size:10px;color:var(--text3)}' +
'</style></head><body>' +

// ── Grid World ──
'<div class="panel"><div class="label" id="lbl-grid"></div>' +
'<canvas id="cvGrid" height="240"></canvas></div>' +

// ── Replay Buffer Visualization ──
'<div class="panel"><div class="label" id="lbl-buf"></div>' +
'<canvas id="cvBuf" height="80"></canvas></div>' +

// ── Learning Curve ──
'<div class="panel"><div class="label" id="lbl-curve"></div>' +
'<canvas id="cvCurve" height="120"></canvas></div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +

// Mode (3 segments)
'<div class="label" id="lbl-mode" style="margin-top:0"></div>' +
'<div class="seg-row">' +
'<div class="seg" id="segSeq" onclick="setMode(0)"></div>' +
'<div class="seg active" id="segUni" onclick="setMode(1)"></div>' +
'<div class="seg" id="segPri" onclick="setMode(2)"></div>' +
'</div>' +

// Presets
'<div class="label" id="lbl-preset"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="preBalanced" onclick="onPreset(0)"></div>' +
'<div class="preset" id="preTiny" onclick="onPreset(1)"></div>' +
'<div class="preset" id="preLarge" onclick="onPreset(2)"></div>' +
'</div>' +

// Buffer Size + endpoint labels
'<div class="row"><span class="ctrl-name" id="lblBuf"></span>' +
'<input type="range" id="slBuf" min="10" max="200" value="50" step="10" oninput="onParam()">' +
'<span class="ctrl-val" id="valBuf"></span></div>' +
'<div class="ep-row"><span id="ep-buf-l"></span><span id="ep-buf-r"></span></div>' +

// Batch Size + endpoint labels
'<div class="row"><span class="ctrl-name" id="lblBatch"></span>' +
'<input type="range" id="slBatch" min="1" max="16" value="4" oninput="onParam()">' +
'<span class="ctrl-val" id="valBatch"></span></div>' +
'<div class="ep-row"><span id="ep-bat-l"></span><span id="ep-bat-r"></span></div>' +

// Buttons
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnExplore" onclick="doExplore()"></div>' +
'<div class="btn btn-primary" id="btnTrain" onclick="doTrain()"></div>' +
'<div class="btn" id="btnTest" onclick="doTest()"></div>' +
'</div>' +
'<div class="btn-row" style="margin-top:6px">' +
'<div class="btn btn-primary" id="btnCompare" onclick="doCompare()"></div>' +
'<div class="btn btn-stop" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{grid:"\\uADF8\\uB9AC\\uB4DC \\uC6D4\\uB4DC (Q-\\uAC12 \\uD788\\uD2B8\\uB9F5)",' +
'buf:"\\uB9AC\\uD50C\\uB808\\uC774 \\uBC84\\uD37C",curve:"\\uD559\\uC2B5 \\uACE1\\uC120",' +
'ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",mode:"\\uBAA8\\uB4DC",' +
'modeSeq:"\\uC21C\\uCC28\\uC801",modeUni:"\\uADE0\\uC77C \\uC7AC\\uC0DD",modePri:"\\uC6B0\\uC120\\uC21C\\uC704",' +
'bufSize:"\\uBC84\\uD37C \\uD06C\\uAE30",batchSize:"\\uBC30\\uCE58 \\uD06C\\uAE30",' +
'explore:"\\uD0D0\\uC0C9 (10\\uD68C)",train:"\\uD559\\uC2B5",test:"\\uD14C\\uC2A4\\uD2B8",' +
'compare:"\\u25B6 \\uACF5\\uC815 \\uBE44\\uAD50",reset:"\\u21BA \\uB9AC\\uC14B",' +
'bufFill:"\\uBC84\\uD37C \\uCC44\\uC6C0",episodes:"\\uC5D0\\uD53C\\uC18C\\uB4DC",' +
'success:"\\uC131\\uACF5\\uB960",avgReward:"\\uD3C9\\uADE0 \\uBCF4\\uC0C1",' +
'trainSteps:"\\uD559\\uC2B5 \\uC2A4\\uD15D",agent:"A",goal:"G",trap:"T",' +
'sampled:"\\uC0D8\\uD50C\\uB9C1\\uB428",' +
'maxTD:"\\uCD5C\\uB300 TD",avgTD:"\\uD3C9\\uADE0 TD",' +
'prHint:"TD\\u2191 = \\uB180\\uB77C\\uC6C0\\u2191 \\u2192 \\uC7AC\\uC0DD\\u2191",' +
'preset:"\\uD504\\uB9AC\\uC14B",' +
'preBalanced:"\\uADE0\\uD615",preTiny:"\\uC791\\uC740 \\uBC84\\uD37C",preLarge:"\\uD070 \\uBC84\\uD37C",' +
'bufSmall:"\\uC18C(10)",bufLarge:"\\uB300(200)",' +
'batSingle:"\\uB2E8\\uC77C(1)",batFull:"\\uBC30\\uCE58(16)"},' +
'en:{grid:"GRID WORLD (Q-VALUE HEATMAP)",' +
'buf:"REPLAY BUFFER",curve:"LEARNING CURVE",' +
'ctrl:"PARAMETERS",stats:"STATISTICS",mode:"MODE",' +
'modeSeq:"Sequential",modeUni:"Uniform",modePri:"Priority",' +
'bufSize:"Buffer Size",batchSize:"Batch Size",' +
'explore:"Explore (x10)",train:"Train",test:"Test",' +
'compare:"\\u25B6 Fair Compare",reset:"\\u21BA Reset",' +
'bufFill:"Buffer Fill",episodes:"Episodes",' +
'success:"Success Rate",avgReward:"Avg Reward",' +
'trainSteps:"Train Steps",agent:"A",goal:"G",trap:"T",' +
'sampled:"Sampled",' +
'maxTD:"Max TD",avgTD:"Avg TD",' +
'prHint:"TD\\u2191 = Surprise\\u2191 \\u2192 Replay\\u2191",' +
'preset:"PRESET",' +
'preBalanced:"Balanced",preTiny:"Tiny Buffer",preLarge:"Large Buffer",' +
'bufSmall:"Small(10)",bufLarge:"Large(200)",' +
'batSingle:"Single(1)",batFull:"Batch(16)"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── Grid World Config ──
'var GS=6;' +
'var WALL=1;var TRAP=2;var GOAL=3;var EMPTY=0;' +
'var grid=[];var agentPos={r:0,c:0};var goalPos={r:5,c:5};' +
'var DR=[-1,0,1,0];var DC=[0,1,0,-1];' +
'var Q=[];' +
'var replayMode=1;var bufSize=50;var batchSize=4;' +
'var buffer=[];var sampledIdx=[];' +
'var episodes=0;var successes=0;var totalReward=0;var trainSteps=0;' +
'var seqHistory=[];var uniHistory=[];var priHistory=[];' +
'var alpha=0.3;var gamma=0.9;var epsilon=0.3;' +
'var PER_ALPHA=0.6;var PER_EPS=0.01;' +
'var activePreset=0;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Init grid ──
'function initGrid(){' +
'grid=[];' +
'for(var r=0;r<GS;r++){grid.push([]);for(var c=0;c<GS;c++)grid[r].push(EMPTY)}' +
'grid[1][1]=WALL;grid[1][2]=WALL;grid[3][4]=WALL;grid[2][4]=WALL;grid[4][1]=WALL;' +
'grid[2][2]=TRAP;grid[4][3]=TRAP;' +
'grid[goalPos.r][goalPos.c]=GOAL;' +
'Q=[];for(var r=0;r<GS;r++){Q.push([]);for(var c=0;c<GS;c++){Q[r].push([0,0,0,0])}}' +
'agentPos={r:0,c:0};buffer=[];sampledIdx=[];' +
'episodes=0;successes=0;totalReward=0;trainSteps=0}' +

// ── Step environment ──
'function envStep(r,c,a){' +
'var nr=r+DR[a];var nc=c+DC[a];' +
'if(nr<0||nr>=GS||nc<0||nc>=GS||grid[nr][nc]===WALL){nr=r;nc=c}' +
'var reward=-0.1;var done=false;' +
'if(grid[nr][nc]===TRAP){reward=-1;done=true}' +
'else if(grid[nr][nc]===GOAL){reward=1;done=true}' +
'return{nr:nr,nc:nc,reward:reward,done:done}}' +

// ── Choose action (epsilon-greedy) ──
'function chooseAction(r,c){' +
'if(Math.random()<epsilon){return Math.floor(Math.random()*4)}' +
'var best=0;var bestV=Q[r][c][0];' +
'for(var a=1;a<4;a++){if(Q[r][c][a]>bestV){bestV=Q[r][c][a];best=a}}' +
'return best}' +

// ── TD error calculation ──
'function calcTD(s,a,r2,s2,done){' +
'var mQ=done?0:Math.max.apply(null,Q[s2[0]][s2[1]]);' +
'return Math.abs(r2+gamma*mQ-Q[s[0]][s[1]][a])}' +

// ── Run one episode ──
'function runEpisode(){' +
'var r=0,c=0;var epReward=0;var steps=0;' +
'while(steps<50){' +
'var a=chooseAction(r,c);' +
'var res=envStep(r,c,a);' +
'var td=calcTD([r,c],a,res.reward,[res.nr,res.nc],res.done);' +
'buffer.push({s:[r,c],a:a,r2:res.reward,s2:[res.nr,res.nc],done:res.done,td:td});' +
'if(buffer.length>bufSize)buffer.shift();' +
'epReward+=res.reward;steps++;' +
'if(replayMode===0){' +
'var maxQ2=0;if(!res.done){maxQ2=Math.max.apply(null,Q[res.nr][res.nc])}' +
'Q[r][c][a]+=alpha*(res.reward+gamma*maxQ2-Q[r][c][a]);trainSteps++}' +
'r=res.nr;c=res.nc;' +
'if(res.done)break}' +
'episodes++;totalReward+=epReward;' +
'if(epReward>0)successes++;' +
'return epReward}' +

// ── Train from buffer (uniform sampling) ──
'function trainFromBuffer(){' +
'if(buffer.length===0)return;' +
'sampledIdx=[];' +
'var n=Math.min(batchSize,buffer.length);' +
'for(var i=0;i<n;i++){' +
'var idx=Math.floor(Math.random()*buffer.length);' +
'sampledIdx.push(idx);' +
'var exp=buffer[idx];' +
'var maxQ2=0;if(!exp.done){maxQ2=Math.max.apply(null,Q[exp.s2[0]][exp.s2[1]])}' +
'Q[exp.s[0]][exp.s[1]][exp.a]+=alpha*(exp.r2+gamma*maxQ2-Q[exp.s[0]][exp.s[1]][exp.a]);' +
'exp.td=calcTD(exp.s,exp.a,exp.r2,exp.s2,exp.done)}' +
'trainSteps+=n}' +

// ── Train from buffer (priority sampling — PER) ──
'function trainFromBufferPri(){' +
'if(buffer.length===0)return;' +
'sampledIdx=[];' +
// Update all TD errors
'for(var i=0;i<buffer.length;i++){' +
'buffer[i].td=calcTD(buffer[i].s,buffer[i].a,buffer[i].r2,buffer[i].s2,buffer[i].done)}' +
// Calculate priorities: P(i) ~ (|TD| + eps)^alpha
'var priorities=[];var sumP=0;' +
'for(var i=0;i<buffer.length;i++){' +
'var p=Math.pow(buffer[i].td+PER_EPS,PER_ALPHA);' +
'priorities.push(p);sumP+=p}' +
// Weighted sampling
'var n=Math.min(batchSize,buffer.length);' +
'for(var i=0;i<n;i++){' +
'var rnd=Math.random()*sumP;var cum=0;var idx=0;' +
'for(var j=0;j<buffer.length;j++){' +
'cum+=priorities[j];if(cum>=rnd){idx=j;break}}' +
'sampledIdx.push(idx);' +
'var exp=buffer[idx];' +
'var maxQ2=0;if(!exp.done){maxQ2=Math.max.apply(null,Q[exp.s2[0]][exp.s2[1]])}' +
'Q[exp.s[0]][exp.s[1]][exp.a]+=alpha*(exp.r2+gamma*maxQ2-Q[exp.s[0]][exp.s[1]][exp.a]);' +
'exp.td=calcTD(exp.s,exp.a,exp.r2,exp.s2,exp.done)}' +
'trainSteps+=n}' +

// ── Explore: run 10 episodes ──
'function doExplore(){' +
'for(var i=0;i<10;i++){' +
'var epR=runEpisode();' +
'if(replayMode===0)seqHistory.push(epR);' +
'else if(replayMode===1)uniHistory.push(epR);' +
'else priHistory.push(epR)}' +
'drawAll();notifyHeight()}' +

// ── Train step ──
'function doTrain(){' +
'if(replayMode===0){' +
'var epR=runEpisode();seqHistory.push(epR)}' +
'else if(replayMode===1){trainFromBuffer()}' +
'else{trainFromBufferPri()}' +
'drawAll();notifyHeight()}' +

// ── Test: run greedy policy ──
'function doTest(){' +
'var oldEps=epsilon;epsilon=0;' +
'var r=0,c=0;var path=[{r:r,c:c}];var steps=0;' +
'while(steps<50){' +
'var a=chooseAction(r,c);' +
'var res=envStep(r,c,a);' +
'r=res.nr;c=res.nc;path.push({r:r,c:c});steps++;' +
'if(res.done)break}' +
'epsilon=oldEps;agentPos=path[path.length-1];' +
'var step=0;' +
'function animPath(){' +
'if(step>=path.length){drawAll();notifyHeight();return}' +
'agentPos=path[step];step++;drawGrid();' +
'setTimeout(animPath,120)}' +
'animPath()}' +

// ── Fair Compare: independent Q-tables for all 3 modes ──
'function doCompare(){' +
'var btn=document.getElementById("btnCompare");' +
'btn.style.opacity="0.5";btn.style.pointerEvents="none";' +
'setTimeout(function(){' +
'seqHistory=[];uniHistory=[];priHistory=[];' +
'var savedMode=replayMode;' +
'var RUNS=50;' +
// Sequential: online learning
'initGrid();replayMode=0;' +
'for(var i=0;i<RUNS;i++){seqHistory.push(runEpisode())}' +
// Uniform Replay: buffer + uniform sampling after each episode
'initGrid();replayMode=1;' +
'for(var i=0;i<RUNS;i++){uniHistory.push(runEpisode());trainFromBuffer()}' +
// Priority Replay: buffer + TD-weighted sampling after each episode
'initGrid();replayMode=2;' +
'for(var i=0;i<RUNS;i++){priHistory.push(runEpisode());trainFromBufferPri()}' +
// Restore mode, keep Priority state for Test
'replayMode=savedMode;' +
'btn.style.opacity="1";btn.style.pointerEvents="";' +
'drawAll();notifyHeight()},30)}' +

// ── Draw grid ──
'function drawGrid(){' +
'var cv=document.getElementById("cvGrid");' +
'var dim=setupCanvas(cv,240);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var bgC=cs.getPropertyValue("--bg").trim();' +

'var pad=10;var cellS=Math.min((w-pad*2)/GS,(h-pad*2)/GS);' +
'var offX=(w-cellS*GS)/2;var offY=(h-cellS*GS)/2;' +

// find Q range for heatmap
'var maxQ=0.01;' +
'for(var r=0;r<GS;r++)for(var c=0;c<GS;c++){' +
'var mv=Math.max.apply(null,Q[r][c]);if(Math.abs(mv)>maxQ)maxQ=Math.abs(mv)}' +

'for(var r=0;r<GS;r++){for(var c=0;c<GS;c++){' +
'var x=offX+c*cellS;var y=offY+r*cellS;' +

// Q-value heatmap color
'var qMax=Math.max.apply(null,Q[r][c]);' +
'var intensity=Math.min(1,Math.abs(qMax)/maxQ);' +
'if(grid[r][c]===WALL){ctx.fillStyle=text3C}' +
'else if(grid[r][c]===TRAP){ctx.fillStyle=redC;ctx.globalAlpha=0.15+intensity*0.3}' +
'else if(grid[r][c]===GOAL){ctx.fillStyle=greenC;ctx.globalAlpha=0.2+intensity*0.4}' +
'else if(qMax>0){ctx.fillStyle=tealC;ctx.globalAlpha=intensity*0.35}' +
'else if(qMax<0){ctx.fillStyle=redC;ctx.globalAlpha=intensity*0.2}' +
'else{ctx.fillStyle=borderC;ctx.globalAlpha=0.1}' +
'ctx.fillRect(x+1,y+1,cellS-2,cellS-2);ctx.globalAlpha=1;' +

// border
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(x,y,cellS,cellS);' +

// cell content
'ctx.textAlign="center";ctx.font="bold 10px -apple-system,sans-serif";' +
'if(grid[r][c]===WALL){ctx.fillStyle=textC;ctx.fillText("\\u2588",x+cellS/2,y+cellS/2+4)}' +
'else if(grid[r][c]===TRAP){ctx.fillStyle=redC;ctx.fillText(T.trap,x+cellS/2,y+cellS/2+4)}' +
'else if(grid[r][c]===GOAL){ctx.fillStyle=greenC;ctx.fillText(T.goal,x+cellS/2,y+cellS/2+4)}' +

// Q value text
'if(grid[r][c]===EMPTY&&maxQ>0.01){' +
'ctx.fillStyle=text3C;ctx.font="7px monospace";' +
'ctx.fillText(qMax.toFixed(1),x+cellS/2,y+cellS-4)}' +

// agent
'if(r===agentPos.r&&c===agentPos.c){' +
'ctx.beginPath();ctx.arc(x+cellS/2,y+cellS/2,cellS*0.3,0,Math.PI*2);' +
'ctx.fillStyle=accentC;ctx.fill();ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.stroke();' +
'ctx.fillStyle=bgC;ctx.font="bold 9px monospace";ctx.fillText(T.agent,x+cellS/2,y+cellS/2+3)}' +
'}}' +

// legend
'ctx.font="9px -apple-system,sans-serif";ctx.fillStyle=text3C;ctx.textAlign="left";' +
'ctx.fillText(T.agent+"=Agent  "+T.goal+"=Goal  "+T.trap+"=Trap",offX,h-2)}' +

// ── Draw buffer ──
'function drawBuf(){' +
'var cv=document.getElementById("cvBuf");' +
'var dim=setupCanvas(cv,80);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +

'var n=buffer.length;if(n===0){' +
'ctx.fillStyle=text3C;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.bufFill+": 0%",w/2,h/2+4);return}' +

'var cardW=Math.min(12,Math.max(3,(w-20)/bufSize));' +
'var cardH=h-20;var pad=10;' +

// Find max TD for priority coloring
'var maxTD=0.01;' +
'if(replayMode===2){for(var i=0;i<n;i++){if(buffer[i].td>maxTD)maxTD=buffer[i].td}}' +

'for(var i=0;i<n;i++){' +
'var x=pad+i*cardW;' +
'var isSampled=sampledIdx.indexOf(i)>=0;' +

// Priority mode: color by TD error intensity
'if(replayMode===2){' +
'var tdRatio=Math.min(1,buffer[i].td/maxTD);' +
'ctx.fillStyle=isSampled?tealC:(tdRatio>0.5?greenC:borderC);' +
'ctx.globalAlpha=isSampled?0.9:(0.15+tdRatio*0.65)}' +
'else{' +
'ctx.fillStyle=isSampled?tealC:borderC;' +
'ctx.globalAlpha=isSampled?0.8:0.3}' +
'ctx.fillRect(x,10,cardW-1,cardH);ctx.globalAlpha=1;' +
// reward indicator
'if(buffer[i].r2>0){ctx.fillStyle=tealC;ctx.fillRect(x,10,cardW-1,4)}' +
'else if(buffer[i].r2<-0.5){ctx.fillStyle=accentC;ctx.fillRect(x,10,cardW-1,4)}' +
'}' +

// fill label
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(T.bufFill+": "+Math.round(n/bufSize*100)+"%  ("+n+"/"+bufSize+")",w-pad,h-2);' +
'if(sampledIdx.length>0){ctx.fillStyle=tealC;ctx.textAlign="left";' +
'ctx.fillText(T.sampled+": "+sampledIdx.length,pad,h-2)}}' +

// ── Draw learning curve (3 lines) ──
'function drawCurve(){' +
'var cv=document.getElementById("cvCurve");' +
'var dim=setupCanvas(cv,120);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=30;var pt=20;var pb=20;var pr=10;' +
'var gW=w-pad-pr;var gH=h-pt-pb;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("+1",pad-4,pt+6);ctx.fillText("-1",pad-4,h-pb-2);' +

// running average line drawer
'function drawLine(data,color){' +
'if(data.length<2)return;' +
'var runAvg=[];var sum=0;var winSize=5;' +
'for(var i=0;i<data.length;i++){sum+=data[i];' +
'if(i>=winSize)sum-=data[i-winSize];' +
'runAvg.push(sum/Math.min(i+1,winSize))}' +
'ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<runAvg.length;i++){' +
'var x=pad+(i/(runAvg.length-1))*gW;' +
'var y=pt+(1-runAvg[i])/2*gH;' +
'if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke()}' +

'drawLine(seqHistory,accentC);' +
'drawLine(uniHistory,tealC);' +
'drawLine(priHistory,greenC);' +

// legend (dynamic spacing)
'ctx.font="9px -apple-system,sans-serif";' +
'var lgx=pad+4;' +
'ctx.fillStyle=accentC;ctx.fillRect(lgx,4,8,8);lgx+=12;' +
'ctx.fillStyle=text3C;ctx.textAlign="left";ctx.fillText(T.modeSeq,lgx,12);lgx+=ctx.measureText(T.modeSeq).width+10;' +
'ctx.fillStyle=tealC;ctx.fillRect(lgx,4,8,8);lgx+=12;' +
'ctx.fillStyle=text3C;ctx.fillText(T.modeUni,lgx,12);lgx+=ctx.measureText(T.modeUni).width+10;' +
'ctx.fillStyle=greenC;ctx.fillRect(lgx,4,8,8);lgx+=12;' +
'ctx.fillStyle=text3C;ctx.fillText(T.modePri,lgx,12)}' +

// ── Draw all ──
'function drawAll(){drawGrid();drawBuf();drawCurve();updateStats()}' +

// ── Mode (3 segments) ──
'function setMode(m){' +
'replayMode=m;' +
'document.getElementById("segSeq").className=m===0?"seg active":"seg";' +
'document.getElementById("segUni").className=m===1?"seg active":"seg";' +
'document.getElementById("segPri").className=m===2?"seg active":"seg";' +
'drawBuf();notifyHeight()}' +

// ── Presets ──
'function onPreset(idx){' +
'if(idx===0){bufSize=50;batchSize=4}' +
'else if(idx===1){bufSize=10;batchSize=4}' +
'else{bufSize=200;batchSize=8}' +
'document.getElementById("slBuf").value=bufSize;' +
'document.getElementById("slBatch").value=batchSize;' +
'activePreset=idx;' +
'var presets=document.querySelectorAll(".preset");' +
'for(var i=0;i<presets.length;i++)presets[i].className="preset";' +
'presets[idx].className="preset active";' +
'onParam();initGrid();drawAll();notifyHeight()}' +

// ── Param ──
'function onParam(){' +
'bufSize=+document.getElementById("slBuf").value;' +
'batchSize=+document.getElementById("slBatch").value;' +
'document.getElementById("valBuf").textContent=bufSize;' +
'document.getElementById("valBatch").textContent=batchSize;' +
// Deactivate preset if slider manually changed
'var presets=document.querySelectorAll(".preset");' +
'for(var i=0;i<presets.length;i++)presets[i].className="preset";' +
'notifyHeight()}' +

// ── Reset ──
'function doReset(){' +
'initGrid();seqHistory=[];uniHistory=[];priHistory=[];' +
'drawAll();notifyHeight()}' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var s="<span class=\\"hi\\">"+T.bufFill+"</span> "+Math.round(buffer.length/bufSize*100)+"%";' +
's+=" ("+buffer.length+"/"+bufSize+")<br>";' +
's+=T.episodes+": <span class=\\"hi\\">"+episodes+"</span>";' +
's+=" | "+T.trainSteps+": "+trainSteps+"<br>";' +
'var sRate=episodes>0?(successes/episodes*100).toFixed(0)+"%":"--";' +
's+=T.success+": <span class=\\"warn\\">"+sRate+"</span>";' +
'var avg=episodes>0?(totalReward/episodes).toFixed(2):"--";' +
's+=" | "+T.avgReward+": "+avg;' +
// Priority mode: show TD error info + educational hint
'if(replayMode===2&&buffer.length>0){' +
'var mxTD=0;var smTD=0;' +
'for(var i=0;i<buffer.length;i++){if(buffer[i].td>mxTD)mxTD=buffer[i].td;smTD+=buffer[i].td}' +
's+="<br>"+T.maxTD+": <span class=\\"hi\\">"+mxTD.toFixed(2)+"</span>";' +
's+=" | "+T.avgTD+": "+(smTD/buffer.length).toFixed(2);' +
's+="<br><span class=\\"warn\\">"+T.prHint+"</span>"}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-grid").textContent=T.grid;' +
'document.getElementById("lbl-buf").textContent=T.buf;' +
'document.getElementById("lbl-curve").textContent=T.curve;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-mode").textContent=T.mode;' +
'document.getElementById("segSeq").textContent=T.modeSeq;' +
'document.getElementById("segUni").textContent=T.modeUni;' +
'document.getElementById("segPri").textContent=T.modePri;' +
'document.getElementById("lbl-preset").textContent=T.preset;' +
'document.getElementById("preBalanced").textContent=T.preBalanced;' +
'document.getElementById("preTiny").textContent=T.preTiny;' +
'document.getElementById("preLarge").textContent=T.preLarge;' +
'document.getElementById("lblBuf").textContent=T.bufSize;' +
'document.getElementById("lblBatch").textContent=T.batchSize;' +
'document.getElementById("ep-buf-l").textContent=T.bufSmall;' +
'document.getElementById("ep-buf-r").textContent=T.bufLarge;' +
'document.getElementById("ep-bat-l").textContent=T.batSingle;' +
'document.getElementById("ep-bat-r").textContent=T.batFull;' +
'document.getElementById("btnExplore").textContent=T.explore;' +
'document.getElementById("btnTrain").textContent=T.train;' +
'document.getElementById("btnTest").textContent=T.test;' +
'document.getElementById("btnCompare").textContent=T.compare;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'onParam();initGrid();drawAll();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
