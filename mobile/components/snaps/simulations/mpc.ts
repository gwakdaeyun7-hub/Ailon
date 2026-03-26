/**
 * Model Predictive Control — Future prediction based optimal control simulation
 *
 * Features:
 * - Top-down vehicle following a reference path (S-curve / Circle / Chicane)
 * - Prediction horizon dots extending ahead of vehicle
 * - Lower graph: tracking error (red) + steering input (accent) over time
 * - Prediction Horizon (N), Reference Path preset, Weight slider, Disturbance toggle
 * - Step / Auto / Reset buttons
 * - Dark/light theme, Korean/English bilingual
 */

export function getMPCSimulationHTML(isDark: boolean, lang: string): string {
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
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px}' +
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card)}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:72px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:40px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:10px}' +
'.preset{flex:1;padding:8px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.toggle-row{display:flex;align-items:center;gap:8px;margin-bottom:10px;min-height:44px}' +
'.toggle-check{width:22px;height:22px;accent-color:var(--teal)}' +
'.toggle-label{font-size:12px;font-weight:600;color:var(--text)}' +
'.legend-row{display:flex;gap:12px;margin-top:6px;flex-wrap:wrap}' +
'.legend-item{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text2)}' +
'.legend-dot{width:8px;height:8px;flex-shrink:0}' +
'</style></head><body>' +

// ── Main Canvas ──
'<div class="panel"><div class="label" id="lbl-sim"></div>' +
'<canvas id="cvMain" height="300"></canvas>' +
'<div class="legend-row">' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--teal)"></div><span id="lgRef"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:rgba(59,130,246,0.9)"></div><span id="lgVeh"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--accent);opacity:0.6"></div><span id="lgPred"></span></div>' +
'</div></div>' +

// ── Graph Canvas ──
'<div class="panel"><div class="label" id="lbl-graph"></div>' +
'<canvas id="cvGraph" height="140"></canvas>' +
'<div class="legend-row">' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--red)"></div><span id="lgErr"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div><span id="lgSteer"></span></div>' +
'</div></div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="label" id="lbl-path" style="margin-top:4px"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="preS" onclick="setPath(0)">S-Curve</div>' +
'<div class="preset" id="preC" onclick="setPath(1)">Circle</div>' +
'<div class="preset" id="preCh" onclick="setPath(2)">Chicane</div>' +
'</div>' +
'<div class="row"><span class="ctrl-name" id="lbl-horizon"></span>' +
'<input type="range" id="slN" min="1" max="20" value="10" oninput="onParam()">' +
'<span class="ctrl-val" id="valN"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-weight"></span>' +
'<input type="range" id="slW" min="0" max="100" value="50" oninput="onParam()">' +
'<span class="ctrl-val" id="valW"></span></div>' +
'<div class="toggle-row"><input type="checkbox" class="toggle-check" id="chkDist" onchange="onParam()">' +
'<span class="toggle-label" id="lbl-dist"></span></div>' +
'<div class="btn-row">' +
'<div class="btn" id="btnStep" onclick="onStep()"></div>' +
'<div class="btn btn-primary" id="btnAuto" onclick="onAuto()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{sim:"MPC \\uC2DC\\uBBAC\\uB808\\uC774\\uC158",graph:"\\uCD94\\uC801 \\uADF8\\uB798\\uD504",' +
'ctrl:"\\uC81C\\uC5B4",path:"\\uACBD\\uB85C \\uD504\\uB9AC\\uC14B",' +
'horizon:"\\uC608\\uCE21 \\uD638\\uB77C\\uC774\\uC98C N",weight:"\\uCD94\\uC801/\\uBD80\\uB4DC\\uB7EC\\uC6C0",' +
'dist:"\\uC678\\uB780 \\uCD94\\uAC00",stats:"\\uD1B5\\uACC4",' +
'step:"\\u25B6 \\uC2A4\\uD15D",auto:"\\u25B6 \\uC790\\uB3D9",stop:"\\u23F8 \\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'ref:"\\uAE30\\uC900 \\uACBD\\uB85C",veh:"\\uCC28\\uB7C9",pred:"\\uC608\\uCE21 \\uD638\\uB77C\\uC774\\uC98C",' +
'err:"\\uCD94\\uC801 \\uC624\\uCC28",steer:"\\uC870\\uD5A5\\uAC01",' +
'trackErr:"\\uCD94\\uC801 \\uC624\\uCC28",steerAng:"\\uC870\\uD5A5\\uAC01",horizLen:"\\uD638\\uB77C\\uC774\\uC98C",' +
'tracking:"\\uCD94\\uC801",smooth:"\\uBD80\\uB4DC\\uB7EC\\uC6C0"},' +
'en:{sim:"MPC SIMULATION",graph:"TRACKING GRAPH",' +
'ctrl:"CONTROLS",path:"REFERENCE PATH",' +
'horizon:"Horizon N",weight:"Track / Smooth",' +
'dist:"Disturbance",stats:"STATISTICS",' +
'step:"\\u25B6 Step",auto:"\\u25B6 Auto",stop:"\\u23F8 Stop",reset:"\\u21BA Reset",' +
'ref:"Reference",veh:"Vehicle",pred:"Prediction",' +
'err:"Track Error",steer:"Steering",' +
'trackErr:"Track Error",steerAng:"Steer Angle",horizLen:"Horizon",' +
'tracking:"Track",smooth:"Smooth"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var canvasW=300,canvasH=300;' +
'var pathType=0;' + // 0=S-curve, 1=Circle, 2=Chicane
'var horizonN=10;' +
'var wTrack=0.5;' + // 0=all smooth, 1=all tracking
'var distOn=false;' +
'var running=false,animId=null;' +
'var vehX=0,vehY=0,vehTheta=0;' + // vehicle state
'var vehSpeed=2;' +
'var pathParam=0;' + // parameter along path [0, pathLen)
'var pathLen=600;' +
'var trail=[];' +
'var history=[];' + // {err, steer}
'var MAX_HIST=200;' +
'var steerAngle=0;' +

// ── DOM ──
'var cvMain=document.getElementById("cvMain");' +
'var cvGraph=document.getElementById("cvGraph");' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Reference path generation ──
'function getRefPoint(t){' +
'var cx=canvasW/2,cy=canvasH/2;' +
'var s=Math.min(canvasW,canvasH)*0.35;' +
'var p=t/pathLen*Math.PI*2;' +
'if(pathType===0){' + // S-curve
'var x=cx+s*Math.sin(p);' +
'var y=cy-s*0.8*Math.sin(p*2)*0.5+s*0.6*(p/(Math.PI*2)-0.5);' +
'return{x:x,y:y}}' +
'if(pathType===1){' + // Circle
'return{x:cx+s*Math.cos(p),y:cy+s*Math.sin(p)}}' +
// Chicane
'var x=cx+s*Math.sin(p);' +
'var y=cy+s*0.6*Math.sin(p*3)*0.5+s*0.5*(p/(Math.PI*2)-0.5);' +
'return{x:x,y:y}}' +

// ── Get path tangent angle ──
'function getRefAngle(t){' +
'var dt=0.5;' +
'var a=getRefPoint(t);var b=getRefPoint(t+dt);' +
'return Math.atan2(b.y-a.y,b.x-a.x)}' +

// ── Find closest path param to vehicle ──
'function findClosest(){' +
'var best=pathParam;var bestD=1e9;' +
'var search=40;' +
'for(var i=-search;i<=search;i++){' +
'var t=(pathParam+i+pathLen)%pathLen;' +
'var p=getRefPoint(t);' +
'var dx=p.x-vehX;var dy=p.y-vehY;' +
'var d=dx*dx+dy*dy;' +
'if(d<bestD){bestD=d;best=t}}' +
'return best}' +

// ── MPC step: compute optimal steering ──
'function mpcStep(){' +
'pathParam=findClosest();' +
// lateral error
'var ref=getRefPoint(pathParam);' +
'var refA=getRefAngle(pathParam);' +
'var ex=vehX-ref.x;var ey=vehY-ref.y;' +
'var latErr=-Math.sin(refA)*ex+Math.cos(refA)*ey;' +
'var headErr=vehTheta-refA;' +
// normalize heading error
'while(headErr>Math.PI)headErr-=Math.PI*2;' +
'while(headErr<-Math.PI)headErr+=Math.PI*2;' +

// simple MPC: sum costs over horizon, gradient-based
'var bestSteer=0;var bestCost=1e9;' +
'var nTrials=21;' +
'for(var si=0;si<nTrials;si++){' +
'var testSteer=(si/(nTrials-1)-0.5)*1.2;' + // range [-0.6, 0.6]
'var tx=vehX,ty=vehY,tth=vehTheta;' +
'var cost=0;' +
'for(var h=1;h<=horizonN;h++){' +
'tth+=testSteer*0.15;' +
'tx+=Math.cos(tth)*vehSpeed;' +
'ty+=Math.sin(tth)*vehSpeed;' +
'var rp=getRefPoint((pathParam+h*vehSpeed)%pathLen);' +
'var dx=tx-rp.x;var dy=ty-rp.y;' +
'var trackCost=dx*dx+dy*dy;' +
'var smoothCost=testSteer*testSteer*400;' +
'cost+=wTrack*trackCost+(1-wTrack)*smoothCost}' +
'if(cost<bestCost){bestCost=cost;bestSteer=testSteer}}' +

'steerAngle=bestSteer;' +
// apply disturbance
'var dist=distOn?(Math.random()-0.5)*0.15:0;' +
'vehTheta+=(bestSteer*0.15+dist);' +
'vehX+=Math.cos(vehTheta)*vehSpeed;' +
'vehY+=Math.sin(vehTheta)*vehSpeed;' +
'pathParam=(pathParam+vehSpeed)%pathLen;' +

'trail.push({x:vehX,y:vehY});' +
'if(trail.length>300)trail.shift();' +
'var errVal=Math.sqrt((vehX-ref.x)*(vehX-ref.x)+(vehY-ref.y)*(vehY-ref.y));' +
'history.push({err:errVal,steer:Math.abs(steerAngle)});' +
'if(history.length>MAX_HIST)history.shift()}' +

// ── Draw main canvas ──
'function drawMain(){' +
'var dim=setupCanvas(cvMain,300);canvasW=dim.w;canvasH=dim.h;' +
'var ctx=cvMain.getContext("2d");ctx.clearRect(0,0,canvasW,canvasH);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +

// draw reference path (teal dashed)
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.setLineDash([8,5]);' +
'ctx.beginPath();' +
'for(var i=0;i<pathLen;i+=2){' +
'var p=getRefPoint(i);' +
'if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y)}' +
'ctx.closePath();ctx.stroke();ctx.setLineDash([]);' +

// draw trail (white/light solid)
'if(trail.length>1){' +
'ctx.strokeStyle=textC;ctx.lineWidth=1.5;ctx.globalAlpha=0.25;' +
'ctx.beginPath();ctx.moveTo(trail[0].x,trail[0].y);' +
'for(var i=1;i<trail.length;i++)ctx.lineTo(trail[i].x,trail[i].y);' +
'ctx.stroke();ctx.globalAlpha=1}' +

// draw prediction horizon dots
'var predX=vehX,predY=vehY,predTh=vehTheta;' +
'for(var h=1;h<=horizonN;h++){' +
'predTh+=steerAngle*0.15;' +
'predX+=Math.cos(predTh)*vehSpeed;' +
'predY+=Math.sin(predTh)*vehSpeed;' +
'var alpha=0.15+0.45*(1-h/horizonN);' +
'var r=3+2*(1-h/horizonN);' +
'ctx.beginPath();ctx.arc(predX,predY,r,0,Math.PI*2);' +
'ctx.fillStyle=accentC;ctx.globalAlpha=alpha;ctx.fill();ctx.globalAlpha=1}' +

// draw vehicle as rectangle
'ctx.save();ctx.translate(vehX,vehY);ctx.rotate(vehTheta);' +
'ctx.fillStyle="rgba(59,130,246,0.9)";' +
'ctx.fillRect(-10,-6,20,12);' +
'ctx.strokeStyle="rgba(59,130,246,1)";ctx.lineWidth=2;' +
'ctx.strokeRect(-10,-6,20,12);' +
// front indicator
'ctx.fillStyle=tealC;ctx.fillRect(8,-2,4,4);' +
'ctx.restore()}' +

// ── Draw graph ──
'function drawGraph(){' +
'var dim=setupCanvas(cvGraph,140);var w=dim.w,h=dim.h;' +
'var ctx=cvGraph.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=8;var gW=w-pad*2;var gH=h-pad*2;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();' +

'if(history.length<2)return;' +
'var N=history.length;var start=Math.max(0,N-MAX_HIST);var count=N-start;' +
// find max for scaling
'var maxErr=1;var maxSt=0.1;' +
'for(var i=start;i<N;i++){' +
'if(history[i].err>maxErr)maxErr=history[i].err;' +
'if(history[i].steer>maxSt)maxSt=history[i].steer}' +
'function toX(i){return pad+((i-start)/Math.max(count-1,1))*gW}' +

// error line (red)
'ctx.strokeStyle=redC;ctx.lineWidth=1.5;ctx.beginPath();' +
'for(var i=start;i<N;i++){' +
'var x=toX(i);var y=pad+(1-history[i].err/maxErr)*gH;' +
'if(i===start)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// steering line (accent)
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();' +
'for(var i=start;i<N;i++){' +
'var x=toX(i);var y=pad+(1-history[i].steer/maxSt)*gH;' +
'if(i===start)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();ctx.setLineDash([])}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var lastErr=history.length>0?history[history.length-1].err:0;' +
'var s="<span class=\\"hi\\">"+T.trackErr+"</span> "+lastErr.toFixed(1)+"px";' +
's+=" &nbsp;|&nbsp; <span class=\\"warn\\">"+T.steerAng+"</span> "+(steerAngle*57.3).toFixed(1)+"\\u00B0";' +
's+="<br><span class=\\"hi\\">"+T.horizLen+"</span> N="+horizonN;' +
'box.innerHTML=s}' +

// ── Read params ──
'function readParams(){' +
'horizonN=+document.getElementById("slN").value;' +
'wTrack=+document.getElementById("slW").value/100;' +
'distOn=document.getElementById("chkDist").checked;' +
'document.getElementById("valN").textContent=horizonN;' +
'document.getElementById("valW").textContent=Math.round(wTrack*100)+"%"}' +

// ── Path preset ──
'function setPath(p){' +
'pathType=p;' +
'document.getElementById("preS").className="preset"+(p===0?" active":"");' +
'document.getElementById("preC").className="preset"+(p===1?" active":"");' +
'document.getElementById("preCh").className="preset"+(p===2?" active":"");' +
'onReset()}' +

// ── Animation ──
'function animate(){' +
'if(!running)return;' +
'mpcStep();drawMain();drawGraph();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

// ── Event handlers ──
'function onParam(){readParams();if(!running){drawMain();drawGraph();updateStats()}}' +

'function onStep(){' +
'readParams();mpcStep();drawMain();drawGraph();updateStats()}' +

'function onAuto(){' +
'if(running){running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn btn-primary";return}' +
'readParams();running=true;' +
'document.getElementById("btnAuto").textContent=T.stop;' +
'document.getElementById("btnAuto").className="btn btn-stop";' +
'animate()}' +

'function onReset(){' +
'running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn btn-primary";' +
'readParams();' +
// init vehicle at path start
'var startPt=getRefPoint(0);' +
'vehX=startPt.x;vehY=startPt.y;' +
'vehTheta=getRefAngle(0);' +
'pathParam=0;steerAngle=0;' +
'trail=[];history=[];' +
'drawMain();drawGraph();updateStats();notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-sim").textContent=T.sim;' +
'document.getElementById("lbl-graph").textContent=T.graph;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-path").textContent=T.path;' +
'document.getElementById("lbl-horizon").textContent=T.horizon;' +
'document.getElementById("lbl-weight").textContent=T.weight;' +
'document.getElementById("lbl-dist").textContent=T.dist;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnStep").textContent=T.step;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lgRef").textContent=T.ref;' +
'document.getElementById("lgVeh").textContent=T.veh;' +
'document.getElementById("lgPred").textContent=T.pred;' +
'document.getElementById("lgErr").textContent=T.err;' +
'document.getElementById("lgSteer").textContent=T.steer;' +
'var dim=setupCanvas(cvMain,300);canvasW=dim.w;canvasH=dim.h;' +
'readParams();onReset();' +
'window.addEventListener("resize",function(){' +
'var dim=setupCanvas(cvMain,300);canvasW=dim.w;canvasH=dim.h;' +
'if(!running){drawMain();drawGraph()}notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
