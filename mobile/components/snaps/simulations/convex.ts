/**
 * Convex vs Non-Convex Optimization interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Split canvas: convex (single minimum) vs non-convex (multiple local minima)
 * - 5 colored dots per side doing gradient descent simultaneously
 * - Contour plots with level lines
 * - Function selector (2 convex, 2 non-convex)
 * - Learning rate slider, tap-to-place starting points
 * - Dark/light theme, Korean/English bilingual
 */

export function getConvexSimulationHTML(isDark: boolean, lang: string): string {
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
'select{width:100%;padding:8px 10px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;font-weight:600;-webkit-appearance:none;appearance:none;border-radius:8px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .gn{color:var(--green);font-weight:700}' +
'.canvas-pair{display:flex;gap:4px}' +
'.canvas-wrap{flex:1;position:relative}' +
'.canvas-wrap canvas{width:100%;height:200px}' +
'.canvas-label{position:absolute;bottom:6px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:800;padding:2px 6px;border:2px solid}' +
'.canvas-label.good{color:var(--green);border-color:var(--green);background:var(--card)}' +
'.canvas-label.bad{color:var(--accent);border-color:var(--accent);background:var(--card)}' +
'.sel-row{display:flex;gap:6px;margin-bottom:8px}' +
'.sel-row select{flex:1}' +
'</style></head><body>' +

// ── Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-canvas"></div>' +
'<div class="canvas-pair">' +
'<div class="canvas-wrap"><canvas id="cvL" height="200"></canvas>' +
'<div class="canvas-label good" id="lblL"></div></div>' +
'<div class="canvas-wrap"><canvas id="cvR" height="200"></canvas>' +
'<div class="canvas-label bad" id="lblR"></div></div>' +
'</div></div>' +

// ── Function Selector Panel ──
'<div class="panel"><div class="label" id="lbl-func"></div>' +
'<div class="sel-row">' +
'<select id="selL" onchange="onFuncChange()"></select>' +
'<select id="selR" onchange="onFuncChange()"></select>' +
'</div></div>' +

// ── Parameters Panel ──
'<div class="panel"><div class="label" id="lbl-params"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-lr"></span>' +
'<input type="range" id="slLR" min="1" max="50" value="10" oninput="onLR()">' +
'<span class="ctrl-val" id="valLR"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="onRun()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{canvas:"\\uBCFC\\uB85D vs \\uBE44\\uBCFC\\uB85D \\uCD5C\\uC801\\uD654",func:"\\uD568\\uC218 \\uC120\\uD0DD",params:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'convex:"\\uBCFC\\uB85D \\uD568\\uC218",nonconvex:"\\uBE44\\uBCFC\\uB85D \\uD568\\uC218",' +
'global:"\\u2713 \\uC804\\uC5ED \\uCD5C\\uC801",local:"\\u26A0 \\uC9C0\\uC5ED \\uCD5C\\uC801",' +
'lr:"\\uD559\\uC2B5\\uB960",run:"\\uC2E4\\uD589",reset:"\\u21BA \\uB9AC\\uC14B",' +
'bowl:"\\uB2E8\\uC21C \\uBCFC (x\\u00B2+y\\u00B2)",ellip:"\\uD0C0\\uC6D0\\uD615 (2x\\u00B2+y\\u00B2)",' +
'sinsin:"sin\\u00B7sin + \\uC774\\uCC28",rastr:"Rastrigin \\uC720\\uC0AC",' +
'steps:"\\uB2E8\\uACC4",val:"\\uCD5C\\uC885\\uAC12",converged:"\\uC218\\uB834",' +
'waiting:"\\uC2E4\\uD589\\uC744 \\uB20C\\uB7EC \\uACBD\\uC0AC\\uD558\\uAC15\\uC744 \\uC2DC\\uC791\\uD558\\uC138\\uC694",' +
'tapHint:"\\uD0ED\\uD558\\uC5EC \\uC2DC\\uC791\\uC810 \\uBC30\\uCE58"},' +
'en:{canvas:"CONVEX vs NON-CONVEX",func:"FUNCTION SELECT",params:"PARAMETERS",stats:"STATISTICS",' +
'convex:"Convex Function",nonconvex:"Non-Convex Function",' +
'global:"\\u2713 Global Optimum",local:"\\u26A0 Local Optima",' +
'lr:"Learn Rate",run:"Run",reset:"\\u21BA Reset",' +
'bowl:"Bowl (x\\u00B2+y\\u00B2)",ellip:"Elliptical (2x\\u00B2+y\\u00B2)",' +
'sinsin:"sin\\u00B7sin + quad",rastr:"Rastrigin-like",' +
'steps:"Steps",val:"Final Val",converged:"Converged",' +
'waiting:"Press Run to start gradient descent",' +
'tapHint:"Tap to place starting points"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var lr=0.1;var running=false;var animId=null;var step=0;var maxSteps=300;' +
'var COLORS=["#5EEAD4","#F59E0B","#EF4444","#15803D","#78716C"];' +
'var dotsL=[];var dotsR=[];' +
'var funcIdxL=0;var funcIdxR=0;' +

// ── Functions ──
// Convex functions
'var convexFns=[' +
'{f:function(x,y){return x*x+y*y},gx:function(x,y){return 2*x},gy:function(x,y){return 2*y}},' +
'{f:function(x,y){return 2*x*x+y*y},gx:function(x,y){return 4*x},gy:function(x,y){return 2*y}}' +
'];' +
// Non-convex functions
'var ncFns=[' +
'{f:function(x,y){return Math.sin(2*x)*Math.sin(2*y)+0.1*(x*x+y*y)},' +
'gx:function(x,y){return 2*Math.cos(2*x)*Math.sin(2*y)+0.2*x},' +
'gy:function(x,y){return Math.sin(2*x)*2*Math.cos(2*y)+0.2*y}},' +
'{f:function(x,y){var a=x*x+y*y;return 20+a-10*(Math.cos(2*Math.PI*x)+Math.cos(2*Math.PI*y))},' +
'gx:function(x,y){return 2*x+10*2*Math.PI*Math.sin(2*Math.PI*x)},' +
'gy:function(x,y){return 2*y+10*2*Math.PI*Math.sin(2*Math.PI*y)}}' +
'];' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Random starting positions ──
'function randDots(){' +
'var d=[];for(var i=0;i<5;i++){d.push({x:-2+Math.random()*4,y:-2+Math.random()*4,path:[],done:false})}return d}' +

// ── Draw contour + dots ──
'function drawSide(canvasId,fn,dots,range){' +
'var cv=document.getElementById(canvasId);' +
'var dim=setupCanvas(cv,200);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var r=range||3;' +

// Compute contour values
'var res=50;var vals=[];var minV=Infinity,maxV=-Infinity;' +
'for(var iy=0;iy<res;iy++){vals[iy]=[];for(var ix=0;ix<res;ix++){' +
'var x=-r+2*r*ix/(res-1);var y=-r+2*r*iy/(res-1);' +
'var v=fn.f(x,y);vals[iy][ix]=v;' +
'if(v<minV)minV=v;if(v>maxV)maxV=v}}' +

// Draw heatmap
'var cw=w/res;var ch=h/res;' +
'for(var iy=0;iy<res;iy++){for(var ix=0;ix<res;ix++){' +
'var t=(vals[iy][ix]-minV)/(maxV-minV+1e-10);' +
'var hue=240-t*240;' +
'ctx.fillStyle="hsl("+hue+",50%,"+(document.documentElement.classList.contains("dark")?"20%":"85%")+")";' +
'ctx.fillRect(ix*cw,iy*ch,cw+1,ch+1)}}' +

// Draw contour lines
'var levels=12;' +
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.globalAlpha=0.5;' +
'for(var l=1;l<levels;l++){' +
'var threshold=minV+(maxV-minV)*l/levels;' +
'for(var iy=0;iy<res-1;iy++){for(var ix=0;ix<res-1;ix++){' +
'var v00=vals[iy][ix]>=threshold?1:0;' +
'var v10=vals[iy][ix+1]>=threshold?1:0;' +
'var v01=vals[iy+1][ix]>=threshold?1:0;' +
'var v11=vals[iy+1][ix+1]>=threshold?1:0;' +
'var c=v00+v10*2+v01*4+v11*8;' +
'if(c!==0&&c!==15){ctx.beginPath();' +
'var cx=ix*cw+cw/2;var cy=iy*ch+ch/2;' +
'ctx.arc(cx,cy,0.5,0,6.28);ctx.stroke()}}}}' +
'ctx.globalAlpha=1;' +

// Draw dots and trails
'for(var i=0;i<dots.length;i++){' +
'var d=dots[i];' +
// trail
'if(d.path.length>1){' +
'ctx.strokeStyle=COLORS[i];ctx.lineWidth=1.5;ctx.globalAlpha=0.6;ctx.beginPath();' +
'for(var j=0;j<d.path.length;j++){' +
'var px=(d.path[j].x+r)/(2*r)*w;var py=(d.path[j].y+r)/(2*r)*h;' +
'if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}' +
'ctx.stroke();ctx.globalAlpha=1}' +
// dot
'var dx=(d.x+r)/(2*r)*w;var dy=(d.y+r)/(2*r)*h;' +
'ctx.fillStyle=COLORS[i];ctx.beginPath();ctx.arc(dx,dy,5,0,6.28);ctx.fill();' +
'ctx.strokeStyle="var(--text)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(dx,dy,5,0,6.28);ctx.stroke()' +
'}}' +

// ── Gradient descent step ──
'function gdStep(dots,fn){' +
'var allDone=true;' +
'for(var i=0;i<dots.length;i++){' +
'var d=dots[i];if(d.done)continue;' +
'd.path.push({x:d.x,y:d.y});' +
'var gx=fn.gx(d.x,d.y);var gy=fn.gy(d.x,d.y);' +
'var mag=Math.sqrt(gx*gx+gy*gy);' +
'if(mag<0.001){d.done=true;continue}' +
'allDone=false;' +
'd.x-=lr*gx;d.y-=lr*gy;' +
// clamp
'if(d.x<-3)d.x=-3;if(d.x>3)d.x=3;' +
'if(d.y<-3)d.y=-3;if(d.y>3)d.y=3}' +
'return allDone}' +

// ── Animation loop ──
'function animate(){' +
'if(!running)return;' +
'var doneL=gdStep(dotsL,convexFns[funcIdxL]);' +
'var doneR=gdStep(dotsR,ncFns[funcIdxR]);' +
'step++;' +
'drawSide("cvL",convexFns[funcIdxL],dotsL);' +
'drawSide("cvR",ncFns[funcIdxR],dotsR);' +
'updateStats();' +
'if((doneL&&doneR)||step>=maxSteps){running=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'updateStats();notifyHeight();return}' +
'animId=requestAnimationFrame(animate)}' +

// ── Run / Stop toggle ──
'function onRun(){' +
'if(running){running=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";return}' +
'running=true;step=0;' +
'for(var i=0;i<dotsL.length;i++){dotsL[i].path=[];dotsL[i].done=false}' +
'for(var i=0;i<dotsR.length;i++){dotsR[i].path=[];dotsR[i].done=false}' +
'document.getElementById("btnRun").textContent="\\u25A0 Stop";' +
'document.getElementById("btnRun").className="btn btn-stop";' +
'animate()}' +

// ── Reset ──
'function onReset(){' +
'running=false;step=0;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'dotsL=randDots();dotsR=randDots();' +
'drawSide("cvL",convexFns[funcIdxL],dotsL);' +
'drawSide("cvR",ncFns[funcIdxR],dotsR);' +
'updateStats();notifyHeight()}' +

// ── LR slider ──
'function onLR(){' +
'lr=+document.getElementById("slLR").value/100;' +
'document.getElementById("valLR").textContent=lr.toFixed(2)}' +

// ── Function change ──
'function onFuncChange(){' +
'funcIdxL=+document.getElementById("selL").value;' +
'funcIdxR=+document.getElementById("selR").value;' +
'onReset()}' +

// ── Tap to place dot ──
'function tapCanvas(canvasId,e,dots,fn){' +
'if(running)return;' +
'var cv=document.getElementById(canvasId);var rect=cv.getBoundingClientRect();' +
'var touch=e.touches?e.touches[0]:e;' +
'var px=touch.clientX-rect.left;var py=touch.clientY-rect.top;' +
'var x=-3+6*px/rect.width;var y=-3+6*py/rect.height;' +
// replace the dot with most steps (or first)
'var idx=0;for(var i=1;i<dots.length;i++){if(dots[i].path.length>dots[idx].path.length)idx=i}' +
'dots[idx]={x:x,y:y,path:[],done:false};' +
'if(canvasId==="cvL")drawSide("cvL",convexFns[funcIdxL],dotsL);' +
'else drawSide("cvR",ncFns[funcIdxR],dotsR)}' +

'document.getElementById("cvL").addEventListener("touchstart",function(e){e.preventDefault();tapCanvas("cvL",e,dotsL,convexFns[funcIdxL])});' +
'document.getElementById("cvR").addEventListener("touchstart",function(e){e.preventDefault();tapCanvas("cvR",e,dotsR,ncFns[funcIdxR])});' +
'document.getElementById("cvL").addEventListener("click",function(e){tapCanvas("cvL",e,dotsL,convexFns[funcIdxL])});' +
'document.getElementById("cvR").addEventListener("click",function(e){tapCanvas("cvR",e,dotsR,ncFns[funcIdxR])});' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(step===0){box.innerHTML=T.waiting+"<br><span style=\\"color:var(--text3);font-size:10px\\">"+T.tapHint+"</span>";return}' +
'var s="<span class=\\"hi\\">' + "' + T.convex + '" + '</span><br>";' +
'for(var i=0;i<dotsL.length;i++){' +
'var d=dotsL[i];var v=convexFns[funcIdxL].f(d.x,d.y);' +
's+="<span style=\\"color:"+COLORS[i]+"\\">\\u25CF</span> "+T.val+": "+v.toFixed(4);' +
'if(d.done)s+=" <span class=\\"gn\\">"+T.converged+"</span>";' +
's+="<br>"}' +
's+="<br><span class=\\"warn\\">' + "' + T.nonconvex + '" + '</span><br>";' +
'for(var i=0;i<dotsR.length;i++){' +
'var d=dotsR[i];var v=ncFns[funcIdxR].f(d.x,d.y);' +
's+="<span style=\\"color:"+COLORS[i]+"\\">\\u25CF</span> "+T.val+": "+v.toFixed(4);' +
'if(d.done)s+=" <span class=\\"gn\\">"+T.converged+"</span>";' +
's+="<br>"}' +
's+="<br>"+T.steps+": <span class=\\"hi\\">"+step+"</span>";' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-canvas").textContent=T.canvas;' +
'document.getElementById("lbl-func").textContent=T.func;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-lr").textContent=T.lr;' +
'document.getElementById("lblL").textContent=T.global;' +
'document.getElementById("lblR").textContent=T.local;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("valLR").textContent="0.10";' +

// Populate selects
'var selL=document.getElementById("selL");var selR=document.getElementById("selR");' +
'var cLabels=[T.bowl,T.ellip];var nLabels=[T.sinsin,T.rastr];' +
'for(var i=0;i<cLabels.length;i++){var o=document.createElement("option");o.value=i;o.textContent=cLabels[i];selL.appendChild(o)}' +
'for(var i=0;i<nLabels.length;i++){var o=document.createElement("option");o.value=i;o.textContent=nLabels[i];selR.appendChild(o)}' +

// ── Init ──
'dotsL=randDots();dotsR=randDots();' +
'drawSide("cvL",convexFns[0],dotsL);drawSide("cvR",ncFns[0],dotsR);' +
'updateStats();' +
'window.addEventListener("resize",function(){drawSide("cvL",convexFns[funcIdxL],dotsL);drawSide("cvR",ncFns[funcIdxR],dotsR);notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
