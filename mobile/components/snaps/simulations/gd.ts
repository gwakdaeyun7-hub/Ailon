/**
 * Gradient Descent interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 3 objective functions (quadratic bowl, saddle point, Rastrigin-like 2D)
 * - 3 optimizers running simultaneously: Vanilla GD, Momentum, Adam
 * - 2D contour plot with tap-to-set starting position
 * - Adjustable parameters: learning rate, momentum beta, max iterations, anim speed
 * - Convergence plot (f value over iterations for all 3 optimizers)
 * - Stats panel for each optimizer
 * - Dark/light theme, Korean/English bilingual
 */

export function getGDSimulationHTML(isDark: boolean, lang: string): string {
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
'.ctrl-hint{font-size:10px;color:var(--text3);margin-top:-6px;margin-bottom:8px;padding-left:60px}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'select{width:100%;padding:8px 10px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;font-weight:600;-webkit-appearance:none;appearance:none;border-radius:8px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .gn{color:var(--green);font-weight:700}' +
'.legend-row{display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap}' +
'.legend-item{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600}' +
'.legend-dot{width:10px;height:10px;border:2px solid var(--border)}' +
'</style></head><body>' +

'<div class="panel"><div class="label" id="lbl-func"></div>' +
'<select id="funcSelect" onchange="onFuncChange()"></select></div>' +

'<div class="panel"><div class="label" id="lbl-contour"></div>' +
'<div id="legendBox" class="legend-row"></div>' +
'<canvas id="cvContour" height="280"></canvas></div>' +

'<div class="panel"><div class="label" id="lbl-params"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-lr"></span>' +
'<input type="range" id="slLR" min="0" max="100" value="30" oninput="onParam()">' +
'<span class="ctrl-val" id="valLR"></span></div>' +
'<div class="ctrl-hint" id="hint-lr"></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-beta"></span>' +
'<input type="range" id="slBeta" min="0" max="99" value="90" oninput="onParam()">' +
'<span class="ctrl-val" id="valBeta"></span></div>' +
'<div class="ctrl-hint" id="hint-beta"></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-iter"></span>' +
'<input type="range" id="slIter" min="50" max="500" step="10" value="200" oninput="onParam()">' +
'<span class="ctrl-val" id="valIter"></span></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-speed"></span>' +
'<input type="range" id="slSpeed" min="1" max="20" value="3" oninput="onParam()">' +
'<span class="ctrl-val" id="valSpeed"></span></div>' +
'</div>' +

'<div class="panel"><div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="onRun()"></div>' +
'<div class="btn" id="btnStep" onclick="onStep()"></div>' +
'<div class="btn" id="btnGrad" onclick="toggleGrad()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

'<div class="panel"><div class="label" id="lbl-conv"></div>' +
'<canvas id="cvConv" height="160"></canvas></div>' +

'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──────────────────────────────────────────────────────────
'var L={' +
'ko:{func:"\\uBAA9\\uC801\\uD568\\uC218",contour:"\\uB4F1\\uACE0\\uC120",params:"\\uD30C\\uB77C\\uBBF8\\uD130",' +
'lr:"\\uD559\\uC2B5\\uB960",beta:"\\uBAA8\\uBA58\\uD140",iter:"\\uBC18\\uBCF5\\uD69F\\uC218",speed:"\\uC560\\uB2C8 \\uC18D\\uB3C4",' +
'run:"\\u25B6 \\uC2E4\\uD589",pause:"\\u23F8 \\uC77C\\uC2DC\\uC815\\uC9C0",step:"\\u23ED \\uD55C \\uB2E8\\uACC4",reset:"\\u21BA \\uB9AC\\uC14B",' +
'conv:"\\uC218\\uB834 \\uACFC\\uC815",stats:"\\uD1B5\\uACC4",' +
'hintLR:"\\uD559\\uC2B5\\uB960\\uC774 \\uD074\\uC218\\uB85D \\uBE60\\uB974\\uC9C0\\uB9CC \\uBC1C\\uC0B0 \\uC704\\uD5D8",' +
'hintBeta:"1\\uC5D0 \\uAC00\\uAE4C\\uC6B8\\uC218\\uB85D \\uAD00\\uC131 \\uD6A8\\uACFC\\uAC00 \\uD07D\\uB2C8\\uB2E4",' +
'vanilla:"Vanilla GD",momentum:"Momentum",adam:"Adam",' +
'pos:"\\uC704\\uCE58",fval:"\\uD568\\uC218\\uAC12",iterN:"\\uBC18\\uBCF5",' +
'tapHint:"\\uD0ED\\uD558\\uC5EC \\uC2DC\\uC791\\uC810\\uC744 \\uC124\\uC815\\uD558\\uC138\\uC694",' +
'waiting:"\\uD30C\\uB77C\\uBBF8\\uD130\\uB97C \\uC870\\uC808\\uD558\\uACE0 \\uC2E4\\uD589\\uC744 \\uB20C\\uB7EC\\uBCF4\\uC138\\uC694",' +
'gradOn:"\\uADF8\\uB798\\uB514\\uC5B8\\uD2B8 ON",gradOff:"\\uADF8\\uB798\\uB514\\uC5B8\\uD2B8 OFF",' +
'gradHint:"\\uD654\\uC0B4\\uD45C = \\uAC00\\uC7A5 \\uAC00\\uD30C\\uB978 \\uD558\\uAC15 \\uBC29\\uD5A5 (\\uADF8\\uB798\\uB514\\uC5B8\\uD2B8). \\uBAA8\\uB4E0 \\uB525\\uB7EC\\uB2DD \\uD559\\uC2B5\\uC758 \\uC218\\uD559\\uC801 \\uAE30\\uBC18"},' +
'en:{func:"OBJECTIVE FUNCTION",contour:"CONTOUR PLOT",params:"PARAMETERS",' +
'lr:"Learn Rate",beta:"Momentum",iter:"Iterations",speed:"Anim Speed",' +
'run:"\\u25B6 Run",pause:"\\u23F8 Pause",step:"\\u23ED Step",reset:"\\u21BA Reset",' +
'conv:"CONVERGENCE",stats:"STATISTICS",' +
'hintLR:"Higher = faster but may diverge",' +
'hintBeta:"Closer to 1 = stronger inertia",' +
'vanilla:"Vanilla GD",momentum:"Momentum",adam:"Adam",' +
'pos:"Pos",fval:"f(x,y)",iterN:"Iter",' +
'tapHint:"Tap to set starting point",' +
'waiting:"Adjust parameters and press Run",' +
'gradOn:"Gradient ON",gradOff:"Gradient OFF",' +
'gradHint:"Arrows = steepest descent direction (gradient). Mathematical foundation of all deep learning"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── Objective Functions ─────────────────────────────────────────────
'var FUNCS=[' +
'{id:"bowl",name:"x\\u00B2 + y\\u00B2",fn:function(x,y){return x*x+y*y},bounds:[-4,4]},' +
'{id:"saddle",name:"x\\u00B2 \\u2212 y\\u00B2",fn:function(x,y){return x*x-y*y},bounds:[-4,4]},' +
'{id:"rastrigin",name:"Rastrigin 2D",fn:function(x,y){return 20+x*x-10*Math.cos(2*Math.PI*x)+y*y-10*Math.cos(2*Math.PI*y)},bounds:[-3,3]}' +
'];' +
'var curFunc=FUNCS[0];' +

// ── State ───────────────────────────────────────────────────────────
'var startX=2,startY=2;' +
'var lr,beta,maxIter,speed;' +
'var animating=false,done=false,iteration=0;' +
// Vanilla GD state
'var vx,vy;var vTrail=[];var vHist=[];' +
// Momentum state
'var mx,my,mvx=0,mvy=0;var mTrail=[];var mHist=[];' +
// Adam state
'var ax,ay,am_x=0,am_y=0,av_x=0,av_y=0;var aTrail=[];var aHist=[];' +
'var contourCache=null;' +
'var showGrad=false;' +

// ── DOM refs ────────────────────────────────────────────────────────
'var cvContour=document.getElementById("cvContour");' +
'var cvConv=document.getElementById("cvConv");' +

// ── Init labels ─────────────────────────────────────────────────────
'document.getElementById("lbl-func").textContent=T.func;' +
'document.getElementById("lbl-contour").textContent=T.contour;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-lr").textContent=T.lr;' +
'document.getElementById("lbl-beta").textContent=T.beta;' +
'document.getElementById("lbl-iter").textContent=T.iter;' +
'document.getElementById("lbl-speed").textContent=T.speed;' +
'document.getElementById("lbl-conv").textContent=T.conv;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("hint-lr").textContent=T.hintLR;' +
'document.getElementById("hint-beta").textContent=T.hintBeta;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnStep").textContent=T.step;' +
'document.getElementById("btnGrad").textContent=T.gradOff;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Legend ───────────────────────────────────────────────────────────
'var legBox=document.getElementById("legendBox");' +
'var legColors=["var(--teal)","var(--accent)","var(--green)"];' +
'var legNames=[T.vanilla,T.momentum,T.adam];' +
'for(var li=0;li<3;li++){' +
'var item=document.createElement("div");item.className="legend-item";' +
'var dot=document.createElement("div");dot.className="legend-dot";dot.style.background=legColors[li];' +
'var txt=document.createElement("span");txt.textContent=legNames[li];' +
'item.appendChild(dot);item.appendChild(txt);legBox.appendChild(item)}' +

// ── Populate function selector ──────────────────────────────────────
'var sel=document.getElementById("funcSelect");' +
'for(var i=0;i<FUNCS.length;i++){' +
'var o=document.createElement("option");o.value=i;o.textContent=FUNCS[i].name;sel.appendChild(o)}' +

// ── Canvas DPR setup ────────────────────────────────────────────────
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Read params from UI ─────────────────────────────────────────────
'function readParams(){' +
'var raw=+document.getElementById("slLR").value;' +
'lr=Math.pow(10,-3+raw/100*3);' +
'beta=+document.getElementById("slBeta").value/100;' +
'maxIter=+document.getElementById("slIter").value;' +
'speed=+document.getElementById("slSpeed").value;' +
'document.getElementById("valLR").textContent=lr.toFixed(4);' +
'document.getElementById("valBeta").textContent=beta.toFixed(2);' +
'document.getElementById("valIter").textContent=maxIter;' +
'document.getElementById("valSpeed").textContent="x"+speed}' +

// ── Numerical gradient ──────────────────────────────────────────────
'function grad(fn,x,y){' +
'var h=1e-5;' +
'var dx=(fn(x+h,y)-fn(x-h,y))/(2*h);' +
'var dy=(fn(x,y+h)-fn(x,y-h))/(2*h);' +
'return[dx,dy]}' +

// ── Build contour color bands ───────────────────────────────────────
'function buildContourCache(w,h){' +
'var b=curFunc.bounds[1]-curFunc.bounds[0];' +
'var fn=curFunc.fn;var N=80;' +
'var vals=[];var fMin=Infinity,fMax=-Infinity;' +
'for(var iy=0;iy<N;iy++){for(var ix=0;ix<N;ix++){' +
'var x=curFunc.bounds[0]+ix/N*b;var y=curFunc.bounds[0]+iy/N*b;' +
'var v=fn(x,y);vals.push(v);if(v<fMin)fMin=v;if(v>fMax)fMax=v}}' +
'contourCache={w:w,h:h,N:N,vals:vals,fMin:fMin,fMax:fMax}}' +

// ── Draw contour plot ───────────────────────────────────────────────
'function drawContour(){' +
'var dim=setupCanvas(cvContour,280);var w=dim.w,h=dim.h;' +
'var ctx=cvContour.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var isDk=document.documentElement.classList.contains("dark");' +
'var pad=28;var pw=w-pad*2;var ph=h-pad*2;' +
'var lo=curFunc.bounds[0],hi=curFunc.bounds[1],rng=hi-lo;' +
'function toX(x){return pad+(x-lo)/rng*pw}' +
'function toY(y){return pad+(hi-y)/rng*ph}' +
// build cache if needed
'if(!contourCache||contourCache.w!==w)buildContourCache(w,h);' +
'var cc=contourCache;var N=cc.N;var fMin=cc.fMin,fMax=cc.fMax,fRng=fMax-fMin||1;' +
// draw filled contour cells
'var cw=pw/N,ch=ph/N;' +
'for(var iy=0;iy<N;iy++){for(var ix=0;ix<N;ix++){' +
'var v=cc.vals[iy*N+ix];var t=(v-fMin)/fRng;' +
'var r,g,b;' +
'if(isDk){r=Math.round(17+t*77);g=Math.round(37+t*(234-37)*(1-t*0.7));b=Math.round(37+t*175)}' +
'else{r=Math.round(240-t*146);g=Math.round(253-t*19);b=Math.round(250-t*38)}' +
'ctx.fillStyle="rgb("+r+","+g+","+b+")";' +
'ctx.fillRect(pad+ix*cw,pad+iy*ch,Math.ceil(cw)+1,Math.ceil(ch)+1)}}' +
// contour lines
'var levels=10;ctx.strokeStyle=isDk?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.1)";ctx.lineWidth=0.5;' +
'for(var lv=1;lv<levels;lv++){' +
'var threshold=fMin+lv/levels*fRng;' +
'for(var iy=0;iy<N-1;iy++){for(var ix=0;ix<N-1;ix++){' +
'var v00=cc.vals[iy*N+ix],v10=cc.vals[iy*N+ix+1],v01=cc.vals[(iy+1)*N+ix],v11=cc.vals[(iy+1)*N+ix+1];' +
'var cx0=pad+ix*cw,cy0=pad+iy*ch;' +
'var above0=v00>=threshold?1:0,above1=v10>=threshold?1:0,above2=v11>=threshold?1:0,above3=v01>=threshold?1:0;' +
'var code=above0|above1<<1|above2<<2|above3<<3;' +
'if(code===0||code===15)continue;' +
'ctx.beginPath();' +
// simplified marching squares: draw a line segment for boundary cells
'var mx0=cx0+cw/2,my0=cy0+ch/2;' +
'if(code===5||code===10){ctx.moveTo(mx0-cw*0.4,my0);ctx.lineTo(mx0+cw*0.4,my0)}' +
'else{' +
'var pts=[];' +
'if((above0^above1)===1)pts.push([cx0+cw*(threshold-v00)/(v10-v00+1e-10),cy0]);' +
'if((above1^above2)===1)pts.push([cx0+cw,cy0+ch*(threshold-v10)/(v11-v10+1e-10)]);' +
'if((above3^above2)===1)pts.push([cx0+cw*(threshold-v01)/(v11-v01+1e-10),cy0+ch]);' +
'if((above0^above3)===1)pts.push([cx0,cy0+ch*(threshold-v00)/(v01-v00+1e-10)]);' +
'if(pts.length>=2){ctx.moveTo(pts[0][0],pts[0][1]);ctx.lineTo(pts[1][0],pts[1][1])}}' +
'ctx.stroke()}}}' +
// axis labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var t=0;t<=4;t++){var xv=lo+rng*t/4;ctx.fillText(xv.toFixed(1),toX(xv),h-pad+14)}' +
'ctx.textAlign="right";' +
'for(var t=0;t<=4;t++){var yv=lo+rng*t/4;ctx.fillText(yv.toFixed(1),pad-4,toY(yv)+3)}' +
// axis lines
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();' +
// draw trails: Vanilla (teal), Momentum (accent), Adam (green)
'function drawTrail(trail,color){' +
'if(trail.length<2)return;' +
'ctx.strokeStyle=color;ctx.lineWidth=2;ctx.globalAlpha=0.7;ctx.beginPath();' +
'ctx.moveTo(toX(trail[0][0]),toY(trail[0][1]));' +
'for(var i=1;i<trail.length;i++)ctx.lineTo(toX(trail[i][0]),toY(trail[i][1]));' +
'ctx.stroke();ctx.globalAlpha=1;' +
// dots along trail
'for(var i=0;i<trail.length;i++){var alpha=0.2+0.8*i/trail.length;ctx.globalAlpha=alpha;' +
'ctx.fillStyle=color;ctx.fillRect(toX(trail[i][0])-2,toY(trail[i][1])-2,4,4);' +
'}ctx.globalAlpha=1}' +
'drawTrail(vTrail,tealC);drawTrail(mTrail,accentC);drawTrail(aTrail,greenC);' +
// current positions as larger squares
'function drawPos(trail,color){' +
'if(trail.length===0)return;var p=trail[trail.length-1];' +
'ctx.fillStyle=color;ctx.fillRect(toX(p[0])-5,toY(p[1])-5,10,10);' +
'ctx.strokeStyle=isDk?"rgba(255,255,255,0.5)":"rgba(0,0,0,0.4)";ctx.lineWidth=1;ctx.strokeRect(toX(p[0])-5,toY(p[1])-5,10,10)}' +
'drawPos(vTrail,tealC);drawPos(mTrail,accentC);drawPos(aTrail,greenC);' +
// gradient arrows
'if(showGrad&&iteration>0){' +
'function drawGradArrow(trail,color){' +
'if(trail.length===0)return;' +
'var p=trail[trail.length-1];' +
'var g=grad(curFunc.fn,p[0],p[1]);' +
'var gm=Math.sqrt(g[0]*g[0]+g[1]*g[1]);' +
'if(gm<1e-6)return;' +
'var scale=Math.min(40,gm*8);' +
'var dx=-g[0]/gm*scale;var dy=g[1]/gm*scale;' +
'var px=toX(p[0]);var py=toY(p[1]);' +
'var ex=px+dx;var ey=py+dy;' +
'ctx.strokeStyle=color;ctx.lineWidth=2.5;ctx.globalAlpha=0.9;' +
'ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(ex,ey);ctx.stroke();' +
// arrowhead
'var aLen=8;var aAng=Math.PI/6;' +
'var ang=Math.atan2(ey-py,ex-px);' +
'ctx.beginPath();' +
'ctx.moveTo(ex,ey);' +
'ctx.lineTo(ex-aLen*Math.cos(ang-aAng),ey-aLen*Math.sin(ang-aAng));' +
'ctx.moveTo(ex,ey);' +
'ctx.lineTo(ex-aLen*Math.cos(ang+aAng),ey-aLen*Math.sin(ang+aAng));' +
'ctx.stroke();ctx.globalAlpha=1}' +
'drawGradArrow(vTrail,tealC);drawGradArrow(mTrail,accentC);drawGradArrow(aTrail,greenC)}' +
// start position marker (cross)
'if(iteration===0||vTrail.length>0){' +
'var sx=toX(startX),sy=toY(startY);' +
'ctx.strokeStyle=isDk?"#fff":"#000";ctx.lineWidth=2;' +
'ctx.beginPath();ctx.moveTo(sx-6,sy-6);ctx.lineTo(sx+6,sy+6);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(sx+6,sy-6);ctx.lineTo(sx-6,sy+6);ctx.stroke()}' +
// tap hint
'if(iteration===0&&vTrail.length===0){' +
'ctx.fillStyle=textC;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";ctx.globalAlpha=0.7;' +
'ctx.fillText(T.tapHint,w/2,h-6);ctx.globalAlpha=1}' +
'}' +

// ── Canvas tap handler ──────────────────────────────────────────────
'cvContour.addEventListener("click",function(e){' +
'if(animating)return;' +
'var rect=cvContour.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'var cx=e.clientX-rect.left,cy=e.clientY-rect.top;' +
'var w=rect.width,h=rect.height;var pad=28;' +
'var lo=curFunc.bounds[0],hi=curFunc.bounds[1],rng=hi-lo;' +
'var pw=w-pad*2,ph=h-pad*2;' +
'var nx=lo+(cx-pad)/pw*rng;var ny=hi-(cy-pad)/ph*rng;' +
'if(nx>=lo&&nx<=hi&&ny>=lo&&ny<=hi){startX=nx;startY=ny;resetState()}});' +
'cvContour.addEventListener("touchend",function(e){' +
'e.preventDefault();if(animating||!e.changedTouches.length)return;' +
'var t=e.changedTouches[0];var rect=cvContour.getBoundingClientRect();' +
'var cx=t.clientX-rect.left,cy=t.clientY-rect.top;' +
'var w=rect.width,h=rect.height;var pad=28;' +
'var lo=curFunc.bounds[0],hi=curFunc.bounds[1],rng=hi-lo;' +
'var pw=w-pad*2,ph=h-pad*2;' +
'var nx=lo+(cx-pad)/pw*rng;var ny=hi-(cy-pad)/ph*rng;' +
'if(nx>=lo&&nx<=hi&&ny>=lo&&ny<=hi){startX=nx;startY=ny;resetState()}},{passive:false});' +

// ── Draw convergence plot ───────────────────────────────────────────
'function drawConv(){' +
'var dim=setupCanvas(cvConv,160);var w=dim.w,h=dim.h;' +
'var ctx=cvConv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'if(vHist.length<2){ctx.fillStyle=getComputedStyle(document.documentElement).getPropertyValue("--text3").trim();' +
'ctx.font="12px -apple-system,sans-serif";ctx.textAlign="center";ctx.fillText(T.waiting,w/2,h/2);return}' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var pad=30;var pr=10;var pw=w-pad-pr;var ph=h-pad-20;' +
// find y range across all 3
'var allVals=vHist.concat(mHist).concat(aHist);' +
'var eMin=Infinity,eMax=-Infinity;' +
'for(var i=0;i<allVals.length;i++){var v=allVals[i];if(isFinite(v)){if(v<eMin)eMin=v;if(v>eMax)eMax=v}}' +
'if(!isFinite(eMin)){eMin=0;eMax=1}' +
'var eRange=eMax-eMin||1;eMin-=eRange*0.05;eMax+=eRange*0.05;eRange=eMax-eMin;' +
// clip helper
'function clampY(v){return Math.max(0,Math.min(ph,((eMax-v)/eRange)*ph))}' +
// draw lines
'function drawLine(hist,color,lw){' +
'ctx.strokeStyle=color;ctx.lineWidth=lw;ctx.beginPath();' +
'for(var i=0;i<hist.length;i++){' +
'var px=pad+i/(Math.max(hist.length-1,1))*pw;' +
'var py=20+clampY(hist[i]);' +
'if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke()}' +
'drawLine(vHist,tealC,2);drawLine(mHist,accentC,2);drawLine(aHist,greenC,2);' +
// Y axis labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(eMax.toFixed(1),pad-4,24);ctx.fillText(eMin.toFixed(1),pad-4,ph+22);' +
// X axis
'ctx.textAlign="center";ctx.fillText("0",pad,h-6);ctx.fillText(vHist.length-1+"",w-pr,h-6);' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,18);ctx.lineTo(pad,ph+24);ctx.lineTo(w-pr,ph+24);ctx.stroke();' +
// legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad+8,h-8);ctx.lineTo(pad+22,h-8);ctx.stroke();' +
'ctx.fillStyle=textC;ctx.fillText("GD",pad+26,h-4);' +
'ctx.strokeStyle=accentC;ctx.beginPath();ctx.moveTo(pad+52,h-8);ctx.lineTo(pad+66,h-8);ctx.stroke();' +
'ctx.fillText("Mom",pad+70,h-4);' +
'ctx.strokeStyle=greenC;ctx.beginPath();ctx.moveTo(pad+104,h-8);ctx.lineTo(pad+118,h-8);ctx.stroke();' +
'ctx.fillText("Adam",pad+122,h-4)' +
'}' +

// ── Update stats ────────────────────────────────────────────────────
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(vTrail.length===0){box.innerHTML=T.waiting;return}' +
'var fn=curFunc.fn;' +
'var vp=vTrail[vTrail.length-1],mp=mTrail[mTrail.length-1],ap=aTrail[aTrail.length-1];' +
'var s="<span class=\\"hi\\">"+T.vanilla+"</span> ("+vp[0].toFixed(2)+","+vp[1].toFixed(2)+") f="+fn(vp[0],vp[1]).toFixed(2)+"<br>";' +
's+="<span class=\\"warn\\">"+T.momentum+"</span> ("+mp[0].toFixed(2)+","+mp[1].toFixed(2)+") f="+fn(mp[0],mp[1]).toFixed(2)+"<br>";' +
's+="<span class=\\"gn\\">"+T.adam+"</span> ("+ap[0].toFixed(2)+","+ap[1].toFixed(2)+") f="+fn(ap[0],ap[1]).toFixed(2)+"<br>";' +
's+=T.iterN+": "+iteration+"/"+maxIter;' +
'if(showGrad){s+="<br><br><span style=\\"font-size:10px;color:var(--teal);font-style:italic\\">"+T.gradHint+"</span>"}' +
'box.innerHTML=s}' +

// ── Optimizer step ──────────────────────────────────────────────────
'function gdStep(){' +
'if(iteration>=maxIter){done=true;return}' +
'var fn=curFunc.fn;' +
// Vanilla GD
'var gv=grad(fn,vx,vy);vx-=lr*gv[0];vy-=lr*gv[1];' +
'vTrail.push([vx,vy]);vHist.push(fn(vx,vy));' +
// Momentum
'var gm=grad(fn,mx,my);mvx=beta*mvx+gm[0];mvy=beta*mvy+gm[1];mx-=lr*mvx;my-=lr*mvy;' +
'mTrail.push([mx,my]);mHist.push(fn(mx,my));' +
// Adam
'var ga=grad(fn,ax,ay);var t=iteration+1;' +
'am_x=0.9*am_x+0.1*ga[0];am_y=0.9*am_y+0.1*ga[1];' +
'av_x=0.999*av_x+0.001*ga[0]*ga[0];av_y=0.999*av_y+0.001*ga[1]*ga[1];' +
'var mhx=am_x/(1-Math.pow(0.9,t));var mhy=am_y/(1-Math.pow(0.9,t));' +
'var vhx=av_x/(1-Math.pow(0.999,t));var vhy=av_y/(1-Math.pow(0.999,t));' +
'ax-=lr*mhx/(Math.sqrt(vhx)+1e-8);ay-=lr*mhy/(Math.sqrt(vhy)+1e-8);' +
'aTrail.push([ax,ay]);aHist.push(fn(ax,ay));' +
'iteration++}' +

// ── Reset state ─────────────────────────────────────────────────────
'function resetState(){' +
'readParams();iteration=0;done=false;animating=false;' +
'vx=startX;vy=startY;vTrail=[];vHist=[];' +
'mx=startX;my=startY;mvx=0;mvy=0;mTrail=[];mHist=[];' +
'ax=startX;ay=startY;am_x=0;am_y=0;av_x=0;av_y=0;aTrail=[];aHist=[];' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'drawContour();drawConv();updateStats();notifyHeight()}' +

// ── Animation loop ──────────────────────────────────────────────────
'function animate(){' +
'if(!animating)return;' +
'for(var s=0;s<speed&&!done;s++){gdStep()}' +
'drawContour();drawConv();updateStats();' +
'if(done){animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'notifyHeight();return}' +
'requestAnimationFrame(animate)}' +

// ── Event handlers ──────────────────────────────────────────────────
'function onFuncChange(){' +
'curFunc=FUNCS[+document.getElementById("funcSelect").value];' +
'contourCache=null;startX=curFunc.bounds[1]*0.5;startY=curFunc.bounds[1]*0.5;' +
'resetState()}' +

'function onParam(){readParams();if(!animating&&iteration===0){drawContour()}}' +

'function onRun(){' +
'if(animating){animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";return}' +
'if(done)resetState();' +
'readParams();if(iteration===0){' +
'vx=startX;vy=startY;vTrail=[];vHist=[];' +
'mx=startX;my=startY;mvx=0;mvy=0;mTrail=[];mHist=[];' +
'ax=startX;ay=startY;am_x=0;am_y=0;av_x=0;av_y=0;aTrail=[];aHist=[]}' +
'animating=true;' +
'document.getElementById("btnRun").textContent=T.pause;' +
'document.getElementById("btnRun").className="btn btn-stop";' +
'animate()}' +

'function onStep(){' +
'if(animating){animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary"}' +
'if(done)return;' +
'readParams();if(iteration===0){' +
'vx=startX;vy=startY;vTrail=[];vHist=[];' +
'mx=startX;my=startY;mvx=0;mvy=0;mTrail=[];mHist=[];' +
'ax=startX;ay=startY;am_x=0;am_y=0;av_x=0;av_y=0;aTrail=[];aHist=[]}' +
'gdStep();drawContour();drawConv();updateStats();notifyHeight()}' +

'function onReset(){animating=false;showGrad=false;' +
'document.getElementById("btnGrad").textContent=T.gradOff;' +
'document.getElementById("btnGrad").className="btn";' +
'resetState()}' +

// ── Gradient toggle ─────────────────────────────────────────────────
'function toggleGrad(){' +
'showGrad=!showGrad;' +
'document.getElementById("btnGrad").textContent=showGrad?T.gradOn:T.gradOff;' +
'document.getElementById("btnGrad").className=showGrad?"btn btn-primary":"btn";' +
'drawContour();updateStats();notifyHeight()}' +

// ── Height notification ─────────────────────────────────────────────
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init ────────────────────────────────────────────────────────────
'readParams();resetState();' +
'window.addEventListener("resize",function(){contourCache=null;drawContour();drawConv();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
