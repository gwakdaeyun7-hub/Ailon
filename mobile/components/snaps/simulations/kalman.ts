/**
 * Kalman Filter interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 2D object tracking with sensor fusion (GPS + Accelerometer)
 * - True trajectory (sinusoidal/circular path) with noisy sensor readings
 * - Kalman estimate with covariance ellipse visualization
 * - Time-series error comparison graph (GPS vs Accel vs Kalman)
 * - GPS noise / Accel noise sliders, GPS Off toggle
 * - Step / Auto / Reset modes, speed slider
 * - Dark/light theme, Korean/English bilingual
 */

export function getKalmanSimulationHTML(isDark: boolean, lang: string): string {
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
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:var(--bg)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .red{color:var(--red);font-weight:700}' +
'.legend-row{display:flex;gap:12px;margin-top:6px;flex-wrap:wrap}' +
'.legend-item{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text2)}' +
'.legend-dot{width:8px;height:8px;flex-shrink:0}' +
'.toggle-row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.toggle-label{font-size:12px;font-weight:600;color:var(--text)}' +
'.toggle-box{width:44px;height:24px;border:2px solid var(--border);background:var(--surface);position:relative;cursor:pointer;-webkit-tap-highlight-color:transparent;border-radius:8px;overflow:hidden}' +
'.toggle-box.on{background:var(--red);border-color:var(--red)}' +
'.toggle-knob{width:16px;height:16px;background:var(--text);position:absolute;top:2px;left:2px;transition:left 0.15s}' +
'.toggle-box.on .toggle-knob{left:22px;background:var(--bg)}' +
'</style></head><body>' +

// -- Tracking Canvas Panel --
'<div class="panel"><div class="label" id="lbl-track"></div>' +
'<canvas id="cvTrack" height="220"></canvas>' +
'<div class="legend-row">' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--text3)"></div><span id="leg-true"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--red)"></div><span id="leg-gps"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div><span id="leg-acc"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--teal)"></div><span id="leg-kal"></span></div>' +
'</div></div>' +

// -- Error Graph Panel --
'<div class="panel"><div class="label" id="lbl-error"></div>' +
'<canvas id="cvError" height="140"></canvas></div>' +

// -- Controls Panel --
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="cn-gps"></span>' +
'<input type="range" id="slGps" min="5" max="50" value="20" oninput="onParam()">' +
'<span class="ctrl-val" id="valGps"></span></div>' +
'<div class="row"><span class="ctrl-name" id="cn-acc"></span>' +
'<input type="range" id="slAcc" min="1" max="30" value="8" oninput="onParam()">' +
'<span class="ctrl-val" id="valAcc"></span></div>' +
'<div class="row"><span class="ctrl-name" id="cn-spd"></span>' +
'<input type="range" id="slSpd" min="1" max="5" value="2" oninput="onParam()">' +
'<span class="ctrl-val" id="valSpd"></span></div>' +
'<div class="toggle-row">' +
'<div class="toggle-box" id="togGps" onclick="toggleGps()">' +
'<div class="toggle-knob"></div></div>' +
'<span class="toggle-label" id="lbl-gpsoff"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnStep" onclick="doStep()"></div>' +
'<div class="btn" id="btnAuto" onclick="toggleAuto()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// -- Stats Panel --
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// -- Labels --
'var L={' +
'ko:{track:"2D \\uCD94\\uC801",error:"\\uC624\\uCC28 \\uBE44\\uAD50",ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",' +
'stats:"\\uD1B5\\uACC4",gpsN:"GPS \\uB178\\uC774\\uC988",accN:"\\uAC00\\uC18D\\uB3C4\\uACC4",spd:"\\uC18D\\uB3C4",' +
'gpsOff:"GPS \\uB044\\uAE30",step:"\\uC2A4\\uD15D",auto:"\\uC790\\uB3D9",pause:"\\uC77C\\uC2DC\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'truePath:"\\uC2E4\\uC81C \\uACBD\\uB85C",gpsObs:"GPS \\uAD00\\uCE21",accPred:"\\uAC00\\uC18D\\uB3C4\\uACC4 \\uC608\\uCE21",kalEst:"\\uCE7C\\uB9CC \\uCD94\\uC815",' +
'gain:"\\uCE7C\\uB9CC \\uC774\\uB4DD(K)",covTr:"\\uACF5\\uBD84\\uC0B0 \\uD2B8\\uB808\\uC774\\uC2A4",' +
'errGps:"GPS \\uC624\\uCC28",errAcc:"\\uAC00\\uC18D\\uB3C4\\uACC4 \\uC624\\uCC28",errKal:"\\uCE7C\\uB9CC \\uC624\\uCC28",' +
'stepN:"\\uC2A4\\uD15D",gpsStatus:"GPS \\uC0C1\\uD0DC",on:"ON",off:"OFF",' +
'waiting:"\\uC2A4\\uD15D \\uB610\\uB294 \\uC790\\uB3D9\\uC744 \\uB20C\\uB7EC \\uCD94\\uC801\\uC744 \\uC2DC\\uC791\\uD558\\uC138\\uC694",' +
'insight:"GPS\\uAC00 \\uAEBC\\uC9C0\\uBA74 \\uACF5\\uBD84\\uC0B0 \\uD0C0\\uC6D0\\uC774 \\uCEE4\\uC9D1\\uB2C8\\uB2E4"},' +
'en:{track:"2D TRACKING",error:"ERROR COMPARISON",ctrl:"PARAMETERS",' +
'stats:"STATISTICS",gpsN:"GPS Noise",accN:"Accel. Noise",spd:"Speed",' +
'gpsOff:"GPS Off",step:"Step",auto:"Auto",pause:"Pause",reset:"\\u21BA Reset",' +
'truePath:"True Path",gpsObs:"GPS Obs.",accPred:"Accel. Pred.",kalEst:"Kalman Est.",' +
'gain:"Kalman Gain(K)",covTr:"Covariance Trace",' +
'errGps:"GPS Error",errAcc:"Accel. Error",errKal:"Kalman Error",' +
'stepN:"Step",gpsStatus:"GPS Status",on:"ON",off:"OFF",' +
'waiting:"Press Step or Auto to start tracking",' +
'insight:"GPS off \\u2192 covariance ellipse grows"}' +
'};' +
'var T=L[LANG]||L.en;' +

// -- State --
'var sigGps=20,sigAcc=8,speed=2;' +
'var gpsOff=false,autoMode=false,animId=null;' +
'var step=0;var MAX_HIST=120;' +
// true state, kalman state, covariance
'var trueX=0,trueY=0,trueVx=0,trueVy=0;' +
'var kx=0,ky=0,kvx=0,kvy=0;' +
// P matrix (4x4 stored flat as [P00,P01,P02,P03,P10,...])
'var P=[100,0,0,0, 0,100,0,0, 0,0,10,0, 0,0,0,10];' +
// histories
'var trueHist=[],gpsHist=[],accHist=[],kalHist=[];' +
'var errGpsH=[],errAccH=[],errKalH=[];' +
// accel prediction
'var accX=0,accY=0;' +

// -- Canvas DPR setup --
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// -- Matrix helpers (4x4) --
'function mat4mul(A,B){var C=new Array(16).fill(0);for(var i=0;i<4;i++)for(var j=0;j<4;j++)for(var k=0;k<4;k++)C[i*4+j]+=A[i*4+k]*B[k*4+j];return C}' +
'function mat4add(A,B){var C=new Array(16);for(var i=0;i<16;i++)C[i]=A[i]+B[i];return C}' +
'function mat4T(A){var C=new Array(16);for(var i=0;i<4;i++)for(var j=0;j<4;j++)C[i*4+j]=A[j*4+i];return C}' +
// 2x2 inverse for innovation covariance
'function inv2(a,b,c,d){var det=a*d-b*c;if(Math.abs(det)<1e-12)det=(det>=0?1:-1)*1e-12;return[d/det,-b/det,-c/det,a/det]}' +

// -- True trajectory (Lissajous-like) --
'function truePos(t){' +
'var sc=70;' +
'var x=sc*Math.sin(t*0.05)*Math.cos(t*0.02);' +
'var y=sc*Math.cos(t*0.03)*Math.sin(t*0.04);' +
'return{x:x,y:y}}' +

// -- Kalman Predict --
'var dt=1;' +
'var F=[1,0,dt,0, 0,1,0,dt, 0,0,1,0, 0,0,0,1];' +
'var Q_base=[0.5,0,0,0, 0,0.5,0,0, 0,0,0.3,0, 0,0,0,0.3];' +
'function kalmanPredict(){' +
'var x_=[kx+kvx*dt, ky+kvy*dt, kvx, kvy];' +
// scale Q by accel noise
'var qScale=sigAcc*sigAcc/64;' +
'var Q=Q_base.map(function(v){return v*qScale});' +
'P=mat4add(mat4mul(mat4mul(F,P),mat4T(F)),Q);' +
'kx=x_[0];ky=x_[1];kvx=x_[2];kvy=x_[3]}' +

// -- Kalman Update (GPS measurement z=[zx,zy]) --
'var H=[1,0,0,0, 0,1,0,0];' + // 2x4
'function kalmanUpdate(zx,zy){' +
'var R=sigGps*sigGps;' +
// S = H P H^T + R (2x2)
'var S00=P[0]+R, S01=P[1], S10=P[4], S11=P[5]+R;' +
'var Si=inv2(S00,S01,S10,S11);' +
// K = P H^T S^-1 (4x2)
'var PHt=[P[0],P[1], P[4],P[5], P[8],P[9], P[12],P[13]];' +
'var K=new Array(8);' +
'for(var i=0;i<4;i++){K[i*2]=PHt[i*2]*Si[0]+PHt[i*2+1]*Si[2];K[i*2+1]=PHt[i*2]*Si[1]+PHt[i*2+1]*Si[3]}' +
// innovation
'var yx=zx-kx, yy=zy-ky;' +
'kx+=K[0]*yx+K[1]*yy;' +
'ky+=K[2]*yx+K[3]*yy;' +
'kvx+=K[4]*yx+K[5]*yy;' +
'kvy+=K[6]*yx+K[7]*yy;' +
// P = (I-KH)P
'var KH=new Array(16).fill(0);' +
'for(var i=0;i<4;i++){KH[i*4]=K[i*2];KH[i*4+1]=K[i*2+1]}' +
'var I=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];' +
'var IKH=new Array(16);for(var i=0;i<16;i++)IKH[i]=I[i]-KH[i];' +
'P=mat4mul(IKH,P);' +
'return{k0:K[0],k1:K[3]}}' +

// -- Step logic --
'var lastK={k0:0,k1:0};' +
'function doStep(){' +
'step++;' +
'var tp=truePos(step*speed);' +
'trueVx=tp.x-trueX;trueVy=tp.y-trueY;' +
'trueX=tp.x;trueY=tp.y;' +
// GPS observation
'var gx=trueX+(Math.random()-0.5)*2*sigGps;' +
'var gy=trueY+(Math.random()-0.5)*2*sigGps;' +
// Accel prediction (dead reckoning with drift)
'accX+=trueVx+(Math.random()-0.5)*2*sigAcc*0.3;' +
'accY+=trueVy+(Math.random()-0.5)*2*sigAcc*0.3;' +
// Kalman predict
'kalmanPredict();' +
// Kalman update (only if GPS on)
'if(!gpsOff){lastK=kalmanUpdate(gx,gy)}else{lastK={k0:0,k1:0}}' +
// Store histories
'trueHist.push({x:trueX,y:trueY});' +
'gpsHist.push({x:gx,y:gy});' +
'accHist.push({x:accX,y:accY});' +
'kalHist.push({x:kx,y:ky});' +
// errors
'var eg=Math.sqrt((gx-trueX)*(gx-trueX)+(gy-trueY)*(gy-trueY));' +
'var ea=Math.sqrt((accX-trueX)*(accX-trueX)+(accY-trueY)*(accY-trueY));' +
'var ek=Math.sqrt((kx-trueX)*(kx-trueX)+(ky-trueY)*(ky-trueY));' +
'errGpsH.push(eg);errAccH.push(ea);errKalH.push(ek);' +
// trim
'if(trueHist.length>MAX_HIST){trueHist.shift();gpsHist.shift();accHist.shift();kalHist.shift();errGpsH.shift();errAccH.shift();errKalH.shift()}' +
'drawTrack();drawError();updateStats();notifyHeight()}' +

// -- Draw tracking canvas --
'function drawTrack(){' +
'var cv=document.getElementById("cvTrack");' +
'var dim=setupCanvas(cv,220);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var accC=cs.getPropertyValue("--accent").trim();' +
'var cx=w/2,cy=h/2;' +
// grid
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.setLineDash([2,4]);' +
'for(var gx=-80;gx<=80;gx+=40){ctx.beginPath();ctx.moveTo(cx+gx,0);ctx.lineTo(cx+gx,h);ctx.stroke()}' +
'for(var gy=-80;gy<=80;gy+=40){ctx.beginPath();ctx.moveTo(0,cy+gy);ctx.lineTo(w,cy+gy);ctx.stroke()}' +
'ctx.setLineDash([]);' +
// true path (dashed gray)
'if(trueHist.length>1){ctx.strokeStyle=textC;ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();' +
'for(var i=0;i<trueHist.length;i++){var px=cx+trueHist[i].x,py=cy-trueHist[i].y;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();ctx.setLineDash([])}' +
// GPS observations (red x marks)
'if(!gpsOff){ctx.strokeStyle=redC;ctx.lineWidth=1.5;' +
'var gLen=gpsHist.length;var gStart=Math.max(0,gLen-30);' +
'for(var i=gStart;i<gLen;i++){var px=cx+gpsHist[i].x,py=cy-gpsHist[i].y;var alpha=0.3+(i-gStart)/(gLen-gStart)*0.7;ctx.globalAlpha=alpha;' +
'ctx.beginPath();ctx.moveTo(px-3,py-3);ctx.lineTo(px+3,py+3);ctx.stroke();ctx.beginPath();ctx.moveTo(px+3,py-3);ctx.lineTo(px-3,py+3);ctx.stroke()}ctx.globalAlpha=1}' +
// Accel prediction (orange triangle)
'if(accHist.length>0){var last=accHist[accHist.length-1];var px=cx+last.x,py=cy-last.y;' +
'ctx.strokeStyle=accC;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px,py-5);ctx.lineTo(px-5,py+4);ctx.lineTo(px+5,py+4);ctx.closePath();ctx.stroke()}' +
// Kalman trail
'if(kalHist.length>1){ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.globalAlpha=0.4;ctx.beginPath();' +
'for(var i=0;i<kalHist.length;i++){var px=cx+kalHist[i].x,py=cy-kalHist[i].y;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();ctx.globalAlpha=1}' +
// Covariance ellipse
'if(kalHist.length>0){' +
'var lx=cx+kx,ly=cy-ky;' +
'var sx=Math.sqrt(Math.abs(P[0]))*2;var sy=Math.sqrt(Math.abs(P[5]))*2;' +
'var maxR=80;sx=Math.min(sx,maxR);sy=Math.min(sy,maxR);' +
'ctx.beginPath();ctx.ellipse(lx,ly,sx,sy,0,0,Math.PI*2);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.12;ctx.fill();ctx.globalAlpha=1;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(lx,ly,sx,sy,0,0,Math.PI*2);ctx.stroke()}' +
// Kalman estimate dot (blue filled)
'if(kalHist.length>0){var lx=cx+kx,ly=cy-ky;' +
'ctx.fillStyle=tealC;ctx.beginPath();ctx.arc(lx,ly,4,0,Math.PI*2);ctx.fill()}' +
'}' +

// -- Draw error graph --
'function drawError(){' +
'var cv=document.getElementById("cvError");' +
'var dim=setupCanvas(cv,140);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var accC=cs.getPropertyValue("--accent").trim();' +
'var pad=32,pr=8,pt=10,pb=20;' +
'var pw=w-pad-pr,ph=h-pt-pb;' +
'if(errGpsH.length<2){ctx.fillStyle=textC;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";ctx.fillText(T.waiting,w/2,h/2);return}' +
// find max
'var maxE=1;' +
'for(var i=0;i<errGpsH.length;i++){if(errGpsH[i]>maxE)maxE=errGpsH[i];if(errAccH[i]>maxE)maxE=errAccH[i];if(errKalH[i]>maxE)maxE=errKalH[i]}' +
'maxE*=1.1;' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(maxE.toFixed(0),pad-4,pt+8);ctx.fillText("0",pad-4,h-pb+4);' +
// helper
'function drawLine(arr,color){ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.beginPath();' +
'for(var i=0;i<arr.length;i++){var px=pad+i/(arr.length-1)*pw;var py=pt+(maxE-arr[i])/maxE*ph;' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke()}' +
'drawLine(errGpsH,redC);drawLine(errAccH,accC);drawLine(errKalH,tealC);' +
'}' +

// -- Param update --
'function onParam(){' +
'sigGps=+document.getElementById("slGps").value;' +
'sigAcc=+document.getElementById("slAcc").value;' +
'speed=+document.getElementById("slSpd").value;' +
'document.getElementById("valGps").textContent="\\u03C3="+sigGps;' +
'document.getElementById("valAcc").textContent="\\u03C3="+sigAcc;' +
'document.getElementById("valSpd").textContent="x"+speed}' +

// -- GPS toggle --
'function toggleGps(){' +
'gpsOff=!gpsOff;' +
'var el=document.getElementById("togGps");' +
'el.className=gpsOff?"toggle-box on":"toggle-box";' +
'updateStats()}' +

// -- Auto mode --
'function toggleAuto(){' +
'autoMode=!autoMode;' +
'document.getElementById("btnAuto").textContent=autoMode?T.pause:T.auto;' +
'document.getElementById("btnAuto").className=autoMode?"btn btn-stop":"btn";' +
'if(autoMode)runAuto();else if(animId){cancelAnimationFrame(animId);animId=null}}' +

'var lastTime=0;' +
'function runAuto(ts){' +
'if(!autoMode)return;' +
'if(!ts)ts=0;' +
'if(ts-lastTime>60){lastTime=ts;doStep()}' +
'animId=requestAnimationFrame(runAuto)}' +

// -- Stats --
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(step===0){box.innerHTML=T.waiting;return}' +
'var covTrace=(P[0]+P[5]).toFixed(1);' +
'var kMag=Math.sqrt(lastK.k0*lastK.k0+lastK.k1*lastK.k1).toFixed(3);' +
'var curErr=errKalH.length>0?errKalH[errKalH.length-1].toFixed(1):"--";' +
'var s="<span class=\\"hi\\">"+T.stepN+"</span> "+step+"<br>";' +
's+=T.gain+": <span class=\\"hi\\">"+kMag+"</span><br>";' +
's+=T.covTr+": <span class=\\"warn\\">"+covTrace+"</span><br>";' +
's+=T.errKal+": <span class=\\"hi\\">"+curErr+"</span><br>";' +
's+=T.gpsStatus+": "+(gpsOff?"<span class=\\"red\\">"+T.off+"</span>":"<span class=\\"hi\\">"+T.on+"</span>")+"<br>";' +
'if(gpsOff&&step>5){s+="<br><span class=\\"warn\\">"+T.insight+"</span>"}' +
'box.innerHTML=s}' +

// -- Reset --
'function onReset(){' +
'autoMode=false;if(animId){cancelAnimationFrame(animId);animId=null}' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn";' +
'step=0;trueX=0;trueY=0;trueVx=0;trueVy=0;' +
'kx=0;ky=0;kvx=0;kvy=0;accX=0;accY=0;' +
'P=[100,0,0,0, 0,100,0,0, 0,0,10,0, 0,0,0,10];' +
'trueHist=[];gpsHist=[];accHist=[];kalHist=[];' +
'errGpsH=[];errAccH=[];errKalH=[];lastK={k0:0,k1:0};' +
'drawTrack();drawError();updateStats();notifyHeight()}' +

// -- Height notification --
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// -- Init labels --
'document.getElementById("lbl-track").textContent=T.track;' +
'document.getElementById("lbl-error").textContent=T.error;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("cn-gps").textContent=T.gpsN;' +
'document.getElementById("cn-acc").textContent=T.accN;' +
'document.getElementById("cn-spd").textContent=T.spd;' +
'document.getElementById("lbl-gpsoff").textContent=T.gpsOff;' +
'document.getElementById("btnStep").textContent=T.step;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("leg-true").textContent=T.truePath;' +
'document.getElementById("leg-gps").textContent=T.gpsObs;' +
'document.getElementById("leg-acc").textContent=T.accPred;' +
'document.getElementById("leg-kal").textContent=T.kalEst;' +

// -- Init --
'onParam();drawTrack();drawError();' +
'window.addEventListener("resize",function(){drawTrack();drawError();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
