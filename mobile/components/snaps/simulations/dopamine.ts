/**
 * Dopamine & TD Learning — Reward Prediction Error interactive simulation
 *
 * Features:
 * - Timeline visualization showing cue (light) -> reward (juice) paradigm
 * - TD learning: V(t) updated via delta = r(t) + gamma*V(t+1) - V(t)
 * - Dopamine response bars at each timestep (green=positive RPE, red=negative RPE)
 * - V(t) value curve overlaid
 * - Trials shift dopamine from reward to cue over learning
 * - Omit Reward: negative RPE at expected reward time
 * - Surprise Reward: positive RPE without cue
 * - Learning rate slider, trial counter, V estimates
 * - Dark/light theme, Korean/English bilingual
 */

export function getDopamineSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn-stop{background:var(--accent);border-color:var(--accent);color:var(--bg)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:10px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;min-height:44px;border-radius:8px;min-width:0;overflow:hidden}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'</style></head><body>' +

// ── Dopamine Response Canvas ──
'<div class="panel"><div class="label" id="lbl-dopa"></div>' +
'<canvas id="cvDopa" height="200"></canvas></div>' +

// ── V(t) Value Curve Canvas ──
'<div class="panel"><div class="label" id="lbl-val"></div>' +
'<canvas id="cvVal" height="120"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="label" id="lbl-presets" style="margin-top:4px"></div>' +
'<div class="preset-row">' +
'<div class="preset" id="pre1" onclick="runPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="runPreset(2)"></div>' +
'<div class="preset" id="pre3" onclick="runPreset(3)"></div>' +
'</div>' +
'<div class="row"><span class="ctrl-name" id="lblAlpha"></span>' +
'<input type="range" id="slAlpha" min="10" max="50" value="20" oninput="onParam()">' +
'<span class="ctrl-val" id="valAlpha"></span></div>' +
'<div style="display:flex;justify-content:space-between;margin:-6px 0 10px;padding:0 52px 0 48px;font-size:10px;color:var(--text3)">' +
'<span id="lbl-aL"></span><span id="lbl-aR"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lblGamma"></span>' +
'<input type="range" id="slGamma" min="50" max="99" value="95" oninput="onParam()">' +
'<span class="ctrl-val" id="valGamma"></span></div>' +
'<div style="display:flex;justify-content:space-between;margin:-6px 0 10px;padding:0 52px 0 48px;font-size:10px;color:var(--text3)">' +
'<span id="lbl-gL"></span><span id="lbl-gR"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnTrial" onclick="runTrial()"></div>' +
'<div class="btn" id="btnOmit" onclick="runOmit()"></div>' +
'<div class="btn" id="btnSurprise" onclick="runSurprise()"></div>' +
'</div>' +
'<div class="btn-row" style="margin-top:6px">' +
'<div class="btn btn-stop" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{dopa:"\\uB3C4\\uD30C\\uBBFC \\uBC18\\uC751 (\\uBCF4\\uC0C1 \\uC608\\uCE21 \\uC624\\uCC28)",' +
'val:"\\uAC00\\uCE58 \\uD568\\uC218 V(t)",ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'alpha:"\\uD559\\uC2B5\\uB960(\\u03B1)",trial:"\\uC2DC\\uD589 (\\uBE5B\\u2192\\uBCF4\\uC0C1)",' +
'omit:"\\uBCF4\\uC0C1 \\uC0DD\\uB7B5",surprise:"\\uC608\\uC0C1 \\uBC16 \\uBCF4\\uC0C1",reset:"\\u21BA \\uB9AC\\uC14B",' +
'trialN:"\\uC2DC\\uD589 \\uD69F\\uC218",phase:"\\uB2E8\\uACC4",cue:"\\uBE5B(\\uB2E8\\uC11C)",' +
'reward:"\\uBCF4\\uC0C1(\\uC8FC\\uC2A4)",rpe:"\\uBCF4\\uC0C1 \\uC608\\uCE21 \\uC624\\uCC28",' +
'vAt:"V(t) \\uAC12",time:"\\uC2DC\\uAC04",' +
'before:"\\uD559\\uC2B5 \\uC804",during:"\\uD559\\uC2B5 \\uC911",after:"\\uD559\\uC2B5 \\uC644\\uB8CC",' +
'omitted:"\\uBCF4\\uC0C1 \\uC0DD\\uB7B5\\uB428",surprised:"\\uC608\\uC0C1\\uBC16 \\uBCF4\\uC0C1",' +
'posRPE:"+RPE (\\uC608\\uC0C1\\uBCF4\\uB2E4 \\uC88B\\uC74C)",negRPE:"-RPE (\\uC608\\uC0C1\\uBCF4\\uB2E4 \\uB098\\uC068)",' +
'noRPE:"RPE=0 (\\uC608\\uC0C1\\uB300\\uB85C)",lastEvent:"\\uB9C8\\uC9C0\\uB9C9 \\uC774\\uBCA4\\uD2B8",' +
'presets:"\\uC2DC\\uB098\\uB9AC\\uC624",gamma:"\\uD560\\uC778\\uC728(\\u03B3)",' +
'pre1:"\\uD328\\uD134 1: \\uCCAB \\uBCF4\\uC0C1",pre2:"\\uD328\\uD134 2: \\uD559\\uC2B5 \\uC644\\uB8CC",pre3:"\\uD328\\uD134 3: \\uBCF4\\uC0C1 \\uC0DD\\uB7B5",' +
'alphaL:"\\uB290\\uB9BC",alphaR:"\\uBE60\\uB984",gammaL:"\\uADFC\\uC2DC\\uC548",gammaR:"\\uC7A5\\uAE30",' +
'ghostLabel:"\\u2591 \\uCCAB \\uC2DC\\uD589 RPE"},' +
'en:{dopa:"DOPAMINE RESPONSE (RPE)",val:"VALUE FUNCTION V(t)",ctrl:"PARAMETERS",stats:"STATISTICS",' +
'alpha:"Rate(\\u03B1)",trial:"Trial (Cue\\u2192Reward)",' +
'omit:"Omit Reward",surprise:"Surprise Reward",reset:"\\u21BA Reset",' +
'trialN:"Trials",phase:"Phase",cue:"Cue (Light)",' +
'reward:"Reward (Juice)",rpe:"Reward Prediction Error",' +
'vAt:"V(t) values",time:"Time",' +
'before:"Before Learning",during:"Learning",after:"Learned",' +
'omitted:"Reward Omitted",surprised:"Surprise Reward",' +
'posRPE:"+RPE (better than expected)",negRPE:"-RPE (worse than expected)",' +
'noRPE:"RPE=0 (as expected)",lastEvent:"Last Event",' +
'presets:"SCENARIOS",gamma:"Discount(\\u03B3)",' +
'pre1:"Pattern 1: First",pre2:"Pattern 2: Learned",pre3:"Pattern 3: Omit",' +
'alphaL:"Slow",alphaR:"Fast",gammaL:"Short",gammaR:"Long",' +
'ghostLabel:"\\u2591 Trial 1 RPE"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── TD Learning State ──
'var STEPS=8;' + // timesteps: 0=pre, 1=cue, 2..6=gap, 7=reward
'var gamma=0.95,alpha=0.2;var activePreset=0;' +
'var V=[];' + // value estimates at each timestep
'var dopamine=[];' + // RPE at each timestep (last trial)
'var trialCount=0;' +
'var lastEvent="";' +
'var dopaHistory=[];' + // array of dopamine arrays for history

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Init ──
'function initTD(){' +
'V=[];dopamine=[];' +
'for(var t=0;t<STEPS;t++){V.push(0);dopamine.push(0)}' +
'trialCount=0;lastEvent="";dopaHistory=[]}' +

// ── Run standard trial: cue at t=1, reward at t=7 ──
'function runTrial(){' +
'var r=[];for(var t=0;t<STEPS;t++)r.push(0);' +
'r[7]=1;' + // reward at last step
// compute TD errors and update V
'dopamine=[];' +
'for(var t=0;t<STEPS;t++){' +
'var nextV=(t<STEPS-1)?V[t+1]:0;' +
'var delta=r[t]+gamma*nextV-V[t];' +
'dopamine.push(delta);' +
'V[t]+=alpha*delta}' +
'trialCount++;lastEvent=T.trial;' +
'dopaHistory.push(dopamine.slice());' +
'drawAll();notifyHeight()}' +

// ── Omit reward: cue at t=1, NO reward at t=7 ──
'function runOmit(){' +
'var r=[];for(var t=0;t<STEPS;t++)r.push(0);' +
// no reward
'dopamine=[];' +
'for(var t=0;t<STEPS;t++){' +
'var nextV=(t<STEPS-1)?V[t+1]:0;' +
'var delta=r[t]+gamma*nextV-V[t];' +
'dopamine.push(delta);' +
'V[t]+=alpha*delta}' +
'trialCount++;lastEvent=T.omitted;' +
'dopaHistory.push(dopamine.slice());' +
'drawAll();notifyHeight()}' +

// ── Surprise reward: reward at t=7 without cue context ──
'function runSurprise(){' +
'var r=[];for(var t=0;t<STEPS;t++)r.push(0);' +
'r[7]=1;' + // reward, but V will be based on no-cue values
// use a modified V where cue step gets no credit
'dopamine=[];' +
'var tmpV=V.slice();' +
'for(var t=0;t<STEPS;t++){' +
'var nextV=(t<STEPS-1)?tmpV[t+1]:0;' +
'var delta=r[t]+gamma*nextV-tmpV[t];' +
'dopamine.push(delta)}' +
// only update reward timestep area (surprise doesn\'t teach cue association well)
'V[STEPS-1]+=alpha*dopamine[STEPS-1];' +
'if(STEPS>1)V[STEPS-2]+=alpha*dopamine[STEPS-2]*0.3;' +
'trialCount++;lastEvent=T.surprised;' +
'dopaHistory.push(dopamine.slice());' +
'drawAll();notifyHeight()}' +

// ── Draw dopamine bars ──
'function drawDopa(){' +
'var cv=document.getElementById("cvDopa");' +
'var dim=setupCanvas(cv,200);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var text2C=cs.getPropertyValue("--text2").trim();' +
'var pad=36,pr=14,pt=24,pb=36;' +
'var pw=w-pad-pr,ph=h-pt-pb;' +
'var midY=pt+ph/2;' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
// zero line
'ctx.setLineDash([3,3]);ctx.beginPath();ctx.moveTo(pad,midY);ctx.lineTo(w-pr,midY);ctx.stroke();ctx.setLineDash([]);' +
// labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("+",pad-6,pt+8);ctx.fillText("0",pad-6,midY+3);ctx.fillText("-",pad-6,h-pb-4);' +
// timestep labels
'ctx.textAlign="center";ctx.font="9px -apple-system,sans-serif";' +
'var barW=pw/STEPS;' +
'for(var t=0;t<STEPS;t++){' +
'var x=pad+t*barW+barW/2;' +
'var label="t="+t;' +
'if(t===1)label=T.cue;' +
'if(t===STEPS-1)label=T.reward;' +
'ctx.fillStyle=textC;ctx.fillText(label,x,h-pb+14)}' +
// draw bars
'var maxAbs=0.2;' +
'for(var t=0;t<STEPS;t++){var av=Math.abs(dopamine[t]||0);if(av>maxAbs)maxAbs=av}' +
// include ghost (first trial) in scale
'if(dopaHistory.length>5&&dopaHistory[0]){for(var gt=0;gt<STEPS;gt++){var gv=Math.abs(dopaHistory[0][gt]||0);if(gv>maxAbs)maxAbs=gv}}' +
'maxAbs=Math.max(maxAbs,0.2)*1.2;' +
// ghost overlay: faded first-trial RPE bars for comparison
'if(dopaHistory.length>5&&dopaHistory[0]){' +
'ctx.globalAlpha=0.15;' +
'for(var gt=0;gt<STEPS;gt++){' +
'var gd=dopaHistory[0][gt]||0;' +
'var gh=Math.abs(gd)/maxAbs*(ph/2);' +
'var gx=pad+gt*barW+barW*0.15;' +
'var gbw=barW*0.7;' +
'if(gd>0){ctx.fillStyle=greenC;ctx.fillRect(gx,midY-gh,gbw,gh)}' +
'else if(gd<0){ctx.fillStyle=redC;ctx.fillRect(gx,midY,gbw,gh)}}' +
'ctx.globalAlpha=1}' +
// current bars
'for(var t=0;t<STEPS;t++){' +
'var d=dopamine[t]||0;' +
'var barH=Math.abs(d)/maxAbs*(ph/2);' +
'var x=pad+t*barW+barW*0.15;' +
'var bw=barW*0.7;' +
'if(d>0){ctx.fillStyle=greenC;ctx.fillRect(x,midY-barH,bw,barH)}' +
'else if(d<0){ctx.fillStyle=redC;ctx.fillRect(x,midY,bw,barH)}' +
// value label on bar
'if(Math.abs(d)>0.01){' +
'ctx.fillStyle=text2C;ctx.font="9px monospace";ctx.textAlign="center";' +
'var ly=d>0?midY-barH-6:midY+barH+10;' +
'ctx.fillText((d>0?"+":"")+d.toFixed(2),x+bw/2,ly)}}' +
// icons: cue (circle) at t=1, reward (square) at t=7
'ctx.font="14px -apple-system,sans-serif";ctx.textAlign="center";' +
// cue marker
'var cueX=pad+1*barW+barW/2;' +
'ctx.fillStyle=accentC;ctx.fillText("\\u2600",cueX,pt+10);' +
// reward marker
'var rewX=pad+(STEPS-1)*barW+barW/2;' +
'ctx.fillStyle=tealC;ctx.fillText("\\u25CF",rewX,pt+10);' +
// phase indicator
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";ctx.fillStyle=text2C;' +
'var phase=trialCount===0?T.before:trialCount<8?T.during:T.after;' +
'ctx.fillText(T.phase+": "+phase,pad,pt-6);' +
// trial counter
'ctx.textAlign="right";ctx.fillText(T.trialN+": "+trialCount,w-pr,pt-6);' +
// RPE legend
'ctx.font="9px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.fillStyle=greenC;ctx.fillRect(pad,h-pb+22,10,8);ctx.fillStyle=textC;ctx.fillText("+RPE",pad+14,h-pb+30);' +
'ctx.fillStyle=redC;ctx.fillRect(pad+60,h-pb+22,10,8);ctx.fillStyle=textC;ctx.fillText("-RPE",pad+74,h-pb+30);' +
'if(dopaHistory.length>5){ctx.fillStyle=textC;ctx.globalAlpha=0.4;ctx.fillText(T.ghostLabel,pad+120,h-pb+30);ctx.globalAlpha=1}}' +

// ── Draw V(t) curve ──
'function drawVal(){' +
'var cv=document.getElementById("cvVal");' +
'var dim=setupCanvas(cv,120);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var pad=36,pr=14,pt=14,pb=22;' +
'var pw=w-pad-pr,ph=h-pt-pb;' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
// find max V
'var maxV=0.1;for(var t=0;t<STEPS;t++){if(V[t]>maxV)maxV=V[t]}' +
'maxV=Math.ceil(maxV*10)/10;if(maxV<0.1)maxV=0.1;' +
// y labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(maxV.toFixed(1),pad-4,pt+6);ctx.fillText("0",pad-4,h-pb+4);' +
// x labels
'ctx.textAlign="center";' +
'for(var t=0;t<STEPS;t++){' +
'var x=pad+t/(STEPS-1)*pw;ctx.fillText("t="+t,x,h-pb+14)}' +
// V curve
'ctx.strokeStyle=tealC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var t=0;t<STEPS;t++){' +
'var x=pad+t/(STEPS-1)*pw;' +
'var y=pt+(maxV-V[t])/maxV*ph;' +
'if(t===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +
// dots
'for(var t=0;t<STEPS;t++){' +
'var x=pad+t/(STEPS-1)*pw;' +
'var y=pt+(maxV-V[t])/maxV*ph;' +
'ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle=tealC;ctx.fill();' +
// value label
'if(V[t]>0.01){ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText(V[t].toFixed(2),x,y-8)}}' +
// area fill
'ctx.fillStyle=tealC;ctx.globalAlpha=0.08;ctx.beginPath();' +
'ctx.moveTo(pad,h-pb);' +
'for(var t=0;t<STEPS;t++){var x=pad+t/(STEPS-1)*pw;var y=pt+(maxV-V[t])/maxV*ph;ctx.lineTo(x,y)}' +
'ctx.lineTo(pad+(STEPS-1)/(STEPS-1)*pw,h-pb);ctx.closePath();ctx.fill();ctx.globalAlpha=1}' +

// ── Draw all ──
'function drawAll(){drawDopa();drawVal();updateStats()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(trialCount===0){box.innerHTML="<span style=\\"color:var(--text3)\\">"+T.trial+"</span>";return}' +
'var s="<span class=\\"hi\\">"+T.trialN+"</span> "+trialCount+"<br>";' +
// phase
'var phase=trialCount===0?T.before:trialCount<8?T.during:T.after;' +
's+="<span class=\\"hi\\">"+T.phase+"</span> "+phase+"<br>";' +
// last event
's+=T.lastEvent+": <span class=\\"warn\\">"+lastEvent+"</span><br>";' +
// V values summary
's+=T.vAt+": ";' +
'for(var t=0;t<STEPS;t++){s+=V[t].toFixed(2);if(t<STEPS-1)s+=", "}' +
's+="<br>";' +
// RPE interpretation
'var cueRPE=dopamine[1]||0;var rewRPE=dopamine[STEPS-1]||0;' +
'if(cueRPE>0.05)s+="<span class=\\"hi\\">"+T.cue+": "+T.posRPE+"</span><br>";' +
'if(rewRPE>0.05)s+=T.reward+": "+T.posRPE+"<br>";' +
'else if(rewRPE<-0.05)s+="<span class=\\"warn\\">"+T.reward+": "+T.negRPE+"</span><br>";' +
'else if(trialCount>3)s+=T.reward+": "+T.noRPE+"<br>";' +
'box.innerHTML=s}' +

// ── Param change ──
'function onParam(){' +
'alpha=+document.getElementById("slAlpha").value/100;' +
'gamma=+document.getElementById("slGamma").value/100;' +
'document.getElementById("valAlpha").textContent=alpha.toFixed(2);' +
'document.getElementById("valGamma").textContent=gamma.toFixed(2);' +
'clearActivePreset();notifyHeight()}' +

// ── Reset ──
'function onReset(){initTD();activePreset=0;clearActivePreset();drawAll();notifyHeight()}' +

// ── Preset helpers ──
'function clearActivePreset(){' +
'var ps=document.querySelectorAll(".preset");' +
'for(var i=0;i<ps.length;i++)ps[i].classList.remove("active")}' +

'function setActivePreset(n){' +
'clearActivePreset();activePreset=n;' +
'var el=document.getElementById("pre"+n);if(el)el.classList.add("active")}' +

// ── Preset scenarios (Schultz's 3 patterns) ──
'function runPreset(n){' +
'initTD();' +
'if(n===1){' + // Pattern 1: First Reward — 1 trial from blank state
'runTrial();setActivePreset(1)}' +
'else if(n===2){' + // Pattern 2: Learned — 15 silent trials, show final
'for(var i=0;i<15;i++){' +
'var r=[];for(var t=0;t<STEPS;t++)r.push(0);r[7]=1;' +
'dopamine=[];' +
'for(var t=0;t<STEPS;t++){var nV=(t<STEPS-1)?V[t+1]:0;var d=r[t]+gamma*nV-V[t];dopamine.push(d);V[t]+=alpha*d}' +
'trialCount++;dopaHistory.push(dopamine.slice())}' +
'lastEvent=T.after;drawAll();setActivePreset(2);notifyHeight()}' +
'else if(n===3){' + // Pattern 3: Learn 15 trials then omit
'for(var i=0;i<15;i++){' +
'var r=[];for(var t=0;t<STEPS;t++)r.push(0);r[7]=1;' +
'dopamine=[];' +
'for(var t=0;t<STEPS;t++){var nV=(t<STEPS-1)?V[t+1]:0;var d=r[t]+gamma*nV-V[t];dopamine.push(d);V[t]+=alpha*d}' +
'trialCount++;dopaHistory.push(dopamine.slice())}' +
'runOmit();setActivePreset(3)}}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-dopa").textContent=T.dopa;' +
'document.getElementById("lbl-val").textContent=T.val;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lblAlpha").textContent=T.alpha;' +
'document.getElementById("lblGamma").textContent=T.gamma;' +
'document.getElementById("btnTrial").textContent=T.trial;' +
'document.getElementById("btnOmit").textContent=T.omit;' +
'document.getElementById("btnSurprise").textContent=T.surprise;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lbl-presets").textContent=T.presets;' +
'document.getElementById("pre1").textContent=T.pre1;' +
'document.getElementById("pre2").textContent=T.pre2;' +
'document.getElementById("pre3").textContent=T.pre3;' +
'document.getElementById("lbl-aL").textContent=T.alphaL;' +
'document.getElementById("lbl-aR").textContent=T.alphaR;' +
'document.getElementById("lbl-gL").textContent=T.gammaL;' +
'document.getElementById("lbl-gR").textContent=T.gammaR;' +

// ── Init ──
'onParam();initTD();drawAll();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
