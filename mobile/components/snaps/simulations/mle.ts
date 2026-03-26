/**
 * Maximum Likelihood Estimation interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Histogram of ~30 data points with overlaid Gaussian curve N(mu, sigma^2)
 * - 2D parameter space contour plot showing log-likelihood surface
 * - mu/sigma sliders + drag on contour plot to move parameter position
 * - Gradient Ascent animation climbing toward MLE
 * - "New Data" button, "Reveal True" toggle
 * - Dark/light theme, Korean/English bilingual
 */

export function getMLESimulationHTML(isDark: boolean, lang: string): string {
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
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.btn-on{background:var(--tealLight);border-color:var(--teal);color:var(--teal)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .rd{color:var(--red);font-weight:700}' +
'.stats .gn{color:var(--green);font-weight:700}' +
'</style></head><body>' +

// ── Histogram Panel ──
'<div class="panel"><div class="label" id="lbl-hist"></div>' +
'<canvas id="cvHist" height="200"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-params"></div>' +
'<div class="row"><span class="ctrl-name">\\u03BC</span>' +
'<input type="range" id="slMu" min="-50" max="50" value="0" oninput="onSlider()">' +
'<span class="ctrl-val" id="valMu"></span></div>' +
'<div class="row"><span class="ctrl-name">\\u03C3</span>' +
'<input type="range" id="slSig" min="30" max="300" value="100" oninput="onSlider()">' +
'<span class="ctrl-val" id="valSig"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnGrad" onclick="onGradient()"></div>' +
'<div class="btn" id="btnNew" onclick="onNewData()"></div>' +
'<div class="btn" id="btnReveal" onclick="onReveal()"></div>' +
'</div></div>' +

// ── Contour Panel ──
'<div class="panel"><div class="label" id="lbl-contour"></div>' +
'<canvas id="cvContour" height="160"></canvas></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{hist:"\\uB370\\uC774\\uD130 + \\uAC00\\uC6B0\\uC2DC\\uC548",params:"\\uD30C\\uB77C\\uBBF8\\uD130",' +
'contour:"\\uD30C\\uB77C\\uBBF8\\uD130 \\uACF5\\uAC04 (\\uB85C\\uADF8\\uC6B0\\uB3C4)",' +
'stats:"\\uD1B5\\uACC4",grad:"\\uACBD\\uC0AC\\uC0C1\\uC2B9",' +
'newData:"\\uC0C8 \\uB370\\uC774\\uD130",showTrue:"\\uCC38\\uAC12 \\uD45C\\uC2DC",hideTrue:"\\uCC38\\uAC12 \\uC228\\uAE30\\uAE30",' +
'curMu:"\\uD604\\uC7AC \\u03BC",curSig:"\\uD604\\uC7AC \\u03C3",logL:"\\uB85C\\uADF8\\uC6B0\\uB3C4",' +
'mleMu:"MLE \\u03BC\\u0302",mleSig:"MLE \\u03C3\\u0302",' +
'trueMu:"\\uCC38 \\u03BC",trueSig:"\\uCC38 \\u03C3",' +
'running:"\\uC0C1\\uC2B9 \\uC911...",stop:"\\uC815\\uC9C0",' +
'dragHint:"\\uCE10\\uD22C\\uC5B4 \\uD50C\\uB86F\\uC744 \\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\u03BC,\\u03C3 \\uC870\\uC808"},' +
'en:{hist:"DATA + GAUSSIAN",params:"PARAMETERS",' +
'contour:"PARAMETER SPACE (LOG-LIKELIHOOD)",' +
'stats:"STATISTICS",grad:"Gradient Ascent",' +
'newData:"New Data",showTrue:"Show True",hideTrue:"Hide True",' +
'curMu:"Current \\u03BC",curSig:"Current \\u03C3",logL:"Log-Likelihood",' +
'mleMu:"MLE \\u03BC\\u0302",mleSig:"MLE \\u03C3\\u0302",' +
'trueMu:"True \\u03BC",trueSig:"True \\u03C3",' +
'running:"Ascending...",stop:"Stop",' +
'dragHint:"Drag contour plot to adjust \\u03BC,\\u03C3"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var N_DATA=30;var data=[];' +
'var trueMu,trueSig;' +
'var curMu=0,curSig=1.0;' +
'var mleMu=0,mleSig=1.0;' +
'var revealed=false;var gradRunning=false;var gradTimer=null;' +

// ── DOM refs ──
'var cvHist,cvContour;' +

// ── Gaussian helpers ──
'function randn(){var u=0,v=0;while(u===0)u=Math.random();while(v===0)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}' +

'function gaussPDF(x,mu,sig){return Math.exp(-0.5*Math.pow((x-mu)/sig,2))/(sig*Math.sqrt(2*Math.PI))}' +

'function logLikelihood(mu,sig){if(sig<=0.01)return-1e10;var ll=0;' +
'for(var i=0;i<data.length;i++){var p=gaussPDF(data[i],mu,sig);if(p<1e-300)p=1e-300;ll+=Math.log(p)}return ll}' +

// ── Generate data ──
'function genData(){' +
'trueMu=Math.round((-2+Math.random()*4)*10)/10;' +
'trueSig=Math.round((0.5+Math.random()*1.5)*10)/10;' +
'data=[];for(var i=0;i<N_DATA;i++)data.push(trueMu+trueSig*randn());' +
'mleMu=0;mleSig=0;for(var i=0;i<data.length;i++)mleMu+=data[i];mleMu/=data.length;' +
'for(var i=0;i<data.length;i++)mleSig+=(data[i]-mleMu)*(data[i]-mleMu);mleSig=Math.sqrt(mleSig/data.length)}' +

// ── Canvas setup ──
'function setupCanvas(cv,h){var dpr=window.devicePixelRatio||1;var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw histogram + Gaussian ──
'function drawHist(){' +
'var dim=setupCanvas(cvHist,200);var w=dim.w,h=dim.h;' +
'var ctx=cvHist.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var pad={l:36,r:12,t:14,b:26};' +
'var pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;' +

// Data range
'var dMin=data[0],dMax=data[0];' +
'for(var i=1;i<data.length;i++){if(data[i]<dMin)dMin=data[i];if(data[i]>dMax)dMax=data[i]}' +
'var margin=(dMax-dMin)*0.3;if(margin<0.5)margin=0.5;' +
'var xMin=Math.min(dMin-margin,curMu-3*curSig);var xMax=Math.max(dMax+margin,curMu+3*curSig);' +
'xMin=Math.min(xMin,-5);xMax=Math.max(xMax,5);' +
'function toX(v){return pad.l+(v-xMin)/(xMax-xMin)*pw}' +

// Histogram bins
'var nBins=10;var binW=(xMax-xMin)/nBins;var bins=[];for(var i=0;i<nBins;i++)bins[i]=0;' +
'for(var i=0;i<data.length;i++){var b=Math.floor((data[i]-xMin)/binW);if(b<0)b=0;if(b>=nBins)b=nBins-1;bins[b]++}' +
'var maxBin=0;for(var i=0;i<nBins;i++){if(bins[i]>maxBin)maxBin=bins[i]}' +

// Scale: normalize histogram density
'var binArea=data.length*binW;' +
'var maxDensity=maxBin/binArea;' +
'var peakPDF=gaussPDF(curMu,curMu,curSig);' +
'var yMax=Math.max(maxDensity,peakPDF)*1.15;if(yMax<0.01)yMax=1;' +
'function toY(v){return pad.t+(1-v/yMax)*ph}' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad.l,pad.t);ctx.lineTo(pad.l,h-pad.b);ctx.lineTo(w-pad.r,h-pad.b);ctx.stroke();' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'var step=Math.max(1,Math.round((xMax-xMin)/5));' +
'for(var v=Math.ceil(xMin);v<=Math.floor(xMax);v+=step){ctx.fillText(v.toFixed(0),toX(v),h-pad.b+14)}' +

// Draw histogram bars
'for(var i=0;i<nBins;i++){var bx=xMin+i*binW;var density=bins[i]/binArea;' +
'var x1=toX(bx),x2=toX(bx+binW),y1=toY(density),y2=toY(0);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.25;ctx.fillRect(x1,y1,x2-x1,y2-y1);ctx.globalAlpha=1;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;ctx.strokeRect(x1,y1,x2-x1,y2-y1)}' +

// Draw Gaussian curve (red)
'ctx.strokeStyle=redC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var i=0;i<=200;i++){var x=xMin+(xMax-xMin)*i/200;var y=gaussPDF(x,curMu,curSig);' +
'var px=toX(x),py=toY(y);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +

// MLE Gaussian (green dashed) if revealed
'if(revealed){ctx.strokeStyle=greenC;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.beginPath();' +
'for(var i=0;i<=200;i++){var x=xMin+(xMax-xMin)*i/200;var y=gaussPDF(x,mleMu,mleSig);' +
'var px=toX(x),py=toY(y);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();ctx.setLineDash([])}}' +

// ── Draw contour plot ──
'function drawContour(){' +
'var dim=setupCanvas(cvContour,160);var w=dim.w,h=dim.h;' +
'var ctx=cvContour.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var pad={l:36,r:12,t:14,b:26};' +
'var pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;' +

// Parameter ranges: mu -5..5, sigma 0.3..3.0
'var muMin=-5,muMax=5,sigMin=0.3,sigMax=3.0;' +
'function toX(mu){return pad.l+(mu-muMin)/(muMax-muMin)*pw}' +
'function toY(sig){return pad.t+(sigMax-sig)/(sigMax-sigMin)*ph}' +
'function fromX(px){return muMin+(px-pad.l)/pw*(muMax-muMin)}' +
'function fromY(py){return sigMax-(py-pad.t)/ph*(sigMax-sigMin)}' +

// Compute log-likelihood grid
'var gN=60;var grid=[];var llMin=1e10,llMax=-1e10;' +
'for(var j=0;j<gN;j++){grid[j]=[];for(var i=0;i<gN;i++){' +
'var mu=muMin+(muMax-muMin)*i/(gN-1);var sig=sigMin+(sigMax-sigMin)*j/(gN-1);' +
'var ll=logLikelihood(mu,sig);grid[j][i]=ll;if(ll<llMin)llMin=ll;if(ll>llMax)llMax=ll}}' +
'var llRange=llMax-llMin;if(llRange<1)llRange=1;' +

// Draw heatmap
'var cellW=pw/gN;var cellH=ph/gN;' +
'for(var j=0;j<gN;j++){for(var i=0;i<gN;i++){' +
'var t=(grid[j][i]-llMin)/llRange;' +
'var r=Math.round(20+t*40);var g=Math.round(60+t*160);var b=Math.round(80+t*130);' +
'ctx.fillStyle="rgb("+r+","+g+","+b+")";' +
'ctx.fillRect(pad.l+i*cellW,pad.t+(gN-1-j)*cellH,cellW+1,cellH+1)}}' +

// Axes
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var v=-4;v<=4;v+=2){ctx.fillText(v.toFixed(0),toX(v),h-pad.b+14)}' +
'ctx.textAlign="right";' +
'for(var v=0.5;v<=3;v+=0.5){ctx.fillText(v.toFixed(1),pad.l-4,toY(v)+3)}' +
'ctx.fillStyle=text3C;ctx.font="10px -apple-system,sans-serif";' +
'ctx.textAlign="center";ctx.fillText("\\u03BC",w/2,h-4);' +
'ctx.save();ctx.translate(10,h/2);ctx.rotate(-Math.PI/2);ctx.fillText("\\u03C3",0,0);ctx.restore();' +

// Current position (red dot)
'var cx=toX(curMu),cy=toY(curSig);' +
'ctx.fillStyle=redC;ctx.fillRect(cx-5,cy-5,10,10);' +
'ctx.strokeStyle="#fff";ctx.lineWidth=1;ctx.strokeRect(cx-5,cy-5,10,10);' +

// MLE position (green star)
'var mx=toX(mleMu),my=toY(mleSig);' +
'ctx.fillStyle=greenC;ctx.beginPath();' +
'for(var i=0;i<5;i++){var a=Math.PI/2+i*2*Math.PI/5;var a2=a+Math.PI/5;' +
'ctx.lineTo(mx+7*Math.cos(a),my-7*Math.sin(a));ctx.lineTo(mx+3*Math.cos(a2),my-3*Math.sin(a2))}' +
'ctx.closePath();ctx.fill();' +

// Border
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.strokeRect(pad.l,pad.t,pw,ph)}' +

// ── Update stats ──
'function updateStats(){var box=document.getElementById("statsBox");' +
'var ll=logLikelihood(curMu,curSig);var mleLL=logLikelihood(mleMu,mleSig);' +
'var s="<span class=\\"hi\\">"+T.curMu+"</span>: "+curMu.toFixed(2)+"<br>";' +
's+="<span class=\\"hi\\">"+T.curSig+"</span>: "+curSig.toFixed(2)+"<br>";' +
's+=T.logL+": <span class=\\"warn\\">"+ll.toFixed(2)+"</span><br>";' +
's+="<span class=\\"gn\\">"+T.mleMu+"</span>: "+mleMu.toFixed(3)+"<br>";' +
's+="<span class=\\"gn\\">"+T.mleSig+"</span>: "+mleSig.toFixed(3)+"<br>";' +
's+="MLE "+T.logL+": "+mleLL.toFixed(2);' +
'if(revealed){s+="<br><span class=\\"rd\\">"+T.trueMu+"</span>: "+trueMu.toFixed(2);' +
's+="<br><span class=\\"rd\\">"+T.trueSig+"</span>: "+trueSig.toFixed(2)}' +
'box.innerHTML=s}' +

// ── Draw all ──
'function drawAll(){drawHist();drawContour();updateStats();notifyHeight()}' +

// ── Event handlers ──
'function onSlider(){' +
'curMu=+document.getElementById("slMu").value/10;' +
'curSig=+document.getElementById("slSig").value/100;' +
'document.getElementById("valMu").textContent=curMu.toFixed(1);' +
'document.getElementById("valSig").textContent=curSig.toFixed(2);drawAll()}' +

'function syncSliders(){' +
'document.getElementById("slMu").value=Math.round(curMu*10);' +
'document.getElementById("slSig").value=Math.round(curSig*100);' +
'document.getElementById("valMu").textContent=curMu.toFixed(1);' +
'document.getElementById("valSig").textContent=curSig.toFixed(2)}' +

'function onNewData(){stopGrad();genData();revealed=false;' +
'curMu=0;curSig=1.0;syncSliders();' +
'document.getElementById("btnReveal").textContent=T.showTrue;' +
'document.getElementById("btnReveal").className="btn";drawAll()}' +

'function onReveal(){revealed=!revealed;' +
'document.getElementById("btnReveal").textContent=revealed?T.hideTrue:T.showTrue;' +
'document.getElementById("btnReveal").className=revealed?"btn btn-on":"btn";drawAll()}' +

// ── Gradient ascent ──
'function stopGrad(){if(gradTimer){clearInterval(gradTimer);gradTimer=null;gradRunning=false;' +
'document.getElementById("btnGrad").textContent=T.grad;' +
'document.getElementById("btnGrad").className="btn btn-primary"}}' +

'function onGradient(){' +
'if(gradRunning){stopGrad();return}' +
'gradRunning=true;' +
'document.getElementById("btnGrad").textContent=T.stop;' +
'document.getElementById("btnGrad").className="btn btn-stop";' +
'var lr=0.002;var step=0;' +
'gradTimer=setInterval(function(){' +
// Numerical gradient
'var eps=0.001;' +
'var llC=logLikelihood(curMu,curSig);' +
'var dMu=(logLikelihood(curMu+eps,curSig)-llC)/eps;' +
'var dSig=(logLikelihood(curMu,curSig+eps)-llC)/eps;' +
'curMu+=lr*dMu;curSig+=lr*dSig;' +
'if(curSig<0.3)curSig=0.3;if(curSig>3.0)curSig=3.0;' +
'if(curMu<-5)curMu=-5;if(curMu>5)curMu=5;' +
'syncSliders();drawAll();step++;' +
'if(step>300||Math.abs(dMu)<0.01&&Math.abs(dSig)<0.01){stopGrad()}' +
'},30)}' +

// ── Contour drag ──
'var dragging=false;' +
'function handleContourMove(px,py){' +
'var cv=cvContour;var rect=cv.getBoundingClientRect();' +
'var x=px-rect.left;var y=py-rect.top;' +
'var padL=36,padR=12,padT=14,padB=26;' +
'var pw=rect.width-padL-padR;var ph=rect.height-padT-padB;' +
'var mu=-5+(x-padL)/pw*10;var sig=3.0-(y-padT)/ph*2.7;' +
'if(mu<-5)mu=-5;if(mu>5)mu=5;if(sig<0.3)sig=0.3;if(sig>3.0)sig=3.0;' +
'curMu=Math.round(mu*10)/10;curSig=Math.round(sig*100)/100;' +
'syncSliders();drawAll()}' +

'document.addEventListener("DOMContentLoaded",function(){' +
'cvContour=document.getElementById("cvContour");' +
// Touch events
'cvContour.addEventListener("touchstart",function(e){e.preventDefault();dragging=true;' +
'var t=e.touches[0];handleContourMove(t.clientX,t.clientY)},{passive:false});' +
'cvContour.addEventListener("touchmove",function(e){if(!dragging)return;e.preventDefault();' +
'var t=e.touches[0];handleContourMove(t.clientX,t.clientY)},{passive:false});' +
'cvContour.addEventListener("touchend",function(){dragging=false});' +
// Mouse events
'cvContour.addEventListener("mousedown",function(e){dragging=true;handleContourMove(e.clientX,e.clientY)});' +
'document.addEventListener("mousemove",function(e){if(dragging)handleContourMove(e.clientX,e.clientY)});' +
'document.addEventListener("mouseup",function(){dragging=false})});' +

// ── Height notification ──
'function notifyHeight(){var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'cvHist=document.getElementById("cvHist");' +
'cvContour=document.getElementById("cvContour");' +
'document.getElementById("lbl-hist").textContent=T.hist;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-contour").textContent=T.contour;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnGrad").textContent=T.grad;' +
'document.getElementById("btnNew").textContent=T.newData;' +
'document.getElementById("btnReveal").textContent=T.showTrue;' +

// ── Init ──
'genData();curMu=0;curSig=1.0;syncSliders();drawAll();' +
'window.addEventListener("resize",function(){drawAll()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
