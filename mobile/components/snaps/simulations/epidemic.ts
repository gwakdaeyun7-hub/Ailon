/**
 * Epidemic Modeling (SIR) interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Upper canvas: 2D arena with moving particles (S=teal, I=red pulsing, R=gray, V=green)
 * - Lower canvas: SIR curves over time
 * - Sliders: infection rate, recovery rate, population, vaccination %
 * - Social distancing toggle, tap-to-infect
 * - Stats: R0, peak infection, S/I/R counts
 * - Dark/light theme, Korean/English bilingual
 */

export function getEpidemicSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .bad{color:var(--red);font-weight:700}' +
'.stats .good{color:var(--green);font-weight:700}' +
'.opt-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;min-height:44px}' +
'.opt-check{width:20px;height:20px;accent-color:var(--teal)}' +
'.opt-label{font-size:11px;font-weight:600;color:var(--text2)}' +
'.cv-label{font-size:10px;font-weight:600;color:var(--text3);margin-top:6px;margin-bottom:2px}' +
'.ctrl-hint{font-size:10px;color:var(--text3);margin-top:-6px;margin-bottom:8px;padding-left:0}' +
'</style></head><body>' +

// -- Canvas panels --
'<div class="panel"><div class="label" id="lbl-sim"></div>' +
'<div class="cv-label" id="lbl-cv1"></div>' +
'<canvas id="cv1" height="260"></canvas>' +
'<div class="ctrl-hint" id="hint-tap" style="margin-top:6px"></div>' +
'<div class="cv-label" id="lbl-cv2" style="margin-top:8px"></div>' +
'<canvas id="cv2" height="140"></canvas></div>' +

// -- Controls --
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-beta"></span>' +
'<input type="range" id="slBeta" min="1" max="100" value="30" oninput="onParam()">' +
'<span class="ctrl-val" id="valBeta"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-gamma"></span>' +
'<input type="range" id="slGamma" min="1" max="100" value="10" oninput="onParam()">' +
'<span class="ctrl-val" id="valGamma"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-pop"></span>' +
'<input type="range" id="slPop" min="50" max="200" value="100" step="10" oninput="onPopChange()">' +
'<span class="ctrl-val" id="valPop"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-vax"></span>' +
'<input type="range" id="slVax" min="0" max="80" value="0" oninput="onPopChange()">' +
'<span class="ctrl-val" id="valVax"></span></div>' +
'<div class="opt-row"><input type="checkbox" class="opt-check" id="chkDist" onchange="onParam()">' +
'<span class="opt-label" id="lbl-dist"></span></div>' +
'</div>' +

// -- Buttons --
'<div class="panel"><div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="onRun()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// -- Stats --
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// -- Labels --
'var L={' +
'ko:{sim:"\\uC804\\uC5FC\\uBCD1 \\uBAA8\\uB378\\uB9C1 (SIR)",' +
'ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'cv1:"\\uC2DC\\uBBAC\\uB808\\uC774\\uC158 \\uC601\\uC5ED",cv2:"SIR \\uACE1\\uC120",' +
'beta:"\\uAC10\\uC5FC\\uB960 (\\u03B2)",gamma:"\\uD68C\\uBCF5\\uB960 (\\u03B3)",' +
'pop:"\\uC778\\uAD6C",vax:"\\uBC31\\uC2E0 (%)",' +
'dist:"\\uC0AC\\uD68C\\uC801 \\uAC70\\uB9AC\\uB450\\uAE30 (\\uC774\\uB3D9 \\uAC10\\uC18C)",' +
'run:"\\u25B6 \\uC2E4\\uD589",pause:"\\u23F8 \\uC77C\\uC2DC\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'r0:"\\uAE30\\uCD08\\uAC10\\uC5FC\\uC7AC\\uC0DD\\uC0B0\\uC218 R\\u2080",' +
'peak:"\\uCD5C\\uB300 \\uAC10\\uC5FC\\uB960",sCount:"\\uAC10\\uC5FC \\uAC00\\uB2A5 (S)",' +
'iCount:"\\uAC10\\uC5FC\\uC790 (I)",rCount:"\\uD68C\\uBCF5\\uC790 (R)",' +
'vCount:"\\uBC31\\uC2E0 (V)",status:"\\uC0C1\\uD0DC",' +
'spreading:"\\uD655\\uC0B0 \\uC911",dying:"\\uC18C\\uBA78 \\uC911",' +
'tapHint:"\\uCE94\\uBC84\\uC2A4\\uB97C \\uD130\\uCE58\\uD558\\uC5EC \\uAC10\\uC5FC \\uC2DC\\uC791 \\uC704\\uCE58 \\uC9C0\\uC815"},' +
'en:{sim:"EPIDEMIC MODELING (SIR)",' +
'ctrl:"CONTROLS",stats:"STATISTICS",' +
'cv1:"Simulation Arena",cv2:"SIR Curves",' +
'beta:"Infect (\\u03B2)",gamma:"Recover (\\u03B3)",' +
'pop:"Population",vax:"Vaccinated",' +
'dist:"Social Distancing (reduce movement)",' +
'run:"\\u25B6 Run",pause:"\\u23F8 Pause",reset:"\\u21BA Reset",' +
'r0:"R\\u2080",peak:"Peak Infection",sCount:"Susceptible (S)",' +
'iCount:"Infected (I)",rCount:"Recovered (R)",' +
'vCount:"Vaccinated (V)",status:"Status",' +
'spreading:"SPREADING",dying:"DYING OUT",' +
'tapHint:"Tap arena to start infection at that location"}' +
'};' +
'var T=L[LANG]||L.en;' +

// -- State --
'var particles=[];var history=[];' +
'var beta=0.3;var gamma=0.1;var popSize=100;var vaxPct=0;' +
'var socialDist=false;var animating=false;var animId=null;' +
'var canvasW=300;var canvasH=260;var tick=0;' +
'var peakI=0;var CONTACT_DIST=14;' +
'var sparks=[];' +

// -- Canvas DPR setup --
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// -- Create particles --
'function createParticles(){' +
'particles=[];history=[];tick=0;peakI=0;sparks=[];' +
'var nVax=Math.floor(popSize*vaxPct/100);' +
'var spd=socialDist?0.4:1.2;' +
'for(var i=0;i<popSize;i++){' +
'var angle=Math.random()*Math.PI*2;' +
'var s=0.3+Math.random()*spd;' +
'var state=i<nVax?"V":"S";' +
'particles.push({x:10+Math.random()*(canvasW-20),y:10+Math.random()*(canvasH-20),' +
'vx:Math.cos(angle)*s,vy:Math.sin(angle)*s,' +
'state:state,infTimer:0,pulse:Math.random()*Math.PI*2})}}' +

// -- Infect nearest S particle to (x,y) --
'function infectAt(x,y){' +
'var best=-1;var bestD=9999;' +
'for(var i=0;i<particles.length;i++){' +
'if(particles[i].state!=="S")continue;' +
'var dx=particles[i].x-x;var dy=particles[i].y-y;' +
'var d=Math.sqrt(dx*dx+dy*dy);' +
'if(d<bestD){bestD=d;best=i}}' +
'if(best>=0&&bestD<50){particles[best].state="I";particles[best].infTimer=0}}' +

// -- Update simulation --
'function update(){' +
'tick++;var spd=socialDist?0.4:1.2;' +
// move
'for(var i=0;i<particles.length;i++){' +
'var p=particles[i];' +
// random walk jitter
'p.vx+=((Math.random()-0.5)*0.3);' +
'p.vy+=((Math.random()-0.5)*0.3);' +
'var s=Math.sqrt(p.vx*p.vx+p.vy*p.vy);' +
'if(s>spd){p.vx=p.vx/s*spd;p.vy=p.vy/s*spd}' +
'p.x+=p.vx;p.y+=p.vy;' +
// bounce
'if(p.x<4){p.x=4;p.vx=Math.abs(p.vx)}' +
'if(p.x>canvasW-4){p.x=canvasW-4;p.vx=-Math.abs(p.vx)}' +
'if(p.y<4){p.y=4;p.vy=Math.abs(p.vy)}' +
'if(p.y>canvasH-4){p.y=canvasH-4;p.vy=-Math.abs(p.vy)}}' +
// infection
'for(var i=0;i<particles.length;i++){' +
'var p=particles[i];' +
'if(p.state!=="I")continue;' +
'p.infTimer++;' +
// recovery check
'if(Math.random()<gamma){p.state="R";continue}' +
// contact check
'for(var j=0;j<particles.length;j++){' +
'if(i===j||particles[j].state!=="S")continue;' +
'var dx=particles[j].x-p.x;var dy=particles[j].y-p.y;' +
'var d=Math.sqrt(dx*dx+dy*dy);' +
'if(d<CONTACT_DIST&&Math.random()<beta){' +
'particles[j].state="I";particles[j].infTimer=0;' +
// spark effect
'sparks.push({x:(p.x+particles[j].x)/2,y:(p.y+particles[j].y)/2,life:8})}}}' +
// decay sparks
'for(var i=sparks.length-1;i>=0;i--){sparks[i].life--;if(sparks[i].life<=0)sparks.splice(i,1)}' +
// record history
'var sC=0,iC=0,rC=0,vC=0;' +
'for(var i=0;i<particles.length;i++){' +
'if(particles[i].state==="S")sC++;' +
'else if(particles[i].state==="I")iC++;' +
'else if(particles[i].state==="R")rC++;' +
'else vC++}' +
'if(iC>peakI)peakI=iC;' +
'history.push({s:sC,i:iC,r:rC,v:vC})}' +

// -- Draw arena --
'function drawArena(){' +
'var cv=document.getElementById("cv1");' +
'var dim=setupCanvas(cv,260);canvasW=dim.w;canvasH=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,canvasW,canvasH);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var now=Date.now()/400;' +
// draw sparks
'for(var i=0;i<sparks.length;i++){' +
'var sp=sparks[i];' +
'ctx.fillStyle=accentC;ctx.globalAlpha=sp.life/8;' +
'ctx.beginPath();ctx.arc(sp.x,sp.y,sp.life*0.6,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}' +
// draw particles
'for(var i=0;i<particles.length;i++){' +
'var p=particles[i];var r=5;' +
'if(p.state==="S"){ctx.fillStyle=tealC;ctx.globalAlpha=0.8}' +
'else if(p.state==="I"){' +
// pulsing glow
'var pulse=Math.sin(now+p.pulse)*0.3+0.7;' +
'ctx.fillStyle=redC;ctx.globalAlpha=0.3;' +
'ctx.beginPath();ctx.arc(p.x,p.y,r+4*pulse,0,Math.PI*2);ctx.fill();' +
'ctx.fillStyle=redC;ctx.globalAlpha=0.9}' +
'else if(p.state==="R"){ctx.fillStyle=text3C;ctx.globalAlpha=0.5}' +
'else{ctx.fillStyle=greenC;ctx.globalAlpha=0.8}' +
'ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}' +
// legend
'ctx.font="9px -apple-system,sans-serif";ctx.textAlign="left";' +
'var ly=14;var lx=6;' +
'ctx.fillStyle=tealC;ctx.fillRect(lx,ly-6,8,8);ctx.fillStyle=tealC;ctx.fillText(" S",lx+10,ly);' +
'ctx.fillStyle=redC;ctx.fillRect(lx+36,ly-6,8,8);ctx.fillText(" I",lx+46,ly);' +
'ctx.fillStyle=text3C;ctx.fillRect(lx+66,ly-6,8,8);ctx.fillText(" R",lx+76,ly);' +
'ctx.fillStyle=greenC;ctx.fillRect(lx+96,ly-6,8,8);ctx.fillText(" V",lx+106,ly)}' +

// -- Draw SIR curves --
'function drawCurves(){' +
'var cv=document.getElementById("cv2");' +
'var dim=setupCanvas(cv,140);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var padL=30;var padR=8;var padT=12;var padB=20;' +
'var plotW=w-padL-padR;var plotH=h-padT-padB;' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(padL,padT);ctx.lineTo(padL,padT+plotH);ctx.lineTo(padL+plotW,padT+plotH);ctx.stroke();' +
// y-axis ticks
'ctx.fillStyle=text3C;ctx.font="8px monospace";ctx.textAlign="right";' +
'for(var v=0;v<=100;v+=25){' +
'var y=padT+plotH-(v/100)*plotH;' +
'ctx.fillText(v+"%",padL-3,y+3);' +
'ctx.strokeStyle=borderC;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(padL,y);ctx.lineTo(padL+plotW,y);ctx.stroke();ctx.setLineDash([])}' +
'if(history.length<2)return;' +
// draw curves
'var maxT=Math.max(history.length,60);' +
'function drawLine(key,color){' +
'ctx.beginPath();' +
'for(var i=0;i<history.length;i++){' +
'var x=padL+(i/maxT)*plotW;' +
'var v=history[i][key]/popSize;' +
'var y=padT+plotH-v*plotH;' +
'if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}' +
'ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke()}' +
'drawLine("s",tealC);drawLine("i",redC);drawLine("r",text3C);' +
// x-axis label
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(LANG==="ko"?"\\uC2DC\\uAC04":"Time",padL+plotW/2,h-4)}' +

// -- Draw all --
'function drawAll(){drawArena();drawCurves()}' +

// -- Read params --
'function readParams(){' +
'beta=+document.getElementById("slBeta").value/100;' +
'gamma=+document.getElementById("slGamma").value/100;' +
'popSize=+document.getElementById("slPop").value;' +
'vaxPct=+document.getElementById("slVax").value;' +
'socialDist=document.getElementById("chkDist").checked;' +
'document.getElementById("valBeta").textContent=beta.toFixed(2);' +
'document.getElementById("valGamma").textContent=gamma.toFixed(2);' +
'document.getElementById("valPop").textContent=popSize;' +
'document.getElementById("valVax").textContent=vaxPct+"%"}' +

// -- Event handlers --
'function onParam(){readParams();updateStats()}' +

'function onPopChange(){' +
'readParams();' +
'if(animating){if(animId)cancelAnimationFrame(animId);animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary"}' +
'createParticles();drawAll();updateStats()}' +

'function onRun(){' +
'if(animating){animating=false;' +
'if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";return}' +
'readParams();animating=true;' +
'document.getElementById("btnRun").textContent=T.pause;' +
'document.getElementById("btnRun").className="btn btn-stop";' +
'animate()}' +

'function onReset(){' +
'if(animId)cancelAnimationFrame(animId);' +
'animating=false;' +
'document.getElementById("slBeta").value=30;' +
'document.getElementById("slGamma").value=10;' +
'document.getElementById("slPop").value=100;' +
'document.getElementById("slVax").value=0;' +
'document.getElementById("chkDist").checked=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'readParams();createParticles();drawAll();updateStats();notifyHeight()}' +

// -- Animation loop --
'function animate(){' +
'if(!animating)return;' +
'update();drawAll();updateStats();' +
// auto-stop when no infected
'var iC=0;for(var i=0;i<particles.length;i++)if(particles[i].state==="I")iC++;' +
'if(iC===0&&history.length>5){animating=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";return}' +
'animId=requestAnimationFrame(animate)}' +

// -- Canvas tap (infect at location) --
'(function(){var cv=document.getElementById("cv1");' +
'function handleTap(x,y){infectAt(x,y);if(!animating)drawAll();updateStats()}' +
'cv.addEventListener("click",function(e){' +
'var rect=cv.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'handleTap((e.clientX-rect.left)*(cv.width/dpr)/rect.width,(e.clientY-rect.top)*(cv.height/dpr)/rect.height)});' +
'cv.addEventListener("touchend",function(e){' +
'e.preventDefault();var t=e.changedTouches[0];var rect=cv.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'handleTap((t.clientX-rect.left)*(cv.width/dpr)/rect.width,(t.clientY-rect.top)*(cv.height/dpr)/rect.height)},{passive:false})})();' +

// -- Stats --
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var r0=gamma>0?(beta/gamma):0;' +
'var sC=0,iC=0,rC=0,vC=0;' +
'for(var i=0;i<particles.length;i++){' +
'if(particles[i].state==="S")sC++;' +
'else if(particles[i].state==="I")iC++;' +
'else if(particles[i].state==="R")rC++;' +
'else vC++}' +
'var s="<span class=\\"hi\\">"+T.r0+"</span>  ";' +
'if(r0>1){s+="<span class=\\"bad\\">"+r0.toFixed(2)+"</span>"}' +
'else{s+="<span class=\\"good\\">"+r0.toFixed(2)+"</span>"}' +
's+="<br>";' +
's+="<span class=\\"hi\\">"+T.peak+"</span>  "+(popSize>0?(peakI/popSize*100).toFixed(1):0)+"%<br>";' +
's+="<span class=\\"hi\\">"+T.sCount+"</span> "+sC;' +
's+="  <span class=\\"bad\\">"+T.iCount+"</span> "+iC;' +
's+="  "+T.rCount+" "+rC;' +
'if(vC>0)s+="  <span class=\\"good\\">"+T.vCount+"</span> "+vC;' +
's+="<br>";' +
'if(iC>0){s+="<span class=\\"bad\\">"+T.status+": "+T.spreading+"</span>"}' +
'else if(history.length>5){s+="<span class=\\"good\\">"+T.status+": "+T.dying+"</span>"}' +
'box.innerHTML=s}' +

// -- Height notification --
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// -- Init labels --
'document.getElementById("lbl-sim").textContent=T.sim;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-beta").textContent=T.beta;' +
'document.getElementById("lbl-gamma").textContent=T.gamma;' +
'document.getElementById("lbl-pop").textContent=T.pop;' +
'document.getElementById("lbl-vax").textContent=T.vax;' +
'document.getElementById("lbl-dist").textContent=T.dist;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lbl-cv1").textContent=T.cv1;' +
'document.getElementById("lbl-cv2").textContent=T.cv2;' +
'document.getElementById("hint-tap").textContent=T.tapHint;' +

// -- Init --
'readParams();createParticles();drawAll();updateStats();' +
'window.addEventListener("resize",function(){' +
'var dim=setupCanvas(document.getElementById("cv1"),260);canvasW=dim.w;canvasH=dim.h;' +
'drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
