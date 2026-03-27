/**
 * Selective Attention — Visual search & attention mechanism simulation
 *
 * Features:
 * - Main canvas: colored shapes scattered randomly, target items glow, non-targets fade
 * - Target Feature selector: Color (Red/Blue/Green) x Shape (Circle/Square/Triangle)
 * - Distractor Count slider: 5-50
 * - Attention Mode segment: Feature-based / Spatial (tap for spotlight)
 * - Search button: animated attention scan
 * - Attention weight bar chart per object
 * - Stats: target count, distractor count, search time, attention mode
 * - Dark/light theme, Korean/English bilingual
 */

export function getAttentionSimulationHTML(isDark: boolean, lang: string): string {
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
'.seg-row{display:flex;gap:0;margin-bottom:10px}' +
'.seg{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;border-radius:8px}' +
'.seg:first-child{border-right:none}' +
'.seg.active{border-color:var(--teal);background:var(--tealLight);color:var(--teal)}' +
'.chip-row{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}' +
'.chip{padding:6px 12px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;cursor:pointer;border-radius:8px}' +
'.chip.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'</style></head><body>' +

// ── Search Field Canvas ──
'<div class="panel"><div class="label" id="lbl-field"></div>' +
'<canvas id="cvField" height="280"></canvas></div>' +

// ── Attention Weights Canvas ──
'<div class="panel"><div class="label" id="lbl-weights"></div>' +
'<canvas id="cvWeights" height="100"></canvas></div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +

// Target Color
'<div class="row"><span class="ctrl-name" id="lblColor"></span>' +
'<div class="chip-row" id="colorChips"></div></div>' +

// Target Shape
'<div class="row"><span class="ctrl-name" id="lblShape"></span>' +
'<div class="chip-row" id="shapeChips"></div></div>' +

// Distractor Count
'<div class="row"><span class="ctrl-name" id="lblDist"></span>' +
'<input type="range" id="slDist" min="5" max="50" value="20" oninput="onParam()">' +
'<span class="ctrl-val" id="valDist"></span></div>' +

// Attention Mode
'<div class="label" id="lbl-mode" style="margin-top:4px"></div>' +
'<div class="seg-row">' +
'<div class="seg active" id="segFeature" onclick="setMode(0)"></div>' +
'<div class="seg" id="segSpatial" onclick="setMode(1)"></div>' +
'</div>' +

// Buttons
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnSearch" onclick="startSearch()"></div>' +
'<div class="btn btn-stop" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{field:"\\uC2DC\\uAC01 \\uD0D0\\uC0C9 \\uD544\\uB4DC",weights:"\\uC8FC\\uC758 \\uAC00\\uC911\\uCE58",' +
'ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",mode:"\\uC8FC\\uC758 \\uBAA8\\uB4DC",' +
'color:"\\uC0C9\\uC0C1",shape:"\\uBAA8\\uC591",dist:"\\uBC29\\uD574\\uBB3C",' +
'red:"\\uBE68\\uAC15",blue:"\\uD30C\\uB791",green:"\\uCD08\\uB85D",' +
'circle:"\\uC6D0",square:"\\uC0AC\\uAC01",triangle:"\\uC0BC\\uAC01",' +
'feature:"\\uD2B9\\uC9D5 \\uAE30\\uBC18",spatial:"\\uACF5\\uAC04 \\uAE30\\uBC18",' +
'search:"\\uD0D0\\uC0C9 \\uC2DC\\uC791",reset:"\\u21BA \\uB9AC\\uC14B",' +
'targets:"\\uD0C0\\uAE43",distractors:"\\uBC29\\uD574\\uBB3C",searchTime:"\\uD0D0\\uC0C9 \\uC2DC\\uAC04",' +
'modeLabel:"\\uBAA8\\uB4DC",found:"\\uBC1C\\uACAC",notFound:"\\uBBF8\\uBC1C\\uACAC",' +
'tapSpatial:"\\uCE94\\uBC84\\uC2A4\\uB97C \\uD0ED\\uD558\\uC5EC \\uC8FC\\uC758 \\uC911\\uC2EC \\uC124\\uC815",' +
'searching:"\\uD0D0\\uC0C9 \\uC911...",slope:"\\uD0D0\\uC0C9 \\uAE30\\uC6B8\\uAE30"},' +
'en:{field:"VISUAL SEARCH FIELD",weights:"ATTENTION WEIGHTS",' +
'ctrl:"PARAMETERS",stats:"STATISTICS",mode:"ATTENTION MODE",' +
'color:"Color",shape:"Shape",dist:"Distract",' +
'red:"Red",blue:"Blue",green:"Green",' +
'circle:"Circle",square:"Square",triangle:"Triangle",' +
'feature:"Feature-based",spatial:"Spatial",' +
'search:"Search",reset:"\\u21BA Reset",' +
'targets:"Targets",distractors:"Distractors",searchTime:"Search Time",' +
'modeLabel:"Mode",found:"Found",notFound:"Not found",' +
'tapSpatial:"Tap canvas to set attention center",' +
'searching:"Searching...",slope:"Search Slope"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var COLORS_SEL=["red","blue","green"];' +
'var SHAPES_SEL=["circle","square","triangle"];' +
'var COLOR_HEX={red:"#DC2626",blue:"#5EEAD4",green:"#15803D"};' +
'var selColor=0;var selShape=0;' +
'var distCount=20;var attnMode=0;' + // 0=feature, 1=spatial
'var items=[];var attnScores=[];' +
'var searchActive=false;var searchStep=0;var searchTimer=null;' +
'var searchTimeMs=0;var foundTarget=false;' +
'var spatialCenter=null;' + // {x,y} in canvas coords
'var ITEM_R=12;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Generate items ──
'function genItems(){' +
'items=[];attnScores=[];searchStep=0;foundTarget=false;searchTimeMs=0;' +
'var cv=document.getElementById("cvField");' +
'var w=cv.parentElement.clientWidth-4;var h=280;' +
'var pad=20;var n=distCount;' +
// always add 2-4 targets
'var targetCount=2+Math.floor(Math.random()*3);' +
'var total=n+targetCount;' +
'for(var i=0;i<total;i++){' +
'var isTarget=i<targetCount;' +
'var c,s;' +
'if(isTarget){c=selColor;s=selShape}' +
'else{' +
// distractor: random color/shape but not both matching target
'do{c=Math.floor(Math.random()*3);s=Math.floor(Math.random()*3)}' +
'while(c===selColor&&s===selShape)}' +
'var x=pad+Math.random()*(w-2*pad);' +
'var y=pad+Math.random()*(h-2*pad);' +
'items.push({x:x,y:y,color:c,shape:s,isTarget:isTarget});' +
'attnScores.push(0)}' +
// shuffle
'for(var i=items.length-1;i>0;i--){' +
'var j=Math.floor(Math.random()*(i+1));' +
'var tmp=items[i];items[i]=items[j];items[j]=tmp;' +
'var ts=attnScores[i];attnScores[i]=attnScores[j];attnScores[j]=ts}' +
'}' +

// ── Draw shape helper ──
'function drawShape(ctx,x,y,shape,color,r,alpha,glow){' +
'ctx.globalAlpha=alpha;' +
'ctx.fillStyle=COLOR_HEX[COLORS_SEL[color]];' +
'ctx.strokeStyle=glow?"var(--teal)":"rgba(0,0,0,0.2)";' +
'ctx.lineWidth=glow?3:1.5;' +
'ctx.beginPath();' +
'if(shape===0){ctx.arc(x,y,r,0,Math.PI*2)}' + // circle
'else if(shape===1){ctx.rect(x-r,y-r,r*2,r*2)}' + // square
'else{ctx.moveTo(x,y-r);ctx.lineTo(x+r,y+r*0.8);ctx.lineTo(x-r,y+r*0.8);ctx.closePath()}' + // triangle
'ctx.fill();ctx.stroke();' +
'ctx.globalAlpha=1}' +

// ── Draw field ──
'function drawField(){' +
'var cv=document.getElementById("cvField");' +
'var dim=setupCanvas(cv,280);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +

// spatial spotlight
'if(attnMode===1&&spatialCenter){' +
'var grad=ctx.createRadialGradient(spatialCenter.x,spatialCenter.y,0,spatialCenter.x,spatialCenter.y,100);' +
'grad.addColorStop(0,"rgba(94,234,212,0.15)");' +
'grad.addColorStop(1,"rgba(94,234,212,0)");' +
'ctx.fillStyle=grad;ctx.fillRect(0,0,w,h)}' +

// draw items
'for(var i=0;i<items.length;i++){' +
'var it=items[i];' +
'var alpha=1;var glow=false;' +
'if(searchStep>0){' +
'alpha=0.15+attnScores[i]*0.85;' +
'glow=attnScores[i]>0.8}' +
'drawShape(ctx,it.x,it.y,it.shape,it.color,ITEM_R,alpha,glow)}' +

// target indicator
'ctx.fillStyle=text3C;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'var tName=T[COLORS_SEL[selColor]]+" "+T[SHAPES_SEL[selShape]];' +
'ctx.fillText("\\u25C9 "+tName,6,14);' +
'if(searchActive){ctx.fillStyle=tealC;ctx.textAlign="right";ctx.fillText(T.searching,w-6,14)}' +
'}' +

// ── Draw attention weights ──
'function drawWeights(){' +
'var cv=document.getElementById("cvWeights");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'if(items.length===0)return;' +
'var n=items.length;var pad=8;var pt=16;var pb=14;' +
'var gW=w-pad*2;var gH=h-pt-pb;' +
'var barW=Math.min(gW/n-1,12);if(barW<2)barW=2;' +
'var totalW=n*(barW+1);' +
'var startX=pad+(gW-totalW)/2;' +
// axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,h-pb);ctx.lineTo(w-pad,h-pb);ctx.stroke();' +
// label
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="left";' +
'ctx.fillText("1.0",pad,pt-2);ctx.fillText("0",pad,h-pb+10);' +
// bars
'for(var i=0;i<n;i++){' +
'var s=attnScores[i];' +
'var bh=s*gH;' +
'var x=startX+i*(barW+1);' +
'ctx.fillStyle=items[i].isTarget?tealC:"rgba(120,113,108,0.4)";' +
'ctx.fillRect(x,h-pb-bh,barW,bh)}' +
// legend
'ctx.font="9px -apple-system,sans-serif";ctx.textAlign="right";ctx.fillStyle=text3C;' +
'var tCount=0;for(var i=0;i<items.length;i++)if(items[i].isTarget)tCount++;' +
'ctx.fillText(T.targets+": "+tCount+" / "+T.distractors+": "+(items.length-tCount),w-pad,pt-2)}' +

// ── Search animation ──
'function startSearch(){' +
'if(searchActive)return;' +
'genItems();drawField();drawWeights();' +
'searchActive=true;searchStep=0;' +
'var startTime=Date.now();' +
// step 1: color match (all matching color get attention boost)
// step 2: shape match (color+shape match get full attention)
// step 3: finalize (only targets remain highlighted)
'var baseDelay=80+distCount*4;' + // more distractors = slower search
'searchTimer=setTimeout(function step1(){' +
'searchStep=1;' +
'for(var i=0;i<items.length;i++){' +
'if(items[i].color===selColor)attnScores[i]=0.6;' +
'else attnScores[i]=0.1;' +
// spatial mode: distance-based boost
'if(attnMode===1&&spatialCenter){' +
'var dx=items[i].x-spatialCenter.x;var dy=items[i].y-spatialCenter.y;' +
'var d=Math.sqrt(dx*dx+dy*dy);' +
'var boost=Math.max(0,1-d/120)*0.4;' +
'attnScores[i]=Math.min(1,attnScores[i]+boost)}}' +
'drawField();drawWeights();' +
'searchTimer=setTimeout(function step2(){' +
'searchStep=2;' +
'for(var i=0;i<items.length;i++){' +
'if(items[i].color===selColor&&items[i].shape===selShape){attnScores[i]=1.0}' +
'else if(items[i].color===selColor){attnScores[i]=0.3}' +
'else{attnScores[i]=0.08}' +
'if(attnMode===1&&spatialCenter){' +
'var dx=items[i].x-spatialCenter.x;var dy=items[i].y-spatialCenter.y;' +
'var d=Math.sqrt(dx*dx+dy*dy);' +
'if(d>120)attnScores[i]*=0.3}}' +
'drawField();drawWeights();' +
'searchTimer=setTimeout(function step3(){' +
'searchStep=3;searchActive=false;' +
'searchTimeMs=Date.now()-startTime;' +
'foundTarget=false;' +
'for(var i=0;i<items.length;i++){' +
'attnScores[i]=items[i].isTarget?1.0:0.05;' +
'if(items[i].isTarget)foundTarget=true}' +
'drawField();drawWeights();updateStats();notifyHeight()' +
'},baseDelay)' +
'},baseDelay)' +
'},baseDelay)}' +

// ── Spatial tap ──
'document.getElementById("cvField").addEventListener("pointerdown",function(e){' +
'if(attnMode!==1||searchActive)return;' +
'var rect=e.target.getBoundingClientRect();' +
'spatialCenter={x:e.clientX-rect.left,y:e.clientY-rect.top};' +
'drawField();notifyHeight()});' +

// ── Mode selection ──
'function setMode(m){' +
'attnMode=m;spatialCenter=null;' +
'document.getElementById("segFeature").className=m===0?"seg active":"seg";' +
'document.getElementById("segSpatial").className=m===1?"seg active":"seg";' +
'drawField();updateStats();notifyHeight()}' +

// ── Chip builders ──
'function buildChips(){' +
'var cDiv=document.getElementById("colorChips");cDiv.innerHTML="";' +
'var colors=[T.red,T.blue,T.green];' +
'for(var i=0;i<3;i++){(function(idx){' +
'var ch=document.createElement("div");' +
'ch.className="chip"+(idx===selColor?" active":"");' +
'ch.textContent=colors[idx];' +
'ch.onclick=function(){selColor=idx;buildChips();genItems();drawField();drawWeights();updateStats();notifyHeight()};' +
'cDiv.appendChild(ch)})(i)}' +
'var sDiv=document.getElementById("shapeChips");sDiv.innerHTML="";' +
'var shapes=[T.circle,T.square,T.triangle];' +
'for(var i=0;i<3;i++){(function(idx){' +
'var ch=document.createElement("div");' +
'ch.className="chip"+(idx===selShape?" active":"");' +
'ch.textContent=shapes[idx];' +
'ch.onclick=function(){selShape=idx;buildChips();genItems();drawField();drawWeights();updateStats();notifyHeight()};' +
'sDiv.appendChild(ch)})(i)}}' +

// ── Param change ──
'function onParam(){' +
'distCount=+document.getElementById("slDist").value;' +
'document.getElementById("valDist").textContent=distCount;' +
'genItems();drawField();drawWeights();updateStats();notifyHeight()}' +

// ── Reset ──
'function doReset(){' +
'if(searchTimer)clearTimeout(searchTimer);' +
'searchActive=false;searchStep=0;spatialCenter=null;' +
'genItems();drawField();drawWeights();updateStats();notifyHeight()}' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var tCount=0;for(var i=0;i<items.length;i++)if(items[i].isTarget)tCount++;' +
'var s="<span class=\\"hi\\">"+T.targets+"</span> "+tCount;' +
's+=" | <span class=\\"hi\\">"+T.distractors+"</span> "+(items.length-tCount)+"<br>";' +
's+=T.modeLabel+": <span class=\\"warn\\">"+(attnMode===0?T.feature:T.spatial)+"</span><br>";' +
'if(searchTimeMs>0){' +
's+=T.searchTime+": <span class=\\"hi\\">"+searchTimeMs+"ms</span><br>";' +
's+=(foundTarget?"<span class=\\"hi\\">\\u2713 "+T.found+"</span>":"<span class=\\"warn\\">\\u2717 "+T.notFound+"</span>")+"<br>";' +
'var slope=(searchTimeMs/(distCount||1)).toFixed(1);' +
's+=T.slope+": ~"+slope+"ms/item"}' +
'else{s+=(attnMode===1?T.tapSpatial:"")}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-field").textContent=T.field;' +
'document.getElementById("lbl-weights").textContent=T.weights;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-mode").textContent=T.mode;' +
'document.getElementById("lblColor").textContent=T.color;' +
'document.getElementById("lblShape").textContent=T.shape;' +
'document.getElementById("lblDist").textContent=T.dist;' +
'document.getElementById("segFeature").textContent=T.feature;' +
'document.getElementById("segSpatial").textContent=T.spatial;' +
'document.getElementById("btnSearch").textContent=T.search;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'buildChips();onParam();' +
'window.addEventListener("resize",function(){drawField();drawWeights();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
