/**
 * Markov Chain Monte Carlo interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 2D probability landscape as heatmap with walker trail
 * - Metropolis-Hastings algorithm: propose, accept/reject with probability
 * - Histogram overlay: accumulated samples' 2D density
 * - Target distribution presets: Single Peak / Bimodal / Ring / Banana
 * - Proposal width (sigma) slider — too large = many rejects, too small = slow
 * - Speed slider, show trail toggle, show histogram toggle
 * - Run / Pause / Reset with accept rate and sample count stats
 * - Dark/light theme, Korean/English bilingual
 */

export function getMCMCSimulationHTML(isDark: boolean, lang: string): string {
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
'.toggle-row{display:flex;gap:12px;margin-top:6px;margin-bottom:4px}' +
'.toggle-item{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--text2);cursor:pointer}' +
'.toggle-item input{accent-color:var(--teal);width:16px;height:16px}' +
'</style></head><body>' +

// ── Main Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-main"></div>' +
'<canvas id="cvMain" height="300"></canvas></div>' +

// ── Distribution Preset Panel ──
'<div class="panel"><div class="label" id="lbl-dist"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'<div class="preset" id="pre3" onclick="onPreset(3)"></div>' +
'</div></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-sigma"></span>' +
'<input type="range" id="slSigma" min="1" max="100" value="15" oninput="onSigmaSlider()">' +
'<span class="ctrl-val" id="valSigma"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-speed"></span>' +
'<input type="range" id="slSpeed" min="1" max="50" value="10" oninput="onSpeedSlider()">' +
'<span class="ctrl-val" id="valSpeed"></span></div>' +
'<div class="toggle-row">' +
'<label class="toggle-item"><input type="checkbox" id="chkTrail" checked onchange="onToggle()"><span id="lbl-trail"></span></label>' +
'<label class="toggle-item"><input type="checkbox" id="chkHist" onchange="onToggle()"><span id="lbl-hist"></span></label>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="toggleRun()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{main:"MCMC \\uC0D8\\uD50C\\uB9C1",dist:"\\uBAA9\\uD45C \\uBD84\\uD3EC",ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'sigma:"\\u03C3 \\uD3ED",speed:"\\uC18D\\uB3C4",trail:"\\uACBD\\uB85C",hist:"\\uD788\\uC2A4\\uD1A0\\uADF8\\uB7A8",' +
'run:"\\u25B6 \\uC2E4\\uD589",pause:"\\u25A0 \\uC77C\\uC2DC\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'pre0:"\\uB2E8\\uBD09",pre1:"\\uC774\\uBD09",pre2:"\\uB9C1",pre3:"\\uBC14\\uB098\\uB098",' +
'acceptRate:"\\uC218\\uB77D\\uB960",samples:"\\uC0D8\\uD50C",accepted:"\\uC218\\uB77D",rejected:"\\uAC70\\uBD80",' +
'burnIn:"\\uBC88\\uC778 \\uAD6C\\uAC04",burnInDone:"\\uBC88\\uC778 \\uC644\\uB8CC",' +
'tooLarge:"\\u03C3 \\uB108\\uBB34 \\uD07C \\u2192 \\uB300\\uBD80\\uBD84 \\uAC70\\uBD80",tooSmall:"\\u03C3 \\uB108\\uBB34 \\uC791\\uC74C \\u2192 \\uB290\\uB9B0 \\uD0D0\\uC0C9",' +
'pos:"\\uC704\\uCE58"},' +
'en:{main:"MCMC SAMPLING",dist:"TARGET DISTRIBUTION",ctrl:"CONTROLS",stats:"STATISTICS",' +
'sigma:"\\u03C3 Width",speed:"Speed",trail:"Trail",hist:"Histogram",' +
'run:"\\u25B6 Run",pause:"\\u25A0 Pause",reset:"\\u21BA Reset",' +
'pre0:"Single Peak",pre1:"Bimodal",pre2:"Ring",pre3:"Banana",' +
'acceptRate:"Accept Rate",samples:"Samples",accepted:"Accepted",rejected:"Rejected",' +
'burnIn:"Burn-in Phase",burnInDone:"Burn-in Done",' +
'tooLarge:"\\u03C3 too large \\u2192 mostly rejecting",tooSmall:"\\u03C3 too small \\u2192 slow exploration",' +
'pos:"Position"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var GRID=80;' + // resolution for heatmap
'var sigma=0.15;' +
'var speed=10;' +
'var showTrail=true;' +
'var showHist=false;' +
'var running=false;' +
'var animTimer=null;' +
'var curX=0.5,curY=0.5;' +
'var trail=[];' +
'var totalSamples=0,totalAccepted=0;' +
'var histGrid=null;' +
'var histMax=0;' +
'var flashTimer=0,flashType="";' +
'var presetIdx=0;' +
'var BURN_IN=100;' +

// ── Target distributions ──
// All work in [0,1]x[0,1] space
'function targetSingle(x,y){' +
'var dx=x-0.5,dy=y-0.5;' +
'return Math.exp(-(dx*dx+dy*dy)/(2*0.04))}' +

'function targetBimodal(x,y){' +
'var dx1=x-0.3,dy1=y-0.35;' +
'var dx2=x-0.7,dy2=y-0.65;' +
'return Math.exp(-(dx1*dx1+dy1*dy1)/(2*0.02))+Math.exp(-(dx2*dx2+dy2*dy2)/(2*0.02))}' +

'function targetRing(x,y){' +
'var dx=x-0.5,dy=y-0.5;' +
'var r=Math.sqrt(dx*dx+dy*dy);' +
'return Math.exp(-((r-0.3)*(r-0.3))/(2*0.003))}' +

'function targetBanana(x,y){' +
// Banana (rosenbrock-inspired)
'var sx=(x-0.2)*4,sy=(y-0.1)*4;' +
'var a=1,b=3;' +
'var v=(a-sx)*(a-sx)+b*(sy-sx*sx)*(sy-sx*sx);' +
'return Math.exp(-v*0.3)}' +

'var targets=[targetSingle,targetBimodal,targetRing,targetBanana];' +
'var targetFn=targets[0];' +

// ── Precompute heatmap ──
'var heatmap=[];' +
'var heatMax=0;' +
'function computeHeatmap(){' +
'heatmap=[];heatMax=0;' +
'for(var gy=0;gy<GRID;gy++){' +
'heatmap[gy]=[];' +
'for(var gx=0;gx<GRID;gx++){' +
'var x=(gx+0.5)/GRID;var y=(gy+0.5)/GRID;' +
'var v=targetFn(x,y);' +
'heatmap[gy][gx]=v;' +
'if(v>heatMax)heatMax=v}}}' +

// ── Init histogram grid ──
'function initHistGrid(){' +
'histGrid=[];histMax=0;' +
'for(var gy=0;gy<GRID;gy++){histGrid[gy]=[];for(var gx=0;gx<GRID;gx++)histGrid[gy][gx]=0}}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Color helpers ──
'function heatColor(v,isDk){' +
// v in [0,1] — from transparent to teal
'if(isDk){' +
'var r=Math.floor(26+v*68);' +
'var g=Math.floor(24+v*210);' +
'var b=Math.floor(22+v*190);' +
'return "rgb("+r+","+g+","+b+")"}' +
'else{' +
'var r=Math.floor(255-v*161);' +
'var g=Math.floor(255-v*21);' +
'var b=Math.floor(255-v*43);' +
'return "rgb("+r+","+g+","+b+")"}}' +

'function histColor(v,isDk){' +
'if(isDk){return "rgba(94,234,212,"+(v*0.6)+")"}' +
'else{return "rgba(13,115,119,"+(v*0.5)+")"}}' +

// ── Draw main canvas ──
'function drawMain(){' +
'var cv=document.getElementById("cvMain");' +
'var dim=setupCanvas(cv,300);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var isDk=document.documentElement.classList.contains("dark");' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +

// Canvas maps [0,1]x[0,1] to drawing area
'var pad=4;' +
'var sz=Math.min(w-pad*2,h-pad*2);' +
'var ox=Math.floor((w-sz)/2);' +
'var oy=Math.floor((h-sz)/2);' +
'function toX(v){return ox+v*sz}' +
'function toY(v){return oy+v*sz}' +

// Draw heatmap
'var cellW=sz/GRID;var cellH=sz/GRID;' +
'for(var gy=0;gy<GRID;gy++){' +
'for(var gx=0;gx<GRID;gx++){' +
'var v=heatMax>0?heatmap[gy][gx]/heatMax:0;' +
'ctx.fillStyle=heatColor(v,isDk);' +
'ctx.fillRect(ox+gx*cellW,oy+gy*cellH,Math.ceil(cellW),Math.ceil(cellH))}}' +

// Draw histogram overlay
'if(showHist&&histGrid){' +
'for(var gy=0;gy<GRID;gy++){' +
'for(var gx=0;gx<GRID;gx++){' +
'if(histGrid[gy][gx]>0){' +
'var v=histMax>0?histGrid[gy][gx]/histMax:0;' +
'if(v>0.01){' +
'ctx.fillStyle=histColor(v,isDk);' +
'ctx.fillRect(ox+gx*cellW,oy+gy*cellH,Math.ceil(cellW),Math.ceil(cellH))}}}}}' +

// Draw trail
'if(showTrail&&trail.length>1){' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;ctx.globalAlpha=0.5;' +
'ctx.beginPath();' +
'var startI=Math.max(0,trail.length-600);' +
'ctx.moveTo(toX(trail[startI][0]),toY(trail[startI][1]));' +
'for(var i=startI+1;i<trail.length;i++){' +
'ctx.lineTo(toX(trail[i][0]),toY(trail[i][1]))}' +
'ctx.stroke();ctx.globalAlpha=1}' +

// Flash effect for accept/reject
'if(flashTimer>0){' +
'ctx.beginPath();' +
'ctx.arc(toX(curX),toY(curY),14,0,Math.PI*2);' +
'ctx.fillStyle=flashType==="accept"?greenC:redC;' +
'ctx.globalAlpha=flashTimer/8;' +
'ctx.fill();ctx.globalAlpha=1;' +
'flashTimer--}' +

// Draw walker
'ctx.beginPath();' +
'ctx.arc(toX(curX),toY(curY),6,0,Math.PI*2);' +
'ctx.fillStyle=accentC;ctx.fill();' +
'ctx.strokeStyle=isDk?"#000":"#fff";ctx.lineWidth=2;ctx.stroke();' +

// Border
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.strokeRect(ox,oy,sz,sz);' +

// Axis labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText("0",ox,oy+sz+12);' +
'ctx.fillText("1",ox+sz,oy+sz+12);' +
'ctx.textAlign="right";' +
'ctx.fillText("0",ox-4,oy+sz);' +
'ctx.fillText("1",ox-4,oy+4);' +
'}' +

// ── Metropolis-Hastings step ──
'function mhStep(){' +
// Propose from N(current, sigma^2)
'var propX=curX+sigma*randn();' +
'var propY=curY+sigma*randn();' +
// Reflect at boundaries
'if(propX<0)propX=-propX;if(propX>1)propX=2-propX;' +
'if(propY<0)propY=-propY;if(propY>1)propY=2-propY;' +
'propX=Math.max(0,Math.min(1,propX));' +
'propY=Math.max(0,Math.min(1,propY));' +
// Accept/reject
'var pCur=targetFn(curX,curY);' +
'var pProp=targetFn(propX,propY);' +
'var alpha=pCur>0?Math.min(1,pProp/pCur):1;' +
'totalSamples++;' +
'if(Math.random()<alpha){' +
'curX=propX;curY=propY;totalAccepted++;' +
'flashType="accept";flashTimer=4}' +
'else{flashType="reject";flashTimer=4}' +
// Record sample in trail and histogram
'trail.push([curX,curY]);' +
'if(totalSamples>BURN_IN){' +
'var gx=Math.floor(curX*GRID);var gy=Math.floor(curY*GRID);' +
'gx=Math.min(GRID-1,Math.max(0,gx));' +
'gy=Math.min(GRID-1,Math.max(0,gy));' +
'histGrid[gy][gx]++;' +
'if(histGrid[gy][gx]>histMax)histMax=histGrid[gy][gx]}}' +

// ── Box-Muller normal random ──
'function randn(){' +
'var u1=Math.random(),u2=Math.random();' +
'return Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2)}' +

// ── Animation loop ──
'function animFrame(){' +
'if(!running)return;' +
'for(var i=0;i<speed;i++)mhStep();' +
'drawMain();updateStats();' +
'animTimer=requestAnimationFrame(animFrame)}' +

// ── Toggle run/pause ──
'function toggleRun(){' +
'running=!running;' +
'document.getElementById("btnRun").textContent=running?T.pause:T.run;' +
'document.getElementById("btnRun").className=running?"btn btn-stop":"btn btn-primary";' +
'if(running)animFrame()}' +

// ── Sigma slider ──
'function onSigmaSlider(){' +
'var v=+document.getElementById("slSigma").value;' +
'sigma=0.01+v/100*0.49;' +
'document.getElementById("valSigma").textContent=sigma.toFixed(2);notifyHeight()}' +

// ── Speed slider ──
'function onSpeedSlider(){' +
'speed=+document.getElementById("slSpeed").value;' +
'document.getElementById("valSpeed").textContent=speed+"x";notifyHeight()}' +

// ── Toggle checkboxes ──
'function onToggle(){' +
'showTrail=document.getElementById("chkTrail").checked;' +
'showHist=document.getElementById("chkHist").checked;' +
'drawMain();notifyHeight()}' +

// ── Preset buttons ──
'function onPreset(idx){' +
'presetIdx=idx;targetFn=targets[idx];' +
'for(var i=0;i<4;i++){' +
'document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
'computeHeatmap();onReset();notifyHeight()}' +

// ── Reset ──
'function onReset(){' +
'if(running)toggleRun();' +
'curX=0.5;curY=0.5;' +
'trail=[];totalSamples=0;totalAccepted=0;' +
'flashTimer=0;initHistGrid();' +
'drawMain();updateStats();notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var rate=totalSamples>0?(totalAccepted/totalSamples*100):0;' +
'var s="<span class=\\"hi\\">"+T.acceptRate+"</span> "+rate.toFixed(1)+"%<br>";' +
's+=T.samples+": <span class=\\"hi\\">"+totalSamples+"</span><br>";' +
's+=T.accepted+": "+totalAccepted+" | "+T.rejected+": "+(totalSamples-totalAccepted)+"<br>";' +
's+=T.pos+": <span class=\\"warn\\">("+curX.toFixed(2)+", "+curY.toFixed(2)+")</span><br>";' +
// Burn-in indicator
'if(totalSamples>0&&totalSamples<=BURN_IN){' +
's+="<span class=\\"warn\\">"+T.burnIn+" ("+totalSamples+"/"+BURN_IN+")</span><br>"}' +
'else if(totalSamples>BURN_IN){' +
's+="<span class=\\"hi\\">"+T.burnInDone+"</span><br>"}' +
// Insight about sigma
'if(totalSamples>50){' +
'if(rate<20){s+="<br><span class=\\"warn\\">"+T.tooLarge+"</span>"}' +
'else if(rate>90){s+="<br><span class=\\"warn\\">"+T.tooSmall+"</span>"}}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-main").textContent=T.main;' +
'document.getElementById("lbl-dist").textContent=T.dist;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-sigma").textContent=T.sigma;' +
'document.getElementById("lbl-speed").textContent=T.speed;' +
'document.getElementById("lbl-trail").textContent=T.trail;' +
'document.getElementById("lbl-hist").textContent=T.hist;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("pre0").textContent=T.pre0;' +
'document.getElementById("pre1").textContent=T.pre1;' +
'document.getElementById("pre2").textContent=T.pre2;' +
'document.getElementById("pre3").textContent=T.pre3;' +
'document.getElementById("valSigma").textContent="0.15";' +
'document.getElementById("valSpeed").textContent="10x";' +

// ── Init ──
'computeHeatmap();initHistGrid();drawMain();updateStats();' +
'window.addEventListener("resize",function(){drawMain();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
