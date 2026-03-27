/**
 * Nyquist-Shannon Sampling Theorem interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 3 vertically stacked canvases: original wave, sample points, reconstructed signal
 * - Signal frequency + sampling rate sliders with Nyquist limit marker
 * - Signal type presets (Sine / Composite)
 * - Show Nyquist Limit toggle
 * - Play/Pause animation
 * - Stats: fs/f ratio, aliasing status, Nyquist frequency
 * - Dark/light theme, Korean/English bilingual
 */

export function getNyquistSimulationHTML(isDark: boolean, lang: string): string {
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
'.stats .bad{color:var(--red);font-weight:700}' +
'.stats .good{color:var(--green);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;border-radius:8px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'.opt-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;min-height:44px}' +
'.opt-check{width:20px;height:20px;accent-color:var(--teal)}' +
'.opt-label{font-size:11px;font-weight:600;color:var(--text2)}' +
'.cv-label{font-size:10px;font-weight:600;color:var(--text3);margin-top:6px;margin-bottom:2px}' +
'</style></head><body>' +

// -- Canvas panels --
'<div class="panel"><div class="label" id="lbl-sim"></div>' +
'<div class="cv-label" id="lbl-cv1"></div>' +
'<canvas id="cv1" height="100"></canvas>' +
'<div class="cv-label" id="lbl-cv2" style="margin-top:8px"></div>' +
'<canvas id="cv2" height="100"></canvas>' +
'<div class="cv-label" id="lbl-cv3" style="margin-top:8px"></div>' +
'<canvas id="cv3" height="100"></canvas></div>' +

// -- Controls --
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-freq"></span>' +
'<input type="range" id="slFreq" min="1" max="20" value="3" oninput="onParam()">' +
'<span class="ctrl-val" id="valFreq"></span></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-fs"></span>' +
'<input type="range" id="slFs" min="2" max="100" value="20" oninput="onParam()">' +
'<span class="ctrl-val" id="valFs"></span></div>' +
'<div class="preset-row" id="presetRow"></div>' +
'<div class="opt-row"><input type="checkbox" class="opt-check" id="chkNyq" checked onchange="onParam()">' +
'<span class="opt-label" id="lbl-nyq"></span></div>' +
'</div>' +

// -- Buttons --
'<div class="panel"><div class="btn-row">' +
'<div class="btn btn-primary" id="btnRun" onclick="onRun()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// -- Stats --
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// -- Labels --
'var L={' +
'ko:{sim:"\\uB098\\uC774\\uD034\\uC2A4\\uD2B8 \\uC0D8\\uD50C\\uB9C1 \\uC2DC\\uBBAC\\uB808\\uC774\\uC158",' +
'ctrl:"\\uCEE8\\uD2B8\\uB864",freq:"\\uC2E0\\uD638 \\uC8FC\\uD30C\\uC218",fs:"\\uC0D8\\uD50C\\uB9C1\\uB960",' +
'sine:"\\uC0AC\\uC778\\uD30C",composite:"\\uBCF5\\uD569\\uD30C",' +
'nyqToggle:"\\uB098\\uC774\\uD034\\uC2A4\\uD2B8 \\uD55C\\uACC4 \\uD45C\\uC2DC",' +
'run:"\\u25B6 \\uC2E4\\uD589",pause:"\\u23F8 \\uC77C\\uC2DC\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'stats:"\\uD1B5\\uACC4",' +
'cv1:"\\uC6D0\\uBCF8 \\uC5F0\\uC18D \\uC2E0\\uD638",cv2:"\\uC0D8\\uD50C \\uD3EC\\uC778\\uD2B8",cv3:"\\uBCF5\\uC6D0 \\uC2E0\\uD638",' +
'ratio:"fs/f \\uBE44\\uC728",nyqFreq:"\\uB098\\uC774\\uD034\\uC2A4\\uD2B8 \\uC8FC\\uD30C\\uC218",' +
'status:"\\uC0C1\\uD0DC",ok:"\\uC815\\uC0C1",aliasing:"\\uC5D0\\uC77C\\uB9AC\\uC5B4\\uC2F1",' +
'aliasWarn:"fs < 2f \\u2014 \\uBCF5\\uC6D0 \\uC2E0\\uD638\\uAC00 \\uC6D0\\uBCF8\\uACFC \\uB2E4\\uB985\\uB2C8\\uB2E4",' +
'okMsg:"fs \\u2265 2f \\u2014 \\uC815\\uD655\\uD55C \\uBCF5\\uC6D0 \\uAC00\\uB2A5"},' +
'en:{sim:"NYQUIST SAMPLING THEOREM",' +
'ctrl:"CONTROLS",freq:"Signal Freq",fs:"Sample Rate",' +
'sine:"Sine",composite:"Composite",' +
'nyqToggle:"Show Nyquist Limit",' +
'run:"\\u25B6 Run",pause:"\\u23F8 Pause",reset:"\\u21BA Reset",' +
'stats:"STATISTICS",' +
'cv1:"Original Continuous Signal",cv2:"Sample Points",cv3:"Reconstructed Signal",' +
'ratio:"fs/f Ratio",nyqFreq:"Nyquist Freq",' +
'status:"Status",ok:"OK",aliasing:"ALIASING",' +
'aliasWarn:"fs < 2f \\u2014 Reconstructed signal differs from original",' +
'okMsg:"fs \\u2265 2f \\u2014 Faithful reconstruction"}' +
'};' +
'var T=L[LANG]||L.en;' +

// -- State --
'var sigFreq=3;var sampleRate=20;var sigType="sine";' +
'var showNyq=true;var animating=false;var animId=null;var phase=0;' +

// -- Canvas DPR setup --
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// -- Signal function --
'function signal(t,f){' +
'if(sigType==="composite")return 0.6*Math.sin(2*Math.PI*f*t)+0.4*Math.sin(2*Math.PI*f*2.3*t);' +
'return Math.sin(2*Math.PI*f*t)}' +

// -- Apparent alias frequency --
'function aliasFreq(f,fs){' +
'var fa=f%fs;' +
'if(fa>fs/2)fa=fs-fa;' +
'return fa}' +

// -- Draw original signal (canvas 1) --
'function drawOriginal(){' +
'var cv=document.getElementById("cv1");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
// axis
'var midY=h/2;' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.setLineDash([3,3]);' +
'ctx.beginPath();ctx.moveTo(0,midY);ctx.lineTo(w,midY);ctx.stroke();ctx.setLineDash([]);' +
// wave
'var duration=2;' +
'ctx.beginPath();' +
'for(var px=0;px<w;px++){' +
'var t=px/w*duration+phase;' +
'var v=signal(t,sigFreq);' +
'var y=midY-v*(h*0.4);' +
'if(px===0)ctx.moveTo(px,y);else ctx.lineTo(px,y)}' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.stroke();' +
// Nyquist limit indicator
'if(showNyq){' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("f = "+sigFreq+" Hz",w-6,14);' +
'ctx.fillText("2f = "+(sigFreq*2)+" Hz",w-6,26)}}' +

// -- Draw sample points (canvas 2) --
'function drawSamples(){' +
'var cv=document.getElementById("cv2");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var midY=h/2;' +
// axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.setLineDash([3,3]);' +
'ctx.beginPath();ctx.moveTo(0,midY);ctx.lineTo(w,midY);ctx.stroke();ctx.setLineDash([]);' +
// sample points
'var duration=2;' +
'var dt=1/sampleRate;' +
'var isAlias=sampleRate<sigFreq*2;' +
'var dotColor=isAlias?redC:accentC;' +
'for(var t0=0;t0<duration;t0+=dt){' +
'var px=(t0/duration)*w;' +
'if(px>w)break;' +
'var t=t0+phase;' +
'var v=signal(t,sigFreq);' +
'var y=midY-v*(h*0.4);' +
// stem
'ctx.strokeStyle=dotColor;ctx.globalAlpha=0.4;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(px,midY);ctx.lineTo(px,y);ctx.stroke();ctx.globalAlpha=1;' +
// dot
'ctx.fillStyle=dotColor;ctx.beginPath();ctx.arc(px,y,4,0,Math.PI*2);ctx.fill()}' +
// Nyquist limit marker on rate label
'if(showNyq){' +
'var nyqRate=sigFreq*2;' +
'ctx.fillStyle=redC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText("fs = "+sampleRate+" Hz | 2f = "+nyqRate+" Hz",w-6,14)}}' +

// -- Draw reconstructed signal (canvas 3) --
'function drawReconstructed(){' +
'var cv=document.getElementById("cv3");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var midY=h/2;' +
'var isAlias=sampleRate<sigFreq*2;' +
// axis
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.setLineDash([3,3]);' +
'ctx.beginPath();ctx.moveTo(0,midY);ctx.lineTo(w,midY);ctx.stroke();ctx.setLineDash([]);' +
// collect samples
'var duration=2;var dt=1/sampleRate;' +
'var samples=[];' +
'for(var t0=0;t0<duration;t0+=dt){' +
'samples.push({t:t0,v:signal(t0+phase,sigFreq)})}' +
// reconstruct by sinc interpolation (simplified windowed)
'var lineColor=isAlias?redC:greenC;' +
// draw original faintly for comparison
'ctx.beginPath();' +
'for(var px=0;px<w;px++){' +
'var t=px/w*duration+phase;' +
'var v=signal(t,sigFreq);' +
'var y=midY-v*(h*0.4);' +
'if(px===0)ctx.moveTo(px,y);else ctx.lineTo(px,y)}' +
'ctx.strokeStyle=tealC;ctx.globalAlpha=0.2;ctx.lineWidth=1.5;ctx.stroke();ctx.globalAlpha=1;' +
// draw reconstructed
'ctx.beginPath();' +
'for(var px=0;px<w;px++){' +
'var t=px/w*duration;' +
'var v=0;' +
// sinc interpolation
'for(var k=0;k<samples.length;k++){' +
'var x=(t-samples[k].t)*sampleRate;' +
'var sinc=1;' +
'if(Math.abs(x)>0.001){sinc=Math.sin(Math.PI*x)/(Math.PI*x)}' +
'v+=samples[k].v*sinc}' +
'var y=midY-v*(h*0.4);' +
'if(px===0)ctx.moveTo(px,y);else ctx.lineTo(px,y)}' +
'ctx.strokeStyle=lineColor;ctx.lineWidth=2.5;ctx.stroke();' +
// status badge
'ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="left";' +
'if(isAlias){' +
'ctx.fillStyle=redC;ctx.fillText("\\u26A0 "+T.aliasing,6,14)}' +
'else{' +
'ctx.fillStyle=greenC;ctx.fillText("\\u2713 "+T.ok,6,14)}}' +

// -- Draw all --
'function drawAll(){drawOriginal();drawSamples();drawReconstructed()}' +

// -- Read params --
'function readParams(){' +
'sigFreq=+document.getElementById("slFreq").value;' +
'sampleRate=+document.getElementById("slFs").value;' +
'showNyq=document.getElementById("chkNyq").checked;' +
'document.getElementById("valFreq").textContent=sigFreq+" Hz";' +
'document.getElementById("valFs").textContent=sampleRate+" Hz"}' +

// -- Presets --
'function setPreset(type){' +
'sigType=type;' +
'var btns=document.querySelectorAll(".preset");' +
'for(var i=0;i<btns.length;i++){btns[i].className=btns[i].getAttribute("data-type")===type?"preset active":"preset"}' +
'drawAll();updateStats()}' +

// -- Build preset buttons --
'(function(){var row=document.getElementById("presetRow");' +
'var types=[{id:"sine",label:T.sine},{id:"composite",label:T.composite}];' +
'for(var i=0;i<types.length;i++){' +
'var b=document.createElement("div");' +
'b.className=types[i].id===sigType?"preset active":"preset";' +
'b.textContent=types[i].label;' +
'b.setAttribute("data-type",types[i].id);' +
'b.onclick=(function(tid){return function(){setPreset(tid)}})(types[i].id);' +
'row.appendChild(b)}})();' +

// -- Event handlers --
'function onParam(){readParams();drawAll();updateStats()}' +

'function onRun(){' +
'if(animating){animating=false;' +
'if(animId)cancelAnimationFrame(animId);' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";return}' +
'readParams();animating=true;' +
'document.getElementById("btnRun").textContent=T.pause;' +
'document.getElementById("btnRun").className="btn btn-stop";' +
'animate()}' +

'function onReset(){' +
'if(animId)cancelAnimationFrame(animId);' +
'animating=false;phase=0;sigFreq=3;sampleRate=20;sigType="sine";' +
'document.getElementById("slFreq").value=3;' +
'document.getElementById("slFs").value=20;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'setPreset("sine");readParams();drawAll();updateStats();notifyHeight()}' +

// -- Animation loop --
'function animate(){' +
'if(!animating)return;' +
'phase+=0.008;' +
'drawAll();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

// -- Stats --
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var ratio=(sampleRate/sigFreq).toFixed(2);' +
'var nyqF=sigFreq*2;' +
'var isAlias=sampleRate<nyqF;' +
'var s="<span class=\\"hi\\">"+T.ratio+"</span>  "+ratio+"<br>";' +
's+="<span class=\\"hi\\">"+T.nyqFreq+"</span>  "+nyqF+" Hz<br>";' +
'if(isAlias){' +
's+="<span class=\\"bad\\">"+T.status+": "+T.aliasing+"</span><br>";' +
's+="<span class=\\"bad\\">"+T.aliasWarn+"</span>"}' +
'else{' +
's+="<span class=\\"good\\">"+T.status+": "+T.ok+"</span><br>";' +
's+="<span class=\\"good\\">"+T.okMsg+"</span>"}' +
'box.innerHTML=s}' +

// -- Height notification --
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// -- Init labels --
'document.getElementById("lbl-sim").textContent=T.sim;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-freq").textContent=T.freq;' +
'document.getElementById("lbl-fs").textContent=T.fs;' +
'document.getElementById("lbl-nyq").textContent=T.nyqToggle;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lbl-cv1").textContent=T.cv1;' +
'document.getElementById("lbl-cv2").textContent=T.cv2;' +
'document.getElementById("lbl-cv3").textContent=T.cv3;' +

// -- Init --
'readParams();drawAll();updateStats();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
