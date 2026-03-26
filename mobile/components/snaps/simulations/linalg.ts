/**
 * Linear Algebra & Neural Networks interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 2D coordinate grid with "F" shape made of colored dots
 * - 4 matrix element sliders for real-time 2x2 transformation
 * - Bias vector sliders (togglable)
 * - ReLU toggle showing grid fold at axes
 * - Preset transformations: Identity, Rotation 45, Scale 2x, Shear, Reflection
 * - Classification demo toggle
 * - Dark/light theme, Korean/English bilingual
 */

export function getLinalgSimulationHTML(isDark: boolean, lang: string): string {
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
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:36px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:42px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px;flex-wrap:wrap}' +
'.btn{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;-webkit-tap-highlight-color:transparent;min-width:54px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.toggle-row{display:flex;gap:6px;margin-bottom:8px}' +
'.toggle{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer}' +
'.toggle:active{opacity:0.7}' +
'.toggle.on{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.matrix-display{font-family:monospace;font-size:13px;text-align:center;color:var(--text);margin-bottom:8px;line-height:1.8}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'</style></head><body>' +

// ── Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-canvas"></div>' +
'<canvas id="cv" height="240"></canvas></div>' +

// ── Matrix Display ──
'<div class="panel"><div class="label" id="lbl-matrix"></div>' +
'<div class="matrix-display" id="matDisp"></div>' +

// Matrix sliders
'<div class="row"><span class="ctrl-name">a\u2081\u2081</span>' +
'<input type="range" id="sl11" min="-20" max="20" value="10" oninput="onMatrix()">' +
'<span class="ctrl-val" id="v11"></span></div>' +
'<div class="row"><span class="ctrl-name">a\u2081\u2082</span>' +
'<input type="range" id="sl12" min="-20" max="20" value="0" oninput="onMatrix()">' +
'<span class="ctrl-val" id="v12"></span></div>' +
'<div class="row"><span class="ctrl-name">a\u2082\u2081</span>' +
'<input type="range" id="sl21" min="-20" max="20" value="0" oninput="onMatrix()">' +
'<span class="ctrl-val" id="v21"></span></div>' +
'<div class="row"><span class="ctrl-name">a\u2082\u2082</span>' +
'<input type="range" id="sl22" min="-20" max="20" value="10" oninput="onMatrix()">' +
'<span class="ctrl-val" id="v22"></span></div>' +

// Bias sliders (hidden by default)
'<div id="biasPanel" style="display:none">' +
'<div class="row"><span class="ctrl-name">b\u2081</span>' +
'<input type="range" id="slb1" min="-20" max="20" value="0" oninput="onMatrix()">' +
'<span class="ctrl-val" id="vb1"></span></div>' +
'<div class="row"><span class="ctrl-name">b\u2082</span>' +
'<input type="range" id="slb2" min="-20" max="20" value="0" oninput="onMatrix()">' +
'<span class="ctrl-val" id="vb2"></span></div>' +
'</div></div>' +

// ── Toggles ──
'<div class="panel"><div class="label" id="lbl-opts"></div>' +
'<div class="toggle-row">' +
'<div class="toggle" id="togBias" onclick="toggleBias()"></div>' +
'<div class="toggle" id="togRelu" onclick="toggleRelu()"></div>' +
'<div class="toggle" id="togClass" onclick="toggleClass()"></div>' +
'</div></div>' +

// ── Presets ──
'<div class="panel"><div class="label" id="lbl-presets"></div>' +
'<div class="btn-row">' +
'<div class="btn" onclick="applyPreset(1,0,0,1)"></div>' +
'<div class="btn" onclick="applyPreset(0.707,-0.707,0.707,0.707)"></div>' +
'<div class="btn" onclick="applyPreset(2,0,0,2)"></div>' +
'<div class="btn" onclick="applyPreset(1,0.5,0,1)"></div>' +
'<div class="btn" onclick="applyPreset(-1,0,0,1)"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{canvas:"\\uD589\\uB82C \\uBCC0\\uD658",matrix:"\\uBCC0\\uD658 \\uD589\\uB82C",opts:"\\uC635\\uC158",presets:"\\uD504\\uB9AC\\uC14B",stats:"\\uC0C1\\uD0DC",' +
'bias:"\\uD3B8\\uD5A5",relu:"ReLU",classify:"\\uBD84\\uB958",' +
'identity:"\\uD56D\\uB4F1",rotate:"\\uD68C\\uC804 45\\u00B0",scale:"\\uC2A4\\uCF00\\uC77C 2x",shear:"\\uC804\\uB2E8",reflect:"\\uBC18\\uC0AC",' +
'det:"\\uD589\\uB82C\\uC2DD",area:"\\uBA74\\uC801 \\uBE44\\uC728",reluNote:"ReLU: \\uC74C\\uC218 \\uC601\\uC5ED \\u2192 0 (\\uC811\\uD798)",' +
'classNote:"\\uBE68\\uAC15/\\uD30C\\uB791 \\uC810\\uC774 \\uBCC0\\uD658 \\uD6C4 \\uBD84\\uB9AC\\uB428"},' +
'en:{canvas:"MATRIX TRANSFORM",matrix:"TRANSFORM MATRIX",opts:"OPTIONS",presets:"PRESETS",stats:"STATE",' +
'bias:"Bias",relu:"ReLU",classify:"Classify",' +
'identity:"Identity",rotate:"Rot 45\\u00B0",scale:"Scale 2x",shear:"Shear",reflect:"Reflect",' +
'det:"Determinant",area:"Area Ratio",reluNote:"ReLU: negative region \\u2192 0 (fold)",' +
'classNote:"Red/blue points separate after transform"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var a11=1,a12=0,a21=0,a22=1,b1=0,b2=0;' +
'var useBias=false,useRelu=false,useClassify=false;' +

// Grid points
'var gridPts=[];' +
'for(var gy=-5;gy<=5;gy++){for(var gx=-5;gx<=5;gx++){gridPts.push({x:gx*0.4,y:gy*0.4})}}' +

// F-shape points
'var fPts=[' +
'{x:-0.4,y:-0.8},{x:-0.4,y:-0.4},{x:-0.4,y:0},{x:-0.4,y:0.4},{x:-0.4,y:0.8},' +
'{x:0,y:0.8},{x:0.4,y:0.8},' +
'{x:0,y:0},{x:0.4,y:0},' +
'{x:0,y:-0.8},' +
'{x:-0.2,y:-0.8},{x:-0.2,y:0.8},{x:-0.4,y:-0.2},{x:-0.4,y:0.2},{x:0.2,y:0.8}' +
'];' +

// Classification points
'var classPts=[];' +
'(function(){' +
'for(var i=0;i<20;i++){var a=Math.random()*6.28;var r=0.3+Math.random()*0.5;classPts.push({x:r*Math.cos(a)-0.8,y:r*Math.sin(a)-0.8,c:0})}' +
'for(var i=0;i<20;i++){var a=Math.random()*6.28;var r=0.3+Math.random()*0.5;classPts.push({x:r*Math.cos(a)+0.8,y:r*Math.sin(a)+0.8,c:1})}' +
'})();' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Transform a point ──
'function xform(px,py){' +
'var nx=a11*px+a12*py;var ny=a21*px+a22*py;' +
'if(useBias){nx+=b1;ny+=b2}' +
'if(useRelu){nx=Math.max(0,nx);ny=Math.max(0,ny)}' +
'return{x:nx,y:ny}}' +

// ── Draw ──
'function draw(){' +
'var cv=document.getElementById("cv");' +
'var dim=setupCanvas(cv,240);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var cx=w/2,cy=h/2;var scale=Math.min(w,h)/5;' +

// Draw axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();' +

// Axis labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText("x",w-8,cy-4);ctx.fillText("y",cx+8,10);' +

// Grid ticks
'for(var i=-2;i<=2;i++){if(i===0)continue;' +
'ctx.fillText(i.toString(),cx+i*scale,cy+12);' +
'ctx.fillText(i.toString(),cx-14,cy-i*scale+3)}' +

// Draw transformed grid points (gray)
'ctx.globalAlpha=0.25;' +
'for(var i=0;i<gridPts.length;i++){' +
'var p=xform(gridPts[i].x,gridPts[i].y);' +
'var sx=cx+p.x*scale;var sy=cy-p.y*scale;' +
'ctx.fillStyle=borderC;ctx.beginPath();ctx.arc(sx,sy,2,0,6.28);ctx.fill()}' +
'ctx.globalAlpha=1;' +

// Draw transformed grid lines for structure visibility
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.globalAlpha=0.15;' +
// horizontal grid lines
'for(var gy=-5;gy<=5;gy++){ctx.beginPath();' +
'for(var gx=-5;gx<=5;gx++){' +
'var p=xform(gx*0.4,gy*0.4);var sx=cx+p.x*scale;var sy=cy-p.y*scale;' +
'if(gx===-5)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy)}ctx.stroke()}' +
// vertical grid lines
'for(var gx=-5;gx<=5;gx++){ctx.beginPath();' +
'for(var gy=-5;gy<=5;gy++){' +
'var p=xform(gx*0.4,gy*0.4);var sx=cx+p.x*scale;var sy=cy-p.y*scale;' +
'if(gy===-5)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy)}ctx.stroke()}' +
'ctx.globalAlpha=1;' +

// Draw classification points if enabled
'if(useClassify){' +
'for(var i=0;i<classPts.length;i++){' +
'var p=xform(classPts[i].x,classPts[i].y);' +
'var sx=cx+p.x*scale;var sy=cy-p.y*scale;' +
'ctx.fillStyle=classPts[i].c===0?"#EF4444":"#3B82F6";' +
'ctx.beginPath();ctx.arc(sx,sy,4,0,6.28);ctx.fill();' +
'ctx.strokeStyle="var(--text)";ctx.lineWidth=1;ctx.beginPath();ctx.arc(sx,sy,4,0,6.28);ctx.stroke()}}' +

// Draw transformed F-shape (teal)
'for(var i=0;i<fPts.length;i++){' +
'var p=xform(fPts[i].x,fPts[i].y);' +
'var sx=cx+p.x*scale;var sy=cy-p.y*scale;' +
'ctx.fillStyle=tealC;ctx.beginPath();ctx.arc(sx,sy,5,0,6.28);ctx.fill();' +
'ctx.strokeStyle="var(--text)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(sx,sy,5,0,6.28);ctx.stroke()}' +

// ReLU fold line indicator
'if(useRelu){' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.globalAlpha=0.6;' +
'ctx.beginPath();ctx.moveTo(cx,0);ctx.lineTo(cx,h);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(0,cy);ctx.lineTo(w,cy);ctx.stroke();' +
'ctx.setLineDash([]);ctx.globalAlpha=1;' +
'ctx.fillStyle=accentC;ctx.font="9px monospace";ctx.textAlign="left";' +
'ctx.fillText("ReLU",cx+4,14)}' +

'updateMatDisp();updateStats();notifyHeight()}' +

// ── Matrix display ──
'function updateMatDisp(){' +
'var s="[ "+a11.toFixed(1)+"  "+a12.toFixed(1)+" ]\\n[ "+a21.toFixed(1)+"  "+a22.toFixed(1)+" ]";' +
'if(useBias)s+="  +  [ "+b1.toFixed(1)+"  "+b2.toFixed(1)+" ]";' +
'if(useRelu)s+="  \\u2192 ReLU";' +
'document.getElementById("matDisp").textContent=s}' +

// ── Slider handler ──
'function onMatrix(){' +
'a11=+document.getElementById("sl11").value/10;' +
'a12=+document.getElementById("sl12").value/10;' +
'a21=+document.getElementById("sl21").value/10;' +
'a22=+document.getElementById("sl22").value/10;' +
'b1=+document.getElementById("slb1").value/10;' +
'b2=+document.getElementById("slb2").value/10;' +
'document.getElementById("v11").textContent=a11.toFixed(1);' +
'document.getElementById("v12").textContent=a12.toFixed(1);' +
'document.getElementById("v21").textContent=a21.toFixed(1);' +
'document.getElementById("v22").textContent=a22.toFixed(1);' +
'document.getElementById("vb1").textContent=b1.toFixed(1);' +
'document.getElementById("vb2").textContent=b2.toFixed(1);' +
'draw()}' +

// ── Presets ──
'function applyPreset(m11,m12,m21,m22){' +
'a11=m11;a12=m12;a21=m21;a22=m22;' +
'document.getElementById("sl11").value=Math.round(m11*10);' +
'document.getElementById("sl12").value=Math.round(m12*10);' +
'document.getElementById("sl21").value=Math.round(m21*10);' +
'document.getElementById("sl22").value=Math.round(m22*10);' +
'document.getElementById("v11").textContent=a11.toFixed(1);' +
'document.getElementById("v12").textContent=a12.toFixed(1);' +
'document.getElementById("v21").textContent=a21.toFixed(1);' +
'document.getElementById("v22").textContent=a22.toFixed(1);' +
'draw()}' +

// ── Toggles ──
'function toggleBias(){useBias=!useBias;' +
'document.getElementById("togBias").className=useBias?"toggle on":"toggle";' +
'document.getElementById("biasPanel").style.display=useBias?"block":"none";' +
'draw()}' +
'function toggleRelu(){useRelu=!useRelu;' +
'document.getElementById("togRelu").className=useRelu?"toggle on":"toggle";' +
'draw()}' +
'function toggleClass(){useClassify=!useClassify;' +
'document.getElementById("togClass").className=useClassify?"toggle on":"toggle";' +
'draw()}' +

// ── Stats ──
'function updateStats(){' +
'var det=a11*a22-a12*a21;' +
'var s="<span class=\\"hi\\">"+T.det+"</span>: "+det.toFixed(3)+"<br>";' +
's+="<span class=\\"hi\\">"+T.area+"</span>: "+Math.abs(det).toFixed(3)+"x<br>";' +
'if(useRelu)s+="<span class=\\"warn\\">"+T.reluNote+"</span><br>";' +
'if(useClassify)s+=T.classNote;' +
'document.getElementById("statsBox").innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-canvas").textContent=T.canvas;' +
'document.getElementById("lbl-matrix").textContent=T.matrix;' +
'document.getElementById("lbl-opts").textContent=T.opts;' +
'document.getElementById("lbl-presets").textContent=T.presets;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("togBias").textContent=T.bias;' +
'document.getElementById("togRelu").textContent=T.relu;' +
'document.getElementById("togClass").textContent=T.classify;' +
// Preset button labels
'var presetBtns=document.querySelectorAll(".btn-row .btn");' +
'var pLabels=[T.identity,T.rotate,T.scale,T.shear,T.reflect];' +
'for(var i=0;i<presetBtns.length&&i<pLabels.length;i++){presetBtns[i].textContent=pLabels[i]}' +

// Init slider values
'document.getElementById("v11").textContent="1.0";' +
'document.getElementById("v12").textContent="0.0";' +
'document.getElementById("v21").textContent="0.0";' +
'document.getElementById("v22").textContent="1.0";' +
'document.getElementById("vb1").textContent="0.0";' +
'document.getElementById("vb2").textContent="0.0";' +

// ── Init ──
'draw();' +
'window.addEventListener("resize",function(){draw()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
