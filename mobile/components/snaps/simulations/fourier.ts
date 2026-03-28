/**
 * Fourier Transform interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Waveform decomposition with adjustable harmonic count (1-30)
 * - Original vs reconstructed signal overlay
 * - Frequency spectrum bar chart with tap-to-highlight
 * - Preset signals: Sine, Square, Triangle, Sawtooth
 * - Draw mode: freehand custom waveform
 * - "AI Feature Mode" toggle: relabels as CNN filters / feature maps
 * - MSE error display
 * - Dark/light theme, Korean/English bilingual
 */

export function getFourierSimulationHTML(isDark: boolean, lang: string): string {
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
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;min-height:44px;border-radius:8px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.legend-row{display:flex;gap:12px;margin-top:6px;flex-wrap:wrap}' +
'.legend-item{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--text2)}' +
'.legend-dot{width:8px;height:8px;flex-shrink:0}' +
'.draw-hint{font-size:10px;color:var(--accent);margin-top:4px;text-align:center;display:none}' +
'</style></head><body>' +

// -- Waveform Canvas Panel --
'<div class="panel"><div class="label" id="lbl-wave"></div>' +
'<canvas id="cvWave" height="160"></canvas>' +
'<div class="legend-row">' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--text3)"></div><span id="leg-orig"></span></div>' +
'<div class="legend-item"><div class="legend-dot" style="background:var(--teal)"></div><span id="leg-recon"></span></div>' +
'</div>' +
'<div class="draw-hint" id="drawHint"></div>' +
'</div>' +

// -- Spectrum Canvas Panel --
'<div class="panel"><div class="label" id="lbl-spec"></div>' +
'<canvas id="cvSpec" height="120"></canvas></div>' +

// -- Controls Panel --
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'<div class="preset" id="pre3" onclick="onPreset(3)"></div>' +
'<div class="preset" id="pre4" onclick="onPreset(4)"></div>' +
'</div>' +
'<div class="row"><span class="ctrl-name" id="cn-harm"></span>' +
'<input type="range" id="slN" min="1" max="30" value="5" oninput="onSlider()">' +
'<span class="ctrl-val" id="valN"></span></div>' +
'<div class="btn-row">' +
'<div class="btn" id="btnAI" onclick="toggleAI()"></div>' +
'</div>' +
'</div>' +

// -- Stats Panel --
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// -- Labels --
'var L={' +
'ko:{wave:"\\uD30C\\uD615",spec:"\\uC8FC\\uD30C\\uC218 \\uC131\\uBD84",ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",' +
'stats:"\\uD1B5\\uACC4",origSig:"\\uC6D0\\uBCF8 \\uC2E0\\uD638",reconSig:"\\uBCF5\\uC6D0 \\uC2E0\\uD638",' +
'harm:"\\uACE0\\uC870\\uD30C \\uC218(N)",error:"\\uC624\\uCC28(MSE)",' +
'sine:"\\uC0AC\\uC778",square:"\\uC0AC\\uAC01\\uD30C",triangle:"\\uC0BC\\uAC01\\uD30C",sawtooth:"\\uD1B1\\uB2C8\\uD30C",draw:"\\uADF8\\uB9AC\\uAE30",' +
'nHarm:"\\uACE0\\uC870\\uD30C",drawHint:"\\uCE94\\uBC84\\uC2A4 \\uC704\\uB97C \\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uC0AC\\uC6A9\\uC790 \\uD30C\\uD615\\uC744 \\uADF8\\uB9AC\\uC138\\uC694",' +
'energy:"\\uC5D0\\uB108\\uC9C0",tapBar:"\\uB9C9\\uB300\\uB97C \\uD0ED\\uD558\\uC5EC \\uAC1C\\uBCC4 \\uC131\\uBD84 \\uD655\\uC778",' +
'highlighted:"\\uAC15\\uC870 \\uC131\\uBD84",' +
'aiOn:"AI \\uD2B9\\uC9D5 \\uBAA8\\uB4DC ON",aiOff:"AI \\uD2B9\\uC9D5 \\uBAA8\\uB4DC OFF",' +
'aiSpec:"\\uD2B9\\uC9D5 \\uB9F5",aiOrigSig:"\\uC785\\uB825 \\uB370\\uC774\\uD130",aiReconSig:"\\uD2B9\\uC9D5\\uC73C\\uB85C \\uBCF5\\uC6D0",' +
'aiHarm:"\\uD544\\uD130 \\uC218(N)",aiNHarm:"\\uD544\\uD130",' +
'aiNote:"AI \\uAD00\\uC810: Fourier \\uBD84\\uD574 = CNN\\uC758 \\uD2B9\\uC9D5 \\uCD94\\uCD9C. \\uAC01 \\uC8FC\\uD30C\\uC218 \\uC131\\uBD84 = \\uD559\\uC2B5\\uB41C \\uD544\\uD130\\uC758 \\uC751\\uB2F5"},' +
'en:{wave:"WAVEFORM",spec:"FREQUENCY SPECTRUM",ctrl:"PARAMETERS",' +
'stats:"STATISTICS",origSig:"Original Signal",reconSig:"Reconstructed",' +
'harm:"Harmonics(N)",error:"Error(MSE)",' +
'sine:"Sine",square:"Square",triangle:"Triangle",sawtooth:"Sawtooth",draw:"Draw",' +
'nHarm:"Harmonics",drawHint:"Drag on canvas above to draw custom waveform",' +
'energy:"Energy",tapBar:"Tap a bar to highlight that component",' +
'highlighted:"Highlighted",' +
'aiOn:"AI FEATURE MODE ON",aiOff:"AI FEATURE MODE OFF",' +
'aiSpec:"Feature Map",aiOrigSig:"Input Data",aiReconSig:"Reconstructed from Features",' +
'aiHarm:"Filters(N)",aiNHarm:"Filters",' +
'aiNote:"AI perspective: Fourier decomposition = CNN feature extraction. Each frequency = learned filter response"}' +
'};' +
'var T=L[LANG]||L.en;' +

// -- State --
'var N_SAMPLES=256;' +
'var signal=new Array(N_SAMPLES);' +
'var nHarm=5;' +
'var activePreset=0;' +
'var drawMode=false;' +
'var isDrawing=false;' +
'var highlightK=-1;' + // tapped bar index (-1=none)
'var aiMode=false;' +
// DFT result
'var freqRe=[];var freqIm=[];var freqMag=[];' +

// -- Canvas DPR setup --
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// -- Signal generators --
'function genSine(){for(var i=0;i<N_SAMPLES;i++)signal[i]=Math.sin(2*Math.PI*i/N_SAMPLES)}' +
'function genSquare(){for(var i=0;i<N_SAMPLES;i++)signal[i]=i<N_SAMPLES/2?1:-1}' +
'function genTriangle(){for(var i=0;i<N_SAMPLES;i++){var t=i/N_SAMPLES;signal[i]=t<0.5?4*t-1:-4*t+3}}' +
'function genSawtooth(){for(var i=0;i<N_SAMPLES;i++){signal[i]=2*i/N_SAMPLES-1}}' +

// -- DFT --
'function computeDFT(){' +
'freqRe=[];freqIm=[];freqMag=[];' +
'var N=N_SAMPLES;' +
'for(var k=0;k<N;k++){var re=0,im=0;' +
'for(var n=0;n<N;n++){var angle=2*Math.PI*k*n/N;re+=signal[n]*Math.cos(angle);im-=signal[n]*Math.sin(angle)}' +
're/=N;im/=N;freqRe.push(re);freqIm.push(im);freqMag.push(Math.sqrt(re*re+im*im))}}' +

// -- Reconstruct with first nHarm harmonics --
'function reconstruct(){' +
'var recon=new Array(N_SAMPLES);' +
'var N=N_SAMPLES;' +
'for(var n=0;n<N;n++){var val=freqRe[0];' + // DC component
'for(var k=1;k<=nHarm&&k<N/2;k++){var angle=2*Math.PI*k*n/N;' +
'val+=2*(freqRe[k]*Math.cos(angle)-freqIm[k]*Math.sin(angle))}' +
'recon[n]=val}return recon}' +

// -- Reconstruct single harmonic --
'function reconSingleK(kk){' +
'var recon=new Array(N_SAMPLES);' +
'var N=N_SAMPLES;' +
'for(var n=0;n<N;n++){var angle=2*Math.PI*kk*n/N;' +
'var val=kk===0?freqRe[0]:2*(freqRe[kk]*Math.cos(angle)-freqIm[kk]*Math.sin(angle));' +
'recon[n]=val}return recon}' +

// -- MSE --
'function calcMSE(recon){var s=0;for(var i=0;i<N_SAMPLES;i++){var d=signal[i]-recon[i];s+=d*d}return s/N_SAMPLES}' +

// -- Draw waveform canvas --
'function drawWave(){' +
'var cv=document.getElementById("cvWave");' +
'var dim=setupCanvas(cv,160);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accC=cs.getPropertyValue("--accent").trim();' +
'var pad=8,pr=8,pt=10,pb=10;' +
'var pw=w-pad-pr,ph=h-pt-pb;' +
'var midY=pt+ph/2;' +
// zero line
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.setLineDash([3,3]);' +
'ctx.beginPath();ctx.moveTo(pad,midY);ctx.lineTo(w-pr,midY);ctx.stroke();ctx.setLineDash([]);' +
// find y range
'var maxAbs=0.01;for(var i=0;i<N_SAMPLES;i++){var a=Math.abs(signal[i]);if(a>maxAbs)maxAbs=a}' +
'var recon=reconstruct();' +
'for(var i=0;i<N_SAMPLES;i++){var a=Math.abs(recon[i]);if(a>maxAbs)maxAbs=a}' +
'maxAbs*=1.1;' +
'function toX(i){return pad+i/(N_SAMPLES-1)*pw}' +
'function toY(v){return midY-v/maxAbs*(ph/2)}' +
// original signal (gray)
'ctx.strokeStyle=textC;ctx.lineWidth=1.5;ctx.beginPath();' +
'for(var i=0;i<N_SAMPLES;i++){var px=toX(i),py=toY(signal[i]);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
// reconstructed (teal)
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<N_SAMPLES;i++){var px=toX(i),py=toY(recon[i]);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
// highlighted harmonic (accent, if any)
'if(highlightK>=0&&highlightK<N_SAMPLES/2){' +
'var hRecon=reconSingleK(highlightK);' +
'ctx.strokeStyle=accC;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);ctx.beginPath();' +
'for(var i=0;i<N_SAMPLES;i++){var px=toX(i),py=toY(hRecon[i]);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();ctx.setLineDash([])}' +
'}' +

// -- Draw spectrum --
'function drawSpectrum(){' +
'var cv=document.getElementById("cvSpec");' +
'var dim=setupCanvas(cv,120);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accC=cs.getPropertyValue("--accent").trim();' +
'var pad=32,pr=8,pt=10,pb=20;' +
'var pw=w-pad-pr,ph=h-pt-pb;' +
'var maxBars=Math.min(30,Math.floor(N_SAMPLES/2));' +
// find max magnitude (skip DC)
'var maxMag=0.01;for(var k=1;k<=maxBars;k++){if(freqMag[k]>maxMag)maxMag=freqMag[k]}' +
'maxMag*=1.15;' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.beginPath();' +
'ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(maxMag.toFixed(2),pad-4,pt+8);' +
// bars
'var barW=Math.max(2,pw/maxBars-2);' +
'for(var k=1;k<=maxBars;k++){' +
'var bx=pad+(k-1)/maxBars*pw+1;' +
'var bh=freqMag[k]/maxMag*ph;' +
'var isActive=k<=nHarm;' +
'var isHighlight=k===highlightK;' +
'if(isHighlight){ctx.fillStyle=accC;ctx.globalAlpha=1}' +
'else if(isActive){var intensity=0.3+0.7*freqMag[k]/maxMag;ctx.fillStyle=tealC;ctx.globalAlpha=intensity}' +
'else{ctx.fillStyle=borderC;ctx.globalAlpha=0.5}' +
'ctx.fillRect(bx,h-pb-bh,barW,bh);ctx.globalAlpha=1;' +
// active cutoff line
'if(k===nHarm&&nHarm<maxBars){ctx.strokeStyle=accC;ctx.lineWidth=1;ctx.setLineDash([3,3]);' +
'var lx=bx+barW+1;ctx.beginPath();ctx.moveTo(lx,pt);ctx.lineTo(lx,h-pb);ctx.stroke();ctx.setLineDash([])}' +
'}' +
// x labels
'ctx.fillStyle=textC;ctx.font="8px monospace";ctx.textAlign="center";' +
'for(var k=1;k<=maxBars;k+=Math.max(1,Math.floor(maxBars/10))){' +
'var bx=pad+(k-1)/maxBars*pw+1+barW/2;' +
'var xLbl=aiMode?("F"+k):(""+k);' +
'ctx.fillText(xLbl,bx,h-pb+12)}' +
// N label
'ctx.fillText((aiMode?"N=":"N=")+nHarm,pad+pw/2,pt+10);' +
'}' +

// -- Spectrum tap handler --
'var _lastSpecTap=0;' +
'function onSpecTap(e){' +
'var now=Date.now();if(now-_lastSpecTap<300)return;_lastSpecTap=now;' +
'if(e.touches)e.preventDefault();' +
'var cv=document.getElementById("cvSpec");var rect=cv.getBoundingClientRect();' +
'var x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;' +
'var pad=32,pr=8;var pw=rect.width-pad-pr;' +
'var maxBars=Math.min(30,Math.floor(N_SAMPLES/2));' +
'var k=Math.round((x-pad)/pw*maxBars)+1;' +
'if(k>=1&&k<=maxBars){highlightK=highlightK===k?-1:k;drawWave();drawSpectrum();updateStats()}}' +

// -- Draw mode touch handlers --
'function onDrawStart(e){' +
'if(!drawMode)return;e.preventDefault();isDrawing=true;' +
'for(var i=0;i<N_SAMPLES;i++)signal[i]=0;onDrawMove(e)}' +

'function onDrawMove(e){' +
'if(!isDrawing||!drawMode)return;e.preventDefault();' +
'var cv=document.getElementById("cvWave");var rect=cv.getBoundingClientRect();' +
'var x=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;' +
'var y=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;' +
'var pad=8,pr=8,pt=10,pb=10;' +
'var pw=rect.width-pad-pr,ph=rect.height-pt-pb;' +
'var idx=Math.round((x-pad)/pw*(N_SAMPLES-1));' +
'var val=-((y-pt)/ph*2-1);' +
'if(idx>=0&&idx<N_SAMPLES){signal[idx]=Math.max(-1,Math.min(1,val));' +
// interpolate gaps
'if(idx>0&&signal[idx-1]===0){signal[idx-1]=(signal[idx]+signal[Math.max(0,idx-2)])/2}' +
'}computeDFT();drawWave();drawSpectrum();updateStats()}' +

'function onDrawEnd(){isDrawing=false}' +

// -- Preset --
'function onPreset(idx){' +
'activePreset=idx;drawMode=(idx===4);highlightK=-1;' +
'document.getElementById("drawHint").style.display=drawMode?"block":"none";' +
'for(var i=0;i<5;i++){document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
'if(idx===0)genSine();' +
'else if(idx===1)genSquare();' +
'else if(idx===2)genTriangle();' +
'else if(idx===3)genSawtooth();' +
'else{for(var i=0;i<N_SAMPLES;i++)signal[i]=0}' +
'computeDFT();drawWave();drawSpectrum();updateStats();notifyHeight()}' +

// -- Slider --
'function onSlider(){' +
'nHarm=+document.getElementById("slN").value;' +
'document.getElementById("valN").textContent="N="+nHarm;' +
'highlightK=-1;drawWave();drawSpectrum();updateStats()}' +

// -- AI Mode toggle --
'function toggleAI(){' +
'aiMode=!aiMode;' +
'document.getElementById("btnAI").textContent=aiMode?T.aiOn:T.aiOff;' +
'document.getElementById("lbl-spec").textContent=aiMode?T.aiSpec:T.spec;' +
'document.getElementById("cn-harm").textContent=aiMode?T.aiHarm:T.harm;' +
'document.getElementById("leg-orig").textContent=aiMode?T.aiOrigSig:T.origSig;' +
'document.getElementById("leg-recon").textContent=aiMode?T.aiReconSig:T.reconSig;' +
'drawWave();drawSpectrum();updateStats();notifyHeight()}' +

// -- Stats --
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var recon=reconstruct();var mse=calcMSE(recon);' +
'var totalE=0;for(var k=0;k<N_SAMPLES;k++)totalE+=freqMag[k]*freqMag[k];' +
'var partE=freqMag[0]*freqMag[0];for(var k=1;k<=nHarm&&k<N_SAMPLES/2;k++)partE+=2*freqMag[k]*freqMag[k];' +
'var pct=totalE>0?(partE/totalE*100).toFixed(1):"100.0";' +
'var s="<span class=\\"hi\\">"+(aiMode?T.aiNHarm:T.nHarm)+"</span> "+nHarm+" / 30<br>";' +
's+=T.error+": <span class=\\"warn\\">"+mse.toFixed(6)+"</span><br>";' +
's+=T.energy+": <span class=\\"hi\\">"+pct+"%</span><br>";' +
'if(highlightK>0){s+=T.highlighted+": <span class=\\"warn\\">k="+highlightK+" (|X|="+freqMag[highlightK].toFixed(4)+")</span><br>"}' +
's+="<br><span class=\\"warn\\">"+T.tapBar+"</span>";' +
'if(aiMode){s+="<br><br><span class=\\"hi\\">"+T.aiNote+"</span>"}' +
'box.innerHTML=s}' +

// -- Height notification --
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// -- Init labels --
'document.getElementById("lbl-wave").textContent=T.wave;' +
'document.getElementById("lbl-spec").textContent=T.spec;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("cn-harm").textContent=T.harm;' +
'document.getElementById("pre0").textContent=T.sine;' +
'document.getElementById("pre1").textContent=T.square;' +
'document.getElementById("pre2").textContent=T.triangle;' +
'document.getElementById("pre3").textContent=T.sawtooth;' +
'document.getElementById("pre4").textContent=T.draw;' +
'document.getElementById("leg-orig").textContent=T.origSig;' +
'document.getElementById("leg-recon").textContent=T.reconSig;' +
'document.getElementById("drawHint").textContent=T.drawHint;' +
'document.getElementById("btnAI").textContent=T.aiOff;' +

// -- Init --
'document.getElementById("valN").textContent="N="+nHarm;' +
'genSine();computeDFT();drawWave();drawSpectrum();updateStats();' +
// event listeners
'var cvW=document.getElementById("cvWave");' +
'cvW.addEventListener("touchstart",onDrawStart,{passive:false});' +
'cvW.addEventListener("touchmove",onDrawMove,{passive:false});' +
'cvW.addEventListener("touchend",onDrawEnd);' +
'cvW.addEventListener("mousedown",onDrawStart);' +
'cvW.addEventListener("mousemove",onDrawMove);' +
'cvW.addEventListener("mouseup",onDrawEnd);' +
'var cvS=document.getElementById("cvSpec");' +
'cvS.addEventListener("touchstart",onSpecTap);' +
'cvS.addEventListener("click",onSpecTap);' +
'window.addEventListener("resize",function(){drawWave();drawSpectrum();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
