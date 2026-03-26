/**
 * Bootstrapping interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Upper canvas: original data points with tap-to-add/remove
 * - "Animate 1 Sample" with drop animation, "Run All" progressive histogram
 * - Lower canvas: bootstrap distribution histogram with 95% CI
 * - Data presets (Normal/Skewed/Bimodal/Outliers), statistic selector (Mean/Median/Std)
 * - Stats: original statistic, bootstrap mean, SE, 95% CI
 * - Dark/light theme, Korean/English bilingual
 */

export function getBootstrapSimulationHTML(isDark: boolean, lang: string): string {
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
'.stats .bad{color:var(--red);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'.seg-row{display:flex;gap:0;margin-bottom:8px}' +
'.seg{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer}' +
'.seg:first-child{border-right:none}' +
'.seg:last-child{border-left:none}' +
'.seg:active{opacity:0.7}' +
'.seg.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.cv-label{font-size:10px;font-weight:600;color:var(--text3);margin-top:6px;margin-bottom:2px}' +
'.ctrl-hint{font-size:10px;color:var(--text3);margin-top:-6px;margin-bottom:8px;padding-left:0}' +
'</style></head><body>' +

// -- Canvas panels --
'<div class="panel"><div class="label" id="lbl-sim"></div>' +
'<div class="cv-label" id="lbl-cv1"></div>' +
'<canvas id="cv1" height="100"></canvas>' +
'<div class="ctrl-hint" id="hint-tap" style="margin-top:6px"></div>' +
'<div class="cv-label" id="lbl-cv2" style="margin-top:8px"></div>' +
'<canvas id="cv2" height="150"></canvas></div>' +

// -- Controls --
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="preset-row" id="presetRow"></div>' +
'<div class="cv-label" id="lbl-stat-sel" style="margin-bottom:4px"></div>' +
'<div class="seg-row" id="segRow"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-nboot"></span>' +
'<input type="range" id="slNboot" min="100" max="5000" value="1000" step="100" oninput="onParam()">' +
'<span class="ctrl-val" id="valNboot"></span></div>' +
'</div>' +

// -- Buttons --
'<div class="panel"><div class="btn-row">' +
'<div class="btn btn-primary" id="btnOne" onclick="onAnimateOne()"></div>' +
'<div class="btn btn-primary" id="btnRunAll" onclick="onRunAll()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// -- Stats --
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// -- Labels --
'var L={' +
'ko:{sim:"\\uBD80\\uD2B8\\uC2A4\\uD2B8\\uB798\\uD551 \\uC2DC\\uBBAC\\uB808\\uC774\\uC158",' +
'ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'cv1:"\\uC6D0\\uBCF8 \\uB370\\uC774\\uD130",cv2:"\\uBD80\\uD2B8\\uC2A4\\uD2B8\\uB7A9 \\uBD84\\uD3EC",' +
'normal:"\\uC815\\uADDC",skewed:"\\uCE58\\uC6B0\\uCE68",bimodal:"\\uC774\\uBD09",outliers:"\\uC774\\uC0C1\\uCE58",' +
'statSel:"\\uD1B5\\uACC4\\uB7C9 \\uC120\\uD0DD",' +
'mean:"\\uD3C9\\uADE0",median:"\\uC911\\uC559\\uAC12",std:"\\uD45C\\uC900\\uD3B8\\uCC28",' +
'nboot:"\\uBD80\\uD2B8\\uC2A4\\uD2B8\\uB7A9 \\uC218",' +
'one:"\\u25B6 1\\uD68C \\uC560\\uB2C8\\uBA54\\uC774\\uC158",runAll:"\\u25B6\\u25B6 \\uC804\\uCCB4 \\uC2E4\\uD589",reset:"\\u21BA \\uB9AC\\uC14B",' +
'origStat:"\\uC6D0\\uBCF8 \\uD1B5\\uACC4\\uB7C9",bootMean:"\\uBD80\\uD2B8\\uC2A4\\uD2B8\\uB7A9 \\uD3C9\\uADE0",' +
'se:"\\uD45C\\uC900 \\uC624\\uCC28 (SE)",ci:"95% \\uC2E0\\uB8B0\\uAD6C\\uAC04",' +
'samples:"\\uC0D8\\uD50C \\uC218",dataPoints:"\\uB370\\uC774\\uD130 \\uD3EC\\uC778\\uD2B8",' +
'tapHint:"\\uCE94\\uBC84\\uC2A4\\uB97C \\uD130\\uCE58\\uD558\\uC5EC \\uB370\\uC774\\uD130 \\uD3EC\\uC778\\uD2B8 \\uCD94\\uAC00/\\uC81C\\uAC70"},' +
'en:{sim:"BOOTSTRAPPING SIMULATION",' +
'ctrl:"CONTROLS",stats:"STATISTICS",' +
'cv1:"Original Data",cv2:"Bootstrap Distribution",' +
'normal:"Normal",skewed:"Skewed",bimodal:"Bimodal",outliers:"Outliers",' +
'statSel:"STATISTIC",' +
'mean:"Mean",median:"Median",std:"Std Dev",' +
'nboot:"Bootstrap N",' +
'one:"\\u25B6 Animate 1",runAll:"\\u25B6\\u25B6 Run All",reset:"\\u21BA Reset",' +
'origStat:"Original Stat",bootMean:"Bootstrap Mean",' +
'se:"Standard Error",ci:"95% CI",' +
'samples:"Samples",dataPoints:"Data Points",' +
'tapHint:"Tap canvas to add/remove data points"}' +
'};' +
'var T=L[LANG]||L.en;' +

// -- State --
'var data=[];var bootStats=[];var nBoot=1000;' +
'var statType="mean";var dataPreset="normal";' +
'var running=false;var runTimer=null;var runIdx=0;' +

// -- Canvas DPR setup --
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// -- Data generators --
'function genNormal(n){var d=[];for(var i=0;i<n;i++){var u=0;for(var j=0;j<12;j++)u+=Math.random();d.push(u-6)}return d}' +
'function genSkewed(n){var d=[];for(var i=0;i<n;i++){d.push(Math.pow(Math.random(),2)*6)}return d}' +
'function genBimodal(n){var d=[];for(var i=0;i<n;i++){if(Math.random()<0.5){var u=0;for(var j=0;j<12;j++)u+=Math.random();d.push(u-6-2)}else{var u2=0;for(var j=0;j<12;j++)u2+=Math.random();d.push(u2-6+2)}}return d}' +
'function genOutliers(n){var d=genNormal(n);d[0]=8;d[1]=-7;if(n>5)d[5]=10;return d}' +

'function generateData(type){' +
'if(type==="normal")return genNormal(20);' +
'if(type==="skewed")return genSkewed(20);' +
'if(type==="bimodal")return genBimodal(20);' +
'if(type==="outliers")return genOutliers(20);' +
'return genNormal(20)}' +

// -- Statistic functions --
'function calcStat(arr,type){' +
'if(arr.length===0)return 0;' +
'if(type==="mean"){var s=0;for(var i=0;i<arr.length;i++)s+=arr[i];return s/arr.length}' +
'if(type==="median"){var sorted=arr.slice().sort(function(a,b){return a-b});var m=Math.floor(sorted.length/2);return sorted.length%2?sorted[m]:(sorted[m-1]+sorted[m])/2}' +
'if(type==="std"){var mu=calcStat(arr,"mean");var ss=0;for(var i=0;i<arr.length;i++)ss+=(arr[i]-mu)*(arr[i]-mu);return Math.sqrt(ss/arr.length)}' +
'return 0}' +

// -- Bootstrap resample --
'function resample(arr){' +
'var out=[];for(var i=0;i<arr.length;i++){out.push(arr[Math.floor(Math.random()*arr.length)])}return out}' +

// -- Get data range --
'function dataRange(){' +
'if(data.length===0)return{min:-5,max:5};' +
'var mn=data[0],mx=data[0];' +
'for(var i=1;i<data.length;i++){if(data[i]<mn)mn=data[i];if(data[i]>mx)mx=data[i]}' +
'var pad=(mx-mn)*0.15||1;return{min:mn-pad,max:mx+pad}}' +

// -- Draw data canvas --
'function drawData(){' +
'var cv=document.getElementById("cv1");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var padL=20;var padR=10;var padB=20;' +
'var plotW=w-padL-padR;' +
'var r=dataRange();' +
// x-axis
'var axisY=h-padB;' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(padL,axisY);ctx.lineTo(w-padR,axisY);ctx.stroke();' +
// ticks
'ctx.fillStyle=text3C;ctx.font="8px monospace";ctx.textAlign="center";' +
'var step2=Math.ceil((r.max-r.min)/5);if(step2<1)step2=1;' +
'for(var v=Math.ceil(r.min);v<=Math.floor(r.max);v+=step2){' +
'var x=padL+(v-r.min)/(r.max-r.min)*plotW;' +
'ctx.fillText(v.toFixed(1),x,h-4)}' +
// data points
'for(var i=0;i<data.length;i++){' +
'var x=padL+(data[i]-r.min)/(r.max-r.min)*plotW;' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.85;' +
'ctx.beginPath();ctx.arc(x,axisY-14,5,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}' +
// original stat marker
'if(data.length>0){' +
'var sv=calcStat(data,statType);' +
'var sx=padL+(sv-r.min)/(r.max-r.min)*plotW;' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;' +
'ctx.beginPath();ctx.moveTo(sx,8);ctx.lineTo(sx,axisY);ctx.stroke();' +
'ctx.fillStyle=accentC;ctx.font="9px monospace";ctx.textAlign="center";' +
'ctx.fillText(sv.toFixed(2),sx,8)}' +
// count label
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="left";' +
'ctx.fillText("n="+data.length,padL,14)}' +

// -- Draw histogram canvas --
'function drawHist(){' +
'var cv=document.getElementById("cv2");' +
'var dim=setupCanvas(cv,150);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var padL=30;var padR=10;var padT=16;var padB=24;' +
'var plotW=w-padL-padR;var plotH=h-padT-padB;' +
'if(bootStats.length===0){' +
'ctx.fillStyle=text3C;ctx.font="11px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(LANG==="ko"?"\\uBD80\\uD2B8\\uC2A4\\uD2B8\\uB7A9\\uC744 \\uC2E4\\uD589\\uD558\\uC138\\uC694":"Run bootstrap to see distribution",w/2,h/2);' +
'return}' +
// compute histogram bins
'var mn=bootStats[0],mx=bootStats[0];' +
'for(var i=1;i<bootStats.length;i++){if(bootStats[i]<mn)mn=bootStats[i];if(bootStats[i]>mx)mx=bootStats[i]}' +
'var range=mx-mn;if(range<0.001)range=1;' +
'var nBins=Math.min(40,Math.max(15,Math.floor(Math.sqrt(bootStats.length))));' +
'var binW=range/nBins;' +
'var bins=[];for(var i=0;i<nBins;i++)bins.push(0);' +
'for(var i=0;i<bootStats.length;i++){' +
'var bi=Math.floor((bootStats[i]-mn)/binW);if(bi>=nBins)bi=nBins-1;if(bi<0)bi=0;bins[bi]++}' +
'var maxBin=0;for(var i=0;i<nBins;i++)if(bins[i]>maxBin)maxBin=bins[i];' +
'if(maxBin===0)maxBin=1;' +
// draw bars
'var bw=plotW/nBins;' +
'for(var i=0;i<nBins;i++){' +
'var bh=bins[i]/maxBin*plotH;' +
'var bx=padL+i*bw;' +
'var by=padT+plotH-bh;' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.6;' +
'ctx.fillRect(bx,by,bw-1,bh);ctx.globalAlpha=1;' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;' +
'ctx.strokeRect(bx,by,bw-1,bh)}' +
// 95% CI lines
'var sorted=bootStats.slice().sort(function(a,b){return a-b});' +
'var lo=sorted[Math.floor(sorted.length*0.025)];' +
'var hi=sorted[Math.floor(sorted.length*0.975)];' +
'var loX=padL+(lo-mn)/range*plotW;' +
'var hiX=padL+(hi-mn)/range*plotW;' +
'ctx.strokeStyle=redC;ctx.lineWidth=2;ctx.setLineDash([4,3]);' +
'ctx.beginPath();ctx.moveTo(loX,padT);ctx.lineTo(loX,padT+plotH);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(hiX,padT);ctx.lineTo(hiX,padT+plotH);ctx.stroke();' +
'ctx.setLineDash([]);' +
// CI labels
'ctx.fillStyle=redC;ctx.font="8px monospace";ctx.textAlign="center";' +
'ctx.fillText(lo.toFixed(2),loX,padT+plotH+12);' +
'ctx.fillText(hi.toFixed(2),hiX,padT+plotH+12);' +
// original stat marker
'if(data.length>0){' +
'var sv=calcStat(data,statType);' +
'var svX=padL+(sv-mn)/range*plotW;' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.setLineDash([]);' +
'ctx.beginPath();ctx.moveTo(svX,padT);ctx.lineTo(svX,padT+plotH);ctx.stroke();' +
'ctx.fillStyle=accentC;ctx.font="8px monospace";ctx.textAlign="center";' +
'ctx.fillText(sv.toFixed(2),svX,padT-2)}' +
// sample count
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(T.samples+": "+bootStats.length,w-padR,12);' +
// x-axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(padL,padT+plotH);ctx.lineTo(padL+plotW,padT+plotH);ctx.stroke()}' +

// -- Draw all --
'function drawAll(){drawData();drawHist()}' +

// -- Read params --
'function readParams(){' +
'nBoot=+document.getElementById("slNboot").value;' +
'document.getElementById("valNboot").textContent=nBoot}' +

// -- Data presets --
'function setPreset(type){' +
'dataPreset=type;data=generateData(type);bootStats=[];' +
'var btns=document.querySelectorAll(".preset");' +
'for(var i=0;i<btns.length;i++){btns[i].className=btns[i].getAttribute("data-type")===type?"preset active":"preset"}' +
'drawAll();updateStats()}' +

// -- Build preset buttons --
'(function(){var row=document.getElementById("presetRow");' +
'var types=[{id:"normal",label:T.normal},{id:"skewed",label:T.skewed},{id:"bimodal",label:T.bimodal},{id:"outliers",label:T.outliers}];' +
'for(var i=0;i<types.length;i++){' +
'var b=document.createElement("div");' +
'b.className=types[i].id===dataPreset?"preset active":"preset";' +
'b.textContent=types[i].label;' +
'b.setAttribute("data-type",types[i].id);' +
'b.onclick=(function(tid){return function(){setPreset(tid)}})(types[i].id);' +
'row.appendChild(b)}})();' +

// -- Statistic segment buttons --
'function setStatType(type){' +
'statType=type;bootStats=[];' +
'var btns=document.querySelectorAll(".seg");' +
'for(var i=0;i<btns.length;i++){btns[i].className=btns[i].getAttribute("data-type")===type?"seg active":"seg"}' +
'drawAll();updateStats()}' +

'(function(){var row=document.getElementById("segRow");' +
'var types=[{id:"mean",label:T.mean},{id:"median",label:T.median},{id:"std",label:T.std}];' +
'for(var i=0;i<types.length;i++){' +
'var b=document.createElement("div");' +
'b.className=types[i].id===statType?"seg active":"seg";' +
'b.textContent=types[i].label;' +
'b.setAttribute("data-type",types[i].id);' +
'b.onclick=(function(tid){return function(){setStatType(tid)}})(types[i].id);' +
'row.appendChild(b)}})();' +

// -- Animate one sample --
'function onAnimateOne(){' +
'if(data.length<2)return;' +
'var rs=resample(data);' +
'var sv=calcStat(rs,statType);' +
'bootStats.push(sv);' +
// simple flash animation on data canvas
'var cv=document.getElementById("cv1");' +
'var dim={w:cv.clientWidth,h:cv.clientHeight};' +
'drawData();' +
'var ctx2=cv.getContext("2d");' +
'var cs=getComputedStyle(document.documentElement);' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var r=dataRange();var padL=20;var padR=10;var plotW=dim.w-padL-padR;var axisY=dim.h-20;' +
// highlight resampled points
'for(var i=0;i<rs.length;i++){' +
'var x=padL+(rs[i]-r.min)/(r.max-r.min)*plotW;' +
'ctx2.fillStyle=accentC;ctx2.globalAlpha=0.5;' +
'ctx2.beginPath();ctx2.arc(x,axisY-14,7,0,Math.PI*2);ctx2.fill();ctx2.globalAlpha=1}' +
'drawHist();updateStats()}' +

// -- Run all --
'function onRunAll(){' +
'if(data.length<2)return;' +
'if(running){running=false;if(runTimer)clearInterval(runTimer);return}' +
'readParams();bootStats=[];runIdx=0;running=true;' +
'var batchSize=Math.max(10,Math.floor(nBoot/50));' +
'runTimer=setInterval(function(){' +
'for(var i=0;i<batchSize&&runIdx<nBoot;i++,runIdx++){' +
'var rs=resample(data);bootStats.push(calcStat(rs,statType))}' +
'drawHist();updateStats();' +
'if(runIdx>=nBoot){running=false;clearInterval(runTimer)}},30)}' +

// -- Reset --
'function onParam(){readParams()}' +

'function onReset(){' +
'if(runTimer)clearInterval(runTimer);running=false;' +
'bootStats=[];data=generateData(dataPreset);' +
'document.getElementById("slNboot").value=1000;nBoot=1000;' +
'readParams();drawAll();updateStats();notifyHeight()}' +

// -- Canvas tap handler --
'(function(){var cv=document.getElementById("cv1");' +
'function handleTap(x,y){' +
'var r=dataRange();var padL=20;var padR=10;var w2=cv.clientWidth;var plotW=w2-padL-padR;var axisY=cv.clientHeight-20;' +
// check near existing point
'for(var i=0;i<data.length;i++){' +
'var px=padL+(data[i]-r.min)/(r.max-r.min)*plotW;' +
'if(Math.abs(x-px)<16&&Math.abs(y-(axisY-14))<16){data.splice(i,1);bootStats=[];drawAll();updateStats();return}}' +
// add new point (max 30)
'if(data.length>=30)return;' +
'var val=r.min+(x-padL)/plotW*(r.max-r.min);' +
'data.push(val);bootStats=[];drawAll();updateStats()}' +
'cv.addEventListener("click",function(e){' +
'var rect=cv.getBoundingClientRect();' +
'handleTap(e.clientX-rect.left,e.clientY-rect.top)});' +
'cv.addEventListener("touchend",function(e){' +
'e.preventDefault();var t=e.changedTouches[0];var rect=cv.getBoundingClientRect();' +
'handleTap(t.clientX-rect.left,t.clientY-rect.top)},{passive:false})})();' +

// -- Stats --
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(data.length<2){box.innerHTML=T.dataPoints+": "+data.length;return}' +
'var origStat=calcStat(data,statType);' +
'var s="<span class=\\"hi\\">"+T.origStat+"</span>  "+origStat.toFixed(4)+"<br>";' +
's+=T.dataPoints+": "+data.length+"<br><br>";' +
'if(bootStats.length>0){' +
'var bootM=calcStat(bootStats,"mean");' +
'var bootSE=calcStat(bootStats,"std");' +
'var sorted=bootStats.slice().sort(function(a,b){return a-b});' +
'var lo=sorted[Math.floor(sorted.length*0.025)];' +
'var hi=sorted[Math.floor(sorted.length*0.975)];' +
's+="<span class=\\"warn\\">"+T.bootMean+"</span>  "+bootM.toFixed(4)+"<br>";' +
's+="<span class=\\"warn\\">"+T.se+"</span>  "+bootSE.toFixed(4)+"<br>";' +
's+="<span class=\\"bad\\">"+T.ci+"</span>  ["+lo.toFixed(3)+", "+hi.toFixed(3)+"]<br>";' +
's+=T.samples+": "+bootStats.length}' +
'else{s+="<span style=\\"color:var(--text3)\\">"+(LANG==="ko"?"\\uBD80\\uD2B8\\uC2A4\\uD2B8\\uB7A9\\uC744 \\uC2E4\\uD589\\uD558\\uC138\\uC694":"Run bootstrap")+"</span>"}' +
'box.innerHTML=s}' +

// -- Height notification --
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// -- Init labels --
'document.getElementById("lbl-sim").textContent=T.sim;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-nboot").textContent=T.nboot;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-stat-sel").textContent=T.statSel;' +
'document.getElementById("btnOne").textContent=T.one;' +
'document.getElementById("btnRunAll").textContent=T.runAll;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lbl-cv1").textContent=T.cv1;' +
'document.getElementById("lbl-cv2").textContent=T.cv2;' +
'document.getElementById("hint-tap").textContent=T.tapHint;' +

// -- Init --
'data=generateData("normal");readParams();drawAll();updateStats();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
