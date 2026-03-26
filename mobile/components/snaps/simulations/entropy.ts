/**
 * Shannon Entropy — Interactive Probability Bars simulation
 *
 * Features:
 * - Bar chart with 4 draggable probability bars, auto-normalized to sum=1
 * - Entropy H = -sum(p_i * log2(p_i)) displayed prominently
 * - Stats panel with per-event probability, surprise, and entropy
 * - Presets: Coin (2 bars), Die (6 bars), Certain (1=1), Uniform (4 equal)
 * - 100 Trials sampling button with running average surprise convergence
 * - Cross-Entropy toggle with second distribution Q
 * - Dark/light theme, Korean/English bilingual
 */

export function getEntropySimulationHTML(isDark: boolean, lang: string): string {
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
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:56px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'</style></head><body>' +

// ── Bar Chart Canvas ──
'<div class="panel"><div class="label" id="lbl-bars"></div>' +
'<canvas id="cvBars" height="220"></canvas></div>' +

// ── Presets + Buttons ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="preset-row">' +
'<div class="preset" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'<div class="preset active" id="pre3" onclick="onPreset(3)"></div>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnTrials" onclick="runTrials()"></div>' +
'<div class="btn" id="btnCross" onclick="toggleCross()"></div>' +
'<div class="btn" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Trials Mini Graph ──
'<div class="panel" id="trialsPanel" style="display:none"><div class="label" id="lbl-trials"></div>' +
'<canvas id="cvTrials" height="120"></canvas></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{bars:"\\uD655\\uB960 \\uBD84\\uD3EC",ctrl:"\\uC81C\\uC5B4",stats:"\\uD1B5\\uACC4",trials:"\\uC2DC\\uD589 \\uACB0\\uACFC",' +
'coin:"\\uB3D9\\uC804",die:"\\uC8FC\\uC0AC\\uC704",certain:"\\uD655\\uC2E4",uniform:"\\uADE0\\uB4F1",' +
'runTrials:"100 \\uC2DC\\uD589",crossOn:"\\uAD50\\uCC28 \\uC5D4\\uD2B8\\uB85C\\uD53C ON",crossOff:"\\uAD50\\uCC28 \\uC5D4\\uD2B8\\uB85C\\uD53C OFF",reset:"\\u21BA \\uB9AC\\uC14B",' +
'entropy:"\\uC100\\uB10C \\uC5D4\\uD2B8\\uB85C\\uD53C",prob:"\\uD655\\uB960",surprise:"\\uB180\\uB77C\\uC6C0",info:"\\uC815\\uBCF4\\uB7C9",' +
'crossEntropy:"\\uAD50\\uCC28 \\uC5D4\\uD2B8\\uB85C\\uD53C",trueP:"\\uC2E4\\uC81C \\uBD84\\uD3EC(P)",modelQ:"\\uBAA8\\uB378 \\uBD84\\uD3EC(Q)",' +
'avgSurprise:"\\uD3C9\\uADE0 \\uB180\\uB77C\\uC6C0",converges:"\\u2192 H\\uB85C \\uC218\\uB834",' +
'dragTip:"\\uB9C9\\uB300 \\uB4DC\\uB798\\uADF8\\uB85C \\uD655\\uB960 \\uC870\\uC808"},' +
'en:{bars:"PROBABILITY DISTRIBUTION",ctrl:"CONTROLS",stats:"STATISTICS",trials:"TRIAL RESULTS",' +
'coin:"Coin",die:"Die",certain:"Certain",uniform:"Uniform",' +
'runTrials:"100 Trials",crossOn:"Cross-Entropy ON",crossOff:"Cross-Entropy OFF",reset:"\\u21BA Reset",' +
'entropy:"Shannon Entropy",prob:"Probability",surprise:"Surprise",info:"Information",' +
'crossEntropy:"Cross-Entropy",trueP:"True Dist(P)",modelQ:"Model Dist(Q)",' +
'avgSurprise:"Avg Surprise",converges:"\\u2192 converges to H",' +
'dragTip:"Drag bar tops to adjust probability"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var P=[0.25,0.25,0.25,0.25];' +
'var Q=[0.25,0.25,0.25,0.25];' +
'var showCross=false;' +
'var COLORS=["#5EEAD4","#F59E0B","#4ADE80","#F87171","#A78BFA","#FB923C"];' +
'var LABELS=["A","B","C","D","E","F"];' +
'var trialData=[];' +
'var dragging=-1;var dragIsQ=false;' +

// ── Helpers ──
'function log2(x){return x>0?Math.log(x)/Math.LN2:0}' +
'function entropy(p){var h=0;for(var i=0;i<p.length;i++){if(p[i]>0.0001)h-=p[i]*log2(p[i])}return h}' +
'function crossEntropy(p,q){var h=0;for(var i=0;i<p.length;i++){if(p[i]>0.0001&&q[i]>0.0001)h-=p[i]*log2(q[i])}return h}' +
'function normalize(arr){var s=0;for(var i=0;i<arr.length;i++)s+=arr[i];' +
'if(s<0.001){for(var i=0;i<arr.length;i++)arr[i]=1/arr.length;return}' +
'for(var i=0;i<arr.length;i++)arr[i]/=s}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw bar chart ──
'function drawBars(){' +
'var cv=document.getElementById("cvBars");' +
'var dim=setupCanvas(cv,220);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var n=P.length;' +
'var pad=30;var pb=28;var pt=36;' +
'var gW=w-pad*2;var gH=h-pt-pb;' +
'var barW=showCross?gW/(n*2.5+0.5):gW/(n*1.5+0.5);' +
'var gap=barW*0.5;' +

// entropy display
'var H=entropy(P);' +
'ctx.fillStyle=tealC;ctx.font="bold 16px monospace";ctx.textAlign="center";' +
'ctx.fillText("H = "+H.toFixed(3)+" bits",w/2,20);' +
'if(showCross){var HCross=crossEntropy(P,Q);' +
'ctx.fillStyle=accentC;ctx.font="bold 12px monospace";' +
'ctx.fillText("H(P,Q) = "+HCross.toFixed(3)+" bits",w/2,pt-4)}' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pad,h-pb);ctx.stroke();' +

// y label
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("1.0",pad-3,pt+4);ctx.fillText("0.5",pad-3,pt+gH/2+3);ctx.fillText("0",pad-3,h-pb+3);' +

// bars
'for(var i=0;i<n;i++){' +
'var x;' +
'if(showCross){x=pad+gap+i*(barW*2+gap)}' +
'else{x=pad+gap+i*(barW+gap)}' +
'var bh=P[i]*gH;var by=h-pb-bh;' +
// P bar
'ctx.fillStyle=COLORS[i%COLORS.length];ctx.globalAlpha=0.7;' +
'ctx.fillRect(x,by,barW,bh);ctx.globalAlpha=1;' +
'ctx.strokeStyle=COLORS[i%COLORS.length];ctx.lineWidth=2;' +
'ctx.strokeRect(x,by,barW,bh);' +
// label
'ctx.fillStyle=textC;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(LABELS[i],x+barW/2,h-pb+14);' +
// probability text
'ctx.fillStyle=text3C;ctx.font="9px monospace";' +
'ctx.fillText(P[i].toFixed(2),x+barW/2,by-4);' +

// Q bar (if cross-entropy mode)
'if(showCross){' +
'var qx=x+barW+2;var qh=Q[i]*gH;var qy=h-pb-qh;' +
'ctx.fillStyle=accentC;ctx.globalAlpha=0.4;' +
'ctx.fillRect(qx,qy,barW,qh);ctx.globalAlpha=1;' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.setLineDash([3,2]);' +
'ctx.strokeRect(qx,qy,barW,qh);ctx.setLineDash([]);' +
'ctx.fillStyle=accentC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText(Q[i].toFixed(2),qx+barW/2,qy-4)}' +
'}' +

// legend for cross-entropy mode
'if(showCross){' +
'ctx.fillStyle=tealC;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.fillRect(pad+4,pt+4,10,10);ctx.fillStyle=text3C;ctx.fillText(T.trueP,pad+18,pt+13);' +
'ctx.fillStyle=accentC;ctx.globalAlpha=0.5;ctx.fillRect(pad+90,pt+4,10,10);ctx.globalAlpha=1;' +
'ctx.fillStyle=text3C;ctx.fillText(T.modelQ,pad+104,pt+13)}' +
'}' +

// ── Draw trials mini-graph ──
'function drawTrials(){' +
'if(trialData.length===0)return;' +
'document.getElementById("trialsPanel").style.display="block";' +
'var cv=document.getElementById("cvTrials");' +
'var dim=setupCanvas(cv,120);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=8;var gW=w-pad*2;var gH=h-pad*2;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();' +

// find range
'var maxV=0;for(var i=0;i<trialData.length;i++){if(trialData[i]>maxV)maxV=trialData[i]}' +
'maxV=Math.max(maxV,entropy(P)+0.5);' +
'var H=entropy(P);' +

// H reference line
'ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.setLineDash([5,3]);' +
'var hY=pad+(maxV-H)/maxV*gH;' +
'ctx.beginPath();ctx.moveTo(pad,hY);ctx.lineTo(w-pad,hY);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=tealC;ctx.font="9px monospace";ctx.textAlign="left";' +
'ctx.fillText("H="+H.toFixed(2),pad+4,hY-3);' +

// running average line
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<trialData.length;i++){' +
'var x=pad+(i/(trialData.length-1||1))*gW;' +
'var y=pad+(maxV-trialData[i])/maxV*gH;' +
'if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";ctx.fillStyle=text3C;' +
'ctx.fillText(T.avgSurprise+" "+T.converges,pad+4,pad+10);' +
'}' +

// ── Pointer handling for bar dragging ──
'function getBarIndex(e,isQ){' +
'var cv=document.getElementById("cvBars");' +
'var rect=cv.getBoundingClientRect();' +
'var x=e.clientX-rect.left;' +
'var w=rect.width;var n=P.length;' +
'var pad=30;var gW=w-pad*2;' +
'var barW=showCross?gW/(n*2.5+0.5):gW/(n*1.5+0.5);' +
'var gap=barW*0.5;' +
'for(var i=0;i<n;i++){' +
'var bx;if(showCross){bx=pad+gap+i*(barW*2+gap)}else{bx=pad+gap+i*(barW+gap)}' +
'if(!isQ&&x>=bx&&x<=bx+barW)return i;' +
'if(isQ&&showCross){var qx=bx+barW+2;if(x>=qx&&x<=qx+barW)return i}}' +
'return -1}' +

'function getBarProb(e){' +
'var cv=document.getElementById("cvBars");' +
'var rect=cv.getBoundingClientRect();' +
'var y=e.clientY-rect.top;' +
'var h=rect.height;var pt=36;var pb=28;var gH=h-pt-pb;' +
'var p=1-(y-pt)/gH;' +
'return Math.max(0.01,Math.min(1,p))}' +

'document.getElementById("cvBars").addEventListener("pointerdown",function(e){' +
'e.preventDefault();' +
// check Q bars first if cross mode
'var qi=showCross?getBarIndex(e,true):-1;' +
'if(qi>=0){dragging=qi;dragIsQ=true;return}' +
'var pi=getBarIndex(e,false);' +
'if(pi>=0){dragging=pi;dragIsQ=false}});' +

'document.addEventListener("pointermove",function(e){' +
'if(dragging<0)return;e.preventDefault();' +
'var p=getBarProb(e);' +
'var arr=dragIsQ?Q:P;' +
'arr[dragging]=p;normalize(arr);' +
'drawBars();updateStats()});' +

'document.addEventListener("pointerup",function(){' +
'if(dragging>=0){dragging=-1;notifyHeight()}});' +

// ── Presets ──
// 0=Coin(2), 1=Die(6), 2=Certain(4,first=1), 3=Uniform(4)
'function onPreset(idx){' +
'trialData=[];document.getElementById("trialsPanel").style.display="none";' +
'for(var i=0;i<4;i++){document.getElementById("pre"+i).className=(i===idx)?"preset active":"preset"}' +
'if(idx===0){P=[0.5,0.5];Q=[0.5,0.5]}' +
'else if(idx===1){P=[1/6,1/6,1/6,1/6,1/6,1/6];Q=[1/6,1/6,1/6,1/6,1/6,1/6]}' +
'else if(idx===2){P=[1,0.001,0.001,0.001];normalize(P);P[0]=0.997;P[1]=0.001;P[2]=0.001;P[3]=0.001;Q=[0.25,0.25,0.25,0.25]}' +
'else{P=[0.25,0.25,0.25,0.25];Q=[0.25,0.25,0.25,0.25]}' +
'drawBars();updateStats();notifyHeight()}' +

// ── 100 Trials ──
'function runTrials(){' +
'trialData=[];var cumSurprise=0;' +
'for(var t=0;t<100;t++){' +
// sample from P
'var r=Math.random();var cum=0;var chosen=0;' +
'for(var i=0;i<P.length;i++){cum+=P[i];if(r<=cum){chosen=i;break}}' +
'var surprise=P[chosen]>0.0001?-log2(P[chosen]):20;' +
'cumSurprise+=surprise;' +
'trialData.push(cumSurprise/(t+1))}' +
'drawTrials();notifyHeight()}' +

// ── Cross-Entropy toggle ──
'function toggleCross(){' +
'showCross=!showCross;' +
'document.getElementById("btnCross").textContent=showCross?T.crossOff:T.crossOn;' +
'document.getElementById("btnCross").className=showCross?"btn btn-stop":"btn";' +
// reset Q to uniform
'Q=[];for(var i=0;i<P.length;i++)Q.push(1/P.length);' +
'drawBars();updateStats();notifyHeight()}' +

// ── Reset ──
'function doReset(){' +
'P=[0.25,0.25,0.25,0.25];Q=[0.25,0.25,0.25,0.25];' +
'showCross=false;trialData=[];' +
'document.getElementById("trialsPanel").style.display="none";' +
'document.getElementById("btnCross").textContent=T.crossOn;' +
'document.getElementById("btnCross").className="btn";' +
'for(var i=0;i<4;i++){document.getElementById("pre"+i).className=(i===3)?"preset active":"preset"}' +
'drawBars();updateStats();notifyHeight()}' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var H=entropy(P);' +
'var s="<span class=\\"hi\\">"+T.entropy+"</span> H = "+H.toFixed(4)+" bits<br>";' +
'for(var i=0;i<P.length;i++){' +
'var surp=P[i]>0.0001?-log2(P[i]):0;' +
's+=LABELS[i]+": p="+P[i].toFixed(3)+", "+T.surprise+"="+surp.toFixed(2)+" bits<br>"}' +
'if(showCross){var HCross=crossEntropy(P,Q);' +
's+="<br><span class=\\"warn\\">"+T.crossEntropy+"</span> H(P,Q) = "+HCross.toFixed(4)+" bits"}' +
'if(!showCross&&trialData.length===0){s+="<br>"+T.dragTip}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-bars").textContent=T.bars;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-trials").textContent=T.trials;' +
'document.getElementById("pre0").textContent=T.coin;' +
'document.getElementById("pre1").textContent=T.die;' +
'document.getElementById("pre2").textContent=T.certain;' +
'document.getElementById("pre3").textContent=T.uniform;' +
'document.getElementById("btnTrials").textContent=T.runTrials;' +
'document.getElementById("btnCross").textContent=T.crossOn;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'drawBars();updateStats();' +
'window.addEventListener("resize",function(){drawBars();if(trialData.length>0)drawTrials();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
