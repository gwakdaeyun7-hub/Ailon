/**
 * Hebbian Learning — "Fire Together, Wire Together" interactive simulation
 *
 * Features:
 * - 6 neuron nodes arranged in a circle with synapse lines between each pair
 * - Connection width/opacity reflects weight (0–1)
 * - Tap a neuron to fire it (yellow glow, activation spreads via strong connections)
 * - Hebbian update: dw = eta * a_i * a_j when both active within 500ms
 * - Anti-Hebbian decay: w *= 0.995 per frame (forgetting)
 * - Pattern mode: auto-fire 1-3-5 to strengthen specific connections
 * - Learning rate slider, weight display toggle, clear button
 * - Dark/light theme, Korean/English bilingual
 */

export function getHebbianSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.toggle-row{display:flex;align-items:center;gap:8px;margin-bottom:8px;min-height:44px}' +
'.toggle-check{width:22px;height:22px;accent-color:var(--teal)}' +
'.toggle-label{font-size:12px;font-weight:700;color:var(--text)}' +
'</style></head><body>' +

// ── Network Canvas ──
'<div class="panel"><div class="label" id="lbl-net"></div>' +
'<canvas id="cvNet" height="250"></canvas>' +
'<div style="font-size:10px;color:var(--text3);margin-top:6px" id="hint-tap"></div></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lblEta"></span>' +
'<input type="range" id="slEta" min="1" max="20" value="5" oninput="onParam()">' +
'<span class="ctrl-val" id="valEta"></span></div>' +
'<div class="toggle-row">' +
'<input type="checkbox" class="toggle-check" id="chkShow" onchange="onParam()">' +
'<span class="toggle-label" id="lblShow"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnPattern" onclick="startPattern()"></div>' +
'<div class="btn" id="btnClear" onclick="clearWeights()"></div>' +
'<div class="btn btn-stop" id="btnStopPat" onclick="stopPattern()" style="display:none"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{net:"\\uD5E4\\uBE44\\uC548 \\uB124\\uD2B8\\uC6CC\\uD06C",ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'eta:"\\uD559\\uC2B5\\uB960(\\u03B7)",show:"\\uAC00\\uC911\\uCE58 \\uD45C\\uC2DC",' +
'pattern:"\\uD328\\uD134 (1-3-5)",clear:"\\uCD08\\uAE30\\uD654",stop:"\\uC815\\uC9C0",' +
'tap:"\\uB274\\uB7F0\\uC744 \\uD0ED\\uD558\\uC5EC \\uBC1C\\uD654\\uC2DC\\uD0A4\\uC138\\uC694",' +
'neuron:"\\uB274\\uB7F0",synapse:"\\uC2DC\\uB0C5\\uC2A4",fire:"\\uBC1C\\uD654",' +
'totalW:"\\uCD1D \\uC5F0\\uACB0 \\uAC15\\uB3C4",strongest:"\\uAC00\\uC7A5 \\uAC15\\uD55C \\uC30D",' +
'weakest:"\\uAC00\\uC7A5 \\uC57D\\uD55C \\uC30D",patRunning:"\\uD328\\uD134 \\uBAA8\\uB4DC \\uC2E4\\uD589 \\uC911"},' +
'en:{net:"HEBBIAN NETWORK",ctrl:"PARAMETERS",stats:"STATISTICS",' +
'eta:"Rate(\\u03B7)",show:"Show Weights",' +
'pattern:"Pattern (1-3-5)",clear:"Clear",stop:"Stop",' +
'tap:"Tap a neuron to fire it",' +
'neuron:"Neuron",synapse:"Synapse",fire:"Fire",' +
'totalW:"Total Strength",strongest:"Strongest Pair",' +
'weakest:"Weakest Pair",patRunning:"Pattern mode running"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var N=6,eta=0.05,showW=false;' +
'var nodes=[],weights=[],activations=[],fireTimes=[];' +
'var connFlash=[];' + // brief green/red flash on connections
'var patternTimer=null;' +
'var netW=300,netH=250;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Init ──
'function initNetwork(){' +
'nodes=[];weights=[];activations=[];fireTimes=[];connFlash=[];' +
'var cx=netW/2,cy=netH/2,r=Math.min(netW,netH)*0.34;' +
'for(var i=0;i<N;i++){' +
'var a=Math.PI*2*i/N-Math.PI/2;' +
'nodes.push({x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r});' +
'activations.push(0);fireTimes.push(-9999)}' +
// init weights (upper triangle stored flat)
'for(var i=0;i<N;i++){for(var j=i+1;j<N;j++){' +
'weights.push({i:i,j:j,w:0.1});connFlash.push(0)}}}' +

// ── Fire neuron ──
'function fireNeuron(idx){' +
'var now=Date.now();activations[idx]=1;fireTimes[idx]=now;' +
// Hebbian update with all recently active neurons
'for(var k=0;k<weights.length;k++){' +
'var e=weights[k];' +
'var otherIdx=(e.i===idx)?e.j:(e.j===idx)?e.i:-1;' +
'if(otherIdx<0)continue;' +
'if(activations[otherIdx]>0.1){' +
// both active — strengthen
'var dw=eta*activations[idx]*activations[otherIdx];' +
'e.w=Math.min(1,e.w+dw);connFlash[k]=10}}' + // 10 frames green flash
// spread activation through strong connections
'setTimeout(function(){' +
'for(var k=0;k<weights.length;k++){' +
'var e=weights[k];' +
'var otherIdx=(e.i===idx)?e.j:(e.j===idx)?e.i:-1;' +
'if(otherIdx<0)continue;' +
'if(e.w>0.4&&activations[otherIdx]<0.3){' +
'activations[otherIdx]=e.w*0.7;fireTimes[otherIdx]=Date.now()}}},120)}' +

// ── Decay + draw loop ──
'var animId=null;' +
'function loop(){' +
// decay activations
'for(var i=0;i<N;i++){' +
'if(activations[i]>0)activations[i]*=0.97;' +
'if(activations[i]<0.01)activations[i]=0}' +
// decay weights
'for(var k=0;k<weights.length;k++){' +
'weights[k].w*=0.9985;' +
'if(weights[k].w<0.01)weights[k].w=0.01;' +
'if(connFlash[k]>0)connFlash[k]--}' +
'drawNetwork();updateStats();' +
'animId=requestAnimationFrame(loop)}' +

// ── Draw network ──
'function drawNetwork(){' +
'var cv=document.getElementById("cvNet");' +
'var dim=setupCanvas(cv,250);netW=dim.w;netH=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,dim.w,dim.h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
// recalc node positions
'var cx=netW/2,cy=netH/2,r=Math.min(netW,netH)*0.34;' +
'for(var i=0;i<N;i++){' +
'var a=Math.PI*2*i/N-Math.PI/2;' +
'nodes[i].x=cx+Math.cos(a)*r;nodes[i].y=cy+Math.sin(a)*r}' +
// draw connections
'for(var k=0;k<weights.length;k++){' +
'var e=weights[k];var ni=nodes[e.i],nj=nodes[e.j];' +
'var lw=1+e.w*5;' +
'ctx.globalAlpha=0.2+e.w*0.8;' +
// flash color
'if(connFlash[k]>0){ctx.strokeStyle=greenC;ctx.globalAlpha=Math.min(1,0.4+e.w)}' +
'else{ctx.strokeStyle=tealC}' +
'ctx.lineWidth=lw;' +
'ctx.beginPath();ctx.moveTo(ni.x,ni.y);ctx.lineTo(nj.x,nj.y);ctx.stroke();' +
// weight labels
'if(showW){' +
'ctx.globalAlpha=1;ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText(e.w.toFixed(2),(ni.x+nj.x)/2,(ni.y+nj.y)/2-4)}' +
'ctx.globalAlpha=1}' +
// draw neurons
'for(var i=0;i<N;i++){' +
'var n=nodes[i];var act=activations[i];' +
// glow if active
'if(act>0.1){' +
'ctx.beginPath();ctx.arc(n.x,n.y,22+act*8,0,Math.PI*2);' +
'ctx.fillStyle="rgba(250,204,21,"+(act*0.35)+")";ctx.fill()}' +
// neuron body
'ctx.beginPath();ctx.arc(n.x,n.y,16,0,Math.PI*2);' +
'ctx.fillStyle=act>0.1?"#FACC15":borderC;ctx.fill();' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.stroke();' +
// label
'ctx.fillStyle=act>0.1?"#1A1816":textC;ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.textBaseline="middle";' +
'ctx.fillText(""+(i+1),n.x,n.y)}}' +

// ── Touch handler ──
'document.getElementById("cvNet").addEventListener("click",function(ev){' +
'var cv=document.getElementById("cvNet");' +
'var rect=cv.getBoundingClientRect();' +
'var sx=(ev.clientX-rect.left)/(rect.width)*netW;' +
'var sy=(ev.clientY-rect.top)/(rect.height)*netH;' +
'for(var i=0;i<N;i++){' +
'var dx=nodes[i].x-sx,dy=nodes[i].y-sy;' +
'if(Math.sqrt(dx*dx+dy*dy)<24){fireNeuron(i);break}}});' +

// ── Pattern mode ──
'var patStep=0;' +
'function startPattern(){' +
'if(patternTimer)return;' +
'document.getElementById("btnStopPat").style.display="";' +
'patStep=0;' +
'var seq=[0,2,4];' + // neurons 1,3,5 (0-indexed)
'patternTimer=setInterval(function(){' +
'fireNeuron(seq[patStep%3]);patStep++' +
'},600)}' +

'function stopPattern(){' +
'if(patternTimer){clearInterval(patternTimer);patternTimer=null}' +
'document.getElementById("btnStopPat").style.display="none"}' +

// ── Clear weights ──
'function clearWeights(){' +
'stopPattern();' +
'for(var k=0;k<weights.length;k++){weights[k].w=0.1;connFlash[k]=0}' +
'for(var i=0;i<N;i++){activations[i]=0}' +
'notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var total=0,maxW=0,minW=1,maxPair="",minPair="";' +
'for(var k=0;k<weights.length;k++){' +
'var e=weights[k];total+=e.w;' +
'if(e.w>maxW){maxW=e.w;maxPair=(e.i+1)+"-"+(e.j+1)}' +
'if(e.w<minW){minW=e.w;minPair=(e.i+1)+"-"+(e.j+1)}}' +
'var s="<span class=\\"hi\\">"+T.totalW+"</span> "+total.toFixed(2)+"<br>";' +
's+="<span class=\\"hi\\">"+T.strongest+"</span> "+maxPair+" ("+maxW.toFixed(3)+")\\n<br>";' +
's+="<span class=\\"warn\\">"+T.weakest+"</span> "+minPair+" ("+minW.toFixed(3)+")";' +
'if(patternTimer)s+="<br><span class=\\"warn\\">"+T.patRunning+"</span>";' +
'box.innerHTML=s}' +

// ── Param change ──
'function onParam(){' +
'eta=+document.getElementById("slEta").value/100;' +
'showW=document.getElementById("chkShow").checked;' +
'document.getElementById("valEta").textContent=eta.toFixed(2);' +
'notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-net").textContent=T.net;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lblEta").textContent=T.eta;' +
'document.getElementById("lblShow").textContent=T.show;' +
'document.getElementById("btnPattern").textContent=T.pattern;' +
'document.getElementById("btnClear").textContent=T.clear;' +
'document.getElementById("btnStopPat").textContent=T.stop;' +
'document.getElementById("hint-tap").textContent=T.tap;' +

// ── Init ──
'onParam();initNetwork();loop();' +
'window.addEventListener("resize",function(){notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
