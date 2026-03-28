/**
 * Clinical Trial Design interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Two group bar charts (Treatment vs Placebo response rate)
 * - p-value gauge: horizontal bar from 0 to 1 with alpha threshold
 * - True Effect Size slider: 0%-30% (hidden internal parameter)
 * - Sample Size per Group slider: 10-200
 * - Significance Level (alpha) segment: 0.01 / 0.05 / 0.10
 * - "Randomize", "Run Trial", "Repeat 100x" buttons
 * - Stats: Effect size, p-value, 95% CI, Power, Type I/II error rates
 * - With effect=0, ~5% of trials show p<0.05 (false positive demonstration)
 * - Dark/light theme, Korean/English bilingual
 */

export function getClinicalSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px;min-width:0;overflow:hidden}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .rd{color:var(--red);font-weight:700}' +
'.stats .gn{color:var(--green);font-weight:700}' +
'.seg-row{display:flex;gap:0;margin-bottom:10px}' +
'.seg{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px;overflow:hidden}' +
'.seg:first-child{border-right:none}' +
'.seg:last-child{border-left:none}' +
'.seg.active{border-color:var(--teal);background:var(--tealLight);color:var(--teal)}' +
'.seg:active{opacity:0.7}' +
'</style></head><body>' +

// ── Trial Results Canvas ──
'<div class="panel"><div class="label" id="lbl-trial"></div>' +
'<canvas id="cvTrial" height="180"></canvas></div>' +

// ── P-value Gauge ──
'<div class="panel"><div class="label" id="lbl-pval"></div>' +
'<canvas id="cvPval" height="60"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-effect"></span>' +
'<input type="range" id="slEffect" min="0" max="30" value="10" oninput="onSliders()">' +
'<span class="ctrl-val" id="valEffect"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-nsize"></span>' +
'<input type="range" id="slN" min="10" max="200" value="50" step="5" oninput="onSliders()">' +
'<span class="ctrl-val" id="valN"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-alpha"></span></div>' +
'<div class="seg-row">' +
'<div class="seg" id="segA1" onclick="setAlpha(0.01)">\\u03B1 = 0.01</div>' +
'<div class="seg active" id="segA5" onclick="setAlpha(0.05)">\\u03B1 = 0.05</div>' +
'<div class="seg" id="segA10" onclick="setAlpha(0.10)">\\u03B1 = 0.10</div>' +
'</div>' +
'<div class="btn-row" style="margin-bottom:6px">' +
'<div class="btn" id="btnAILens" onclick="toggleAILens()"></div>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn" id="btnRand" onclick="randomize()"></div>' +
'<div class="btn btn-primary" id="btnRun" onclick="runTrial()"></div>' +
'<div class="btn" id="btn100" onclick="repeat100()"></div>' +
'</div></div>' +

// ── AI Lens Stats Annotation ──
'<div class="panel" id="panelAIAnnotation" style="display:none"><div class="stats" id="aiAnnotationBox"></div></div>' +

// ── Power Canvas (after repeat) ──
'<div class="panel" id="panelPower" style="display:none"><div class="label" id="lbl-power"></div>' +
'<canvas id="cvPower" height="100"></canvas></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{trial:"\\uC784\\uC0C1\\uC2DC\\uD5D8 \\uACB0\\uACFC",pval:"P-\\uAC12 \\uAC8C\\uC774\\uC9C0",' +
'ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",power:"\\uD1B5\\uACC4\\uC801 \\uAC80\\uC815\\uB825 (100\\uD68C)",' +
'effect:"\\uD6A8\\uACFC \\uD06C\\uAE30",nsize:"\\uADF8\\uB8F9\\uB2F9 N",' +
'alpha:"\\uC720\\uC758\\uC218\\uC900 \\u03B1",rand:"\\uBB34\\uC791\\uC704 \\uBC30\\uC815",' +
'run:"\\u25B6 \\uC2DC\\uD5D8 \\uC2E4\\uD589",repeat:"100\\uD68C \\uBC18\\uBCF5",' +
'treatment:"\\uCE58\\uB8CC\\uAD70",placebo:"\\uC704\\uC57D\\uAD70",' +
'sig:"\\uC720\\uC758",notSig:"\\uBE44\\uC720\\uC758",' +
'pValue:"p-\\uAC12",ci95:"95% \\uC2E0\\uB8B0\\uAD6C\\uAC04",' +
'powerVal:"\\uAC80\\uC815\\uB825",typeI:"Type I \\uC624\\uB958",typeII:"Type II \\uC624\\uB958",' +
'obsEffect:"\\uAD00\\uCC30 \\uD6A8\\uACFC",trueEffect:"\\uCC38 \\uD6A8\\uACFC(\\uC228\\uAE40)",' +
'respRate:"\\uBC18\\uC751\\uB960",sigOf100:"\\uC720\\uC758 \\uBE44\\uC728",running:"\\uC2E4\\uD589 \\uC911...",' +
'aiLensOn:"AI Lens ON",aiLensOff:"AI Lens OFF",' +
'treatmentAI:"\\uC0C8 \\uBAA8\\uB378",placeboAI:"\\uAE30\\uC874",' +
'aiAnnotation:"AI \\uAD00\\uC810: \\uBAA8\\uB378 A vs B \\uBE44\\uAD50 = \\uC784\\uC0C1\\uC2DC\\uD5D8\\uC758 RCT\\uC640 \\uB3D9\\uC77C \\uC6D0\\uB9AC. p-hacking \\uC8FC\\uC758!",' +
'pHackNote:"\\uD6A8\\uACFC=0\\uC5D0\\uC11C \\uBC18\\uBCF5 \\uBE44\\uAD50 \\uC2DC ~5%\\uAC00 \\uC720\\uC758 \\u2192 p-hacking"},' +
'en:{trial:"TRIAL RESULTS",pval:"P-VALUE GAUGE",' +
'ctrl:"CONTROLS",stats:"STATISTICS",power:"STATISTICAL POWER (100 TRIALS)",' +
'effect:"Effect",nsize:"N/group",' +
'alpha:"Significance \\u03B1",rand:"Randomize",' +
'run:"\\u25B6 Run Trial",repeat:"Repeat 100x",' +
'treatment:"Treatment",placebo:"Placebo",' +
'sig:"SIGNIFICANT",notSig:"NOT SIGNIFICANT",' +
'pValue:"p-value",ci95:"95% CI",' +
'powerVal:"Power",typeI:"Type I Error",typeII:"Type II Error",' +
'obsEffect:"Obs. Effect",trueEffect:"True Effect (hidden)",' +
'respRate:"Response Rate",sigOf100:"Sig. Rate",running:"Running...",' +
'aiLensOn:"AI Lens ON",aiLensOff:"AI Lens OFF",' +
'treatmentAI:"New Model",placeboAI:"Baseline",' +
'aiAnnotation:"AI perspective: Model A vs B comparison = same principle as clinical RCT. Beware p-hacking!",' +
'pHackNote:"~5% significant at effect=0 with repeated comparisons \\u2192 p-hacking"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var aiLens=false;' +
'var trueEffect=0.10;' + // 0-0.30
'var sampleN=50;' +
'var alpha=0.05;' +
'var baseline=0.30;' + // base response rate
'var treatResult=-1;var placResult=-1;' + // response rates
'var treatSuccess=0;var placSuccess=0;' +
'var pValue=1;var ciLo=0;var ciHi=0;' +
'var trialRun=false;' +
'var powerResults=null;' + // {sigCount, trials, typeI, typeII}
'var animTimer=null;var animStep=0;var animTreat=[];var animPlac=[];' +

// ── Normal CDF approximation (Abramowitz & Stegun) ──
'function normCDF(z){' +
'if(z<-8)return 0;if(z>8)return 1;' +
'var t=1/(1+0.2316419*Math.abs(z));' +
'var d=0.3989422804014327;' +
'var p=d*Math.exp(-z*z/2)*(t*(0.319381530+t*(-0.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429)))));' +
'return z>0?1-p:p}' +

// ── Z-test for two proportions ──
'function zTest(s1,n1,s2,n2){' +
'var p1=s1/n1;var p2=s2/n2;' +
'var pp=(s1+s2)/(n1+n2);' +
'var se=Math.sqrt(pp*(1-pp)*(1/n1+1/n2));' +
'if(se<1e-10)return{z:0,p:1,ci:[0,0]};' +
'var z=(p1-p2)/se;' +
'var pv=2*(1-normCDF(Math.abs(z)));' +
// CI for difference
'var se2=Math.sqrt(p1*(1-p1)/n1+p2*(1-p2)/n2);' +
'var diff=p1-p2;' +
'return{z:z,p:pv,ci:[diff-1.96*se2,diff+1.96*se2]}}' +

// ── Binomial sampling ──
'function binomSample(n,p){' +
'var s=0;for(var i=0;i<n;i++){if(Math.random()<p)s++}return s}' +

// ── Run single trial ──
'function runSingleTrial(){' +
'var pt=baseline+trueEffect;var pp=baseline;' +
'treatSuccess=binomSample(sampleN,pt);' +
'placSuccess=binomSample(sampleN,pp);' +
'treatResult=treatSuccess/sampleN;' +
'placResult=placSuccess/sampleN;' +
'var res=zTest(treatSuccess,sampleN,placSuccess,sampleN);' +
'pValue=res.p;ciLo=res.ci[0];ciHi=res.ci[1];' +
'trialRun=true}' +

// ── Canvas setup ──
'function setupCanvas(cv,h){var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw trial results (two bar groups) ──
'function drawTrial(){' +
'var cv=document.getElementById("cvTrial");' +
'var dim=setupCanvas(cv,180);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +

'var pad={l:40,r:12,t:20,b:36};' +
'var pw=w-pad.l-pad.r;var ph=h-pad.t-pad.b;' +

// Y axis: 0 to 1 (response rate)
'function toY(v){return pad.t+(1-v)*ph}' +

// Axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +

// Y labels
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'for(var v=0;v<=1;v+=0.2){' +
'ctx.fillText((v*100).toFixed(0)+"%",pad.l-4,toY(v)+3);' +
'if(v>0){ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.setLineDash([3,3]);' +
'ctx.beginPath();ctx.moveTo(pad.l,toY(v));ctx.lineTo(w-pad.r,toY(v));ctx.stroke();ctx.setLineDash([])}}' +

'if(!trialRun){' +
'ctx.fillStyle=text3C;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.run,w/2,h/2);return}' +

// Two bars
'var barW=pw*0.25;var gap=pw*0.15;' +
'var x1=pad.l+pw/2-barW-gap/2;' +
'var x2=pad.l+pw/2+gap/2;' +

// Treatment bar
'var th=treatResult*ph;' +
'ctx.fillStyle=tealC;ctx.fillRect(x1,toY(treatResult),barW,th);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(x1,toY(treatResult),barW,th);' +

// Placebo bar
'var ph2=placResult*ph;' +
'ctx.fillStyle=surfaceC;ctx.fillRect(x2,toY(placResult),barW,ph2);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(x2,toY(placResult),barW,ph2);' +

// Bar labels
'ctx.fillStyle=textC;ctx.font="bold 11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText((treatResult*100).toFixed(1)+"%",x1+barW/2,toY(treatResult)-6);' +
'ctx.fillText((placResult*100).toFixed(1)+"%",x2+barW/2,toY(placResult)-6);' +

// Group labels
'ctx.fillStyle=tealC;ctx.font="10px -apple-system,sans-serif";' +
'ctx.fillText(aiLens?T.treatmentAI:T.treatment,x1+barW/2,h-pad.b+14);' +
'ctx.fillStyle=text3C;' +
'ctx.fillText(aiLens?T.placeboAI:T.placebo,x2+barW/2,h-pad.b+14);' +

// Individual dots (patients)
'var dotR=2;' +
'ctx.globalAlpha=0.4;' +
'var dotsPerRow=Math.floor(barW/(dotR*2+2));' +
'function drawDots(x0,total,success,color,failColor){' +
'for(var i=0;i<Math.min(total,100);i++){' +
'var row=Math.floor(i/dotsPerRow);var col=i%dotsPerRow;' +
'var dx=x0+col*(dotR*2+2)+dotR+2;' +
'var dy=h-pad.b-4-row*(dotR*2+2)-dotR;' +
'ctx.fillStyle=i<success?color:failColor;' +
'ctx.beginPath();ctx.arc(dx,dy,dotR,0,Math.PI*2);ctx.fill()}}' +
'drawDots(x1,sampleN,treatSuccess,tealC,borderC);' +
'drawDots(x2,sampleN,placSuccess,text3C,borderC);' +
'ctx.globalAlpha=1}' +

// ── Draw p-value gauge ──
'function drawPval(){' +
'var cv=document.getElementById("cvPval");' +
'var dim=setupCanvas(cv,60);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +

'var pad2={l:24,r:24,t:20,b:18};' +
'var gw=w-pad2.l-pad2.r;var gh=16;' +
'var gy=pad2.t;' +
'function toX(p){return pad2.l+Math.min(p,1)*gw}' +

// Background bar
'ctx.fillStyle=surfaceC;ctx.fillRect(pad2.l,gy,gw,gh);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(pad2.l,gy,gw,gh);' +

// Alpha threshold line
'var ax=toX(alpha);' +
'ctx.strokeStyle=redC;ctx.lineWidth=2;ctx.setLineDash([4,3]);' +
'ctx.beginPath();ctx.moveTo(ax,gy-4);ctx.lineTo(ax,gy+gh+4);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=redC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText("\\u03B1="+alpha,ax,gy-6);' +

'if(trialRun){' +
// P-value indicator
'var px=toX(pValue);var isSig=pValue<alpha;' +
// Fill left portion
'ctx.fillStyle=isSig?tealC:surfaceC;ctx.globalAlpha=0.3;' +
'ctx.fillRect(pad2.l+1,gy+1,px-pad2.l,gh-2);ctx.globalAlpha=1;' +
// Marker
'ctx.fillStyle=isSig?tealC:text3C;' +
'ctx.beginPath();ctx.moveTo(px,gy+gh);ctx.lineTo(px-5,gy+gh+10);ctx.lineTo(px+5,gy+gh+10);ctx.closePath();ctx.fill();' +
// P label
'ctx.font="bold 10px monospace";ctx.textAlign="center";' +
'ctx.fillText("p="+pValue.toFixed(4),px,gy+gh+22);' +
// Result label
'ctx.fillStyle=isSig?tealC:text3C;ctx.font="bold 11px -apple-system,sans-serif";' +
'ctx.textAlign=isSig?"left":"right";' +
'var labelX=isSig?pad2.l:w-pad2.r;' +
'ctx.fillText(isSig?T.sig:T.notSig,labelX,gy+gh+22)}' +

// Scale labels
'ctx.fillStyle=text3C;ctx.font="8px monospace";ctx.textAlign="left";' +
'ctx.fillText("0",pad2.l,gy+gh+12);' +
'ctx.textAlign="right";ctx.fillText("1",w-pad2.r,gy+gh+12)}' +

// ── Draw power chart ──
'function drawPower(){' +
'if(!powerResults){document.getElementById("panelPower").style.display="none";return}' +
'document.getElementById("panelPower").style.display="block";' +
'var cv=document.getElementById("cvPower");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +

'var pad2={l:36,r:12,t:14,b:22};' +
'var pw2=w-pad2.l-pad2.r;var ph2=h-pad2.t-pad2.b;' +

// Histogram of p-values
'var pVals=powerResults.pVals;' +
'var nBins=20;var bins=[];for(var i=0;i<nBins;i++)bins[i]=0;' +
'for(var i=0;i<pVals.length;i++){' +
'var b=Math.floor(pVals[i]*nBins);if(b>=nBins)b=nBins-1;if(b<0)b=0;bins[b]++}' +
'var maxBin=0;for(var i=0;i<nBins;i++){if(bins[i]>maxBin)maxBin=bins[i]}' +
'if(maxBin<1)maxBin=1;' +

// Draw bins
'var binW=pw2/nBins;' +
'for(var i=0;i<nBins;i++){' +
'var bx=pad2.l+i*binW;var bh=bins[i]/maxBin*ph2;' +
'var pMid=(i+0.5)/nBins;' +
'ctx.fillStyle=pMid<alpha?tealC:surfaceC;' +
'ctx.fillRect(bx,pad2.t+ph2-bh,binW-1,bh);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.strokeRect(bx,pad2.t+ph2-bh,binW-1,bh)}' +

// Alpha line
'var ax2=pad2.l+alpha*pw2;' +
'ctx.strokeStyle=redC;ctx.lineWidth=2;ctx.setLineDash([4,3]);' +
'ctx.beginPath();ctx.moveTo(ax2,pad2.t);ctx.lineTo(ax2,pad2.t+ph2);ctx.stroke();ctx.setLineDash([]);' +

// Labels
'ctx.fillStyle=text3C;ctx.font="8px monospace";ctx.textAlign="center";' +
'ctx.fillText("0",pad2.l,h-4);ctx.fillText("1",w-pad2.r,h-4);ctx.fillText("p",w/2,h-4);' +
'ctx.fillStyle=tealC;ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.fillText(T.powerVal+": "+powerResults.power.toFixed(0)+"%",pad2.l,pad2.t-2);' +

// Axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad2.l,pad2.t);ctx.lineTo(pad2.l,pad2.t+ph2);ctx.lineTo(w-pad2.r,pad2.t+ph2);ctx.stroke()}' +

// ── Sliders ──
'function onSliders(){' +
'trueEffect=+document.getElementById("slEffect").value/100;' +
'sampleN=+document.getElementById("slN").value;' +
'document.getElementById("valEffect").textContent=(trueEffect*100).toFixed(0)+"%";' +
'document.getElementById("valN").textContent=sampleN;' +
'drawAll()}' +

// ── Alpha segment ──
'function setAlpha(val){' +
'alpha=val;' +
'document.getElementById("segA1").className=alpha===0.01?"seg active":"seg";' +
'document.getElementById("segA5").className=alpha===0.05?"seg active":"seg";' +
'document.getElementById("segA10").className=alpha===0.10?"seg active":"seg";' +
'drawAll()}' +

// ── Randomize (visual assignment) ──
'function randomize(){' +
'trialRun=false;powerResults=null;' +
'drawAll();notifyHeight()}' +

// ── Run single trial ──
'function runTrial(){' +
'runSingleTrial();powerResults=null;' +
'drawAll();notifyHeight()}' +

// ── Repeat 100 trials ──
'function repeat100(){' +
'var sigCount=0;var pVals=[];' +
'for(var t2=0;t2<100;t2++){' +
'var pt2=baseline+trueEffect;var pp2=baseline;' +
'var ts=binomSample(sampleN,pt2);' +
'var ps=binomSample(sampleN,pp2);' +
'var res=zTest(ts,sampleN,ps,sampleN);' +
'pVals.push(res.p);' +
'if(res.p<alpha)sigCount++}' +

'var pow=sigCount;' +
// Type I: false positive rate (if effect=0)
// Type II: false negative rate (if effect>0)
'var typeI=trueEffect<0.001?pow:null;' +
'var typeII=trueEffect>=0.001?(100-pow):null;' +
'powerResults={sigCount:sigCount,power:pow,pVals:pVals,typeI:typeI,typeII:typeII};' +

// Also run one visible trial
'runSingleTrial();' +
'drawAll();notifyHeight()}' +

// ── Draw all ──
'function toggleAILens(){' +
'aiLens=!aiLens;' +
'document.getElementById("btnAILens").textContent=aiLens?T.aiLensOn:T.aiLensOff;' +
'document.getElementById("btnAILens").className=aiLens?"btn btn-primary":"btn";' +
'var aiPanel=document.getElementById("panelAIAnnotation");' +
'if(aiLens){aiPanel.style.display="block";' +
'var note=T.aiAnnotation;' +
'if(powerResults&&trueEffect<0.001){note+="<br><span class=\\"rd\\">"+T.pHackNote+"</span>"}' +
'document.getElementById("aiAnnotationBox").innerHTML="<span class=\\"warn\\">"+note+"</span>"}' +
'else{aiPanel.style.display="none"}' +
'drawAll();notifyHeight()}' +

'function drawAll(){drawTrial();drawPval();drawPower();updateStats()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var s=T.trueEffect+": <span class=\\"warn\\">"+(trueEffect*100).toFixed(0)+"%</span><br>";' +
'if(trialRun){' +
'var tLbl=aiLens?T.treatmentAI:T.treatment;var pLbl=aiLens?T.placeboAI:T.placebo;' +
's+=T.obsEffect+": <span class=\\"hi\\">"+(((treatResult-placResult))*100).toFixed(1)+"%</span>";' +
's+=" ("+tLbl+": "+(treatResult*100).toFixed(1)+"% / "+pLbl+": "+(placResult*100).toFixed(1)+"%)<br>";' +
'var pCls=pValue<alpha?"gn":"rd";' +
's+=T.pValue+": <span class=\\""+pCls+"\\">"+pValue.toFixed(4)+"</span>";' +
's+=pValue<alpha?" \\u2714 "+T.sig:" \\u2718 "+T.notSig;s+="<br>";' +
's+=T.ci95+": [<span class=\\"warn\\">"+(ciLo*100).toFixed(1)+"%</span>, <span class=\\"warn\\">"+(ciHi*100).toFixed(1)+"%</span>]<br>"}' +
'if(powerResults){' +
's+="<br><span class=\\"hi\\">"+T.powerVal+"</span>: "+powerResults.power+"/100 = <span class=\\"hi\\">"+powerResults.power+"%</span><br>";' +
'if(powerResults.typeI!==null){s+=T.typeI+": <span class=\\"rd\\">"+powerResults.typeI+"%</span> (\\u03B1="+alpha+")<br>"}' +
'if(powerResults.typeII!==null){s+=T.typeII+": <span class=\\"rd\\">"+powerResults.typeII+"%</span><br>"}}' +
'if(aiLens){var aiPanel=document.getElementById("panelAIAnnotation");aiPanel.style.display="block";' +
'var aNote=T.aiAnnotation;' +
'if(powerResults&&trueEffect<0.001){aNote+="<br><span class=\\"rd\\">"+T.pHackNote+"</span>"}' +
'document.getElementById("aiAnnotationBox").innerHTML="<span class=\\"warn\\">"+aNote+"</span>"}' +
'box.innerHTML=s;notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-trial").textContent=T.trial;' +
'document.getElementById("lbl-pval").textContent=T.pval;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-power").textContent=T.power;' +
'document.getElementById("lbl-effect").textContent=T.effect;' +
'document.getElementById("lbl-nsize").textContent=T.nsize;' +
'document.getElementById("lbl-alpha").textContent=T.alpha;' +
'document.getElementById("btnRand").textContent=T.rand;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btn100").textContent=T.repeat;' +
'document.getElementById("btnAILens").textContent=T.aiLensOff;' +

// ── Init ──
'onSliders();drawAll();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
