/**
 * Swarm Intelligence (Boid Flocking) interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 60-80 boid agents with classic Craig Reynolds flocking rules
 * - 3 independent rule toggles (separation, alignment, cohesion) with weight sliders
 * - Adjustable parameters: neighbor radius, max speed, boid count
 * - Obstacle mode (central circle) and attractor points (tap canvas)
 * - Optional trails, stats panel (avg speed, neighbors, coherence)
 * - Dark/light theme, Korean/English bilingual
 */

export function getSwarmSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.toggle-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;min-height:44px}' +
'.toggle-check{width:22px;height:22px;accent-color:var(--teal);padding:11px}' +
'.toggle-label{font-size:12px;font-weight:700}' +
'.toggle-label.sep-c{color:var(--red)}' +
'.toggle-label.ali-c{color:var(--teal)}' +
'.toggle-label.coh-c{color:var(--accent)}' +
'.opt-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;min-height:44px}' +
'.opt-check{width:20px;height:20px;accent-color:var(--teal)}' +
'.opt-label{font-size:11px;font-weight:600;color:var(--text2)}' +
'</style></head><body>' +

// ── Canvas ──────────────────────────────────────────────────────────
'<div class="panel"><div class="label" id="lbl-sim"></div>' +
'<canvas id="cvSim" height="300"></canvas>' +
'<div class="ctrl-hint" id="hint-tap" style="margin-top:6px;padding-left:0"></div></div>' +

// ── Rule toggles + weight sliders ───────────────────────────────────
'<div class="panel"><div class="label" id="lbl-rules"></div>' +

'<div class="toggle-row"><input type="checkbox" class="toggle-check" id="chkSep" checked onchange="onParam()">' +
'<span class="toggle-label sep-c" id="lbl-sep"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-sepW"></span>' +
'<input type="range" id="slSep" min="0" max="30" value="15" oninput="onParam()">' +
'<span class="ctrl-val" id="valSep"></span></div>' +

'<div class="toggle-row"><input type="checkbox" class="toggle-check" id="chkAli" checked onchange="onParam()">' +
'<span class="toggle-label ali-c" id="lbl-ali"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-aliW"></span>' +
'<input type="range" id="slAli" min="0" max="30" value="10" oninput="onParam()">' +
'<span class="ctrl-val" id="valAli"></span></div>' +

'<div class="toggle-row"><input type="checkbox" class="toggle-check" id="chkCoh" checked onchange="onParam()">' +
'<span class="toggle-label coh-c" id="lbl-coh"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-cohW"></span>' +
'<input type="range" id="slCoh" min="0" max="30" value="10" oninput="onParam()">' +
'<span class="ctrl-val" id="valCoh"></span></div>' +
'</div>' +

// ── Parameters ──────────────────────────────────────────────────────
'<div class="panel"><div class="label" id="lbl-params"></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-radius"></span>' +
'<input type="range" id="slRadius" min="30" max="150" value="60" oninput="onParam()">' +
'<span class="ctrl-val" id="valRadius"></span></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-speed"></span>' +
'<input type="range" id="slSpeed" min="10" max="50" value="30" oninput="onParam()">' +
'<span class="ctrl-val" id="valSpeed"></span></div>' +

'<div class="row"><span class="ctrl-name" id="lbl-count"></span>' +
'<input type="range" id="slCount" min="20" max="120" value="60" oninput="onCountChange()">' +
'<span class="ctrl-val" id="valCount"></span></div>' +
'</div>' +

// ── Options ─────────────────────────────────────────────────────────
'<div class="panel"><div class="label" id="lbl-opts"></div>' +
'<div class="opt-row"><input type="checkbox" class="opt-check" id="chkObs" onchange="onParam()">' +
'<span class="opt-label" id="lbl-obs"></span></div>' +
'<div class="opt-row"><input type="checkbox" class="opt-check" id="chkTrail" onchange="onParam()">' +
'<span class="opt-label" id="lbl-trail"></span></div>' +
'</div>' +

// ── Controls ────────────────────────────────────────────────────────
'<div class="panel"><div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="onRun()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats ───────────────────────────────────────────────────────────
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──────────────────────────────────────────────────────────
'var L={' +
'ko:{sim:"\\uAD70\\uC9D1 \\uC2DC\\uBBAC\\uB808\\uC774\\uC158",rules:"\\uADDC\\uCE59 \\uD1A0\\uAE00",' +
'sep:"\\uBD84\\uB9AC (Separation)",ali:"\\uC815\\uB82C (Alignment)",coh:"\\uC751\\uC9D1 (Cohesion)",' +
'sepW:"\\uBD84\\uB9AC W",aliW:"\\uC815\\uB82C W",cohW:"\\uC751\\uC9D1 W",' +
'params:"\\uD30C\\uB77C\\uBBF8\\uD130",' +
'radius:"\\uC774\\uC6C3 \\uBC18\\uACBD",speed:"\\uCD5C\\uB300 \\uC18D\\uB3C4",count:"\\uAC1C\\uCCB4 \\uC218",' +
'opts:"\\uC635\\uC158",obs:"\\uC7A5\\uC560\\uBB3C",trail:"\\uADA4\\uC801 \\uD45C\\uC2DC",' +
'run:"\\u25B6 \\uC2E4\\uD589",pause:"\\u23F8 \\uC77C\\uC2DC\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'stats:"\\uD1B5\\uACC4",' +
'avgSpd:"\\uD3C9\\uADE0 \\uC18D\\uB3C4",avgNbr:"\\uC774\\uC6C3 \\uC218",coherence:"\\uAD70\\uC9D1 \\uC751\\uC9D1\\uB3C4",' +
'boids:"\\uAC1C\\uCCB4",attractors:"\\uBA39\\uC774",' +
'hintTap:"\\uCE94\\uBC84\\uC2A4\\uB97C \\uD130\\uCE58\\uD558\\uC5EC \\uBA39\\uC774(\\uCD08\\uB85D \\uC810)\\uB97C \\uCD94\\uAC00/\\uC81C\\uAC70\\uD558\\uC138\\uC694",' +
'hintToggle:"\\uADDC\\uCE59\\uC744 \\uCF1C\\uACE0 \\uAEBC\\uBCF4\\uBA70 \\uAD70\\uC9D1 \\uD589\\uB3D9\\uC758 \\uBCC0\\uD654\\uB97C \\uAD00\\uCC30\\uD558\\uC138\\uC694"},' +
'en:{sim:"SWARM SIMULATION",rules:"RULE TOGGLES",' +
'sep:"Separation",ali:"Alignment",coh:"Cohesion",' +
'sepW:"Sep W",aliW:"Ali W",cohW:"Coh W",' +
'params:"PARAMETERS",' +
'radius:"Radius",speed:"Max Speed",count:"Boid Count",' +
'opts:"OPTIONS",obs:"Obstacle",trail:"Show Trails",' +
'run:"\\u25B6 Run",pause:"\\u23F8 Pause",reset:"\\u21BA Reset",' +
'stats:"STATISTICS",' +
'avgSpd:"Avg Speed",avgNbr:"Neighbors",coherence:"Coherence",' +
'boids:"boids",attractors:"food",' +
'hintTap:"Tap canvas to add/remove food (green dot)",' +
'hintToggle:"Toggle rules on/off to observe how swarm behavior emerges"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ───────────────────────────────────────────────────────────
'var boids=[];var trails=[];' +
'var attractors=[];' +
'var animating=false;var animId=null;' +
'var sepOn=true,aliOn=true,cohOn=true;' +
'var sepW=1.5,aliW=1.0,cohW=1.0;' +
'var nbrRadius=60,maxSpd=3.0,boidCount=60;' +
'var obsOn=false,trailOn=false;' +
'var canvasW=300,canvasH=300;' +
'var SEP_DIST=24;' +
'var OBS_X=0,OBS_Y=0,OBS_R=30;' +

// ── DOM refs ────────────────────────────────────────────────────────
'var cvSim=document.getElementById("cvSim");' +
'var ctxS=cvSim.getContext("2d");' +

// ── Canvas DPR setup ────────────────────────────────────────────────
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Init labels ─────────────────────────────────────────────────────
'document.getElementById("lbl-sim").textContent=T.sim;' +
'document.getElementById("lbl-rules").textContent=T.rules;' +
'document.getElementById("lbl-sep").textContent=T.sep;' +
'document.getElementById("lbl-ali").textContent=T.ali;' +
'document.getElementById("lbl-coh").textContent=T.coh;' +
'document.getElementById("lbl-sepW").textContent=T.sepW;' +
'document.getElementById("lbl-aliW").textContent=T.aliW;' +
'document.getElementById("lbl-cohW").textContent=T.cohW;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-radius").textContent=T.radius;' +
'document.getElementById("lbl-speed").textContent=T.speed;' +
'document.getElementById("lbl-count").textContent=T.count;' +
'document.getElementById("lbl-opts").textContent=T.opts;' +
'document.getElementById("lbl-obs").textContent=T.obs;' +
'document.getElementById("lbl-trail").textContent=T.trail;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("hint-tap").textContent=T.hintTap;' +

// ── Read params from UI ─────────────────────────────────────────────
'function readParams(){' +
'sepOn=document.getElementById("chkSep").checked;' +
'aliOn=document.getElementById("chkAli").checked;' +
'cohOn=document.getElementById("chkCoh").checked;' +
'sepW=+document.getElementById("slSep").value/10;' +
'aliW=+document.getElementById("slAli").value/10;' +
'cohW=+document.getElementById("slCoh").value/10;' +
'nbrRadius=+document.getElementById("slRadius").value;' +
'maxSpd=+document.getElementById("slSpeed").value/10;' +
'boidCount=+document.getElementById("slCount").value;' +
'obsOn=document.getElementById("chkObs").checked;' +
'trailOn=document.getElementById("chkTrail").checked;' +
'document.getElementById("valSep").textContent=sepW.toFixed(1);' +
'document.getElementById("valAli").textContent=aliW.toFixed(1);' +
'document.getElementById("valCoh").textContent=cohW.toFixed(1);' +
'document.getElementById("valRadius").textContent=nbrRadius+"px";' +
'document.getElementById("valSpeed").textContent=maxSpd.toFixed(1);' +
'document.getElementById("valCount").textContent=boidCount}' +

// ── Create boids ────────────────────────────────────────────────────
'function createBoids(n){' +
'boids=[];trails=[];' +
'for(var i=0;i<n;i++){' +
'var angle=Math.random()*Math.PI*2;' +
'var spd=0.5+Math.random()*maxSpd*0.5;' +
'boids.push({x:Math.random()*canvasW,y:Math.random()*canvasH,' +
'vx:Math.cos(angle)*spd,vy:Math.sin(angle)*spd});' +
'trails.push([])}}' +

// ── Boid update (Craig Reynolds algorithm) ──────────────────────────
'function updateBoids(){' +
'var sepDist=SEP_DIST;' +
'for(var i=0;i<boids.length;i++){' +
'var b=boids[i];' +
'var sx=0,sy=0,sc=0;' +  // separation
'var ax=0,ay=0,ac=0;' +  // alignment
'var cx=0,cy=0,cc=0;' +  // cohesion
// find neighbors
'for(var j=0;j<boids.length;j++){' +
'if(i===j)continue;' +
'var dx=boids[j].x-b.x;var dy=boids[j].y-b.y;' +
// toroidal wrap distance
'if(dx>canvasW/2)dx-=canvasW;if(dx<-canvasW/2)dx+=canvasW;' +
'if(dy>canvasH/2)dy-=canvasH;if(dy<-canvasH/2)dy+=canvasH;' +
'var dist=Math.sqrt(dx*dx+dy*dy);' +
'if(dist<nbrRadius&&dist>0){' +
// separation: steer away from very close neighbors
'if(dist<sepDist){var f=1/(dist*dist);sx-=dx*f;sy-=dy*f;sc++}' +
// alignment: match heading
'ax+=boids[j].vx;ay+=boids[j].vy;ac++;' +
// cohesion: steer toward center
'cx+=dx;cy+=dy;cc++}}' +
// apply forces
'var fx=0,fy=0;' +
'if(sepOn&&sc>0){fx+=sx*sepW;fy+=sy*sepW}' +
'if(aliOn&&ac>0){var avx=ax/ac-b.vx;var avy=ay/ac-b.vy;fx+=avx*aliW;fy+=avy*aliW}' +
'if(cohOn&&cc>0){var tcx=cx/cc;var tcy=cy/cc;fx+=tcx*cohW*0.01;fy+=tcy*cohW*0.01}' +
// obstacle avoidance
'if(obsOn){' +
'var odx=b.x-OBS_X;var ody=b.y-OBS_Y;' +
'var od=Math.sqrt(odx*odx+ody*ody);' +
'if(od<OBS_R+40&&od>0){var of2=1/((od-OBS_R+1)*(od-OBS_R+1));' +
'fx+=odx*of2*2;fy+=ody*of2*2}}' +
// attractor pull
'for(var a=0;a<attractors.length;a++){' +
'var adx=attractors[a].x-b.x;var ady=attractors[a].y-b.y;' +
'var ad=Math.sqrt(adx*adx+ady*ady);' +
'if(ad<nbrRadius*1.5&&ad>0){fx+=adx/ad*0.3;fy+=ady/ad*0.3}}' +
// update velocity
'b.vx+=fx;b.vy+=fy;' +
// clamp speed
'var spd=Math.sqrt(b.vx*b.vx+b.vy*b.vy);' +
'if(spd>maxSpd){b.vx=b.vx/spd*maxSpd;b.vy=b.vy/spd*maxSpd}' +
// ensure minimum speed
'if(spd<0.3){var ang=Math.atan2(b.vy,b.vx);b.vx=Math.cos(ang)*0.3;b.vy=Math.sin(ang)*0.3}' +
// update position (toroidal wrap)
'b.x+=b.vx;b.y+=b.vy;' +
'if(b.x<0)b.x+=canvasW;if(b.x>canvasW)b.x-=canvasW;' +
'if(b.y<0)b.y+=canvasH;if(b.y>canvasH)b.y-=canvasH;' +
// store trail
'if(trailOn){trails[i].push({x:b.x,y:b.y});if(trails[i].length>15)trails[i].shift()}' +
'else if(trails[i].length>0){trails[i]=[]}' +
'}}' +

// ── Draw ────────────────────────────────────────────────────────────
'function draw(){' +
'var dim=setupCanvas(cvSim,300);canvasW=dim.w;canvasH=dim.h;' +
'OBS_X=canvasW/2;OBS_Y=canvasH/2;' +
'var ctx=ctxS;ctx.clearRect(0,0,canvasW,canvasH);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
// draw obstacle
'if(obsOn){ctx.beginPath();ctx.arc(OBS_X,OBS_Y,OBS_R,0,Math.PI*2);' +
'ctx.strokeStyle=redC;ctx.lineWidth=2;ctx.stroke();' +
'ctx.fillStyle=redC;ctx.globalAlpha=0.08;ctx.fill();ctx.globalAlpha=1}' +
// draw attractors
'for(var a=0;a<attractors.length;a++){' +
'ctx.beginPath();ctx.arc(attractors[a].x,attractors[a].y,5,0,Math.PI*2);' +
'ctx.fillStyle=greenC;ctx.fill();' +
'ctx.beginPath();ctx.arc(attractors[a].x,attractors[a].y,nbrRadius*1.5,0,Math.PI*2);' +
'ctx.strokeStyle=greenC;ctx.globalAlpha=0.15;ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1}' +
// draw trails
'if(trailOn){for(var i=0;i<boids.length;i++){var tr=trails[i];' +
'if(tr.length<2)continue;' +
'ctx.beginPath();ctx.moveTo(tr[0].x,tr[0].y);' +
'for(var t=1;t<tr.length;t++){ctx.lineTo(tr[t].x,tr[t].y)}' +
'ctx.strokeStyle=tealC;ctx.globalAlpha=0.15;ctx.lineWidth=1;ctx.stroke();ctx.globalAlpha=1}}' +
// draw boids as triangles
'for(var i=0;i<boids.length;i++){' +
'var b=boids[i];' +
'var angle=Math.atan2(b.vy,b.vx);' +
'var sz=6;' +
'ctx.save();ctx.translate(b.x,b.y);ctx.rotate(angle);' +
'ctx.beginPath();ctx.moveTo(sz,0);ctx.lineTo(-sz*0.6,-sz*0.5);ctx.lineTo(-sz*0.6,sz*0.5);ctx.closePath();' +
'ctx.fillStyle=tealC;ctx.fill();ctx.restore()}' +
// hint text when paused and no boids
'if(!animating&&boids.length===0){' +
'ctx.fillStyle=text3C;ctx.font="12px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.hintToggle,canvasW/2,canvasH/2)}}' +

// ── Compute stats ───────────────────────────────────────────────────
'function computeStats(){' +
'if(boids.length===0)return{avgSpd:0,avgNbr:0,coherence:0};' +
'var totalSpd=0;var totalNbr=0;' +
'var cmx=0,cmy=0;' +
'for(var i=0;i<boids.length;i++){' +
'var b=boids[i];' +
'totalSpd+=Math.sqrt(b.vx*b.vx+b.vy*b.vy);' +
'cmx+=b.x;cmy+=b.y;' +
'var nc=0;' +
'for(var j=0;j<boids.length;j++){if(i===j)continue;' +
'var dx=boids[j].x-b.x;var dy=boids[j].y-b.y;' +
'if(dx>canvasW/2)dx-=canvasW;if(dx<-canvasW/2)dx+=canvasW;' +
'if(dy>canvasH/2)dy-=canvasH;if(dy<-canvasH/2)dy+=canvasH;' +
'if(Math.sqrt(dx*dx+dy*dy)<nbrRadius)nc++}' +
'totalNbr+=nc}' +
'cmx/=boids.length;cmy/=boids.length;' +
'var totalDist=0;' +
'for(var i=0;i<boids.length;i++){' +
'var dx=boids[i].x-cmx;var dy=boids[i].y-cmy;' +
'if(dx>canvasW/2)dx-=canvasW;if(dx<-canvasW/2)dx+=canvasW;' +
'if(dy>canvasH/2)dy-=canvasH;if(dy<-canvasH/2)dy+=canvasH;' +
'totalDist+=Math.sqrt(dx*dx+dy*dy)}' +
'return{avgSpd:totalSpd/boids.length,avgNbr:totalNbr/boids.length,coherence:totalDist/boids.length}}' +

// ── Update stats display ────────────────────────────────────────────
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(boids.length===0){box.innerHTML=T.hintToggle;return}' +
'var st=computeStats();' +
'var s="<span class=\\"hi\\">"+T.avgSpd+"</span>  "+st.avgSpd.toFixed(2)+"<br>";' +
's+="<span class=\\"hi\\">"+T.avgNbr+"</span>  "+st.avgNbr.toFixed(1)+"<br>";' +
's+="<span class=\\"warn\\">"+T.coherence+"</span>  "+st.coherence.toFixed(1)+"px<br>";' +
's+=T.boids+": "+boids.length;' +
'if(attractors.length>0)s+="  |  "+T.attractors+": "+attractors.length;' +
'box.innerHTML=s}' +

// ── Animation loop ──────────────────────────────────────────────────
'function animate(){' +
'if(!animating)return;' +
'updateBoids();draw();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

// ── Reset ───────────────────────────────────────────────────────────
'function resetState(){' +
'readParams();' +
'if(animId)cancelAnimationFrame(animId);' +
'animating=false;attractors=[];' +
'var dim=setupCanvas(cvSim,300);canvasW=dim.w;canvasH=dim.h;' +
'OBS_X=canvasW/2;OBS_Y=canvasH/2;' +
'createBoids(boidCount);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'draw();updateStats();notifyHeight()}' +

// ── Event handlers ──────────────────────────────────────────────────
'function onParam(){readParams()}' +

'function onCountChange(){' +
'readParams();' +
'createBoids(boidCount);' +
'if(!animating){draw();updateStats()}}' +

'function onRun(){' +
'if(animating){animating=false;' +
'if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";return}' +
'readParams();' +
'if(boids.length===0)createBoids(boidCount);' +
'animating=true;' +
'document.getElementById("btnRun").textContent=T.pause;' +
'document.getElementById("btnRun").className="btn btn-stop";' +
'animate()}' +

'function onReset(){' +
'if(animId)cancelAnimationFrame(animId);' +
'animating=false;resetState()}' +

// ── Canvas tap handler (attractor add/remove) ───────────────────────
'cvSim.addEventListener("click",function(e){' +
'var rect=cvSim.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'var x=(e.clientX-rect.left)*(cvSim.width/dpr)/rect.width;' +
'var y=(e.clientY-rect.top)*(cvSim.height/dpr)/rect.height;' +
// check if near existing attractor — remove it
'for(var i=0;i<attractors.length;i++){' +
'var dx=attractors[i].x-x;var dy=attractors[i].y-y;' +
'if(Math.sqrt(dx*dx+dy*dy)<20){attractors.splice(i,1);' +
'if(!animating){draw();updateStats()}return}}' +
// otherwise add new attractor
'attractors.push({x:x,y:y});' +
'if(!animating){draw();updateStats()}});' +

// ── Touch handler for mobile ────────────────────────────────────────
'cvSim.addEventListener("touchend",function(e){' +
'e.preventDefault();' +
'var touch=e.changedTouches[0];' +
'var rect=cvSim.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'var x=(touch.clientX-rect.left)*(cvSim.width/dpr)/rect.width;' +
'var y=(touch.clientY-rect.top)*(cvSim.height/dpr)/rect.height;' +
'for(var i=0;i<attractors.length;i++){' +
'var dx=attractors[i].x-x;var dy=attractors[i].y-y;' +
'if(Math.sqrt(dx*dx+dy*dy)<20){attractors.splice(i,1);' +
'if(!animating){draw();updateStats()}return}}' +
'attractors.push({x:x,y:y});' +
'if(!animating){draw();updateStats()}},{passive:false});' +

// ── Height notification ─────────────────────────────────────────────
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init ────────────────────────────────────────────────────────────
'readParams();resetState();' +
'window.addEventListener("resize",function(){' +
'var dim=setupCanvas(cvSim,300);canvasW=dim.w;canvasH=dim.h;' +
'OBS_X=canvasW/2;OBS_Y=canvasH/2;' +
'if(!animating){draw()}notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
