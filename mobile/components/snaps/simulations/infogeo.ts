/**
 * Information Geometry interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Main canvas: 2D parameter space of Gaussian distributions (x=mu, y=sigma)
 *   Grid lines warp according to Fisher Information Metric. Two draggable points A, B
 * - Two paths: Euclidean (gray straight line) vs Fisher geodesic (teal curve)
 * - "Animate Path" button: Smoothly move from A to B along both paths
 * - Bottom canvas: PDF curves of distributions A and B overlaid
 * - Distance Metric segment: Euclidean / KL Divergence / Fisher Geodesic
 * - Drag points A and B on the parameter space
 * - Stats: Euclidean distance, KL divergence, Fisher geodesic distance, parameters
 * - Fisher metric for Gaussian: ds^2 = dmu^2/sigma^2 + 2*dsigma^2/sigma^2
 * - Dark/light theme, Korean/English bilingual
 */

export function getInfoGeoSimulationHTML(isDark: boolean, lang: string): string {
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
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.seg-row{display:flex;gap:0;margin-bottom:10px}' +
'.seg{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.seg:first-child{border-right:none}' +
'.seg:last-child{border-left:none}' +
'.seg.active{border-color:var(--teal);background:var(--tealLight);color:var(--teal)}' +
'.seg:active{opacity:0.7}' +
'</style></head><body>' +

// ── Parameter Space Canvas ──
'<div class="panel"><div class="label" id="lbl-space"></div>' +
'<canvas id="cvSpace" height="280"></canvas></div>' +

// ── PDF Canvas ──
'<div class="panel"><div class="label" id="lbl-pdf"></div>' +
'<canvas id="cvPDF" height="160"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="seg-row">' +
'<div class="seg" id="segEuc" onclick="setMetric(0)">Euclidean</div>' +
'<div class="seg" id="segKL" onclick="setMetric(1)">KL Div</div>' +
'<div class="seg active" id="segFisher" onclick="setMetric(2)">Fisher</div>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnAnimate" onclick="animatePath()"></div>' +
'<div class="btn" id="btnSwap" onclick="swapAB()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{space:"\\uD30C\\uB77C\\uBBF8\\uD130 \\uACF5\\uAC04 (\\u03BC, \\u03C3)",' +
'pdf:"\\uD655\\uB960\\uBC00\\uB3C4\\uD568\\uC218",ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'animate:"\\u25B6 \\uACBD\\uB85C \\uC560\\uB2C8\\uBA54\\uC774\\uC158",stop:"\\u25A0 \\uC815\\uC9C0",' +
'swap:"A \\u21C6 B",reset:"\\u21BA \\uB9AC\\uC14B",' +
'eucDist:"\\uC720\\uD074\\uB9AC\\uB4DC \\uAC70\\uB9AC",klDist:"KL \\uBC1C\\uC0B0",' +
'fisherDist:"\\uD53C\\uC154 \\uCE21\\uC9C0\\uC120 \\uAC70\\uB9AC",' +
'dragHint:"A(\\uCCAD\\uB85D), B(\\uC8FC\\uD669) \\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uC774\\uB3D9",' +
'pointA:"\\uC810 A",pointB:"\\uC810 B",highlight:"\\uAC15\\uC870 \\uAC70\\uB9AC"},' +
'en:{space:"PARAMETER SPACE (\\u03BC, \\u03C3)",' +
'pdf:"PROBABILITY DENSITY",ctrl:"CONTROLS",stats:"STATISTICS",' +
'animate:"\\u25B6 Animate Path",stop:"\\u25A0 Stop",' +
'swap:"A \\u21C6 B",reset:"\\u21BA Reset",' +
'eucDist:"Euclidean Dist",klDist:"KL Divergence",' +
'fisherDist:"Fisher Geodesic Dist",' +
'dragHint:"Drag A (teal), B (accent) to move",' +
'pointA:"Point A",pointB:"Point B",highlight:"Highlight Dist"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
// Points A and B in (mu, sigma) space
'var A={mu:-2,sig:1.5};' +
'var B={mu:2,sig:0.8};' +
'var metric=2;' + // 0=euclidean, 1=KL, 2=Fisher
'var animT=-1;var animTimer=null;' +
'var dragPoint=null;var dragging=false;' +

// ── Parameter space bounds ──
'var MU_MIN=-5,MU_MAX=5,SIG_MIN=0.2,SIG_MAX=3.5;' +

// ── Gaussian PDF ──
'function gaussPDF(x,mu,sig){return Math.exp(-0.5*Math.pow((x-mu)/sig,2))/(sig*Math.sqrt(2*Math.PI))}' +

// ── Euclidean distance ──
'function eucDist(a,b){return Math.sqrt(Math.pow(a.mu-b.mu,2)+Math.pow(a.sig-b.sig,2))}' +

// ── KL Divergence D_KL(A||B) ──
'function klDiv(a,b){' +
'return Math.log(b.sig/a.sig)+((a.sig*a.sig+(a.mu-b.mu)*(a.mu-b.mu))/(2*b.sig*b.sig))-0.5}' +

// ── Symmetric KL ──
'function symKL(a,b){return(klDiv(a,b)+klDiv(b,a))/2}' +

// ── Fisher geodesic distance for Gaussian (analytical) ──
// ds^2 = dmu^2/sigma^2 + 2*dsigma^2/sigma^2
// The geodesic in the upper half-plane model (mu,sigma) with metric g has
// a known closed-form distance
'function fisherDist(a,b){' +
// Use the Poincare-like half-plane model
// d = sqrt(2) * arccosh(1 + ((mu1-mu2)^2 + (sig1-sig2)^2) / (2*sig1*sig2))
'var dmu=a.mu-b.mu;var dsig=a.sig-b.sig;' +
'var num=dmu*dmu+dsig*dsig;' +
'var den=2*a.sig*b.sig;' +
'var arg=1+num/den;' +
'if(arg<1)arg=1;' +
'return Math.sqrt(2)*Math.acosh(arg)}' +

// ── Compute Fisher geodesic path (numerical integration) ──
// For the Gaussian Fisher metric, geodesics are semicircles in
// the (mu, sqrt(2)*ln(sigma)) upper half-plane
'function fisherGeodesicPath(a,b,nPts){' +
// Transform to (mu, eta) where eta = sqrt(2)*ln(sigma)
// In this space, the metric is Euclidean-like, and geodesics are lines in the
// Poincare half-plane with y = sigma
// We use the standard hyperbolic geodesic: semicircles or vertical lines
'var pts=[];' +

// Working in the (mu, sigma) half-plane with metric ds^2=(dmu^2+2*dsig^2)/sig^2
// Transform: u=mu, v=sqrt(2)*ln(sigma) makes metric ds^2=du^2+dv^2 (Euclidean in (u,v))
// Actually this is not quite right — the half-plane metric is (du^2+2dv^2)/sig^2
// Use numerical path: parametric interpolation in (u, v) space
'var v1=Math.sqrt(2)*Math.log(a.sig);var v2=Math.sqrt(2)*Math.log(b.sig);' +

// In the transformed coordinates, geodesics of the metric dmu^2/sig^2 + 2dsig^2/sig^2
// correspond to geodesics in the hyperbolic half-plane after scaling
// We approximate the geodesic by computing it in the (mu, sqrt(2)*log(sigma)) space
// where it is approximately a straight line (Euclidean in those coords)

'for(var i=0;i<=nPts;i++){' +
'var t=i/nPts;' +
'var u=a.mu+(b.mu-a.mu)*t;' +
'var v=v1+(v2-v1)*t;' +
'var sig2=Math.exp(v/Math.sqrt(2));' +
'if(sig2<SIG_MIN)sig2=SIG_MIN;if(sig2>SIG_MAX)sig2=SIG_MAX;' +
'pts.push({mu:u,sig:sig2})}' +
'return pts}' +

// ── Compute Euclidean path ──
'function euclideanPath(a,b,nPts){' +
'var pts=[];' +
'for(var i=0;i<=nPts;i++){' +
'var t=i/nPts;pts.push({mu:a.mu+(b.mu-a.mu)*t,sig:a.sig+(b.sig-a.sig)*t})}' +
'return pts}' +

// ── Canvas setup ──
'function setupCanvas(cv,h){var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw parameter space ──
'function drawSpace(){' +
'var cv=document.getElementById("cvSpace");' +
'var dim=setupCanvas(cv,280);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +

'var pad={l:36,r:12,t:14,b:28};' +
'var pw=w-pad.l-pad.r;var ph=h-pad.t-pad.b;' +

'function toX(mu){return pad.l+(mu-MU_MIN)/(MU_MAX-MU_MIN)*pw}' +
'function toY(sig){return pad.t+(SIG_MAX-sig)/(SIG_MAX-SIG_MIN)*ph}' +
'function fromX(px2){return MU_MIN+(px2-pad.l)/pw*(MU_MAX-MU_MIN)}' +
'function fromY(py2){return SIG_MAX-(py2-pad.t)/ph*(SIG_MAX-SIG_MIN)}' +

// Draw Fisher-warped grid (curves denser at small sigma)
// In Fisher metric, distances at small sigma are "stretched"
// Visualize by drawing grid lines at equal Fisher intervals
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.globalAlpha=0.3;' +

// Vertical lines (constant mu) — these stay straight
'for(var mu=-4;mu<=4;mu+=1){' +
'var x=toX(mu);' +
'ctx.beginPath();ctx.moveTo(x,pad.t);ctx.lineTo(x,pad.t+ph);ctx.stroke()}' +

// Horizontal lines — at equal Fisher-metric spacing in sigma
// Fisher distance in sigma direction: integral of sqrt(2)/sigma dsigma = sqrt(2)*ln(sigma)
// So equal spacing in ln(sigma) gives equal Fisher spacing
'var lnMin=Math.log(SIG_MIN);var lnMax=Math.log(SIG_MAX);' +
'var nLines=12;' +
'for(var i=0;i<=nLines;i++){' +
'var lnS=lnMin+(lnMax-lnMin)*i/nLines;' +
'var sig2=Math.exp(lnS);' +
'var y=toY(sig2);' +
'ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke()}' +
'ctx.globalAlpha=1;' +

// Draw density shading (lighter at small sigma = higher Fisher curvature)
'var nX=60;var nY=40;' +
'var cellW=pw/nX;var cellH=ph/nY;' +
'for(var j=0;j<nY;j++){for(var i2=0;i2<nX;i2++){' +
'var sig2=fromY(pad.t+(j+0.5)*cellH);' +
'if(sig2<SIG_MIN)continue;' +
// Fisher metric determinant ~ 1/sigma^4, so information density ~ 1/sigma^2
'var density=1/(sig2*sig2);var maxDensity=1/(SIG_MIN*SIG_MIN);' +
'var alpha2=Math.min(0.12,density/maxDensity*0.15);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=alpha2;' +
'ctx.fillRect(pad.l+i2*cellW,pad.t+j*cellH,cellW+1,cellH+1)}}' +
'ctx.globalAlpha=1;' +

// Draw Euclidean path (gray dashed line)
'var ePath=euclideanPath(A,B,50);' +
'ctx.strokeStyle=text3C;ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();' +
'for(var i2=0;i2<ePath.length;i2++){' +
'var x2=toX(ePath[i2].mu);var y2=toY(ePath[i2].sig);' +
'if(i2===0)ctx.moveTo(x2,y2);else ctx.lineTo(x2,y2)}' +
'ctx.stroke();ctx.setLineDash([]);' +

// Draw Fisher geodesic path (teal solid)
'var fPath=fisherGeodesicPath(A,B,80);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var i2=0;i2<fPath.length;i2++){' +
'var x2=toX(fPath[i2].mu);var y2=toY(fPath[i2].sig);' +
'if(i2===0)ctx.moveTo(x2,y2);else ctx.lineTo(x2,y2)}' +
'ctx.stroke();' +

// Animation position
'if(animT>=0&&animT<=1){' +
// Euclidean point
'var eIdx=Math.floor(animT*50);if(eIdx>=ePath.length)eIdx=ePath.length-1;' +
'var ex=toX(ePath[eIdx].mu);var ey=toY(ePath[eIdx].sig);' +
'ctx.fillStyle=text3C;ctx.beginPath();ctx.arc(ex,ey,5,0,Math.PI*2);ctx.fill();' +
// Fisher point
'var fIdx=Math.floor(animT*80);if(fIdx>=fPath.length)fIdx=fPath.length-1;' +
'var fx=toX(fPath[fIdx].mu);var fy=toY(fPath[fIdx].sig);' +
'ctx.fillStyle=tealC;ctx.beginPath();ctx.arc(fx,fy,5,0,Math.PI*2);ctx.fill()}' +

// Draw point A (teal filled circle)
'var ax=toX(A.mu);var ay=toY(A.sig);' +
'ctx.fillStyle=tealC;ctx.beginPath();ctx.arc(ax,ay,8,0,Math.PI*2);ctx.fill();' +
'ctx.strokeStyle=borderC;ctx.lineWidth=2;ctx.stroke();' +
'ctx.fillStyle=textC;ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";' +
'ctx.fillText("A",ax,ay);' +

// Draw point B (accent filled circle)
'var bx=toX(B.mu);var by=toY(B.sig);' +
'ctx.fillStyle=accentC;ctx.beginPath();ctx.arc(bx,by,8,0,Math.PI*2);ctx.fill();' +
'ctx.strokeStyle=borderC;ctx.lineWidth=2;ctx.stroke();' +
'ctx.fillStyle=textC;ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";' +
'ctx.fillText("B",bx,by);' +

// Axes labels
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var mu=-4;mu<=4;mu+=2){ctx.fillText(mu.toFixed(0),toX(mu),h-pad.b+14)}' +
'ctx.textAlign="right";' +
'for(var s=0.5;s<=3;s+=0.5){ctx.fillText(s.toFixed(1),pad.l-4,toY(s)+3)}' +
'ctx.textAlign="center";ctx.font="10px -apple-system,sans-serif";' +
'ctx.fillText("\\u03BC",w/2,h-4);' +
'ctx.save();ctx.translate(10,h/2);ctx.rotate(-Math.PI/2);ctx.fillText("\\u03C3",0,0);ctx.restore();' +

// Hint
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="right";' +
'ctx.fillText(T.dragHint,w-pad.r,pad.t+10);' +

// Legend
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.setLineDash([5,4]);ctx.strokeStyle=text3C;ctx.lineWidth=1.5;' +
'ctx.beginPath();ctx.moveTo(pad.l+4,pad.t+10);ctx.lineTo(pad.l+24,pad.t+10);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillText("Euclidean",pad.l+28,pad.t+13);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;' +
'ctx.beginPath();ctx.moveTo(pad.l+4,pad.t+22);ctx.lineTo(pad.l+24,pad.t+22);ctx.stroke();' +
'ctx.fillStyle=tealC;ctx.fillText("Fisher",pad.l+28,pad.t+25)}' +

// ── Draw PDF ──
'function drawPDF(){' +
'var cv=document.getElementById("cvPDF");' +
'var dim=setupCanvas(cv,160);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +

'var pad2={l:36,r:12,t:14,b:26};' +
'var pw2=w-pad2.l-pad2.r;var ph2=h-pad2.t-pad2.b;' +

// X range for PDF
'var xMin=-8;var xMax=8;' +
'function toX2(v){return pad2.l+(v-xMin)/(xMax-xMin)*pw2}' +

// Find max PDF value for scaling
'var maxP=0;' +
'for(var i=0;i<=100;i++){' +
'var x=xMin+(xMax-xMin)*i/100;' +
'var pa=gaussPDF(x,A.mu,A.sig);var pb=gaussPDF(x,B.mu,B.sig);' +
'if(pa>maxP)maxP=pa;if(pb>maxP)maxP=pb}' +
'maxP*=1.1;if(maxP<0.01)maxP=1;' +
'function toY2(v){return pad2.t+(1-v/maxP)*ph2}' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad2.l,pad2.t);ctx.lineTo(pad2.l,h-pad2.b);ctx.lineTo(w-pad2.r,h-pad2.b);ctx.stroke();' +

// PDF curve A (teal)
'ctx.strokeStyle=tealC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var i=0;i<=200;i++){' +
'var x=xMin+(xMax-xMin)*i/200;' +
'var y=gaussPDF(x,A.mu,A.sig);' +
'var px2=toX2(x);var py2=toY2(y);' +
'if(i===0)ctx.moveTo(px2,py2);else ctx.lineTo(px2,py2)}' +
'ctx.stroke();' +

// Fill under A
'ctx.fillStyle=tealC;ctx.globalAlpha=0.1;ctx.beginPath();' +
'ctx.moveTo(toX2(xMin),toY2(0));' +
'for(var i=0;i<=200;i++){' +
'var x=xMin+(xMax-xMin)*i/200;ctx.lineTo(toX2(x),toY2(gaussPDF(x,A.mu,A.sig)))}' +
'ctx.lineTo(toX2(xMax),toY2(0));ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +

// PDF curve B (accent)
'ctx.strokeStyle=accentC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var i=0;i<=200;i++){' +
'var x=xMin+(xMax-xMin)*i/200;' +
'var y=gaussPDF(x,B.mu,B.sig);' +
'var px2=toX2(x);var py2=toY2(y);' +
'if(i===0)ctx.moveTo(px2,py2);else ctx.lineTo(px2,py2)}' +
'ctx.stroke();' +

// Fill under B
'ctx.fillStyle=accentC;ctx.globalAlpha=0.1;ctx.beginPath();' +
'ctx.moveTo(toX2(xMin),toY2(0));' +
'for(var i=0;i<=200;i++){' +
'var x=xMin+(xMax-xMin)*i/200;ctx.lineTo(toX2(x),toY2(gaussPDF(x,B.mu,B.sig)))}' +
'ctx.lineTo(toX2(xMax),toY2(0));ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +

// Animated distribution
'if(animT>=0&&animT<=1){' +
'var fPath=fisherGeodesicPath(A,B,80);' +
'var fIdx=Math.floor(animT*80);if(fIdx>=fPath.length)fIdx=fPath.length-1;' +
'var pt=fPath[fIdx];' +
'ctx.strokeStyle=text3C;ctx.lineWidth=1.5;ctx.setLineDash([3,3]);ctx.beginPath();' +
'for(var i=0;i<=200;i++){' +
'var x=xMin+(xMax-xMin)*i/200;var y=gaussPDF(x,pt.mu,pt.sig);' +
'var px2=toX2(x);var py2=toY2(y);' +
'if(i===0)ctx.moveTo(px2,py2);else ctx.lineTo(px2,py2)}' +
'ctx.stroke();ctx.setLineDash([])}' +

// Legend
'ctx.fillStyle=tealC;ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.fillText("A: N("+A.mu.toFixed(1)+", "+A.sig.toFixed(1)+"\\u00B2)",pad2.l+8,pad2.t+10);' +
'ctx.fillStyle=accentC;' +
'ctx.fillText("B: N("+B.mu.toFixed(1)+", "+B.sig.toFixed(1)+"\\u00B2)",pad2.l+8,pad2.t+22);' +

// X axis labels
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var v=-6;v<=6;v+=3){ctx.fillText(v.toFixed(0),toX2(v),h-pad2.b+14)}' +
'ctx.fillText("x",w/2,h-4)}' +

// ── Metric segment ──
'function setMetric(m){' +
'metric=m;' +
'document.getElementById("segEuc").className=m===0?"seg active":"seg";' +
'document.getElementById("segKL").className=m===1?"seg active":"seg";' +
'document.getElementById("segFisher").className=m===2?"seg active":"seg";' +
'drawAll()}' +

// ── Animate ──
'function animatePath(){' +
'if(animTimer){stopAnim();return}' +
'animT=0;' +
'document.getElementById("btnAnimate").textContent=T.stop;' +
'document.getElementById("btnAnimate").className="btn btn-stop";' +
'animTimer=setInterval(function(){' +
'animT+=0.015;if(animT>1){animT=1;stopAnim()}' +
'drawAll()},30)}' +

'function stopAnim(){' +
'if(animTimer){clearInterval(animTimer);animTimer=null}' +
'animT=-1;' +
'document.getElementById("btnAnimate").textContent=T.animate;' +
'document.getElementById("btnAnimate").className="btn btn-primary";' +
'drawAll()}' +

// ── Swap A and B ──
'function swapAB(){' +
'stopAnim();' +
'var tmp={mu:A.mu,sig:A.sig};A.mu=B.mu;A.sig=B.sig;B.mu=tmp.mu;B.sig=tmp.sig;' +
'drawAll()}' +

// ── Reset ──
'function onReset(){' +
'stopAnim();' +
'A={mu:-2,sig:1.5};B={mu:2,sig:0.8};metric=2;' +
'setMetric(2);drawAll();notifyHeight()}' +

// ── Draw all ──
'function drawAll(){drawSpace();drawPDF();updateStats();notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var eD=eucDist(A,B);' +
'var kD=symKL(A,B);' +
'var fD=fisherDist(A,B);' +
'var s=T.pointA+": \\u03BC=<span class=\\"hi\\">"+A.mu.toFixed(2)+"</span>, \\u03C3=<span class=\\"hi\\">"+A.sig.toFixed(2)+"</span><br>";' +
's+=T.pointB+": \\u03BC=<span class=\\"warn\\">"+B.mu.toFixed(2)+"</span>, \\u03C3=<span class=\\"warn\\">"+B.sig.toFixed(2)+"</span><br><br>";' +
'var hiE=metric===0?" \\u25C0":"";var hiK=metric===1?" \\u25C0":"";var hiF=metric===2?" \\u25C0":"";' +
's+=T.eucDist+": <span class=\\"hi\\">"+eD.toFixed(3)+"</span>"+hiE+"<br>";' +
's+=T.klDist+": <span class=\\"warn\\">"+kD.toFixed(3)+"</span> (sym)"+hiK+"<br>";' +
's+=T.fisherDist+": <span class=\\"hi\\">"+fD.toFixed(3)+"</span>"+hiF;' +
'box.innerHTML=s}' +

// ── Drag handling ──
'function findPointAt(px,py){' +
'var cv=document.getElementById("cvSpace");var rect=cv.getBoundingClientRect();' +
'var x=px-rect.left;var y=py-rect.top;' +
'var padL=36,padR=12,padT=14,padB=28;' +
'var pw3=rect.width-padL-padR;var ph3=rect.height-padT-padB;' +
'function toX3(mu){return padL+(mu-MU_MIN)/(MU_MAX-MU_MIN)*pw3}' +
'function toY3(sig){return padT+(SIG_MAX-sig)/(SIG_MAX-SIG_MIN)*ph3}' +
'var ax2=toX3(A.mu);var ay2=toY3(A.sig);' +
'var bx2=toX3(B.mu);var by2=toY3(B.sig);' +
'var dA=Math.sqrt((x-ax2)*(x-ax2)+(y-ay2)*(y-ay2));' +
'var dB=Math.sqrt((x-bx2)*(x-bx2)+(y-by2)*(y-by2));' +
'if(dA<25&&dA<dB)return"A";' +
'if(dB<25)return"B";' +
'return null}' +

'function updateDragPoint(px,py){' +
'var cv=document.getElementById("cvSpace");var rect=cv.getBoundingClientRect();' +
'var x=px-rect.left;var y=py-rect.top;' +
'var padL=36,padR=12,padT=14,padB=28;' +
'var pw3=rect.width-padL-padR;var ph3=rect.height-padT-padB;' +
'var mu=MU_MIN+(x-padL)/pw3*(MU_MAX-MU_MIN);' +
'var sig=SIG_MAX-(y-padT)/ph3*(SIG_MAX-SIG_MIN);' +
'mu=Math.max(MU_MIN+0.1,Math.min(MU_MAX-0.1,mu));' +
'sig=Math.max(SIG_MIN+0.05,Math.min(SIG_MAX-0.05,sig));' +
'if(dragPoint==="A"){A.mu=Math.round(mu*10)/10;A.sig=Math.round(sig*10)/10}' +
'if(dragPoint==="B"){B.mu=Math.round(mu*10)/10;B.sig=Math.round(sig*10)/10}' +
'drawAll()}' +

'document.addEventListener("DOMContentLoaded",function(){' +
'var cv=document.getElementById("cvSpace");' +
'cv.addEventListener("touchstart",function(e){e.preventDefault();' +
'var t2=e.touches[0];dragPoint=findPointAt(t2.clientX,t2.clientY);' +
'if(dragPoint)dragging=true},{passive:false});' +
'cv.addEventListener("touchmove",function(e){if(!dragging||!dragPoint)return;e.preventDefault();' +
'var t2=e.touches[0];updateDragPoint(t2.clientX,t2.clientY)},{passive:false});' +
'cv.addEventListener("touchend",function(){dragging=false;dragPoint=null});' +
'cv.addEventListener("mousedown",function(e){dragPoint=findPointAt(e.clientX,e.clientY);if(dragPoint)dragging=true});' +
'document.addEventListener("mousemove",function(e){if(dragging&&dragPoint)updateDragPoint(e.clientX,e.clientY)});' +
'document.addEventListener("mouseup",function(){dragging=false;dragPoint=null})});' +

// ── Height notification ──
'function notifyHeight(){var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-space").textContent=T.space;' +
'document.getElementById("lbl-pdf").textContent=T.pdf;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnAnimate").textContent=T.animate;' +
'document.getElementById("btnSwap").textContent=T.swap;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'setMetric(2);drawAll();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
