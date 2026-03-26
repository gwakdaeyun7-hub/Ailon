/**
 * Natural Selection — Evolutionary Algorithm interactive simulation
 *
 * Features:
 * - 2D arena with 20 creatures (colored circles with gene-based traits)
 * - Green food dots scattered randomly, creatures seek nearest food
 * - Fitness = food eaten, top % survive via roulette wheel selection
 * - Single-point crossover + Gaussian mutation on [speed, size, senseRadius]
 * - Fitness histogram, mean/max fitness tracking across generations
 * - Mutation rate & selection pressure sliders, predator toggle
 * - Dark/light theme, Korean/English bilingual
 */

export function getEvolutionSimulationHTML(isDark: boolean, lang: string): string {
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

// ── Arena Canvas ──
'<div class="panel"><div class="label" id="lbl-arena"></div>' +
'<canvas id="cvArena" height="220"></canvas></div>' +

// ── Histogram Canvas ──
'<div class="panel"><div class="label" id="lbl-hist"></div>' +
'<canvas id="cvHist" height="140"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lblMut"></span>' +
'<input type="range" id="slMut" min="1" max="50" value="10" oninput="onParam()">' +
'<span class="ctrl-val" id="valMut"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lblSel"></span>' +
'<input type="range" id="slSel" min="30" max="70" value="50" oninput="onParam()">' +
'<span class="ctrl-val" id="valSel"></span></div>' +
'<div class="toggle-row">' +
'<input type="checkbox" class="toggle-check" id="chkPred" onchange="onParam()">' +
'<span class="toggle-label" id="lblPred"></span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="runGen()"></div>' +
'<div class="btn" id="btnSkip" onclick="skipGen()"></div>' +
'<div class="btn btn-stop" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{arena:"\\uC790\\uC5F0\\uC120\\uD0DD \\uC544\\uB808\\uB098",hist:"\\uC801\\uD569\\uB3C4 \\uBD84\\uD3EC",ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'mut:"\\uB3CC\\uC5F0\\uBCC0\\uC774\\uC728",sel:"\\uC120\\uD0DD \\uC555\\uB825",pred:"\\uD3EC\\uC2DD\\uC790 \\uCD94\\uAC00",' +
'run:"\\uC138\\uB300 \\uC2E4\\uD589",skip:"10\\uC138\\uB300 \\uAC74\\uB108\\uB6F0\\uAE30",reset:"\\u21BA \\uB9AC\\uC14B",' +
'gen:"\\uC138\\uB300",meanFit:"\\uD3C9\\uADE0 \\uC801\\uD569\\uB3C4",maxFit:"\\uCD5C\\uB300 \\uC801\\uD569\\uB3C4",' +
'avgSpd:"\\uD3C9\\uADE0 \\uC18D\\uB3C4",avgSz:"\\uD3C9\\uADE0 \\uD06C\\uAE30",avgSns:"\\uD3C9\\uADE0 \\uAC10\\uC9C0\\uBC94\\uC704",' +
'food:"\\uBA39\\uC774",creature:"\\uAC1C\\uCCB4",predator:"\\uD3EC\\uC2DD\\uC790",' +
'running:"\\uC2DC\\uBBAC\\uB808\\uC774\\uC158 \\uC911...",topPct:"\\uC0C1\\uC704"},' +
'en:{arena:"NATURAL SELECTION ARENA",hist:"FITNESS DISTRIBUTION",ctrl:"PARAMETERS",stats:"STATISTICS",' +
'mut:"Mutation",sel:"Selection",pred:"Add Predator",' +
'run:"Run Generation",skip:"Skip 10 Gen",reset:"\\u21BA Reset",' +
'gen:"Generation",meanFit:"Mean Fitness",maxFit:"Max Fitness",' +
'avgSpd:"Avg Speed",avgSz:"Avg Size",avgSns:"Avg Sense",' +
'food:"Food",creature:"Creature",predator:"Predator",' +
'running:"Simulating...",topPct:"Top"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var POP=20,FOOD_N=30,SIM_FRAMES=180;' +
'var mutRate=0.10,selPct=0.50,usePredator=false;' +
'var gen=0,creatures=[],foods=[],predator=null;' +
'var histMean=[],histMax=[],running=false;' +
'var arenaW=300,arenaH=220;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Creature factory ──
'function makeCreature(genes){' +
'var g=genes||[1+Math.random()*2, 3+Math.random()*4, 20+Math.random()*40];' +
'return{x:Math.random()*arenaW,y:Math.random()*arenaH,' +
'speed:g[0],size:g[1],sense:g[2],' +
'genes:g,fitness:0,alive:true,' +
'hue:Math.floor(Math.random()*360)}}' +

// ── Food factory ──
'function spawnFood(){' +
'foods=[];for(var i=0;i<FOOD_N;i++){' +
'foods.push({x:10+Math.random()*(arenaW-20),y:10+Math.random()*(arenaH-20),eaten:false})}}' +

// ── Init population ──
'function initPop(){' +
'creatures=[];for(var i=0;i<POP;i++)creatures.push(makeCreature(null));' +
'spawnFood();' +
'if(usePredator)predator={x:arenaW/2,y:arenaH/2,speed:1.8};' +
'else predator=null}' +

// ── Distance helper ──
'function dist(a,b){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy)}' +

// ── Simulate one frame ──
'function simFrame(){' +
'for(var i=0;i<creatures.length;i++){' +
'var c=creatures[i];if(!c.alive)continue;' +
// find nearest food
'var best=null,bestD=Infinity;' +
'for(var j=0;j<foods.length;j++){' +
'if(foods[j].eaten)continue;' +
'var d=dist(c,foods[j]);' +
'if(d<c.sense&&d<bestD){bestD=d;best=foods[j]}}' +
// move toward food
'if(best){' +
'var dx=best.x-c.x,dy=best.y-c.y;' +
'var len=Math.sqrt(dx*dx+dy*dy)||1;' +
'c.x+=dx/len*c.speed;c.y+=dy/len*c.speed;' +
// eat food
'if(dist(c,best)<c.size+3){best.eaten=true;c.fitness++}' +
'}else{' +
// wander
'c.x+=((Math.random()-0.5)*c.speed);' +
'c.y+=((Math.random()-0.5)*c.speed)}' +
// clamp
'c.x=Math.max(c.size,Math.min(arenaW-c.size,c.x));' +
'c.y=Math.max(c.size,Math.min(arenaH-c.size,c.y))}' +
// predator logic
'if(predator){' +
'var target=null,tD=Infinity;' +
'for(var i=0;i<creatures.length;i++){' +
'if(!creatures[i].alive)continue;' +
'var d=dist(predator,creatures[i]);' +
'if(d<tD){tD=d;target=creatures[i]}}' +
'if(target){' +
'var dx=target.x-predator.x,dy=target.y-predator.y;' +
'var len=Math.sqrt(dx*dx+dy*dy)||1;' +
'predator.x+=dx/len*predator.speed;' +
'predator.y+=dy/len*predator.speed;' +
'if(tD<8){target.alive=false;target.fitness=Math.max(0,target.fitness-2)}}}}' +

// ── Draw arena ──
'function drawArena(frame){' +
'var cv=document.getElementById("cvArena");' +
'var dim=setupCanvas(cv,220);arenaW=dim.w;arenaH=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,dim.w,dim.h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
// food
'for(var i=0;i<foods.length;i++){' +
'if(foods[i].eaten)continue;' +
'ctx.fillStyle=greenC;ctx.fillRect(foods[i].x-2,foods[i].y-2,4,4)}' +
// creatures
'for(var i=0;i<creatures.length;i++){' +
'var c=creatures[i];if(!c.alive){continue}' +
'ctx.beginPath();ctx.arc(c.x,c.y,c.size,0,Math.PI*2);' +
'ctx.fillStyle="hsl("+c.hue+",60%,55%)";ctx.fill();' +
// sense radius faint
'ctx.beginPath();ctx.arc(c.x,c.y,c.sense,0,Math.PI*2);' +
'ctx.strokeStyle="hsl("+c.hue+",40%,60%)";ctx.globalAlpha=0.15;ctx.stroke();ctx.globalAlpha=1}' +
// predator
'if(predator){' +
'ctx.fillStyle=redC;ctx.beginPath();' +
'ctx.moveTo(predator.x,predator.y-8);' +
'ctx.lineTo(predator.x-6,predator.y+6);' +
'ctx.lineTo(predator.x+6,predator.y+6);' +
'ctx.closePath();ctx.fill()}' +
// frame counter
'ctx.fillStyle=textC;ctx.font="10px monospace";ctx.textAlign="left";' +
'ctx.fillText(T.gen+" "+gen+"  |  "+Math.round(frame/SIM_FRAMES*100)+"%",6,14)}' +

// ── Selection + Breeding ──
'function nextGeneration(){' +
// sort by fitness descending
'creatures.sort(function(a,b){return b.fitness-a.fitness});' +
'var keep=Math.max(2,Math.floor(POP*selPct));' +
'var parents=creatures.slice(0,keep);' +
// roulette wheel
'var totalFit=0;for(var i=0;i<parents.length;i++)totalFit+=parents[i].fitness+1;' +
'function pick(){' +
'var r=Math.random()*totalFit;var s=0;' +
'for(var i=0;i<parents.length;i++){s+=parents[i].fitness+1;if(s>=r)return parents[i]}' +
'return parents[0]}' +
// breed new pop
'var newPop=[];' +
'for(var i=0;i<POP;i++){' +
'var p1=pick(),p2=pick();' +
// crossover
'var cut=Math.floor(Math.random()*3);' +
'var child=[];' +
'for(var g=0;g<3;g++){child.push(g<cut?p1.genes[g]:p2.genes[g])}' +
// mutation
'for(var g=0;g<3;g++){' +
'if(Math.random()<mutRate){' +
'child[g]+=((Math.random()-0.5)*2)*child[g]*0.3;' +
'child[g]=Math.max(0.3,child[g])}}' +
// clamp genes
'child[0]=Math.max(0.5,Math.min(5,child[0]));' +
'child[1]=Math.max(2,Math.min(8,child[1]));' +
'child[2]=Math.max(10,Math.min(80,child[2]));' +
'newPop.push(makeCreature(child))}' +
// record stats
'var sum=0,mx=0;' +
'for(var i=0;i<creatures.length;i++){sum+=creatures[i].fitness;mx=Math.max(mx,creatures[i].fitness)}' +
'histMean.push(sum/POP);histMax.push(mx);' +
// replace
'creatures=newPop;gen++;spawnFood();' +
'if(usePredator)predator={x:arenaW/2,y:arenaH/2,speed:1.8};' +
'else predator=null}' +

// ── Draw histogram ──
'function drawHist(){' +
'var cv=document.getElementById("cvHist");' +
'var dim=setupCanvas(cv,140);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var pad=30,pr=10,pt=14,pb=22;' +
'var pw=w-pad-pr,ph=h-pt-pb;' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
'if(histMean.length===0){' +
'ctx.fillStyle=textC;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.running.replace("...",""),w/2,h/2);return}' +
// draw mean and max lines
'var n=histMean.length;' +
'var maxVal=1;for(var i=0;i<n;i++){maxVal=Math.max(maxVal,histMax[i])}' +
'maxVal=Math.ceil(maxVal*1.1);' +
'function toX(i){return pad+(i/(Math.max(n-1,1)))*pw}' +
'function toY(v){return pt+(maxVal-v)/maxVal*ph}' +
// max line
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<n;i++){var px=toX(i),py=toY(histMax[i]);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
// mean line
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<n;i++){var px=toX(i),py=toY(histMean[i]);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
// fill under mean
'ctx.fillStyle=tealC;ctx.globalAlpha=0.1;ctx.beginPath();ctx.moveTo(toX(0),h-pb);' +
'for(var i=0;i<n;i++){ctx.lineTo(toX(i),toY(histMean[i]))}' +
'ctx.lineTo(toX(n-1),h-pb);ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +
// labels
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(maxVal.toFixed(0),pad-4,pt+4);ctx.fillText("0",pad-4,h-pb+4);' +
'ctx.textAlign="center";ctx.fillText("1",toX(0),h-pb+14);' +
'if(n>1)ctx.fillText(n+"",toX(n-1),h-pb+14);' +
// legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad+4,pt+2);ctx.lineTo(pad+18,pt+2);ctx.stroke();' +
'ctx.fillStyle=textC;ctx.fillText(T.meanFit,pad+22,pt+6);' +
'ctx.strokeStyle=accentC;ctx.beginPath();ctx.moveTo(pad+pw/2,pt+2);ctx.lineTo(pad+pw/2+14,pt+2);ctx.stroke();' +
'ctx.fillText(T.maxFit,pad+pw/2+18,pt+6)}' +

// ── Run one generation ──
'function runGen(){' +
'if(running)return;running=true;' +
'initPop();var frame=0;' +
'function step(){' +
'if(frame>=SIM_FRAMES){nextGeneration();drawHist();updateStats();drawArena(SIM_FRAMES);running=false;notifyHeight();return}' +
'simFrame();frame++;' +
'if(frame%3===0)drawArena(frame);' +
'requestAnimationFrame(step)}step()}' +

// ── Skip 10 generations ──
'function skipGen(){' +
'if(running)return;' +
'for(var g=0;g<10;g++){' +
'initPop();' +
'for(var f=0;f<SIM_FRAMES;f++)simFrame();' +
'nextGeneration()}' +
'drawArena(SIM_FRAMES);drawHist();updateStats();notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(histMean.length===0){box.innerHTML="";return}' +
'var lastMean=histMean[histMean.length-1];' +
'var lastMax=histMax[histMax.length-1];' +
'var spdSum=0,szSum=0,snsSum=0;' +
'for(var i=0;i<creatures.length;i++){spdSum+=creatures[i].speed;szSum+=creatures[i].size;snsSum+=creatures[i].sense}' +
'var s="<span class=\\"hi\\">"+T.gen+"</span> "+gen+"<br>";' +
's+="<span class=\\"hi\\">"+T.meanFit+"</span> "+lastMean.toFixed(2)+"<br>";' +
's+="<span class=\\"warn\\">"+T.maxFit+"</span> "+lastMax.toFixed(0)+"<br>";' +
's+=T.avgSpd+": "+(spdSum/POP).toFixed(2)+"<br>";' +
's+=T.avgSz+": "+(szSum/POP).toFixed(1)+"<br>";' +
's+=T.avgSns+": "+(snsSum/POP).toFixed(1)+"<br>";' +
'box.innerHTML=s}' +

// ── Param change ──
'function onParam(){' +
'mutRate=+document.getElementById("slMut").value/100;' +
'selPct=+document.getElementById("slSel").value/100;' +
'usePredator=document.getElementById("chkPred").checked;' +
'document.getElementById("valMut").textContent=(mutRate*100).toFixed(0)+"%";' +
'document.getElementById("valSel").textContent=T.topPct+" "+(selPct*100).toFixed(0)+"%";' +
'notifyHeight()}' +

// ── Reset ──
'function onReset(){' +
'gen=0;histMean=[];histMax=[];running=false;' +
'creatures=[];foods=[];predator=null;' +
'var cv1=document.getElementById("cvArena");' +
'var dim1=setupCanvas(cv1,220);' +
'cv1.getContext("2d").clearRect(0,0,dim1.w,dim1.h);' +
'drawHist();updateStats();notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-arena").textContent=T.arena;' +
'document.getElementById("lbl-hist").textContent=T.hist;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lblMut").textContent=T.mut;' +
'document.getElementById("lblSel").textContent=T.sel;' +
'document.getElementById("lblPred").textContent=T.pred;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnSkip").textContent=T.skip;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init sliders ──
'onParam();drawHist();' +
'window.addEventListener("resize",function(){drawArena(0);drawHist();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
