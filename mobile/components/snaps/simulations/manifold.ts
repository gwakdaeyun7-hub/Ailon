/**
 * Manifold Hypothesis interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Pseudo-3D point cloud (Swiss Roll / S-Curve / Sphere)
 * - Points colored with rainbow gradient along manifold coordinate
 * - Touch drag to rotate 3D view (change projection angles)
 * - "Unfold" button: animated transition from 3D manifold to 2D flat layout
 * - Dataset presets: Swiss Roll / S-Curve / Sphere
 * - Point count slider, noise slider
 * - Color preservation shows structure preserved after unfolding
 * - Dark/light theme, Korean/English bilingual
 */

export function getManifoldSimulationHTML(isDark: boolean, lang: string): string {
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

// ── Main Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-main"></div>' +
'<canvas id="cvMain" height="320"></canvas></div>' +

// ── Dataset Preset Panel ──
'<div class="panel"><div class="label" id="lbl-data"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'</div></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-pts"></span>' +
'<input type="range" id="slPts" min="100" max="400" step="10" value="200" oninput="onPtsSlider()">' +
'<span class="ctrl-val" id="valPts"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-noise"></span>' +
'<input type="range" id="slNoise" min="0" max="100" value="10" oninput="onNoiseSlider()">' +
'<span class="ctrl-val" id="valNoise"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnUnfold" onclick="toggleUnfold()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{main:"\\uB9E4\\uB2C8\\uD3F4\\uB4DC \\uAC00\\uC124",data:"\\uB370\\uC774\\uD130\\uC14B",ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'pre0:"Swiss Roll",pre1:"S-Curve",pre2:"\\uAD6C\\uBA74",' +
'pts:"\\uD3EC\\uC778\\uD2B8",noise:"\\uB178\\uC774\\uC988",unfold:"\\u2B07 \\uD3BC\\uCE58\\uAE30",fold:"\\u2B06 \\uC811\\uAE30",reset:"\\u21BA \\uB9AC\\uC14B",' +
'dim:"\\uCC28\\uC6D0",pointCount:"\\uD3EC\\uC778\\uD2B8 \\uC218",noiseLevel:"\\uB178\\uC774\\uC988 \\uC218\\uC900",' +
'folded:"3D \\uC811\\uD78C \\uC0C1\\uD0DC",unfolded:"2D \\uD3BC\\uCE5C \\uC0C1\\uD0DC",' +
'transitioning:"\\uC804\\uD658 \\uC911...",' +
'dragHint:"\\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uD68C\\uC804"},' +
'en:{main:"MANIFOLD HYPOTHESIS",data:"DATASET",ctrl:"CONTROLS",stats:"STATISTICS",' +
'pre0:"Swiss Roll",pre1:"S-Curve",pre2:"Sphere",' +
'pts:"Points",noise:"Noise",unfold:"\\u2B07 Unfold",fold:"\\u2B06 Fold",reset:"\\u21BA Reset",' +
'dim:"Dimensions",pointCount:"Points",noiseLevel:"Noise Level",' +
'folded:"FOLDED (3D)",unfolded:"UNFOLDED (2D)",' +
'transitioning:"Transitioning...",' +
'dragHint:"Drag to rotate"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var pointCount=200;' +
'var noise=0.1;' +
'var presetIdx=0;' +
'var points3D=[];' + // [{x,y,z,color,u2d,v2d}]
'var rotX=-0.4,rotY=0.6;' + // rotation angles
'var isUnfolded=false;' +
'var unfoldT=0;' + // animation progress 0..1
'var animating=false;' +
'var animTimer=null;' +
'var touchStartX=0,touchStartY=0,touchRotX=0,touchRotY=0;' +

// ── HSL to hex for rainbow ──
'function hslToHex(h,s,l){' +
'h/=360;s/=100;l/=100;' +
'var r2,g2,b2;' +
'if(s===0){r2=g2=b2=l}else{' +
'function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p}' +
'var q2=l<0.5?l*(1+s):l+s-l*s;var p2=2*l-q2;' +
'r2=hue2rgb(p2,q2,h+1/3);g2=hue2rgb(p2,q2,h);b2=hue2rgb(p2,q2,h-1/3)}' +
'var rr=Math.round(r2*255),gg=Math.round(g2*255),bb=Math.round(b2*255);' +
'return "#"+((1<<24)+(rr<<16)+(gg<<8)+bb).toString(16).slice(1)}' +

// ── Generate Swiss Roll ──
'function genSwissRoll(){' +
'points3D=[];' +
'for(var i=0;i<pointCount;i++){' +
'var t=1.5*Math.PI*(1+2*Math.random());' + // angle parameter
'var y2=Math.random()*2-1;' + // height
'var x3=t*Math.cos(t)/12;' +
'var z3=t*Math.sin(t)/12;' +
'var tNorm=(t-1.5*Math.PI)/(1.5*Math.PI*2);' + // [0,1] for color
'x3+=noise*(Math.random()-0.5)*0.3;' +
'z3+=noise*(Math.random()-0.5)*0.3;' +
'y2+=noise*(Math.random()-0.5)*0.2;' +
// Unfolded coords: t (angle) → x, y → y
'var u2d=tNorm;var v2d=(y2+1)/2;' +
'var col=hslToHex(tNorm*300,80,50);' +
'points3D.push({x:x3,y:y2*0.5,z:z3,color:col,u2d:u2d,v2d:v2d})}}' +

// ── Generate S-Curve ──
'function genSCurve(){' +
'points3D=[];' +
'for(var i=0;i<pointCount;i++){' +
'var t=Math.random()*Math.PI*2-Math.PI;' + // [-PI, PI]
'var y2=Math.random()*2-1;' + // height
'var x3=Math.sin(t);' +
'var z3=Math.sign(t)*(Math.cos(t)-1);' +
'var tNorm=(t+Math.PI)/(2*Math.PI);' +
'x3=x3*0.5+noise*(Math.random()-0.5)*0.2;' +
'z3=z3*0.5+noise*(Math.random()-0.5)*0.2;' +
'y2+=noise*(Math.random()-0.5)*0.2;' +
// Unfolded: arc-length param → x, y → y
'var u2d=tNorm;var v2d=(y2+1)/2;' +
'var col=hslToHex(tNorm*300,80,50);' +
'points3D.push({x:x3,y:y2*0.5,z:z3,color:col,u2d:u2d,v2d:v2d})}}' +

// ── Generate Sphere ──
'function genSphere(){' +
'points3D=[];' +
'for(var i=0;i<pointCount;i++){' +
'var phi=Math.acos(2*Math.random()-1);' + // [0, PI]
'var theta=Math.random()*Math.PI*2;' + // [0, 2PI]
'var r=0.6+noise*(Math.random()-0.5)*0.3;' +
'var x3=r*Math.sin(phi)*Math.cos(theta);' +
'var y2=r*Math.sin(phi)*Math.sin(theta);' +
'var z3=r*Math.cos(phi);' +
'var tNorm=phi/Math.PI;' +
// Unfolded: Mercator-like projection
'var u2d=theta/(2*Math.PI);var v2d=tNorm;' +
'var col=hslToHex(tNorm*300,80,50);' +
'points3D.push({x:x3,y:y2,z:z3,color:col,u2d:u2d,v2d:v2d})}}' +

'var generators=[genSwissRoll,genSCurve,genSphere];' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── 3D rotation & projection ──
'function project(x,y,z){' +
'var cosX=Math.cos(rotX),sinX=Math.sin(rotX);' +
'var cosY=Math.cos(rotY),sinY=Math.sin(rotY);' +
// Rotate around Y axis
'var x2=x*cosY+z*sinY;var z2=-x*sinY+z*cosY;' +
// Rotate around X axis
'var y2=y*cosX-z2*sinX;var z3=y*sinX+z2*cosX;' +
// Perspective projection
'var scale=2.0/(3.0+z3);' +
'return{px:x2*scale,py:y2*scale,depth:z3}}' +

// ── Draw canvas ──
'function drawMain(){' +
'var cv=document.getElementById("cvMain");' +
'var dim=setupCanvas(cv,320);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var isDk=document.documentElement.classList.contains("dark");' +
'var cx=w/2,cy=h/2;' +
'var scaleF=Math.min(w,h)*0.38;' +

// Build projected points
'var projected=[];' +
'for(var i=0;i<points3D.length;i++){' +
'var p=points3D[i];' +
// Interpolate between 3D and 2D positions
'var ix,iy,iz;' +
'if(unfoldT<=0){ix=p.x;iy=p.y;iz=p.z}' +
'else if(unfoldT>=1){' +
// 2D: map u2d,v2d to a flat plane at z=0
'ix=(p.u2d-0.5)*1.6;iy=(p.v2d-0.5)*1.2;iz=0}' +
'else{' +
'var t2=unfoldT;' +
'var flat_x=(p.u2d-0.5)*1.6;var flat_y=(p.v2d-0.5)*1.2;' +
'ix=p.x*(1-t2)+flat_x*t2;' +
'iy=p.y*(1-t2)+flat_y*t2;' +
'iz=p.z*(1-t2)}' +
'var proj=project(ix,iy,iz);' +
'projected.push({px:cx+proj.px*scaleF,py:cy+proj.py*scaleF,depth:proj.depth,color:p.color})}' +

// Sort by depth (far first)
'projected.sort(function(a,b){return a.depth-b.depth});' +

// Draw points
'for(var i=0;i<projected.length;i++){' +
'var pt=projected[i];' +
// Size by depth: far = small, near = big
'var sz=Math.max(2,4+pt.depth*2);' +
'ctx.beginPath();ctx.arc(pt.px,pt.py,sz,0,Math.PI*2);' +
'ctx.fillStyle=pt.color;' +
// Alpha by depth
'ctx.globalAlpha=Math.max(0.3,Math.min(1,0.6+pt.depth*0.3));' +
'ctx.fill();ctx.globalAlpha=1}' +

// Hint text
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.dragHint,w/2,h-4);' +
'}' +

// ── Unfold animation ──
'function toggleUnfold(){' +
'if(animating)return;' +
'var targetT=isUnfolded?0:1;' +
'animating=true;' +
'var step=isUnfolded?-0.025:0.025;' +
'animTimer=setInterval(function(){' +
'unfoldT+=step;' +
'if((step>0&&unfoldT>=targetT)||(step<0&&unfoldT<=targetT)){' +
'unfoldT=targetT;clearInterval(animTimer);animTimer=null;animating=false;' +
'isUnfolded=!isUnfolded;' +
'document.getElementById("btnUnfold").textContent=isUnfolded?T.fold:T.unfold}' +
'drawMain();updateStats()},25)}' +

// ── Touch rotation ──
'function initTouch(){' +
'var cv=document.getElementById("cvMain");' +
'cv.addEventListener("touchstart",function(e){' +
'if(animating)return;' +
'var t=e.touches[0];touchStartX=t.clientX;touchStartY=t.clientY;' +
'touchRotX=rotX;touchRotY=rotY;e.preventDefault()},{passive:false});' +
'cv.addEventListener("touchmove",function(e){' +
'if(animating)return;e.preventDefault();' +
'var t=e.touches[0];' +
'var dx=t.clientX-touchStartX;var dy=t.clientY-touchStartY;' +
'rotY=touchRotY+dx*0.01;' +
'rotX=touchRotX+dy*0.01;' +
'rotX=Math.max(-Math.PI/2,Math.min(Math.PI/2,rotX));' +
'drawMain()},{passive:false})}' +

// ── Sliders ──
'function onPtsSlider(){' +
'pointCount=+document.getElementById("slPts").value;' +
'document.getElementById("valPts").textContent=pointCount;' +
'regenerate()}' +

'function onNoiseSlider(){' +
'noise=+document.getElementById("slNoise").value/100;' +
'document.getElementById("valNoise").textContent=noise.toFixed(2);' +
'regenerate()}' +

'function regenerate(){' +
'generators[presetIdx]();' +
'unfoldT=isUnfolded?1:0;' +
'drawMain();updateStats();notifyHeight()}' +

// ── Preset ──
'function onPreset(idx){' +
'presetIdx=idx;' +
'for(var i=0;i<3;i++){document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
'isUnfolded=false;unfoldT=0;' +
'document.getElementById("btnUnfold").textContent=T.unfold;' +
'regenerate()}' +

// ── Reset ──
'function onReset(){' +
'rotX=-0.4;rotY=0.6;isUnfolded=false;unfoldT=0;' +
'if(animTimer){clearInterval(animTimer);animTimer=null;animating=false}' +
'document.getElementById("btnUnfold").textContent=T.unfold;' +
'regenerate()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var stateStr;' +
'if(animating){stateStr="<span class=\\"warn\\">"+T.transitioning+"</span>"}' +
'else if(isUnfolded){stateStr="<span class=\\"hi\\">"+T.unfolded+"</span>"}' +
'else{stateStr="<span class=\\"warn\\">"+T.folded+"</span>"}' +
'var s=T.dim+": <span class=\\"hi\\">"+(isUnfolded?"3D \\u2192 2D":"3D")+"</span><br>";' +
's+=T.pointCount+": "+pointCount+"<br>";' +
's+=T.noiseLevel+": <span class=\\"warn\\">"+noise.toFixed(2)+"</span><br>";' +
's+="State: "+stateStr+"<br>";' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-main").textContent=T.main;' +
'document.getElementById("lbl-data").textContent=T.data;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-pts").textContent=T.pts;' +
'document.getElementById("lbl-noise").textContent=T.noise;' +
'document.getElementById("valPts").textContent="200";' +
'document.getElementById("valNoise").textContent="0.10";' +
'document.getElementById("btnUnfold").textContent=T.unfold;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("pre0").textContent=T.pre0;' +
'document.getElementById("pre1").textContent=T.pre1;' +
'document.getElementById("pre2").textContent=T.pre2;' +

// ── Init ──
'genSwissRoll();drawMain();initTouch();updateStats();' +
'window.addEventListener("resize",function(){drawMain();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
