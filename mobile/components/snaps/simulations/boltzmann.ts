/**
 * Boltzmann Distribution interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Energy level diagram with particles distributed by Boltzmann distribution
 * - Bar chart showing probability of each level (real-time)
 * - Temperature slider: T→0 (argmax/greedy) to T→∞ (uniform/random)
 * - Draggable energy levels (tap & drag to change E_i)
 * - "Softmax Mode" toggle: relabels as logits / softmax probabilities
 * - Animated particles jumping between levels (Monte Carlo style)
 * - Stats: Temperature, partition function Z, entropy
 * - Dark/light theme, Korean/English bilingual
 */

export function getBoltzmannSimulationHTML(isDark: boolean, lang: string): string {
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
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'</style></head><body>' +

// ── Main Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-main"></div>' +
'<canvas id="cvMain" height="220"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-temp"></span>' +
'<input type="range" id="slTemp" min="1" max="100" value="20" oninput="onTempSlider()">' +
'<span class="ctrl-val" id="valTemp"></span></div>' +
'<div class="btn-row">' +
'<div class="btn" id="btnSoftmax" onclick="toggleSoftmax()"></div>' +
'<div class="btn" id="btnAnimate" onclick="toggleAnimate()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{main:"\\uBCFC\\uCE20\\uB9CC \\uBD84\\uD3EC",ctrl:"\\uCEE8\\uD2B8\\uB864",' +
'temp:"\\uC628\\uB3C4",stats:"\\uD1B5\\uACC4",' +
'energy:"\\uC5D0\\uB108\\uC9C0 \\uC900\\uC704",prob:"\\uD655\\uB960",' +
'particle:"\\uC785\\uC790",partZ:"\\uBD84\\uBC30\\uD568\\uC218 Z",' +
'entropy:"\\uC5D4\\uD2B8\\uB85C\\uD53C",softmaxOn:"\\uC18C\\uD504\\uD2B8\\uB9E5\\uC2A4 \\uBAA8\\uB4DC ON",' +
'softmaxOff:"\\uC18C\\uD504\\uD2B8\\uB9E5\\uC2A4 \\uBAA8\\uB4DC OFF",' +
'logit:"\\uB85C\\uC9D7",softProb:"\\uC18C\\uD504\\uD2B8\\uB9E5\\uC2A4 \\uD655\\uB960",' +
'animate:"\\u25B6 \\uC560\\uB2C8\\uBA54\\uC774\\uC158",stop:"\\u25A0 \\uC815\\uC9C0",' +
'reset:"\\u21BA \\uB9AC\\uC14B",' +
'lowT:"\\uB0AE\\uC740 \\uC628\\uB3C4 \\u2192 \\uD0D0\\uC695(argmax)",' +
'highT:"\\uB192\\uC740 \\uC628\\uB3C4 \\u2192 \\uADE0\\uB4F1 \\uBD84\\uD3EC",' +
'dragHint:"\\uC5D0\\uB108\\uC9C0 \\uC120\\uC744 \\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uAC12 \\uBCC0\\uACBD"},' +
'en:{main:"BOLTZMANN DISTRIBUTION",ctrl:"CONTROLS",' +
'temp:"Temp",stats:"STATISTICS",' +
'energy:"Energy Level",prob:"Probability",' +
'particle:"Particles",partZ:"Partition Z",' +
'entropy:"Entropy",softmaxOn:"SOFTMAX MODE ON",' +
'softmaxOff:"SOFTMAX MODE OFF",' +
'logit:"Logit",softProb:"Softmax Prob",' +
'animate:"\\u25B6 Animate",stop:"\\u25A0 Stop",' +
'reset:"\\u21BA Reset",' +
'lowT:"Low T \\u2192 Greedy (argmax)",' +
'highT:"High T \\u2192 Uniform",' +
'dragHint:"Drag energy lines to change values"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var N_LEVELS=5;' +
'var energies=[1,2,3,4,5];' +
'var temperature=2.0;' +
'var softmaxMode=false;' +
'var animating=false;' +
'var animTimer=null;' +
'var TOTAL_PARTICLES=40;' +
'var particles=[];' +
'var dragging=-1;' +
'var dragStartY=0;' +
'var dragStartE=0;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Boltzmann probabilities ──
'function calcProbs(){' +
'var probs=[];var Z=0;' +
'for(var i=0;i<N_LEVELS;i++){' +
'var v=Math.exp(-energies[i]/temperature);probs.push(v);Z+=v}' +
'for(var i=0;i<N_LEVELS;i++)probs[i]/=Z;' +
'return{probs:probs,Z:Z}}' +

// ── Entropy ──
'function calcEntropy(probs){' +
'var H=0;for(var i=0;i<probs.length;i++){' +
'if(probs[i]>1e-12)H-=probs[i]*Math.log2(probs[i])}return H}' +

// ── Distribute particles ──
'function distributeParticles(){' +
'var r=calcProbs();particles=[];' +
'var counts=[];var remaining=TOTAL_PARTICLES;' +
'for(var i=0;i<N_LEVELS;i++){' +
'var c=Math.round(r.probs[i]*TOTAL_PARTICLES);counts.push(c)}' +
// fix rounding
'var sum=0;for(var i=0;i<N_LEVELS;i++)sum+=counts[i];' +
'var diff=TOTAL_PARTICLES-sum;' +
'if(diff>0)counts[0]+=diff;' +
'if(diff<0){for(var i=N_LEVELS-1;i>=0&&diff<0;i--){var r2=Math.min(counts[i],-diff);counts[i]-=r2;diff+=r2}}' +
'for(var i=0;i<N_LEVELS;i++){' +
'for(var j=0;j<counts[i];j++){' +
'particles.push({level:i,x:Math.random(),bobPhase:Math.random()*Math.PI*2})}}}' +

// ── Monte Carlo jump ──
'function mcJump(){' +
'if(particles.length===0)return;' +
'var idx=Math.floor(Math.random()*particles.length);' +
'var p=particles[idx];' +
'var newLevel=Math.floor(Math.random()*N_LEVELS);' +
'if(newLevel===p.level)return;' +
'var dE=energies[newLevel]-energies[p.level];' +
'var accept=dE<=0?1:Math.exp(-dE/temperature);' +
'if(Math.random()<accept){p.level=newLevel;p.x=Math.random()}}' +

// ── Color palette for levels ──
'var LEVEL_COLORS=["#5EEAD4","#F59E0B","#F87171","#A78BFA","#34D399"];' +

// ── Draw main canvas ──
'function drawMain(){' +
'var cv=document.getElementById("cvMain");' +
'var dim=setupCanvas(cv,220);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var r=calcProbs();' +

// Layout: left half = energy diagram, right half = bar chart
'var midX=Math.floor(w*0.48);' +
'var padL=40;var padR=14;var padT=22;var padB=28;' +

// ── Left: Energy Level Diagram ──
// y-axis: energy 0 at bottom, max energy+1 at top
'var maxE=0;for(var i=0;i<N_LEVELS;i++)if(energies[i]>maxE)maxE=energies[i];' +
'maxE=Math.max(maxE+1,6);' +
'function eToY(e){return padT+(maxE-e)/(maxE)*(h-padT-padB)}' +

// y-axis line
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(padL,padT);ctx.lineTo(padL,h-padB);ctx.stroke();' +

// y-axis labels
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'for(var e=0;e<=maxE;e+=1){' +
'var yy=eToY(e);' +
'ctx.fillText(e.toString(),padL-4,yy+3);' +
'ctx.strokeStyle=borderC;ctx.setLineDash([2,3]);ctx.beginPath();' +
'ctx.moveTo(padL,yy);ctx.lineTo(midX-10,yy);ctx.stroke();ctx.setLineDash([])}' +

// Energy level lines (thick, colored)
'var lineW=midX-padL-20;' +
'for(var i=0;i<N_LEVELS;i++){' +
'var yy=eToY(energies[i]);' +
'ctx.strokeStyle=LEVEL_COLORS[i];ctx.lineWidth=3;' +
'ctx.beginPath();ctx.moveTo(padL+6,yy);ctx.lineTo(padL+6+lineW,yy);ctx.stroke();' +
// label
'ctx.fillStyle=LEVEL_COLORS[i];ctx.font="10px monospace";ctx.textAlign="left";' +
'var lbl=softmaxMode?("z"+(i+1)+"="+energies[i].toFixed(1)):("E"+(i+1)+"="+energies[i].toFixed(1));' +
'ctx.fillText(lbl,padL+8,yy-6)}' +

// Particles on levels
'var levelCounts=[];for(var i=0;i<N_LEVELS;i++)levelCounts.push(0);' +
'for(var p=0;p<particles.length;p++)levelCounts[particles[p].level]++;' +
'var now=Date.now()/1000;' +
'for(var p=0;p<particles.length;p++){' +
'var pt=particles[p];var yy=eToY(energies[pt.level]);' +
'var countAtLevel=levelCounts[pt.level];' +
'var spacing=lineW/(countAtLevel+1);' +
'var posInLevel=0;for(var q=0;q<p;q++){if(particles[q].level===pt.level)posInLevel++}' +
'var px=padL+6+spacing*(posInLevel+1);' +
'var bob=Math.sin(now*2+pt.bobPhase)*2;' +
'ctx.fillStyle=LEVEL_COLORS[pt.level];ctx.globalAlpha=0.85;' +
'ctx.beginPath();ctx.arc(px,yy-8+bob,3.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}' +

// Label
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(softmaxMode?T.logit:T.energy,(padL+midX)/2,h-6);' +

// ── Right: Bar Chart ──
'var barL=midX+16;var barR=w-padR;var barW=barR-barL;' +
'var barAreaH=h-padT-padB;' +
'var gap=6;var bw=(barW-gap*(N_LEVELS-1))/N_LEVELS;' +

// y-axis for probability
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(barL-2,padT);ctx.lineTo(barL-2,h-padB);ctx.lineTo(barR,h-padB);ctx.stroke();' +

// max prob for scale
'var maxP=0;for(var i=0;i<N_LEVELS;i++)if(r.probs[i]>maxP)maxP=r.probs[i];' +
'maxP=Math.max(maxP*1.15,0.05);' +

// bars
'for(var i=0;i<N_LEVELS;i++){' +
'var bx=barL+i*(bw+gap);' +
'var bh=r.probs[i]/maxP*barAreaH;' +
'var by=h-padB-bh;' +
'ctx.fillStyle=LEVEL_COLORS[i];ctx.globalAlpha=0.7;' +
'ctx.fillRect(bx,by,bw,bh);ctx.globalAlpha=1;' +
'ctx.strokeStyle=LEVEL_COLORS[i];ctx.lineWidth=2;' +
'ctx.strokeRect(bx,by,bw,bh);' +
// probability text above bar
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText(r.probs[i].toFixed(2),bx+bw/2,by-4);' +
// level label below
'ctx.fillStyle=text3C;ctx.font="9px monospace";' +
'var bLabel=softmaxMode?("z"+(i+1)):("E"+(i+1));' +
'ctx.fillText(bLabel,bx+bw/2,h-padB+12)}' +

// prob axis label
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(softmaxMode?T.softProb:T.prob,(barL+barR)/2,h-6);' +

// drag hint
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.dragHint,w/2,12);' +
'}' +

// ── Temperature slider handler ──
'function onTempSlider(){' +
'var v=+document.getElementById("slTemp").value;' +
'temperature=0.1+v/100*9.9;' +
'document.getElementById("valTemp").textContent=temperature.toFixed(1);' +
'distributeParticles();drawMain();updateStats();notifyHeight()}' +

// ── Softmax toggle ──
'function toggleSoftmax(){' +
'softmaxMode=!softmaxMode;' +
'document.getElementById("btnSoftmax").textContent=softmaxMode?T.softmaxOn:T.softmaxOff;' +
'drawMain();updateStats();notifyHeight()}' +

// ── Animation toggle ──
'function toggleAnimate(){' +
'animating=!animating;' +
'document.getElementById("btnAnimate").textContent=animating?T.stop:T.animate;' +
'document.getElementById("btnAnimate").className=animating?"btn btn-stop":"btn";' +
'if(animating)startAnim();else stopAnim()}' +

'function startAnim(){' +
'if(animTimer)return;' +
'animTimer=setInterval(function(){' +
'for(var i=0;i<3;i++)mcJump();' +
'drawMain();updateStats()},120)}' +

'function stopAnim(){if(animTimer){clearInterval(animTimer);animTimer=null}}' +

// ── Reset ──
'function onReset(){' +
'energies=[1,2,3,4,5];temperature=2.0;softmaxMode=false;' +
'document.getElementById("slTemp").value=20;' +
'document.getElementById("valTemp").textContent="2.0";' +
'document.getElementById("btnSoftmax").textContent=T.softmaxOff;' +
'if(animating)toggleAnimate();' +
'distributeParticles();drawMain();updateStats();notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var r=calcProbs();var H=calcEntropy(r.probs);' +
'var box=document.getElementById("statsBox");' +
'var s="<span class=\\"hi\\">"+(softmaxMode?T.logit:T.temp)+"</span> "+temperature.toFixed(2)+"<br>";' +
's+=T.partZ+": <span class=\\"hi\\">"+r.Z.toFixed(4)+"</span><br>";' +
's+=T.entropy+": "+H.toFixed(4)+" bits<br><br>";' +
'for(var i=0;i<N_LEVELS;i++){' +
'var lbl=softmaxMode?("z"+(i+1)):("E"+(i+1));' +
's+="<span style=\\"color:"+LEVEL_COLORS[i]+"\\">"+lbl+"="+energies[i].toFixed(1)+"</span> \\u2192 p=<span class=\\"warn\\">"+r.probs[i].toFixed(4)+"</span><br>"}' +
's+="<br>";' +
'if(temperature<0.5){s+="<span class=\\"warn\\">"+T.lowT+"</span>"}' +
'else if(temperature>5){s+="<span class=\\"warn\\">"+T.highT+"</span>"}' +
'box.innerHTML=s}' +

// ── Drag energy levels on canvas ──
'function getTouchPos(cv,e){' +
'var rect=cv.getBoundingClientRect();' +
'var t=e.touches?e.touches[0]:e;' +
'return{x:t.clientX-rect.left,y:t.clientY-rect.top}}' +

'function initDrag(){' +
'var cv=document.getElementById("cvMain");' +
'var midX=Math.floor(cv.clientWidth*0.48);' +
'var padL=40;var padT=22;var padB=28;var h2=220;' +
'var maxE2=0;for(var i=0;i<N_LEVELS;i++)if(energies[i]>maxE2)maxE2=energies[i];' +
'maxE2=Math.max(maxE2+1,6);' +
'function yToE(y){return maxE2-(y-padT)/(h2-padT-padB)*maxE2}' +
'function eToY2(e){return padT+(maxE2-e)/maxE2*(h2-padT-padB)}' +

'cv.addEventListener("touchstart",function(e){' +
'var pos=getTouchPos(cv,e);' +
'if(pos.x>midX)return;' +  // only left side
'for(var i=0;i<N_LEVELS;i++){' +
'var yy=eToY2(energies[i]);' +
'if(Math.abs(pos.y-yy)<18){dragging=i;dragStartY=pos.y;dragStartE=energies[i];' +
'e.preventDefault();return}}},{passive:false});' +

'cv.addEventListener("touchmove",function(e){' +
'if(dragging<0)return;e.preventDefault();' +
'var pos=getTouchPos(cv,e);' +
'var dy=pos.y-dragStartY;' +
'var dE=dy/(h2-padT-padB)*maxE2;' +  // inverted
'var newE=dragStartE-dE;' +
'newE=Math.max(0.1,Math.min(8,Math.round(newE*10)/10));' +
'energies[dragging]=newE;' +
'distributeParticles();drawMain();updateStats()},{passive:false});' +

'cv.addEventListener("touchend",function(){dragging=-1});' +
'cv.addEventListener("touchcancel",function(){dragging=-1})}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-main").textContent=T.main;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-temp").textContent=softmaxMode?T.logit:T.temp;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("valTemp").textContent="2.0";' +
'document.getElementById("btnSoftmax").textContent=T.softmaxOff;' +
'document.getElementById("btnAnimate").textContent=T.animate;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'distributeParticles();drawMain();updateStats();initDrag();' +
'window.addEventListener("resize",function(){drawMain();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
