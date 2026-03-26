/**
 * Subsumption Architecture — Layered behavior-based robot control simulation
 *
 * Features:
 * - 2D arena with circular robot (color = active layer), sensor beams, obstacles, goal
 * - Layer stack diagram: Avoid (red) > Wander (accent) > Seek Goal (teal)
 * - 3 toggle checkboxes for each layer
 * - Sensor Range / Speed sliders
 * - Tap canvas to add/remove obstacles or move goal
 * - Stats: Active layer, collisions, goals reached, time
 * - Dark/light theme, Korean/English bilingual
 */

export function getSubsumptionSimulationHTML(isDark: boolean, lang: string): string {
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
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:40px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .red{color:var(--red);font-weight:700}' +
'.layer-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;min-height:44px;padding:6px 8px;border:2px solid var(--border)}' +
'.layer-row.active{border-color:var(--teal)}' +
'.layer-check{width:22px;height:22px}' +
'.layer-label{font-size:12px;font-weight:700;flex:1}' +
'.layer-pri{font-size:10px;font-weight:600;color:var(--text3)}' +
'.layer-0 .layer-check{accent-color:var(--red)}' +
'.layer-0 .layer-label{color:var(--red)}' +
'.layer-1 .layer-check{accent-color:var(--accent)}' +
'.layer-1 .layer-label{color:var(--accent)}' +
'.layer-2 .layer-check{accent-color:var(--teal)}' +
'.layer-2 .layer-label{color:var(--teal)}' +
'.hint{font-size:10px;color:var(--text3);margin-top:6px}' +
'</style></head><body>' +

// ── Arena Canvas ──
'<div class="panel"><div class="label" id="lbl-arena"></div>' +
'<canvas id="cvArena" height="300"></canvas>' +
'<div class="hint" id="hintTap"></div></div>' +

// ── Layer Stack ──
'<div class="panel"><div class="label" id="lbl-layers"></div>' +
'<div class="layer-row layer-0" id="lr0">' +
'<input type="checkbox" class="layer-check" id="chkL0" checked onchange="onParam()">' +
'<span class="layer-label" id="lblL0"></span>' +
'<span class="layer-pri">P0</span></div>' +
'<div class="layer-row layer-1" id="lr1">' +
'<input type="checkbox" class="layer-check" id="chkL1" checked onchange="onParam()">' +
'<span class="layer-label" id="lblL1"></span>' +
'<span class="layer-pri">P1</span></div>' +
'<div class="layer-row layer-2" id="lr2">' +
'<input type="checkbox" class="layer-check" id="chkL2" checked onchange="onParam()">' +
'<span class="layer-label" id="lblL2"></span>' +
'<span class="layer-pri">P2</span></div>' +
'</div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-range"></span>' +
'<input type="range" id="slRange" min="30" max="120" value="60" oninput="onParam()">' +
'<span class="ctrl-val" id="valRange"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-speed"></span>' +
'<input type="range" id="slSpeed" min="5" max="30" value="15" oninput="onParam()">' +
'<span class="ctrl-val" id="valSpeed"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="onRun()"></div>' +
'<div class="btn" id="btnAddObs" onclick="addRandomObs()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{arena:"\\uC544\\uB808\\uB098",layers:"\\uB808\\uC774\\uC5B4 \\uC2A4\\uD0DD",' +
'l0:"\\uC7A5\\uC560\\uBB3C \\uD68C\\uD53C (Avoid)",l1:"\\uD0D0\\uC0C9 (Wander)",l2:"\\uBAA9\\uD45C \\uCD94\\uC801 (Seek)",' +
'ctrl:"\\uC81C\\uC5B4",range:"\\uC13C\\uC11C \\uBC94\\uC704",speed:"\\uC18D\\uB3C4",' +
'stats:"\\uD1B5\\uACC4",' +
'run:"\\u25B6 \\uC2E4\\uD589",stop:"\\u23F8 \\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'addObs:"+ \\uC7A5\\uC560\\uBB3C",' +
'activeLayer:"\\uD65C\\uC131 \\uB808\\uC774\\uC5B4",collisions:"\\uCDA9\\uB3CC",' +
'goals:"\\uBAA9\\uD45C \\uB3C4\\uB2EC",time:"\\uC2DC\\uAC04",' +
'tapHint:"\\uCE94\\uBC84\\uC2A4 \\uD130\\uCE58: \\uC7A5\\uC560\\uBB3C \\uCD94\\uAC00/\\uC81C\\uAC70, \\uAE38\\uAC8C \\uB204\\uB974\\uBA74 \\uBAA9\\uD45C \\uC774\\uB3D9"},' +
'en:{arena:"ARENA",layers:"LAYER STACK",' +
'l0:"Avoid Obstacles",l1:"Wander",l2:"Seek Goal",' +
'ctrl:"CONTROLS",range:"Sensor Range",speed:"Speed",' +
'stats:"STATISTICS",' +
'run:"\\u25B6 Run",stop:"\\u23F8 Stop",reset:"\\u21BA Reset",' +
'addObs:"+ Obstacle",' +
'activeLayer:"Active Layer",collisions:"Collisions",' +
'goals:"Goals Reached",time:"Time",' +
'tapHint:"Tap: add/remove obstacle. Long-press: move goal"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var canvasW=300,canvasH=300;' +
'var robot={x:50,y:50,angle:0,radius:12};' +
'var goal={x:250,y:250};' +
'var obstacles=[];' +
'var sensorRange=60,robotSpeed=1.5;' +
'var layerOn=[true,true,true];' + // [avoid, wander, seek]
'var activeLayer=-1;' + // current active: 0,1,2 or -1
'var running=false,animId=null;' +
'var collisions=0,goalsReached=0,simTime=0;' +
'var wanderAngle=0;' +
'var SENSOR_ANGLES=[-0.8,-0.4,0,0.4,0.8];' + // 5 beams
'var sensorHits=[];' +
'var longPressTimer=null;' +
'var OBS_SIZE=24;' +

// ── DOM ──
'var cvArena=document.getElementById("cvArena");' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Default obstacles ──
'function defaultObstacles(){' +
'obstacles=[];' +
'obstacles.push({x:140,y:130,w:OBS_SIZE,h:50});' +
'obstacles.push({x:200,y:80,w:40,h:OBS_SIZE});' +
'obstacles.push({x:100,y:220,w:OBS_SIZE,h:40});' +
'obstacles.push({x:220,y:200,w:50,h:OBS_SIZE})}' +

// ── Sensor raycasting ──
'function castSensors(){' +
'sensorHits=[];' +
'for(var si=0;si<SENSOR_ANGLES.length;si++){' +
'var a=robot.angle+SENSOR_ANGLES[si];' +
'var hit=sensorRange;' +
// check obstacles
'for(var oi=0;oi<obstacles.length;oi++){' +
'var o=obstacles[oi];' +
'for(var d=1;d<sensorRange;d+=2){' +
'var px=robot.x+Math.cos(a)*d;' +
'var py=robot.y+Math.sin(a)*d;' +
'if(px>=o.x&&px<=o.x+o.w&&py>=o.y&&py<=o.y+o.h){' +
'if(d<hit)hit=d;break}}}' +
// check walls
'for(var d=1;d<sensorRange;d+=2){' +
'var px=robot.x+Math.cos(a)*d;' +
'var py=robot.y+Math.sin(a)*d;' +
'if(px<0||px>canvasW||py<0||py>canvasH){' +
'if(d<hit)hit=d;break}}' +
'sensorHits.push(hit)}}' +

// ── Layer 0: Avoid obstacles ──
'function layerAvoid(){' +
'var minDist=sensorRange;var minIdx=-1;' +
'for(var i=0;i<sensorHits.length;i++){' +
'if(sensorHits[i]<minDist){minDist=sensorHits[i];minIdx=i}}' +
'if(minDist<sensorRange*0.7){' + // obstacle detected
'var turnDir=minIdx<SENSOR_ANGLES.length/2?1:-1;' +
'if(minIdx===Math.floor(SENSOR_ANGLES.length/2))turnDir=Math.random()>0.5?1:-1;' +
'return{active:true,turn:turnDir*0.12,speed:robotSpeed*0.4}}' +
'return{active:false,turn:0,speed:0}}' +

// ── Layer 1: Wander ──
'function layerWander(){' +
'wanderAngle+=((Math.random()-0.5)*0.3);' +
'if(wanderAngle>0.5)wanderAngle=0.5;' +
'if(wanderAngle<-0.5)wanderAngle=-0.5;' +
'return{active:true,turn:wanderAngle*0.05,speed:robotSpeed}}' +

// ── Layer 2: Seek goal ──
'function layerSeek(){' +
'var dx=goal.x-robot.x;var dy=goal.y-robot.y;' +
'var dist=Math.sqrt(dx*dx+dy*dy);' +
'if(dist<robot.radius+10){' +
'goalsReached++;' +
// respawn goal
'goal.x=40+Math.random()*(canvasW-80);' +
'goal.y=40+Math.random()*(canvasH-80);' +
'return{active:true,turn:0,speed:0}}' +
'var targetAngle=Math.atan2(dy,dx);' +
'var diff=targetAngle-robot.angle;' +
'while(diff>Math.PI)diff-=Math.PI*2;' +
'while(diff<-Math.PI)diff+=Math.PI*2;' +
'return{active:true,turn:diff*0.08,speed:robotSpeed}}' +

// ── Subsumption: higher priority suppresses lower ──
'function subsumptionStep(){' +
'castSensors();' +
'var action={turn:0,speed:0};' +
'activeLayer=-1;' +
// Priority: 0 (avoid) > 1 (wander) > 2 (seek)
// Check from lowest to highest; highest active wins
'if(layerOn[2]){var r=layerSeek();if(r.active){action=r;activeLayer=2}}' +
'if(layerOn[1]){var r=layerWander();if(r.active){action=r;activeLayer=1}}' +
'if(layerOn[0]){var r=layerAvoid();if(r.active){action=r;activeLayer=0}}' +

'robot.angle+=action.turn;' +
'var nx=robot.x+Math.cos(robot.angle)*action.speed;' +
'var ny=robot.y+Math.sin(robot.angle)*action.speed;' +

// collision check
'var collided=false;' +
'for(var oi=0;oi<obstacles.length;oi++){' +
'var o=obstacles[oi];' +
'var cx=Math.max(o.x,Math.min(nx,o.x+o.w));' +
'var cy=Math.max(o.y,Math.min(ny,o.y+o.h));' +
'var dx=nx-cx;var dy=ny-cy;' +
'if(Math.sqrt(dx*dx+dy*dy)<robot.radius){collided=true;break}}' +
// wall collision
'if(nx<robot.radius||nx>canvasW-robot.radius||ny<robot.radius||ny>canvasH-robot.radius)collided=true;' +

'if(collided){collisions++;robot.angle+=0.3}' +
'else{robot.x=nx;robot.y=ny}' +
'simTime++;' +

// update layer highlight
'document.getElementById("lr0").className="layer-row layer-0"+(activeLayer===0?" active":"");' +
'document.getElementById("lr1").className="layer-row layer-1"+(activeLayer===1?" active":"");' +
'document.getElementById("lr2").className="layer-row layer-2"+(activeLayer===2?" active":"");' +
'}' +

// ── Draw arena ──
'function drawArena(){' +
'var dim=setupCanvas(cvArena,300);canvasW=dim.w;canvasH=dim.h;' +
'var ctx=cvArena.getContext("2d");ctx.clearRect(0,0,canvasW,canvasH);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +

// draw obstacles
'for(var i=0;i<obstacles.length;i++){' +
'var o=obstacles[i];' +
'ctx.fillStyle=text3C;ctx.globalAlpha=0.5;' +
'ctx.fillRect(o.x,o.y,o.w,o.h);ctx.globalAlpha=1;' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.strokeRect(o.x,o.y,o.w,o.h)}' +

// draw goal (teal star)
'ctx.save();ctx.translate(goal.x,goal.y);' +
'ctx.fillStyle=tealC;ctx.beginPath();' +
'for(var i=0;i<5;i++){' +
'var a=i*Math.PI*2/5-Math.PI/2;' +
'var r1=10;var r2=4;' +
'ctx.lineTo(Math.cos(a)*r1,Math.sin(a)*r1);' +
'var a2=a+Math.PI/5;' +
'ctx.lineTo(Math.cos(a2)*r2,Math.sin(a2)*r2)}' +
'ctx.closePath();ctx.fill();ctx.restore();' +

// draw sensor beams
'for(var si=0;si<SENSOR_ANGLES.length;si++){' +
'var a=robot.angle+SENSOR_ANGLES[si];' +
'var dist=sensorHits[si]||sensorRange;' +
'var ex=robot.x+Math.cos(a)*dist;' +
'var ey=robot.y+Math.sin(a)*dist;' +
'var hitClose=dist<sensorRange*0.7;' +
'ctx.strokeStyle=hitClose?redC:tealC;ctx.lineWidth=1;' +
'ctx.globalAlpha=0.25;' +
'ctx.beginPath();ctx.moveTo(robot.x,robot.y);ctx.lineTo(ex,ey);ctx.stroke();ctx.globalAlpha=1;' +
// endpoint
'if(hitClose){ctx.beginPath();ctx.arc(ex,ey,3,0,Math.PI*2);' +
'ctx.fillStyle=redC;ctx.globalAlpha=0.5;ctx.fill();ctx.globalAlpha=1}}' +

// sensor fan (translucent)
'ctx.beginPath();ctx.moveTo(robot.x,robot.y);' +
'var fanA1=robot.angle+SENSOR_ANGLES[0];' +
'var fanA2=robot.angle+SENSOR_ANGLES[SENSOR_ANGLES.length-1];' +
'ctx.arc(robot.x,robot.y,sensorRange,fanA1,fanA2);' +
'ctx.closePath();' +
'var layerColors=[redC,accentC,tealC];' +
'ctx.fillStyle=activeLayer>=0?layerColors[activeLayer]:borderC;' +
'ctx.globalAlpha=0.06;ctx.fill();ctx.globalAlpha=1;' +

// draw robot
'var robotCol=activeLayer===0?redC:activeLayer===1?accentC:activeLayer===2?tealC:borderC;' +
'ctx.beginPath();ctx.arc(robot.x,robot.y,robot.radius,0,Math.PI*2);' +
'ctx.fillStyle=robotCol;ctx.globalAlpha=0.8;ctx.fill();ctx.globalAlpha=1;' +
'ctx.strokeStyle=robotCol;ctx.lineWidth=2;ctx.stroke();' +
// direction indicator
'ctx.beginPath();' +
'ctx.moveTo(robot.x+Math.cos(robot.angle)*robot.radius,robot.y+Math.sin(robot.angle)*robot.radius);' +
'ctx.lineTo(robot.x+Math.cos(robot.angle)*(robot.radius+6),robot.y+Math.sin(robot.angle)*(robot.radius+6));' +
'ctx.strokeStyle=robotCol;ctx.lineWidth=3;ctx.stroke()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var layerNames=[T.l0,T.l1,T.l2];' +
'var aName=activeLayer>=0?layerNames[activeLayer]:"-";' +
'var s="<span class=\\"hi\\">"+T.activeLayer+"</span> "+aName;' +
's+="<br><span class=\\"red\\">"+T.collisions+"</span> "+collisions;' +
's+=" &nbsp;|&nbsp; <span class=\\"hi\\">"+T.goals+"</span> "+goalsReached;' +
's+="<br>"+T.time+": "+(simTime/60).toFixed(1)+"s";' +
'box.innerHTML=s}' +

// ── Read params ──
'function readParams(){' +
'sensorRange=+document.getElementById("slRange").value;' +
'robotSpeed=+document.getElementById("slSpeed").value/10;' +
'layerOn[0]=document.getElementById("chkL0").checked;' +
'layerOn[1]=document.getElementById("chkL1").checked;' +
'layerOn[2]=document.getElementById("chkL2").checked;' +
'document.getElementById("valRange").textContent=sensorRange+"px";' +
'document.getElementById("valSpeed").textContent=robotSpeed.toFixed(1)}' +

// ── Animation ──
'function animate(){' +
'if(!running)return;' +
'subsumptionStep();drawArena();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

'function onRun(){' +
'if(running){running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";return}' +
'readParams();running=true;' +
'document.getElementById("btnRun").textContent=T.stop;' +
'document.getElementById("btnRun").className="btn btn-stop";' +
'animate()}' +

'function addRandomObs(){' +
'var w=OBS_SIZE+Math.random()*30;' +
'var h=OBS_SIZE+Math.random()*30;' +
'var x=20+Math.random()*(canvasW-40-w);' +
'var y=20+Math.random()*(canvasH-40-h);' +
'obstacles.push({x:x,y:y,w:w,h:h});' +
'if(!running){castSensors();drawArena();updateStats()}}' +

'function onReset(){' +
'running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'robot={x:50,y:50,angle:0,radius:12};' +
'goal={x:canvasW-50,y:canvasH-50};' +
'activeLayer=-1;collisions=0;goalsReached=0;simTime=0;wanderAngle=0;' +
'defaultObstacles();readParams();castSensors();drawArena();updateStats();notifyHeight()}' +

'function onParam(){readParams();if(!running){castSensors();drawArena();updateStats()}}' +

// ── Canvas tap: add/remove obstacles, long-press to move goal ──
'function getCanvasXY(e){' +
'var rect=cvArena.getBoundingClientRect();' +
'var dpr=window.devicePixelRatio||1;' +
'var x,y;' +
'if(e.changedTouches){x=e.changedTouches[0].clientX;y=e.changedTouches[0].clientY}' +
'else{x=e.clientX;y=e.clientY}' +
'return{x:(x-rect.left)*(cvArena.width/dpr)/rect.width,' +
'y:(y-rect.top)*(cvArena.height/dpr)/rect.height}}' +

'var pressStart=0;var pressPos=null;' +
'cvArena.addEventListener("pointerdown",function(e){' +
'pressStart=Date.now();pressPos=getCanvasXY(e)});' +

'cvArena.addEventListener("pointerup",function(e){' +
'var elapsed=Date.now()-pressStart;' +
'var pos=getCanvasXY(e);' +
'if(elapsed>500){' + // long press = move goal
'goal.x=pos.x;goal.y=pos.y;' +
'if(!running){castSensors();drawArena();updateStats()}return}' +
// short tap = add/remove obstacle
'for(var i=0;i<obstacles.length;i++){' +
'var o=obstacles[i];' +
'if(pos.x>=o.x&&pos.x<=o.x+o.w&&pos.y>=o.y&&pos.y<=o.y+o.h){' +
'obstacles.splice(i,1);' +
'if(!running){castSensors();drawArena();updateStats()}return}}' +
// add new obstacle
'obstacles.push({x:pos.x-OBS_SIZE/2,y:pos.y-OBS_SIZE/2,w:OBS_SIZE,h:OBS_SIZE});' +
'if(!running){castSensors();drawArena();updateStats()}});' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-arena").textContent=T.arena;' +
'document.getElementById("lbl-layers").textContent=T.layers;' +
'document.getElementById("lblL0").textContent=T.l0;' +
'document.getElementById("lblL1").textContent=T.l1;' +
'document.getElementById("lblL2").textContent=T.l2;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-range").textContent=T.range;' +
'document.getElementById("lbl-speed").textContent=T.speed;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnAddObs").textContent=T.addObs;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("hintTap").textContent=T.tapHint;' +
'var dim=setupCanvas(cvArena,300);canvasW=dim.w;canvasH=dim.h;' +
'readParams();defaultObstacles();' +
'goal={x:canvasW-50,y:canvasH-50};' +
'castSensors();drawArena();updateStats();' +
'window.addEventListener("resize",function(){' +
'var dim=setupCanvas(cvArena,300);canvasW=dim.w;canvasH=dim.h;' +
'if(!running){castSensors();drawArena()}notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
