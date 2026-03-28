/**
 * Imitation Learning — Learning from expert demonstrations simulation
 *
 * Features:
 * - 2D top-down environment with walls/obstacles, start (green), goal (red)
 * - Demo Mode: touch/drag to draw expert path
 * - Train button: learns KNN-based policy from demos
 * - Test button: agent autonomously follows learned policy
 * - Environment presets: Simple Corridor / S-curve / Obstacle Course
 * - DAgger toggle for interactive correction
 * - Dark/light theme, Korean/English bilingual
 */

export function getImitationSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.btn-disabled{opacity:0.4;pointer-events:none}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .red{color:var(--red);font-weight:700}' +
'.stats .grn{color:var(--green);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:10px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;min-height:44px;border-radius:8px;min-width:0;overflow:hidden}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.toggle-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;min-height:44px}' +
'.toggle-check{width:22px;height:22px;accent-color:var(--teal)}' +
'.toggle-label{font-size:12px;font-weight:600;color:var(--text)}' +
'.mode-badge{display:inline-block;padding:3px 8px;font-size:10px;font-weight:700;letter-spacing:0.5px;margin-bottom:8px;border-radius:4px}' +
'.mode-demo{background:var(--tealLight);color:var(--teal);border:1px solid var(--teal)}' +
'.mode-test{background:var(--accent);color:#1A1816}' +
'.hint{font-size:10px;color:var(--text3);margin-top:6px}' +
'</style></head><body>' +

// ── Main Canvas ──
'<div class="panel"><div class="label" id="lbl-env"></div>' +
'<span class="mode-badge mode-demo" id="modeBadge"></span>' +
'<canvas id="cvMain" height="300"></canvas>' +
'<div class="hint" id="hintDraw"></div></div>' +

// ── Deviation Graph ──
'<div class="panel"><div class="label" id="lbl-dev"></div>' +
'<canvas id="cvDev" height="100"></canvas></div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="label" id="lbl-envPre" style="margin-top:4px"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="preCorridor" onclick="setEnv(0)"></div>' +
'<div class="preset" id="preSCurve" onclick="setEnv(1)"></div>' +
'<div class="preset" id="preObsCourse" onclick="setEnv(2)"></div>' +
'<div class="preset" id="preFork" onclick="setEnv(3)"></div>' +
'</div>' +
'<div class="toggle-row"><input type="checkbox" class="toggle-check" id="chkDagger" onchange="onParam()">' +
'<span class="toggle-label" id="lbl-dagger">DAgger</span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-kn"></span>' +
'<input type="range" id="slK" min="1" max="15" value="5" oninput="onParam()">' +
'<span class="ctrl-val" id="valK">5</span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-noise"></span>' +
'<input type="range" id="slNoise" min="0" max="50" value="0" oninput="onParam()">' +
'<span class="ctrl-val" id="valNoise">0</span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnTrain" onclick="onTrain()"></div>' +
'<div class="btn btn-primary" id="btnTest" onclick="onTest()"></div>' +
'</div>' +
'<div class="btn-row" style="margin-top:6px">' +
'<div class="btn" id="btnClearDemo" onclick="onClearDemos()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{env:"\\uD658\\uACBD",ctrl:"\\uC81C\\uC5B4",envPre:"\\uD658\\uACBD \\uD504\\uB9AC\\uC14B",' +
'corridor:"\\uBCF5\\uB3C4",scurve:"S-\\uCEE4\\uBE0C",obscourse:"\\uC7A5\\uC560\\uBB3C \\uCF54\\uC2A4",' +
'dagger:"DAgger (\\uC778\\uD130\\uB799\\uD2F0\\uBE0C \\uBCF4\\uC815)",' +
'train:"\\uD559\\uC2B5",test:"\\uD14C\\uC2A4\\uD2B8",' +
'clearDemo:"\\uB370\\uBAA8 \\uC9C0\\uC6B0\\uAE30",reset:"\\u21BA \\uB9AC\\uC14B",' +
'stats:"\\uD1B5\\uACC4",' +
'demos:"\\uB370\\uBAA8 \\uC218",successRate:"\\uC131\\uACF5\\uB960",' +
'avgLen:"\\uD3C9\\uADE0 \\uACBD\\uB85C",status:"\\uC0C1\\uD0DC",' +
'demoMode:"\\uB370\\uBAA8 \\uBAA8\\uB4DC",testing:"\\uD14C\\uC2A4\\uD2B8 \\uC911",learning:"\\uD559\\uC2B5 \\uC911",' +
'trained:"\\uD559\\uC2B5 \\uC644\\uB8CC",notTrained:"\\uBBF8\\uD559\\uC2B5",' +
'success:"\\uC131\\uACF5!",fail:"\\uC2E4\\uD328",' +
'hintDraw:"\\uCE94\\uBC84\\uC2A4\\uB97C \\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uC804\\uBB38\\uAC00 \\uACBD\\uB85C\\uB97C \\uADF8\\uB9AC\\uC138\\uC694 (\\uCD08\\uB85D\\u2192\\uBE68\\uAC04)",' +
'kn:"K \\uC774\\uC6C3",noise:"\\uB178\\uC774\\uC988",fork:"\\uBD84\\uAE30\\uC810",' +
'dev:"\\uD3B8\\uCC28",devTime:"\\uC2DC\\uAC04",avgDev:"\\uD3C9\\uADE0",peakDev:"\\uCD5C\\uB300",' +
'multiWarn:"\\u26A0 \\uB2E4\\uBAA8\\uB2EC \\uD3C9\\uADE0\\uD654"},' +
'en:{env:"ENVIRONMENT",ctrl:"CONTROLS",envPre:"ENVIRONMENT PRESET",' +
'corridor:"Corridor",scurve:"S-Curve",obscourse:"Obstacles",' +
'dagger:"DAgger (Interactive Correction)",' +
'train:"Train",test:"Test",' +
'clearDemo:"Clear Demos",reset:"\\u21BA Reset",' +
'stats:"STATISTICS",' +
'demos:"Demos",successRate:"Success Rate",' +
'avgLen:"Avg Path",status:"Status",' +
'demoMode:"DEMO MODE",testing:"TESTING",learning:"LEARNING",' +
'trained:"TRAINED",notTrained:"NOT TRAINED",' +
'success:"SUCCESS!",fail:"FAILED",' +
'hintDraw:"Drag on canvas to draw expert path (green \\u2192 red)",' +
'kn:"K Neighbors",noise:"Noise",fork:"Fork",' +
'dev:"DEVIATION",devTime:"Time",avgDev:"Avg",peakDev:"Peak",' +
'multiWarn:"\\u26A0 Multimodal Avg"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var canvasW=300,canvasH=300;' +
'var envType=0;' +
'var walls=[];' + // {x,y,w,h}
'var startPt={x:30,y:0};' +
'var goalPt={x:270,y:0};' +
'var demos=[];' + // [{points:[{x,y}]}, ...]
'var currentDemo=null;' + // being drawn
'var isTrained=false;' +
'var daggerOn=false;' +
'var agentPos={x:0,y:0};' +
'var agentTrail=[];' +
'var agentRunning=false;var animId=null;' +
'var testResults=[];' + // true/false per test
'var K_NEIGHBORS=5;' +
'var mode="demo";' + // "demo" | "test"
'var sparkles=[];' +
'var isDrawing=false;' +
'var noiseLevel=0;' +
'var deviations=[];' +

// ── Environments ──
'function buildEnv(){' +
'walls=[];' +
'if(envType===0){' + // Corridor
'startPt={x:30,y:canvasH/2};goalPt={x:canvasW-30,y:canvasH/2};' +
'var mh=canvasH*0.35;' +
'walls.push({x:0,y:0,w:canvasW,h:mh});' +
'walls.push({x:0,y:canvasH-mh,w:canvasW,h:mh});' +
// gap obstacle in middle
'walls.push({x:canvasW*0.45,y:mh,w:20,h:(canvasH-mh*2)*0.4});' +
'walls.push({x:canvasW*0.45,y:canvasH-mh-(canvasH-mh*2)*0.35,w:20,h:(canvasH-mh*2)*0.35})}' +
'else if(envType===1){' + // S-curve
'startPt={x:30,y:canvasH*0.25};goalPt={x:canvasW-30,y:canvasH*0.75};' +
'var th=18;' +
// top wall
'walls.push({x:0,y:0,w:canvasW,h:canvasH*0.1});' +
// bottom wall
'walls.push({x:0,y:canvasH*0.9,w:canvasW,h:canvasH*0.1});' +
// S-curve barriers
'walls.push({x:canvasW*0.3,y:0,w:th,h:canvasH*0.55});' +
'walls.push({x:canvasW*0.6,y:canvasH*0.45,w:th,h:canvasH*0.55})}' +
'else if(envType===2){' + // Obstacle course
'startPt={x:30,y:canvasH/2};goalPt={x:canvasW-30,y:canvasH/2};' +
'walls.push({x:0,y:0,w:canvasW,h:15});' +
'walls.push({x:0,y:canvasH-15,w:canvasW,h:15});' +
'walls.push({x:canvasW*0.2,y:canvasH*0.15,w:20,h:canvasH*0.45});' +
'walls.push({x:canvasW*0.4,y:canvasH*0.4,w:20,h:canvasH*0.45});' +
'walls.push({x:canvasW*0.6,y:canvasH*0.1,w:20,h:canvasH*0.4});' +
'walls.push({x:canvasW*0.75,y:canvasH*0.5,w:20,h:canvasH*0.35})}' +
'else{' + // Fork — multimodal averaging demo
'startPt={x:25,y:canvasH/2};goalPt={x:canvasW-25,y:canvasH/2};' +
'var cw=Math.floor(canvasW*0.38);' +
'var ct=Math.floor(canvasH*0.35);var cb=Math.floor(canvasH*0.65);' +
'var ft=Math.floor(canvasH*0.43);var fb=Math.floor(canvasH*0.57);' +
'walls.push({x:0,y:0,w:canvasW,h:20});' + // top boundary
'walls.push({x:0,y:canvasH-20,w:canvasW,h:20});' + // bottom boundary
'walls.push({x:0,y:20,w:cw,h:ct-20});' + // upper corridor wall
'walls.push({x:0,y:cb,w:cw,h:canvasH-20-cb});' + // lower corridor wall
'walls.push({x:cw,y:ft,w:Math.floor(canvasW*0.35),h:fb-ft})}}' + // fork divider

// ── Check wall collision ──
'function hitsWall(x,y,r){' +
'for(var i=0;i<walls.length;i++){' +
'var w=walls[i];' +
'var cx=Math.max(w.x,Math.min(x,w.x+w.w));' +
'var cy=Math.max(w.y,Math.min(y,w.y+w.h));' +
'var dx=x-cx;var dy=y-cy;' +
'if(Math.sqrt(dx*dx+dy*dy)<r)return true}' +
'return false}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── KNN Policy: find K nearest demo points, average their directions ──
'function knnPolicy(px,py){' +
// build flat array of all demo points with direction vectors
'var allPts=[];' +
'for(var di=0;di<demos.length;di++){' +
'var pts=demos[di].points;' +
'for(var i=0;i<pts.length-1;i++){' +
'var dx=pts[i+1].x-pts[i].x;var dy=pts[i+1].y-pts[i].y;' +
'var dist=Math.sqrt(dx*dx+dy*dy);' +
'if(dist>0.5){allPts.push({x:pts[i].x,y:pts[i].y,dx:dx/dist,dy:dy/dist})}}}' +
'if(allPts.length===0)return{dx:1,dy:0};' +

// find K nearest
'var dists=[];' +
'for(var i=0;i<allPts.length;i++){' +
'var ddx=allPts[i].x-px;var ddy=allPts[i].y-py;' +
'dists.push({idx:i,d:ddx*ddx+ddy*ddy})}' +
'dists.sort(function(a,b){return a.d-b.d});' +
'var k=Math.min(K_NEIGHBORS,dists.length);' +
'var avgDx=0,avgDy=0;' +
'for(var i=0;i<k;i++){' +
'var p=allPts[dists[i].idx];' +
// weight by inverse distance
'var w=1/(Math.sqrt(dists[i].d)+0.1);' +
'avgDx+=p.dx*w;avgDy+=p.dy*w}' +
'var mag=Math.sqrt(avgDx*avgDx+avgDy*avgDy);' +
'if(mag<0.001)return{dx:1,dy:0};' +
'return{dx:avgDx/mag,dy:avgDy/mag}}' +

// ── Draw ──
'function draw(){' +
'var dim=setupCanvas(document.getElementById("cvMain"),300);canvasW=dim.w;canvasH=dim.h;' +
'var cv=document.getElementById("cvMain");' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,canvasW,canvasH);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +

// walls
'for(var i=0;i<walls.length;i++){' +
'var w=walls[i];' +
'ctx.fillStyle=text3C;ctx.globalAlpha=0.4;' +
'ctx.fillRect(w.x,w.y,w.w,w.h);ctx.globalAlpha=1;' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(w.x,w.y,w.w,w.h)}' +

// start point (green circle)
'ctx.beginPath();ctx.arc(startPt.x,startPt.y,8,0,Math.PI*2);' +
'ctx.fillStyle=greenC;ctx.globalAlpha=0.7;ctx.fill();ctx.globalAlpha=1;' +
'ctx.strokeStyle=greenC;ctx.lineWidth=2;ctx.stroke();' +
// goal point (red circle)
'ctx.beginPath();ctx.arc(goalPt.x,goalPt.y,8,0,Math.PI*2);' +
'ctx.fillStyle=redC;ctx.globalAlpha=0.7;ctx.fill();ctx.globalAlpha=1;' +
'ctx.strokeStyle=redC;ctx.lineWidth=2;ctx.stroke();' +

// demo paths (translucent teal)
'for(var di=0;di<demos.length;di++){' +
'var pts=demos[di].points;' +
'if(pts.length<2)continue;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.globalAlpha=0.25;' +
'ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);' +
'for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);' +
'ctx.stroke();ctx.globalAlpha=1}' +

// current drawing demo (brighter)
'if(currentDemo&&currentDemo.points.length>1){' +
'var pts=currentDemo.points;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2.5;ctx.globalAlpha=0.6;' +
'ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);' +
'for(var i=1;i<pts.length;i++)ctx.lineTo(pts[i].x,pts[i].y);' +
'ctx.stroke();ctx.globalAlpha=1}' +

// agent trail
'if(agentTrail.length>1){' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.globalAlpha=0.6;' +
'ctx.beginPath();ctx.moveTo(agentTrail[0].x,agentTrail[0].y);' +
'for(var i=1;i<agentTrail.length;i++)ctx.lineTo(agentTrail[i].x,agentTrail[i].y);' +
'ctx.stroke();ctx.globalAlpha=1}' +

// agent circle
'if(mode==="test"||agentTrail.length>0){' +
'ctx.beginPath();ctx.arc(agentPos.x,agentPos.y,6,0,Math.PI*2);' +
'ctx.fillStyle=accentC;ctx.fill();' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.stroke()}' +

// sparkles on success
'for(var si=0;si<sparkles.length;si++){' +
'var sp=sparkles[si];' +
'ctx.beginPath();ctx.arc(sp.x,sp.y,sp.r,0,Math.PI*2);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=sp.a;ctx.fill();ctx.globalAlpha=1}' +

// DAgger correction indicator
'if(daggerOn&&mode==="test"&&agentRunning){' +
'ctx.font="10px monospace";ctx.fillStyle=accentC;ctx.textAlign="left";' +
'ctx.fillText("DAgger ON",8,canvasH-8)}}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var successes=0;for(var i=0;i<testResults.length;i++)if(testResults[i])successes++;' +
'var rate=testResults.length>0?Math.round(successes/testResults.length*100):0;' +
'var avgLen=0;' +
'for(var i=0;i<demos.length;i++)avgLen+=demos[i].points.length;' +
'if(demos.length>0)avgLen=Math.round(avgLen/demos.length);' +

'var statusText=mode==="demo"?T.demoMode:T.testing;' +
'if(isTrained&&mode==="demo")statusText=T.trained;' +
'if(!isTrained&&mode==="demo"&&demos.length===0)statusText=T.notTrained;' +

'var s="<span class=\\"hi\\">"+T.demos+"</span> "+demos.length;' +
's+=" &nbsp;|&nbsp; <span class=\\"hi\\">"+T.avgLen+"</span> "+avgLen;' +
'if(testResults.length>0)s+="<br><span class=\\"warn\\">"+T.successRate+"</span> "+rate+"% ("+successes+"/"+testResults.length+")";' +
's+="<br>"+T.status+": "+(isTrained?"<span class=\\"grn\\">"+statusText+"</span>":"<span class=\\"warn\\">"+statusText+"</span>");' +
'box.innerHTML=s}' +

// ── Mode badge ──
'function updateBadge(){' +
'var badge=document.getElementById("modeBadge");' +
'if(mode==="demo"){badge.textContent=T.demoMode;badge.className="mode-badge mode-demo"}' +
'else{badge.textContent=T.testing;badge.className="mode-badge mode-test"}}' +

// ── Drawing handlers (demo recording) ──
'function getXY(e){' +
'var rect=document.getElementById("cvMain").getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'var cv=document.getElementById("cvMain");' +
'var x,y;' +
'if(e.touches){x=e.touches[0].clientX;y=e.touches[0].clientY}' +
'else{x=e.clientX;y=e.clientY}' +
'return{x:(x-rect.left)*(cv.width/dpr)/rect.width,' +
'y:(y-rect.top)*(cv.height/dpr)/rect.height}}' +

'var cvEl=document.getElementById("cvMain");' +

'cvEl.addEventListener("pointerdown",function(e){' +
'if(mode!=="demo")return;' +
'isDrawing=true;' +
'var p=getXY(e);' +
'currentDemo={points:[p]};' +
'draw()});' +

'cvEl.addEventListener("pointermove",function(e){' +
'if(!isDrawing||!currentDemo)return;' +
'var p=getXY(e);' +
'var last=currentDemo.points[currentDemo.points.length-1];' +
'var dx=p.x-last.x;var dy=p.y-last.y;' +
'if(dx*dx+dy*dy>16){' + // min spacing 4px
'currentDemo.points.push(p);draw()}});' +

'cvEl.addEventListener("pointerup",function(e){' +
'if(!isDrawing||!currentDemo)return;' +
'isDrawing=false;' +
'if(currentDemo.points.length>5){' +
'demos.push(currentDemo);isTrained=false}' +
'currentDemo=null;draw();updateStats()});' +

'cvEl.addEventListener("pointerleave",function(e){' +
'if(!isDrawing||!currentDemo)return;' +
'isDrawing=false;' +
'if(currentDemo.points.length>5){' +
'demos.push(currentDemo);isTrained=false}' +
'currentDemo=null;draw();updateStats()});' +

// prevent scroll while drawing
'cvEl.addEventListener("touchmove",function(e){' +
'if(isDrawing)e.preventDefault()},{passive:false});' +

// ── Train ──
'function onTrain(){' +
'if(demos.length===0)return;' +
'isTrained=true;' +
'mode="demo";updateBadge();' +
'document.getElementById("btnTrain").textContent=T.trained;' +
'setTimeout(function(){document.getElementById("btnTrain").textContent=T.train},1500);' +
'updateStats()}' +

// ── Test agent ──
'function onTest(){' +
'if(!isTrained)return;' +
'if(agentRunning){agentRunning=false;if(animId)cancelAnimationFrame(animId);' +
'mode="demo";updateBadge();draw();updateStats();drawDevGraph();return}' +
'mode="test";updateBadge();' +
'agentPos={x:startPt.x,y:startPt.y};' +
'agentTrail=[{x:agentPos.x,y:agentPos.y}];' +
'sparkles=[];deviations=[];' +
'agentRunning=true;' +
'agentStep()}' +

// ── Agent step (KNN policy) ──
'function agentStep(){' +
'if(!agentRunning)return;' +
'var dir=knnPolicy(agentPos.x,agentPos.y);' +
'var speed=2;' +
'var nx=agentPos.x+dir.dx*speed;' +
'var ny=agentPos.y+dir.dy*speed;' +

// DAgger: if enabled and near demo path, apply small correction toward nearest demo point
'if(daggerOn){' +
'var bestD=1e9;var bestPt=null;' +
'for(var di=0;di<demos.length;di++){' +
'var pts=demos[di].points;' +
'for(var i=0;i<pts.length;i++){' +
'var ddx=pts[i].x-agentPos.x;var ddy=pts[i].y-agentPos.y;' +
'var d=ddx*ddx+ddy*ddy;' +
'if(d<bestD){bestD=d;bestPt=pts[i]}}}' +
'if(bestPt&&bestD>100){' + // if far from demo, correct
'var cdx=bestPt.x-agentPos.x;var cdy=bestPt.y-agentPos.y;' +
'var cd=Math.sqrt(cdx*cdx+cdy*cdy);' +
'if(cd>0){nx=agentPos.x+(dir.dx*0.6+cdx/cd*0.4)*speed;' +
'ny=agentPos.y+(dir.dy*0.6+cdy/cd*0.4)*speed}}}' +

// Add noise (distribution shift visualization)
'if(noiseLevel>0){var nl=noiseLevel*0.06;' +
'nx+=(Math.random()-0.5)*nl*2;ny+=(Math.random()-0.5)*nl*2}' +

// wall collision check
'if(hitsWall(nx,ny,6)){' +
// fail
'agentRunning=false;testResults.push(false);' +
'mode="demo";updateBadge();draw();updateStats();drawDevGraph();return}' +

'agentPos.x=nx;agentPos.y=ny;' +
'agentTrail.push({x:nx,y:ny});' +

// Track deviation from nearest demo point
'var minD=1e9;' +
'for(var di2=0;di2<demos.length;di2++){var dpts=demos[di2].points;' +
'for(var pi=0;pi<dpts.length;pi++){' +
'var ex=dpts[pi].x-nx;var ey=dpts[pi].y-ny;' +
'var ed=Math.sqrt(ex*ex+ey*ey);if(ed<minD)minD=ed}}' +
'deviations.push(minD);' +

// check goal reached
'var gdx=goalPt.x-agentPos.x;var gdy=goalPt.y-agentPos.y;' +
'if(Math.sqrt(gdx*gdx+gdy*gdy)<15){' +
'agentRunning=false;testResults.push(true);' +
// sparkle effect
'for(var si=0;si<12;si++){' +
'sparkles.push({x:goalPt.x+(Math.random()-0.5)*40,' +
'y:goalPt.y+(Math.random()-0.5)*40,' +
'r:2+Math.random()*4,a:0.5+Math.random()*0.5})}' +
'mode="demo";updateBadge();draw();updateStats();drawDevGraph();return}' +

// timeout (too many steps)
'if(agentTrail.length>1000){' +
'agentRunning=false;testResults.push(false);' +
'mode="demo";updateBadge();draw();updateStats();drawDevGraph();return}' +

'draw();updateStats();drawDevGraph();' +
'animId=requestAnimationFrame(agentStep)}' +

// ── Deviation Graph ──
'function drawDevGraph(){' +
'var cv=document.getElementById("cvDev");' +
'var dim=setupCanvas(cv,100);var ctx=cv.getContext("2d");' +
'var w=dim.w,h=dim.h;ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
// axes
'ctx.strokeStyle=text3C;ctx.lineWidth=1;ctx.globalAlpha=0.5;' +
'ctx.beginPath();ctx.moveTo(30,5);ctx.lineTo(30,h-15);ctx.lineTo(w-5,h-15);ctx.stroke();ctx.globalAlpha=1;' +
'ctx.font="9px monospace";ctx.fillStyle=text3C;ctx.textAlign="center";' +
'ctx.fillText(T.devTime,w/2+15,h-2);' +
'ctx.save();ctx.translate(10,h/2-5);ctx.rotate(-Math.PI/2);ctx.fillText(T.dev,0,0);ctx.restore();' +
'if(deviations.length<2){return}' +
'var maxD=0;for(var i=0;i<deviations.length;i++)if(deviations[i]>maxD)maxD=deviations[i];' +
'if(maxD<1)maxD=1;' +
'var xStep=(w-40)/(deviations.length-1);' +
// color-coded line: teal(close) → accent(medium) → red(far)
'ctx.lineWidth=2;' +
'for(var i=1;i<deviations.length;i++){' +
'var x0=30+(i-1)*xStep;var y0=h-15-(deviations[i-1]/maxD)*(h-25);' +
'var x1=30+i*xStep;var y1=h-15-(deviations[i]/maxD)*(h-25);' +
'var ratio=deviations[i]/maxD;' +
'ctx.strokeStyle=ratio<0.3?tealC:ratio<0.6?accentC:redC;' +
'ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke()}' +
// stats overlay
'var avg=0;for(var i=0;i<deviations.length;i++)avg+=deviations[i];avg=Math.round(avg/deviations.length);' +
'var peak=Math.round(maxD);' +
'ctx.font="10px monospace";ctx.fillStyle=tealC;ctx.textAlign="right";' +
'ctx.fillText(T.avgDev+": "+avg+"px  "+T.peakDev+": "+peak+"px",w-5,12)}' +

// ── Set environment ──
'function setEnv(e){' +
'envType=e;' +
'document.getElementById("preCorridor").className="preset"+(e===0?" active":"");' +
'document.getElementById("preSCurve").className="preset"+(e===1?" active":"");' +
'document.getElementById("preObsCourse").className="preset"+(e===2?" active":"");' +
'document.getElementById("preFork").className="preset"+(e===3?" active":"");' +
'onReset()}' +

'function onParam(){' +
'daggerOn=document.getElementById("chkDagger").checked;' +
'K_NEIGHBORS=parseInt(document.getElementById("slK").value);' +
'document.getElementById("valK").textContent=K_NEIGHBORS;' +
'noiseLevel=parseInt(document.getElementById("slNoise").value);' +
'document.getElementById("valNoise").textContent=noiseLevel}' +

'function onClearDemos(){' +
'demos=[];isTrained=false;testResults=[];agentTrail=[];sparkles=[];deviations=[];' +
'document.getElementById("btnTrain").textContent=T.train;' +
'draw();updateStats();drawDevGraph()}' +

'function onReset(){' +
'agentRunning=false;if(animId)cancelAnimationFrame(animId);' +
'mode="demo";updateBadge();' +
'demos=[];isTrained=false;testResults=[];' +
'agentTrail=[];sparkles=[];deviations=[];currentDemo=null;isDrawing=false;' +
'var dim=setupCanvas(document.getElementById("cvMain"),300);canvasW=dim.w;canvasH=dim.h;' +
'setupCanvas(document.getElementById("cvDev"),100);' +
'buildEnv();draw();updateStats();drawDevGraph();notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-env").textContent=T.env;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-envPre").textContent=T.envPre;' +
'document.getElementById("preCorridor").textContent=T.corridor;' +
'document.getElementById("preSCurve").textContent=T.scurve;' +
'document.getElementById("preObsCourse").textContent=T.obscourse;' +
'document.getElementById("preFork").textContent=T.fork;' +
'document.getElementById("lbl-kn").textContent=T.kn;' +
'document.getElementById("lbl-noise").textContent=T.noise;' +
'document.getElementById("lbl-dev").textContent=T.dev;' +
'document.getElementById("lbl-dagger").textContent=T.dagger;' +
'document.getElementById("btnTrain").textContent=T.train;' +
'document.getElementById("btnTest").textContent=T.test;' +
'document.getElementById("btnClearDemo").textContent=T.clearDemo;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("hintDraw").textContent=T.hintDraw;' +
'document.getElementById("modeBadge").textContent=T.demoMode;' +
'var dim=setupCanvas(document.getElementById("cvMain"),300);canvasW=dim.w;canvasH=dim.h;' +
'setupCanvas(document.getElementById("cvDev"),100);' +
'buildEnv();onParam();draw();updateStats();drawDevGraph();' +
'window.addEventListener("resize",function(){' +
'var dim=setupCanvas(document.getElementById("cvMain"),300);canvasW=dim.w;canvasH=dim.h;' +
'setupCanvas(document.getElementById("cvDev"),100);' +
'buildEnv();if(!agentRunning){draw();drawDevGraph()}notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
