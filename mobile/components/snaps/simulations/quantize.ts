/**
 * Signal Quantization interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Upper canvas: original smooth signal overlaid with quantized staircase + level gridlines
 * - Lower canvas: quantization error (original - quantized) time series
 * - Bit depth slider (1-8 bits), signal type presets, dithering toggle
 * - "Model Quantization Mode" toggle: relabels as weight quantization / precision loss
 * - Stats: SNR(dB), level count, theoretical SNR
 * - Dark/light theme, Korean/English bilingual
 */

export function getQuantizeSimulationHTML(isDark: boolean, lang: string): string {
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
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card);border-radius:8px;touch-action:none}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:72px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:14px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;min-height:44px;border-radius:8px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.opt-row{display:flex;align-items:center;gap:8px;margin-bottom:6px;min-height:44px}' +
'.opt-check{width:20px;height:20px;accent-color:var(--teal)}' +
'.opt-label{font-size:11px;font-weight:600;color:var(--text2)}' +
'.cv-label{font-size:10px;font-weight:600;color:var(--text3);margin-top:6px;margin-bottom:2px}' +
'</style></head><body>' +

// -- Canvas panels --
'<div class="panel"><div class="label" id="lbl-sim"></div>' +
'<div class="cv-label" id="lbl-cv1"></div>' +
'<canvas id="cv1" height="160"></canvas>' +
'<div class="cv-label" id="lbl-cv2" style="margin-top:8px"></div>' +
'<canvas id="cv2" height="100"></canvas></div>' +

// -- Controls --
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-bits"></span>' +
'<input type="range" id="slBits" min="1" max="8" value="3" oninput="onParam()">' +
'<span class="ctrl-val" id="valBits"></span></div>' +
'<div class="preset-row" id="presetRow"></div>' +
'<div class="opt-row"><label style="display:flex;align-items:center;gap:8px;cursor:pointer"><input type="checkbox" class="opt-check" id="chkDither" onchange="onParam()">' +
'<span class="opt-label" id="lbl-dither"></span></label></div>' +
'<div class="btn-row">' +
'<div class="btn" id="btnAI" onclick="toggleAI()"></div>' +
'</div>' +
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
'ko:{sim:"\\uC2E0\\uD638 \\uC591\\uC790\\uD654 \\uC2DC\\uBBAC\\uB808\\uC774\\uC158",' +
'ctrl:"\\uCEE8\\uD2B8\\uB864",bits:"\\uBE44\\uD2B8 \\uC218",' +
'sine:"\\uC0AC\\uC778\\uD30C",sawtooth:"\\uD1B1\\uB2C8\\uD30C",composite:"\\uBCF5\\uD569\\uD30C",' +
'dither:"\\uB514\\uB354\\uB9C1 (\\uC591\\uC790\\uD654 \\uC804 \\uB178\\uC774\\uC988 \\uCD94\\uAC00)",' +
'run:"\\u25B6 \\uC2E4\\uD589",pause:"\\u23F8 \\uC77C\\uC2DC\\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'stats:"\\uD1B5\\uACC4",' +
'cv1:"\\uC6D0\\uBCF8 + \\uC591\\uC790\\uD654 \\uC2E0\\uD638",cv2:"\\uC591\\uC790\\uD654 \\uC624\\uCC28",' +
'snr:"SNR (\\uCE21\\uC815)",snrTheory:"SNR (\\uC774\\uB860)",levels:"\\uB808\\uBCA8 \\uC218",' +
'bitDepth:"\\uBE44\\uD2B8 \\uC218",maxErr:"\\uCD5C\\uB300 \\uC624\\uCC28",' +
'formula:"\\uC774\\uB860: 6.02N + 1.76 dB",' +
'aiOn:"\\uBAA8\\uB378 \\uC591\\uC790\\uD654 \\uBAA8\\uB4DC ON",aiOff:"\\uBAA8\\uB378 \\uC591\\uC790\\uD654 \\uBAA8\\uB4DC OFF",' +
'aiBits:"\\uC591\\uC790\\uD654 \\uC218\\uC900",aiCv1:"\\uC6D0\\uBCF8 + \\uC591\\uC790\\uD654\\uB41C \\uAC00\\uC911\\uCE58",aiCv2:"\\uC815\\uBC00\\uB3C4 \\uC190\\uC2E4",' +
'aiSnr:"\\uC815\\uD655\\uB3C4 \\uC720\\uC9C0\\uC728 (\\uCE21\\uC815)",aiSnrTheory:"\\uC815\\uD655\\uB3C4 \\uC720\\uC9C0\\uC728 (\\uC774\\uB860)",' +
'aiMaxErr:"\\uCD5C\\uB300 \\uC815\\uBC00\\uB3C4 \\uC190\\uC2E4",' +
'aiNote:"AI \\uAD00\\uC810: \\uBE44\\uD2B8 \\uC218 \\uC904\\uC774\\uBA74 \\uBAA8\\uB378 \\uD06C\\uAE30 \\uCD95\\uC18C + \\uCD94\\uB860 \\uC18D\\uB3C4 \\uD5A5\\uC0C1, \\uD558\\uC9C0\\uB9CC \\uC815\\uBC00\\uB3C4 \\uC190\\uC2E4. LLM \\uBC30\\uD3EC\\uC758 \\uD575\\uC2EC \\uAE30\\uC220"},' +
'en:{sim:"SIGNAL QUANTIZATION",' +
'ctrl:"CONTROLS",bits:"Bit Depth",' +
'sine:"Sine",sawtooth:"Sawtooth",composite:"Composite",' +
'dither:"Dithering (add noise before quantize)",' +
'run:"\\u25B6 Run",pause:"\\u23F8 Pause",reset:"\\u21BA Reset",' +
'stats:"STATISTICS",' +
'cv1:"Original + Quantized Signal",cv2:"Quantization Error",' +
'snr:"SNR (measured)",snrTheory:"SNR (theoretical)",levels:"Levels",' +
'bitDepth:"Bit Depth",maxErr:"Max Error",' +
'formula:"Theory: 6.02N + 1.76 dB",' +
'aiOn:"MODEL QUANTIZATION ON",aiOff:"MODEL QUANTIZATION OFF",' +
'aiBits:"Quantization Level",aiCv1:"Original + Quantized Weights",aiCv2:"Precision Loss",' +
'aiSnr:"Accuracy Retention (measured)",aiSnrTheory:"Accuracy Retention (theoretical)",' +
'aiMaxErr:"Max Precision Loss",' +
'aiNote:"AI perspective: Fewer bits = smaller model + faster inference, but precision loss. Key technique for LLM deployment"}' +
'};' +
'var T=L[LANG]||L.en;' +

// -- State --
'var bitDepth=3;var sigType="sine";var dithering=false;' +
'var animating=false;var animId=null;var phase=0;' +
'var aiMode=false;' +

// -- Canvas DPR setup --
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// -- Signal functions --
'function signal(t){' +
'if(sigType==="sawtooth"){var p=t%1;return p*2-1}' +
'if(sigType==="composite")return 0.6*Math.sin(2*Math.PI*t)+0.3*Math.sin(2*Math.PI*3*t)+0.1*Math.sin(2*Math.PI*5*t);' +
'return Math.sin(2*Math.PI*t)}' +

// -- Quantize --
'function quantize(v,bits,useDither){' +
'var levels=Math.pow(2,bits);' +
'var step=2.0/levels;' +
'var val=v;' +
'if(useDither){val+=((Math.random()-0.5)*step)}' +
'val=Math.max(-1,Math.min(1,val));' +
'var idx=Math.floor((val+1)/step);' +
'if(idx>=levels)idx=levels-1;' +
'return -1+idx*step+step/2}' +

// -- Draw main canvas (original + quantized) --
'function drawMain(qvArr){' +
'var cv=document.getElementById("cv1");' +
'var dim=setupCanvas(cv,160);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var pad=16;var plotH=h-pad*2;var midY=h/2;' +
// quantization level gridlines
'var levels=Math.pow(2,bitDepth);' +
'var step=2.0/levels;' +
'ctx.setLineDash([2,4]);ctx.lineWidth=1;' +
'for(var i=0;i<=levels;i++){' +
'var v=-1+i*step;' +
'var y=midY-v*(plotH/2);' +
'ctx.strokeStyle=borderC;' +
'ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}' +
'ctx.setLineDash([]);' +
// original wave (teal)
'var duration=3;' +
'ctx.beginPath();' +
'for(var px=0;px<w;px++){' +
'var t=px/w*duration+phase;' +
'var v=signal(t);' +
'var y=midY-v*(plotH/2);' +
'if(px===0)ctx.moveTo(px,y);else ctx.lineTo(px,y)}' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.stroke();' +
// quantized staircase (accent, using precomputed values)
'ctx.beginPath();' +
'var prevQy=null;' +
'for(var px=0;px<w;px++){' +
'var qv=px<qvArr.length?qvArr[px]:0;' +
'var y=midY-qv*(plotH/2);' +
'if(px===0){ctx.moveTo(px,y);prevQy=y}' +
'else{' +
// staircase: horizontal then vertical
'if(Math.abs(y-prevQy)>0.5){ctx.lineTo(px,prevQy);ctx.lineTo(px,y)}' +
'else{ctx.lineTo(px,y)}' +
'prevQy=y}}' +
'ctx.strokeStyle=accentC;ctx.lineWidth=2;ctx.stroke();' +
// legend
'ctx.font="9px monospace";ctx.textAlign="right";' +
'var origLbl=aiMode?(LANG==="ko"?"\\uAC00\\uC911\\uCE58 \\uAC12":"Weight Values"):(LANG==="ko"?"\\uC6D0\\uBCF8":"Original");' +
'var quantLbl=aiMode?(LANG==="ko"?"\\uC591\\uC790\\uD654\\uB41C \\uAC00\\uC911\\uCE58":"Quantized Weights"):(LANG==="ko"?"\\uC591\\uC790\\uD654":"Quantized");' +
'ctx.fillStyle=tealC;ctx.fillText(origLbl,w-6,14);' +
'ctx.fillStyle=accentC;ctx.fillText(quantLbl,w-6,26);' +
// bit depth label
'var bitLbl=aiMode?bitDepth+"bit \\u2192 "+(LANG==="ko"?"\\uC591\\uC790\\uD654 \\uB808\\uBCA8":"levels")+" "+levels:bitDepth+" bit \\u2192 "+levels+" levels";' +
'ctx.fillStyle=text3C;ctx.textAlign="left";' +
'ctx.fillText(bitLbl,6,14)}' +

// -- Draw error canvas (using precomputed quantized values) --
'function drawError(qvArr){' +
'var cv=document.getElementById("cv2");' +
'var dim=setupCanvas(cv,100);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var midY=h/2;' +
// zero line
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.setLineDash([3,3]);' +
'ctx.beginPath();ctx.moveTo(0,midY);ctx.lineTo(w,midY);ctx.stroke();ctx.setLineDash([]);' +
// error signal (reuse precomputed qvArr)
'var duration=3;var maxE=0;var sumSq=0;var sumSigSq=0;var n=0;' +
'ctx.beginPath();' +
'for(var px=0;px<w;px++){' +
'var t=px/w*duration+phase;' +
'var v=signal(t);' +
'var qv=px<qvArr.length?qvArr[px]:0;' +
'var err=v-qv;' +
'if(Math.abs(err)>maxE)maxE=Math.abs(err);' +
'sumSq+=err*err;sumSigSq+=v*v;n++;' +
'var y=midY-err*(h*0.8);' +
'if(px===0)ctx.moveTo(px,y);else ctx.lineTo(px,y)}' +
'ctx.strokeStyle=redC;ctx.lineWidth=1.5;ctx.stroke();' +
// store computed stats
'window._qStats={maxErr:maxE,sumSq:sumSq,sumSigSq:sumSigSq,n:n}}' +

// -- Draw all (precompute quantized values to share between canvases) --
'function drawAll(){' +
'var cv1=document.getElementById("cv1");' +
'var w1=cv1.parentElement.clientWidth-4;' +
'var duration=3;' +
'var qvArr=new Array(w1);' +
'for(var px=0;px<w1;px++){' +
'var t=px/w1*duration+phase;' +
'var v=signal(t);' +
'qvArr[px]=quantize(v,bitDepth,dithering)}' +
'drawMain(qvArr);drawError(qvArr)}' +

// -- Read params --
'function readParams(){' +
'bitDepth=+document.getElementById("slBits").value;' +
'dithering=document.getElementById("chkDither").checked;' +
'document.getElementById("valBits").textContent=bitDepth+" bit"}' +

// -- Presets --
'function setPreset(type){' +
'sigType=type;' +
'var btns=document.querySelectorAll(".preset");' +
'for(var i=0;i<btns.length;i++){btns[i].className=btns[i].getAttribute("data-type")===type?"preset active":"preset"}' +
'drawAll();updateStats()}' +

// -- Build preset buttons --
'(function(){var row=document.getElementById("presetRow");' +
'var types=[{id:"sine",label:T.sine},{id:"sawtooth",label:T.sawtooth},{id:"composite",label:T.composite}];' +
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
'animating=false;phase=0;bitDepth=3;sigType="sine";dithering=false;aiMode=false;' +
'document.getElementById("slBits").value=3;' +
'document.getElementById("chkDither").checked=false;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnRun").className="btn btn-primary";' +
'document.getElementById("btnAI").textContent=T.aiOff;' +
'document.getElementById("lbl-bits").textContent=T.bits;' +
'document.getElementById("lbl-cv1").textContent=T.cv1;' +
'document.getElementById("lbl-cv2").textContent=T.cv2;' +
'setPreset("sine");readParams();drawAll();updateStats();notifyHeight()}' +

// -- AI Mode toggle --
'function toggleAI(){' +
'aiMode=!aiMode;' +
'document.getElementById("btnAI").textContent=aiMode?T.aiOn:T.aiOff;' +
'document.getElementById("lbl-bits").textContent=aiMode?T.aiBits:T.bits;' +
'document.getElementById("lbl-cv1").textContent=aiMode?T.aiCv1:T.cv1;' +
'document.getElementById("lbl-cv2").textContent=aiMode?T.aiCv2:T.cv2;' +
'drawAll();updateStats();notifyHeight()}' +

// -- Animation --
'function animate(){' +
'if(!animating)return;' +
'phase+=0.005;' +
'drawAll();updateStats();' +
'animId=requestAnimationFrame(animate)}' +

// -- Stats --
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var levels=Math.pow(2,bitDepth);' +
'var theorySnr=6.02*bitDepth+1.76;' +
'var st=window._qStats||{maxErr:0,sumSq:0,sumSigSq:0,n:1};' +
'var measuredSnr=-999;' +
'if(st.sumSq>0&&st.sumSigSq>0){measuredSnr=10*Math.log10(st.sumSigSq/st.sumSq)}' +
'var bitLabel=aiMode?["INT8","INT7","INT6","INT5","INT4","INT3","INT2","Binary"][8-bitDepth]||bitDepth+"bit":bitDepth+"";' +
'var s="<span class=\\"hi\\">"+T.bitDepth+"</span>  "+bitLabel+(aiMode?" ("+bitDepth+"bit)":"")+"<br>";' +
's+="<span class=\\"hi\\">"+T.levels+"</span>  "+levels+"<br>";' +
's+="<span class=\\"warn\\">"+(aiMode?T.aiSnr:T.snr)+"</span>  "+(measuredSnr>-100?measuredSnr.toFixed(1):"--")+" dB<br>";' +
's+="<span class=\\"warn\\">"+(aiMode?T.aiSnrTheory:T.snrTheory)+"</span>  "+theorySnr.toFixed(1)+" dB<br>";' +
's+=""+(aiMode?T.aiMaxErr:T.maxErr)+": "+st.maxErr.toFixed(4)+"<br>";' +
's+="<br>"+T.formula;' +
'if(aiMode){s+="<br><br><span class=\\"hi\\">"+T.aiNote+"</span>"}' +
'box.innerHTML=s}' +

// -- Height notification --
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// -- Init labels --
'document.getElementById("lbl-sim").textContent=T.sim;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-bits").textContent=T.bits;' +
'document.getElementById("lbl-dither").textContent=T.dither;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnRun").textContent=T.run;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("lbl-cv1").textContent=T.cv1;' +
'document.getElementById("lbl-cv2").textContent=T.cv2;' +
'document.getElementById("btnAI").textContent=T.aiOff;' +

// -- Init --
'readParams();drawAll();updateStats();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
