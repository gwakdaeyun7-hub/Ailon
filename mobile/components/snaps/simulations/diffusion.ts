/**
 * Diffusion Process interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - 8x8 pixel grid showing forward noise addition and reverse denoising
 * - Pattern presets: Heart, Star, Smiley, Random
 * - Timeline scrubber: drag through timesteps 0 (clean) to T=20 (pure noise)
 * - Forward / Reverse animation buttons
 * - "Generate New" — start from noise, reverse to create novel pattern
 * - Noise strength (beta_max) slider
 * - Second canvas showing noise delta at current step
 * - Dark/light theme, Korean/English bilingual
 */

export function getDiffusionSimulationHTML(isDark: boolean, lang: string): string {
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
'.timeline-bar{position:relative;height:32px;margin:8px 0;display:flex;align-items:center}' +
'.timeline-track{flex:1;height:6px;background:var(--border);position:relative}' +
'.timeline-fill{height:100%;background:var(--teal);position:absolute;left:0;top:0}' +
'.timeline-labels{display:flex;justify-content:space-between;font-size:9px;color:var(--text3);margin-top:2px}' +
'</style></head><body>' +

// ── Main Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-main"></div>' +
'<canvas id="cvMain" height="180"></canvas>' +
// timeline scrubber
'<div class="row" style="margin-top:8px"><span class="ctrl-name" id="lbl-step"></span>' +
'<input type="range" id="slStep" min="0" max="20" value="0" oninput="onStepSlider()">' +
'<span class="ctrl-val" id="valStep">0</span></div>' +
'<div class="timeline-labels"><span id="lbl-clean"></span><span id="lbl-noise"></span></div>' +
'</div>' +

// ── Noise Delta Canvas ──
'<div class="panel"><div class="label" id="lbl-delta"></div>' +
'<canvas id="cvDelta" height="80"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="preset-row" id="patternRow">' +
'<div class="preset active" id="pre0" onclick="onPattern(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPattern(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPattern(2)"></div>' +
'<div class="preset" id="pre3" onclick="onPattern(3)"></div>' +
'</div>' +
'<div class="row"><span class="ctrl-name" id="lbl-beta"></span>' +
'<input type="range" id="slBeta" min="10" max="50" value="30" oninput="onBetaSlider()">' +
'<span class="ctrl-val" id="valBeta">0.30</span></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnFwd" onclick="animForward()"></div>' +
'<div class="btn" id="btnRev" onclick="animReverse()"></div>' +
'<div class="btn" id="btnGen" onclick="generateNew()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{main:"\\uD655\\uC0B0 \\uACFC\\uC815",delta:"\\uB178\\uC774\\uC988 \\uB378\\uD0C0",' +
'ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'step:"\\uD0C0\\uC784\\uC2A4\\uD15D",clean:"\\uAE68\\uB057\\uD55C \\uC774\\uBBF8\\uC9C0",' +
'noise:"\\uC21C\\uC218 \\uB178\\uC774\\uC988",beta:"\\uB178\\uC774\\uC988 \\uAC15\\uB3C4",' +
'fwd:"\\u25B6 \\uC21C\\uBC29\\uD5A5",rev:"\\u25C0 \\uC5ED\\uBC29\\uD5A5",' +
'gen:"\\uC0DD\\uC131",heart:"\\uD558\\uD2B8",star:"\\uBCC4",' +
'smiley:"\\uC2A4\\uB9C8\\uC77C\\uB9AC",random:"\\uB79C\\uB364",' +
'stepN:"\\uD0C0\\uC784\\uC2A4\\uD15D",noiseAmt:"\\uB178\\uC774\\uC988 \\uB808\\uBCA8",' +
'snr:"\\uC2E0\\uD638 \\uB300 \\uC7A1\\uC74C",betaSched:"\\uBCA0\\uD0C0 \\uC2A4\\uCF00\\uC904",' +
'fwdLabel:"\\uC21C\\uBC29\\uD5A5 (\\uB178\\uC774\\uC988 \\uCD94\\uAC00)",' +
'revLabel:"\\uC5ED\\uBC29\\uD5A5 (\\uB514\\uB178\\uC774\\uC9D5)"},' +
'en:{main:"DIFFUSION PROCESS",delta:"NOISE DELTA",' +
'ctrl:"CONTROLS",stats:"STATISTICS",' +
'step:"Step",clean:"Clean Image",noise:"Pure Noise",' +
'beta:"Noise \\u03B2",fwd:"\\u25B6 Forward",rev:"\\u25C0 Reverse",' +
'gen:"Generate",heart:"Heart",star:"Star",' +
'smiley:"Smiley",random:"Random",' +
'stepN:"Timestep",noiseAmt:"Noise Level",' +
'snr:"Signal / Noise",betaSched:"\\u03B2 Schedule",' +
'fwdLabel:"Forward (Add Noise)",' +
'revLabel:"Reverse (Denoise)"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var GS=8;' + // grid size
'var STEPS=20;' +
'var betaMax=0.30;' +
'var currentStep=0;' +
'var activePattern=0;' +
'var allSteps=[];' + // allSteps[t] = 8x8 float array
'var animTimer=null;' +

// ── Patterns (8x8 binary, 1=filled, 0=empty) ──
'var PATTERNS=[' +
// Heart
'[0,0,0,0,0,0,0,0,' +
' 0,1,1,0,0,1,1,0,' +
' 1,1,1,1,1,1,1,1,' +
' 1,1,1,1,1,1,1,1,' +
' 0,1,1,1,1,1,1,0,' +
' 0,0,1,1,1,1,0,0,' +
' 0,0,0,1,1,0,0,0,' +
' 0,0,0,0,0,0,0,0],' +
// Star
'[0,0,0,1,1,0,0,0,' +
' 0,0,0,1,1,0,0,0,' +
' 0,0,1,1,1,1,0,0,' +
' 1,1,1,1,1,1,1,1,' +
' 1,1,1,1,1,1,1,1,' +
' 0,0,1,1,1,1,0,0,' +
' 0,1,1,0,0,1,1,0,' +
' 1,1,0,0,0,0,1,1],' +
// Smiley
'[0,0,1,1,1,1,0,0,' +
' 0,1,0,0,0,0,1,0,' +
' 1,0,1,0,0,1,0,1,' +
' 1,0,0,0,0,0,0,1,' +
' 1,0,1,0,0,1,0,1,' +
' 1,0,0,1,1,0,0,1,' +
' 0,1,0,0,0,0,1,0,' +
' 0,0,1,1,1,1,0,0],' +
// Random — generated at init
'[]' +
'];' +

// ── Gaussian random (Box-Muller) ──
'function randn(){' +
'var u=1-Math.random(),v=Math.random();' +
'return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v)}' +

// ── Generate random pattern ──
'function genRandomPattern(){' +
'var p=[];for(var i=0;i<GS*GS;i++)p.push(Math.random()>0.5?1:0);return p}' +

// ── Beta schedule: linear from 0.01 to betaMax ──
'function betaAt(t){' +
'if(t<=0)return 0;' +
'return 0.01+(betaMax-0.01)*(t/STEPS)}' +

// ── Compute all forward steps ──
'function computeForward(pattern){' +
'allSteps=[];' +
'var x=[];for(var i=0;i<GS*GS;i++)x.push(pattern[i]||0);' +
'allSteps.push(x.slice());' +
'for(var t=1;t<=STEPS;t++){' +
'var bt=betaAt(t);var sqrtKeep=Math.sqrt(1-bt);var sqrtNoise=Math.sqrt(bt);' +
'var xn=[];' +
'for(var i=0;i<GS*GS;i++){' +
'xn.push(sqrtKeep*x[i]+sqrtNoise*randn())}' +
'x=xn;allSteps.push(x.slice())}}' +

// ── Simplified reverse denoising ──
'function computeReverse(){' +
'var x=allSteps[STEPS].slice();' +
'var revSteps=[x.slice()];' +
'for(var t=STEPS;t>0;t--){' +
'var xn=[];' +
'for(var i=0;i<GS*GS;i++){' +
// average with neighbors + reduce noise
'var sum=x[i];var cnt=1;' +
'var r=Math.floor(i/GS),c=i%GS;' +
'if(r>0){sum+=x[(r-1)*GS+c];cnt++}' +
'if(r<GS-1){sum+=x[(r+1)*GS+c];cnt++}' +
'if(c>0){sum+=x[r*GS+c-1];cnt++}' +
'if(c<GS-1){sum+=x[r*GS+c+1];cnt++}' +
'var avg=sum/cnt;' +
'var noise=randn()*0.05*(t/STEPS);' +
'xn.push(avg*0.85+x[i]*0.15+noise)}' +
'x=xn;revSteps.push(x.slice())}' +
// reverse to go from T→0
'revSteps.reverse();' +
'return revSteps}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw 8x8 grid on canvas ──
'function drawGrid(canvasId,data,canvasH){' +
'var cv=document.getElementById(canvasId);' +
'var dim=setupCanvas(cv,canvasH);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var bgC=cs.getPropertyValue("--bg").trim();' +

'var cellSize=Math.min(Math.floor((w-20)/GS),Math.floor((h-10)/GS));' +
'var gridW=cellSize*GS;var gridH=cellSize*GS;' +
'var offX=Math.floor((w-gridW)/2);' +
'var offY=Math.floor((h-gridH)/2);' +

// draw cells
'for(var r=0;r<GS;r++){' +
'for(var c=0;c<GS;c++){' +
'var val=data[r*GS+c];' +
// clamp to 0-1 for color mapping
'var v=Math.max(0,Math.min(1,val));' +
'var cx=offX+c*cellSize;var cy=offY+r*cellSize;' +
// map value to color (0=bg, 1=teal)
'var r1=parseInt(tealC.substr(1,2),16)||94;' +
'var g1=parseInt(tealC.substr(3,2),16)||234;' +
'var b1=parseInt(tealC.substr(5,2),16)||212;' +
// bg color parse
'var isDk=document.documentElement.classList.contains("dark");' +
'var r0=isDk?26:255;var g0=isDk?24:255;var b0=isDk?22:255;' +
'var rr=Math.round(r0+(r1-r0)*v);' +
'var gg=Math.round(g0+(g1-g0)*v);' +
'var bb=Math.round(b0+(b1-b0)*v);' +
'ctx.fillStyle="rgb("+rr+","+gg+","+bb+")";' +
'ctx.fillRect(cx,cy,cellSize,cellSize);' +
// grid lines
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;' +
'ctx.strokeRect(cx,cy,cellSize,cellSize)}}' +

// outer border
'ctx.strokeStyle=borderC;ctx.lineWidth=2;' +
'ctx.strokeRect(offX,offY,gridW,gridH)}' +

// ── Draw noise delta ──
'function drawDelta(){' +
'if(currentStep<=0||!allSteps[currentStep]||!allSteps[currentStep-1]){' +
'var cv=document.getElementById("cvDelta");' +
'var dim=setupCanvas(cv,80);' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,dim.w,dim.h);' +
'var cs=getComputedStyle(document.documentElement);' +
'ctx.fillStyle=cs.getPropertyValue("--text3").trim();' +
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText("t=0",dim.w/2,dim.h/2+4);return}' +
'var delta=[];' +
'for(var i=0;i<GS*GS;i++){' +
'var d=allSteps[currentStep][i]-allSteps[currentStep-1][i];' +
// normalize delta to 0-1 range for display (center at 0.5)
'delta.push(Math.max(0,Math.min(1,d*2+0.5)))}' +
'drawGrid("cvDelta",delta,80)}' +

// ── Draw main ──
'function drawMain(){' +
'if(!allSteps[currentStep])return;' +
'drawGrid("cvMain",allSteps[currentStep],180);' +
'drawDelta();updateStats()}' +

// ── Step slider ──
'function onStepSlider(){' +
'currentStep=+document.getElementById("slStep").value;' +
'document.getElementById("valStep").textContent=currentStep;' +
'drawMain();notifyHeight()}' +

// ── Beta slider ──
'function onBetaSlider(){' +
'betaMax=+document.getElementById("slBeta").value/100;' +
'document.getElementById("valBeta").textContent=betaMax.toFixed(2);' +
// recompute forward from pattern
'var pat=activePattern===3?PATTERNS[3]:PATTERNS[activePattern];' +
'computeForward(pat);' +
'drawMain();notifyHeight()}' +

// ── Pattern selection ──
'function onPattern(idx){' +
'stopAnim();activePattern=idx;' +
'if(idx===3)PATTERNS[3]=genRandomPattern();' +
'for(var i=0;i<4;i++){document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
'currentStep=0;document.getElementById("slStep").value=0;document.getElementById("valStep").textContent="0";' +
'computeForward(PATTERNS[idx]);drawMain();notifyHeight()}' +

// ── Stop animation ──
'function stopAnim(){' +
'if(animTimer){clearInterval(animTimer);animTimer=null}' +
'document.getElementById("btnFwd").textContent=T.fwd;' +
'document.getElementById("btnFwd").className="btn btn-primary";' +
'document.getElementById("btnRev").textContent=T.rev;' +
'document.getElementById("btnRev").className="btn"}' +

// ── Forward animation ──
'function animForward(){' +
'stopAnim();currentStep=0;' +
'document.getElementById("slStep").value=0;' +
'document.getElementById("btnFwd").textContent="\\u25A0";' +
'document.getElementById("btnFwd").className="btn btn-stop";' +
'animTimer=setInterval(function(){' +
'currentStep++;' +
'if(currentStep>STEPS){stopAnim();currentStep=STEPS;drawMain();return}' +
'document.getElementById("slStep").value=currentStep;' +
'document.getElementById("valStep").textContent=currentStep;' +
'drawMain()},200)}' +

// ── Reverse animation ──
'function animReverse(){' +
'stopAnim();' +
// compute reverse from current noisy state
'var revSteps=computeReverse();' +
'allSteps=revSteps;' +
'currentStep=STEPS;' +
'document.getElementById("btnRev").textContent="\\u25A0";' +
'document.getElementById("btnRev").className="btn btn-stop";' +
'animTimer=setInterval(function(){' +
'currentStep--;' +
'if(currentStep<0){stopAnim();currentStep=0;drawMain();return}' +
'document.getElementById("slStep").value=currentStep;' +
'document.getElementById("valStep").textContent=currentStep;' +
'drawMain()},200)}' +

// ── Generate from pure noise ──
'function generateNew(){' +
'stopAnim();' +
// start from pure noise
'var noise=[];for(var i=0;i<GS*GS;i++)noise.push(randn()*0.5+0.5);' +
'allSteps=[];allSteps.push(noise.slice());' +
'for(var t=1;t<=STEPS;t++)allSteps.push(noise.slice());' +
// use allSteps[STEPS] as starting noise
'allSteps[STEPS]=noise;' +
'var revSteps=computeReverse();' +
'allSteps=revSteps;' +
'currentStep=STEPS;' +
'document.getElementById("slStep").value=STEPS;' +
'document.getElementById("valStep").textContent=STEPS;' +
'document.getElementById("btnRev").textContent="\\u25A0";' +
'document.getElementById("btnRev").className="btn btn-stop";' +
'animTimer=setInterval(function(){' +
'currentStep--;' +
'if(currentStep<0){stopAnim();currentStep=0;drawMain();return}' +
'document.getElementById("slStep").value=currentStep;' +
'document.getElementById("valStep").textContent=currentStep;' +
'drawMain()},200)}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(!allSteps[currentStep]){box.innerHTML="";return}' +
'var data=allSteps[currentStep];' +
// compute signal magnitude and noise level
'var mean=0;for(var i=0;i<GS*GS;i++)mean+=data[i];mean/=(GS*GS);' +
'var variance=0;for(var i=0;i<GS*GS;i++){var d=data[i]-mean;variance+=d*d}variance/=(GS*GS);' +
'var bt=betaAt(currentStep);' +
'var s="<span class=\\"hi\\">"+T.stepN+"</span> "+currentStep+" / "+STEPS+"<br>";' +
's+=T.betaSched+": \\u03B2=<span class=\\"warn\\">"+bt.toFixed(4)+"</span><br>";' +
's+=T.noiseAmt+": <span class=\\"hi\\">"+(Math.sqrt(variance)).toFixed(3)+"</span><br>";' +
'if(currentStep===0){s+="<br><span class=\\"hi\\">"+T.fwdLabel+"</span>"}' +
'else if(currentStep===STEPS){s+="<br><span class=\\"warn\\">"+T.revLabel+"</span>"}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-main").textContent=T.main;' +
'document.getElementById("lbl-delta").textContent=T.delta;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-step").textContent=T.step;' +
'document.getElementById("lbl-clean").textContent=T.clean;' +
'document.getElementById("lbl-noise").textContent=T.noise;' +
'document.getElementById("lbl-beta").textContent=T.beta;' +
'document.getElementById("btnFwd").textContent=T.fwd;' +
'document.getElementById("btnRev").textContent=T.rev;' +
'document.getElementById("btnGen").textContent=T.gen;' +
'document.getElementById("pre0").textContent=T.heart;' +
'document.getElementById("pre1").textContent=T.star;' +
'document.getElementById("pre2").textContent=T.smiley;' +
'document.getElementById("pre3").textContent=T.random;' +

// ── Init ──
'PATTERNS[3]=genRandomPattern();' +
'computeForward(PATTERNS[0]);' +
'drawMain();' +
'window.addEventListener("resize",function(){drawMain();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
