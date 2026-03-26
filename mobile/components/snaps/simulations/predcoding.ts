/**
 * Predictive Coding — Prediction error-based brain information processing
 *
 * Features:
 * - Sequence timeline: past (gray), current (accent), prediction (teal dashed)
 * - 2-layer hierarchy: sensory input -> prediction error -> prediction model
 * - Prediction error time series graph
 * - Pattern presets: AABAA_ / 123123_ / Custom
 * - Surprise button, Learning Rate slider
 * - Auto Play / Step buttons
 * - Simple n-gram prediction model
 * - Dark/light theme, Korean/English bilingual
 */

export function getPredCodingSimulationHTML(isDark: boolean, lang: string): string {
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
'@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}' +
'.shake{animation:shake 0.3s ease-in-out}' +
'</style></head><body>' +

// ── Sequence Timeline Canvas ──
'<div class="panel"><div class="label" id="lbl-seq"></div>' +
'<canvas id="cvSeq" height="100"></canvas></div>' +

// ── Hierarchy Diagram Canvas ──
'<div class="panel"><div class="label" id="lbl-hier"></div>' +
'<canvas id="cvHier" height="150"></canvas></div>' +

// ── Error Time Series Canvas ──
'<div class="panel"><div class="label" id="lbl-err"></div>' +
'<canvas id="cvErr" height="120"></canvas></div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +

// Pattern presets
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)">AABAA</div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)">123123</div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)">ABCABC</div>' +
'</div>' +

// Learning Rate
'<div class="row"><span class="ctrl-name" id="lblLR"></span>' +
'<input type="range" id="slLR" min="5" max="50" value="20" oninput="onParam()">' +
'<span class="ctrl-val" id="valLR"></span></div>' +

// Buttons
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnStep" onclick="doStep()"></div>' +
'<div class="btn btn-primary" id="btnAuto" onclick="toggleAuto()"></div>' +
'<div class="btn btn-stop" id="btnSurprise" onclick="doSurprise()"></div>' +
'</div>' +
'<div class="btn-row" style="margin-top:6px">' +
'<div class="btn" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

// ── AI Connection ──
'<div class="panel" style="text-align:center;padding:10px">' +
'<span style="font-size:11px;font-weight:700;color:var(--teal)" id="aiLabel"></span></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{seq:"\\uC2DC\\uD000\\uC2A4 \\uD0C0\\uC784\\uB77C\\uC778",hier:"\\uACC4\\uCE35 \\uBAA8\\uB378",' +
'err:"\\uC608\\uCE21 \\uC624\\uCC28 \\uADF8\\uB798\\uD504",ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'lr:"\\uD559\\uC2B5\\uB960",step:"\\uD55C \\uB2E8\\uACC4",auto:"\\u25B6 \\uC790\\uB3D9",autoStop:"\\u25A0 \\uC815\\uC9C0",' +
'surprise:"\\uC11C\\uD504\\uB77C\\uC774\\uC988!",reset:"\\u21BA \\uB9AC\\uC14B",' +
'accuracy:"\\uC608\\uCE21 \\uC815\\uD655\\uB3C4",prediction:"\\uD604\\uC7AC \\uC608\\uCE21",' +
'actual:"\\uC2E4\\uC81C \\uAC12",surpriseLevel:"\\uB180\\uB77C\\uC6C0 \\uC218\\uC900",' +
'totalSteps:"\\uCD1D \\uB2E8\\uACC4",totalErrors:"\\uCD1D \\uC624\\uCC28",' +
'sensory:"\\uAC10\\uAC01 \\uC785\\uB825",predModel:"\\uC608\\uCE21 \\uBAA8\\uB378",' +
'predError:"\\uC608\\uCE21 \\uC624\\uCC28",correct:"\\uC815\\uD655",wrong:"\\uC624\\uB958",' +
'past:"\\uACFC\\uAC70",current:"\\uD604\\uC7AC",predicted:"\\uC608\\uCE21",' +
'aiConn:"\\uB2E4\\uC74C \\uD1A0\\uD070 \\uC608\\uCE21 = \\uC608\\uCE21 \\uCF54\\uB529"},' +
'en:{seq:"SEQUENCE TIMELINE",hier:"HIERARCHY MODEL",' +
'err:"PREDICTION ERROR GRAPH",ctrl:"PARAMETERS",stats:"STATISTICS",' +
'lr:"Learn Rate",step:"Step",auto:"\\u25B6 Auto",autoStop:"\\u25A0 Stop",' +
'surprise:"Surprise!",reset:"\\u21BA Reset",' +
'accuracy:"Prediction Accuracy",prediction:"Current Prediction",' +
'actual:"Actual",surpriseLevel:"Surprise Level",' +
'totalSteps:"Total Steps",totalErrors:"Total Errors",' +
'sensory:"Sensory Input",predModel:"Prediction Model",' +
'predError:"Prediction Error",correct:"Correct",wrong:"Wrong",' +
'past:"Past",current:"Current",predicted:"Predicted",' +
'aiConn:"Next-Token Prediction = Predictive Coding"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var PATTERNS=[' +
'["A","A","B","A","A"],' +
'["1","2","3","1","2","3"],' +
'["A","B","C","A","B","C"]];' +
'var SHAPE_COLORS={"A":"#5EEAD4","B":"#F59E0B","C":"#4ADE80","1":"#5EEAD4","2":"#F59E0B","3":"#F87171"};' +
'var patIdx=0;var pattern=PATTERNS[0];' +
'var lr=0.2;' +
'var history=[];var predictions=[];var errors=[];' +
'var stepCount=0;var correctCount=0;var totalErrors=0;' +
'var currentPred="";var lastActual="";var lastError=0;var lastCorrect=false;' +
'var autoTimer=null;var autoRunning=false;' +
// n-gram model: maps context -> {symbol: count}
'var model={};var ctxLen=2;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Predict next ──
'function predict(){' +
'if(history.length<ctxLen){currentPred=pattern[0];return}' +
'var ctx2=history.slice(-ctxLen).join(",");' +
'var counts=model[ctx2];' +
'if(!counts){currentPred=pattern[0];return}' +
'var best="";var bestC=0;' +
'for(var k in counts){if(counts[k]>bestC){bestC=counts[k];best=k}}' +
'currentPred=best}' +

// ── Update model ──
'function updateModel(symbol){' +
'if(history.length<ctxLen)return;' +
'var ctx2=history.slice(-ctxLen).join(",");' +
'if(!model[ctx2])model[ctx2]={};' +
'if(!model[ctx2][symbol])model[ctx2][symbol]=0;' +
'model[ctx2][symbol]+=lr*10}' +

// ── Step ──
'function doStep(){' +
'var idx=stepCount%pattern.length;' +
'var actual=pattern[idx];' +
'predict();' +
'var error=currentPred!==actual?1:0;' +
'lastCorrect=error===0;lastActual=actual;lastError=error;' +
'if(!error)correctCount++;' +
'totalErrors+=error;' +
'updateModel(actual);' +
'history.push(actual);' +
'predictions.push(currentPred);' +
'errors.push(error);' +
'stepCount++;' +
'predict();' + // update prediction for display
'drawAll();notifyHeight()}' +

// ── Surprise: inject unexpected symbol ──
'function doSurprise(){' +
'var symbols=Object.keys(SHAPE_COLORS);' +
'var pool=symbols.filter(function(s){return pattern.indexOf(s)<0});' +
'if(pool.length===0)pool=["X"];' +
'var actual=pool[Math.floor(Math.random()*pool.length)];' +
'predict();' +
'var error=currentPred!==actual?1:0;' +
'lastCorrect=error===0;lastActual=actual;lastError=error;' +
'if(!error)correctCount++;' +
'totalErrors+=error;' +
'history.push(actual);predictions.push(currentPred);errors.push(error);' +
'stepCount++;predict();' +
'drawAll();notifyHeight()}' +

// ── Auto play ──
'function toggleAuto(){' +
'if(autoRunning){clearInterval(autoTimer);autoRunning=false;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn btn-primary";return}' +
'autoRunning=true;' +
'document.getElementById("btnAuto").textContent=T.autoStop;' +
'document.getElementById("btnAuto").className="btn btn-stop";' +
'autoTimer=setInterval(function(){doStep()},500)}' +

// ── Draw sequence timeline ──
'function drawSeq(){' +
'var cv=document.getElementById("cvSeq");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +

'var cellW=40;var cellH=40;var gap=6;var showN=Math.min(Math.floor((w-80)/(cellW+gap)),8);' +
'var startIdx=Math.max(0,history.length-showN+1);' +
'var startX=(w-(showN+1)*(cellW+gap))/2;' + // +1 for prediction
'var y=(h-cellH)/2;' +

// past + current items
'for(var i=0;i<showN&&startIdx+i<history.length;i++){' +
'var idx=startIdx+i;var sym=history[idx];' +
'var x=startX+i*(cellW+gap);' +
'var isCurrent=idx===history.length-1;' +
// border
'ctx.strokeStyle=isCurrent?accentC:borderC;' +
'ctx.lineWidth=isCurrent?3:2;' +
'ctx.strokeRect(x,y,cellW,cellH);' +
// fill
'var fc=SHAPE_COLORS[sym]||text3C;' +
'ctx.fillStyle=fc;ctx.globalAlpha=isCurrent?0.3:0.1;' +
'ctx.fillRect(x,y,cellW,cellH);ctx.globalAlpha=1;' +
// symbol
'ctx.fillStyle=isCurrent?accentC:textC;' +
'ctx.font=(isCurrent?"bold ":"")+"18px monospace";ctx.textAlign="center";' +
'ctx.fillText(sym,x+cellW/2,y+cellH/2+6);' +
// check/x for prediction result
'if(idx>0&&predictions[idx]){' +
'var wasCorrect=predictions[idx]===history[idx];' +
'ctx.fillStyle=wasCorrect?greenC:redC;ctx.font="10px -apple-system,sans-serif";' +
'ctx.fillText(wasCorrect?"\\u2713":"\\u2717",x+cellW/2,y-4)}}' +

// prediction cell (dashed border)
'if(history.length>0){' +
'var predX=startX+Math.min(history.length-startIdx,showN)*(cellW+gap);' +
'if(predX+cellW<w){' +
'ctx.setLineDash([4,3]);ctx.strokeStyle=tealC;ctx.lineWidth=2;' +
'ctx.strokeRect(predX,y,cellW,cellH);ctx.setLineDash([]);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.1;ctx.fillRect(predX,y,cellW,cellH);ctx.globalAlpha=1;' +
'ctx.fillStyle=tealC;ctx.font="bold 18px monospace";ctx.textAlign="center";' +
'ctx.fillText(currentPred||"?",predX+cellW/2,y+cellH/2+6);' +
'ctx.font="9px -apple-system,sans-serif";' +
'ctx.fillText("?",predX+cellW/2,y-4)}}' +

// labels
'ctx.font="9px -apple-system,sans-serif";ctx.textAlign="left";ctx.fillStyle=text3C;' +
'ctx.fillText(T.past,4,h-4);' +
'ctx.textAlign="center";ctx.fillStyle=accentC;' +
'if(history.length>0)ctx.fillText(T.current,startX+(history.length-1-startIdx)*(cellW+gap)+cellW/2,h-4);' +
'ctx.textAlign="right";ctx.fillStyle=tealC;' +
'ctx.fillText(T.predicted,w-4,h-4)}' +

// ── Draw hierarchy ──
'function drawHier(){' +
'var cv=document.getElementById("cvHier");' +
'var dim=setupCanvas(cv,150);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +

// Two boxes: top=Prediction Model, bottom=Sensory Input
'var boxW=w*0.55;var boxH=40;' +
'var topX=(w-boxW)/2;var topY=16;' +
'var botX=(w-boxW)/2;var botY=h-56;' +

// top box (prediction model)
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.strokeRect(topX,topY,boxW,boxH);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.08;ctx.fillRect(topX,topY,boxW,boxH);ctx.globalAlpha=1;' +
'ctx.fillStyle=tealC;ctx.font="bold 11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.predModel,w/2,topY+boxH/2+4);' +

// bottom box (sensory input)
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.strokeRect(botX,botY,boxW,boxH);' +
'ctx.fillStyle=accentC;ctx.globalAlpha=0.08;ctx.fillRect(botX,botY,boxW,boxH);ctx.globalAlpha=1;' +
'ctx.fillStyle=accentC;ctx.font="bold 11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.sensory+(lastActual?" ["+lastActual+"]":""),w/2,botY+boxH/2+4);' +

// prediction error arrow (bottom -> top) — thickness based on error
'var errMag=lastError;' +
'var arrowX=w/2;' +
'var arrowBot=botY-4;var arrowTop=topY+boxH+4;' +
'var arrowW=2+errMag*6;' +
'var arrowCol=errMag>0.5?redC:greenC;' +

'ctx.strokeStyle=arrowCol;ctx.lineWidth=arrowW;' +
'ctx.beginPath();ctx.moveTo(arrowX,arrowBot);ctx.lineTo(arrowX,arrowTop+10);ctx.stroke();' +
// arrowhead
'ctx.fillStyle=arrowCol;ctx.beginPath();' +
'ctx.moveTo(arrowX-6,arrowTop+14);ctx.lineTo(arrowX,arrowTop+2);ctx.lineTo(arrowX+6,arrowTop+14);ctx.fill();' +

// error label
'ctx.fillStyle=arrowCol;ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.fillText(T.predError+": "+(errMag>0.5?"\\u2717":"\\u2713"),arrowX+12,(arrowBot+arrowTop)/2+4);' +

// prediction arrow going down (top -> bottom) on the left side
'var predArrowX=w/2-boxW/2+20;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);' +
'ctx.beginPath();ctx.moveTo(predArrowX,topY+boxH+4);ctx.lineTo(predArrowX,botY-4);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=tealC;ctx.beginPath();' +
'ctx.moveTo(predArrowX-5,botY-8);ctx.lineTo(predArrowX,botY-1);ctx.lineTo(predArrowX+5,botY-8);ctx.fill();' +
'ctx.font="9px -apple-system,sans-serif";ctx.textAlign="right";' +
'ctx.fillText(currentPred||"?",predArrowX-6,(arrowBot+arrowTop)/2+4)}' +

// ── Draw error graph ──
'function drawErr(){' +
'var cv=document.getElementById("cvErr");' +
'var dim=setupCanvas(cv,120);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=30;var pt=16;var pb=20;var pr=10;' +
'var gW=w-pad-pr;var gH=h-pt-pb;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +

// y labels
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("1.0",pad-4,pt+6);ctx.fillText("0",pad-4,h-pb+4);' +

'if(errors.length<2)return;' +

// running average error
'var runAvg=[];var sum=0;' +
'for(var i=0;i<errors.length;i++){sum+=errors[i];runAvg.push(sum/(i+1))}' +

// individual errors as dots
'var showN=Math.min(errors.length,60);var startI=errors.length-showN;' +
'for(var i=startI;i<errors.length;i++){' +
'var x=pad+(i-startI)/(showN-1)*gW;' +
'var y=pt+(1-errors[i])*gH;' +
'ctx.fillStyle=errors[i]>0.5?redC:tealC;' +
'ctx.globalAlpha=0.4;ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}' +

// running average line
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=startI;i<errors.length;i++){' +
'var x=pad+(i-startI)/(showN-1)*gW;' +
'var y=pt+(1-runAvg[i])*gH;' +
'if(i===startI)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// legend
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="right";' +
'var acc=stepCount>0?((correctCount/stepCount)*100).toFixed(0)+"%":"--";' +
'ctx.fillText(T.accuracy+": "+acc,w-pr,pt-2)}' +

// ── Draw all ──
'function drawAll(){drawSeq();drawHier();drawErr();updateStats()}' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var acc=stepCount>0?((correctCount/stepCount)*100).toFixed(1)+"%":"--";' +
'var s="<span class=\\"hi\\">"+T.accuracy+"</span> "+acc+"<br>";' +
's+=T.prediction+": <span class=\\"hi\\">"+(currentPred||"--")+"</span>";' +
'if(lastActual)s+=" | "+T.actual+": <span class=\\"warn\\">"+lastActual+"</span>";' +
's+="<br>";' +
's+=T.totalSteps+": "+stepCount+" | "+T.totalErrors+": <span class=\\"warn\\">"+totalErrors+"</span><br>";' +
'if(lastError>0.5)s+=T.surpriseLevel+": <span class=\\"warn\\">\\u26A0 HIGH</span>";' +
'else if(stepCount>0)s+=T.surpriseLevel+": <span class=\\"hi\\">\\u2713 LOW</span>";' +
'box.innerHTML=s}' +

// ── Preset ──
'function onPreset(idx){' +
'patIdx=idx;pattern=PATTERNS[idx];' +
'for(var i=0;i<3;i++)document.getElementById("pre"+i).className=(i===idx)?"preset active":"preset";' +
'doReset()}' +

// ── Param ──
'function onParam(){' +
'lr=+document.getElementById("slLR").value/100;' +
'document.getElementById("valLR").textContent=lr.toFixed(2)}' +

// ── Reset ──
'function doReset(){' +
'if(autoTimer)clearInterval(autoTimer);autoRunning=false;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnAuto").className="btn btn-primary";' +
'history=[];predictions=[];errors=[];model={};' +
'stepCount=0;correctCount=0;totalErrors=0;' +
'currentPred="";lastActual="";lastError=0;lastCorrect=false;' +
'drawAll();notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-seq").textContent=T.seq;' +
'document.getElementById("lbl-hier").textContent=T.hier;' +
'document.getElementById("lbl-err").textContent=T.err;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lblLR").textContent=T.lr;' +
'document.getElementById("btnStep").textContent=T.step;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnSurprise").textContent=T.surprise;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("aiLabel").textContent=T.aiConn;' +

// ── Init ──
'onParam();drawAll();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
