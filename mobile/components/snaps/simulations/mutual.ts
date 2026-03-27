/**
 * Mutual Information interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - X-Y scatter plot: shape changes with correlation (circle → ellipse → line)
 * - Venn diagram: H(X), H(Y) circles, overlap = I(X;Y) with animated resize
 * - Correlation slider: -1.0 to +1.0
 * - Distribution presets: Gaussian / Uniform / XOR-pattern (nonlinear dependence)
 * - Sample count slider, resample button
 * - Stats: I(X;Y), H(X), H(Y), H(X|Y), correlation r
 * - KEY INSIGHT: XOR pattern — r≈0 but MI>0
 * - Dark/light theme, Korean/English bilingual
 */

export function getMutualInfoSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;border-radius:8px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'</style></head><body>' +

// ── Scatter Plot Panel ──
'<div class="panel"><div class="label" id="lbl-scatter"></div>' +
'<canvas id="cvScatter" height="240"></canvas></div>' +

// ── Venn Diagram Panel ──
'<div class="panel"><div class="label" id="lbl-venn"></div>' +
'<canvas id="cvVenn" height="160"></canvas></div>' +

// ── Distribution Preset Panel ──
'<div class="panel"><div class="label" id="lbl-dist"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'</div></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-corr"></span>' +
'<input type="range" id="slCorr" min="-100" max="100" value="50" oninput="onCorrSlider()">' +
'<span class="ctrl-val" id="valCorr"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-count"></span>' +
'<input type="range" id="slCount" min="50" max="500" step="10" value="200" oninput="onCountSlider()">' +
'<span class="ctrl-val" id="valCount"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnResample" onclick="resample()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{scatter:"\\uC0B0\\uC810\\uB3C4 (X-Y)",venn:"\\uBCA4 \\uB2E4\\uC774\\uC5B4\\uADF8\\uB7A8",dist:"\\uBD84\\uD3EC \\uD0C0\\uC785",ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'corr:"\\uC0C1\\uAD00",count:"\\uC0D8\\uD50C \\uC218",resample:"\\u21BA \\uC7AC\\uC0D8\\uD50C\\uB9C1",' +
'pre0:"\\uAC00\\uC6B0\\uC2DC\\uC548",pre1:"\\uADE0\\uB4F1",pre2:"XOR \\uD328\\uD134",' +
'mi:"\\uC0C1\\uD638\\uC815\\uBCF4\\uB7C9 I(X;Y)",hx:"H(X)",hy:"H(Y)",hxy:"H(X|Y)",corrR:"\\uC0C1\\uAD00\\uACC4\\uC218 r",' +
'insight:"r\\u22480 \\uC774\\uC9C0\\uB9CC MI>0 \\u2014 \\uBE44\\uC120\\uD615 \\uC758\\uC874\\uC131 \\uAC10\\uC9C0!"},' +
'en:{scatter:"SCATTER PLOT (X-Y)",venn:"VENN DIAGRAM",dist:"DISTRIBUTION TYPE",ctrl:"CONTROLS",stats:"STATISTICS",' +
'corr:"Corr.",count:"Samples",resample:"\\u21BA Resample",' +
'pre0:"Gaussian",pre1:"Uniform",pre2:"XOR Pattern",' +
'mi:"Mutual Info I(X;Y)",hx:"H(X)",hy:"H(Y)",hxy:"H(X|Y)",corrR:"Correlation r",' +
'insight:"r\\u22480 but MI>0 \\u2014 nonlinear dependence detected!"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var corr=0.5;' +
'var sampleCount=200;' +
'var presetIdx=0;' +
'var dataX=[],dataY=[];' +
'var NBINS=15;' +

// ── Box-Muller ──
'function randn(){' +
'var u1=Math.random(),u2=Math.random();' +
'return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}' +

// ── Generate samples ──
'function generateGaussian(){' +
'dataX=[];dataY=[];' +
'for(var i=0;i<sampleCount;i++){' +
'var z1=randn(),z2=randn();' +
'var x=z1;' +
'var y=corr*z1+Math.sqrt(1-corr*corr)*z2;' +
'dataX.push(x);dataY.push(y)}}' +

'function generateUniform(){' +
'dataX=[];dataY=[];' +
'for(var i=0;i<sampleCount;i++){' +
'var u1=Math.random()*2-1,u2=Math.random()*2-1;' +
'var x=u1;' +
'var y=corr*u1+Math.sqrt(Math.max(0,1-corr*corr))*u2;' +
'dataX.push(x);dataY.push(y)}}' +

'function generateXOR(){' +
'dataX=[];dataY=[];' +
// Four clusters: (++) (--) have high Z, (+-) (-+) have low Z
'for(var i=0;i<sampleCount;i++){' +
'var cluster=Math.floor(Math.random()*4);' +
'var cx,cy;' +
'if(cluster===0){cx=0.7;cy=0.7}' +
'else if(cluster===1){cx=-0.7;cy=-0.7}' +
'else if(cluster===2){cx=0.7;cy=-0.7}' +
'else{cx=-0.7;cy=0.7}' +
'dataX.push(cx+randn()*0.18);' +
'dataY.push(cy+randn()*0.18)}}' +

'var generators=[generateGaussian,generateUniform,generateXOR];' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Compute statistics ──
'function computeCorrelation(){' +
'var n=dataX.length;if(n<2)return 0;' +
'var mx=0,my=0;for(var i=0;i<n;i++){mx+=dataX[i];my+=dataY[i]}mx/=n;my/=n;' +
'var sxy=0,sxx=0,syy=0;' +
'for(var i=0;i<n;i++){var dx=dataX[i]-mx,dy=dataY[i]-my;sxy+=dx*dy;sxx+=dx*dx;syy+=dy*dy}' +
'var denom=Math.sqrt(sxx*syy);return denom>0?sxy/denom:0}' +

'function computeMI(){' +
'var n=dataX.length;if(n<2)return{mi:0,hx:0,hy:0,hxy:0};' +
// Find data range
'var xMin=dataX[0],xMax=dataX[0],yMin=dataY[0],yMax=dataY[0];' +
'for(var i=1;i<n;i++){' +
'if(dataX[i]<xMin)xMin=dataX[i];if(dataX[i]>xMax)xMax=dataX[i];' +
'if(dataY[i]<yMin)yMin=dataY[i];if(dataY[i]>yMax)yMax=dataY[i]}' +
'var xRange=xMax-xMin||1;var yRange=yMax-yMin||1;' +
// Add margin
'xMin-=xRange*0.05;xMax+=xRange*0.05;' +
'yMin-=yRange*0.05;yMax+=yRange*0.05;' +
'xRange=xMax-xMin;yRange=yMax-yMin;' +
// Bin the data
'var joint=[];for(var i=0;i<NBINS;i++){joint[i]=[];for(var j=0;j<NBINS;j++)joint[i][j]=0}' +
'var margX=[];var margY=[];for(var i=0;i<NBINS;i++){margX[i]=0;margY[i]=0}' +
'for(var i=0;i<n;i++){' +
'var bx=Math.floor((dataX[i]-xMin)/xRange*NBINS);' +
'var by=Math.floor((dataY[i]-yMin)/yRange*NBINS);' +
'bx=Math.max(0,Math.min(NBINS-1,bx));' +
'by=Math.max(0,Math.min(NBINS-1,by));' +
'joint[bx][by]++;margX[bx]++;margY[by]++}' +
// Compute entropies
'var hx=0,hy=0,hxy=0;' +
'for(var i=0;i<NBINS;i++){' +
'var px=margX[i]/n;if(px>0)hx-=px*Math.log2(px);' +
'var py=margY[i]/n;if(py>0)hy-=py*Math.log2(py)}' +
'var hj=0;' +
'for(var i=0;i<NBINS;i++){for(var j=0;j<NBINS;j++){' +
'var pxy=joint[i][j]/n;if(pxy>0)hj-=pxy*Math.log2(pxy)}}' +
'var mi=hx+hy-hj;if(mi<0)mi=0;' +
'var hxy2=hj-hy;if(hxy2<0)hxy2=0;' +
'return{mi:mi,hx:hx,hy:hy,hxy:hxy2}}' +

// ── Draw scatter plot ──
'function drawScatter(){' +
'var cv=document.getElementById("cvScatter");' +
'var dim=setupCanvas(cv,240);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var n=dataX.length;if(n===0)return;' +
// Find range
'var xMin=dataX[0],xMax=dataX[0],yMin=dataY[0],yMax=dataY[0];' +
'for(var i=1;i<n;i++){' +
'if(dataX[i]<xMin)xMin=dataX[i];if(dataX[i]>xMax)xMax=dataX[i];' +
'if(dataY[i]<yMin)yMin=dataY[i];if(dataY[i]>yMax)yMax=dataY[i]}' +
'var xRange=xMax-xMin||1;var yRange=yMax-yMin||1;' +
'xMin-=xRange*0.1;xMax+=xRange*0.1;yMin-=yRange*0.1;yMax+=yRange*0.1;' +
'xRange=xMax-xMin;yRange=yMax-yMin;' +
// Plot area
'var pad=36;var pr=14;var pb=28;var pt=14;' +
'var pw=w-pad-pr;var ph=h-pt-pb;' +
'function toX(v){return pad+(v-xMin)/xRange*pw}' +
'function toY(v){return pt+ph-(v-yMin)/yRange*ph}' +
// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
// Grid
'ctx.setLineDash([2,3]);' +
'for(var i=1;i<5;i++){var xv=xMin+i/5*xRange;ctx.beginPath();ctx.moveTo(toX(xv),pt);ctx.lineTo(toX(xv),h-pb);ctx.stroke()}' +
'for(var i=1;i<5;i++){var yv=yMin+i/5*yRange;ctx.beginPath();ctx.moveTo(pad,toY(yv));ctx.lineTo(w-pr,toY(yv));ctx.stroke()}' +
'ctx.setLineDash([]);' +
// Axis labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText("X",w/2,h-4);' +
'ctx.save();ctx.translate(10,h/2);ctx.rotate(-Math.PI/2);ctx.fillText("Y",0,0);ctx.restore();' +
// Draw points
'ctx.fillStyle=tealC;ctx.globalAlpha=0.55;' +
'for(var i=0;i<n;i++){' +
'ctx.beginPath();' +
'ctx.arc(toX(dataX[i]),toY(dataY[i]),3,0,Math.PI*2);' +
'ctx.fill()}' +
'ctx.globalAlpha=1}' +

// ── Draw Venn diagram ──
'function drawVenn(){' +
'var cv=document.getElementById("cvVenn");' +
'var dim=setupCanvas(cv,160);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var isDk=document.documentElement.classList.contains("dark");' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
// Compute MI values
'var info=computeMI();' +
'var maxH=Math.max(info.hx,info.hy,0.01);' +
// Circle sizes proportional to entropy
'var maxR=Math.min(w*0.22,h*0.4);' +
'var rX=Math.max(20,Math.sqrt(info.hx/maxH)*maxR);' +
'var rY=Math.max(20,Math.sqrt(info.hy/maxH)*maxR);' +
// Overlap proportional to MI
'var overlapFrac=maxH>0?Math.min(info.mi/maxH,0.95):0;' +
// Distance between circle centers: less distance = more overlap
'var dist=rX+rY-overlapFrac*(rX+rY)*0.8;' +
'var cx=w/2;var cy=h/2;' +
'var x1=cx-dist*0.4;var x2=cx+dist*0.4;' +
// Draw H(X) circle
'ctx.beginPath();ctx.arc(x1,cy,rX,0,Math.PI*2);' +
'ctx.fillStyle=isDk?"rgba(94,234,212,0.15)":"rgba(94,234,212,0.12)";ctx.fill();' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.stroke();' +
// Draw H(Y) circle
'ctx.beginPath();ctx.arc(x2,cy,rY,0,Math.PI*2);' +
'ctx.fillStyle=isDk?"rgba(245,158,11,0.15)":"rgba(180,83,9,0.12)";ctx.fill();' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.stroke();' +
// Draw overlap (MI) — intersection region
'if(overlapFrac>0.01){' +
'ctx.save();' +
'ctx.beginPath();ctx.arc(x1,cy,rX,0,Math.PI*2);ctx.clip();' +
'ctx.beginPath();ctx.arc(x2,cy,rY,0,Math.PI*2);' +
'ctx.fillStyle=isDk?"rgba(94,234,212,0.5)":"rgba(13,115,119,0.35)";ctx.fill();' +
'ctx.restore()}' +
// Labels
'ctx.fillStyle=textC;ctx.font="bold 11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText("H(X)",x1-rX*0.3,cy-rY*0.1);' +
'ctx.fillText("H(Y)",x2+rY*0.3,cy-rY*0.1);' +
// MI value in center
'if(overlapFrac>0.02){' +
'ctx.fillStyle=isDk?"#fff":"#000";' +
'ctx.font="bold 10px monospace";' +
'ctx.fillText("I="+info.mi.toFixed(2),(x1+x2)/2,cy+4)}' +
// Values below
'ctx.fillStyle=text3C;ctx.font="9px monospace";' +
'ctx.fillText(info.hx.toFixed(2)+" bits",x1,cy+rX+14);' +
'ctx.fillText(info.hy.toFixed(2)+" bits",x2,cy+rY+14);' +
'}' +

// ── Draw all ──
'function drawAll(){drawScatter();drawVenn()}' +

// ── Resample ──
'function resample(){generators[presetIdx]();drawAll();updateStats();notifyHeight()}' +

// ── Correlation slider ──
'function onCorrSlider(){' +
'corr=+document.getElementById("slCorr").value/100;' +
'document.getElementById("valCorr").textContent=corr.toFixed(2);' +
'resample()}' +

// ── Count slider ──
'function onCountSlider(){' +
'sampleCount=+document.getElementById("slCount").value;' +
'document.getElementById("valCount").textContent=sampleCount;' +
'resample()}' +

// ── Preset ──
'function onPreset(idx){' +
'presetIdx=idx;' +
'for(var i=0;i<3;i++){' +
'document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
// XOR preset disables corr slider
'var slCorr=document.getElementById("slCorr");' +
'if(idx===2){slCorr.disabled=true;slCorr.style.opacity="0.3"}' +
'else{slCorr.disabled=false;slCorr.style.opacity="1"}' +
'resample()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var info=computeMI();' +
'var r=computeCorrelation();' +
'var s="<span class=\\"hi\\">"+T.mi+"</span> "+info.mi.toFixed(4)+" bits<br>";' +
's+=T.hx+": "+info.hx.toFixed(4)+" | "+T.hy+": "+info.hy.toFixed(4)+"<br>";' +
's+=T.hxy+": "+info.hxy.toFixed(4)+"<br>";' +
's+=T.corrR+": <span class=\\"warn\\">"+r.toFixed(4)+"</span><br>";' +
// XOR insight
'if(presetIdx===2&&Math.abs(r)<0.15&&info.mi>0.1){' +
's+="<br><span class=\\"warn\\">"+T.insight+"</span>"}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-scatter").textContent=T.scatter;' +
'document.getElementById("lbl-venn").textContent=T.venn;' +
'document.getElementById("lbl-dist").textContent=T.dist;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-corr").textContent=T.corr;' +
'document.getElementById("lbl-count").textContent=T.count;' +
'document.getElementById("valCorr").textContent="0.50";' +
'document.getElementById("valCount").textContent="200";' +
'document.getElementById("btnResample").textContent=T.resample;' +
'document.getElementById("pre0").textContent=T.pre0;' +
'document.getElementById("pre1").textContent=T.pre1;' +
'document.getElementById("pre2").textContent=T.pre2;' +

// ── Init ──
'generateGaussian();drawAll();updateStats();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
