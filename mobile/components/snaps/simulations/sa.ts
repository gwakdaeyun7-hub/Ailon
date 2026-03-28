/**
 * Simulated Annealing interactive simulation — self-contained HTML/JS
 *
 * Features:
 * - 5 preset objective functions (quadratic, multi-modal, Rastrigin, wavy, deceptive)
 * - Adjustable parameters: T0, cooling rate, max iterations, perturbation sigma, bounds
 * - Advanced panel: cooling schedule (Geometric/Logarithmic/Linear), steps per temperature
 * - Animated energy landscape with current/best position markers + acceptance trail
 * - Temperature-mapped marker color (hot=accent, cold=teal)
 * - Tap to set initial position (before first run)
 * - Convergence plot (temperature + best energy over iterations)
 * - Real-time acceptance probability display (paused / step mode)
 * - Completion verdict (global optimum found vs stuck in local min)
 * - Boundary reflection instead of clamping
 * - Step / Run / Pause / Reset controls
 * - Dark/light theme, Korean/English bilingual
 */

export function getSASimulationHTML(isDark: boolean, lang: string): string {
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
'.ctrl-hint{font-size:10px;color:var(--text3);margin-top:-6px;margin-bottom:8px;padding-left:48px}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'select{width:100%;padding:8px 10px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;font-weight:600;-webkit-appearance:none;appearance:none;border-radius:8px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .verdict-ok{color:var(--green);font-weight:700}' +
'.stats .verdict-stuck{color:var(--accent);font-weight:700}' +
'.bounds-row{display:flex;align-items:center;gap:6px}' +
'.bounds-input{width:44px;padding:6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-family:monospace;text-align:center;border-radius:6px}' +
'.bounds-sep{color:var(--text3);font-size:12px;font-weight:700}' +
'.seg-row{display:flex;gap:0;margin-bottom:10px}' +
'.seg-btn{flex:1;padding:8px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:11px;font-weight:700;text-align:center;cursor:pointer;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden;text-overflow:ellipsis;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.seg-btn:active{opacity:0.7}' +
'.seg-btn.sel{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.adv-toggle{padding:10px 0 2px;font-size:11px;font-weight:700;letter-spacing:0.5px;color:var(--text3);cursor:pointer;-webkit-tap-highlight-color:transparent;text-align:center}' +
'.adv-toggle:active{opacity:0.7}' +
'.adv-section{display:none;margin-top:10px;padding-top:10px;border-top:1px solid var(--border)}' +
'.adv-section.open{display:block}' +
'.prob-box{border-top:1px solid var(--border);margin-top:4px;padding-top:6px;font-family:monospace;font-size:11px;line-height:1.8;color:var(--text2)}' +
'</style></head><body>' +

'<div class="panel"><div class="label" id="lbl-func"></div>' +
'<select id="funcSelect" onchange="onFuncChange()"></select></div>' +

'<div class="panel"><div class="label" id="lbl-plot"></div>' +
'<canvas id="cvFunc" height="200"></canvas></div>' +

'<div class="panel"><div class="label" id="lbl-params"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-t0"></span>' +
'<input type="range" id="slT0" min="1" max="1000" value="100" oninput="onParam()">' +
'<span class="ctrl-val" id="valT0"></span></div>' +
'<div class="ctrl-hint" id="hint-t0"></div>' +

'<div class="row" id="row-cool"><span class="ctrl-name" id="lbl-cool"></span>' +
'<input type="range" id="slCool" min="900" max="999" value="995" oninput="onParam()">' +
'<span class="ctrl-val" id="valCool"></span></div>' +
'<div class="ctrl-hint" id="hint-cool"></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-iter"></span>' +
'<input type="range" id="slIter" min="100" max="2000" step="100" value="500" oninput="onParam()">' +
'<span class="ctrl-val" id="valIter"></span></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-sigma"></span>' +
'<input type="range" id="slSigma" min="5" max="200" value="30" oninput="onParam()">' +
'<span class="ctrl-val" id="valSigma"></span></div>' +
'<div class="ctrl-hint" id="hint-sigma"></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-bounds"></span>' +
'<div class="bounds-row">' +
'<input type="number" class="bounds-input" id="inLow" value="-5" onchange="onParam()">' +
'<span class="bounds-sep">~</span>' +
'<input type="number" class="bounds-input" id="inHigh" value="5" onchange="onParam()">' +
'</div></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-speed"></span>' +
'<input type="range" id="slSpeed" min="1" max="20" value="5" oninput="onParam()">' +
'<span class="ctrl-val" id="valSpeed"></span></div>' +

// ── Advanced toggle + section ──
'<div class="adv-toggle" id="advToggle" onclick="toggleAdvanced()"></div>' +
'<div class="adv-section" id="advSection">' +

// Cooling schedule selector
'<div class="label" id="lbl-schedule"></div>' +
'<div class="seg-row" id="segSchedule">' +
'<div class="seg-btn sel" data-v="geometric" onclick="onSchedule(this)">Geometric</div>' +
'<div class="seg-btn" data-v="logarithmic" onclick="onSchedule(this)">Logarithmic</div>' +
'<div class="seg-btn" data-v="linear" onclick="onSchedule(this)">Linear</div>' +
'</div>' +
'<div class="ctrl-hint" id="hint-schedule"></div>' +

// Steps per temperature
'<div class="row"><span class="ctrl-name" id="lbl-spt"></span>' +
'<input type="range" id="slSPT" min="1" max="20" value="1" oninput="onParam()">' +
'<span class="ctrl-val" id="valSPT"></span></div>' +
'<div class="ctrl-hint" id="hint-spt"></div>' +

'</div>' + // end advSection
'</div>' + // end params panel

'<div class="panel"><div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="onRun()"></div>' +
'<div class="btn" id="btnStep" onclick="onStep()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

'<div class="panel"><div class="label" id="lbl-conv"></div>' +
'<canvas id="cvConv" height="160"></canvas></div>' +

'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──────────────────────────────────────────────────────────
'var L={' +
'ko:{func:"\\uBAA9\\uC801\\uD568\\uC218",plot:"\\uC5D0\\uB108\\uC9C0 \\uC9C0\\uD615",params:"\\uD30C\\uB77C\\uBBF8\\uD130",' +
't0:"\\uCD08\\uAE30\\uC628\\uB3C4",cool:"\\uB0C9\\uAC01\\uB960",iter:"\\uBC18\\uBCF5\\uD69F\\uC218",sigma:"\\uC12D\\uB3D9 \\u03C3",' +
'bounds:"\\uBC94\\uC704",speed:"\\uC560\\uB2C8 \\uC18D\\uB3C4",' +
'run:"\\u25B6 \\uC2E4\\uD589",pause:"\\u23F8 \\uC77C\\uC2DC\\uC815\\uC9C0",step:"\\u23ED \\uD55C \\uB2E8\\uACC4",reset:"\\u21BA \\uB9AC\\uC14B",' +
'conv:"\\uC218\\uB834 \\uACFC\\uC815",stats:"\\uD1B5\\uACC4",' +
'hintT0:"\\uB192\\uC744\\uC218\\uB85D \\uCD08\\uAE30 \\uD0D0\\uC0C9 \\uBC94\\uC704\\uAC00 \\uB113\\uC5B4\\uC9D1\\uB2C8\\uB2E4",' +
'hintCool:"1\\uC5D0 \\uAC00\\uAE4C\\uC6B8\\uC218\\uB85D \\uCC9C\\uCC9C\\uD788 \\uB0C9\\uAC01\\uB429\\uB2C8\\uB2E4",' +
'hintSigma:"\\uD074\\uC218\\uB85D \\uD55C \\uBC88\\uC5D0 \\uB354 \\uBA40\\uB9AC \\uC774\\uB3D9\\uD569\\uB2C8\\uB2E4",' +
'cur:"\\uD604\\uC7AC",best:"\\uCD5C\\uC801",temp:"\\uC628\\uB3C4",iterN:"\\uBC18\\uBCF5",accept:"\\uC218\\uC6A9\\uB960",' +
'waiting:"\\uD30C\\uB77C\\uBBF8\\uD130\\uB97C \\uC870\\uC808\\uD558\\uACE0 \\uC2E4\\uD589\\uC744 \\uB20C\\uB7EC\\uBCF4\\uC138\\uC694",' +
// New labels
'advOpen:"\\uACE0\\uAE09 \\uC124\\uC815 \\u00BB",' + // 고급 설정 >>
'advClose:"\\u00AB \\uACE0\\uAE09 \\uC124\\uC815",' + // << 고급 설정
'schedule:"\\uB0C9\\uAC01 \\uC2A4\\uCF00\\uC904",' + // 냉각 스케줄
'hintLog:"Geman & Geman (1984) \\u2014 \\uC774\\uB860\\uC801 \\uC218\\uB834 \\uBCF4\\uC7A5",' + // 이론적 수렴 보장
'hintGeo:"",' +
'hintLin:"",' +
'spt:"\\uC628\\uB3C4\\uBCC4 \\uBC18\\uBCF5",' + // 온도별 반복
'hintSPT:"\\uAC01 \\uC628\\uB3C4\\uC5D0\\uC11C N\\uBC88 \\uD0D0\\uC0C9 \\uD6C4 \\uB0C9\\uAC01",' + // 각 온도에서 N번 탐색 후 냉각
'verdictOk:"\\u2713 \\uC804\\uC5ED \\uCD5C\\uC801\\uD574 \\uB3C4\\uB2EC!",' + // 전역 최적해 도달!
'verdictStuck:"\\u25B3 \\uC9C0\\uC5ED \\uCD5C\\uC18F\\uAC12\\uC5D0 \\uBE60\\uC9D0 \\u2014 T0\\u2191 \\uB610\\uB294 \\uB0C9\\uAC01\\uB960\\u2191",' + // 지역 최솟값에 빠짐
'tapHint:"\\uD0ED\\uD558\\uC5EC \\uC2DC\\uC791\\uC810 \\uC124\\uC815",' + // 탭하여 시작점 설정
'probAccepted:"ACCEPTED",probRejected:"REJECTED"' +
'},' +
'en:{func:"OBJECTIVE FUNCTION",plot:"ENERGY LANDSCAPE",params:"PARAMETERS",' +
't0:"Init Temp",cool:"Cool Rate",iter:"Iterations",sigma:"Perturb \\u03C3",' +
'bounds:"Bounds",speed:"Anim Speed",' +
'run:"\\u25B6 Run",pause:"\\u23F8 Pause",step:"\\u23ED Step",reset:"\\u21BA Reset",' +
'conv:"CONVERGENCE",stats:"STATISTICS",' +
'hintT0:"Higher = wider initial exploration",' +
'hintCool:"Closer to 1 = slower cooling",' +
'hintSigma:"Larger = bigger jumps per step",' +
'cur:"Current",best:"Best",temp:"Temp",iterN:"Iter",accept:"Accept Rate",' +
'waiting:"Adjust parameters and press Run",' +
// New labels
'advOpen:"Advanced \\u00BB",' +
'advClose:"\\u00AB Advanced",' +
'schedule:"COOLING SCHEDULE",' +
'hintLog:"Geman & Geman (1984) \\u2014 theoretical convergence guarantee",' +
'hintGeo:"",' +
'hintLin:"",' +
'spt:"Steps/Temp",' +
'hintSPT:"N explorations per temperature level",' +
'verdictOk:"\\u2713 Global optimum found!",' +
'verdictStuck:"\\u25B3 Stuck in local min \\u2014 try higher T0 or slower cooling",' +
'tapHint:"TAP TO SET START",' +
'probAccepted:"ACCEPTED",probRejected:"REJECTED"' +
'}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── Objective Functions ─────────────────────────────────────────────
'var FUNCS=[' +
'{id:"quad",name:"(x-2)\\u00B2 + 5",fn:function(x){return(x-2)*(x-2)+5},defBounds:[-5,8]},' +
'{id:"multi",name:"x\\u2074 - 3x\\u00B2 + x",fn:function(x){return x*x*x*x-3*x*x+x},defBounds:[-3,3]},' +
'{id:"rast",name:"Rastrigin 1D",fn:function(x){return 10+x*x-10*Math.cos(2*Math.PI*x)},defBounds:[-5,5]},' +
'{id:"wavy",name:"|x-3| + 2sin(5x)",fn:function(x){return Math.abs(x-3)+2*Math.sin(5*x)},defBounds:[-2,8]},' +
'{id:"decept",name:"-x\\u00B7sin(x) (Deceptive)",fn:function(x){return -x*Math.sin(x)},defBounds:[0,15]}' +
'];' +
// Runtime numerical min finder — avoids hardcoding errors, adapts to current bounds
'function findGlobalMin(fn,lo,hi){var m=Infinity;for(var i=0;i<=10000;i++){var v=fn(lo+(hi-lo)*i/10000);if(v<m)m=v}return m};' +
'var curFunc=FUNCS[0];' +

// ── State ───────────────────────────────────────────────────────────
'var xCur,bestX,T0,coolRate,maxIter,sigma,low,high,speed;' +
'var temperature,iteration,accepted,total;' +
'var histX=[],histBestE=[],histTemp=[],histAccepted=[];' +
'var animating=false,done=false;' +
// Advanced state
'var advOpen=false;' +
'var coolSchedule="geometric";' + // geometric | logarithmic | linear
'var stepsPerTemp=1;' +
'var tempStepCount=0;' +
// Acceptance probability display state
'var lastDE=0,lastP=0,lastRand=0,lastAccepted=false,hasLastStep=false;' +
// Tap to set initial position state
'var tapStartX=0,tapStartY=0;' +
'var userSetStart=false;' +

// ── DOM refs ────────────────────────────────────────────────────────
'var cvFunc=document.getElementById("cvFunc");' +
'var cvConv=document.getElementById("cvConv");' +
'var ctxF=cvFunc.getContext("2d");' +
'var ctxC=cvConv.getContext("2d");' +

// ── Init labels ─────────────────────────────────────────────────────
'document.getElementById("lbl-func").textContent=T.func;' +
'document.getElementById("lbl-plot").textContent=T.plot;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-t0").textContent=T.t0;' +
'document.getElementById("lbl-cool").textContent=T.cool;' +
'document.getElementById("lbl-iter").textContent=T.iter;' +
'document.getElementById("lbl-sigma").textContent=T.sigma;' +
'document.getElementById("lbl-bounds").textContent=T.bounds;' +
'document.getElementById("lbl-speed").textContent=T.speed;' +
'document.getElementById("lbl-conv").textContent=T.conv;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("hint-t0").textContent=T.hintT0;' +
'document.getElementById("hint-cool").textContent=T.hintCool;' +
'document.getElementById("hint-sigma").textContent=T.hintSigma;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnStep").textContent=T.step;' +
'document.getElementById("btnReset").textContent=T.reset;' +
// New labels
'document.getElementById("advToggle").textContent=T.advOpen;' +
'document.getElementById("lbl-schedule").textContent=T.schedule;' +
'document.getElementById("hint-schedule").textContent=T.hintGeo;' +
'document.getElementById("lbl-spt").textContent=T.spt;' +
'document.getElementById("hint-spt").textContent=T.hintSPT;' +

// ── Populate function selector ──────────────────────────────────────
'var sel=document.getElementById("funcSelect");' +
'for(var i=0;i<FUNCS.length;i++){' +
'var o=document.createElement("option");o.value=i;o.textContent=FUNCS[i].name;sel.appendChild(o)}' +

// ── Box-Muller normal random ────────────────────────────────────────
'function randn(){var u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();' +
'return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}' +

// ── Canvas DPR setup ────────────────────────────────────────────────
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Read params from UI ─────────────────────────────────────────────
'function readParams(){' +
'T0=+document.getElementById("slT0").value;' +
'coolRate=+document.getElementById("slCool").value/1000;' +
'maxIter=+document.getElementById("slIter").value;' +
'sigma=+document.getElementById("slSigma").value/100;' +
'low=+document.getElementById("inLow").value;' +
'high=+document.getElementById("inHigh").value;' +
'speed=+document.getElementById("slSpeed").value;' +
'stepsPerTemp=+document.getElementById("slSPT").value;' +
'if(low>=high){high=low+1;document.getElementById("inHigh").value=high}' +
'document.getElementById("valT0").textContent=T0;' +
'document.getElementById("valCool").textContent=coolRate.toFixed(3);' +
'document.getElementById("valIter").textContent=maxIter;' +
'document.getElementById("valSigma").textContent=sigma.toFixed(2);' +
'document.getElementById("valSpeed").textContent="x"+speed;' +
'document.getElementById("valSPT").textContent=stepsPerTemp}' +

// ── Advanced toggle ─────────────────────────────────────────────────
'function toggleAdvanced(){' +
'advOpen=!advOpen;' +
'document.getElementById("advSection").className=advOpen?"adv-section open":"adv-section";' +
'document.getElementById("advToggle").textContent=advOpen?T.advClose:T.advOpen;' +
'notifyHeight()}' +

// ── Cooling schedule selector ───────────────────────────────────────
'function onSchedule(el){' +
'coolSchedule=el.getAttribute("data-v");' +
'var btns=document.getElementById("segSchedule").children;' +
'for(var i=0;i<btns.length;i++){btns[i].className=btns[i]===el?"seg-btn sel":"seg-btn"}' +
// Update hint
'var hintEl=document.getElementById("hint-schedule");' +
'if(coolSchedule==="logarithmic"){hintEl.textContent=T.hintLog}' +
'else if(coolSchedule==="linear"){hintEl.textContent=T.hintLin}' +
'else{hintEl.textContent=T.hintGeo}' +
// Show/hide coolRate row based on schedule
'var coolRow=document.getElementById("row-cool");' +
'var coolHint=document.getElementById("hint-cool");' +
'if(coolSchedule==="linear"){coolRow.style.display="none";coolHint.style.display="none"}' +
'else{coolRow.style.display="flex";coolHint.style.display="block"}' +
// Reset simulation when schedule changes
'resetState()}' +

// ── Draw function plot ──────────────────────────────────────────────
'function drawFunc(){' +
'var dim=setupCanvas(cvFunc,200);var w=dim.w,h=dim.h;' +
'var ctx=ctxF;ctx.clearRect(0,0,w,h);' +
'var fn=curFunc.fn;var pad=20;var pw=w-pad*2;var ph=h-pad*2;' +
// compute y range
'var yMin=Infinity,yMax=-Infinity;var N=200;' +
'for(var i=0;i<=N;i++){var x=low+(high-low)*i/N;var y=fn(x);if(y<yMin)yMin=y;if(y>yMax)yMax=y}' +
'var yRange=yMax-yMin||1;yMin-=yRange*0.1;yMax+=yRange*0.1;yRange=yMax-yMin;' +
// helpers
'function toX(x){return pad+(x-low)/(high-low)*pw}' +
'function toY(y){return pad+(yMax-y)/yRange*ph}' +
// grid
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
// axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();' +
// y axis ticks
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'for(var t=0;t<=4;t++){var yv=yMin+yRange*t/4;var yp=toY(yv);' +
'ctx.fillText(yv.toFixed(1),pad-4,yp+3);' +
'ctx.strokeStyle=borderC;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(pad,yp);ctx.lineTo(w-pad,yp);ctx.stroke();ctx.setLineDash([])}' +
// x axis ticks
'ctx.textAlign="center";' +
'var xStep=Math.ceil((high-low)/6);if(xStep<1)xStep=1;' +
'for(var xv=Math.ceil(low);xv<=Math.floor(high);xv+=xStep){' +
'ctx.fillText(xv,toX(xv),h-pad+12)}' +
// draw function curve
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<=N;i++){var x=low+(high-low)*i/N;var y=fn(x);' +
'var px=toX(x),py=toY(y);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
// fill under curve
'ctx.lineTo(toX(high),toY(yMin));ctx.lineTo(toX(low),toY(yMin));ctx.closePath();' +
'ctx.fillStyle=tealC.replace(")",",0.07)").replace("rgb","rgba");' +
'if(tealC.charAt(0)==="#"){ctx.globalAlpha=0.07;ctx.fillStyle=tealC;ctx.fill();ctx.globalAlpha=1}' +
'else{ctx.fill()}' +
// trail dots (last 50 positions)
'if(histX.length>0){' +
'var start=Math.max(0,histX.length-50);' +
'for(var i=start;i<histX.length;i++){' +
'var alpha=0.1+(i-start)/(histX.length-start)*0.4;' +
'var wasAccepted=histAccepted[i];' +
'ctx.globalAlpha=alpha;ctx.fillStyle=wasAccepted?greenC:redC;' +
'ctx.beginPath();ctx.arc(toX(histX[i]),toY(fn(histX[i])),3,0,Math.PI*2);ctx.fill()}' +
'ctx.globalAlpha=1}' +
// best position marker (diamond)
'if(bestX!==undefined){' +
'var bx=toX(bestX),by=toY(fn(bestX));' +
'ctx.fillStyle=accentC;ctx.beginPath();' +
'ctx.moveTo(bx,by-7);ctx.lineTo(bx+5,by);ctx.lineTo(bx,by+7);ctx.lineTo(bx-5,by);ctx.closePath();ctx.fill();' +
'ctx.strokeStyle=accentC;ctx.lineWidth=1;ctx.setLineDash([2,2]);' +
'ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx,h-pad);ctx.stroke();ctx.setLineDash([])}' +
// current position — temperature-mapped fill color (#6)
'if(xCur!==undefined&&histX.length>0){' +
'var cx=toX(xCur),cy=toY(fn(xCur));' +
'var tRatio=T0>0?Math.min(1,temperature/T0):0;' +
'var markerFill=tRatio>0.5?accentC:tealC;' +
'ctx.fillStyle=markerFill;ctx.beginPath();ctx.arc(cx,cy,6,0,Math.PI*2);ctx.fill();' +
'ctx.strokeStyle=markerFill;ctx.lineWidth=2;ctx.beginPath();ctx.arc(cx,cy,10,0,Math.PI*2);ctx.stroke()}' +
// tap-to-set crosshair (before first run, user tapped) (#8)
'if(iteration===0&&userSetStart&&xCur!==undefined){' +
'var sx=toX(xCur),sy=toY(fn(xCur));' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;ctx.setLineDash([3,3]);' +
'ctx.beginPath();ctx.moveTo(sx,pad);ctx.lineTo(sx,h-pad);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(pad,sy);ctx.lineTo(w-pad,sy);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=tealC;ctx.font="10px monospace";ctx.textAlign="left";' +
'ctx.fillText("x\\u2080 = "+xCur.toFixed(3),sx+6,sy-6)}' +
// tap hint text (before first run, no user tap yet) (#8)
'if(iteration===0&&!userSetStart){' +
'ctx.fillStyle=textC;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.tapHint,w/2,h-pad-6)}' +
// legend
'ctx.font="10px -apple-system,sans-serif";' +
'ctx.fillStyle=tealC;ctx.beginPath();ctx.arc(w-90,pad+8,4,0,Math.PI*2);ctx.fill();' +
'ctx.fillStyle=textC;ctx.textAlign="left";ctx.fillText(T.cur,w-82,pad+12);' +
'ctx.fillStyle=accentC;ctx.beginPath();' +
'ctx.moveTo(w-40,pad+2);ctx.lineTo(w-36,pad+8);ctx.lineTo(w-40,pad+14);ctx.lineTo(w-44,pad+8);ctx.closePath();ctx.fill();' +
'ctx.fillStyle=textC;ctx.fillText(T.best,w-32,pad+12)' +
'}' +

// ── Tap to set initial position — canvas touch handlers (#8) ───────
'var _touchSX=0,_touchSY=0;' +
'cvFunc.addEventListener("touchstart",function(e){' +
'if(iteration!==0)return;' +
'var t=e.touches[0];_touchSX=t.clientX;_touchSY=t.clientY},false);' +
'cvFunc.addEventListener("touchend",function(e){' +
'if(iteration!==0)return;' +
'var t=e.changedTouches[0];' +
'var dx=t.clientX-_touchSX;var dy=t.clientY-_touchSY;' +
'if(Math.sqrt(dx*dx+dy*dy)>10)return;' + // scroll, not tap
// Convert touch x to domain x
'var rect=cvFunc.getBoundingClientRect();' +
'var relX=t.clientX-rect.left;' +
'var cssW=rect.width;' +
'var pad=20;var pw=cssW-pad*2;' +
'var frac=(relX-pad)/pw;' +
'if(frac<0||frac>1)return;' +
'var domainX=low+(high-low)*frac;' +
'xCur=domainX;bestX=domainX;' +
'userSetStart=true;' +
'drawFunc();updateStats();notifyHeight()},false);' +

// ── Draw convergence plot ───────────────────────────────────────────
'function drawConv(){' +
'var dim=setupCanvas(cvConv,160);var w=dim.w,h=dim.h;' +
'var ctx=ctxC;ctx.clearRect(0,0,w,h);' +
'if(histBestE.length<2){ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--text3").trim();' +
'ctx.font="12px -apple-system,sans-serif";ctx.textAlign="center";ctx.fillText(T.waiting,w/2,h/2);return}' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var pad=30;var pr=30;var pw=w-pad-pr;var ph=h-pad-20;' +
// energy range
'var eMin=Infinity,eMax=-Infinity;' +
'for(var i=0;i<histBestE.length;i++){if(histBestE[i]<eMin)eMin=histBestE[i];if(histBestE[i]>eMax)eMax=histBestE[i]}' +
'var eRange=eMax-eMin||1;eMin-=eRange*0.05;eMax+=eRange*0.05;eRange=eMax-eMin;' +
// temp range
'var tMax=histTemp[0]||1;var tMin=histTemp[histTemp.length-1]||0;' +
'var tRange=tMax-tMin||1;' +
// draw energy line (teal)
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<histBestE.length;i++){' +
'var px=pad+i/(histBestE.length-1)*pw;' +
'var py=20+(eMax-histBestE[i])/eRange*ph;' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
// draw temp line (accent/orange)
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();' +
'for(var i=0;i<histTemp.length;i++){' +
'var px=pad+i/(histTemp.length-1)*pw;' +
'var py=20+(tMax-histTemp[i])/tRange*ph;' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();ctx.setLineDash([]);' +
// left Y axis labels (energy)
'ctx.fillStyle=tealC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(eMax.toFixed(1),pad-4,24);ctx.fillText(eMin.toFixed(1),pad-4,ph+22);' +
// right Y axis labels (temp)
'ctx.fillStyle=accentC;ctx.textAlign="left";' +
'ctx.fillText(tMax.toFixed(0),w-pr+4,24);ctx.fillText(tMin.toFixed(2),w-pr+4,ph+22);' +
// x axis
'ctx.fillStyle=textC;ctx.textAlign="center";' +
'ctx.fillText("0",pad,h-6);ctx.fillText(histBestE.length-1+"",w-pr,h-6);' +
// axis lines
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,18);ctx.lineTo(pad,ph+24);ctx.lineTo(w-pr,ph+24);ctx.stroke();' +
// legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.setLineDash([]);ctx.beginPath();ctx.moveTo(pad+8,h-8);ctx.lineTo(pad+22,h-8);ctx.stroke();' +
'ctx.fillStyle=textC;ctx.fillText("Energy",pad+26,h-4);' +
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();ctx.moveTo(pad+80,h-8);ctx.lineTo(pad+94,h-8);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillText("Temp",pad+98,h-4)' +
'}' +

// ── Update stats ────────────────────────────────────────────────────
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(histX.length===0){box.innerHTML=T.waiting;return}' +
'var rate=total>0?((accepted/total)*100).toFixed(1):"0.0";' +
'var s="<span class=\\"hi\\">"+T.cur+"</span>  x = "+xCur.toFixed(4)+"  f(x) = "+curFunc.fn(xCur).toFixed(4)+"<br>";' +
's+="<span class=\\"warn\\">"+T.best+"</span>  x = "+bestX.toFixed(4)+"  f(x) = "+curFunc.fn(bestX).toFixed(4)+"<br>";' +
's+=T.temp+": "+temperature.toFixed(4)+"  |  "+T.iterN+": <span class=\\"hi\\">"+iteration+"</span>/"+maxIter+"<br>";' +
's+=T.accept+": "+rate+"%";' +
// Completion verdict (#5) — runtime min computation (adapts to current bounds)
'if(done){' +
'var bestF=curFunc.fn(bestX);var gMin=findGlobalMin(curFunc.fn,low,high);var eps=0.5;' +
'if(Math.abs(bestF-gMin)<eps){' +
's+="<br><span class=\\"verdict-ok\\">"+T.verdictOk+"</span>"}' +
'else{' +
's+="<br><span class=\\"verdict-stuck\\">"+T.verdictStuck+"</span>"}}' +
// Acceptance probability display (#1) — only when paused or step mode (not animating)
'if(hasLastStep&&!animating){' +
's+="<div class=\\"prob-box\\">";' +
's+="dE: "+(lastDE>=0?"+":"")+lastDE.toFixed(3)+"    P: "+lastP.toFixed(3)+"<br>";' +
's+="rand: "+lastRand.toFixed(3)+"   \\u2192 ";' +
'if(lastAccepted){s+="<span class=\\"hi\\">"+T.probAccepted+"</span>"}' +
'else{s+="<span class=\\"warn\\">"+T.probRejected+"</span>"}' +
's+="</div>"}' +
'box.innerHTML=s}' +

// ── SA step ─────────────────────────────────────────────────────────
'function saStep(){' +
'if(iteration>=maxIter){done=true;return}' +
// Boundary reflection (#9)
'var xNew=xCur+randn()*sigma;' +
'if(xNew<low)xNew=low+(low-xNew);' +
'if(xNew>high)xNew=high-(xNew-high);' +
'xNew=Math.max(low,Math.min(high,xNew));' + // safety clamp for double-bounce
'var eCur=curFunc.fn(xCur);var eNew=curFunc.fn(xNew);' +
'var dE=eNew-eCur;' +
'total++;' +
'var didAccept=false;' +
'var prob=dE<0?1:Math.exp(-dE/Math.max(temperature,1e-10));' +
'var randVal=Math.random();' +
'if(dE<0||prob>randVal){' +
'xCur=xNew;accepted++;didAccept=true;' +
'if(curFunc.fn(xCur)<curFunc.fn(bestX)){bestX=xCur}}' +
// Store last step details for acceptance probability display (#1)
'lastDE=dE;lastP=prob;lastRand=randVal;lastAccepted=didAccept;hasLastStep=true;' +
'histX.push(xCur);histBestE.push(curFunc.fn(bestX));histTemp.push(temperature);histAccepted.push(didAccept);' +
// Cooling with steps-per-temperature (#3) and schedule (#2)
'tempStepCount++;' +
'if(tempStepCount>=stepsPerTemp){' +
'tempStepCount=0;' +
'if(coolSchedule==="logarithmic"){temperature=T0/(1+Math.log(1+iteration))}' +
'else if(coolSchedule==="linear"){temperature=T0*Math.max(0,1-iteration/maxIter)}' +
'else{temperature*=coolRate}}' + // geometric (default)
'iteration++}' +

// ── Reset state ─────────────────────────────────────────────────────
'function resetState(){' +
'readParams();temperature=T0;iteration=0;accepted=0;total=0;' +
'histX=[];histBestE=[];histTemp=[];histAccepted=[];' +
'tempStepCount=0;hasLastStep=false;userSetStart=false;' +
'xCur=low+Math.random()*(high-low);bestX=xCur;' +
'done=false;animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'drawFunc();drawConv();updateStats();notifyHeight()}' +

// ── Animation loop ──────────────────────────────────────────────────
'function animate(){' +
'if(!animating){return}' +
'for(var s=0;s<speed&&!done;s++){saStep()}' +
'drawFunc();drawConv();updateStats();' +
'if(done){animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'notifyHeight();return}' +
'requestAnimationFrame(animate)}' +

// ── Event handlers ──────────────────────────────────────────────────
'function onFuncChange(){' +
'curFunc=FUNCS[+document.getElementById("funcSelect").value];' +
'document.getElementById("inLow").value=curFunc.defBounds[0];' +
'document.getElementById("inHigh").value=curFunc.defBounds[1];' +
'resetState()}' +

'function onParam(){readParams();if(!animating&&iteration===0){drawFunc()}}' +

'function onRun(){' +
'if(animating){animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
// Show acceptance probability when pausing (#1)
'updateStats();return}' +
'if(done)resetState();' +
'readParams();if(iteration===0){temperature=T0;' +
'if(!userSetStart){xCur=low+Math.random()*(high-low)}' +
'bestX=xCur;' +
'histX=[];histBestE=[];histTemp=[];histAccepted=[];accepted=0;total=0;tempStepCount=0}' +
'animating=true;' +
'document.getElementById("btnRun").textContent=T.pause;' +
'document.getElementById("btnRun").className="btn btn-stop";' +
'animate()}' +

'function onStep(){' +
'if(animating){animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary"}' +
'if(done)return;' +
'readParams();if(iteration===0){temperature=T0;' +
'if(!userSetStart){xCur=low+Math.random()*(high-low)}' +
'bestX=xCur;' +
'histX=[];histBestE=[];histTemp=[];histAccepted=[];accepted=0;total=0;tempStepCount=0}' +
'saStep();drawFunc();drawConv();updateStats();notifyHeight()}' +

'function onReset(){animating=false;resetState()}' +

// ── Height notification ─────────────────────────────────────────────
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init ────────────────────────────────────────────────────────────
'readParams();resetState();' +
'window.addEventListener("resize",function(){drawFunc();drawConv();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
