/**
 * KL Divergence interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Two overlapping Gaussian distribution curves (P and Q)
 * - Difference region shading (red)
 * - KL(P||Q) and KL(Q||P) prominently displayed (asymmetry!)
 * - Jensen-Shannon divergence (symmetric)
 * - Adjustable mu/sigma for both P and Q
 * - Swap P<->Q button, presets (Same, Shifted, Wide vs Narrow)
 * - Discrete mode (4-bar distribution) with draggable bar heights
 * - Dark/light theme, Korean/English bilingual
 */

export function getKLSimulationHTML(isDark: boolean, lang: string): string {
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
'.ctrl-val-q{font-size:12px;font-family:monospace;color:var(--accent);min-width:44px;text-align:right;flex-shrink:0;white-space:nowrap}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'input.slider-q{accent-color:var(--accent)}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.preset-row{display:flex;gap:6px;margin-bottom:10px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;min-height:44px;border-radius:8px;min-width:0;overflow:hidden}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .red{color:var(--red);font-weight:700}' +
'.kl-display{display:flex;gap:12px;margin-bottom:8px}' +
'.kl-box{flex:1;border:2px solid var(--border);padding:10px 8px;text-align:center;border-radius:8px;overflow:hidden}' +
'.kl-label{font-size:10px;font-weight:700;color:var(--text3);letter-spacing:0.5px;margin-bottom:4px}' +
'.kl-value{font-size:18px;font-weight:800;font-family:monospace}' +
'.kl-value.teal{color:var(--teal)}' +
'.kl-value.accent{color:var(--accent)}' +
'.kl-value.green{color:var(--green)}' +
'.legend-row{display:flex;gap:12px;margin-top:6px;flex-wrap:wrap}' +
'.legend-item{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text2)}' +
'.legend-dot{width:8px;height:8px;flex-shrink:0}' +
'.section-label{font-size:11px;font-weight:700;color:var(--text3);margin-bottom:4px;margin-top:8px}' +
'</style></head><body>' +

// -- Distribution Canvas Panel --
'<div class="panel"><div class="label" id="lbl-dist"></div>' +
'<canvas id="cvDist" height="220"></canvas>' +
'<div class="legend-row">' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--teal)"></div><span id="leg-p"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--accent)"></div><span id="leg-q"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--red);opacity:0.3"></div><span id="leg-diff"></span></div>' +
'</div></div>' +

// -- KL Display Panel --
'<div class="panel">' +
'<div class="kl-display">' +
'<div class="kl-box"><div class="kl-label">KL(P\\u2016Q)</div><div class="kl-value teal" id="klPQ">0.000</div></div>' +
'<div class="kl-box"><div class="kl-label">KL(Q\\u2016P)</div><div class="kl-value accent" id="klQP">0.000</div></div>' +
'<div class="kl-box"><div class="kl-label" id="lbl-js">JS Div.</div><div class="kl-value green" id="jsDiv">0.000</div></div>' +
'</div>' +
'<div class="stats" id="asymNote"></div>' +
'</div>' +

// -- Controls Panel --
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
// Mode toggle
'<div class="btn-row" style="margin-bottom:10px">' +
'<div class="btn btn-primary" id="btnGauss" onclick="setMode(0)"></div>' +
'<div class="btn" id="btnDisc" onclick="setMode(1)"></div>' +
'</div>' +
// AI Lens toggle
'<div class="btn-row" style="margin-bottom:10px">' +
'<div class="btn" id="btnAILens" onclick="toggleAILens()"></div>' +
'</div>' +
// Presets
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'</div>' +
// Discrete hint
'<div id="discHintBox" style="display:none;font-size:11px;color:var(--text3);text-align:center;padding:8px 0"></div>' +
// P sliders
'<div class="section-label" id="sl-p"></div>' +
'<div class="row"><span class="ctrl-name">' + '\u03BC' + '<sub>P</sub></span>' +
'<input type="range" id="slMuP" min="-30" max="30" value="0" oninput="onSlider()">' +
'<span class="ctrl-val" id="valMuP"></span></div>' +
'<div class="row"><span class="ctrl-name">' + '\u03C3' + '<sub>P</sub></span>' +
'<input type="range" id="slSigP" min="3" max="30" value="10" oninput="onSlider()">' +
'<span class="ctrl-val" id="valSigP"></span></div>' +
// Q sliders
'<div class="section-label" id="sl-q"></div>' +
'<div class="row"><span class="ctrl-name">' + '\u03BC' + '<sub>Q</sub></span>' +
'<input type="range" id="slMuQ" min="-30" max="30" value="10" oninput="onSlider()" class="slider-q">' +
'<span class="ctrl-val-q" id="valMuQ"></span></div>' +
'<div class="row"><span class="ctrl-name">' + '\u03C3' + '<sub>Q</sub></span>' +
'<input type="range" id="slSigQ" min="3" max="30" value="10" oninput="onSlider()" class="slider-q">' +
'<span class="ctrl-val-q" id="valSigQ"></span></div>' +
// Swap button
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnSwap" onclick="doSwap()"></div>' +
'</div>' +
'</div>' +

// -- AI Lens Stats Annotation --
'<div class="panel" id="panelAIAnnotation" style="display:none"><div class="stats" id="aiAnnotationBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// -- Labels --
'var L={' +
'ko:{dist:"\\uBD84\\uD3EC",ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",distP:"\\uBD84\\uD3EC P",distQ:"\\uBD84\\uD3EC Q",' +
'diff:"\\uCC28\\uC774 \\uC601\\uC5ED",asym:"\\uBE44\\uB300\\uCE6D",jsLbl:"JS \\uBC1C\\uC0B0",' +
'muP:"\\uD3C9\\uADE0",sigP:"\\uD45C\\uC900\\uD3B8\\uCC28",muQ:"\\uD3C9\\uADE0",sigQ:"\\uD45C\\uC900\\uD3B8\\uCC28",' +
'swap:"P \\u2194 Q \\uAD50\\uD658",gauss:"\\uAC00\\uC6B0\\uC2DC\\uC548 \\uBAA8\\uB4DC",disc:"\\uC774\\uC0B0 \\uBAA8\\uB4DC",' +
'same:"\\uB3D9\\uC77C",shifted:"\\uD3B8\\uC774",wideNarrow:"\\uB113\\uC74C vs \\uC88C\\uC74C",' +
'slP:"\\uBD84\\uD3EC P \\uD30C\\uB77C\\uBBF8\\uD130",slQ:"\\uBD84\\uD3EC Q \\uD30C\\uB77C\\uBBF8\\uD130",' +
'asymNote:"KL(P\\u2016Q) \\u2260 KL(Q\\u2016P) \\u2014 KL \\uBC1C\\uC0B0\\uC740 \\uBE44\\uB300\\uCE6D\\uC785\\uB2C8\\uB2E4!",' +
'sameNote:"P = Q \\u2192 KL = 0",' +
'discHint:"\\uB9C9\\uB300 \\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uBD84\\uD3EC \\uC870\\uC815",' +
'aiLensOn:"AI Lens ON",aiLensOff:"AI Lens OFF",' +
'distPAI:"\\uBD84\\uD3EC P(True)",distQAI:"\\uBD84\\uD3EC Q(Model)",' +
'asymNoteAI:"Forward KL(P\\u2016Q): \\uBAA8\\uB4DC \\uCEE4\\uBC84\\uB9C1 (VAE). Reverse KL(Q\\u2016P): \\uBAA8\\uB4DC \\uCD94\\uAD6C (\\uC815\\uCC45 \\uCD5C\\uC801\\uD654)",' +
'aiAnnotation:"AI\\uC5D0\\uC11C: KL \\uBC1C\\uC0B0 = \\uBAA8\\uB378\\uC774 \\uC815\\uB2F5 \\uBD84\\uD3EC\\uB97C \\uC5BC\\uB9C8\\uB098 \\uC798 \\uADFC\\uC0AC\\uD558\\uB294\\uC9C0\\uC758 \\uCC99\\uB3C4"},' +
'en:{dist:"DISTRIBUTIONS",ctrl:"PARAMETERS",distP:"Distribution P",distQ:"Distribution Q",' +
'diff:"Difference",asym:"Asymmetric",jsLbl:"JS Div.",' +
'muP:"Mean",sigP:"Std",muQ:"Mean",sigQ:"Std",' +
'swap:"Swap P \\u2194 Q",gauss:"Gaussian Mode",disc:"Discrete Mode",' +
'same:"Same",shifted:"Shifted",wideNarrow:"Wide vs Narrow",' +
'slP:"Distribution P",slQ:"Distribution Q",' +
'asymNote:"KL(P\\u2016Q) \\u2260 KL(Q\\u2016P) \\u2014 KL divergence is asymmetric!",' +
'sameNote:"P = Q \\u2192 KL = 0",' +
'discHint:"Drag bars to adjust distribution",' +
'aiLensOn:"AI Lens ON",aiLensOff:"AI Lens OFF",' +
'distPAI:"P(True)",distQAI:"Q(Model)",' +
'asymNoteAI:"Forward KL(P\\u2016Q): mode-covering (VAE). Reverse KL(Q\\u2016P): mode-seeking (policy optimization)",' +
'aiAnnotation:"In AI: KL divergence = measure of how well model approximates the true distribution"}' +
'};' +
'var T=L[LANG]||L.en;' +

// -- State --
'var mode=0;var aiLens=false;' + // 0=gaussian, 1=discrete
'var muP=0,sigP=1.0,muQ=1.0,sigQ=1.0;' +
'var activePreset=0;' +
// discrete mode: 4-bar distributions
'var discP=[0.25,0.25,0.25,0.25];' +
'var discQ=[0.4,0.3,0.2,0.1];' +
'var dragging=null;' + // {dist:'p'|'q', idx:int}

// -- Canvas DPR setup --
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// -- Gaussian PDF --
'function gaussPDF(x,mu,sig){' +
'var d=x-mu;return Math.exp(-d*d/(2*sig*sig))/(sig*Math.sqrt(2*Math.PI))}' +

// -- KL Divergence (Gaussian closed form) --
'function klGauss(mu1,sig1,mu2,sig2){' +
'var v1=sig1*sig1,v2=sig2*sig2;' +
'return Math.log(sig2/sig1)+(v1+(mu1-mu2)*(mu1-mu2))/(2*v2)-0.5}' +

// -- KL Divergence (discrete) --
'function klDiscrete(p,q){' +
'var kl=0;for(var i=0;i<p.length;i++){' +
'if(p[i]>1e-10&&q[i]>1e-10)kl+=p[i]*Math.log(p[i]/q[i])}return kl}' +

// -- JS Divergence --
'function jsGauss(mu1,sig1,mu2,sig2){' +
'var lo=Math.min(mu1-4*sig1,mu2-4*sig2);var hi=Math.max(mu1+4*sig1,mu2+4*sig2);' +
'var N=200;var dx=(hi-lo)/N;var s=0;' +
'for(var i=0;i<=N;i++){var x=lo+dx*i;' +
'var p=gaussPDF(x,mu1,sig1);var q=gaussPDF(x,mu2,sig2);var m=(p+q)/2;' +
'if(p>1e-15&&m>1e-15)s+=p*Math.log(p/m)*dx;' +
'if(q>1e-15&&m>1e-15)s+=q*Math.log(q/m)*dx}' +
'return s*0.5}' +
'function jsDisc(p,q){var s=0;' +
'for(var i=0;i<p.length;i++){var m=(p[i]+q[i])/2;' +
'if(p[i]>1e-10&&m>1e-10)s+=0.5*p[i]*Math.log(p[i]/m);' +
'if(q[i]>1e-10&&m>1e-10)s+=0.5*q[i]*Math.log(q[i]/m)}return s}' +

// -- Normalize discrete dist --
'function normDist(d){var s=0;for(var i=0;i<d.length;i++)s+=d[i];' +
'if(s<1e-10){for(var i=0;i<d.length;i++)d[i]=1/d.length;return}' +
'for(var i=0;i<d.length;i++)d[i]=Math.max(0.01,d[i]/s)}' +

// -- Draw distributions --
'function drawDist(){' +
'var cv=document.getElementById("cvDist");' +
'var dim=setupCanvas(cv,220);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +

'if(mode===0){' +
// --- Gaussian mode ---
'var pad=32,pr=8,pt=14,pb=24;var pw=w-pad-pr,ph=h-pt-pb;' +
'var xMin=-5,xMax=5;' +
// find display range based on mu/sig
'var lo=Math.min(muP-3.5*sigP,muQ-3.5*sigQ);' +
'var hi=Math.max(muP+3.5*sigP,muQ+3.5*sigQ);' +
'xMin=Math.min(-4,lo);xMax=Math.max(4,hi);' +
// sample curves
'var N=200;var pPts=[],qPts=[];var maxY=0.01;' +
'for(var i=0;i<=N;i++){var x=xMin+(xMax-xMin)*i/N;' +
'var yp=gaussPDF(x,muP,sigP);var yq=gaussPDF(x,muQ,sigQ);' +
'pPts.push({x:x,yp:yp});qPts.push({x:x,yq:yq});' +
'if(yp>maxY)maxY=yp;if(yq>maxY)maxY=yq}' +
'maxY*=1.15;' +
'function toX(v){return pad+(v-xMin)/(xMax-xMin)*pw}' +
'function toY(v){return pt+(maxY-v)/maxY*ph}' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.beginPath();' +
'ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var v=Math.ceil(xMin);v<=Math.floor(xMax);v++){ctx.fillText(v+"",toX(v),h-pb+14);' +
'if(v!==0){ctx.strokeStyle=borderC;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(toX(v),pt);ctx.lineTo(toX(v),h-pb);ctx.stroke();ctx.setLineDash([])}}' +
// difference shading (red)
'ctx.fillStyle=redC;ctx.globalAlpha=0.12;ctx.beginPath();ctx.moveTo(toX(pPts[0].x),h-pb);' +
'for(var i=0;i<=N;i++){var yDiff=Math.abs(pPts[i].yp-qPts[i].yq);ctx.lineTo(toX(pPts[i].x),toY(yDiff))}' +
'ctx.lineTo(toX(pPts[N].x),h-pb);ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +
// P curve (teal, filled)
'ctx.beginPath();ctx.moveTo(toX(pPts[0].x),h-pb);' +
'for(var i=0;i<=N;i++)ctx.lineTo(toX(pPts[i].x),toY(pPts[i].yp));' +
'ctx.lineTo(toX(pPts[N].x),h-pb);ctx.closePath();ctx.fillStyle=tealC;ctx.globalAlpha=0.15;ctx.fill();ctx.globalAlpha=1;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<=N;i++){if(i===0)ctx.moveTo(toX(pPts[i].x),toY(pPts[i].yp));else ctx.lineTo(toX(pPts[i].x),toY(pPts[i].yp))}ctx.stroke();' +
// Q curve (accent, filled)
'ctx.beginPath();ctx.moveTo(toX(qPts[0].x),h-pb);' +
'for(var i=0;i<=N;i++)ctx.lineTo(toX(qPts[i].x),toY(qPts[i].yq));' +
'ctx.lineTo(toX(qPts[N].x),h-pb);ctx.closePath();ctx.fillStyle=accC;ctx.globalAlpha=0.12;ctx.fill();ctx.globalAlpha=1;' +
'ctx.strokeStyle=accC;ctx.lineWidth=2;ctx.setLineDash([6,3]);ctx.beginPath();' +
'for(var i=0;i<=N;i++){if(i===0)ctx.moveTo(toX(qPts[i].x),toY(qPts[i].yq));else ctx.lineTo(toX(qPts[i].x),toY(qPts[i].yq))}ctx.stroke();ctx.setLineDash([]);' +
// P/Q mean markers
'ctx.fillStyle=tealC;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(aiLens?"P(True)":"P",toX(muP),pt+10);' +
'ctx.fillStyle=accC;ctx.fillText(aiLens?"Q(Model)":"Q",toX(muQ),pt+10);' +
'}else{' +

// --- Discrete mode ---
'var pad=40,pr=8,pt=14,pb=24;var pw=w-pad-pr,ph=h-pt-pb;' +
'var nBars=4;var groupW=pw/nBars;var barW=groupW*0.35;' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.beginPath();' +
'ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
'var maxVal=0;for(var i=0;i<nBars;i++){if(discP[i]>maxVal)maxVal=discP[i];if(discQ[i]>maxVal)maxVal=discQ[i]}' +
'maxVal=Math.max(0.5,maxVal*1.2);' +
'function toY(v){return pt+(maxVal-v)/maxVal*ph}' +
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(maxVal.toFixed(1),pad-4,pt+8);ctx.fillText("0",pad-4,h-pb+4);' +
// bars
'for(var i=0;i<nBars;i++){' +
'var cx=pad+groupW*i+groupW/2;' +
// P bar (left, teal)
'var bh=discP[i]/maxVal*ph;' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.7;ctx.fillRect(cx-barW-1,h-pb-bh,barW,bh);ctx.globalAlpha=1;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.strokeRect(cx-barW-1,h-pb-bh,barW,bh);' +
// Q bar (right, accent)
'bh=discQ[i]/maxVal*ph;' +
'ctx.fillStyle=accC;ctx.globalAlpha=0.5;ctx.fillRect(cx+1,h-pb-bh,barW,bh);ctx.globalAlpha=1;' +
'ctx.strokeStyle=accC;ctx.lineWidth=1.5;ctx.strokeRect(cx+1,h-pb-bh,barW,bh);' +
// x label
'ctx.fillStyle=textC;ctx.font="10px monospace";ctx.textAlign="center";ctx.fillText("x"+(i+1),cx,h-pb+14);' +
// values
'ctx.fillStyle=tealC;ctx.font="9px monospace";ctx.fillText(discP[i].toFixed(2),cx-barW/2-1,toY(discP[i])-4);' +
'ctx.fillStyle=accC;ctx.fillText(discQ[i].toFixed(2),cx+barW/2+1,toY(discQ[i])-4);' +
'}' +
'}' +
'}' +

// -- Compute and update KL values --
'function updateKL(){' +
'var klpq,klqp,js;' +
'if(mode===0){' +
'klpq=klGauss(muP,sigP,muQ,sigQ);' +
'klqp=klGauss(muQ,sigQ,muP,sigP);' +
'}else{' +
'normDist(discP);normDist(discQ);' +
'klpq=klDiscrete(discP,discQ);' +
'klqp=klDiscrete(discQ,discP);' +
'}' +
'js=mode===0?jsGauss(muP,sigP,muQ,sigQ):jsDisc(discP,discQ);' +
'document.getElementById("klPQ").textContent=klpq.toFixed(3);' +
'document.getElementById("klQP").textContent=klqp.toFixed(3);' +
'document.getElementById("jsDiv").textContent=js.toFixed(3);' +
// asymmetry note
'var note=document.getElementById("asymNote");' +
'var diff=Math.abs(klpq-klqp);' +
'if(aiLens){note.innerHTML="<span class=\\"warn\\">"+T.asymNoteAI+"</span>"}' +
'else if(diff<0.001){note.innerHTML="<span class=\\"hi\\">"+T.sameNote+"</span>"}' +
'else{note.innerHTML="<span class=\\"warn\\">"+T.asymNote+"</span>"}' +
// AI annotation panel
'var aiPanel=document.getElementById("panelAIAnnotation");' +
'if(aiLens){aiPanel.style.display="block";document.getElementById("aiAnnotationBox").innerHTML="<span class=\\"hi\\">"+T.aiAnnotation+"</span>"}' +
'else{aiPanel.style.display="none"}' +
'}' +

// -- Slider update --
'function onSlider(){' +
'muP=+document.getElementById("slMuP").value/10;' +
'sigP=+document.getElementById("slSigP").value/10;' +
'muQ=+document.getElementById("slMuQ").value/10;' +
'sigQ=+document.getElementById("slSigQ").value/10;' +
'document.getElementById("valMuP").textContent=muP.toFixed(1);' +
'document.getElementById("valSigP").textContent=sigP.toFixed(1);' +
'document.getElementById("valMuQ").textContent=muQ.toFixed(1);' +
'document.getElementById("valSigQ").textContent=sigQ.toFixed(1);' +
'highlightPreset();drawDist();updateKL();notifyHeight()}' +

// -- Mode toggle --
'function setMode(m){' +
'mode=m;' +
'document.getElementById("btnGauss").className=m===0?"btn btn-primary":"btn";' +
'document.getElementById("btnDisc").className=m===1?"btn btn-primary":"btn";' +
// show/hide sliders
'var sliders=["slMuP","slSigP","slMuQ","slSigQ"];' +
'for(var i=0;i<sliders.length;i++){' +
'var row=document.getElementById(sliders[i]).parentElement;' +
'row.style.display=m===0?"flex":"none"}' +
'document.getElementById("sl-p").style.display=m===0?"block":"none";' +
'document.getElementById("sl-q").style.display=m===0?"block":"none";' +
'document.getElementById("discHintBox").style.display=m===1?"block":"none";' +
'document.getElementById("discHintBox").textContent=T.discHint;' +
'drawDist();updateKL();notifyHeight()}' +

// -- AI Lens toggle --
'function toggleAILens(){' +
'aiLens=!aiLens;' +
'document.getElementById("btnAILens").textContent=aiLens?T.aiLensOn:T.aiLensOff;' +
'document.getElementById("btnAILens").className=aiLens?"btn btn-primary":"btn";' +
'document.getElementById("leg-p").textContent=aiLens?T.distPAI:T.distP;' +
'document.getElementById("leg-q").textContent=aiLens?T.distQAI:T.distQ;' +
'drawDist();updateKL();notifyHeight()}' +

// -- Presets --
'var PRESETS=[{muP:0,sigP:1,muQ:0,sigQ:1},{muP:0,sigP:1,muQ:1.5,sigQ:1},{muP:0,sigP:0.5,muQ:0,sigQ:2}];' +
'var DISC_PRESETS=[[0.25,0.25,0.25,0.25,0.25,0.25,0.25,0.25],[0.25,0.25,0.25,0.25,0.4,0.3,0.2,0.1],[0.1,0.1,0.4,0.4,0.4,0.4,0.1,0.1]];' +
'function onPreset(idx){' +
'activePreset=idx;' +
'for(var i=0;i<3;i++){document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
'if(mode===0){' +
'muP=PRESETS[idx].muP;sigP=PRESETS[idx].sigP;muQ=PRESETS[idx].muQ;sigQ=PRESETS[idx].sigQ;' +
'document.getElementById("slMuP").value=muP*10;document.getElementById("slSigP").value=sigP*10;' +
'document.getElementById("slMuQ").value=muQ*10;document.getElementById("slSigQ").value=sigQ*10;' +
'document.getElementById("valMuP").textContent=muP.toFixed(1);document.getElementById("valSigP").textContent=sigP.toFixed(1);' +
'document.getElementById("valMuQ").textContent=muQ.toFixed(1);document.getElementById("valSigQ").textContent=sigQ.toFixed(1);' +
'}else{' +
'var dp=DISC_PRESETS[idx];' +
'for(var i=0;i<4;i++){discP[i]=dp[i];discQ[i]=dp[i+4]}' +
'normDist(discP);normDist(discQ);' +
'}' +
'drawDist();updateKL();notifyHeight()}' +

'function highlightPreset(){' +
'if(mode!==0)return;' +
'for(var i=0;i<3;i++){' +
'var p=PRESETS[i];var match=Math.abs(muP-p.muP)<0.05&&Math.abs(sigP-p.sigP)<0.05&&Math.abs(muQ-p.muQ)<0.05&&Math.abs(sigQ-p.sigQ)<0.05;' +
'document.getElementById("pre"+i).className=match?"preset active":"preset"}}' +

// -- Swap --
'function doSwap(){' +
'if(mode===0){var tm=muP,ts=sigP;muP=muQ;sigP=sigQ;muQ=tm;sigQ=ts;' +
'document.getElementById("slMuP").value=muP*10;document.getElementById("slSigP").value=sigP*10;' +
'document.getElementById("slMuQ").value=muQ*10;document.getElementById("slSigQ").value=sigQ*10;' +
'document.getElementById("valMuP").textContent=muP.toFixed(1);document.getElementById("valSigP").textContent=sigP.toFixed(1);' +
'document.getElementById("valMuQ").textContent=muQ.toFixed(1);document.getElementById("valSigQ").textContent=sigQ.toFixed(1);' +
'}else{var tmp=discP.slice();discP=discQ.slice();discQ=tmp}' +
'drawDist();updateKL();notifyHeight()}' +

// -- Discrete mode drag --
'function onDistTouch(e){' +
'if(mode!==0){e.preventDefault();handleDiscDrag(e,true)}}' +
'function onDistMove(e){' +
'if(mode!==0&&dragging){e.preventDefault();handleDiscDrag(e,false)}}' +
'function onDistEnd(){dragging=null}' +

'function handleDiscDrag(e,isStart){' +
'var cv=document.getElementById("cvDist");var rect=cv.getBoundingClientRect();' +
'var x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;' +
'var y=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;' +
'var pad=40,pr=8,pt=14,pb=24;' +
'var pw=rect.width-pad-pr,ph=rect.height-pt-pb;' +
'var nBars=4;var groupW=pw/nBars;var barW=groupW*0.35;' +
// find which bar
'if(isStart){dragging=null;' +
'for(var i=0;i<nBars;i++){var cx=pad+groupW*i+groupW/2;' +
'if(x>=cx-barW-2&&x<cx)dragging={dist:"p",idx:i};' +
'else if(x>=cx&&x<cx+barW+2)dragging={dist:"q",idx:i}}}' +
'if(!dragging)return;' +
// compute value from y
'var maxVal=0;for(var i=0;i<nBars;i++){if(discP[i]>maxVal)maxVal=discP[i];if(discQ[i]>maxVal)maxVal=discQ[i]}' +
'maxVal=Math.max(0.5,maxVal*1.2);' +
'var val=(1-(y-pt)/ph)*maxVal;val=Math.max(0.01,Math.min(1,val));' +
'if(dragging.dist==="p")discP[dragging.idx]=val;else discQ[dragging.idx]=val;' +
'normDist(discP);normDist(discQ);' +
'drawDist();updateKL()}' +

// -- Height notification --
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// -- Init labels --
'document.getElementById("lbl-dist").textContent=T.dist;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-js").textContent=T.jsLbl;' +
'document.getElementById("leg-p").textContent=T.distP;' +
'document.getElementById("leg-q").textContent=T.distQ;' +
'document.getElementById("leg-diff").textContent=T.diff;' +
'document.getElementById("btnGauss").textContent=T.gauss;' +
'document.getElementById("btnDisc").textContent=T.disc;' +
'document.getElementById("pre0").textContent=T.same;' +
'document.getElementById("pre1").textContent=T.shifted;' +
'document.getElementById("pre2").textContent=T.wideNarrow;' +
'document.getElementById("sl-p").textContent=T.slP;' +
'document.getElementById("sl-q").textContent=T.slQ;' +
'document.getElementById("btnSwap").textContent=T.swap;' +
'document.getElementById("btnAILens").textContent=T.aiLensOff;' +

// -- Init values --
'document.getElementById("valMuP").textContent=muP.toFixed(1);' +
'document.getElementById("valSigP").textContent=sigP.toFixed(1);' +
'document.getElementById("valMuQ").textContent=muQ.toFixed(1);' +
'document.getElementById("valSigQ").textContent=sigQ.toFixed(1);' +

// -- Init --
'onPreset(0);' +
// Discrete mode touch events
'var cvD=document.getElementById("cvDist");' +
'cvD.addEventListener("touchstart",onDistTouch,{passive:false});' +
'cvD.addEventListener("touchmove",onDistMove,{passive:false});' +
'cvD.addEventListener("touchend",onDistEnd);' +
'cvD.addEventListener("mousedown",onDistTouch);' +
'cvD.addEventListener("mousemove",onDistMove);' +
'cvD.addEventListener("mouseup",onDistEnd);' +
'window.addEventListener("resize",function(){drawDist();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
