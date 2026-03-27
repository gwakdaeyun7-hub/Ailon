/**
 * PID Controller — Car Lane Tracking simulation
 *
 * Features:
 * - Top canvas: side-view road with car tracking a target y-position
 * - Bottom canvas: time-series of target vs actual position
 * - Kp/Ki/Kd sliders with P/I/D toggle checkboxes
 * - Wind disturbance button, Run/Reset controls
 * - Tap top canvas to set new target position
 * - Dark/light theme, Korean/English bilingual
 */

export function getPIDSimulationHTML(isDark: boolean, lang: string): string {
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
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card);touch-action:none}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:36px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:40px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:var(--bg)}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:var(--bg)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.chk-row{display:flex;gap:12px;margin-bottom:10px;align-items:center;min-height:44px}' +
'.chk-label{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;cursor:pointer;padding:10px 8px}' +
'.chk-label input{width:22px;height:22px;accent-color:var(--teal)}' +
'.chk-p{color:var(--teal)}.chk-i{color:var(--accent)}.chk-d{color:var(--green)}' +
'</style></head><body>' +

// ── Road Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-road"></div>' +
'<canvas id="cvRoad" height="160"></canvas></div>' +

// ── Graph Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-graph"></div>' +
'<canvas id="cvGraph" height="160"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="chk-row">' +
'<label class="chk-label chk-p"><input type="checkbox" id="chkP" checked onchange="onParam()">P</label>' +
'<label class="chk-label chk-i"><input type="checkbox" id="chkI" checked onchange="onParam()">I</label>' +
'<label class="chk-label chk-d"><input type="checkbox" id="chkD" checked onchange="onParam()">D</label>' +
'</div>' +
'<div class="row"><span class="ctrl-name">Kp</span>' +
'<input type="range" id="slKp" min="0" max="30" value="12" oninput="onParam()">' +
'<span class="ctrl-val" id="valKp"></span></div>' +
'<div class="row"><span class="ctrl-name">Ki</span>' +
'<input type="range" id="slKi" min="0" max="20" value="4" oninput="onParam()">' +
'<span class="ctrl-val" id="valKi"></span></div>' +
'<div class="row"><span class="ctrl-name">Kd</span>' +
'<input type="range" id="slKd" min="0" max="20" value="8" oninput="onParam()">' +
'<span class="ctrl-val" id="valKd"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="toggleRun()"></div>' +
'<div class="btn" id="btnWind" onclick="applyWind()"></div>' +
'<div class="btn" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{road:"\\uB3C4\\uB85C",graph:"\\uC751\\uB2F5 \\uADF8\\uB798\\uD504",ctrl:"\\uC81C\\uC5B4",stats:"\\uD1B5\\uACC4",' +
'run:"\\uC2E4\\uD589",stop:"\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",wind:"\\uC678\\uB780",' +
'target:"\\uBAA9\\uD45C",actual:"\\uC2E4\\uC81C\\uAC12",error:"\\uC624\\uCC28",' +
'p:"\\uBE44\\uB840(P)",i:"\\uC801\\uBD84(I)",d:"\\uBBF8\\uBD84(D)",' +
'tapTarget:"\\uB3C4\\uB85C \\uD130\\uCE58 = \\uBAA9\\uD45C \\uC124\\uC815",' +
'pOnly:"P\\uB9CC \\u2192 \\uC9C4\\uB3D9",piTip:"PI \\u2192 \\uC815\\uC0C1\\uC0C1\\uD0DC \\uC624\\uCC28 \\uC81C\\uAC70",' +
'pidTip:"PID \\u2192 \\uBD80\\uB4DC\\uB7EC\\uC6B4 \\uCD94\\uC801"},' +
'en:{road:"ROAD VIEW",graph:"RESPONSE GRAPH",ctrl:"CONTROLS",stats:"STATISTICS",' +
'run:"Run",stop:"Stop",reset:"\\u21BA Reset",wind:"Wind",' +
'target:"Target",actual:"Actual",error:"Error",' +
'p:"Proportional(P)",i:"Integral(I)",d:"Derivative(D)",' +
'tapTarget:"Tap road = set target",' +
'pOnly:"P-only \\u2192 oscillation",piTip:"PI \\u2192 removes steady-state error",' +
'pidTip:"PID \\u2192 smooth tracking"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var Kp=1.2,Ki=0.2,Kd=0.8;' +
'var useP=true,useI=true,useD=true;' +
'var targetY=0.5,pos=0.1,vel=0;' +
'var integral=0,prevErr=0;' +
'var dt=0.02,drag=0.3;' +
'var windForce=0,windDecay=0.98;' +
'var history=[];var MAX_HIST=300;' +
'var running=false,animId=null;' +
'var tStep=0;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw road view ──
'function drawRoad(){' +
'var cv=document.getElementById("cvRoad");' +
'var dim=setupCanvas(cv,160);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=12;var roadH=h-pad*2;' +

// road background stripes
'ctx.fillStyle=borderC;ctx.globalAlpha=0.3;' +
'for(var i=0;i<10;i++){var sx=((tStep*2+i*40)%w);ctx.fillRect(sx,pad,2,roadH)}' +
'ctx.globalAlpha=1;' +

// target line (dashed)
'var tY=pad+(1-targetY)*roadH;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.setLineDash([6,4]);' +
'ctx.beginPath();ctx.moveTo(0,tY);ctx.lineTo(w,tY);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=tealC;ctx.font="10px monospace";ctx.textAlign="left";' +
'ctx.fillText(T.target,4,tY-4);' +

// trail (last 60 positions)
'if(history.length>1){' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.globalAlpha=0.3;ctx.beginPath();' +
'var start=Math.max(0,history.length-60);' +
'for(var i=start;i<history.length;i++){' +
'var hx=w*0.5-(history.length-i)*3;' +
'var hy=pad+(1-history[i].pos)*roadH;' +
'if(i===start)ctx.moveTo(hx,hy);else ctx.lineTo(hx,hy)}' +
'ctx.stroke();ctx.globalAlpha=1}' +

// car
'var carY=pad+(1-pos)*roadH;' +
'var carX=w*0.5;' +
'ctx.fillStyle="rgba(59,130,246,0.9)";' +
'ctx.fillRect(carX-10,carY-6,20,12);' +
'ctx.strokeStyle="rgba(59,130,246,1)";ctx.lineWidth=2;' +
'ctx.strokeRect(carX-10,carY-6,20,12);' +

// wind indicator
'if(Math.abs(windForce)>0.01){' +
'ctx.fillStyle=accentC;ctx.font="11px sans-serif";ctx.textAlign="right";' +
'ctx.fillText("\\uD83C\\uDF2C\\uFE0F "+(windForce>0?"\\u2191":"\\u2193"),w-8,pad+14)}' +
'}' +

// ── Draw time-series graph ──
'function drawGraph(){' +
'var cv=document.getElementById("cvGraph");' +
'var dim=setupCanvas(cv,160);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=8;var gW=w-pad*2;var gH=h-pad*2;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();' +

// y labels
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("1.0",pad-2,pad+4);ctx.fillText("0.5",pad-2,pad+gH/2+3);ctx.fillText("0.0",pad-2,h-pad+3);' +

'if(history.length<2)return;' +
'var N=history.length;var start=Math.max(0,N-MAX_HIST);var count=N-start;' +
'function toX(i){return pad+((i-start)/Math.max(count-1,1))*gW}' +
'function toY(v){return pad+(1-v)*gH}' +

// target line (dashed)
'ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.setLineDash([5,3]);' +
'ctx.beginPath();ctx.moveTo(toX(start),toY(targetY));ctx.lineTo(toX(N-1),toY(targetY));ctx.stroke();ctx.setLineDash([]);' +

// error area fill
'ctx.fillStyle=text3C;ctx.globalAlpha=0.12;ctx.beginPath();' +
'ctx.moveTo(toX(start),toY(history[start].pos));' +
'for(var i=start;i<N;i++)ctx.lineTo(toX(i),toY(history[i].pos));' +
'for(var i=N-1;i>=start;i--)ctx.lineTo(toX(i),toY(history[i].tgt));' +
'ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +

// actual line (solid blue)
'ctx.strokeStyle="rgba(59,130,246,0.9)";ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=start;i<N;i++){var x=toX(i);var y=toY(history[i].pos);if(i===start)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.setLineDash([5,3]);ctx.strokeStyle=tealC;ctx.lineWidth=1.5;' +
'ctx.beginPath();ctx.moveTo(pad+4,pad+4);ctx.lineTo(pad+20,pad+4);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=text3C;ctx.fillText(T.target,pad+24,pad+8);' +
'ctx.strokeStyle="rgba(59,130,246,0.9)";ctx.lineWidth=2;' +
'ctx.beginPath();ctx.moveTo(pad+70,pad+4);ctx.lineTo(pad+86,pad+4);ctx.stroke();' +
'ctx.fillText(T.actual,pad+90,pad+8);' +
'}' +

// ── Simulation step ──
'function simStep(){' +
'var err=targetY-pos;' +
'var pTerm=useP?Kp*err:0;' +
'integral+=err*dt;' +
'var iTerm=useI?Ki*integral:0;' +
'var dTerm=useD?Kd*(err-prevErr)/dt:0;' +
'prevErr=err;' +
'var u=pTerm+iTerm+dTerm;' +
'vel+=(u-drag*vel+windForce)*dt;' +
'pos+=vel*dt;' +
'windForce*=windDecay;' +
'if(pos<0){pos=0;vel=0}if(pos>1){pos=1;vel=0}' +
'tStep++;' +
'history.push({pos:pos,tgt:targetY});' +
'if(history.length>MAX_HIST*2)history=history.slice(-MAX_HIST)}' +

// ── Animation loop ──
'function animate(){' +
'if(!running)return;' +
'for(var i=0;i<3;i++)simStep();' +
'drawRoad();drawGraph();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

// ── Toggle run ──
'function toggleRun(){' +
'running=!running;' +
'document.getElementById("btnRun").textContent=running?T.stop:T.run;' +
'document.getElementById("btnRun").className=running?"btn btn-stop":"btn btn-primary";' +
'if(running)animate()}' +

// ── Wind ──
'function applyWind(){' +
'windForce=(Math.random()-0.5)*4}' +

// ── Parameter change ──
'function onParam(){' +
'Kp=+document.getElementById("slKp").value/10;' +
'Ki=+document.getElementById("slKi").value/20;' +
'Kd=+document.getElementById("slKd").value/10;' +
'useP=document.getElementById("chkP").checked;' +
'useI=document.getElementById("chkI").checked;' +
'useD=document.getElementById("chkD").checked;' +
'document.getElementById("valKp").textContent=Kp.toFixed(1);' +
'document.getElementById("valKi").textContent=Ki.toFixed(2);' +
'document.getElementById("valKd").textContent=Kd.toFixed(1);' +
'notifyHeight()}' +

// ── Tap target ──
'document.getElementById("cvRoad").addEventListener("pointerdown",function(e){' +
'var rect=e.target.getBoundingClientRect();' +
'var y=e.clientY-rect.top;var pad=12;var roadH=rect.height-pad*2;' +
'targetY=1-(y-pad)/roadH;' +
'if(targetY<0.05)targetY=0.05;if(targetY>0.95)targetY=0.95;' +
'if(!running){drawRoad();drawGraph()}notifyHeight()});' +

// ── Reset ──
'function doReset(){' +
'running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'pos=0.1;vel=0;integral=0;prevErr=0;windForce=0;tStep=0;' +
'targetY=0.5;history=[];' +
'drawRoad();drawGraph();updateStats();notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var err=Math.abs(targetY-pos);' +
'var s="<span class=\\"hi\\">"+T.target+"</span> "+targetY.toFixed(2);' +
's+=" &nbsp;|&nbsp; <span class=\\"hi\\">"+T.actual+"</span> "+pos.toFixed(2);' +
's+=" &nbsp;|&nbsp; "+T.error+": <span class=\\"warn\\">"+err.toFixed(3)+"</span>";' +
'var hint="";' +
'if(useP&&!useI&&!useD)hint=T.pOnly;' +
'else if(useP&&useI&&!useD)hint=T.piTip;' +
'else if(useP&&useI&&useD)hint=T.pidTip;' +
'if(hint)s+="<br>"+hint;' +
'if(!running&&history.length===0)s+="<br>"+T.tapTarget;' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-road").textContent=T.road;' +
'document.getElementById("lbl-graph").textContent=T.graph;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnWind").textContent=T.wind;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'onParam();' +

// ── Init ──
'drawRoad();drawGraph();updateStats();' +
'window.addEventListener("resize",function(){drawRoad();drawGraph();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
