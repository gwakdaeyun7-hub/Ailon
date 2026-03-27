/**
 * Cybernetics — Feedback Loop with 3 Scenarios simulation
 *
 * Features:
 * - Circular feedback loop diagram with 6 blocks and animated signal particles
 * - Time-series graph showing output converging to reference
 * - 3 scenario tabs: Thermostat, Robot Arm, Neural Net
 * - Gain K slider with endpoint labels (Slow/Excess), Delay slider
 * - Break Feedback toggle, Run/Reset controls
 * - Stats: error (e) and control signal (u) real-time display
 * - Dark/light theme, Korean/English bilingual
 */

export function getCyberneticsSimulationHTML(isDark: boolean, lang: string): string {
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
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card);touch-action:none}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:72px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:14px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.btn-break{background:var(--red);border-color:var(--red);color:#fff}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;min-height:44px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'</style></head><body>' +

// ── Scenario Tabs ──
'<div class="panel"><div class="label" id="lbl-scenario"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="sc0" onclick="setScenario(0)"></div>' +
'<div class="preset" id="sc1" onclick="setScenario(1)"></div>' +
'<div class="preset" id="sc2" onclick="setScenario(2)"></div>' +
'</div>' +

// ── Loop Diagram Canvas ──
'<canvas id="cvLoop" height="210"></canvas></div>' +

// ── Time-Series Canvas ──
'<div class="panel"><div class="label" id="lbl-graph"></div>' +
'<canvas id="cvGraph" height="150"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lblDelay"></span>' +
'<input type="range" id="slDelay" min="0" max="50" value="0" oninput="onDelay()">' +
'<span class="ctrl-val" id="valDelay"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lblGain"></span>' +
'<input type="range" id="slGain" min="1" max="50" value="8" oninput="onGain()">' +
'<span class="ctrl-val" id="valGain"></span></div>' +
'<div style="display:flex;justify-content:space-between;margin:-6px 0 10px;padding:0 72px 0 72px;font-size:10px;color:var(--text3)">' +
'<span id="lbl-gL"></span><span id="lbl-gR"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="toggleRun()"></div>' +
'<div class="btn" id="btnBreak" onclick="toggleBreak()"></div>' +
'<div class="btn" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{scenario:"\\uC2DC\\uB098\\uB9AC\\uC624",graph:"\\uC751\\uB2F5 \\uADF8\\uB798\\uD504",ctrl:"\\uC81C\\uC5B4",stats:"\\uD1B5\\uACC4",' +
'delay:"\\uC9C0\\uC5F0",run:"\\uC2E4\\uD589",stop:"\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'breakFb:"\\uD53C\\uB4DC\\uBC31 \\uB04A\\uAE30",connectFb:"\\uD53C\\uB4DC\\uBC31 \\uC5F0\\uACB0",' +
'sc0:"\\uC628\\uB3C4\\uC870\\uC808\\uAE30",sc1:"\\uB85C\\uBD07 \\uD314",sc2:"\\uC2E0\\uACBD\\uB9DD",' +
'ref:"\\uBAA9\\uD45C",comp:"\\uBE44\\uAD50\\uAE30",ctrlr:"\\uC81C\\uC5B4\\uAE30",plant:"\\uC2DC\\uC2A4\\uD15C",out:"\\uCD9C\\uB825",sensor:"\\uC13C\\uC11C",' +
'broken:"\\uD53C\\uB4DC\\uBC31 \\uB04A\\uAE40 \\u2192 \\uC2DC\\uC2A4\\uD15C \\uBC1C\\uC0B0",' +
'delayWarn:"\\uC9C0\\uC5F0 \\u2192 \\uC9C4\\uB3D9 \\uBC1C\\uC0DD",' +
'output:"\\uCD9C\\uB825\\uAC12",reference:"\\uBAA9\\uD45C\\uAC12",ms:"ms",' +
'thRef:"25\\u00B0C",thCtrl:"\\uD788\\uD130",thPlant:"\\uBC29",thSensor:"\\uC628\\uB3C4\\uACC4",' +
'rbRef:"\\uBAA9\\uD45C \\uC704\\uCE58",rbCtrl:"\\uBAA8\\uD130 \\uB4DC\\uB77C\\uC774\\uBC84",rbPlant:"\\uD314",rbSensor:"\\uC778\\uCF54\\uB354",' +
'nnRef:"0 (\\uC190\\uC2E4 \\uCD5C\\uC18C\\uD654)",nnCtrl:"\\uC635\\uD2F0\\uB9C8\\uC774\\uC800",nnPlant:"\\uAC00\\uC911\\uCE58",nnSensor:"\\uAC80\\uC99D \\uC190\\uC2E4",gain:"\\uAC8C\\uC778 K",slow:"\\uB290\\uB9BC",excess:"\\uACFC\\uC789",errE:"\\uC624\\uCC28 e",ctrlU:"\\uC81C\\uC5B4 u"},' +
'en:{scenario:"SCENARIO",graph:"RESPONSE GRAPH",ctrl:"CONTROLS",stats:"STATISTICS",' +
'delay:"Delay",run:"Run",stop:"Stop",reset:"\\u21BA Reset",' +
'breakFb:"Break Feedback",connectFb:"Connect Feedback",' +
'sc0:"Thermostat",sc1:"Robot Arm",sc2:"Neural Net",' +
'ref:"Reference",comp:"Comparator",ctrlr:"Controller",plant:"Plant",out:"Output",sensor:"Sensor",' +
'broken:"Feedback broken \\u2192 system diverges",' +
'delayWarn:"Delay \\u2192 oscillation occurs",' +
'output:"Output",reference:"Reference",ms:"ms",' +
'thRef:"25\\u00B0C",thCtrl:"Heater",thPlant:"Room",thSensor:"Thermometer",' +
'rbRef:"Target Pos",rbCtrl:"Motor Driver",rbPlant:"Arm",rbSensor:"Encoder",' +
'nnRef:"0 (min loss)",nnCtrl:"Optimizer",nnPlant:"Weights",nnSensor:"Val Loss",gain:"Gain K",slow:"Slow",excess:"Excess",errE:"Error e",ctrlU:"Control u"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var scenario=0;var feedbackBroken=false;var delaySteps=0;var gainK=0.08;' +
'var output=0,reference=1;var outputHistory=[];' +
'var delayBuffer=[];' +
'var running=false,animId=null;var tStep=0;' +
'var particles=[];var particleT=0;' +

// ── Scenario labels ──
'var SCENARIOS=[' +
'{ref:function(){return T.thRef},ctrl:function(){return T.thCtrl},plant:function(){return T.thPlant},sensor:function(){return T.thSensor},gain:0.08,inertia:0.92},' +
'{ref:function(){return T.rbRef},ctrl:function(){return T.rbCtrl},plant:function(){return T.rbPlant},sensor:function(){return T.rbSensor},gain:0.12,inertia:0.88},' +
'{ref:function(){return T.nnRef},ctrl:function(){return T.nnCtrl},plant:function(){return T.nnPlant},sensor:function(){return T.nnSensor},gain:0.06,inertia:0.94}' +
'];' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Block positions for loop diagram ──
'function getBlockPositions(w,h){' +
'var cx=w/2,cy=h/2;var rx=w*0.36,ry=h*0.34;' +
'var bw=60,bh=26;' +
// 6 blocks arranged in oval: Reference(top-left), Comparator(top), Controller(top-right),
// Plant(bottom-right), Output(bottom), Sensor(bottom-left)
'var angles=[-2.6,-1.57,-0.5,0.5,1.57,2.6];' +
'var pos=[];' +
'for(var i=0;i<6;i++){' +
'pos.push({x:cx+rx*Math.cos(angles[i]),y:cy+ry*Math.sin(angles[i]),w:bw,h:bh})}' +
'return pos}' +

// ── Draw loop diagram ──
'function drawLoop(){' +
'var cv=document.getElementById("cvLoop");' +
'var dim=setupCanvas(cv,210);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +
'var cardC=cs.getPropertyValue("--card").trim();' +
'var sc=SCENARIOS[scenario];' +
'var labels=[sc.ref(),T.comp,T.ctrlr,sc.plant(),T.out,sc.sensor()];' +
'var blocks=getBlockPositions(w,h);' +

// draw connection arrows (lines between blocks)
'for(var i=0;i<6;i++){' +
'var j=(i+1)%6;' +
'var isBrokenLink=(i===5&&j===0);' +
// actually broken link is sensor(5)→comparator(1), but our indices: 5→0 in the loop
// In our arrangement: 0=Reference, 1=Comparator, 2=Controller, 3=Plant, 4=Output, 5=Sensor
// Flow: 0→1→2→3→4→5→1 (sensor feeds back to comparator)
// Let's do: 0→1, 1→2, 2→3, 3→4, 4→5, 5→1
'var target=j;if(i===5)target=1;' +
'if(i===0)target=1;' +
'var fromB=blocks[i];var toB=blocks[target];' +
'var fromX=fromB.x;var fromY=fromB.y;' +
'var toX=toB.x;var toY=toB.y;' +
'var dx=toX-fromX;var dy=toY-fromY;' +
'var dist=Math.sqrt(dx*dx+dy*dy);' +
'var nx=dx/dist;var ny=dy/dist;' +
'var sx=fromX+nx*(fromB.w/2+2);var sy=fromY+ny*(fromB.h/2+2);' +
'var ex=toX-nx*(toB.w/2+2);var ey=toY-ny*(toB.h/2+2);' +

'var isFeedback=(i===5);' +
'if(isFeedback&&feedbackBroken){' +
'ctx.strokeStyle=redC;ctx.lineWidth=2;ctx.setLineDash([4,4]);' +
'ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();ctx.setLineDash([]);' +
// X mark
'var mx=(sx+ex)/2;var my=(sy+ey)/2;' +
'ctx.strokeStyle=redC;ctx.lineWidth=3;' +
'ctx.beginPath();ctx.moveTo(mx-6,my-6);ctx.lineTo(mx+6,my+6);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(mx+6,my-6);ctx.lineTo(mx-6,my+6);ctx.stroke();' +
'}else{' +
'ctx.strokeStyle=isFeedback?accentC:tealC;ctx.lineWidth=2;' +
'ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(ex,ey);ctx.stroke();' +
// arrowhead
'var aLen=8;var aAng=Math.atan2(ey-sy,ex-sx);' +
'ctx.fillStyle=isFeedback?accentC:tealC;ctx.beginPath();' +
'ctx.moveTo(ex,ey);' +
'ctx.lineTo(ex-aLen*Math.cos(aAng-0.4),ey-aLen*Math.sin(aAng-0.4));' +
'ctx.lineTo(ex-aLen*Math.cos(aAng+0.4),ey-aLen*Math.sin(aAng+0.4));' +
'ctx.closePath();ctx.fill()}}' +

// draw animated particles along paths
'if(running){' +
'particleT=(particleT+0.015)%1;' +
'for(var i=0;i<6;i++){' +
'var target=(i===5)?1:(i+1)%6;' +
'if(i===5&&feedbackBroken)continue;' +
'var fromB=blocks[i];var toB=blocks[target];' +
'for(var p=0;p<2;p++){' +
'var pt=((particleT+p*0.5)%1);' +
'var px=fromB.x+(toB.x-fromB.x)*pt;' +
'var py=fromB.y+(toB.y-fromB.y)*pt;' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.7*(1-Math.abs(pt-0.5)*2)+0.3;' +
'ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();' +
'ctx.globalAlpha=1}}}' +

// draw blocks
'for(var i=0;i<6;i++){' +
'var b=blocks[i];' +
'ctx.fillStyle=surfaceC;ctx.fillRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);' +
'ctx.strokeStyle=(i===5&&feedbackBroken)?redC:borderC;ctx.lineWidth=2;' +
'ctx.strokeRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);' +
'ctx.fillStyle=textC;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";' +
// truncate label
'var lbl=labels[i];if(lbl.length>9)lbl=lbl.substring(0,8)+"..";' +
'ctx.fillText(lbl,b.x,b.y)}' +
'}' +

// ── Draw time-series ──
'function drawGraph(){' +
'var cv=document.getElementById("cvGraph");' +
'var dim=setupCanvas(cv,150);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=8;var gW=w-pad*2;var gH=h-pad*2;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.lineTo(w-pad,h-pad);ctx.stroke();' +

'if(outputHistory.length<2)return;' +
'var N=outputHistory.length;var maxN=200;var start=Math.max(0,N-maxN);var count=N-start;' +

// find value range
'var minV=0,maxV=reference;' +
'for(var i=start;i<N;i++){' +
'if(outputHistory[i]<minV)minV=outputHistory[i];' +
'if(outputHistory[i]>maxV)maxV=outputHistory[i]}' +
'var range=maxV-minV||1;minV-=range*0.1;maxV+=range*0.1;range=maxV-minV;' +

'function toX(i){return pad+((i-start)/Math.max(count-1,1))*gW}' +
'function toY(v){return pad+(maxV-v)/range*gH}' +

// reference line
'ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.setLineDash([5,3]);' +
'ctx.beginPath();ctx.moveTo(toX(start),toY(reference));ctx.lineTo(toX(N-1),toY(reference));ctx.stroke();ctx.setLineDash([]);' +

// output line
'ctx.strokeStyle="rgba(59,130,246,0.9)";ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=start;i<N;i++){var x=toX(i);var y=toY(outputHistory[i]);if(i===start)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.setLineDash([5,3]);ctx.strokeStyle=tealC;ctx.lineWidth=1.5;' +
'ctx.beginPath();ctx.moveTo(pad+4,pad+4);ctx.lineTo(pad+20,pad+4);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=text3C;ctx.fillText(T.reference,pad+24,pad+8);' +
'ctx.strokeStyle="rgba(59,130,246,0.9)";ctx.lineWidth=2;' +
'ctx.beginPath();ctx.moveTo(pad+80,pad+4);ctx.lineTo(pad+96,pad+4);ctx.stroke();' +
'ctx.fillText(T.output,pad+100,pad+8);' +
'}' +

// ── Simulation step ──
'function simStep(){' +
'var sc=SCENARIOS[scenario];' +
'var sensed=output;' +
// apply delay: buffer the output value
'if(delaySteps>0){' +
'delayBuffer.push(output);' +
'if(delayBuffer.length>delaySteps)sensed=delayBuffer.shift();' +
'else sensed=delayBuffer[0]}' +
// if feedback broken, sensor reads 0
'if(feedbackBroken)sensed=0;' +
'var error=reference-sensed;' +
'var control=error*gainK;' +
'output=output*sc.inertia+control;' +
'outputHistory.push(output);' +
'if(outputHistory.length>400)outputHistory=outputHistory.slice(-200);' +
'tStep++}' +

// ── Animation ──
'function animate(){' +
'if(!running)return;' +
'for(var i=0;i<2;i++)simStep();' +
'drawLoop();drawGraph();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

// ── Controls ──
'function toggleRun(){' +
'running=!running;' +
'document.getElementById("btnRun").textContent=running?T.stop:T.run;' +
'document.getElementById("btnRun").className=running?"btn btn-stop":"btn btn-primary";' +
'if(running)animate()}' +

'function toggleBreak(){' +
'feedbackBroken=!feedbackBroken;' +
'document.getElementById("btnBreak").textContent=feedbackBroken?T.connectFb:T.breakFb;' +
'document.getElementById("btnBreak").className=feedbackBroken?"btn btn-break":"btn";' +
'drawLoop();notifyHeight()}' +

'function setScenario(idx){' +
'scenario=idx;' +
'for(var i=0;i<3;i++){document.getElementById("sc"+i).className=(i===idx)?"preset active":"preset"}' +
'doReset()}' +

'function onDelay(){' +
'delaySteps=+document.getElementById("slDelay").value;' +
'document.getElementById("valDelay").textContent=delaySteps*10+T.ms;' +
'delayBuffer=[];notifyHeight()}' +

'function onGain(){' +
'gainK=+document.getElementById("slGain").value/100;' +
'document.getElementById("valGain").textContent=gainK.toFixed(2);' +
'notifyHeight()}' +

'function doReset(){' +
'running=false;if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'output=0;outputHistory=[];delayBuffer=[];tStep=0;particleT=0;' +
'gainK=SCENARIOS[scenario].gain;' +
'document.getElementById("slGain").value=Math.round(gainK*100);' +
'document.getElementById("valGain").textContent=gainK.toFixed(2);' +
'drawLoop();drawGraph();updateStats();notifyHeight()}' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var err=reference-output;' +
'var ctrl=err*gainK;' +
'var s="<span class=\\"hi\\">"+T.reference+"</span> "+reference.toFixed(2);' +
's+=" &nbsp;|&nbsp; <span class=\\"hi\\">"+T.output+"</span> "+output.toFixed(3);' +
's+="<br><span class=\\"hi\\">"+T.errE+"</span> "+err.toFixed(3);' +
's+=" &nbsp;|&nbsp; <span class=\\"hi\\">"+T.ctrlU+"</span> "+ctrl.toFixed(4);' +
'if(feedbackBroken)s+="<br><span class=\\"warn\\">"+T.broken+"</span>";' +
'else if(delaySteps>10)s+="<br><span class=\\"warn\\">"+T.delayWarn+"</span>";' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-scenario").textContent=T.scenario;' +
'document.getElementById("lbl-graph").textContent=T.graph;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("sc0").textContent=T.sc0;' +
'document.getElementById("sc1").textContent=T.sc1;' +
'document.getElementById("sc2").textContent=T.sc2;' +
'document.getElementById("lblDelay").textContent=T.delay;' +
'document.getElementById("valDelay").textContent="0"+T.ms;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnBreak").textContent=T.breakFb;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lblGain").textContent=T.gain;' +
'document.getElementById("valGain").textContent=gainK.toFixed(2);' +
'document.getElementById("lbl-gL").textContent=T.slow;' +
'document.getElementById("lbl-gR").textContent=T.excess;' +

// ── Init ──
'drawLoop();drawGraph();updateStats();' +
'window.addEventListener("resize",function(){drawLoop();drawGraph();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
