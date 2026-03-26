/**
 * Curse of Dimensionality interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 3-tab demos: Volume Ratio, Distance Concentration, Data Requirement
 * - Tab A: Hypersphere/hypercube volume ratio vs dimension (1-20)
 * - Tab B: Max/min distance ratio concentration as dimension grows (1-50)
 * - Tab C: Data requirement bar chart showing 10^d growth (1-6)
 * - Dark/light theme, Korean/English bilingual
 */

export function getCurseSimulationHTML(isDark: boolean, lang: string): string {
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
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.tab-row{display:flex;gap:0;margin-bottom:8px}' +
'.tab{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;-webkit-tap-highlight-color:transparent}' +
'.tab:active{opacity:0.7}' +
'.tab.active{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.tab+.tab{border-left:0}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .gn{color:var(--green);font-weight:700}' +
'.demo-section{display:none}' +
'.demo-section.active{display:block}' +
'.formula{font-family:monospace;font-size:11px;color:var(--text2);text-align:center;margin:8px 0;line-height:1.6}' +
'</style></head><body>' +

// ── Tabs ──
'<div class="panel" style="padding-bottom:4px">' +
'<div class="label" id="lbl-title"></div>' +
'<div class="tab-row">' +
'<div class="tab active" id="tab0" onclick="switchTab(0)"></div>' +
'<div class="tab" id="tab1" onclick="switchTab(1)"></div>' +
'<div class="tab" id="tab2" onclick="switchTab(2)"></div>' +
'</div></div>' +

// ── Demo A: Volume Ratio ──
'<div class="demo-section active" id="demoA">' +
'<div class="panel"><div class="label" id="lblA-vis"></div>' +
'<canvas id="cvA" height="200"></canvas></div>' +
'<div class="panel"><div class="label" id="lblA-dim"></div>' +
'<div class="row"><span class="ctrl-name" id="lblA-d"></span>' +
'<input type="range" id="slA" min="1" max="20" value="2" oninput="onSliderA()">' +
'<span class="ctrl-val" id="valA"></span></div>' +
'<div class="formula" id="formulaA"></div>' +
'<div class="stats" id="statsA"></div></div></div>' +

// ── Demo B: Distance Concentration ──
'<div class="demo-section" id="demoB">' +
'<div class="panel"><div class="label" id="lblB-vis"></div>' +
'<canvas id="cvB" height="200"></canvas></div>' +
'<div class="panel"><div class="label" id="lblB-dim"></div>' +
'<div class="row"><span class="ctrl-name" id="lblB-d"></span>' +
'<input type="range" id="slB" min="1" max="50" value="2" oninput="onSliderB()">' +
'<span class="ctrl-val" id="valB"></span></div>' +
'<div class="stats" id="statsB"></div></div></div>' +

// ── Demo C: Data Requirement ──
'<div class="demo-section" id="demoC">' +
'<div class="panel"><div class="label" id="lblC-vis"></div>' +
'<canvas id="cvC" height="200"></canvas></div>' +
'<div class="panel"><div class="label" id="lblC-dim"></div>' +
'<div class="row"><span class="ctrl-name" id="lblC-d"></span>' +
'<input type="range" id="slC" min="1" max="6" value="2" oninput="onSliderC()">' +
'<span class="ctrl-val" id="valC"></span></div>' +
'<div class="stats" id="statsC"></div></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{title:"\\uCC28\\uC6D0\\uC758 \\uC800\\uC8FC",' +
'tab0:"\\uBD80\\uD53C \\uBE44\\uC728",tab1:"\\uAC70\\uB9AC \\uC9D1\\uC911",tab2:"\\uB370\\uC774\\uD130 \\uC694\\uAD6C\\uB7C9",' +
'visA:"\\uAD6C vs \\uD050\\uBE0C \\uBD80\\uD53C \\uBE44\\uC728",dimA:"\\uCC28\\uC6D0 \\uC124\\uC815",' +
'dim:"\\uCC28\\uC6D0",sphere:"\\uAD6C",cube:"\\uD050\\uBE0C",ratio:"\\uBE44\\uC728",' +
'visB:"\\uAC70\\uB9AC \\uBE44\\uC728 (max/min)",dimB:"\\uCC28\\uC6D0 \\uC124\\uC815",' +
'maxD:"\\uCD5C\\uB300 \\uAC70\\uB9AC",minD:"\\uCD5C\\uC18C \\uAC70\\uB9AC",distRatio:"max/min \\uBE44\\uC728",' +
'visC:"\\uD544\\uC694 \\uB370\\uC774\\uD130 \\uC218",dimC:"\\uCC28\\uC6D0 \\uC124\\uC815",' +
'dataReq:"\\uD544\\uC694 \\uB370\\uC774\\uD130",bins:"\\uBE48 \\uC218",' +
'insight1:"\\uCC28\\uC6D0\\uC774 \\uB192\\uC544\\uC9C8\\uC218\\uB85D \\uAD6C\\uC758 \\uBD80\\uD53C\\uAC00 \\uD050\\uBE0C\\uC5D0 \\uBE44\\uD574 \\uAC70\\uC758 0\\uC5D0 \\uC218\\uB834",' +
'insight2:"\\uACE0\\uCC28\\uC6D0\\uC5D0\\uC11C\\uB294 \\uBAA8\\uB4E0 \\uC810\\uC758 \\uAC70\\uB9AC\\uAC00 \\uBE44\\uC2B7\\uD574\\uC9D0",' +
'insight3:"\\uCC28\\uC6D0\\uC774 1 \\uB298\\uC5B4\\uB0A0 \\uB54C\\uB9C8\\uB2E4 \\uD544\\uC694 \\uB370\\uC774\\uD130\\uAC00 10\\uBC30 \\uC99D\\uAC00"},' +
'en:{title:"CURSE OF DIMENSIONALITY",' +
'tab0:"Volume",tab1:"Distance",tab2:"Data Req.",' +
'visA:"SPHERE vs CUBE VOLUME",dimA:"DIMENSION",' +
'dim:"Dim",sphere:"Sphere",cube:"Cube",ratio:"Ratio",' +
'visB:"DISTANCE RATIO (max/min)",dimB:"DIMENSION",' +
'maxD:"Max Dist",minD:"Min Dist",distRatio:"max/min Ratio",' +
'visC:"REQUIRED DATA POINTS",dimC:"DIMENSION",' +
'dataReq:"Data Needed",bins:"Bins",' +
'insight1:"As dimensions grow, sphere volume vanishes compared to cube",' +
'insight2:"In high dimensions, all pairwise distances become similar",' +
'insight3:"Each added dimension requires 10x more data"}' +
'};' +
'var T=L[LANG]||L.en;' +
'var curTab=0;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Tab switching ──
'function switchTab(idx){' +
'curTab=idx;' +
'var tabs=document.querySelectorAll(".tab");for(var i=0;i<tabs.length;i++){tabs[i].className=i===idx?"tab active":"tab"}' +
'var demos=document.querySelectorAll(".demo-section");for(var i=0;i<demos.length;i++){demos[i].className=i===idx?"demo-section active":"demo-section"}' +
'if(idx===0)drawA();else if(idx===1)drawB();else drawC();' +
'notifyHeight()}' +

// ── Log-Gamma (Lanczos) ──
'function lnGamma(z){' +
'var g=7;var c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,' +
'-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];' +
'if(z<0.5)return Math.log(Math.PI/Math.sin(Math.PI*z))-lnGamma(1-z);' +
'z-=1;var x=c[0];for(var i=1;i<g+2;i++)x+=c[i]/(z+i);' +
'var t=z+g+0.5;return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x)}' +

// ── Volume ratio: V_sphere / V_cube for d dimensions, radius=1, cube side=2 ──
'function volumeRatio(d){' +
'var lnVs=d/2*Math.log(Math.PI)-lnGamma(d/2+1);' + // ln(pi^(d/2) / Gamma(d/2+1))
'var lnVc=d*Math.log(2);' + // ln(2^d)
'return Math.exp(lnVs-lnVc)}' +

// ═══════════════════════════════════════
// Demo A: Volume Ratio
// ═══════════════════════════════════════
'function drawA(){' +
'var cv=document.getElementById("cvA");' +
'var dim=setupCanvas(cv,200);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var d=+document.getElementById("slA").value;' +
'var pad={l:40,r:16,t:16,b:28};' +
'var pw=w-pad.l-pad.r;var ph=h-pad.t-pad.b;' +

// Compute all ratios for plot
'var maxD=20;var ratios=[];' +
'for(var i=1;i<=maxD;i++){ratios.push(volumeRatio(i))}' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +

// Y axis labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("1.0",pad.l-4,pad.t+4);' +
'ctx.fillText("0.5",pad.l-4,pad.t+ph/2+4);' +
'ctx.fillText("0",pad.l-4,h-pad.b+4);' +

// X axis labels
'ctx.textAlign="center";' +
'for(var i=1;i<=maxD;i+=2){' +
'var x=pad.l+pw*(i-1)/(maxD-1);ctx.fillText(i.toString(),x,h-pad.b+14)}' +

// Grid lines
'ctx.strokeStyle=borderC;ctx.setLineDash([2,3]);ctx.lineWidth=0.5;' +
'for(var v=0.25;v<1;v+=0.25){var y=pad.t+(1-v)*ph;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke()}' +
'ctx.setLineDash([]);' +

// Plot line
'ctx.strokeStyle=tealC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var i=0;i<maxD;i++){' +
'var x=pad.l+pw*i/(maxD-1);var y=pad.t+(1-ratios[i])*ph;' +
'if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// Plot dots
'for(var i=0;i<maxD;i++){' +
'var x=pad.l+pw*i/(maxD-1);var y=pad.t+(1-ratios[i])*ph;' +
'ctx.fillStyle=(i+1===d)?accentC:tealC;' +
'ctx.beginPath();ctx.arc(x,y,(i+1===d)?5:2.5,0,6.28);ctx.fill()}' +

// Current dimension highlight
'var cx=pad.l+pw*(d-1)/(maxD-1);var cy=pad.t+(1-ratios[d-1])*ph;' +
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.setLineDash([3,2]);' +
'ctx.beginPath();ctx.moveTo(cx,pad.t);ctx.lineTo(cx,h-pad.b);ctx.stroke();ctx.setLineDash([]);' +

// Value label at current point
'ctx.fillStyle=accentC;ctx.font="10px monospace";ctx.textAlign="center";' +
'ctx.fillText(ratios[d-1].toFixed(4),cx,cy-8);' +

// 2D illustration (circle in square) on right side
'if(d<=3){' +
'var ix=w-pad.r-50;var iy=pad.t+10;var isz=40;' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(ix,iy,isz,isz);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(ix+isz/2,iy+isz/2,isz/2,0,6.28);ctx.stroke()}' +

// Update stats
'var r=ratios[d-1];' +
'var stats="<span class=\\"hi\\">"+T.dim+"</span>: "+d+"<br>";' +
'stats+=T.ratio+": <span class=\\"warn\\">"+r.toFixed(6)+"</span><br>";' +
'stats+="<br><span class=\\"warn\\">"+T.insight1+"</span>";' +
'document.getElementById("statsA").innerHTML=stats;' +
'document.getElementById("formulaA").textContent="V_sphere/V_cube = \\u03C0^(d/2) / (\\u0393(d/2+1) \\u00B7 2^d)";' +
'document.getElementById("valA").textContent=d;' +
'notifyHeight()}' +

'function onSliderA(){drawA()}' +

// ═══════════════════════════════════════
// Demo B: Distance Concentration
// ═══════════════════════════════════════
'function distConc(d){' +
// Generate 50 random points in d dimensions, compute max/min distance ratio
'var nPts=50;var pts=[];' +
'for(var i=0;i<nPts;i++){var p=[];for(var j=0;j<d;j++){p.push(Math.random())}pts.push(p)}' +
'var minDist=Infinity,maxDist=0;' +
'for(var i=0;i<nPts;i++){for(var j=i+1;j<nPts;j++){' +
'var s=0;for(var k=0;k<d;k++){var df=pts[i][k]-pts[j][k];s+=df*df}' +
'var dist=Math.sqrt(s);' +
'if(dist<minDist)minDist=dist;if(dist>maxDist)maxDist=dist}}' +
'return{maxD:maxDist,minD:minDist,ratio:minDist>0?maxDist/minDist:999}}' +

// Precompute for consistent display
'var distCache={};' +
'function getDistData(d){' +
'if(!distCache[d]){distCache[d]=distConc(d)}return distCache[d]}' +

'function drawB(){' +
'var cv=document.getElementById("cvB");' +
'var dim=setupCanvas(cv,200);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var d=+document.getElementById("slB").value;' +
'var pad={l:40,r:16,t:16,b:28};' +
'var pw=w-pad.l-pad.r;var ph=h-pad.t-pad.b;' +

// Compute ratios for all dimensions
'var maxD=50;var ratios=[];var maxR=0;' +
'for(var i=1;i<=maxD;i++){var dd=getDistData(i);ratios.push(dd.ratio);if(dd.ratio>maxR)maxR=dd.ratio}' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +

// Y axis
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(maxR.toFixed(1),pad.l-4,pad.t+4);' +
'ctx.fillText("1.0",pad.l-4,h-pad.b+4);' +

// X axis
'ctx.textAlign="center";' +
'for(var i=1;i<=maxD;i+=5){' +
'var x=pad.l+pw*(i-1)/(maxD-1);ctx.fillText(i.toString(),x,h-pad.b+14)}' +

// Reference line at ratio=1
'ctx.strokeStyle=accentC;ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.globalAlpha=0.5;' +
'var y1=pad.t+(maxR-1)/(maxR-1)*ph;' +
'ctx.beginPath();ctx.moveTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +
'ctx.setLineDash([]);ctx.globalAlpha=1;' +

// Plot
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<maxD;i++){' +
'var x=pad.l+pw*i/(maxD-1);var y=pad.t+(maxR-ratios[i])/(maxR-1)*ph;' +
'if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// Dots
'for(var i=0;i<maxD;i++){' +
'var x=pad.l+pw*i/(maxD-1);var y=pad.t+(maxR-ratios[i])/(maxR-1)*ph;' +
'ctx.fillStyle=(i+1===d)?accentC:tealC;' +
'ctx.beginPath();ctx.arc(x,y,(i+1===d)?5:2,0,6.28);ctx.fill()}' +

// Current dim line
'var cx=pad.l+pw*(d-1)/(maxD-1);' +
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.setLineDash([3,2]);' +
'ctx.beginPath();ctx.moveTo(cx,pad.t);ctx.lineTo(cx,h-pad.b);ctx.stroke();ctx.setLineDash([]);' +

// Stats
'var dd=getDistData(d);' +
'var stats="<span class=\\"hi\\">"+T.dim+"</span>: "+d+"<br>";' +
'stats+=T.maxD+": "+dd.maxD.toFixed(3)+"<br>";' +
'stats+=T.minD+": "+dd.minD.toFixed(3)+"<br>";' +
'stats+=T.distRatio+": <span class=\\"warn\\">"+dd.ratio.toFixed(3)+"</span><br>";' +
'stats+="<br><span class=\\"warn\\">"+T.insight2+"</span>";' +
'document.getElementById("statsB").innerHTML=stats;' +
'document.getElementById("valB").textContent=d;' +
'notifyHeight()}' +

'function onSliderB(){drawB()}' +

// ═══════════════════════════════════════
// Demo C: Data Requirement
// ═══════════════════════════════════════
'function drawC(){' +
'var cv=document.getElementById("cvC");' +
'var dim=setupCanvas(cv,200);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var d=+document.getElementById("slC").value;' +
'var pad={l:50,r:16,t:16,b:28};' +
'var pw=w-pad.l-pad.r;var ph=h-pad.t-pad.b;' +

// Data: 10^d for d=1..6
'var maxDim=6;var vals=[];var maxVal=Math.pow(10,maxDim);' +
'for(var i=1;i<=maxDim;i++){vals.push(Math.pow(10,i))}' +
// Use log scale for bar heights
'var logMax=maxDim;' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +

// Y axis labels (log scale)
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'for(var i=1;i<=maxDim;i++){' +
'var y=pad.t+(logMax-i)/logMax*ph;' +
'ctx.fillText("10^"+i,pad.l-4,y+4);' +
'ctx.strokeStyle=borderC;ctx.setLineDash([2,3]);ctx.lineWidth=0.5;' +
'ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();ctx.setLineDash([])}' +

// Bars
'var barW=pw/maxDim*0.6;var gap=pw/maxDim;' +
'for(var i=0;i<maxDim;i++){' +
'var logH=i+1;var barH=logH/logMax*ph;' +
'var x=pad.l+gap*i+gap*0.2;var y=h-pad.b-barH;' +
'ctx.fillStyle=(i+1===d)?accentC:tealC;' +
'ctx.globalAlpha=(i+1<=d)?1:0.3;' +
'ctx.fillRect(x,y,barW,barH);' +
'ctx.globalAlpha=1;' +
// border
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(x,y,barW,barH);' +
// label
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText((i+1)+"D",x+barW/2,h-pad.b+14);' +
// value above bar
'var valStr=vals[i]>=1000000?(vals[i]/1000000)+"M":vals[i]>=1000?(vals[i]/1000)+"K":vals[i].toString();' +
'ctx.fillStyle=(i+1===d)?accentC:tealC;ctx.font="10px monospace";' +
'ctx.fillText(valStr,x+barW/2,y-4)}' +

// Density illustration: show dots in a grid
'var dotArea={x:w-80,y:pad.t+8,w:60,h:60};' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(dotArea.x,dotArea.y,dotArea.w,dotArea.h);' +
'var binsPerSide=Math.min(d<=2?10:5,10);var totalBins=Math.pow(binsPerSide,Math.min(d,2));' +
'var nDots=Math.min(50,totalBins);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.6;' +
'for(var i=0;i<nDots;i++){' +
'var dx=dotArea.x+Math.random()*dotArea.w;var dy=dotArea.y+Math.random()*dotArea.h;' +
'ctx.beginPath();ctx.arc(dx,dy,2,0,6.28);ctx.fill()}' +
'ctx.globalAlpha=1;' +
// density label
'var density=nDots/totalBins;' +
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText(d+"D",dotArea.x+dotArea.w/2,dotArea.y+dotArea.h+12);' +

// Stats
'var req=Math.pow(10,d);' +
'var stats="<span class=\\"hi\\">"+T.dim+"</span>: "+d+"<br>";' +
'stats+=T.dataReq+": <span class=\\"warn\\">"+(req>=1000000?req/1000000+"M":req>=1000?req/1000+"K":req)+"</span> (10^"+d+")<br>";' +
'stats+=T.bins+": 10^"+d+" = "+req+"<br>";' +
'stats+="<br><span class=\\"warn\\">"+T.insight3+"</span>";' +
'document.getElementById("statsC").innerHTML=stats;' +
'document.getElementById("valC").textContent=d;' +
'notifyHeight()}' +

'function onSliderC(){drawC()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-title").textContent=T.title;' +
'document.getElementById("tab0").textContent=T.tab0;' +
'document.getElementById("tab1").textContent=T.tab1;' +
'document.getElementById("tab2").textContent=T.tab2;' +
'document.getElementById("lblA-vis").textContent=T.visA;' +
'document.getElementById("lblA-dim").textContent=T.dimA;' +
'document.getElementById("lblA-d").textContent=T.dim;' +
'document.getElementById("valA").textContent="2";' +
'document.getElementById("lblB-vis").textContent=T.visB;' +
'document.getElementById("lblB-dim").textContent=T.dimB;' +
'document.getElementById("lblB-d").textContent=T.dim;' +
'document.getElementById("valB").textContent="2";' +
'document.getElementById("lblC-vis").textContent=T.visC;' +
'document.getElementById("lblC-dim").textContent=T.dimC;' +
'document.getElementById("lblC-d").textContent=T.dim;' +
'document.getElementById("valC").textContent="2";' +

// ── Init ──
'drawA();' +
'window.addEventListener("resize",function(){if(curTab===0)drawA();else if(curTab===1)drawB();else drawC()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
