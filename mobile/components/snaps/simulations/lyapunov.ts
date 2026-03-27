/**
 * Lyapunov Stability Theory — Phase plane vector field and stability simulation
 *
 * Features:
 * - Main canvas: 2D phase plane with vector field arrows + Lyapunov level curves
 * - Tap to place initial points (up to 5, color-coded), trajectories flow
 * - Lower canvas: V(t) time series — decreasing = STABLE, increasing = UNSTABLE
 * - System presets: Stable Focus / Stable Node / Saddle Point / Limit Cycle
 * - Damping slider, Clear Trails / Animate buttons
 * - Dark/light theme, Korean/English bilingual
 */

export function getLyapunovSimulationHTML(isDark: boolean, lang: string): string {
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
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:72px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:14px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .red{color:var(--red);font-weight:700}' +
'.stats .grn{color:var(--green);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;min-width:70px;min-height:44px}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.hint{font-size:10px;color:var(--text3);margin-top:6px}' +
'</style></head><body>' +

// ── Phase Plane Canvas ──
'<div class="panel"><div class="label" id="lbl-phase"></div>' +
'<canvas id="cvPhase" height="300"></canvas>' +
'<div class="hint" id="hintTap"></div></div>' +

// ── V(t) Graph Canvas ──
'<div class="panel"><div class="label" id="lbl-vt"></div>' +
'<canvas id="cvVt" height="120"></canvas></div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="label" id="lbl-sys" style="margin-top:4px"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="preFocus" onclick="setSys(0)"></div>' +
'<div class="preset" id="preNode" onclick="setSys(1)"></div>' +
'<div class="preset" id="preSaddle" onclick="setSys(2)"></div>' +
'<div class="preset" id="preLimit" onclick="setSys(3)"></div>' +
'</div>' +
'<div class="row"><span class="ctrl-name" id="lbl-damp"></span>' +
'<input type="range" id="slDamp" min="0" max="100" value="30" oninput="onParam()">' +
'<span class="ctrl-val" id="valDamp"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnAnim" onclick="onAnimate()"></div>' +
'<div class="btn" id="btnClear" onclick="onClear()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{phase:"\\uC704\\uC0C1 \\uD3C9\\uBA74",vt:"V(t) \\uC2DC\\uACC4\\uC5F4",' +
'ctrl:"\\uC81C\\uC5B4",sys:"\\uC2DC\\uC2A4\\uD15C \\uD504\\uB9AC\\uC14B",' +
'focus:"\\uC548\\uC815 \\uCD08\\uC810",node:"\\uC548\\uC815 \\uB178\\uB4DC",saddle:"\\uC548\\uC7A5\\uC810",limit:"\\uADF9\\uD55C \\uC0AC\\uC774\\uD074",' +
'damp:"\\uAC10\\uC1E0 \\uACC4\\uC218",stats:"\\uD1B5\\uACC4",' +
'animate:"\\u25B6 \\uC560\\uB2C8\\uBA54\\uC774\\uC158",stop:"\\u23F8 \\uC815\\uC9C0",' +
'clear:"\\uADA4\\uC801 \\uC9C0\\uC6B0\\uAE30",reset:"\\u21BA \\uB9AC\\uC14B",' +
'sysType:"\\uC2DC\\uC2A4\\uD15C",eigenvals:"\\uACE0\\uC720\\uAC12",' +
'vCurr:"V(x) \\uD604\\uC7AC",status:"\\uC0C1\\uD0DC",' +
'stable:"\\uC548\\uC815 (STABLE)",unstable:"\\uBD88\\uC548\\uC815 (UNSTABLE)",' +
'tapHint:"\\uCE94\\uBC84\\uC2A4\\uB97C \\uD130\\uCE58\\uD558\\uC5EC \\uCD08\\uAE30\\uC810\\uC744 \\uBC30\\uCE58\\uD558\\uC138\\uC694 (\\uCD5C\\uB300 5\\uAC1C)",' +
'points:"\\uCD08\\uAE30\\uC810"},' +
'en:{phase:"PHASE PLANE",vt:"V(t) TIME SERIES",' +
'ctrl:"CONTROLS",sys:"SYSTEM PRESET",' +
'focus:"Stable Focus",node:"Stable Node",saddle:"Saddle Point",limit:"Limit Cycle",' +
'damp:"Damping",stats:"STATISTICS",' +
'animate:"\\u25B6 Animate",stop:"\\u23F8 Stop",' +
'clear:"Clear Trails",reset:"\\u21BA Reset",' +
'sysType:"System",eigenvals:"Eigenvalues",' +
'vCurr:"V(x) Current",status:"Status",' +
'stable:"STABLE",unstable:"UNSTABLE",' +
'tapHint:"Tap canvas to place initial points (max 5)",' +
'points:"Points"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var canvasW=300,canvasH=300;' +
'var sysType=0;' + // 0=focus, 1=node, 2=saddle, 3=limit cycle
'var dampVal=0.3;' +
// system matrix A = [[a11,a12],[a21,a22]]
'var A=[[0,0],[0,0]];' +
'var running=false,animId=null;' +
'var TRAJ_COLORS=["rgba(59,130,246,0.85)","rgba(239,68,68,0.85)","rgba(245,158,11,0.85)","rgba(16,185,129,0.85)","rgba(168,85,247,0.85)"];' +
'var particles=[];' + // {x,y,trail:[],vHist:[]}
'var dt=0.03;' +
'var SCALE=2.5;' + // world coords: [-SCALE, SCALE]

// ── System presets ──
'function buildMatrix(){' +
'var d=dampVal;' +
'if(sysType===0){A=[[-d,1],[-1,-d]]}' +       // stable focus (spiral)
'else if(sysType===1){A=[[-d-0.5,0],[0,-d-0.3]]}' + // stable node
'else if(sysType===2){A=[[d+0.2,0.5],[0.5,-d-0.2]]}' + // saddle
'else{A=[[-d,1],[-1,-d]]}}' + // limit cycle uses special nonlinear update

// ── Eigenvalues (for display) ──
'function eigenvalues(){' +
'var tr=A[0][0]+A[1][1];' +
'var det=A[0][0]*A[1][1]-A[0][1]*A[1][0];' +
'var disc=tr*tr-4*det;' +
'if(disc>=0){' +
'var l1=(tr+Math.sqrt(disc))/2;var l2=(tr-Math.sqrt(disc))/2;' +
'return{r1:l1,i1:0,r2:l2,i2:0}}' +
'var re=tr/2;var im=Math.sqrt(-disc)/2;' +
'return{r1:re,i1:im,r2:re,i2:-im}}' +

// ── V(x) = x1^2 + x2^2 (quadratic Lyapunov) ──
'function lyapV(x1,x2){return x1*x1+x2*x2}' +

// ── Dynamics ──
'function dynamics(x1,x2){' +
'if(sysType===3){' + // Van der Pol-like limit cycle
'var r=Math.sqrt(x1*x1+x2*x2);' +
'var mu=1.0-dampVal*0.5;' +
'var dx1=x2+mu*x1*(1-r*r);' +
'var dx2=-x1+mu*x2*(1-r*r);' +
'return{dx1:dx1,dx2:dx2}}' +
'return{dx1:A[0][0]*x1+A[0][1]*x2,dx2:A[1][0]*x1+A[1][1]*x2}}' +

// ── RK4 integration step ──
'function rk4Step(x1,x2){' +
'var k1=dynamics(x1,x2);' +
'var k2=dynamics(x1+dt/2*k1.dx1,x2+dt/2*k1.dx2);' +
'var k3=dynamics(x1+dt/2*k2.dx1,x2+dt/2*k2.dx2);' +
'var k4=dynamics(x1+dt*k3.dx1,x2+dt*k3.dx2);' +
'return{x1:x1+dt/6*(k1.dx1+2*k2.dx1+2*k3.dx1+k4.dx1),' +
'x2:x2+dt/6*(k1.dx2+2*k2.dx2+2*k3.dx2+k4.dx2)}}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── World to screen coords ──
'function w2sx(x){return canvasW/2+x/SCALE*canvasW/2}' +
'function w2sy(y){return canvasH/2-y/SCALE*canvasH/2}' +
'function s2wx(sx){return(sx-canvasW/2)/(canvasW/2)*SCALE}' +
'function s2wy(sy){return-(sy-canvasH/2)/(canvasH/2)*SCALE}' +

// ── Draw phase plane ──
'function drawPhase(){' +
'var dim=setupCanvas(document.getElementById("cvPhase"),300);canvasW=dim.w;canvasH=dim.h;' +
'var cv=document.getElementById("cvPhase");' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,canvasW,canvasH);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(0,canvasH/2);ctx.lineTo(canvasW,canvasH/2);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(canvasW/2,0);ctx.lineTo(canvasW/2,canvasH);ctx.stroke();' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";' +
'ctx.textAlign="left";ctx.fillText("x\\u2081",canvasW-14,canvasH/2-4);' +
'ctx.fillText("x\\u2082",canvasW/2+4,12);' +

// Lyapunov level curves (concentric ellipses)
'var levels=[0.5,1.0,2.0,3.5,5.5];' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;' +
'for(var li=0;li<levels.length;li++){' +
'var r=Math.sqrt(levels[li]);' +
'var srx=r/SCALE*canvasW/2;var sry=r/SCALE*canvasH/2;' +
'ctx.globalAlpha=0.15;ctx.fillStyle=tealC;' +
'ctx.beginPath();ctx.ellipse(canvasW/2,canvasH/2,srx,sry,0,0,Math.PI*2);ctx.fill();' +
'ctx.globalAlpha=0.4;ctx.beginPath();ctx.ellipse(canvasW/2,canvasH/2,srx,sry,0,0,Math.PI*2);ctx.stroke();' +
'ctx.globalAlpha=1}' +
// V value labels on select level curves
'ctx.fillStyle=tealC;ctx.font="8px monospace";ctx.textAlign="left";ctx.globalAlpha=0.5;' +
'for(var li=0;li<levels.length;li+=2){var lr=Math.sqrt(levels[li]);var lrx=lr/SCALE*canvasW/2;' +
'if(canvasW/2+lrx+30<canvasW)ctx.fillText("V="+levels[li],canvasW/2+lrx+3,canvasH/2-2)}' +
'ctx.globalAlpha=1;' +

// vector field (arrow grid)
'var GRID=14;' +
'var step=canvasW/GRID;' +
'for(var gi=1;gi<GRID;gi++){for(var gj=1;gj<GRID;gj++){' +
'var sx=gi*step;var sy=gj*step;' +
'var wx=s2wx(sx);var wy=s2wy(sy);' +
'var d=dynamics(wx,wy);' +
'var mag=Math.sqrt(d.dx1*d.dx1+d.dx2*d.dx2);' +
'if(mag<0.001)continue;' +
'var arrowLen=Math.min(mag*8,step*0.35);' +
'var nx=d.dx1/mag;var ny=d.dx2/mag;' +
'var ex=sx+nx*arrowLen;var ey=sy-ny*arrowLen;' +
'ctx.strokeStyle=text3C;ctx.lineWidth=1;ctx.globalAlpha=0.5;' +
'ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();' +
// arrowhead
'var ha=Math.atan2(-(ny),nx);' +
'var hs=3;' +
'ctx.beginPath();ctx.moveTo(ex,ey);' +
'ctx.lineTo(ex-hs*Math.cos(ha-0.5),ey+hs*Math.sin(ha-0.5));' +
'ctx.moveTo(ex,ey);' +
'ctx.lineTo(ex-hs*Math.cos(ha+0.5),ey+hs*Math.sin(ha+0.5));' +
'ctx.stroke();ctx.globalAlpha=1}}' +

// equilibrium point
'var isStable=(sysType!==2);' +
'ctx.beginPath();ctx.arc(canvasW/2,canvasH/2,5,0,Math.PI*2);' +
'ctx.fillStyle=isStable?greenC:redC;ctx.fill();' +

// draw particle trails
'for(var pi=0;pi<particles.length;pi++){' +
'var p=particles[pi];var col=TRAJ_COLORS[pi%TRAJ_COLORS.length];' +
'if(p.trail.length>1){' +
'ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();' +
'ctx.moveTo(w2sx(p.trail[0].x),w2sy(p.trail[0].y));' +
'for(var ti=1;ti<p.trail.length;ti++)' +
'ctx.lineTo(w2sx(p.trail[ti].x),w2sy(p.trail[ti].y));' +
'ctx.stroke()}' +
// current position
'ctx.beginPath();ctx.arc(w2sx(p.x),w2sy(p.y),4,0,Math.PI*2);' +
'ctx.fillStyle=col;ctx.fill()}}' +

// ── Draw V(t) graph ──
'function drawVt(){' +
'var cv=document.getElementById("cvVt");' +
'var dim=setupCanvas(cv,120);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=8;var gW=w-pad*2;var gH=h-pad*2;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("V(t)",pad+18,pad+3);' +

'if(particles.length===0)return;' +
// find max V across all particles
'var maxV=1;' +
'for(var pi=0;pi<particles.length;pi++){' +
'var vh=particles[pi].vHist;' +
'for(var i=0;i<vh.length;i++)if(vh[i]>maxV)maxV=vh[i]}' +

'for(var pi=0;pi<particles.length;pi++){' +
'var vh=particles[pi].vHist;' +
'if(vh.length<2)continue;' +
'var col=TRAJ_COLORS[pi%TRAJ_COLORS.length];' +
'ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.beginPath();' +
'var maxLen=200;var start=Math.max(0,vh.length-maxLen);var count=vh.length-start;' +
'for(var i=start;i<vh.length;i++){' +
'var x=pad+((i-start)/Math.max(count-1,1))*gW;' +
'var y=pad+(1-vh[i]/maxV)*gH;' +
'if(i===start)ctx.moveTo(x,y);else ctx.lineTo(x,y)}' +
'ctx.stroke()}' +

// stability label
'var lastP=particles[particles.length-1];' +
'if(lastP.vHist.length>10){' +
'var recent=lastP.vHist.slice(-10);' +
'var decreasing=recent[recent.length-1]<recent[0];' +
'ctx.font="bold 11px sans-serif";ctx.textAlign="right";' +
'ctx.fillStyle=decreasing?greenC:redC;' +
'ctx.fillText(decreasing?T.stable:T.unstable,w-pad,pad+12)}}' +

// ── Update step ──
'function simStep(){' +
'for(var pi=0;pi<particles.length;pi++){' +
'var p=particles[pi];' +
'var next=rk4Step(p.x,p.y);' +
// clamp to bounds
'if(Math.abs(next.x1)>SCALE*1.5)next.x1=Math.sign(next.x1)*SCALE*1.5;' +
'if(Math.abs(next.x2)>SCALE*1.5)next.x2=Math.sign(next.x2)*SCALE*1.5;' +
'p.x=next.x1;p.y=next.x2;' +
'p.trail.push({x:p.x,y:p.y});' +
'if(p.trail.length>400)p.trail.shift();' +
'p.vHist.push(lyapV(p.x,p.y));' +
'if(p.vHist.length>400)p.vHist.shift()}}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var names=[T.focus,T.node,T.saddle,T.limit];' +
'var ev=eigenvalues();' +
'var evStr="";' +
'if(ev.i1===0)evStr=ev.r1.toFixed(2)+", "+ev.r2.toFixed(2);' +
'else evStr=ev.r1.toFixed(2)+"\\u00B1"+Math.abs(ev.i1).toFixed(2)+"i";' +
'var s="<span class=\\"hi\\">"+T.sysType+"</span> "+names[sysType];' +
's+="<br><span class=\\"hi\\">"+T.eigenvals+"</span> "+evStr;' +
'if(particles.length>0){' +
'var last=particles[particles.length-1];' +
'var v=lyapV(last.x,last.y);' +
's+="<br><span class=\\"warn\\">"+T.vCurr+"</span> "+v.toFixed(3);' +
'var isStable=(sysType!==2);' +
'if(sysType===3)isStable=true;' +
's+="<br>"+T.status+": "+(isStable?"<span class=\\"grn\\">"+T.stable+"</span>":"<span class=\\"red\\">"+T.unstable+"</span>")}' +
's+="<br>"+T.points+": "+particles.length+"/5";' +
'box.innerHTML=s}' +

// ── Read params ──
'function readParams(){' +
'dampVal=+document.getElementById("slDamp").value/100;' +
'document.getElementById("valDamp").textContent=dampVal.toFixed(2);' +
'buildMatrix()}' +

// ── Set system ──
'function setSys(s){' +
'sysType=s;' +
'document.getElementById("preFocus").className="preset"+(s===0?" active":"");' +
'document.getElementById("preNode").className="preset"+(s===1?" active":"");' +
'document.getElementById("preSaddle").className="preset"+(s===2?" active":"");' +
'document.getElementById("preLimit").className="preset"+(s===3?" active":"");' +
'readParams();particles=[];' +
'drawPhase();drawVt();updateStats();notifyHeight()}' +

// ── Animation ──
'function animate(){' +
'if(!running)return;' +
'for(var i=0;i<3;i++)simStep();' +
'drawPhase();drawVt();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

'function onAnimate(){' +
'if(running){running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnAnim").textContent=T.animate;' +
'document.getElementById("btnAnim").className="btn btn-primary";return}' +
'if(particles.length===0)return;' +
'readParams();running=true;' +
'document.getElementById("btnAnim").textContent=T.stop;' +
'document.getElementById("btnAnim").className="btn btn-stop";' +
'animate()}' +

'function onClear(){' +
'for(var i=0;i<particles.length;i++){particles[i].trail=[];particles[i].vHist=[]}' +
'drawPhase();drawVt();updateStats()}' +

'function onReset(){' +
'running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnAnim").textContent=T.animate;' +
'document.getElementById("btnAnim").className="btn btn-primary";' +
'particles=[];readParams();' +
'drawPhase();drawVt();updateStats();notifyHeight()}' +

'function onParam(){readParams();if(!running){drawPhase();drawVt();updateStats()}}' +

// ── Tap to place initial condition ──
'function addPoint(sx,sy){' +
'if(particles.length>=5)return;' +
'var wx=s2wx(sx);var wy=s2wy(sy);' +
'particles.push({x:wx,y:wy,trail:[{x:wx,y:wy}],vHist:[lyapV(wx,wy)]});' +
'drawPhase();drawVt();updateStats()}' +

'document.getElementById("cvPhase").addEventListener("click",function(e){' +
'var rect=e.target.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'var cv=document.getElementById("cvPhase");' +
'var sx=(e.clientX-rect.left)*(cv.width/dpr)/rect.width;' +
'var sy=(e.clientY-rect.top)*(cv.height/dpr)/rect.height;' +
'addPoint(sx,sy)});' +

'document.getElementById("cvPhase").addEventListener("touchend",function(e){' +
'e.preventDefault();var touch=e.changedTouches[0];' +
'var rect=e.target.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'var cv=document.getElementById("cvPhase");' +
'var sx=(touch.clientX-rect.left)*(cv.width/dpr)/rect.width;' +
'var sy=(touch.clientY-rect.top)*(cv.height/dpr)/rect.height;' +
'addPoint(sx,sy)},{passive:false});' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-phase").textContent=T.phase;' +
'document.getElementById("lbl-vt").textContent=T.vt;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-sys").textContent=T.sys;' +
'document.getElementById("preFocus").textContent=T.focus;' +
'document.getElementById("preNode").textContent=T.node;' +
'document.getElementById("preSaddle").textContent=T.saddle;' +
'document.getElementById("preLimit").textContent=T.limit;' +
'document.getElementById("lbl-damp").textContent=T.damp;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnAnim").textContent=T.animate;' +
'document.getElementById("btnClear").textContent=T.clear;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("hintTap").textContent=T.tapHint;' +
'readParams();' +
'var dim=setupCanvas(document.getElementById("cvPhase"),300);canvasW=dim.w;canvasH=dim.h;' +
// Place 2 default initial points so canvas isn't empty on load
'particles.push({x:1.8,y:0.5,trail:[{x:1.8,y:0.5}],vHist:[lyapV(1.8,0.5)]});' +
'particles.push({x:-0.7,y:-1.2,trail:[{x:-0.7,y:-1.2}],vHist:[lyapV(-0.7,-1.2)]});' +
'drawPhase();drawVt();updateStats();' +
'window.addEventListener("resize",function(){' +
'var dim=setupCanvas(document.getElementById("cvPhase"),300);canvasW=dim.w;canvasH=dim.h;' +
'if(!running){drawPhase();drawVt()}notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
