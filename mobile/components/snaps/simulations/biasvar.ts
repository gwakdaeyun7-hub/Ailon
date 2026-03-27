/**
 * Bias-Variance Tradeoff interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Scatter plot with ~20 data points from sin(2*pi*x) + noise
 * - Polynomial fit curve with adjustable degree (1-15)
 * - Bottom U-shaped curve: Bias^2, Variance, Total Error vs complexity
 * - Noise slider (sigma 0.1-0.5)
 * - "New Data" button, "Overlay All Fits" toggle (after 5+ datasets)
 * - "Show True Function" toggle for hidden sine curve
 * - Dark/light theme, Korean/English bilingual
 */

export function getBiasVarSimulationHTML(isDark: boolean, lang: string): string {
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
'.legend-row{display:flex;align-items:center;gap:10px;margin-bottom:6px;flex-wrap:wrap}' +
'.legend-item{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:600}' +
'.legend-dot{width:10px;height:3px;border:1px solid var(--border)}' +
'.legend-dash{width:10px;height:0;border-top:2px dashed var(--text3)}' +
'</style></head><body>' +

// ── Scatter Plot Panel ──
'<div class="panel"><div class="label" id="lbl-plot"></div>' +
'<canvas id="cvPlot" height="200"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-params"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-degree"></span>' +
'<input type="range" id="slDeg" min="1" max="15" value="3" oninput="onDegree()">' +
'<span class="ctrl-val" id="valDeg"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-noise"></span>' +
'<input type="range" id="slNoise" min="10" max="50" value="25" oninput="onNoise()">' +
'<span class="ctrl-val" id="valNoise"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnNew" onclick="onNewData()"></div>' +
'<div class="btn" id="btnOverlay" onclick="onOverlay()"></div>' +
'<div class="btn" id="btnTrue" onclick="onToggleTrue()"></div>' +
'</div></div>' +

// ── U-Curve Panel ──
'<div class="panel"><div class="label" id="lbl-ucurve"></div>' +
'<div class="legend-row" id="legendBox"></div>' +
'<canvas id="cvUcurve" height="140"></canvas></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{plot:"\\uD3F4\\uB9AC\\uB178\\uBBF8\\uC5BC \\uD53C\\uD305",params:"\\uD30C\\uB77C\\uBBF8\\uD130",' +
'degree:"\\uB2E4\\uD56D\\uC2DD \\uCC28\\uC218",noise:"\\uB178\\uC774\\uC988(\\u03C3)",' +
'ucurve:"\\uD3B8\\uD5A5-\\uBD84\\uC0B0 \\uD2B8\\uB808\\uC774\\uB4DC\\uC624\\uD504",' +
'stats:"\\uD1B5\\uACC4",newData:"\\uC0C8 \\uB370\\uC774\\uD130",' +
'overlay:"\\uBAA8\\uB4E0 \\uD53C\\uD305 \\uACA9\\uCE58\\uAE30",clearOverlay:"\\uACA9\\uCE58\\uAE30 \\uC9C0\\uC6B0\\uAE30",' +
'showTrue:"\\uCC38 \\uD568\\uC218",hideTrue:"\\uCC38 \\uD568\\uC218 \\uC228\\uAE30\\uAE30",' +
'trueFn:"\\uCC38 \\uD568\\uC218",data:"\\uB370\\uC774\\uD130",fit:"\\uD53C\\uD305",' +
'bias2:"\\uD3B8\\uD5A5\\u00B2",variance:"\\uBD84\\uC0B0",total:"\\uCD1D \\uC624\\uCC28",' +
'degreeN:"\\uCC28\\uC218",trainMSE:"\\uD559\\uC2B5 MSE",' +
'underfit:"\\uACFC\\uC18C\\uC801\\uD569",goodfit:"\\uC801\\uC808",overfit:"\\uACFC\\uC801\\uD569",' +
'needMore:"5\\uD68C \\uC774\\uC0C1 \\uC0C8 \\uB370\\uC774\\uD130 \\uD6C4 \\uC0AC\\uC6A9 \\uAC00\\uB2A5",' +
'overlayN:"\\uACA9\\uCE58\\uAE30 \\uD53C\\uD305"},' +
'en:{plot:"POLYNOMIAL FIT",params:"PARAMETERS",' +
'degree:"Poly Degree",noise:"Noise(\\u03C3)",' +
'ucurve:"BIAS-VARIANCE TRADEOFF",' +
'stats:"STATISTICS",newData:"New Data",' +
'overlay:"Overlay All",clearOverlay:"Clear Overlay",' +
'showTrue:"True Fn",hideTrue:"Hide True",' +
'trueFn:"True fn",data:"Data",fit:"Fit",' +
'bias2:"Bias\\u00B2",variance:"Variance",total:"Total Error",' +
'degreeN:"Degree",trainMSE:"Train MSE",' +
'underfit:"Underfitting",goodfit:"Good Fit",overfit:"Overfitting",' +
'needMore:"Need 5+ new data first",' +
'overlayN:"Overlay fits"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── Constants ──
'var N_PTS=20;var N_EVAL=200;var N_BOOT=50;' +

// ── State ──
'var dataX=[];var dataY=[];' +
'var degree=3;var noiseSig=0.25;' +
'var showTrue=false;var overlayOn=false;' +
'var allHistoryCoeffs=[];var newDataCount=0;' +

// ── DOM refs ──
'var cvPlot,cvUcurve;' +

// ── True function ──
'function trueF(x){return Math.sin(2*Math.PI*x)}' +

// ── Box-Muller ──
'function randn(){var u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}' +

// ── Generate data ──
'function generateData(){' +
'dataX=[];dataY=[];' +
'for(var i=0;i<N_PTS;i++){var x=(i+0.5)/N_PTS;dataX.push(x);dataY.push(trueF(x)+noiseSig*randn())}}' +

// ── Vandermonde + least squares ──
'function vandermonde(xs,d){var n=xs.length;var V=[];for(var i=0;i<n;i++){V[i]=[];for(var j=0;j<=d;j++)V[i][j]=Math.pow(xs[i],j)}return V}' +
'function transpose(M){var r=M.length,c=M[0].length;var R=[];for(var j=0;j<c;j++){R[j]=[];for(var i=0;i<r;i++)R[j][i]=M[i][j]}return R}' +
'function matMul(A,B){var ar=A.length,ac=A[0].length,bc=B[0].length;var C=[];for(var i=0;i<ar;i++){C[i]=[];for(var j=0;j<bc;j++){var s=0;for(var k=0;k<ac;k++)s+=A[i][k]*B[k][j];C[i][j]=s}}return C}' +
'function matVec(M,v){var r=M.length,c=M[0].length;var o=[];for(var i=0;i<r;i++){var s=0;for(var j=0;j<c;j++)s+=M[i][j]*v[j];o[i]=s}return o}' +
'function solve(A,b){var n=A.length;var M=[];for(var i=0;i<n;i++){M[i]=[];for(var j=0;j<n;j++)M[i][j]=A[i][j];M[i][n]=b[i]}' +
'for(var k=0;k<n;k++){var mx=Math.abs(M[k][k]),mr=k;for(var i=k+1;i<n;i++){if(Math.abs(M[i][k])>mx){mx=Math.abs(M[i][k]);mr=i}}' +
'if(mr!==k){var tmp=M[k];M[k]=M[mr];M[mr]=tmp}if(Math.abs(M[k][k])<1e-12)M[k][k]=1e-12;' +
'for(var i=k+1;i<n;i++){var f=M[i][k]/M[k][k];for(var j=k;j<=n;j++)M[i][j]-=f*M[k][j]}}' +
'var x=[];for(var i=n-1;i>=0;i--){x[i]=M[i][n];for(var j=i+1;j<n;j++)x[i]-=M[i][j]*x[j];x[i]/=M[i][i]}return x}' +

'function fitPoly(xs,ys,d){var ad=Math.min(d,xs.length-1);var V=vandermonde(xs,ad);var Vt=transpose(V);var VtV=matMul(Vt,V);' +
'for(var i=0;i<VtV.length;i++)VtV[i][i]+=1e-8;var Vty=matVec(Vt,ys);var c=solve(VtV,Vty);while(c.length<=d)c.push(0);return c}' +

'function evalPoly(c,x){var y=0;for(var i=0;i<c.length;i++)y+=c[i]*Math.pow(x,i);return y}' +

// ── Compute bias^2, variance for degree d via bootstrap ──
'function computeBVT(d){' +
'var evalXs=[];for(var i=0;i<N_EVAL;i++)evalXs.push(i/(N_EVAL-1));' +
'var allP=[];' +
'for(var t=0;t<N_BOOT;t++){var xs=[],ys=[];' +
'for(var i=0;i<N_PTS;i++){var x=(i+0.5)/N_PTS;xs.push(x);ys.push(trueF(x)+noiseSig*randn())}' +
'var c=fitPoly(xs,ys,d);var p=[];for(var i=0;i<N_EVAL;i++)p.push(evalPoly(c,evalXs[i]));allP.push(p)}' +
'var tB2=0,tV=0;' +
'for(var i=0;i<N_EVAL;i++){var mn=0;for(var t=0;t<N_BOOT;t++)mn+=allP[t][i];mn/=N_BOOT;' +
'var tr=trueF(evalXs[i]);var b2=(mn-tr)*(mn-tr);var va=0;' +
'for(var t=0;t<N_BOOT;t++){var dd=allP[t][i]-mn;va+=dd*dd}va/=N_BOOT;tB2+=b2;tV+=va}' +
'tB2/=N_EVAL;tV/=N_EVAL;return{bias2:tB2,variance:tV,total:tB2+tV+noiseSig*noiseSig}}' +

// ── Precompute U-curve ──
'var ucurveData=[];' +
'function buildUcurve(){ucurveData=[];for(var d=1;d<=15;d++)ucurveData.push(computeBVT(d))}' +

// ── Train MSE ──
'function trainMSE(){var c=fitPoly(dataX,dataY,degree);var s=0;' +
'for(var i=0;i<dataX.length;i++){var e=dataY[i]-evalPoly(c,dataX[i]);s+=e*e}return s/dataX.length}' +

// ── Canvas setup ──
'function setupCanvas(cv,h){var dpr=window.devicePixelRatio||1;var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw scatter plot ──
'function drawPlot(){' +
'var dim=setupCanvas(cvPlot,200);var w=dim.w,h=dim.h;' +
'var ctx=cvPlot.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var pad={l:36,r:12,t:14,b:26};' +
'var pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;' +
'var yMin=-1.8,yMax=1.8,yRng=yMax-yMin;' +
'function toX(x){return pad.l+x*pw}' +
'function toY(y){return pad.t+(yMax-y)/yRng*ph}' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var i=0;i<=4;i++){var xv=i/4;ctx.fillText(xv.toFixed(1),toX(xv),h-pad.b+14)}' +
'ctx.textAlign="right";' +
'for(var i=0;i<=4;i++){var yv=yMin+yRng*i/4;ctx.fillText(yv.toFixed(1),pad.l-4,toY(yv)+3)}' +

// Zero line
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.setLineDash([4,4]);' +
'ctx.beginPath();ctx.moveTo(pad.l,toY(0));ctx.lineTo(w-pad.r,toY(0));ctx.stroke();ctx.setLineDash([]);' +

// True function
'if(showTrue){ctx.strokeStyle=greenC;ctx.lineWidth=1.5;ctx.setLineDash([6,4]);ctx.beginPath();' +
'for(var i=0;i<=200;i++){var x=i/200;var y=trueF(x);var px=toX(x),py=toY(y);' +
'if(py<pad.t||py>h-pad.b)continue;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}' +
'ctx.stroke();ctx.setLineDash([])}' +

// Overlay fits
'if(overlayOn&&allHistoryCoeffs.length>0){' +
'ctx.globalAlpha=0.15;ctx.strokeStyle=tealC;ctx.lineWidth=1.5;' +
'for(var f=0;f<allHistoryCoeffs.length;f++){ctx.beginPath();var st=false;' +
'for(var i=0;i<=200;i++){var x=i/200;var y=evalPoly(allHistoryCoeffs[f],x);' +
'var py=toY(y);if(py<pad.t-20||py>h-pad.b+20){st=false;continue}' +
'var cp=Math.max(pad.t,Math.min(h-pad.b,py));if(!st){ctx.moveTo(toX(x),cp);st=true}else ctx.lineTo(toX(x),cp)}' +
'ctx.stroke()}ctx.globalAlpha=1}' +

// Current fit
'var coeffs=fitPoly(dataX,dataY,degree);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2.5;ctx.beginPath();var st2=false;' +
'for(var i=0;i<=200;i++){var x=i/200;var y=evalPoly(coeffs,x);' +
'var py=toY(y);if(py<pad.t-20||py>h-pad.b+20){st2=false;continue}' +
'var cp=Math.max(pad.t,Math.min(h-pad.b,py));if(!st2){ctx.moveTo(toX(x),cp);st2=true}else ctx.lineTo(toX(x),cp)}' +
'ctx.stroke();' +

// Data points
'for(var i=0;i<dataX.length;i++){' +
'ctx.fillStyle=textC;ctx.fillRect(toX(dataX[i])-3,toY(dataY[i])-3,6,6);' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(toX(dataX[i])-3,toY(dataY[i])-3,6,6)}}' +

// ── Draw U-curve ──
'function drawUcurve(){' +
'var dim=setupCanvas(cvUcurve,140);var w=dim.w,h=dim.h;' +
'var ctx=cvUcurve.getContext("2d");ctx.clearRect(0,0,w,h);' +
'if(ucurveData.length===0)return;' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var pad={l:40,r:12,t:12,b:28};' +
'var pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;' +

// Y range
'var eMax=0;for(var i=0;i<ucurveData.length;i++){' +
'if(ucurveData[i].bias2>eMax)eMax=ucurveData[i].bias2;' +
'if(ucurveData[i].variance>eMax)eMax=ucurveData[i].variance;' +
'if(ucurveData[i].total>eMax)eMax=ucurveData[i].total}' +
'eMax*=1.15;if(eMax<0.01)eMax=0.01;' +
'function toX(d){return pad.l+(d-1)/14*pw}' +
'function toY(v){return pad.t+(1-v/eMax)*ph}' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var d=1;d<=15;d+=2){ctx.fillText(d+"",toX(d),h-pad.b+14)}' +
'ctx.textAlign="right";' +
'var nT=4;for(var i=0;i<=nT;i++){var v=eMax*i/nT;ctx.fillText(v.toFixed(2),pad.l-4,toY(v)+3)}' +

// Curves
'function drawLine(key,color,lw){ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();' +
'for(var i=0;i<ucurveData.length;i++){var px=toX(i+1),py=toY(ucurveData[i][key]);' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke()}' +
'drawLine("bias2",redC,2);drawLine("variance",accentC,2);drawLine("total",textC,2);' +

// Current marker
'var cx=toX(degree);ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);' +
'ctx.beginPath();ctx.moveTo(cx,pad.t);ctx.lineTo(cx,h-pad.b);ctx.stroke();ctx.setLineDash([]);' +
'var idx=degree-1;if(idx<ucurveData.length){' +
'ctx.fillStyle=redC;ctx.fillRect(cx-3,toY(ucurveData[idx].bias2)-3,6,6);' +
'ctx.fillStyle=accentC;ctx.fillRect(cx-3,toY(ucurveData[idx].variance)-3,6,6);' +
'ctx.fillStyle=textC;ctx.fillRect(cx-3,toY(ucurveData[idx].total)-3,6,6)}' +
'ctx.fillStyle=text3C;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";ctx.fillText(T.degreeN,w/2,h-4)}' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(ucurveData.length===0){box.innerHTML="...";return}' +
'var idx=degree-1;if(idx>=ucurveData.length)idx=ucurveData.length-1;' +
'var d=ucurveData[idx];' +
'var fitLabel=degree<=2?T.underfit:degree<=6?T.goodfit:T.overfit;' +
'var fitClass=degree<=2?"warn":degree<=6?"hi":"rd";' +
'var mse=trainMSE();' +
'var s=T.degreeN+": <span class=\\"hi\\">"+degree+"</span>";' +
's+=" \\u2014 <span class=\\""+fitClass+"\\">"+fitLabel+"</span><br>";' +
's+=T.trainMSE+": "+mse.toFixed(4)+"<br>";' +
's+="<span class=\\"rd\\">"+T.bias2+"</span>: "+d.bias2.toFixed(4)+"<br>";' +
's+="<span class=\\"warn\\">"+T.variance+"</span>: "+d.variance.toFixed(4)+"<br>";' +
's+=T.total+": "+d.total.toFixed(4);' +
'if(overlayOn)s+="<br>"+T.overlayN+": "+allHistoryCoeffs.length;' +
'box.innerHTML=s}' +

// ── Draw all ──
'function drawAll(){drawPlot();drawUcurve();updateStats();notifyHeight()}' +

// ── Event handlers ──
'function onDegree(){degree=+document.getElementById("slDeg").value;' +
'document.getElementById("valDeg").textContent=degree;drawAll()}' +

'function onNoise(){noiseSig=+document.getElementById("slNoise").value/100;' +
'document.getElementById("valNoise").textContent=noiseSig.toFixed(2);' +
'generateData();allHistoryCoeffs=[];newDataCount=0;overlayOn=false;' +
'document.getElementById("btnOverlay").textContent=T.overlay;' +
'document.getElementById("btnOverlay").className="btn";' +
'buildUcurve();drawAll()}' +

'function onNewData(){generateData();newDataCount++;' +
'var c=fitPoly(dataX,dataY,degree);allHistoryCoeffs.push(c);' +
'if(overlayOn)drawAll();else drawAll()}' +

'function onOverlay(){' +
'if(overlayOn){overlayOn=false;' +
'document.getElementById("btnOverlay").textContent=T.overlay;' +
'document.getElementById("btnOverlay").className="btn";drawAll();return}' +
'if(newDataCount<5){alert(T.needMore);return}' +
'overlayOn=true;' +
'document.getElementById("btnOverlay").textContent=T.clearOverlay;' +
'document.getElementById("btnOverlay").className="btn btn-stop";drawAll()}' +

'function onToggleTrue(){showTrue=!showTrue;' +
'document.getElementById("btnTrue").textContent=showTrue?T.hideTrue:T.showTrue;' +
'document.getElementById("btnTrue").className=showTrue?"btn btn-on":"btn";drawAll()}' +

// ── Height notification ──
'function notifyHeight(){var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'cvPlot=document.getElementById("cvPlot");cvUcurve=document.getElementById("cvUcurve");' +
'document.getElementById("lbl-plot").textContent=T.plot;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-degree").textContent=T.degree;' +
'document.getElementById("lbl-noise").textContent=T.noise;' +
'document.getElementById("lbl-ucurve").textContent=T.ucurve;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnNew").textContent=T.newData;' +
'document.getElementById("btnOverlay").textContent=T.overlay;' +
'document.getElementById("btnTrue").textContent=T.showTrue;' +
'document.getElementById("valDeg").textContent=degree;' +
'document.getElementById("valNoise").textContent=noiseSig.toFixed(2);' +

// ── Build legend ──
'var legBox=document.getElementById("legendBox");' +
'var legItems=[{label:T.data,color:"var(--text)"},{label:T.fit,color:"var(--teal)"},{label:T.bias2,color:"var(--red)"},{label:T.variance,color:"var(--accent)"},{label:T.total,color:"var(--text)"}];' +
'for(var i=0;i<legItems.length;i++){var item=document.createElement("div");item.className="legend-item";' +
'var dot=document.createElement("div");dot.className="legend-dot";dot.style.background=legItems[i].color;item.appendChild(dot);' +
'var txt=document.createElement("span");txt.textContent=legItems[i].label;item.appendChild(txt);legBox.appendChild(item)}' +

// ── Init ──
'generateData();buildUcurve();drawAll();' +
'window.addEventListener("resize",function(){drawAll()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
