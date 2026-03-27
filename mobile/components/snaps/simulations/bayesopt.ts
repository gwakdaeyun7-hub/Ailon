/**
 * Bayesian Optimization interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 1D unknown objective function with GP surrogate (mean + uncertainty band)
 * - Tap to sample, acquisition function (EI/UCB) plotted below
 * - Auto Suggest button highlights acquisition maximum
 * - Random Search comparison mode
 * - Reveal Function toggle, Reset button
 * - Dark/light theme, Korean/English bilingual
 */

export function getBayesOptSimulationHTML(isDark: boolean, lang: string): string {
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
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px;border-radius:8px}' +
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card);border-radius:8px}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:56px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.btn-on{background:var(--tealLight);border-color:var(--teal);color:var(--teal)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .rd{color:var(--red);font-weight:700}' +
'.stats .gn{color:var(--green);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;border-radius:8px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'</style></head><body>' +

// ── GP / Objective Panel ──
'<div class="panel"><div class="label" id="lbl-gp"></div>' +
'<canvas id="cvGP" height="200"></canvas></div>' +

// ── Acquisition Panel ──
'<div class="panel"><div class="label" id="lbl-acq"></div>' +
'<canvas id="cvAcq" height="100"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="preEI" onclick="setAcq(0)">EI</div>' +
'<div class="preset" id="preUCB" onclick="setAcq(1)">UCB</div>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnSuggest" onclick="onSuggest()"></div>' +
'<div class="btn" id="btnRandom" onclick="onRandom()"></div>' +
'</div>' +
'<div class="btn-row" style="margin-top:6px">' +
'<div class="btn" id="btnReveal" onclick="onReveal()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{gp:"\\uB300\\uB9AC \\uBAA8\\uB378(GP) + \\uAD00\\uCE21\\uC810",acq:"\\uD68D\\uB4DD \\uD568\\uC218",' +
'ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'suggest:"\\uB2E4\\uC74C \\uD0D0\\uC0C9",random:"\\uB79C\\uB364 \\uD0D0\\uC0C9",' +
'showFn:"\\uD568\\uC218 \\uACF5\\uAC1C",hideFn:"\\uD568\\uC218 \\uC228\\uAE30\\uAE30",' +
'reset:"\\u21BA \\uB9AC\\uC14B",' +
'bestVal:"\\uCD5C\\uC801\\uAC12",samples:"\\uAD00\\uCE21\\uC218",acqType:"\\uD68D\\uB4DD \\uD568\\uC218",' +
'rndBest:"\\uB79C\\uB364 \\uCD5C\\uC801",tapHint:"\\uC704 \\uCE94\\uBC84\\uC2A4\\uB97C \\uD0ED\\uD558\\uC5EC \\uD0D0\\uC0C9",' +
'surMean:"\\uB300\\uB9AC \\uD3C9\\uADE0",uncert:"\\uBD88\\uD655\\uC2E4\\uC131",obs:"\\uAD00\\uCE21\\uC810",' +
'nextPt:"\\uB2E4\\uC74C \\uD0D0\\uC0C9\\uC810",trueFn:"\\uCC38 \\uD568\\uC218",' +
'exploreExploit:"\\uD0D0\\uC0C9 vs \\uD65C\\uC6A9"},' +
'en:{gp:"SURROGATE(GP) + OBSERVATIONS",acq:"ACQUISITION FUNCTION",' +
'ctrl:"CONTROLS",stats:"STATISTICS",' +
'suggest:"Auto Suggest",random:"Random Search",' +
'showFn:"Reveal Fn",hideFn:"Hide Fn",' +
'reset:"\\u21BA Reset",' +
'bestVal:"Best Value",samples:"Samples",acqType:"Acquisition",' +
'rndBest:"Random Best",tapHint:"Tap top canvas to sample",' +
'surMean:"GP Mean",uncert:"Uncertainty",obs:"Observations",' +
'nextPt:"Next Sample",trueFn:"True Fn",' +
'exploreExploit:"Explore vs Exploit"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── Constants ──
'var G=100;var xGrid=[];for(var i=0;i<G;i++)xGrid.push(i/(G-1));' +
'var lengthScale=0.15;var noiseVar=1e-6;var kappa=2.0;' +

// ── State ──
'var obsX=[];var obsY=[];var randX=[];var randY=[];' +
'var revealed=false;var acqMode=0;var suggestIdx=-1;' +
'var gpMean=[];var gpStd=[];var acqVals=[];' +

// ── True functions ──
'var funcs=[' +
'function(x){return Math.sin(2*Math.PI*x)+0.5*Math.sin(6*Math.PI*x)},' +
'function(x){return Math.sin(3*Math.PI*x)*Math.cos(Math.PI*x)+0.3*Math.sin(8*Math.PI*x)},' +
'function(x){return 2*x*Math.sin(4*Math.PI*x)}' +
'];' +
'var fIdx=Math.floor(Math.random()*funcs.length);' +
'function trueF(x){return funcs[fIdx](x)}' +

// ── RBF Kernel ──
'function rbf(x1,x2){var d=x1-x2;return Math.exp(-d*d/(2*lengthScale*lengthScale))}' +

// ── Matrix helpers ──
'function matInv(M){var n=M.length;var A=[];for(var i=0;i<n;i++){A[i]=[];for(var j=0;j<n;j++)A[i][j]=M[i][j];' +
'A[i][n+j]=0;for(var j=0;j<n;j++)A[i][n+j]=(i===j)?1:0}' +
// Fix: re-init identity properly
'for(var i=0;i<n;i++){for(var j=0;j<n;j++)A[i][n+j]=(i===j)?1:0}' +
'for(var k=0;k<n;k++){var mx=Math.abs(A[k][k]),mr=k;' +
'for(var i=k+1;i<n;i++){if(Math.abs(A[i][k])>mx){mx=Math.abs(A[i][k]);mr=i}}' +
'if(mr!==k){var tmp=A[k];A[k]=A[mr];A[mr]=tmp}' +
'var piv=A[k][k];if(Math.abs(piv)<1e-14)piv=1e-14;' +
'for(var j=0;j<2*n;j++)A[k][j]/=piv;' +
'for(var i=0;i<n;i++){if(i===k)continue;var f=A[i][k];' +
'for(var j=0;j<2*n;j++)A[i][j]-=f*A[k][j]}}' +
'var R=[];for(var i=0;i<n;i++){R[i]=[];for(var j=0;j<n;j++)R[i][j]=A[i][n+j]}return R}' +

// ── GP predict ──
'function gpPredict(){' +
'var n=obsX.length;' +
'if(n===0){gpMean=[];gpStd=[];for(var i=0;i<G;i++){gpMean.push(0);gpStd.push(1)}return}' +

// Build K matrix
'var K=[];for(var i=0;i<n;i++){K[i]=[];for(var j=0;j<n;j++){K[i][j]=rbf(obsX[i],obsX[j]);' +
'if(i===j)K[i][j]+=noiseVar}}' +
'var Kinv=matInv(K);' +

// For each grid point
'gpMean=[];gpStd=[];' +
'for(var g=0;g<G;g++){var x=xGrid[g];' +
'var ks=[];for(var i=0;i<n;i++)ks.push(rbf(x,obsX[i]));' +
// mu = ks^T Kinv y
'var mu=0;for(var i=0;i<n;i++){var s=0;for(var j=0;j<n;j++)s+=Kinv[i][j]*obsY[j];mu+=ks[i]*s}' +
// var = k(x,x) - ks^T Kinv ks
'var v=rbf(x,x);for(var i=0;i<n;i++){var s=0;for(var j=0;j<n;j++)s+=Kinv[i][j]*ks[j];v-=ks[i]*s}' +
'if(v<1e-10)v=1e-10;' +
'gpMean.push(mu);gpStd.push(Math.sqrt(v))}}' +

// ── Acquisition functions ──
'function stdNormPDF(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI)}' +
'function stdNormCDF(x){var t=1/(1+0.2316419*Math.abs(x));' +
'var d=0.3989422804014327;var p=t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));' +
'p=1-d*Math.exp(-0.5*x*x)*p;return x>=0?p:1-p}' +

'function computeAcq(){acqVals=[];' +
'var bestY=-1e10;for(var i=0;i<obsY.length;i++){if(obsY[i]>bestY)bestY=obsY[i]}' +
'if(obsX.length===0)bestY=0;' +
'for(var g=0;g<G;g++){var mu=gpMean[g],sig=gpStd[g];var val=0;' +
'if(acqMode===0){' +
// EI
'if(sig<1e-10){val=0}else{var z=(mu-bestY)/sig;val=(mu-bestY)*stdNormCDF(z)+sig*stdNormPDF(z)}}' +
'else{' +
// UCB
'val=mu+kappa*sig}' +
'acqVals.push(val)}}' +

// ── Canvas setup ──
'function setupCanvas(cv,h){var dpr=window.devicePixelRatio||1;var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw GP panel ──
'function drawGP(){' +
'var cv=document.getElementById("cvGP");' +
'var dim=setupCanvas(cv,200);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var pad={l:36,r:12,t:14,b:26};' +
'var pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;' +

// Y range
'var yMin=-2.5,yMax=2.5;' +
'for(var i=0;i<G;i++){var lo=gpMean[i]-2*gpStd[i],hi=gpMean[i]+2*gpStd[i];' +
'if(lo<yMin)yMin=lo;if(hi>yMax)yMax=hi}' +
'for(var i=0;i<obsY.length;i++){if(obsY[i]-0.3<yMin)yMin=obsY[i]-0.3;if(obsY[i]+0.3>yMax)yMax=obsY[i]+0.3}' +
'if(revealed){for(var i=0;i<G;i++){var v=trueF(xGrid[i]);if(v-0.3<yMin)yMin=v-0.3;if(v+0.3>yMax)yMax=v+0.3}}' +
'var yRng=yMax-yMin;if(yRng<1)yRng=1;' +
'function toX(x){return pad.l+x*pw}' +
'function toY(y){return pad.t+(yMax-y)/yRng*ph}' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var i=0;i<=4;i++){ctx.fillText((i/4).toFixed(1),toX(i/4),h-pad.b+14)}' +
'ctx.textAlign="right";' +
'for(var i=0;i<=4;i++){var yv=yMin+yRng*i/4;ctx.fillText(yv.toFixed(1),pad.l-4,toY(yv)+3)}' +

// True function (dashed black)
'if(revealed){ctx.strokeStyle=text3C;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();' +
'for(var i=0;i<G;i++){var px=toX(xGrid[i]),py=toY(trueF(xGrid[i]));' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();ctx.setLineDash([])}' +

// Uncertainty band
'if(gpMean.length===G){' +
'ctx.fillStyle=text3C;ctx.globalAlpha=0.12;ctx.beginPath();' +
'ctx.moveTo(toX(xGrid[0]),toY(gpMean[0]+2*gpStd[0]));' +
'for(var i=1;i<G;i++)ctx.lineTo(toX(xGrid[i]),toY(gpMean[i]+2*gpStd[i]));' +
'for(var i=G-1;i>=0;i--)ctx.lineTo(toX(xGrid[i]),toY(gpMean[i]-2*gpStd[i]));' +
'ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +

// GP mean
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<G;i++){var px=toX(xGrid[i]),py=toY(gpMean[i]);' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke()}' +

// Observation points
'for(var i=0;i<obsX.length;i++){' +
'ctx.fillStyle=textC;ctx.fillRect(toX(obsX[i])-4,toY(obsY[i])-4,8,8);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;ctx.strokeRect(toX(obsX[i])-4,toY(obsY[i])-4,8,8)}' +

// Suggest arrow
'if(suggestIdx>=0&&suggestIdx<G){var sx=toX(xGrid[suggestIdx]);' +
'ctx.fillStyle=accentC;ctx.beginPath();ctx.moveTo(sx,h-pad.b-4);ctx.lineTo(sx-5,h-pad.b+6);ctx.lineTo(sx+5,h-pad.b+6);ctx.closePath();ctx.fill();' +
'ctx.setLineDash([3,3]);ctx.strokeStyle=accentC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(sx,pad.t);ctx.lineTo(sx,h-pad.b);ctx.stroke();ctx.setLineDash([])}}' +

// ── Draw acquisition ──
'function drawAcq(){' +
'var cv=document.getElementById("cvAcq");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'if(acqVals.length===0)return;' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var pad={l:36,r:12,t:10,b:20};' +
'var pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;' +

// Y range
'var aMin=acqVals[0],aMax=acqVals[0];' +
'for(var i=1;i<acqVals.length;i++){if(acqVals[i]<aMin)aMin=acqVals[i];if(acqVals[i]>aMax)aMax=acqVals[i]}' +
'var aRng=aMax-aMin;if(aRng<1e-6)aRng=1;aMin-=aRng*0.05;aMax+=aRng*0.05;aRng=aMax-aMin;' +
'function toX(x){return pad.l+x*pw}' +
'function toY(v){return pad.t+(aMax-v)/aRng*ph}' +

// Axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +

// Fill under curve
'ctx.fillStyle=greenC;ctx.globalAlpha=0.1;ctx.beginPath();' +
'ctx.moveTo(toX(xGrid[0]),h-pad.b);' +
'for(var i=0;i<G;i++)ctx.lineTo(toX(xGrid[i]),toY(acqVals[i]));' +
'ctx.lineTo(toX(xGrid[G-1]),h-pad.b);ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +

// Curve
'ctx.strokeStyle=greenC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<G;i++){var px=toX(xGrid[i]),py=toY(acqVals[i]);' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +

// Peak marker
'var peakIdx=0;for(var i=1;i<G;i++){if(acqVals[i]>acqVals[peakIdx])peakIdx=i}' +
'var px=toX(xGrid[peakIdx]),py=toY(acqVals[peakIdx]);' +
'ctx.fillStyle=accentC;ctx.beginPath();ctx.moveTo(px,py-8);ctx.lineTo(px-5,py-2);ctx.lineTo(px+5,py-2);ctx.closePath();ctx.fill()}' +

// ── Stats ──
'function updateStats(){var box=document.getElementById("statsBox");' +
'var bestV=-1e10,bestI=-1;for(var i=0;i<obsY.length;i++){if(obsY[i]>bestV){bestV=obsY[i];bestI=i}}' +
'var rndBest=-1e10;for(var i=0;i<randY.length;i++){if(randY[i]>rndBest)rndBest=randY[i]}' +
'var acqLabel=acqMode===0?"EI":"UCB";' +
'var s="<span class=\\"hi\\">"+T.bestVal+"</span>: "+(obsY.length>0?bestV.toFixed(3):"\\u2014")+"<br>";' +
's+=T.samples+": <span class=\\"hi\\">"+obsX.length+"</span><br>";' +
's+=T.acqType+": <span class=\\"warn\\">"+acqLabel+"</span><br>";' +
'if(randY.length>0){s+=T.rndBest+" ("+randY.length+"): <span class=\\"rd\\">"+rndBest.toFixed(3)+"</span><br>"}' +
's+="<br>"+T.tapHint;' +
'box.innerHTML=s}' +

// ── Draw all ──
'function drawAll(){gpPredict();computeAcq();drawGP();drawAcq();updateStats();notifyHeight()}' +

// ── Sample at x ──
'function sampleAt(x){if(x<0)x=0;if(x>1)x=1;' +
'var y=trueF(x);obsX.push(x);obsY.push(y);suggestIdx=-1;drawAll()}' +

// ── Tap handler on GP canvas ──
'document.addEventListener("DOMContentLoaded",function(){' +
'var cv=document.getElementById("cvGP");' +
'cv.addEventListener("click",function(e){' +
'var rect=cv.getBoundingClientRect();var px=e.clientX-rect.left;' +
'var padL=36,padR=12;var pw=rect.width-padL-padR;' +
'var x=(px-padL)/pw;sampleAt(x)});' +
'cv.addEventListener("touchstart",function(e){' +
'e.preventDefault();var rect=cv.getBoundingClientRect();' +
'var px=e.touches[0].clientX-rect.left;' +
'var padL=36,padR=12;var pw=rect.width-padL-padR;' +
'var x=(px-padL)/pw;sampleAt(x)},{passive:false})});' +

// ── Event handlers ──
'function setAcq(mode){acqMode=mode;' +
'document.getElementById("preEI").className=mode===0?"preset active":"preset";' +
'document.getElementById("preUCB").className=mode===1?"preset active":"preset";' +
'drawAll()}' +

'function onSuggest(){computeAcq();' +
'var peakIdx=0;for(var i=1;i<G;i++){if(acqVals[i]>acqVals[peakIdx])peakIdx=i}' +
'suggestIdx=peakIdx;drawGP();drawAcq();notifyHeight()}' +

'function onRandom(){var x=Math.random();var y=trueF(x);randX.push(x);randY.push(y);drawAll()}' +

'function onReveal(){revealed=!revealed;' +
'document.getElementById("btnReveal").textContent=revealed?T.hideFn:T.showFn;' +
'document.getElementById("btnReveal").className=revealed?"btn btn-on":"btn";drawAll()}' +

'function onReset(){obsX=[];obsY=[];randX=[];randY=[];revealed=false;suggestIdx=-1;' +
'fIdx=Math.floor(Math.random()*funcs.length);' +
'document.getElementById("btnReveal").textContent=T.showFn;' +
'document.getElementById("btnReveal").className="btn";drawAll()}' +

// ── Height notification ──
'function notifyHeight(){var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-gp").textContent=T.gp;' +
'document.getElementById("lbl-acq").textContent=T.acq;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnSuggest").textContent=T.suggest;' +
'document.getElementById("btnRandom").textContent=T.random;' +
'document.getElementById("btnReveal").textContent=T.showFn;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'drawAll();' +
'window.addEventListener("resize",function(){drawAll()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
